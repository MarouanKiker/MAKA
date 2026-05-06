package com.maka.stock.repository;

import com.maka.stock.model.MouvementStock;
import com.maka.stock.model.MouvementStockLine;
import com.maka.stock.repository.mapper.MouvementStockRowMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

/**
 * Repository JDBC pour les mouvements de stock (v2 — architecture multi-lignes).
 *
 * Structure : 1 MouvementStock (header) → N MouvementStockLine (produits)
 * Remplace le couplage 1 mouvement = 1 article de la v1.
 */
@Repository
@RequiredArgsConstructor
public class MouvementStockRepository {

    private final JdbcTemplate jdbc;
    private final MouvementStockRowMapper rowMapper;

    private final RowMapper<MouvementStockLine> lineMapper = (rs, n) -> MouvementStockLine.builder()
            .id(rs.getLong("id"))
            .mouvementId(rs.getLong("mouvement_id"))
            .articleId(rs.getLong("article_id"))
            .quantite(rs.getInt("quantite"))
            .articleReference(rs.getString("reference"))
            .articleDesignation(rs.getString("designation"))
            .articleUnite(rs.getString("unite"))
            .build();

    // ── Lister tous les mouvements (paginé) ───────────────────────────────────
    public List<MouvementStock> findAll(int page, int size) {
        String sql = "SELECT * FROM mouvement_stock ORDER BY date_mouvement DESC LIMIT ? OFFSET ?";
        return jdbc.query(sql, rowMapper, size, (page - 1) * size);
    }

    public int countAll() {
        return Objects.requireNonNull(jdbc.queryForObject("SELECT COUNT(*) FROM mouvement_stock", Integer.class));
    }

    // ── Lister par article (Historique pour 1 article) ────────────────────────
    public List<MouvementStock> findByArticleId(Long articleId, int page, int size) {
        String sql = """
            SELECT DISTINCT ms.*
            FROM mouvement_stock ms
            JOIN mouvement_stock_line msl ON ms.id = msl.mouvement_id
            WHERE msl.article_id = ?
            ORDER BY ms.date_mouvement DESC
            LIMIT ? OFFSET ?
            """;
        return jdbc.query(sql, rowMapper, articleId, size, (page - 1) * size);
    }

    // ── Lister par source (ex: tous les mouvements liés à une vente) ──────────
    public List<MouvementStock> findBySource(String sourceType, Long sourceId) {
        String sql = "SELECT * FROM mouvement_stock WHERE source_type=? AND source_id=? ORDER BY date_mouvement DESC";
        return jdbc.query(sql, rowMapper, sourceType, sourceId);
    }

    // ── Trouver par ID ─────────────────────────────────────────────────────────
    public Optional<MouvementStock> findById(Long id) {
        List<MouvementStock> r = jdbc.query("SELECT * FROM mouvement_stock WHERE id = ?", rowMapper, id);
        return r.isEmpty() ? Optional.empty() : Optional.of(r.get(0));
    }

    // ── Créer un mouvement header ─────────────────────────────────────────────
    public MouvementStock save(MouvementStock mvt) {
        String sql = """
            INSERT INTO mouvement_stock
              (type_mvt, source_type, source_id, statut,
               depot_source_id, depot_destination_id, utilisateur_id, motif)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """;
        KeyHolder kh = new GeneratedKeyHolder();
        jdbc.update(con -> {
            PreparedStatement ps = con.prepareStatement(sql, new String[]{"id"});
            ps.setString(1, mvt.getTypeMvt());
            ps.setString(2, mvt.getSourceType());
            ps.setObject(3, mvt.getSourceId());
            ps.setString(4, mvt.getStatut() != null ? mvt.getStatut() : "BROUILLON");
            ps.setObject(5, mvt.getDepotSourceId());
            ps.setObject(6, mvt.getDepotDestinationId());
            ps.setLong(7, mvt.getUtilisateurId());
            ps.setString(8, mvt.getMotif());
            return ps;
        }, kh);
        long newId = Objects.requireNonNull(kh.getKey()).longValue();
        return findById(newId).orElseThrow();
    }

    // ── Valider un mouvement (BROUILLON → VALIDE) ─────────────────────────────
    public void valider(Long mouvementId) {
        jdbc.update("UPDATE mouvement_stock SET statut = 'VALIDE' WHERE id = ?", mouvementId);
    }

    // ── Annuler un mouvement ───────────────────────────────────────────────────
    public void annuler(Long mouvementId) {
        jdbc.update("UPDATE mouvement_stock SET statut = 'ANNULE' WHERE id = ?", mouvementId);
    }

    // ── Ajouter une ligne à un mouvement ─────────────────────────────────────
    public MouvementStockLine addLine(Long mouvementId, Long articleId, int quantite) {
        String sql = "INSERT INTO mouvement_stock_line (mouvement_id, article_id, quantite) VALUES (?, ?, ?)";
        KeyHolder kh = new GeneratedKeyHolder();
        jdbc.update(con -> {
            PreparedStatement ps = con.prepareStatement(sql, new String[]{"id"});
            ps.setLong(1, mouvementId);
            ps.setLong(2, articleId);
            ps.setInt(3, quantite);
            return ps;
        }, kh);
        long lineId = Objects.requireNonNull(kh.getKey()).longValue();
        return findLineById(lineId).orElseThrow();
    }

    // ── Lire les lignes enrichies d'un mouvement ──────────────────────────────
    public List<MouvementStockLine> findLines(Long mouvementId) {
        String sql = """
            SELECT msl.*, a.reference, a.designation, a.unite
            FROM mouvement_stock_line msl
            JOIN article a ON a.id = msl.article_id
            WHERE msl.mouvement_id = ?
            ORDER BY msl.id
            """;
        return jdbc.query(sql, lineMapper, mouvementId);
    }

    public Optional<MouvementStockLine> findLineById(Long id) {
        String sql = """
            SELECT msl.*, a.reference, a.designation, a.unite
            FROM mouvement_stock_line msl
            JOIN article a ON a.id = msl.article_id
            WHERE msl.id = ?
            """;
        List<MouvementStockLine> r = jdbc.query(sql, lineMapper, id);
        return r.isEmpty() ? Optional.empty() : Optional.of(r.get(0));
    }

    // ── Créer un mouvement d'ajustement depuis l'inventaire ───────────────────
    // Méthode utilitaire appelée par InventaireService.valider()
    public Long createAjustement(String typeMvt, Long depotId, Long userId,
                                 Long inventaireId, int quantite, Long articleId) {
        MouvementStock mvt = MouvementStock.builder()
                .typeMvt(typeMvt)
                .sourceType("INVENTAIRE")
                .sourceId(inventaireId)
                .statut("VALIDE")
                .depotSourceId("SORTIE".equals(typeMvt) ? depotId : null)
                .depotDestinationId("ENTREE".equals(typeMvt) ? depotId : null)
                .utilisateurId(userId)
                .motif("Ajustement inventaire #" + inventaireId)
                .build();
        MouvementStock saved = save(mvt);
        addLine(saved.getId(), articleId, quantite);
        return saved.getId();
    }
}

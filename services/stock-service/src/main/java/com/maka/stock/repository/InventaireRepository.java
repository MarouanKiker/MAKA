package com.maka.stock.repository;

import com.maka.stock.model.Inventaire;
import com.maka.stock.model.InventaireLine;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

/**
 * Repository JDBC pour la gestion des inventaires physiques.
 * Supports :
 *   - Démarrer un inventaire pour un dépôt (pré-rempli avec les quantités système)
 *   - Saisir les quantités réelles
 *   - Valider l'inventaire (crée des mouvements d'ajustement automatiquement)
 */
@Repository
@RequiredArgsConstructor
public class InventaireRepository {

    private final JdbcTemplate jdbc;

    private final RowMapper<Inventaire> inventaireMapper = (rs, n) -> {
        Timestamp ts = rs.getTimestamp("date_inv");
        return Inventaire.builder()
                .id(rs.getLong("id"))
                .depotId(rs.getLong("depot_id"))
                .statut(rs.getString("statut"))
                .dateInv(ts != null ? ts.toLocalDateTime() : null)
                .createdBy(rs.getLong("created_by"))
                .build();
    };

    private final RowMapper<InventaireLine> lineMapper = (rs, n) -> InventaireLine.builder()
            .id(rs.getLong("id"))
            .inventaireId(rs.getLong("inventaire_id"))
            .articleId(rs.getLong("article_id"))
            .quantiteSysteme(rs.getInt("quantite_systeme"))
            .quantiteReelle(rs.getInt("quantite_reelle"))
            .ecart(rs.getInt("ecart"))
            .articleReference(rs.getString("reference"))
            .articleDesignation(rs.getString("designation"))
            .articleUnite(rs.getString("unite"))
            .build();

    // ── Créer un inventaire ───────────────────────────────────────────────────
    public Inventaire create(Long depotId, Long userId) {
        String sql = "INSERT INTO inventaire (depot_id, statut, date_inv, created_by) VALUES (?, 'EN_COURS', ?, ?)";
        KeyHolder kh = new GeneratedKeyHolder();
        jdbc.update(con -> {
            PreparedStatement ps = con.prepareStatement(sql, new String[]{"id"});
            ps.setLong(1, depotId);
            ps.setTimestamp(2, Timestamp.valueOf(LocalDateTime.now()));
            ps.setLong(3, userId);
            return ps;
        }, kh);
        long id = Objects.requireNonNull(kh.getKey()).longValue();

        // Pré-remplir les lignes avec les quantités système actuelles du dépôt
        initLines(id, depotId);
        return findById(id).orElseThrow();
    }

    /**
     * Initialise les lignes d'inventaire avec le stock système actuel du dépôt.
     * Cette snapshot garantit que le comparatif est figé au moment du démarrage.
     */
    private void initLines(Long inventaireId, Long depotId) {
        String sql = """
            INSERT INTO inventaire_line (inventaire_id, article_id, quantite_systeme, quantite_reelle)
            SELECT ?, asd.article_id, asd.quantite, asd.quantite
            FROM article_stock_depot asd
            WHERE asd.depot_id = ?
            """;
        jdbc.update(sql, inventaireId, depotId);
    }

    public Optional<Inventaire> findById(Long id) {
        List<Inventaire> r = jdbc.query("SELECT * FROM inventaire WHERE id = ?", inventaireMapper, id);
        return r.isEmpty() ? Optional.empty() : Optional.of(r.get(0));
    }

    public List<Inventaire> findAll() {
        return jdbc.query("SELECT * FROM inventaire ORDER BY date_inv DESC", inventaireMapper);
    }

    // ── Lire les lignes enrichies (avec info article) ─────────────────────────
    public List<InventaireLine> findLines(Long inventaireId) {
        String sql = """
            SELECT il.*, a.reference, a.designation, a.unite
            FROM inventaire_line il
            JOIN article a ON a.id = il.article_id
            WHERE il.inventaire_id = ?
            ORDER BY a.designation
            """;
        return jdbc.query(sql, lineMapper, inventaireId);
    }

    // ── Mettre à jour la quantité réelle saisie ───────────────────────────────
    public void updateQuantiteReelle(Long lineId, int quantiteReelle) {
        jdbc.update("UPDATE inventaire_line SET quantite_reelle = ? WHERE id = ?",
                quantiteReelle, lineId);
    }

    // ── Changer le statut global ───────────────────────────────────────────────
    public void updateStatut(Long inventaireId, String statut) {
        jdbc.update("UPDATE inventaire SET statut = ? WHERE id = ?", statut, inventaireId);
    }

    // ── Lire les lignes avec écart non nul (pour ajustements) ─────────────────
    public List<InventaireLine> findLinesWithEcart(Long inventaireId) {
        String sql = """
            SELECT il.*, a.reference, a.designation, a.unite
            FROM inventaire_line il
            JOIN article a ON a.id = il.article_id
            WHERE il.inventaire_id = ? AND il.ecart <> 0
            """;
        return jdbc.query(sql, lineMapper, inventaireId);
    }
}

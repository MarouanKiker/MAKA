package com.maka.stock.repository;

import com.maka.stock.model.Article;
import com.maka.stock.repository.mapper.ArticleRowMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

/**
 * Repository JDBC pour l'entité Article (v2).
 * - stock_total_global supprimé : le stock réel est calculé via SUM sur article_stock_depot.
 * - Ajout du champ unite.
 * - Méthode getStockTotal() pour le calcul dynamique.
 * - Méthode findAlertes() basée sur le stock calculé (pas une colonne dénormalisée).
 */
@Repository
@RequiredArgsConstructor
public class ArticleRepository {

    private final JdbcTemplate jdbc;
    private final ArticleRowMapper rowMapper;

    // ── SELECT paginé avec recherche ─────────────────────────────────────────
    public List<Article> findAll(String search, int page, int size) {
        String like = search != null ? "%" + search.toLowerCase() + "%" : "%";
        String sql = """
            SELECT * FROM article
            WHERE LOWER(designation) LIKE ? OR LOWER(reference) LIKE ?
            ORDER BY id DESC LIMIT ? OFFSET ?
            """;
        return jdbc.query(sql, rowMapper, like, like, size, (page - 1) * size);
    }

    public int countAll(String search) {
        String like = search != null ? "%" + search.toLowerCase() + "%" : "%";
        String sql = "SELECT COUNT(*) FROM article WHERE LOWER(designation) LIKE ? OR LOWER(reference) LIKE ?";
        return Objects.requireNonNull(jdbc.queryForObject(sql, Integer.class, like, like));
    }

    // ── SELECT par ID ─────────────────────────────────────────────────────────
    public Optional<Article> findById(Long id) {
        List<Article> results = jdbc.query("SELECT * FROM article WHERE id = ?", rowMapper, id);
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    // ── Calcul dynamique du stock total global d'un article ──────────────────
    // CETTE MÉTHODE REMPLACE le champ stock_total_global supprimé.
    // Elle interroge uniquement article_stock_depot, la source unique de vérité.
    public int getStockTotal(Long articleId) {
        String sql = "SELECT COALESCE(SUM(quantite), 0) FROM article_stock_depot WHERE article_id = ?";
        return Objects.requireNonNull(jdbc.queryForObject(sql, Integer.class, articleId));
    }

    // ── INSERT avec récupération de l'ID ──────────────────────────────────────
    public Article save(Article article) {
        String sql = """
            INSERT INTO article
              (reference, designation, description, unite, prix_achat, prix_vente,
               seuil_min_alerte, emplacement_rayon, categorie_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """;
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbc.update(con -> {
            PreparedStatement ps = con.prepareStatement(sql, new String[]{"id"});
            ps.setString(1, article.getReference());
            ps.setString(2, article.getDesignation());
            ps.setString(3, article.getDescription());
            ps.setString(4, article.getUnite() != null ? article.getUnite() : "PIECE");
            ps.setBigDecimal(5, article.getPrixAchat());
            ps.setBigDecimal(6, article.getPrixVente());
            ps.setInt(7, article.getSeuilMinAlerte());
            ps.setString(8, article.getEmplacementRayon());
            ps.setObject(9, article.getCategorieId());
            return ps;
        }, keyHolder);
        long newId = Objects.requireNonNull(keyHolder.getKey()).longValue();
        return findById(newId).orElseThrow();
    }

    // ── UPDATE complet ────────────────────────────────────────────────────────
    public Optional<Article> update(Long id, Article article) {
        String sql = """
            UPDATE article SET
              designation = ?, description = ?, unite = ?,
              prix_achat = ?, prix_vente = ?,
              seuil_min_alerte = ?, emplacement_rayon = ?, categorie_id = ?
            WHERE id = ?
            """;
        int rows = jdbc.update(sql,
                article.getDesignation(), article.getDescription(), article.getUnite(),
                article.getPrixAchat(), article.getPrixVente(),
                article.getSeuilMinAlerte(), article.getEmplacementRayon(),
                article.getCategorieId(), id);
        return rows > 0 ? findById(id) : Optional.empty();
    }

    // ── DELETE ────────────────────────────────────────────────────────────────
    public boolean delete(Long id) {
        return jdbc.update("DELETE FROM article WHERE id = ?", id) > 0;
    }

    // ── Alertes de rupture (stock calculé dynamiquement) ─────────────────────
    // JOIN avec article_stock_depot pour calculer la somme réelle,
    // sans dépendre du champ stock_total_global supprimé.
    public List<Article> findAlertes() {
        String sql = """
            SELECT a.*,
                   COALESCE(SUM(asd.quantite), 0) AS stock_calcule
            FROM article a
            LEFT JOIN article_stock_depot asd ON asd.article_id = a.id
            GROUP BY a.id
            HAVING COALESCE(SUM(asd.quantite), 0) <= a.seuil_min_alerte
            ORDER BY stock_calcule ASC
            """;
        // On récupère les articles puis on enrichit le stockTotal
        return jdbc.query(sql, (rs, rowNum) -> {
            Article art = rowMapper.mapRow(rs, rowNum);
            art.setStockTotal(rs.getInt("stock_calcule"));
            return art;
        });
    }

    // ── Consultation du stock par dépôt ───────────────────────────────────────
    public List<Map<String, Object>> getStockByDepot(Long articleId) {
        String sql = """
            SELECT d.id as depot_id, d.nom as depot_nom,
                   COALESCE(asd.quantite, 0) as quantite
            FROM depot d
            LEFT JOIN article_stock_depot asd ON asd.depot_id = d.id AND asd.article_id = ?
            ORDER BY d.nom
            """;
        return jdbc.queryForList(sql, articleId);
    }

    // ── UPSERT stock par dépôt (atomique, jamais de stock négatif) ───────────
    // CHECK (quantite >= 0) en DB garantit l'intégrité, GREATEST évite les négatifs en Java.
    public void updateStockDepot(Long articleId, Long depotId, int delta) {
        String sql = """
            INSERT INTO article_stock_depot (article_id, depot_id, quantite)
            VALUES (?, ?, GREATEST(0, ?))
            ON CONFLICT (article_id, depot_id)
            DO UPDATE SET quantite = GREATEST(0, article_stock_depot.quantite + EXCLUDED.quantite)
            """;
        jdbc.update(sql, articleId, depotId, delta);
    }

    // ── Calcul du stock disponible (stock physique - réservations actives) ───
    public int getStockDisponible(Long articleId, Long depotId) {
        String sql = """
            SELECT
              COALESCE((SELECT quantite FROM article_stock_depot WHERE article_id=? AND depot_id=?), 0)
              -
              COALESCE((SELECT SUM(quantite) FROM reservation_stock
                        WHERE article_id=? AND depot_id=? AND statut='ACTIVE'), 0)
            """;
        return Objects.requireNonNull(jdbc.queryForObject(sql, Integer.class,
                articleId, depotId, articleId, depotId));
    }
    // ── Helpers pour la suppression sécurisée ────────────────────────────────

    /** Compte les mouvements qui référencent cet article (via mouvement_stock_line). */
    public int countMouvementsForArticle(Long articleId) {
        String sql = "SELECT COUNT(*) FROM mouvement_stock_line WHERE article_id = ?";
        return Objects.requireNonNull(jdbc.queryForObject(sql, Integer.class, articleId));
    }

    /** Compte les réservations actives pour cet article. */
    public int countReservationsActivesForArticle(Long articleId) {
        String sql = "SELECT COUNT(*) FROM reservation_stock WHERE article_id = ? AND statut = 'ACTIVE'";
        return Objects.requireNonNull(jdbc.queryForObject(sql, Integer.class, articleId));
    }

    /** Supprime le stock par dépôt pour cet article. */
    public void deleteStockDepot(Long articleId) {
        jdbc.update("DELETE FROM article_stock_depot WHERE article_id = ?", articleId);
    }

    /** Supprime les lignes d'inventaire pour cet article. */
    public void deleteInventaireLines(Long articleId) {
        jdbc.update("DELETE FROM inventaire_line WHERE article_id = ?", articleId);
    }

    /** Supprime toutes les réservations (non actives) pour cet article. */
    public void deleteReservations(Long articleId) {
        jdbc.update("DELETE FROM reservation_stock WHERE article_id = ? AND statut != 'ACTIVE'", articleId);
    }
}

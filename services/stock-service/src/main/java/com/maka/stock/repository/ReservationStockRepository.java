package com.maka.stock.repository;

import com.maka.stock.model.ReservationStock;
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
 * Repository JDBC pour la gestion des réservations de stock.
 * Pattern "Reserve & Confirm" :
 *   1. Réserver (ACTIVE)  → stock visible diminue sans mouvement réel
 *   2. Consommer (CONSUMED) → créer un vrai mouvement SORTIE
 *   3. Libérer (RELEASED)  → si commande annulée, stock redevient disponible
 */
@Repository
@RequiredArgsConstructor
public class ReservationStockRepository {

    private final JdbcTemplate jdbc;

    private final RowMapper<ReservationStock> rowMapper = (rs, n) -> ReservationStock.builder()
            .id(rs.getLong("id"))
            .articleId(rs.getLong("article_id"))
            .depotId(rs.getLong("depot_id"))
            .quantite(rs.getInt("quantite"))
            .sourceType(rs.getString("source_type"))
            .sourceId(rs.getLong("source_id"))
            .statut(rs.getString("statut"))
            .createdAt(rs.getTimestamp("created_at").toLocalDateTime())
            .build();

    // ── Créer une réservation ─────────────────────────────────────────────────
    public ReservationStock save(ReservationStock r) {
        String sql = """
            INSERT INTO reservation_stock
              (article_id, depot_id, quantite, source_type, source_id, statut, created_at)
            VALUES (?, ?, ?, ?, ?, 'ACTIVE', ?)
            """;
        KeyHolder kh = new GeneratedKeyHolder();
        jdbc.update(con -> {
            PreparedStatement ps = con.prepareStatement(sql, new String[]{"id"});
            ps.setLong(1, r.getArticleId());
            ps.setLong(2, r.getDepotId());
            ps.setInt(3, r.getQuantite());
            ps.setString(4, r.getSourceType());
            ps.setLong(5, r.getSourceId());
            ps.setTimestamp(6, Timestamp.valueOf(LocalDateTime.now()));
            return ps;
        }, kh);
        return findById(Objects.requireNonNull(kh.getKey()).longValue()).orElseThrow();
    }

    public Optional<ReservationStock> findById(Long id) {
        List<ReservationStock> r = jdbc.query(
                "SELECT * FROM reservation_stock WHERE id = ?", rowMapper, id);
        return r.isEmpty() ? Optional.empty() : Optional.of(r.get(0));
    }

    // ── Trouver par commande source (idempotency check) ───────────────────────
    public Optional<ReservationStock> findBySource(String sourceType, Long sourceId, Long articleId) {
        String sql = """
            SELECT * FROM reservation_stock
            WHERE source_type=? AND source_id=? AND article_id=? AND statut='ACTIVE'
            """;
        List<ReservationStock> r = jdbc.query(sql, rowMapper, sourceType, sourceId, articleId);
        return r.isEmpty() ? Optional.empty() : Optional.of(r.get(0));
    }

    // ── Lister les réservations actives d'un article dans un dépôt ───────────
    public int getTotalReserve(Long articleId, Long depotId) {
        String sql = """
            SELECT COALESCE(SUM(quantite), 0) FROM reservation_stock
            WHERE article_id = ? AND depot_id = ? AND statut = 'ACTIVE'
            """;
        return Objects.requireNonNull(jdbc.queryForObject(sql, Integer.class, articleId, depotId));
    }

    // ── Changer le statut d'une réservation ───────────────────────────────────
    public void updateStatut(Long id, String newStatut) {
        jdbc.update("UPDATE reservation_stock SET statut = ? WHERE id = ?", newStatut, id);
    }

    // ── Libérer toutes les réservations actives d'une commande (annulation) ──
    public int releaseBySource(String sourceType, Long sourceId) {
        String sql = """
            UPDATE reservation_stock SET statut = 'RELEASED'
            WHERE source_type = ? AND source_id = ? AND statut = 'ACTIVE'
            """;
        return jdbc.update(sql, sourceType, sourceId);
    }
}

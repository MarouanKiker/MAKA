package com.maka.stock.repository;

import com.maka.stock.model.Depot;
import com.maka.stock.repository.mapper.DepotRowMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class DepotRepository {

    private final JdbcTemplate jdbc;
    private final DepotRowMapper rowMapper;

    public List<Depot> findAll() {
        return jdbc.query("SELECT * FROM depot ORDER BY nom ASC", rowMapper);
    }

    public Optional<Depot> findById(Long id) {
        List<Depot> results = jdbc.query("SELECT * FROM depot WHERE id = ?", rowMapper, id);
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    public Depot save(Depot depot) {
        String sql = "INSERT INTO depot (nom, adresse, capacite_max) VALUES (?, ?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbc.update(con -> {
            PreparedStatement ps = con.prepareStatement(sql, new String[] {"id"});
            ps.setString(1, depot.getNom());
            ps.setString(2, depot.getAdresse());
            ps.setInt(3, depot.getCapaciteMax());
            return ps;
        }, keyHolder);
        long newId = Objects.requireNonNull(keyHolder.getKey()).longValue();
        return findById(newId).orElseThrow();
    }

    public Optional<Depot> update(Long id, Depot depot) {
        String sql = "UPDATE depot SET nom = ?, adresse = ?, capacite_max = ? WHERE id = ?";
        int rows = jdbc.update(sql, depot.getNom(), depot.getAdresse(), depot.getCapaciteMax(), id);
        return rows > 0 ? findById(id) : Optional.empty();
    }

    public boolean delete(Long id) {
        return jdbc.update("DELETE FROM depot WHERE id = ?", id) > 0;
    }

    // ── Helpers pour la suppression sécurisée ────────────────────────────────

    /** Compte les mouvements qui utilisent ce dépôt (source ou destination). */
    public int countMouvementsForDepot(Long depotId) {
        String sql = "SELECT COUNT(*) FROM mouvement_stock WHERE depot_source_id = ? OR depot_destination_id = ?";
        return Objects.requireNonNull(jdbc.queryForObject(sql, Integer.class, depotId, depotId));
    }

    /** Compte les inventaires liés à ce dépôt. */
    public int countInventairesForDepot(Long depotId) {
        String sql = "SELECT COUNT(*) FROM inventaire WHERE depot_id = ?";
        return Objects.requireNonNull(jdbc.queryForObject(sql, Integer.class, depotId));
    }

    /** Supprime le stock de tous les articles dans ce dépôt. */
    public void deleteStockDepot(Long depotId) {
        jdbc.update("DELETE FROM article_stock_depot WHERE depot_id = ?", depotId);
    }

    /** Supprime les réservations non actives sur ce dépôt. */
    public void deleteReservations(Long depotId) {
        jdbc.update("DELETE FROM reservation_stock WHERE depot_id = ? AND statut != 'ACTIVE'", depotId);
    }
}

package com.maka.stock.repository.mapper;

import com.maka.stock.model.MouvementStock;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;

/**
 * Mapping manuel ResultSet → MouvementStock (v2).
 * Ajout : source_type, source_id, statut BROUILLON/VALIDE/ANNULE.
 */
@Component
public class MouvementStockRowMapper implements RowMapper<MouvementStock> {

    @Override
    public MouvementStock mapRow(ResultSet rs, int rowNum) throws SQLException {
        Timestamp ts = rs.getTimestamp("date_mouvement");
        return MouvementStock.builder()
                .id(rs.getLong("id"))
                .typeMvt(rs.getString("type_mvt"))
                .sourceType(rs.getString("source_type"))
                .sourceId(rs.getObject("source_id") != null ? rs.getLong("source_id") : null)
                .statut(rs.getString("statut"))
                .depotSourceId(rs.getObject("depot_source_id") != null ? rs.getLong("depot_source_id") : null)
                .depotDestinationId(rs.getObject("depot_destination_id") != null ? rs.getLong("depot_destination_id") : null)
                .utilisateurId(rs.getLong("utilisateur_id"))
                .motif(rs.getString("motif"))
                .dateMouvement(ts != null ? ts.toLocalDateTime() : null)
                .build();
    }
}

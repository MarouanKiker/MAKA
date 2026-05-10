package com.maka.stock.repository.mapper;

import com.maka.stock.model.Depot;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;

@Component
public class DepotRowMapper implements RowMapper<Depot> {
    @Override
    public Depot mapRow(ResultSet rs, int rowNum) throws SQLException {
        Timestamp ts = rs.getTimestamp("date_creation");
        return Depot.builder()
                .id(rs.getLong("id"))
                .nom(rs.getString("nom"))
                .adresse(rs.getString("adresse"))
                .capaciteMax(rs.getInt("capacite_max"))
                .dateCreation(ts != null ? ts.toLocalDateTime() : null)
                .build();
    }
}

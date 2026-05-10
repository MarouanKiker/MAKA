package com.maka.stock.repository.mapper;

import com.maka.stock.model.Article;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;

/**
 * Mapping manuel ResultSet → Article (v2).
 * stock_total_global supprimé — remplacé par le champ calculé stockTotal.
 * Ajout du champ unite.
 */
@Component
public class ArticleRowMapper implements RowMapper<Article> {

    @Override
    public Article mapRow(ResultSet rs, int rowNum) throws SQLException {
        Timestamp ts = rs.getTimestamp("date_creation");
        return Article.builder()
                .id(rs.getLong("id"))
                .reference(rs.getString("reference"))
                .designation(rs.getString("designation"))
                .description(rs.getString("description"))
                .unite(rs.getString("unite"))
                .prixAchat(rs.getBigDecimal("prix_achat"))
                .prixVente(rs.getBigDecimal("prix_vente"))
                .seuilMinAlerte(rs.getInt("seuil_min_alerte"))
                .emplacementRayon(rs.getString("emplacement_rayon"))
                .categorieId(rs.getObject("categorie_id") != null ? rs.getLong("categorie_id") : null)
                .dateCreation(ts != null ? ts.toLocalDateTime() : null)
                // stockTotal est un champ calculé — rempli post-requête par le service
                .stockTotal(0)
                .build();
    }
}

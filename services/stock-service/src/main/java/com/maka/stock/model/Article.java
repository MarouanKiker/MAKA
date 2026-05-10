package com.maka.stock.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Modèle Article — v2.
 * stock_total_global SUPPRIMÉ : la quantité réelle est calculée dynamiquement
 * via SUM(quantite) FROM article_stock_depot WHERE article_id = ?
 * Ajout du champ "unite" (PIECE, KG, LITRE, M, M2).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Article {
    private Long id;
    private String reference;
    private String designation;
    private String description;
    private String unite;           // PIECE | KG | LITRE | M | M2
    private BigDecimal prixAchat;
    private BigDecimal prixVente;
    private int seuilMinAlerte;
    private String emplacementRayon;
    private Long categorieId;
    private LocalDateTime dateCreation;

    // Champ calculé (non persisté) — rempli par le service via une requête séparée
    private int stockTotal;
}

package com.maka.stock.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Ligne de mouvement de stock.
 * Permet d'associer plusieurs articles à un seul mouvement (bon de livraison multi-produits).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MouvementStockLine {
    private Long id;
    private Long mouvementId;
    private Long articleId;
    private int quantite;

    // Champs enrichis (non persistés) — pour l'affichage
    private String articleReference;
    private String articleDesignation;
    private String articleUnite;
}

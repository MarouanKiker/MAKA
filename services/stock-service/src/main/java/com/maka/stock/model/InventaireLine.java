package com.maka.stock.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Ligne d'inventaire.
 * ecart = quantite_reelle - quantite_systeme (calculé par PostgreSQL via GENERATED ALWAYS AS).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventaireLine {
    private Long id;
    private Long inventaireId;
    private Long articleId;
    private int quantiteSysteme;   // Stock lu dans article_stock_depot au démarrage de l'inventaire
    private int quantiteReelle;    // Saisi par le magasinier
    private int ecart;             // Calculé par DB : quantiteReelle - quantiteSysteme

    // Champs enrichis (non persistés) — pour l'affichage
    private String articleReference;
    private String articleDesignation;
    private String articleUnite;
}

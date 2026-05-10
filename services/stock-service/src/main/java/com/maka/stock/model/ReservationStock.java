package com.maka.stock.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Réservation de stock.
 * Permet à un service externe (CRM, Ventes) de bloquer du stock
 * avant qu'une commande soit physiquement expédiée.
 * Cycle de vie : ACTIVE → CONSUMED (livraison validée) | RELEASED (commande annulée)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReservationStock {
    private Long id;
    private Long articleId;
    private Long depotId;
    private int quantite;
    private String sourceType;    // VENTE | ACHAT | ...
    private Long sourceId;        // ID de la commande source
    private String statut;        // ACTIVE | CONSUMED | RELEASED
    private LocalDateTime createdAt;
}

package com.maka.stock.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * MouvementStock v2 (Header).
 * Un mouvement peut contenir plusieurs articles via mouvement_stock_line.
 * Ajout : source_type (VENTE/ACHAT/...) et source_id pour la traçabilité inter-services.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MouvementStock {
    private Long id;
    private String typeMvt;          // ENTREE | SORTIE | TRANSFERT
    private String sourceType;       // VENTE | ACHAT | INVENTAIRE | RETOUR | MANUEL
    private Long sourceId;           // ID externe (ex: ID commande dans crm-service)
    private String statut;           // BROUILLON | VALIDE | ANNULE
    private Long depotSourceId;
    private Long depotDestinationId;
    private Long utilisateurId;
    private String motif;
    private LocalDateTime dateMouvement;
}

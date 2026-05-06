package com.maka.stock.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

/**
 * DTO de création d'un mouvement de stock (v2).
 * Ajout : sourceType, sourceId pour la traçabilité inter-services.
 * articleId reste pour la compatibilité ascendante (mouvement simple 1 article).
 */
@Data
public class CreateMouvementDto {

    @NotNull(message = "L'article est obligatoire")
    private Long articleId;

    @NotNull(message = "Le type de mouvement est obligatoire")
    @Pattern(regexp = "ENTREE|SORTIE|TRANSFERT", message = "Type doit être ENTREE, SORTIE ou TRANSFERT")
    private String typeMvt;

    @Min(value = 1, message = "La quantité doit être >= 1")
    private int quantite;

    // Requis pour SORTIE et TRANSFERT
    private Long depotSourceId;

    // Requis pour ENTREE et TRANSFERT
    private Long depotDestinationId;

    // Traçabilité inter-services : VENTE, ACHAT, INVENTAIRE, RETOUR, MANUEL
    private String sourceType;

    // ID externe dans le service source (ex: ID de la commande CRM)
    private Long sourceId;

    private String motif;
}

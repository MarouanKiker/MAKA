package com.maka.stock.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

/**
 * DTO pour créer une réservation de stock.
 * Utilisé par les services externes (CRM, Ventes) via l'API REST.
 */
@Data
public class CreateReservationDto {

    @NotNull
    private Long articleId;

    @NotNull
    private Long depotId;

    @Min(value = 1, message = "La quantité réservée doit être >= 1")
    private int quantite;

    @NotBlank(message = "source_type est obligatoire (ex: VENTE, ACHAT)")
    private String sourceType;

    @NotNull(message = "source_id est obligatoire (ID de la commande source)")
    private Long sourceId;
}

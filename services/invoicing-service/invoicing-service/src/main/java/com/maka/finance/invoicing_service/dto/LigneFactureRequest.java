package com.maka.finance.invoicing_service.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

@Schema(description = "Ligne de facture à créer/modifier")
public record LigneFactureRequest(
        @NotBlank(message = "Le produit est obligatoire")
        @Schema(example = "Abonnement SaaS")
        String produit,

        @NotNull(message = "La quantité est obligatoire")
        @Min(value = 1, message = "La quantité doit être >= 1")
        @Schema(example = "2")
        Integer quantite,

        @NotNull(message = "Le prix unitaire est obligatoire")
        @DecimalMin(value = "0.01", message = "Le prix unitaire doit être > 0")
        @Schema(example = "120.00")
        BigDecimal prixUnitaire
) {
}

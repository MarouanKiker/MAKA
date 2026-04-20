package com.maka.finance.invoicing_service.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.math.BigDecimal;
import java.util.List;

@Schema(description = "Payload de création/mise à jour d'une facture")
public record FactureRequest(
        @NotBlank(message = "Le numéro de facture est obligatoire")
        @Schema(example = "FAC-2026-0001")
        String numero,

        @DecimalMin(value = "0.00", message = "Le taux TVA doit être >= 0")
        @DecimalMax(value = "1.00", message = "Le taux TVA doit être <= 1")
        @Schema(example = "0.20")
        BigDecimal tauxTVA,

        @NotEmpty(message = "Une facture doit contenir au moins une ligne")
        @Valid
        List<LigneFactureRequest> lignes
) {
}

package com.maka.finance.invoicing_service.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

@Schema(description = "Payload d'application d'un paiement")
public record PaiementRequest(
        @NotNull(message = "Le montant est obligatoire")
        @DecimalMin(value = "0.01", message = "Le montant doit être > 0")
        @Schema(example = "100.00")
        BigDecimal montant
) {
}

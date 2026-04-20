package com.maka.finance.invoicing_service.dto;

import com.maka.finance.invoicing_service.entities.ModePaiement;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record CreatePaiementRequest(
        @NotNull(message = "L'identifiant facture est obligatoire")
        Long factureId,

        @NotNull(message = "Le montant est obligatoire")
        @DecimalMin(value = "0.01", message = "Le montant doit être > 0")
        BigDecimal montant,

        @NotNull(message = "Le mode de paiement est obligatoire")
        ModePaiement modePaiement,

        @NotBlank(message = "La référence transaction est obligatoire")
        String referenceTransaction
) {
}

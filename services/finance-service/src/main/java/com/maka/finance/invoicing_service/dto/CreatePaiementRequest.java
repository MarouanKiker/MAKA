package com.maka.finance.invoicing_service.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record CreatePaiementRequest(
        @NotNull(message = "L'identifiant facture est obligatoire")
        Long factureId,

        @NotNull(message = "Le montant est obligatoire")
        @DecimalMin(value = "0.01", message = "Le montant doit être > 0")
        BigDecimal montant,

        @NotNull(message = "L'ID du mode de paiement est obligatoire")
        Long modePaiementId,

        Long compteBancaireId,

        String referenceTransaction,

        String type
) {
}

package com.maka.finance.invoicing_service.dto;

import com.maka.finance.invoicing_service.entities.ModePaiement;
import com.maka.finance.invoicing_service.entities.StatutPaiement;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record PaiementResponse(
        Long id,
        Long factureId,
        BigDecimal montant,
        ModePaiement modePaiement,
        String referenceTransaction,
        StatutPaiement statut,
        OffsetDateTime datePaiement,
        OffsetDateTime dateCreation
) {
}

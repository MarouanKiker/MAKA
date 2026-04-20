package com.maka.finance.invoicing_service.dto.event;

import java.math.BigDecimal;

public record PaymentEvent(
        Long paiementId,
        Long factureId,
        BigDecimal montant,
        String referenceTransaction,
        String statut
) {
}

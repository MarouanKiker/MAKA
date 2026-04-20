package com.maka.finance.invoicing_service.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record JournalTransactionResponse(
        Long id,
        OffsetDateTime dateEcriture,
        String compteDebit,
        String compteCredit,
        BigDecimal debit,
        BigDecimal credit,
        String referenceType,
        Long referenceId,
        String description
) {
}

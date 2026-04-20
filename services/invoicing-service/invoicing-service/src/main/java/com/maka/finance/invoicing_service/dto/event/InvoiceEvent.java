package com.maka.finance.invoicing_service.dto.event;

import java.math.BigDecimal;

public record InvoiceEvent(
        Long factureId,
        String numero,
        BigDecimal montantHT,
        BigDecimal montantTVA,
        BigDecimal montantTTC
) {
}

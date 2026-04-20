package com.maka.finance.invoicing_service.dto.event;

import java.time.OffsetDateTime;

public record FinanceEvent(
        String eventId,
        String eventType,
        OffsetDateTime timestamp,
        Object payload
) {
}

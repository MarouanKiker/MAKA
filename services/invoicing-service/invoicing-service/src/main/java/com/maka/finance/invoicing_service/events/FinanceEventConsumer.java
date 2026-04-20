package com.maka.finance.invoicing_service.events;

import com.maka.finance.invoicing_service.config.RabbitMQConfig;
import com.maka.finance.invoicing_service.dto.event.FinanceEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class FinanceEventConsumer {

    private static final Logger log = LoggerFactory.getLogger(FinanceEventConsumer.class);

    @RabbitListener(queues = RabbitMQConfig.INVOICE_QUEUE)
    public void onInvoiceEvent(FinanceEvent event) {
        log.info("Invoice event consumed: {}", event.eventType());
    }

    @RabbitListener(queues = RabbitMQConfig.PAYMENT_QUEUE)
    public void onPaymentEvent(FinanceEvent event) {
        log.info("Payment event consumed: {}", event.eventType());
    }
}

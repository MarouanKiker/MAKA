package com.maka.finance.invoicing_service.events;

import com.maka.finance.invoicing_service.config.RabbitMQConfig;
import com.maka.finance.invoicing_service.dto.event.FinanceEvent;
import com.maka.finance.invoicing_service.dto.event.InvoiceEvent;
import com.maka.finance.invoicing_service.dto.event.PaymentEvent;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

@Component
public class FinanceEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(FinanceEventPublisher.class);

    private final RabbitTemplate rabbitTemplate;

    public FinanceEventPublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    @Retry(name = "rabbitPublisher", fallbackMethod = "onPublishInvoiceValidatedFallback")
    @CircuitBreaker(name = "rabbitPublisher", fallbackMethod = "onPublishInvoiceValidatedFallback")
    public void publishInvoiceValidated(InvoiceEvent payload) {
        publish(RabbitMQConfig.INVOICE_VALIDATED_KEY, "InvoiceValidated", payload);
    }

    @Retry(name = "rabbitPublisher", fallbackMethod = "onPublishPaymentReceivedFallback")
    @CircuitBreaker(name = "rabbitPublisher", fallbackMethod = "onPublishPaymentReceivedFallback")
    public void publishPaymentReceived(PaymentEvent payload) {
        publish(RabbitMQConfig.PAYMENT_RECEIVED_KEY, "PaymentReceived", payload);
    }

    @Retry(name = "rabbitPublisher", fallbackMethod = "onPublishPaymentValidatedFallback")
    @CircuitBreaker(name = "rabbitPublisher", fallbackMethod = "onPublishPaymentValidatedFallback")
    public void publishPaymentValidated(PaymentEvent payload) {
        publish(RabbitMQConfig.PAYMENT_VALIDATED_KEY, "PaymentValidated", payload);
    }

    @Retry(name = "rabbitPublisher", fallbackMethod = "onPublishPaymentRejectedFallback")
    @CircuitBreaker(name = "rabbitPublisher", fallbackMethod = "onPublishPaymentRejectedFallback")
    public void publishPaymentRejected(PaymentEvent payload) {
        publish(RabbitMQConfig.PAYMENT_REJECTED_KEY, "PaymentRejected", payload);
    }

    private void publish(String routingKey, String eventType, Object payload) {
        FinanceEvent event = new FinanceEvent(
                UUID.randomUUID().toString(),
                eventType,
                OffsetDateTime.now(),
                payload
        );
        rabbitTemplate.convertAndSend(RabbitMQConfig.FINANCE_EXCHANGE, routingKey, event);
    }

    @SuppressWarnings("unused")
    private void onPublishInvoiceValidatedFallback(InvoiceEvent payload, Throwable throwable) {
        log.error("Echec publish InvoiceValidated pour facture {}", payload.factureId(), throwable);
    }

    @SuppressWarnings("unused")
    private void onPublishPaymentReceivedFallback(PaymentEvent payload, Throwable throwable) {
        log.error("Echec publish PaymentReceived pour paiement {}", payload.paiementId(), throwable);
    }

    @SuppressWarnings("unused")
    private void onPublishPaymentValidatedFallback(PaymentEvent payload, Throwable throwable) {
        log.error("Echec publish PaymentValidated pour paiement {}", payload.paiementId(), throwable);
    }

    @SuppressWarnings("unused")
    private void onPublishPaymentRejectedFallback(PaymentEvent payload, Throwable throwable) {
        log.error("Echec publish PaymentRejected pour paiement {}", payload.paiementId(), throwable);
    }
}

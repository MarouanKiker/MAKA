package com.maka.finance.invoicing_service.metrics;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.DistributionSummary;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.stereotype.Component;

@Component
public class FinanceMetrics {

    private final Counter invoicesCreatedCounter;
    private final Counter paymentsReceivedCounter;
    private final Counter paymentsValidatedCounter;
    private final DistributionSummary paymentAmountSummary;

    public FinanceMetrics(MeterRegistry meterRegistry) {
        this.invoicesCreatedCounter = Counter.builder("finance_invoices_created_total")
                .description("Nombre total de factures créées")
                .register(meterRegistry);

        this.paymentsReceivedCounter = Counter.builder("finance_payments_received_total")
                .description("Nombre total de paiements reçus")
                .register(meterRegistry);

        this.paymentsValidatedCounter = Counter.builder("finance_payments_validated_total")
                .description("Nombre total de paiements validés")
                .register(meterRegistry);

        this.paymentAmountSummary = DistributionSummary.builder("finance_payment_amount")
                .description("Distribution des montants de paiement")
                .baseUnit("EUR")
                .register(meterRegistry);
    }

    public void incrementInvoicesCreated() {
        invoicesCreatedCounter.increment();
    }

    public void incrementPaymentsReceived() {
        paymentsReceivedCounter.increment();
    }

    public void incrementPaymentsValidated() {
        paymentsValidatedCounter.increment();
    }

    public void recordPaymentAmount(double amount) {
        paymentAmountSummary.record(amount);
    }
}

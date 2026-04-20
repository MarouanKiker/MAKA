package com.maka.finance.invoicing_service.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String FINANCE_EXCHANGE = "finance.exchange";

    public static final String INVOICE_QUEUE = "finance.invoices";
    public static final String PAYMENT_QUEUE = "finance.payments";

    public static final String INVOICE_VALIDATED_KEY = "invoice.validated";
    public static final String PAYMENT_RECEIVED_KEY = "payment.received";
    public static final String PAYMENT_VALIDATED_KEY = "payment.validated";
    public static final String PAYMENT_REJECTED_KEY = "payment.rejected";

    @Bean
    public TopicExchange financeExchange() {
        return new TopicExchange(FINANCE_EXCHANGE);
    }

    @Bean
    public Queue invoiceQueue() {
        return new Queue(INVOICE_QUEUE, true);
    }

    @Bean
    public Queue paymentQueue() {
        return new Queue(PAYMENT_QUEUE, true);
    }

    @Bean
    public Binding invoiceBinding() {
        return BindingBuilder.bind(invoiceQueue()).to(financeExchange()).with("invoice.*");
    }

    @Bean
    public Binding paymentBinding() {
        return BindingBuilder.bind(paymentQueue()).to(financeExchange()).with("payment.*");
    }

    @Bean
    public Jackson2JsonMessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}

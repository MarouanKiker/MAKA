package com.maka.finance.invoicing_service.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI financeOpenApi() {
        return new OpenAPI().info(new Info()
                .title("ERP Finance API - Invoicing Service")
                .description("Microservice Spring Boot 3 pour la gestion des factures")
                .version("v1")
                .contact(new Contact().name("Finance ERP Team").email("finance-team@example.com"))
                .license(new License().name("Apache 2.0")));
    }
}

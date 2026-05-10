package com.maka.stock.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Configuration de sécurité OAuth2 Resource Server.
 * Valide les JWT via la clé publique RSA partagée avec auth-service.
 * Configurée en mode STATELESS (pas de session HTTP côté serveur).
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Endpoints de supervision accessibles sans token
                .requestMatchers(HttpMethod.GET, "/actuator/health", "/actuator/info", "/actuator/metrics", "/actuator/prometheus").permitAll()
                // Tous les endpoints /api/stock/** nécessitent un token valide
                .requestMatchers("/api/stock/**").authenticated()
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                // Utilise la clé publique définie dans application.yml
                .jwt(jwt -> {})
            );

        return http.build();
    }
}

package com.maka.finance.invoicing_service.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.security.KeyFactory;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Value("${JWT_PUBLIC_KEY_PATH:/app/keys/public.pem}")
    private String publicKeyPath;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/swagger-ui.html",
                                "/swagger-ui/**",
                                "/v3/api-docs/**",
                                "/actuator/**",
                                "/api/v1/debug/**",
                                "/api/debug/**"
                        ).permitAll()
                        .anyRequest().authenticated()
                )
                .oauth2ResourceServer(oauth2 -> oauth2
                        .bearerTokenResolver(request -> {
                            // Chercher le token dans le cookie 'maka_jwt'
                            if (request.getCookies() != null) {
                                for (var cookie : request.getCookies()) {
                                    if ("maka_jwt".equals(cookie.getName())) {
                                        return cookie.getValue();
                                    }
                                }
                            }
                            // Fallback sur le header Authorization standard
                            String authHeader = request.getHeader("Authorization");
                            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                                return authHeader.substring(7);
                            }
                            return null;
                        })
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter()))
                );

        return http.build();
    }

    /**
     * Décode les JWT en utilisant la clé publique RSA du fichier PEM partagé.
     * Même approche que le CRM service (.NET).
     */
    @Bean
    public JwtDecoder jwtDecoder() {
        try {
            // Attendre que la clé soit disponible (le service Auth peut démarrer après)
            int maxRetries = 10;
            for (int i = 0; i < maxRetries; i++) {
                if (Files.exists(Paths.get(publicKeyPath))) break;
                System.out.println("⏳ En attente de la clé publique... tentative " + (i + 1) + "/" + maxRetries);
                Thread.sleep(2000);
            }

            String keyContent = new String(Files.readAllBytes(Paths.get(publicKeyPath)));
            keyContent = keyContent
                    .replace("-----BEGIN PUBLIC KEY-----", "")
                    .replace("-----END PUBLIC KEY-----", "")
                    .replaceAll("\\s", "");

            byte[] keyBytes = Base64.getDecoder().decode(keyContent);
            X509EncodedKeySpec spec = new X509EncodedKeySpec(keyBytes);
            KeyFactory keyFactory = KeyFactory.getInstance("RSA");
            RSAPublicKey publicKey = (RSAPublicKey) keyFactory.generatePublic(spec);

            System.out.println("✅ Clé publique RSA chargée — Finance Service prêt.");
            return NimbusJwtDecoder.withPublicKey(publicKey).build();

        } catch (IOException | InterruptedException e) {
            // Clé introuvable : mode dégradé (dev uniquement)
            System.out.println("⚠️  Clé publique introuvable (" + publicKeyPath + ") — Authentification désactivée.");
            return token -> {
                throw new org.springframework.security.oauth2.jwt.BadJwtException("Clé publique non configurée");
            };
        } catch (Exception e) {
            // Empêcher le crash fatal au démarrage
            System.err.println("❌ Erreur critique : Clé publique RSA corrompue ou illisible. Authentification indisponible.");
            return token -> {
                throw new org.springframework.security.oauth2.jwt.BadJwtException("Service de sécurité en cours de maintenance");
            };
        }
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter converter = new JwtGrantedAuthoritiesConverter();
        converter.setAuthoritiesClaimName("roles");
        converter.setAuthorityPrefix(""); // Symfony envoie déjà ROLE_ADMIN, pas besoin de re-prefixer

        JwtAuthenticationConverter jwtConverter = new JwtAuthenticationConverter();
        jwtConverter.setJwtGrantedAuthoritiesConverter(converter);
        return jwtConverter;
    }
}

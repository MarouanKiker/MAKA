package com.maka.hr.config;

import org.springframework.context.annotation.Configuration;

/**
 * Configuration Web du module HR.
 * 
 * Aucune sécurité Spring Security n'est utilisée ici.
 * L'authentification JWT et le CORS sont gérés au niveau du Gateway Nginx.
 */
@Configuration
public class SecurityConfig {
    // Pas de config spéciale — tout est géré par le Gateway Nginx
}

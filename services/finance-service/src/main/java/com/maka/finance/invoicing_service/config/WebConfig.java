package com.maka.finance.invoicing_service.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // Laissé vide car c'est la Gateway (Nginx) qui gère les CORS pour tout le système.
        // Évite le problème du double header 'Access-Control-Allow-Origin' qui bloque le navigateur.
    }
}

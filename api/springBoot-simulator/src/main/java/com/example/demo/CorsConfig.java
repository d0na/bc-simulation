package com.example.demo;

/**
 * @author francesco
 * @project springBoot-simulator
 */

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")  // Applica CORS a tutte le rotte
                .allowedOrigins("http://localhost:3000","http://localhost:3030")  // Permetti richieste dal client React
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")  // Metodi consentiti
                .allowedHeaders("*")  // Consenti tutti gli header
                .allowCredentials(true);  // Permetti le credenziali (come i cookie)
    }
}

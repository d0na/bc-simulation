package com.bcsimulator;

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
        registry.addMapping("/**")  // Apply CORS to all routes
                .allowedOrigins("http://localhost:3000","http://localhost:3030")  // Allow requests from React
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")  // Allowed methods
                .allowedHeaders("*")  // Allow all headers
                .allowCredentials(true);  // Allow credentials (like cookies)
    }
}

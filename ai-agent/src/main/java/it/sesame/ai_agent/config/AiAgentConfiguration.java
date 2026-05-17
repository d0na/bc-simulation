package it.sesame.ai_agent.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.modelcontextprotocol.client.transport.HttpClientStreamableHttpTransport;
import org.springframework.ai.mcp.customizer.McpClientCustomizer;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(AiAgentProperties.class)
public class AiAgentConfiguration {

    @Bean
    ObjectMapper objectMapper() {
        return new ObjectMapper();
    }

    @Bean
    McpClientCustomizer<HttpClientStreamableHttpTransport.Builder> etherscanBearerTokenCustomizer(
            AiAgentProperties properties
    ) {
        return (connectionName, builder) -> {
            if (!"etherscan".equals(connectionName)) {
                return;
            }
            String apiKey = properties.getEtherscanApiKey();
            if (apiKey == null || apiKey.isBlank() || apiKey.startsWith("PUT_YOUR_")) {
                return;
            }
            builder.httpRequestCustomizer((requestBuilder, method, uri, requestBody, context) ->
                    requestBuilder.header("Authorization", "Bearer " + apiKey)
            );
        };
    }
}

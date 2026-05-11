package it.sesame.mcp_server.backend;

import it.sesame.mcp_server.config.BackendProperties;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class BackendSimulationClient {

    private final RestClient restClient;

    public BackendSimulationClient(BackendProperties backendProperties, RestClient.Builder restClientBuilder) {
        this.restClient = restClientBuilder
                .baseUrl(backendProperties.getBaseUrl())
                .build();
    }

    public String runSimulation(String simulationRequestJson) {
        return restClient.post()
                .uri("/newsimulation")
                .contentType(MediaType.APPLICATION_JSON)
                .body(simulationRequestJson)
                .retrieve()
                .body(String.class);
    }
}

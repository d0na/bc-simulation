package it.sesame.mcp_server.tools;

import it.sesame.mcp_server.backend.BackendSimulationClient;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Component;

@Component
public class SimulationTools {

    private final BackendSimulationClient backendSimulationClient;

    public SimulationTools(BackendSimulationClient backendSimulationClient) {
        this.backendSimulationClient = backendSimulationClient;
    }

    @Tool(description = "Launch a new Sesame simulation. The input must be a JSON string matching the backend /newsimulation request payload.")
    public String runSimulation(String simulationRequestJson) {
        try {
            return backendSimulationClient.runSimulation(simulationRequestJson);
        } catch (Exception e) {
            throw new IllegalArgumentException("Failed to launch simulation: " + e.getMessage(), e);
        }
    }
}

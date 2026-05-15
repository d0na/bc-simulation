package it.sesame.ai_agent.dto;

public record SimulationLaunchResponse(
        String experimentId,
        String toolName,
        String requestPayload,
        String rawToolResponse
) {
}

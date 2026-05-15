package it.sesame.ai_agent.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.Map;

public record SimulationLaunchRequest(
        @NotBlank String experimentId,
        @NotNull List<String> entities,
        @NotNull List<SimulationEventRequest> events,
        @NotBlank String name,
        @NotBlank String description,
        int numAggr,
        int maxTime,
        int numRuns,
        @AssertTrue(message = "Human approval is required before launch") boolean humanApproved
) {

    public record SimulationEventRequest(
            @NotBlank String eventName,
            @NotBlank String description,
            String instanceOf,
            long gasCost,
            @Valid List<SimulationDependencyRequest> dependencies
    ) {
    }

    public record SimulationDependencyRequest(
            String dependOn,
            String maxProbabilityMatches,
            @NotBlank String distributionType,
            @NotNull Map<String, Object> parameters
    ) {
    }
}

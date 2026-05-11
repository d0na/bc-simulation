package com.bcsimulator.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class EventDependencyDTO {
    /**
     * The entity this event depends on
     */
    // @NotNull(message = "The field 'dependOn' to define the dependency entity is mandatory.")
    private String dependOn;

    /**
     * Maximum number of times this event can be triggered for each instance of dependOn.
     * Can be a fixed number or a reference to an entity count (e.g. "#user")
     */
    private String maxProbabilityMatches;

    /**
     * Probability distribution for this dependency
     */
    @NotNull(message = "The field 'probabilityDistribution' to define the probability distribution is mandatory.")
    private AbstractDistributionDTO probabilityDistribution;
} 
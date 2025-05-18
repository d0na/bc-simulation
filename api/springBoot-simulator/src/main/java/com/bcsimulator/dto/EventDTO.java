package com.bcsimulator.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class EventDTO {
    /**
     * event name
     */
    private String eventName;
    /**
     * event name
     */
    private String eventDescription;
    private String instanceOf;
    private String dependOn;
    private Integer maxProbabilityMatches;
    /**
     * probability distribution of the event
     */
    @NotNull(message = "The field 'probabilityDistribution' to define the probabilityDistribution is mandatory.")
    private AbstractDistributionDTO probabilityDistribution;
    /**
     * gas cost of the event
     */
    private long gasCost;
}
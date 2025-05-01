package com.example.demo.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

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
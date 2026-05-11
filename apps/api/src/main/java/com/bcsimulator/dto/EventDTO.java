package com.bcsimulator.dto;

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
     * event description
     */
    private String description;
    /**
     * The entity type that this event creates (if any)
     */
    private String instanceOf;
    /**
     * List of dependencies for this event
     */
    private List<EventDependencyDTO> dependencies;
    /**
     * gas cost of the event
     */
    private long gasCost;
}
package com.bcsimulator.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class EventDTO {
    /**
     * event name
     */
    private String eventName;
    /**
     * event description
     */
    @JsonAlias("eventDescription")
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

    @JsonAlias("dependOn")
    private String legacyDependOn;

    @JsonAlias("maxProbabilityMatches")
    private String legacyMaxProbabilityMatches;

    @JsonAlias("probabilityDistribution")
    private AbstractDistributionDTO legacyProbabilityDistribution;

    @JsonIgnore
    public void normalize() {
        if ((dependencies == null || dependencies.isEmpty()) && legacyProbabilityDistribution != null) {
            dependencies = new ArrayList<>();
            dependencies.add(new EventDependencyDTO(
                    legacyDependOn,
                    legacyMaxProbabilityMatches,
                    legacyProbabilityDistribution
            ));
        }
    }
}

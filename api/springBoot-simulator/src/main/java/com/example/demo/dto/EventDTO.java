package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class EventDTO {
    /** event name */
    private String eventName;
    /** event name */
    private String eventDescription;
    /** probability distribution of the event */
    private AbstractDistributionDTO probabilityDistribution;
    /** gas cost of the event */
    private long gasCost;
    /** related events to this event */
    private List<EventDTO> relatedEvents;
}
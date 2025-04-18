package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class EventDTO {
    private String event;
    private AbstractDistributionDTO distribution;
    private long gasCost;
}
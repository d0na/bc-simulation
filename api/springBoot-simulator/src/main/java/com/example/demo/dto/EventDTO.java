package com.example.demo.dto;

import lombok.Data;

@Data
public class EventDTO {
    private String event;
    private AbstractDistributionDTO distribution;
    private long gasCost;
}
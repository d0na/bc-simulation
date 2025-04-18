package com.example.demo.dto;

import lombok.Data;


@Data
public class DistributionDTO {
    private String type; // "uniform", "lognormal", etc.
    private AbstractParamsDistributionDTO params;
}

package com.example.demo.dto.distribution;

import lombok.Data;

@Data
public class LognormalParamsDTO {
    private double mean;
    private double deviation;
    private double scalingFactor;
}
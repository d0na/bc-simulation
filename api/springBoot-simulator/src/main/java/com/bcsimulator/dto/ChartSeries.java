package com.bcsimulator.dto;

import java.util.List;
public record ChartSeries(
        String label,
        List<Double> data
) {}
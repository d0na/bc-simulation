package com.bcsimulator.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;


@Data
@AllArgsConstructor
public class ChartDataResponseDTO {
    List<ChartSeries> series;
}

package com.bcsimulator.dto;

import lombok.Data;

import java.util.List;

@Data
public class ChartRequestDTO {
    List<DataSetRequestDTO> datasets;
    String chartType;
}

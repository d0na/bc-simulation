package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * @author francesco
 * @project springBoot-simulator
 */

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SimTaskletJobRequestDTO {

    private Integer numAggr;     // AggregationGranularity in secondi
    private Integer maxTime;     // SimulationDuration in secondi
    private Integer numRuns;
    private String dir;          // Percorso della directory
    private String simType;      // Tipo di simulazione, ad esempio: "SimParams5Scaled"
}

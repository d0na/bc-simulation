package com.example.demo.dto;

import com.example.demo.nmtsimulation.AggregationGranularity;
import com.example.demo.nmtsimulation.SimParams;
import com.example.demo.nmtsimulation.SimParams5Scaled;
import com.example.demo.nmtsimulation.SimulationDuration;
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

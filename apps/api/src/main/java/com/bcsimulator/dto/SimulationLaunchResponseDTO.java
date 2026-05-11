package com.bcsimulator.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SimulationLaunchResponseDTO {
    private String status;
    private String message;
    private String simulationName;
    private int numAggr;
    private int maxTime;
    private int numRuns;
    private String outFile;
    private SimulationRequestDTO configuration;
}

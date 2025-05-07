package com.bcsimulator.dto.graph;

import lombok.Data;

import java.util.List;

@Data
public class GraphRequestDTO {
    private String title;
    private String outputFormat;
    private String size;
    private String xlabel;
    private String ylabel;
    private String xRange;
    private String yRange;
    private String extraOptions;
    private boolean logscaleY;
    private List<DataFileDTO> dataFiles;
    private List<PlotConfigDTO> plots;
}

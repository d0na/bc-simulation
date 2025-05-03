package com.bcsimulator.dto.graph;

import com.bcsimulator.enums.PlotType;
import lombok.Data;

@Data
public class PlotConfigDTO {
    private String dataFileAlias;
    private String using; // es: "1:16", oppure "1:($16-$17):($16+$17)"
    private PlotType type;
    private String title;
    private String color;
    private String smooth;
    private double lineWidth;
    private FillConfigDTO fill;
}

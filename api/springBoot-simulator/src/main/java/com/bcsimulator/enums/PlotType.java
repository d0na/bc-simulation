package com.bcsimulator.enums;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum PlotType {
    LINES,
    FILLEDCURVES,
    POINTS,
    LINE;
    @JsonCreator
    public static PlotType fromString(String value) {
        return PlotType.valueOf(value.toUpperCase());
    }
}



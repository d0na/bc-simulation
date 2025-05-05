package com.bcsimulator.enums;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum SmoothType {
    UNIQUE,
    FREQUENCY,
    CSPLINES,
    ACSPLINES,
    BEZIER,
    SBEZIER;
    @JsonCreator
    public static SmoothType fromString(String value) {
        return SmoothType.valueOf(value.toUpperCase());
    }
}

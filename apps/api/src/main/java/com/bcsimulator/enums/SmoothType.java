package com.bcsimulator.enums;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum SmoothType {
    UNIQUE,
    NONE,
    FREQUENCY,
    CSPLINES,
    ACSPLINES,
    BEZIER,
    SBEZIER;
//    @JsonCreator
//    public static SmoothType fromString(String value) {
//        return SmoothType.valueOf(value.toUpperCase());
//    }

    @JsonCreator
    public static SmoothType fromString(String value) {
        if (value == null ) {
            return NONE;
        }
        try {
            return SmoothType.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return UNIQUE;
        }
    }
}

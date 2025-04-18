package com.example.demo.dto.distribution;

public enum DistributionType {
    NONE("None"),
    NORMAL("NormalProbDistrScaled"),
    EXPONENTIAL("ExponentialProbDistrScaled"),
    LOGNORMAL("LognormalProbDistrScaled"),
    UNIFORM("UniformProbDistr");

    private final String type;

    DistributionType(String type) {
        this.type = type;
    }

    public String getType() {
        return type;
    }
}

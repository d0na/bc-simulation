package com.example.demo.dto.distribution;

public enum DistributionType {
    NORMAL("NormalProbDistr"),
    NORMAL_SCALED("NormalProbDistrScaled"),
    EXPONENTIAL("ExponentialProbDistr"),
    EXPONENTIAL_SCALED("ExponentialProbDistrScaled"),
    LOGNORMAL("LognormalProbDistr"),
    LOGNORMAL_SCALED("LognormalProbDistrScaled"),
    UNIFORM("UniformProbDistr");

    private final String type;

    DistributionType(String type) {
        this.type = type;
    }

    public String getType() {
        return type;
    }
}

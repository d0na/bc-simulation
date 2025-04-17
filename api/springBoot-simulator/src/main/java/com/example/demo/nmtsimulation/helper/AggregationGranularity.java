package com.example.demo.nmtsimulation.helper;

/**
 * @author francesco
 * @project springBoot-simulator
 */
public enum AggregationGranularity {
    SECONDS(1),
    MINUTES(60),
    HOURS(3600);

    private final int seconds;

    AggregationGranularity(int interval) {
        this.seconds = interval;
    }

    public int getSeconds() {
        return seconds;
    }
}

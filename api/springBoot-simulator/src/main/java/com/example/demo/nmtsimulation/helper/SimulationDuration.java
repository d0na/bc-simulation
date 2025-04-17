package com.example.demo.nmtsimulation.helper;

/**
 * @author francesco
 * @project springBoot-simulator
 */
public enum SimulationDuration {
    ONE_DAY(86400),
    SEVEN_DAYS(604800),
    TEN_DAYS(864000),
    TWO_WEEKS(1209600),
    ONE_MONTH(2592000);

    private final int seconds;

    SimulationDuration(int seconds) {
        this.seconds = seconds;
    }

    public int getSeconds() {
        return seconds;
    }
}
package com.example.demo.batch.simulation;

import com.example.demo.dto.EventDTO;
import com.example.demo.dto.SimulationRequestDTO;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.SplittableRandom;


public class ResultsAggregated {
    SimulationRequestDTO simParams;
    Map<String, long[]> results;

    public ResultsAggregated(SimulationRequestDTO simParams) {
        this.simParams = simParams;
        this.results = new HashMap<>();
        this.results.put("gasTotal", new long[simParams.getNumRuns()]);
        // For each event creates a map entry with the Event name
        simParams.getEvents().stream().map(EventDTO::getEvent).forEach(event -> {
            this.results.put(event.toLowerCase(), new long[simParams.getNumRuns()]);
        });
    }

    /**
     * Computes
     *
     * @param time
     */
    public void compute(int time) {
        // Reset di tutti i valori
        for (Map.Entry<String, long[]> entry : results.entrySet()) {
            Arrays.fill(entry.getValue(), 0L);
        }

        SplittableRandom splittableRandom = new SplittableRandom();

        double randomDouble;
        int timeInner;


        for (int i = 0; i < simParams.getNumRuns(); i++) {
            for (int j = 0; j < simParams.getNumAggr(); j++) {
                randomDouble = splittableRandom.nextDouble();
                timeInner = time + j;

                // At time 0
                if (timeInner == 0) {
                    // Add the total gas cost of each EventDTO for the simulation
//                    this.results.get("gasTotal")[i] = simParams.getEvents().stream()
//                            .mapToLong(EventDTO::getGasCost)
//                            .sum();
                }

                // GasCost of the distribution of first level of events
                double finalRandomDouble = randomDouble;
                int finalTimeInner = timeInner;
                this.results.get("gasTotal")[i] =
                simParams.getEvents().stream()
                        .filter(event -> finalRandomDouble <= event.getDistribution().getProb(finalTimeInner))
                        .mapToLong(EventDTO::getGasCost)
                        .sum();
            }
        }
    }

    public static double computeAvg(long[] values) {
        long sumAvg = 0;
        for (long value : values) {
            sumAvg += value;
        }
        return (1.0 * sumAvg) / values.length;
    }

    public static double computeStd(long[] values, double mean) {
        double sumStd = 0;
        for (long value : values) {
            sumStd += (value - mean) * (value - mean);
        }
        return Math.sqrt(sumStd / values.length);
    }
}
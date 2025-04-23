package com.example.demo.batch.simulation;

import com.example.demo.dto.AbstractDistributionDTO;
import com.example.demo.dto.EventDTO;
import com.example.demo.dto.SimulationRequestDTO;

import java.util.*;


public class ResultsAggregated {
    SimulationRequestDTO simParams;
    Map<String, long[]> results;
    Map<String, LinkedList<Integer>[]> instances;

    final String gasTotal = "gas_Total";

    public ResultsAggregated(SimulationRequestDTO simParams) {
        this.simParams = simParams;
        this.results = new HashMap<>();
        this.instances = new HashMap<>();
        this.results.put(gasTotal, new long[simParams.getNumRuns()]);
        // For each event creates a map entry with the Event name
//        simParams.getEvents().stream().map(EventDTO::getEventName).forEach(event -> {
//            this.results.put(event, new long[simParams.getNumRuns()]);
//        });
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

//                // Get costs of events that not have a probability distribution on the first level
//                if (timeInner == 0) {
//                    this.results.get(gasTotal)[i] = simParams.getEvents().stream()
//                            .filter(event -> event.getProbabilityDistribution() == null)
//                            .mapToLong(EventDTO::getGasCost)
//                            .sum();
//                }

                //random creation of first related events
                double finalRandomDouble = randomDouble;
                int finalTimeInner = timeInner;
                int finalI = i;
                simParams.getEvents().forEach(event -> processEvent(event, finalRandomDouble, finalTimeInner, finalI, 0));


                // GasCost of the distribution of first level of events
//                double finalRandomDouble = randomDouble;
//                int finalTimeInner = timeInner;
//                this.results.get("gasTotal")[i] = simParams.getEvents().stream()
//                        .filter(event -> event.getProbabilityDistribution() != null)
//                        .filter(event -> finalRandomDouble <= event.getProbabilityDistribution().getProb(finalTimeInner))
//                        .mapToLong(EventDTO::getGasCost)
//                        .sum();

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

    private void processEvent(EventDTO event, double randomDouble, int timeInner, int i, int refTime) {
        AbstractDistributionDTO dist = event.getProbabilityDistribution();
        double prob = (dist != null) ? dist.getProb(timeInner - refTime) : 0;

        // Get costs of events that not have a probability distribution on the first level
        if (timeInner == 0 && event.getProbabilityDistribution() == null) {
//            this.results.computeIfAbsent("time_" + event.getEventName(), k -> new long[simParams.getNumRuns()]);
            this.results.computeIfAbsent("gas_" + event.getEventName(), k -> new long[simParams.getNumRuns()]);
            this.results.get(gasTotal)[i] += event.getGasCost();
            this.results.get("gas_" + event.getEventName())[i] = event.getGasCost();
        }

        if (randomDouble <= prob) {
            this.instances.computeIfAbsent("num_" + event.getEventName(), k -> createLinkedListArray(simParams.getNumRuns()));
            this.results.computeIfAbsent("gas_" + event.getEventName(), k -> new long[simParams.getNumRuns()]);
            this.instances.get("num_" + event.getEventName())[i].add(timeInner);
            this.results.get("gas_" + event.getEventName())[i] = event.getGasCost();
            this.results.get(gasTotal)[i] += event.getGasCost();
        }

        if (event.getRelatedEvents() != null && !event.getRelatedEvents().isEmpty()) {
            LinkedList[] instanceList = this.instances.get("num_" + event.getEventName());
            if (instanceList != null) {
                for (int k = 0; k < instanceList.length; k++) {
                    for (EventDTO related : event.getRelatedEvents()) {
                        processEvent(related, randomDouble, timeInner, i, k);
                    }
                }
            }
        }
    }

    /**
     * Generates a report with the size of the dynamic arrays used to store the instances of nested events
     */
    public void generateInstanceSizeReport() {
        for (Map.Entry<String, LinkedList<Integer>[]> entry : instances.entrySet()) {
            String key = entry.getKey();
            LinkedList<Integer>[] lists = entry.getValue();

            int numSteps = simParams.getNumRuns();
            int totalSize = 0;
            int minSize = Integer.MAX_VALUE;
            int maxSize = Integer.MIN_VALUE;

            for (int i = 0; i < numSteps; i++) {
                LinkedList<Integer> currentList = lists[i];
                int size = (currentList != null) ? currentList.size() : 0;

                totalSize += size;
                if (size < minSize) minSize = size;
                if (size > maxSize) maxSize = size;
            }

            double avgSize = (double) totalSize / numSteps;

            System.out.println("\t " + key + " \t -> Tot: " + totalSize + "\t  Min: " + minSize + "\t  Max: " + maxSize + "\t  Media: " + avgSize);
        }
    }


    private LinkedList<Integer>[] createLinkedListArray(int size) {
        LinkedList<Integer>[] arr = new LinkedList[size];
        for (int j = 0; j < size; j++) {
            arr[j] = new LinkedList<>();
        }
        return arr;
    }
}
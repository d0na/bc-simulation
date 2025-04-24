package com.example.demo.batch.simulation;

import com.example.demo.dto.AbstractDistributionDTO;
import com.example.demo.dto.EventDTO;
import com.example.demo.dto.SimulationRequestDTO;

import java.util.*;

import static com.example.demo.batch.simulation.Simulation.printStats;


public class ResultsAggregated {
    // Parameters of the simulation
    SimulationRequestDTO simParams;
    // Maps the event name to an array of longs, one for each run
    Map<String, long[]> results;
    // Maps the event name to an array of linked lists, one for each run
    Map<String, LinkedList<Integer>[]> instances;

    final String gasTotal = "gasTotal";

    public ResultsAggregated(SimulationRequestDTO simParams) {
        this.simParams = simParams;
        this.results = new HashMap<>();
        this.instances = new HashMap<>();
        this.results.put(gasTotal, new long[simParams.getNumRuns()]);
        simParams.getEvents().forEach(this::initEventStructures);
    }

    /**
     * Computes the results for a given time
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

                //random creation of first related events
                double finalRandomDouble = randomDouble;
                int finalTimeInner = timeInner;
                int finalI = i;
                simParams.getEvents().forEach(event -> processEvent(event, finalRandomDouble, finalTimeInner, finalI, 0));
            }
        }
    }

    /**
     * Computes the average of an array of values
     *
     * @param values
     * @return
     */
    public static double computeAvg(long[] values) {
        long sumAvg = 0;
        for (long value : values) {
            sumAvg += value;
        }
        return (1.0 * sumAvg) / values.length;
    }

    /**
     * Computes the standard deviation of an array of values
     *
     * @param values
     * @param mean
     * @return
     */
    public static double computeStd(long[] values, double mean) {
        double sumStd = 0;
        for (long value : values) {
            sumStd += (value - mean) * (value - mean);
        }
        return Math.sqrt(sumStd / values.length);
    }

    /**
     * Processes an event and updates the results
     *
     * @param event
     * @param randomDouble
     * @param timeInner
     * @param i
     * @param refTime
     */
    private void processEvent(EventDTO event, double randomDouble, int timeInner, int i, int refTime) {
        AbstractDistributionDTO dist = event.getProbabilityDistribution();
        double prob = (dist != null) ? dist.getProb(timeInner - refTime) : 0;

        // Get costs of events that not have a probability distribution on the first level
        if (timeInner == 0 && event.getProbabilityDistribution() == null) {
            this.results.get(gasTotal)[i] += event.getGasCost();
            this.results.get(toCamelCase("gas_" + event.getEventName()))[i] = event.getGasCost();
        }

        if (randomDouble <= prob) {
            if (event.getRelatedEvents() != null && !event.getRelatedEvents().isEmpty()) {
                this.instances.get(toCamelCase("num_" + event.getEventName()))[i].add(timeInner);
            }
            this.results.get(toCamelCase("gas_" + event.getEventName()))[i] = event.getGasCost();
            this.results.get(gasTotal)[i] += event.getGasCost();
        }

        if (event.getRelatedEvents() != null && !event.getRelatedEvents().isEmpty()) {
            LinkedList[] instanceList = this.instances.get(toCamelCase("num_" + event.getEventName()));
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
     * Initializes the structures for the event and its related events
     *
     * @param event
     */
    private void initEventStructures(EventDTO event) {
        // Initializes the results array for the event
        this.results.computeIfAbsent(toCamelCase("gas_" + event.getEventName()), k -> new long[simParams.getNumRuns()]);

        if (event.getProbabilityDistribution() != null && event.getRelatedEvents() != null && !event.getRelatedEvents().isEmpty()) {
            // Initializes the instances array for the event only if it has related events
            this.instances.computeIfAbsent(toCamelCase("num_" + event.getEventName()), k -> createLinkedListArray(simParams.getNumRuns()));
        }
        // If event has related events, initializes the structures for them too
        if (event.getRelatedEvents() != null && !event.getRelatedEvents().isEmpty()) {
            for (EventDTO related : event.getRelatedEvents()) {
                initEventStructures(related);
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

    /***
     * Generates a report with the size of the dynamic arrays used
     * @param lists
     * @return
     */
    public  List<String> generateInstanceSizeReportForValue(LinkedList<Integer>[] lists) {
        List<String> result = new ArrayList<>();
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
        result.add(Integer.toString(totalSize));
        result.add(Double.toString(avgSize));
        result.add(Integer.toString(minSize));
        result.add(Integer.toString(maxSize));
        return result;
    }





    /**
     * Creates an array of linked lists with the specified size
     *
     * @param size
     * @return
     */
    private LinkedList<Integer>[] createLinkedListArray(int size) {
        LinkedList<Integer>[] arr = new LinkedList[size];
        for (int j = 0; j < size; j++) {
            arr[j] = new LinkedList<>();
        }
        return arr;
    }

    /**
     * Generates a CSV header from the internal maps
     *
     * @param instances
     * @param results
     * @param separator
     * @return
     */
    private String generateCSVHeaderWithStats(Map<String, ?> results, Map<String, ?> instances, String separator) {

        // For each event creates a map entry with the Event name
        List<String> headers = new ArrayList<>();

        for (String key : results.keySet()) {
            headers.add(toCamelCase("mean_" + key));
            headers.add(toCamelCase("std_" + key));
        }

        // Per ogni chiave di instances genero le 4 intestazioni
        for (String key : instances.keySet()) {
            headers.add(toCamelCase("tot_" + key));
            headers.add(toCamelCase("avg_" + key));
            headers.add(toCamelCase("min_" + key));
            headers.add(toCamelCase("max_" + key));
        }

        // Costruisco la stringa CSV
        return String.join(separator, headers);
    }

    public String generateCSVComputationStats(String separator) {
        List<String> headers = new ArrayList<>();

        for (String key : results.keySet()) {
            headers.add(Double.toString(computeAvg(results.get(key))));
            headers.add(Double.toString(computeStd(results.get(key),computeAvg(results.get(key)))));

        }
        for (String key : instances.keySet()) {
            List<String> stats = generateInstanceSizeReportForValue(instances.get(key));
            headers.add(stats.get(0));
            headers.add(stats.get(1));
            headers.add(stats.get(2));
            headers.add(stats.get(3));
        }
        return String.join(separator, headers);
    }


    /**
     * Generates a CSV header from the internal maps
     *
     * @param separator
     * @return
     */
    public String generateCSVHeader(String separator) {
        return "time;" + generateCSVHeaderWithStats(results, instances, separator);
    }

    public static String toCamelCase(String input) {
        if (!input.contains(" ") && !input.contains("_") && !input.contains("-")) {
            // Se è già in camelCase o PascalCase, abbassa solo la prima lettera
            return Character.toLowerCase(input.charAt(0)) + input.substring(1);
        }

        StringBuilder result = new StringBuilder();
        boolean nextUpper = false;

        for (char c : input.toCharArray()) {
            if (c == ' ' || c == '_' || c == '-') {
                nextUpper = true;
            } else {
                if (result.isEmpty()) {
                    result.append(Character.toLowerCase(c));
                } else if (nextUpper) {
                    result.append(Character.toUpperCase(c));
                    nextUpper = false;
                } else {
                    result.append(c);
                }
            }
        }

        return result.toString();
    }
}
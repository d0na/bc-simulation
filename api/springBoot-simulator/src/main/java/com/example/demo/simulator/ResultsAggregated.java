package com.example.demo.simulator;

import com.example.demo.dto.AbstractDistributionDTO;
import com.example.demo.dto.EventDTO;
import com.example.demo.dto.SimulationRequestDTO;

import java.util.*;


public class ResultsAggregated {
    // Parameters of the simulation
    SimulationRequestDTO simParams;
    // Maps the event name to an array of longs, one for each run
    Map<String, long[]> results;
    // Maps the event name to an array of linked lists, one for each run
    Map<String, LinkedList<Integer>[]> entities;
    String seedEvent;
    int count;

    final String gasTotal = "gasTotal";

    public ResultsAggregated(SimulationRequestDTO simParams) {
        this.simParams = simParams;
        this.results = new HashMap<>();
        this.entities = new HashMap<>();
        this.results.put(gasTotal, new long[simParams.getNumRuns()]);
        simParams.getEvents().forEach(this::initEventStructures);
        simParams.getEntities().forEach(this::initEntities);
        count = 0;
        this.seedEvent = "";
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
                simParams.getEvents().forEach(event -> processEvent(event, finalRandomDouble,
                        finalTimeInner, finalI, simParams.getEntities()));
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
     */

    private void processEvent(EventDTO event, double randomDouble, int timeInner, int i, List<String> entities) {

        AbstractDistributionDTO dist = event.getProbabilityDistribution();
        double prob = (dist != null) ? dist.getProb(timeInner) : 1;

        if (timeInner == 0 && event.getProbabilityDistribution() == null) {
            addGas(i, event.getEventName(), event.getGasCost());
        }

        if (event.getInstanceOf() != null && event.getDependOn() == null) {
            if (randomDouble <= prob) {
                this.entities.get(toCamelCase(event.getInstanceOf()))[i].add(timeInner);
                addGas(i, event.getEventName(), event.getGasCost());
            }
        }

        if (event.getDependOn() != null) {
            LinkedList<Integer>[] instanceList = this.entities.get(toCamelCase(event.getDependOn()));
            if (instanceList != null) {
                for (Integer instanceTime : instanceList[i]) {
                    double probTimeDep = (dist != null) ? dist.getProb(timeInner - instanceTime) : 1;
                    if (randomDouble <= probTimeDep) {
                        if (event.getInstanceOf() != null) {
                            this.entities.get(toCamelCase(event.getInstanceOf()))[i].add(timeInner);
                        }
                        addGas(i, event.getEventName(), event.getGasCost());
                    }
                }
            }
        }
    }

    private void addGas(int runIndex, String eventName, long gasValue) {
        this.results.get(gasTotal)[runIndex] += gasValue;
        this.results.get(toCamelCase("gas_" + eventName))[runIndex] = gasValue;
    }


    /**
     * Initializes the structures for the event and its related events
     *
     * @param event
     */
    private void initEventStructures(EventDTO event) {

        // Initializes the results array for the event
        this.results.computeIfAbsent(toCamelCase("gas_" + event.getEventName()), k -> new long[simParams.getNumRuns()]);
    }

    private void initEntities(String entityName) {
        // Initializes the results array for the event
        if (entityName != null) {
            this.entities.computeIfAbsent(toCamelCase(entityName), k -> createLinkedListArray(simParams.getNumRuns()));
        }
    }

    /***
     * Generates a report with the size of the dynamic arrays used
     * @param lists
     * @return
     */
    public Map<String, String> generateInstanceSizeReportForValue(LinkedList<Integer>[] lists) {
        Map<String, String> result = new HashMap<>();
        int numSteps = simParams.getNumRuns();
        int totalSize = 0;
        int minSize = Integer.MAX_VALUE;
        int maxSize = Integer.MIN_VALUE;

        // Prima passata: calcolo tot, min, max
        int[] sizes = new int[numSteps];  // salvo le size per riuso nel calcolo della std dev
        for (int i = 0; i < numSteps; i++) {
            LinkedList<Integer> currentList = lists[i];
            int size = (currentList != null) ? currentList.size() : 0;
            sizes[i] = size;

            totalSize += size;
            if (size < minSize) minSize = size;
            if (size > maxSize) maxSize = size;
        }

        double avgSize = (double) totalSize / numSteps;

        // Seconda passata: calcolo deviazione standard
        double sumSquaredDiffs = 0.0;
        for (int i = 0; i < numSteps; i++) {
            sumSquaredDiffs += Math.pow(sizes[i] - avgSize, 2);
        }
        double stdDev = Math.sqrt(sumSquaredDiffs / numSteps);

        // Inserisco tutto nel risultato
        result.put("totalSize", Integer.toString(totalSize));
        result.put("avgSize", Double.toString(avgSize));
        result.put("minSize", Integer.toString(minSize));
        result.put("maxSize", Integer.toString(maxSize));
        result.put("stdDev", Double.toString(stdDev));

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
            headers.add(toCamelCase("stdDev" + key));
        }

        // Costruisco la stringa CSV
        return String.join(separator, headers);
    }

    public String generateCSVComputationStats(String separator) {
        List<String> headers = new ArrayList<>();

        for (String key : results.keySet()) {
            headers.add(Double.toString(computeAvg(results.get(key))));
            headers.add(Double.toString(computeStd(results.get(key), computeAvg(results.get(key)))));

        }
        for (String key : entities.keySet()) {
            Map<String, String> stats = generateInstanceSizeReportForValue(entities.get(key));
            headers.add(stats.get("totalSize"));
            headers.add(stats.get("avgSize"));
            headers.add(stats.get("minSize"));
            headers.add(stats.get("maxSize"));
            headers.add(stats.get("stdDev"));
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
        return "time" + separator+ generateCSVHeaderWithStats(results, entities, separator);
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
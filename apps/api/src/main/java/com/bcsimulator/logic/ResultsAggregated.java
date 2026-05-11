package com.bcsimulator.logic;

import com.bcsimulator.dto.AbstractDistributionDTO;
import com.bcsimulator.dto.EventDTO;
import com.bcsimulator.dto.SimulationRequestDTO;
import com.bcsimulator.dto.EventDependencyDTO;

import java.util.*;

public class ResultsAggregated {
    // Parameters of the simulation
    SimulationRequestDTO simParams;
    // Maps the event name to an array of longs, one for each run
    Map<String, long[]> results;
    Map<String, long[]> counters;
    // Maps the event name to an array of linked lists, one for each run
    Map<String, LinkedList<Integer>[]> entities;
    Map<String, LinkedList<Integer>[]> aggregatedEntities;
    // Counter for event E -> run -> entityTime of I (instance) → how many times event E has been triggered
    private final Map<String, Map<Integer, Map<Integer, Integer>>> dependencyTriggerCounts = new HashMap<>();

    final String gasTotal = "gasTotal";


    public ResultsAggregated(SimulationRequestDTO simParams) {
        this.simParams = simParams;
        this.results = new HashMap<>();
        this.counters = new HashMap<>();
        this.entities = new HashMap<>();
        this.aggregatedEntities = new HashMap<>();
        this.results.put(gasTotal, new long[simParams.getNumRuns()]);
        simParams.getEvents().forEach(this::initEventStructures);
        simParams.getEntities().forEach(this::initEntities);
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

        // Calculate percentage and time values
        double percentage = (time * 100.0) / simParams.getMaxTime();
        String timeDisplay = String.format("(%d sec, %.2f min, %.2f h, %.2f d)", 
            time,
            time / 60.0,
            time / 3600.0,
            time / 86400.0);

        // Build entity counts string using already calculated averages
        StringBuilder entityCounts = new StringBuilder(" | Entities: ");
        for (String entity : simParams.getEntities()) {
            String entityKey = toCamelCase(entity);
            LinkedList<Integer>[] entityList = this.entities.get(entityKey);
            if (entityList != null) {
                Map<String, String> stats = generateInstanceSizeReportForValue(entityList);
                double avgCount = Double.parseDouble(stats.get("avgSize"));
                entityCounts.append(entity).append("=").append(String.format("%.1f", avgCount)).append(", ");
            }
        }
        // Remove last comma and space if any entities were added
        if (entityCounts.length() > 12) {
            entityCounts.setLength(entityCounts.length() - 2);
        }

        System.out.println(String.format("Computing time step: %d %s - %.2f%% completed%s", 
                                       time, timeDisplay, percentage, entityCounts.toString()));

        SplittableRandom splittableRandom = new SplittableRandom();
        double randomDouble;
        int timeInner;


        for (int i = 0; i < simParams.getNumRuns(); i++) {
//            resetEntityCountsForRun(i); // ← resetta i contatori per il run corrente

            for (int j = 0; j < simParams.getNumAggr(); j++) {
                randomDouble = splittableRandom.nextDouble();
                timeInner = time + j;

                //random creation of first related events
                double curRandom = randomDouble;
                int curTimerInner = timeInner;
                int curRun = i;
                simParams.getEvents().forEach(event -> processEvent(event, curRandom, curTimerInner, curRun));
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
     * @param run
     */

    private void processEvent(EventDTO event, double randomDouble, int timeInner, int run) {
        initEventStructures(event); // init structures

        String instanceOf = event.getInstanceOf();
        String eventName = event.getEventName();
        String eventKey = toCamelCase(eventName);
        long gasCost = event.getGasCost();

        // Skip events without dependencies
        if (event.getDependencies() == null || event.getDependencies().isEmpty()) {
            return;
        }

        // For dependencies without dependOn (global probabilities), we just need to check once
        boolean globalDependenciesSatisfied = event.getDependencies().stream()
                .filter(d -> d.getDependOn() == null)
                .allMatch(d -> {
                    double probTimeDep = d.getProbabilityDistribution().getProb(timeInner);
                    return randomDouble <= probTimeDep;
                });

        if (!globalDependenciesSatisfied) {
            return;
        }

        // Check if all entity-dependent probabilities are satisfied
        boolean allDependenciesSatisfied = true;
        
        // For each entity-dependent dependency
        for (EventDependencyDTO dependency : event.getDependencies()) {
            if (dependency.getDependOn() != null) {
                LinkedList<Integer>[] entityList = this.entities.get(toCamelCase(dependency.getDependOn()));
                
                // Skip if required entities are missing
                if (entityList == null || entityList[run] == null || entityList[run].isEmpty()) {
                    allDependenciesSatisfied = false;
                    break;
                }

                AbstractDistributionDTO dist = dependency.getProbabilityDistribution();
                String maxProbabilityMatchesStr = dependency.getMaxProbabilityMatches();
                Integer maxProbabilityMatches = parseMaxProbabilityMatches(maxProbabilityMatchesStr, run);
                
                boolean dependencySatisfied = false;
                for (Integer entityTime : entityList[run]) {
                    double probTimeDep = dist.getProb(timeInner - entityTime);
                    boolean probabilityCheck = randomDouble <= probTimeDep;
                    boolean limitCheck = maxProbabilityMatches == null || maxProbabilityMatches <= 0 ||
                            isBelowPerEntityLimit(eventKey, run, entityTime, maxProbabilityMatches);

                    if (probabilityCheck && limitCheck) {
                        dependencySatisfied = true;
                        break;
                    }
                }
                
                if (!dependencySatisfied) {
                    allDependenciesSatisfied = false;
                    break;
                }
            }
        }
        
        // Only if all dependencies are satisfied, create the event instance
        if (allDependenciesSatisfied) {
            if (instanceOf != null) {
                this.entities.get(toCamelCase(instanceOf))[run].add(timeInner);
                this.aggregatedEntities.get(toCamelCase(instanceOf))[run].add(timeInner);
            }
            addGas(run, eventName, gasCost);
            // Increment for all relevant entities
            for (EventDependencyDTO dependency : event.getDependencies()) {
                if (dependency.getDependOn() != null) {
                    LinkedList<Integer>[] entityList = this.entities.get(toCamelCase(dependency.getDependOn()));
                    for (Integer entityTime : entityList[run]) {
                        incrementEntityCount(eventKey, run, entityTime);
                    }
                }
            }
        }
    }


    private Integer parseMaxProbabilityMatches(String maxProbabilityMatchesStr, int run) {
        if (maxProbabilityMatchesStr == null) return null;
        
        if (maxProbabilityMatchesStr.startsWith("#")) {
            String entityName = maxProbabilityMatchesStr.substring(1);
            LinkedList<Integer>[] entityList = this.entities.get(toCamelCase(entityName));
            if (entityList != null && entityList[run] != null) {
                return entityList[run].size();
            }
            return null;
        }
        
        try {
            return Integer.parseInt(maxProbabilityMatchesStr);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private void addGas(int runIndex, String eventName, long gasValue) {
        this.results.get(gasTotal)[runIndex] += gasValue;
        this.results.get(toCamelCase("gas_" + eventName))[runIndex] += gasValue;
        // counts the number of times the event has been triggered
        this.counters.get(toCamelCase(eventName))[runIndex]++;
    }


    /**
     * Initializes the structures for the event and its related events
     *
     * @param event
     */
    private void initEventStructures(EventDTO event) {

        // Initializes the results array for the event
        this.results.computeIfAbsent(toCamelCase("gas_" + event.getEventName()), k -> new long[simParams.getNumRuns()]);
        this.counters.computeIfAbsent(toCamelCase(event.getEventName()), k -> new long[simParams.getNumRuns()]);
    }

    private void initEntities(String entityName) {
        // Initializes the results array for the event
        if (entityName != null) {
            this.entities.computeIfAbsent(toCamelCase(entityName), k -> createLinkedListArray(simParams.getNumRuns()));
            this.aggregatedEntities.computeIfAbsent(toCamelCase(entityName), k -> createLinkedListArray(simParams.getNumRuns()));
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


    /***
     * Generates a report with the size of the dynamic arrays used
     * @param lists
     * @return
     */
    public Map<String, String> generateAggregatedInstanceSizeReportForValue(LinkedList<Integer>[] lists) {
        Map<String, String> result = new HashMap<>();
        int numSteps = simParams.getNumRuns();
        int totalSize = 0;
//        int minSize = Integer.MAX_VALUE;
//        int maxSize = Integer.MIN_VALUE;

        // Prima passata: calcolo tot, min, max
        int[] sizes = new int[numSteps];  // salvo le size per riuso nel calcolo della std dev
        for (int i = 0; i < numSteps; i++) {
            LinkedList<Integer> currentList = lists[i];
            int size = (currentList != null) ? currentList.size() : 0;
            sizes[i] = size;

            totalSize += size;
//            if (size < minSize) minSize = size;
//            if (size > maxSize) maxSize = size;
        }

//        double avgSize = (double) totalSize / numSteps;
//
//        // Seconda passata: calcolo deviazione standard
//        double sumSquaredDiffs = 0.0;
//        for (int i = 0; i < numSteps; i++) {
//            sumSquaredDiffs += Math.pow(sizes[i] - avgSize, 2);
//        }
//        double stdDev = Math.sqrt(sumSquaredDiffs / numSteps);

        // Inserisco tutto nel risultato
        result.put("totalAggrSize", Integer.toString(totalSize));
//        result.put("avgSize", Double.toString(avgSize));
//        result.put("minSize", Integer.toString(minSize));
//        result.put("maxSize", Integer.toString(maxSize));
//        result.put("stdDev", Double.toString(stdDev));

        // Reset solo per il totalSize dopo averlo salvato
        for (LinkedList<Integer> list : lists) {
            if (list != null) {
                list.clear();
            }
        }

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
     * @param separator
     * @return
     */
    private String generateCSVHeaderWithStats(String separator) {
        int count = 2;
        // For each event creates a map entry with the Event name
        List<String> headers = new ArrayList<>();

        for (String key : results.keySet()) {
            headers.add(toCamelCase(key + "_mean(" + count + ")"));
            count++;
            headers.add(toCamelCase(key + "_std(" + count + ")"));
            count++;
        }

        for (String key : counters.keySet()) {
            headers.add(toCamelCase(key + "_mean(" + count + ")"));
            count++;
            headers.add(toCamelCase(key + "_std(" + count + ")"));
            count++;
        }
        // Per ogni chiave di instances genero le 4 intestazioni
        for (String key : entities.keySet()) {
            headers.add(toCamelCase("tot_" + key + "(" + count + ")"));
            count++;
            headers.add(toCamelCase("avg_" + key + "(" + count + ")"));
            count++;
            headers.add(toCamelCase("min_" + key + "(" + count + ")"));
            count++;
            headers.add(toCamelCase("max_" + key + "(" + count + ")"));
            count++;
            headers.add(toCamelCase("std_" + key + "(" + count + ")"));
            count++;
        }
        // Per ogni chiave di instances genero 1 intestazione per contare le istanze totali di ogni aggregazione
        for (String key : aggregatedEntities.keySet()) {
            headers.add(toCamelCase("totAggr_" + key + "(" + count + ")"));
            count++;
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

        for (String key : counters.keySet()) {
            headers.add(Double.toString(computeAvg(counters.get(key))));
            headers.add(Double.toString(computeStd(counters.get(key), computeAvg(counters.get(key)))));
        }

        for (String key : entities.keySet()) {
            Map<String, String> stats = generateInstanceSizeReportForValue(entities.get(key));
            headers.add(stats.get("totalSize"));
            headers.add(stats.get("avgSize"));
            headers.add(stats.get("minSize"));
            headers.add(stats.get("maxSize"));
            headers.add(stats.get("stdDev"));
        }

        for (String key : aggregatedEntities.keySet()) {
            // 	totalAggrSize: the total number of instances of the aggregated entity summed over all runs (i.e. the sum of all instances of the entity in all runs)
            Map<String, String> stats = generateAggregatedInstanceSizeReportForValue(aggregatedEntities.get(key));
            headers.add(stats.get("totalAggrSize"));
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
        return "time" + separator + generateCSVHeaderWithStats(separator);
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

    private boolean isBelowPerEntityLimit(String eventKey, int run, int entityTime, int maxProbabilityMatches) {
        Map<Integer, Map<Integer, Integer>> runMap = dependencyTriggerCounts
                .computeIfAbsent(eventKey, k -> new HashMap<>());
        Map<Integer, Integer> entityMap = runMap.computeIfAbsent(run, k -> new HashMap<>());
        int current = entityMap.getOrDefault(entityTime, 0);
        return current < maxProbabilityMatches;
    }

    public void incrementEntityCount(String event, int run, int entity) {
        dependencyTriggerCounts
                .computeIfAbsent(event, k -> new HashMap<>())
                .computeIfAbsent(run, k -> new HashMap<>())
                .merge(entity, 1, Integer::sum);
    }

//    private void resetEntityCountsForRun(int run) {
//        for (Map<Integer, Map<Integer, Integer>> runMap : dependencyTriggerCounts.values()) {
//            runMap.remove(run);
//        }
//    }
}
package com.example.demo.simulator;

import com.example.demo.dto.SimulationRequestDTO;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.io.BufferedWriter;
import java.io.IOException;

@AllArgsConstructor
@Slf4j
public class Simulation {
    SimulationRequestDTO simParams;

    public void run(BufferedWriter bw) throws IOException {
        long time = System.currentTimeMillis();
        ResultsAggregated resultsAggregated = new ResultsAggregated(simParams);
        double resultMean, resultStd;
        String separator = "\t";

        String header = resultsAggregated.generateCSVHeader(separator);
        bw.write(header);
        bw.newLine();


        for (int t = 0; t < simParams.getMaxTime(); t = t + simParams.getNumAggr()) {

            // Only print every 2000 steps for log reasons and update time every 2000 steps per aggregation
            if (t % (simParams.getNumAggr() * 2000) == 0) {
                System.out.println("Sim run at time " + t + "/" + simParams.getMaxTime() + " in time " + (System.currentTimeMillis() - time) + " ms.");
                time = System.currentTimeMillis();
            }

            // Run the simulation step
            resultsAggregated.compute(t);
            String s = resultsAggregated.generateCSVComputationStats(separator);
            bw.write(t + separator + s);
            bw.newLine();
            // total gas stats mean (average) and std (standard deviation)

//            resultsAggregated.results.forEach((key, value) -> {
//                printStats(resultsAggregated.results.get(key));
//            });
//            resultsAggregated.generateInstanceSizeReport();
        }

//        resultsAggregated.results.forEach((key, value) -> {
//            if (key.contains("time_")) {
//                System.out.print(key + "\t" + ":" + value.length + "\t");
//            }
//        });
//        System.out.println();
//        System.out.println("Count:"+resultsAggregated.count);
        System.out.println("Ending sim of " + simParams.getNumRuns() + " runs.");
    }

    /**
     * Prints the mean and standard deviation of the results
     *
     * @param result
     */
    public static String printStats(long[] result, String separator) {
        StringBuilder sb = new StringBuilder();
        double mean = ResultsAggregated.computeAvg(result);
        double stdDev = ResultsAggregated.computeStd(result, mean);
        return sb.append(separator).append(mean).append(separator).append(stdDev).toString();
    }


}



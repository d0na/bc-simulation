package com.example.demo.batch.simulation;

import com.example.demo.dto.SimulationRequestDTO;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@AllArgsConstructor
@Slf4j
public class Simulation {
    SimulationRequestDTO simParams;
    public void run() {
        long time = System.currentTimeMillis();
        ResultsAggregated resultsAggregated = new ResultsAggregated(simParams);
        double resultMean, resultStd;
//        simParams.getEvents().forEach(eventDTO -> {
//                    AbstractDistributionDTO dist = eventDTO.getDistribution();
//
//                    switch (dist.getType().toString()) {
//                        case "UNIFORM" -> {
//                            UniformDistributionDTO u = dist.as(UniformDistributionDTO.class);
//                            // usa u.getParams()
//                            UniformParamsDTO up = u.getParams();
//
//                        }
//                        case "LOGNORMAL" -> {
//                            LognormalDistributionDTO l = dist.as(LognormalDistributionDTO.class);
//                            // usa l.getParams()
//                            LognormalParamsDTO ul = l.getParams();
//                        }
//                    }
//                }
//        );


        for (int t = 0; t < simParams.getMaxTime(); t = t + simParams.getNumAggr()) {

            // Only print every 2000 steps for log reasons and update time every 2000 steps per aggregation
            if (t % (simParams.getNumAggr() * 2000) == 0) {
                System.out.println("Sim run at time " + t + "/" + simParams.getMaxTime() + " in time " + (System.currentTimeMillis() - time) + " ms.");
                time = System.currentTimeMillis();
            }

            // Run the simulation step
            resultsAggregated.compute(t);

            // total gas stats mean (average) and std (standard deviation)
            printStats(resultsAggregated.results.get("gasTotal"));

        }
        System.out.println("Ending sim of "+simParams.getNumRuns()+" runs.");
    }

    /**
     * Prints the mean and standard deviation of the results
     * @param result
     */
    public static void printStats(long[] result) {
        long[] values = result;
        double mean = ResultsAggregated.computeAvg(values);
        double stdDev = ResultsAggregated.computeStd(values, mean);
        System.out.println("\t" + mean + "\t" + stdDev);
    }
}



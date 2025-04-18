package com.example.demo.batch.simulation;

import lombok.AllArgsConstructor;

@AllArgsConstructor
public class Simulation {
    int maxTime;
    int numAggr;
    int numRuns;

    public void run() {
        long time = System.currentTimeMillis();



        for (int i = 0; i < maxTime; i = i + numAggr) {
            if (i % (numAggr * 2000) == 0) {
                System.out.println("Sim run at time " + i + "/" + maxTime + " in time " + (System.currentTimeMillis() - time) + " ms.");
                time = System.currentTimeMillis();
            }
        }
    }
}

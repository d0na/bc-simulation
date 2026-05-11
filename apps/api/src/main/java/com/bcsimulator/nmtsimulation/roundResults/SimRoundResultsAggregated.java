package com.bcsimulator.nmtsimulation.roundResults;

import com.bcsimulator.nmtsimulation.simParam.SimParams;

import java.util.LinkedList;
import java.util.Objects;
import java.util.SplittableRandom;

/**
 * Is responsible for running multiple simulations (NUMRUNS) of a given model (SimParams) and aggregating the results
 * over time, based on an interval (NUMAGGR).
 * <p>
 * <p>
 * simulazione aggregata su più intervalli di tempo, utile per analizzare il consumo
 * di gas e la dinamica di creazione/aggiornamento di entità (creator, asset)
 * in un sistema simile a un'infrastruttura blockchain (tipicamente Non-Fungible
 * Token con politiche e attributi).
 * <p>
 * Effettuare NUMRUNS simulazioni indipendenti, ciascuna delle quali simula il comportamento del sistema per un
 * intervallo di tempo aggregato lungo NUMAGGR secondi, e raccoglie statistiche su:
 * -Consumo di gas per vari tipi di operazioni
 * -Numero di creator e asset creati
 * -Statistiche derivate (max, min, media, deviazione standard)
 *
 * @author brodo
 */
public class SimRoundResultsAggregated {

    final int NUMRUNS;     // Number of simulations to run for each time interval

    // Durata temporale dell’intervallo aggregato (in secondi)
    final int NUMAGGR;     // Number of time intervals to aggregate results (in seconds)
    SimParams sim;         // Parameters of the simulation (probabilities, gas costs, etc.)

    // List of creators and assets for each simulation run
    private LinkedList<Integer>[] creators;
    private LinkedList<Integer>[] assets;

    //gas expenditures (gas costs) for this round for each operation
    public long[] gasTotal;//currentResults;
    public long[] gasNewCreator;
    public long[] gasNewAsset;
    public long[] gasHolderPolicyUpdate;
    public long[] gasCharacteristicUpdate;
    public long[] gasTransfer;
    public int count ;

    public SimRoundResultsAggregated(int _NUMRUNS, SimParams _sim, int _NUMAGGR) {
        NUMRUNS = _NUMRUNS;
        sim = _sim;
        creators = new LinkedList[NUMRUNS];
        assets = new LinkedList[NUMRUNS];
        for (int j = 0; j < NUMRUNS; j++) {
            creators[j] = new LinkedList<Integer>();
            assets[j] = new LinkedList<Integer>();
        }
        NUMAGGR = _NUMAGGR;
        count = 0;
    }


    private void initialise(long[] vect) {
        for (int i = 0; i < vect.length; i++)
            vect[i] = 0;
    }

    /**
     * Simulate NUMRUNS executions of the system in the period [time, time + NUMAGGR), and fills the gas* vectors with
     * the results.
     * <p>
     * Simula il sistema in un intervallo [time, time + NUMAGGR) per ciascuna delle NUMRUNS esecuzioni indipendenti.
     * 1. Per ogni esecuzione (i) e per ogni istante di tempo nel range:
     * 2. Se timeInner == 0, si considera il deploy iniziale del contratto NMT (una tantum).
     * 3. Se un numero casuale è sotto la soglia PROBnewCreatorCreation, si crea un nuovo creator.
     * 4. Per ciascun creator esistente, si può creare un asset con probabilità PROBnewAssetsCreation.
     * - Per ciascun asset esistente, possono avvenire:
     * - aggiornamento della holder policy
     * - aggiornamento di caratteristiche
     * - trasferimento
     * Tutti gli eventi sono condizionati da probabilità tempo-dipendenti e contribuiscono al conteggio del gas speso per ogni run.
     */
    public void computeSimStepNoMasterFixedRandomAggregated(int time) {
        gasTotal = new long[NUMRUNS];
        initialise(gasTotal);
        gasNewCreator = new long[NUMRUNS];
        initialise(gasNewCreator);
        gasNewAsset = new long[NUMRUNS];
        initialise(gasNewAsset);
        gasHolderPolicyUpdate = new long[NUMRUNS];
        initialise(gasHolderPolicyUpdate);
        gasCharacteristicUpdate = new long[NUMRUNS];
        initialise(gasCharacteristicUpdate);
        gasTransfer = new long[NUMRUNS];
        initialise(gasTransfer);

        SplittableRandom splittableRandom = new SplittableRandom();

        double randomDouble;
        int timeInner;

        for (int i = 0; i < NUMRUNS; i++) {
            for (int j = 0; j < NUMAGGR; j++) {
                randomDouble = splittableRandom.nextDouble();
                timeInner = time + j;
                if (timeInner == 0) {
                    gasTotal[i] += sim.GASdeployNMT();
                }
                //random creation of new creator
                double prob = Objects.requireNonNull(sim.PROBnewCreatorCreation()).getProb(timeInner);
                if (randomDouble <= prob) {
                    creators[i].add(timeInner);
                    gasTotal[i] += sim.GAScreatorPolicyUpdate();
                    gasNewCreator[i] += sim.GAScreatorPolicyUpdate();
                }
            /*for(Integer creator:creators[i]){
                if(randomDouble<=sim.PROBcreatorPolicyUpdate().getProb(timeInner-creator)){
                    gasTotal[i] += sim.GAScreatorPolicyUpdate();
                    gasNewCreator[i] += sim.GAScreatorPolicyUpdate();
                }
            }*/
                for (Integer creator : creators[i]) {
                    double probTimeDep = Objects.requireNonNull(sim.PROBnewCreatorCreation()).getProb(timeInner - creator);
                    if (randomDouble <= probTimeDep) {
                        assets[i].add(timeInner);
                        gasTotal[i] += sim.GASnewAssetsCreation();
                        gasNewAsset[i] += sim.GASnewAssetsCreation();
                    }
                }
                for (Integer asset : assets[i]) {
                    double probTimeDep1 = Objects.requireNonNull(sim.PROBholderPolicyUpdate()).getProb(timeInner - asset);
                    if (randomDouble <= probTimeDep1) {
                        count ++;
                        gasTotal[i] += sim.GASholderPolicyUpdate();
                        gasHolderPolicyUpdate[i] += sim.GASholderPolicyUpdate();
                    }
                    double probTimeDep2 = Objects.requireNonNull(sim.PROBcharacteristicUpdate()).getProb(timeInner - asset);

                    if (randomDouble <= probTimeDep2) {
                        gasTotal[i] += sim.GAScharacteristicUpdate();
                        gasCharacteristicUpdate[i] += sim.GAScharacteristicUpdate();
                    }
                    double probTimeDep3 = Objects.requireNonNull(sim.PROBtransfer()).getProb(timeInner - asset);
                    if (randomDouble <= probTimeDep3) {
                        gasTotal[i] += sim.GAStransfer();
                        gasTransfer[i] += sim.GAStransfer();
                    }
                }

            }
        }
    }

    public static double computeAvg(long[] values) {
        long sumAvg = 0;
        for (int j = 0; j < values.length; j++) {
            sumAvg += values[j];
        }
        return (1.0 * sumAvg) / values.length;
    }

    public static double computeStd(long[] values, double mean) {
        double sumStd = 0;
        for (int j = 0; j < values.length; j++) {
            sumStd += (values[j] - mean) * (values[j] - mean);
        }
        return Math.sqrt(sumStd / values.length);
    }

    /**
     * Creates a string in TSV (tab-separated) format with statistics on creator and asset:
     * - total number
     * - max, min
     * - average
     * - standard deviation
     */

    public String getTSVInfoCreatorsAssetsStats() {
        StringBuilder str = new StringBuilder();
        int numCreators = 0, numAssets = 0;
        int maxCreators = 0, maxAssets = 0;
        int minCreators = -1, minAssets = -1;
        for (int j = 0; j < NUMRUNS; j++) {
            numCreators += creators[j].size();
            numAssets += assets[j].size();
            if (creators[j].size() > maxCreators) {
                maxCreators = creators[j].size();
            }
            if (assets[j].size() > maxAssets) {
                maxAssets = assets[j].size();
            }
            if ((minCreators == -1) || (creators[j].size() < minCreators)) {
                minCreators = creators[j].size();
            }
            if ((minAssets == -1) || (assets[j].size() < minAssets)) {
                minAssets = assets[j].size();
            }
        }
        double avgCreators = (1.0 * numCreators) / NUMRUNS, avgAssets = (1.0 * numAssets) / NUMRUNS;
        double stdCreators = 0, stdAssets = 0;
        for (int j = 0; j < NUMRUNS; j++) {
            stdCreators += (creators[j].size() - avgCreators) * (creators[j].size() - avgCreators);
            stdAssets += (assets[j].size() - avgAssets) * (assets[j].size() - avgAssets);
        }
        stdCreators = Math.sqrt(stdCreators / NUMRUNS);
        stdAssets = Math.sqrt(stdAssets / NUMRUNS);
        str.append("\t" + numCreators);
        str.append("\t" + maxCreators);
        str.append("\t" + minCreators);
        str.append("\t" + avgCreators);
        str.append("\t" + stdCreators);
        str.append("\t" + numAssets);
        str.append("\t" + maxAssets);
        str.append("\t" + minAssets);
        str.append("\t" + avgAssets);
        str.append("\t" + stdAssets);
        return str.toString();
    }

}

package com.example.demo.batch.ImportUser;

import com.example.demo.model.User;
import com.example.demo.nmtsimulation.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.batch.core.StepContribution;
import org.springframework.batch.core.scope.context.ChunkContext;
import org.springframework.batch.core.step.tasklet.Tasklet;
import org.springframework.batch.item.ItemProcessor;
import org.springframework.batch.repeat.RepeatStatus;
import org.springframework.stereotype.Component;

import java.io.BufferedWriter;
import java.io.FileWriter;
import java.io.IOException;
import java.util.Random;
import java.util.SplittableRandom;
import java.util.concurrent.ThreadLocalRandom;

@Component
@Slf4j
public class SimTasklet implements Tasklet {

    public static final int ETHMAXGASPERSEC = 2500000;//blockGasLimit/avgBlockGnerationTime
    public static final int BINANCESMARTCHAINMAXGASPERSEC = 140000000/3;//=46666667
    public static final int OPTIMISMMAINNETMAXGASPERSEC = 60000000/2;//=30000000
    public static final int POLYGONPOSCHAINMAXGASPERSEC = 30000000/2;//=15000000


    int NUMRUNS = 10;//100;
    int MAXTIME = 1209600;//86400; one day//2592000; one month//864000; ten days//604800 seven days  //  1209600 two weeks
    //int AGGR = 60;
    int NUMAGGR = 60;//1 seconds granularity / 60 minutes granularity / 3600 hours granularity
    //String outFile = "/home/brodo/Universita/TrustSense2024/simResults/simResultsTest1.tsv";
    //String dir = "/home/brodo/Universita/TrustSense2024/simResults/";
    String dir = "./";
    //String outFileAggr = "/home/brodo/Universita/TrustSense2024/simResults/simResultsTest1Aggr.tsv";
    String outFile = dir+"simResultsTest5Scaledt"+MAXTIME+"a"+NUMAGGR+".tsv";
    SimParams simToRun = new SimParams5Scaled();



    @Override
    public RepeatStatus execute(StepContribution contribution, ChunkContext chunkContext) throws Exception {
        log.info("Processing Simulation batch ");
        runSimSpaceOptimisedAggregated(simToRun, NUMRUNS, MAXTIME, outFile, NUMAGGR);
        //runSimAggregated(simToRun, NUMRUNS, MAXTIME, outFileAggr, AGGR);
        System.out.println("*** DONE SIM5Scaled AGGR ("+NUMAGGR+" seconds) "+(MAXTIME/86400)+" days ***");

        outFile = dir+"simResultsTest6Scaledt"+MAXTIME+"a"+NUMAGGR+".tsv";
        simToRun = new SimParams6Scaled();
        runSimSpaceOptimisedAggregated(simToRun, NUMRUNS, MAXTIME, outFile, NUMAGGR);
        System.out.println("*** DONE SIM6Scaled AGGR ("+NUMAGGR+" seconds) "+(MAXTIME/86400)+" days ***");
        Thread.sleep(30000);
        return RepeatStatus.FINISHED;
    }


    public static void printProbTesting(){
        String outFileHead = "/home/brodo/Universita/Donini/simResults/simProb";
        String outFileTail = ".tsv";
        int maxTime = 3600;//2 hours
        printProb(new ExponentialProbDistr(0.0001, 0.01), maxTime, outFileHead+"exp1"+outFileTail);
        printProb(new ExponentialProbDistr(0.001, 0.01), maxTime, outFileHead+"exp2"+outFileTail);
        printProb(new ExponentialProbDistr(0.01, 0.01), maxTime, outFileHead+"exp3"+outFileTail);
        printProb(new ExponentialProbDistr(0.1, 0.01), maxTime, outFileHead+"exp4"+outFileTail);
        printProb(new ExponentialProbDistr(1, 0.01), maxTime, outFileHead+"exp5"+outFileTail);
        printProb(new ExponentialProbDistr(10, 0.01), maxTime, outFileHead+"exp6"+outFileTail);
        printProb(new ExponentialProbDistr(100, 0.01), maxTime, outFileHead+"exp7"+outFileTail);

        printProb(new NormalProbDistr(100,10, 1), maxTime, outFileHead+"norm1"+outFileTail);
        printProb(new NormalProbDistr(100,10, 0.1), maxTime, outFileHead+"norm2"+outFileTail);
        printProb(new NormalProbDistr(100,10, 0.01), maxTime, outFileHead+"norm3"+outFileTail);
        printProb(new NormalProbDistr(100,100, 1), maxTime, outFileHead+"norm4"+outFileTail);
        printProb(new NormalProbDistr(100,100, 0.1), maxTime, outFileHead+"norm5"+outFileTail);
        printProb(new NormalProbDistr(100,100, 0.01), maxTime, outFileHead+"norm6"+outFileTail);


        printProb(new LognormalProbDistr(10,10, 0.1), maxTime, outFileHead+"lognorm1"+outFileTail);
        printProb(new LognormalProbDistr(10,10, 0.01), maxTime, outFileHead+"lognorm2"+outFileTail);
        printProb(new LognormalProbDistr(10,10, 0.1), maxTime, outFileHead+"lognorm3"+outFileTail);
        printProb(new LognormalProbDistr(1,1, 0.1), maxTime, outFileHead+"lognorm4"+outFileTail);
        printProb(new LognormalProbDistr(1,1, 0.01), maxTime, outFileHead+"lognorm5"+outFileTail);
        printProb(new LognormalProbDistr(1,1, 0.001), maxTime, outFileHead+"lognorm6"+outFileTail);



        printProb(new LognormalProbDistrScaled(1,1, 0.01, 1), maxTime, outFileHead+"lognormScaled"+outFileTail);
        printProb(new NormalProbDistrScaled(100,10, 0.04,4), maxTime, outFileHead+"normScaled"+outFileTail);
        printProb(new ExponentialProbDistrScaled(0.1, 0.01, 2), maxTime, outFileHead+"expScaled"+outFileTail);
        printProb(new UniformProbDistr(0.0001), maxTime, outFileHead+"uniformScaled"+outFileTail);

    }

    public static void printProb(ProbabilityFunction prob, int MAXTIME, String outFile){
        BufferedWriter bw;
        try {
            bw = new BufferedWriter(new FileWriter(outFile));
            for(int j=0;j<MAXTIME;j++){
                bw.write(j+"\t"+prob.getProb(j));
                bw.newLine();
            }

            bw.close();
        } catch (IOException ex) {
            System.err.println("ERROR WHILE WRITING TO FILE.");
            ex.printStackTrace();
        }
    }

    //1) all we care about is the current time results (we discard the historical serie)
    //2) all we care about for creators and assets is the time they where created, so we model them as repeatable ints (as longs are not yet needed as of the time of writing and ints are twice as small than longs)
    public static void runSimSpaceOptimised(SimParams simToRun, int NUMRUNS, int MAXTIME, String outFile){
        //Master is implicit at time 0
        SimRoundResults sRounds = new SimRoundResults(NUMRUNS, simToRun);
        double resultMean, resultStd;

        try (BufferedWriter bw = new BufferedWriter(new FileWriter(outFile))) {

            bw.write("time\tgasTotalMean\tgasTotalStd");
            bw.write("\tgasNewCreatorMean\tgasNewCreatorStd");
            bw.write("\tgasNewAssetMean\tgasNewAssetStd");
            bw.write("\tgasHolderPolicyUpdateMean\tgasHolderPolicyUpdateStd");
            bw.write("\tgasCharacteristicUpdateMean\tgasCharacteristicUpdateStd");
            bw.write("\tgasTransferMean\tgasTransferStd");
            bw.write("\tTotalNumCreators\tmaxCreators\tminCreators\tavgCreators\tstdCreators\tTotalNumAssets\tmaxAssets\tminAssets\tavgAssets\tstdAssets");
            bw.newLine();

            long time = System.currentTimeMillis();

            for(int i=0;i<MAXTIME;i++){
                if(i%100000==0){
                    System.out.println("Sim run at time "+i+"/"+MAXTIME+" in time "+ (System.currentTimeMillis()-time)+" ms.");
                    time = System.currentTimeMillis();
                }
                sRounds.computeSimStepNoMasterFixedRandom(i);

                bw.write(""+i);

                //total gas stats
                resultMean = SimRoundResults.computeAvg(sRounds.gasTotal);
                resultStd = SimRoundResults.computeStd(sRounds.gasTotal, resultMean);
                bw.write("\t"+resultMean+"\t"+resultStd);

                //individual operation gas stats
                resultMean = SimRoundResults.computeAvg(sRounds.gasNewCreator);
                resultStd = SimRoundResults.computeStd(sRounds.gasNewCreator, resultMean);
                bw.write("\t"+resultMean+"\t"+resultStd);
                resultMean = SimRoundResults.computeAvg(sRounds.gasNewAsset);
                resultStd = SimRoundResults.computeStd(sRounds.gasNewAsset, resultMean);
                bw.write("\t"+resultMean+"\t"+resultStd);
                resultMean = SimRoundResults.computeAvg(sRounds.gasHolderPolicyUpdate);
                resultStd = SimRoundResults.computeStd(sRounds.gasHolderPolicyUpdate, resultMean);
                bw.write("\t"+resultMean+"\t"+resultStd);
                resultMean = SimRoundResults.computeAvg(sRounds.gasCharacteristicUpdate);
                resultStd = SimRoundResults.computeStd(sRounds.gasCharacteristicUpdate, resultMean);
                bw.write("\t"+resultMean+"\t"+resultStd);
                resultMean = SimRoundResults.computeAvg(sRounds.gasTransfer);
                resultStd = SimRoundResults.computeStd(sRounds.gasTransfer, resultMean);
                bw.write("\t"+resultMean+"\t"+resultStd);

                bw.write(sRounds.getTSVInfoCreatorsAssetsStats());

                bw.newLine();
            }

        } catch (IOException ex) {
            System.err.println("ERROR WHILE WRITING TO FILE.");
            ex.printStackTrace();
        }


        System.out.println("Ending sim of "+NUMRUNS+" runs.");
        //System.out.println("TotalNumCreators "+numCreators+" , maxCreators "+maxCreators+" , minCreators "+minCreators+" , avgCreators "+avgCreators+" , stdCreators "+stdCreators);
        //System.out.println("TotalNumAssets "+numAssets+" , maxAssets "+maxAssets+" , minAssets "+minAssets+" , avgAssets "+avgAssets+" , stdAssets "+stdAssets);

    }



    //1) all we care about is the current time results (we discard the historical serie)
    //2) all we care about for creators and assets is the time they where created, so we model them as repeatable ints (as longs are not yet needed as of the time of writing and ints are twice as small than longs)
    public static void runSimSpaceOptimisedAggregated(SimParams simToRun, int NUMRUNS, int MAXTIME, String outFile, int NUMAGGR){
        //Master is implicit at time 0
        SimRoundResultsAggregated sRounds = new SimRoundResultsAggregated(NUMRUNS, simToRun, NUMAGGR);
        double resultMean, resultStd;

        try (BufferedWriter bw = new BufferedWriter(new FileWriter(outFile))) {

            bw.write("time\tgasTotalMean\tgasTotalStd");
            bw.write("\tgasNewCreatorMean\tgasNewCreatorStd");
            bw.write("\tgasNewAssetMean\tgasNewAssetStd");
            bw.write("\tgasHolderPolicyUpdateMean\tgasHolderPolicyUpdateStd");
            bw.write("\tgasCharacteristicUpdateMean\tgasCharacteristicUpdateStd");
            bw.write("\tgasTransferMean\tgasTransferStd");
            bw.write("\tTotalNumCreators\tmaxCreators\tminCreators\tavgCreators\tstdCreators\tTotalNumAssets\tmaxAssets\tminAssets\tavgAssets\tstdAssets");
            bw.newLine();

            long time = System.currentTimeMillis();

            for(int i=0;i<MAXTIME;i = i+NUMAGGR){
                if(i%(NUMAGGR*2000)==0){
                    System.out.println("Sim run at time "+i+"/"+MAXTIME+" in time "+ (System.currentTimeMillis()-time)+" ms.");
                    time = System.currentTimeMillis();
                }
                sRounds.computeSimStepNoMasterFixedRandomAggregated(i);

                bw.write(""+i);

                //total gas stats
                resultMean = SimRoundResults.computeAvg(sRounds.gasTotal);
                resultStd = SimRoundResults.computeStd(sRounds.gasTotal, resultMean);
                bw.write("\t"+resultMean+"\t"+resultStd);

                //individual operation gas stats
                resultMean = SimRoundResults.computeAvg(sRounds.gasNewCreator);
                resultStd = SimRoundResults.computeStd(sRounds.gasNewCreator, resultMean);
                bw.write("\t"+resultMean+"\t"+resultStd);
                resultMean = SimRoundResults.computeAvg(sRounds.gasNewAsset);
                resultStd = SimRoundResults.computeStd(sRounds.gasNewAsset, resultMean);
                bw.write("\t"+resultMean+"\t"+resultStd);
                resultMean = SimRoundResults.computeAvg(sRounds.gasHolderPolicyUpdate);
                resultStd = SimRoundResults.computeStd(sRounds.gasHolderPolicyUpdate, resultMean);
                bw.write("\t"+resultMean+"\t"+resultStd);
                resultMean = SimRoundResults.computeAvg(sRounds.gasCharacteristicUpdate);
                resultStd = SimRoundResults.computeStd(sRounds.gasCharacteristicUpdate, resultMean);
                bw.write("\t"+resultMean+"\t"+resultStd);
                resultMean = SimRoundResults.computeAvg(sRounds.gasTransfer);
                resultStd = SimRoundResults.computeStd(sRounds.gasTransfer, resultMean);
                bw.write("\t"+resultMean+"\t"+resultStd);

                bw.write(sRounds.getTSVInfoCreatorsAssetsStats());

                bw.newLine();
            }
        } catch (IOException ex) {
            System.err.println("ERROR WHILE WRITING TO FILE.");
            ex.printStackTrace();
        }
        System.out.println("Ending sim of "+NUMRUNS+" runs.");
    }

    public static void randomGenerationEfficiencyTests(int num){

        int n = num;
        double randomDouble = 0;
        long startTime, endTime, avg;

        // Using ThreadLocalRandom
        startTime = System.currentTimeMillis();
        for (int i = 0; i < n; i++) {
            randomDouble = ThreadLocalRandom.current().nextDouble();
        }
        endTime = System.currentTimeMillis();
        avg = (endTime - startTime)/n;
        System.out.println("ThreadLocalRandom time: " + (endTime - startTime) + " ms (" + avg+ " per call)");

        // Using a shared Random instance
        startTime = System.currentTimeMillis();
        Random sharedRandom = new Random();
        for (int i = 0; i < n; i++) {
            randomDouble = sharedRandom.nextDouble();
        }
        endTime = System.currentTimeMillis();
        avg = (endTime - startTime)/n;
        System.out.println("Shared Random time: " + (endTime - startTime) + " ms (" + avg+ " per call)");

        // Using Math Random
        startTime = System.currentTimeMillis();
        for (int i = 0; i < n; i++) {
            randomDouble = Math.random();
        }
        endTime = System.currentTimeMillis();
        avg = (endTime - startTime)/n;
        System.out.println("Math Random time: " + (endTime - startTime) + " ms (" + avg+ " per call)");

        // Using a SplittableRandom instance
        startTime = System.currentTimeMillis();
        SplittableRandom splittableRandom = new SplittableRandom();
        for (int i = 0; i < n; i++) {
            randomDouble = splittableRandom.nextDouble();
        }
        endTime = System.currentTimeMillis();
        avg = (endTime - startTime)/n;
        System.out.println("Splittable Random time: " + (endTime - startTime) + " ms (" + avg+ " per call)");

    }


}

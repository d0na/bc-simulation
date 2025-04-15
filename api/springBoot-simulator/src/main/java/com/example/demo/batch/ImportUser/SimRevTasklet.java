package com.example.demo.batch.ImportUser;

import com.example.demo.nmtsimulation.*;
import com.example.demo.service.ProgressTracker;
import lombok.extern.slf4j.Slf4j;
import org.springframework.batch.core.JobExecution;
import org.springframework.batch.core.JobParameters;
import org.springframework.batch.core.StepContribution;
import org.springframework.batch.core.scope.context.ChunkContext;
import org.springframework.batch.core.step.tasklet.Tasklet;
import org.springframework.batch.item.ExecutionContext;
import org.springframework.batch.repeat.RepeatStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.io.BufferedWriter;
import java.io.FileWriter;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Random;
import java.util.SplittableRandom;
import java.util.concurrent.ThreadLocalRandom;

@Component
@Slf4j
public class SimRevTasklet implements Tasklet {

    @Autowired
    private ProgressTracker tracker;

    public static final int ETHMAXGASPERSEC = 2500000;//blockGasLimit/avgBlockGnerationTime
    public static final int BINANCESMARTCHAINMAXGASPERSEC = 140000000/3;//=46666667
    public static final int OPTIMISMMAINNETMAXGASPERSEC = 60000000/2;//=30000000
    public static final int POLYGONPOSCHAINMAXGASPERSEC = 30000000/2;//=15000000


    int NUMAGGR =  AggregationGranularity.MINUTES.getSeconds();
    int MAXTIME = SimulationDuration.TWO_WEEKS.getSeconds();

    int NUMRUNS = 10;//100;
    String dir = "./";
    String outFile = dir+"simResultsTest5Scaledt"+MAXTIME+"a"+NUMAGGR+".tsv";
    SimParams simToRun = new SimParams5Scaled();

    private SimParams getSimParams(String simType) {
        return switch (simType) {
            case "SimParams5Scaled" -> new SimParams5Scaled();
            case "SimParams6Scaled" -> new SimParams6Scaled();
            // Aggiungi altri tipi qui se necessario
            default -> throw new IllegalArgumentException("Tipo di simulazione non valido: " + simType);
        };
    }

    @Override
    public RepeatStatus execute(StepContribution contribution, ChunkContext chunkContext) throws Exception {

        JobExecution jobExecution = chunkContext.getStepContext().getStepExecution().getJobExecution();
        Long jobExecutionId = jobExecution.getId(); // è sempre presente
        JobParameters params = chunkContext.getStepContext().getStepExecution().getJobParameters();

        int _numAggr = params.getLong("numAggr").intValue();
        int _maxTime = params.getLong("maxTime").intValue();
        int _numRuns = params.getLong("numRuns").intValue();
        String _dir = params.getString("dir");
        String _simType = params.getString("simType");
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
        String timestamp = LocalDateTime.now().format(formatter);
        String _outFile = _dir + _simType + _maxTime + "a" + _numAggr + "_" + timestamp + ".tsv";
        // Tipo di simulazione dinamico
        SimParams _simToRun = switch (_simType) {
            case "SimParams5Scaled" -> new SimParams5Scaled();
            case "SimParams6Scaled" -> new SimParams6Scaled();
            // aggiungi altro tipo se necessario
            default -> new SimParams5Scaled(); // fallback
        };

        log.info("Launching simulation:");
        log.info("numAggr: {}", _numAggr);
        log.info("maxTime: {}", _maxTime);
        log.info("numRuns: {}", _numRuns);
        log.info("outFile: {}", _outFile);
        log.info("simParams: {}", _simToRun.getClass().getSimpleName());

        log.info("Processing Simulation batch ");
//        runSimSpaceOptimisedAggregated(simToRun, NUMRUNS, MAXTIME, outFile, NUMAGGR);
        //Master is implicit at time 0
//        SimRoundResultsAggregated sRounds = new SimRoundResultsAggregated(NUMRUNS, simToRun, NUMAGGR);
        SimRoundResultsAggregated sRounds = new SimRoundResultsAggregated(_numRuns, _simToRun, _numAggr);
        double resultMean, resultStd;

        try (BufferedWriter bw = new BufferedWriter(new FileWriter(_outFile))) {

            bw.write("time\tgasTotalMean\tgasTotalStd");
            bw.write("\tgasNewCreatorMean\tgasNewCreatorStd");
            bw.write("\tgasNewAssetMean\tgasNewAssetStd");
            bw.write("\tgasHolderPolicyUpdateMean\tgasHolderPolicyUpdateStd");
            bw.write("\tgasCharacteristicUpdateMean\tgasCharacteristicUpdateStd");
            bw.write("\tgasTransferMean\tgasTransferStd");
            bw.write("\tTotalNumCreators\tmaxCreators\tminCreators\tavgCreators\tstdCreators\tTotalNumAssets\tmaxAssets\tminAssets\tavgAssets\tstdAssets");
            bw.newLine();

            long time = System.currentTimeMillis();

            for(int i=0;i<_maxTime;i = i+_numAggr){
                if(i%(_numAggr*2000)==0){
                    System.out.println("Sim run at time "+i+"/"+_maxTime+" in time "+ (System.currentTimeMillis()-time)+" ms.");
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

                // Calcola il progresso basato sull'indice di step corrente
                double progress = ((i / (double) _maxTime) * 100);
//                System.out.printf("Avanzamento: %.2f%% (%d/%d)%n Job id:%n", progress, i, _maxTime, jobExecutionId);
                // Salva nel contesto per un listener o log
                chunkContext.getStepContext().getStepExecution()
                        .getExecutionContext()
                        .put("progress",progress);
                tracker.update(jobExecutionId, progress);

                ExecutionContext context = chunkContext.getStepContext().getStepExecution().getExecutionContext();
                context.put("progress", progress);
                chunkContext.getStepContext().getStepExecution().setExecutionContext(context);
            }
        } catch (IOException ex) {
            System.err.println("ERROR WHILE WRITING TO FILE.");
            ex.printStackTrace();
        }
        System.out.println("Ending sim of "+_numRuns+" runs.");
        System.out.println("*** DONE SIM5Scaled AGGR ("+_numAggr+" seconds) "+(_maxTime/86400)+" days ***");

        _outFile = dir+"simResultsTest6Scaledt"+_maxTime+"a"+_numAggr+".tsv";
        /*simToRun = new SimParams6Scaled();
        runSimSpaceOptimisedAggregated(simToRun, _numRuns, _maxTime, outFile, NUMAGGR);
        System.out.println("*** DONE SIM6Scaled AGGR ("+NUMAGGR+" seconds) "+(_maxTime/86400)+" days ***");
        Thread.sleep(30000);*/
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





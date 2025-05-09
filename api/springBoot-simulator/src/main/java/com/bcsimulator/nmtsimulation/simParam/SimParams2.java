/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.bcsimulator.nmtsimulation.simParam;

import com.bcsimulator.nmtsimulation.distribution.NormalProbDistr;
import com.bcsimulator.nmtsimulation.distribution.UniformProbDistr;
import com.bcsimulator.nmtsimulation.helper.ProbabilityFunction;

/**
 *
 * @author brodo
 */
public class SimParams2 extends SimParams {
    
    //exponential -> the lower teh rate, teh less steep the curve
    //normal -> the higher the variance, the flatter it gets
    //lognormal -> teh higher teh variance, the less steep it is
    
    public int GASdeployNMT(){ return 2466753;}
    public int GASdeployMasterPolicy(){ return 285213;}
    public int GAScreatorPolicyUpdate(){ return 30072 + 496366;}
    public ProbabilityFunction PROBcreatorPolicyUpdate(){ return new NormalProbDistr(1000,10, 0.1);}
    public int GASnewAssetsCreation(){ return 1025897;}
    public ProbabilityFunction PROBnewAssetsCreation(){ return new NormalProbDistr(1000,100, 0.1);}//return new LognormalProbDistr(10,100);}
    public int GASholderPolicyUpdate(){ return 30072 + 381453;}
    public ProbabilityFunction PROBholderPolicyUpdate(){ return new NormalProbDistr(1000,10, 0.1);}
    public int GAScharacteristicUpdate(){ return 90893;}
    public ProbabilityFunction PROBcharacteristicUpdate(){ return new NormalProbDistr(1000,100, 0.1);}
    public int GAStransfer(){ return 98730;}
    public ProbabilityFunction PROBtransfer(){ return new NormalProbDistr(1000,100, 0.1);}
    
    public ProbabilityFunction PROBnewCreatorCreation(){ return new UniformProbDistr(0.0001);}//return new LognormalProbDistr(10,100);}
}

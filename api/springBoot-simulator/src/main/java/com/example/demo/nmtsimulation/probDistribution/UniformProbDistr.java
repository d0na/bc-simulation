/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.example.demo.nmtsimulation.probDistribution;

import com.example.demo.nmtsimulation.helper.ProbabilityFunction;

/**
 *
 * @author brodo
 */
public class UniformProbDistr extends ProbabilityFunction {
    double a;
    
    public UniformProbDistr(double prob){
        a=prob;
    }
    
    @Override
    public double getProb(int time){
        return a; 
    }
}

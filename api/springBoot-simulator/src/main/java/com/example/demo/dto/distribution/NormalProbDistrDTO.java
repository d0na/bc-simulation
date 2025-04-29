/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.example.demo.dto.distribution;

import com.example.demo.dto.AbstractDistributionDTO;
import com.example.demo.nmtsimulation.helper.ProbabilityFunction;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 *The higher std the more it flattens the bell curve
 * 10 very accentrated around the mean
 * 100 ok around the mean 
 * 1000 TOO HIGH!!
 * 
 * scaling 0.1 ok
 * best:
 * (100,100, 0.1)
 * 
 * good for highly concentrated delayed start:
 * (100,10, 0.1)
 * 
 * ok per tutto all'inizio molto probabile:
 * (100,10, 1)
 * 
 * mean tells where is the highest prob
 * 
 * @author brodo
 */
@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class NormalProbDistrDTO extends AbstractDistributionDTO {
    double mean;
    double std;
    double scalingFactor;
    
    public NormalProbDistrDTO(double _mean, double _std, double _scaling){
        mean = _mean; std = _std; scalingFactor = _scaling;
    }
    
    @Override
    public double getProb(int time){        
        double realTime = time*scalingFactor;
        double exp = -1 * (((realTime - mean)*(realTime - mean))/(2*std*std));
        double ratio = Math.sqrt(2*std*std*Math.PI);
        return (1/ratio) * Math.exp(exp); 
    }
}

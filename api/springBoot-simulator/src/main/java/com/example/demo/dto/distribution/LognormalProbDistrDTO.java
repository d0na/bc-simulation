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
 *1,1 falls fast after 30
 * 
 * 10,10 best remains reasonable until 30
 * 
 * almost certain at the beginning and quickly falls to very low prob after 30 
 * (1,10, 0.1)
 * 
 * fairly probable at the beginning and then very unlikely after 40
 * (10,10, 0.1)
 * 
 * @author brodo
 */
@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class LognormalProbDistrDTO extends AbstractDistributionDTO {
    double mean;
    double std;
    double scalingFactor;
    
    public LognormalProbDistrDTO(double _mean, double _std, double _scaling){
        mean = _mean; std = _std; scalingFactor = _scaling;
    }
    
    @Override
    public double getProb(int time){
        double realTime = time*scalingFactor;
        if(realTime == 0)
            return 0;
        double exp = -1 * (Math.log(realTime) - mean) * (Math.log(realTime) - mean) / (2*std*std);
        double ratio = realTime * std * Math.sqrt(2*Math.PI);
        return 1/ratio * Math.exp(exp); 
    }
}
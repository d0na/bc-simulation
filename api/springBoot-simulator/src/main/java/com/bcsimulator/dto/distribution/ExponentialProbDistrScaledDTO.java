/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.bcsimulator.dto.distribution;

import com.bcsimulator.dto.AbstractDistributionDTO;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * Best fits are 0.1 and 0.01
 * 
 * 
 * very likely at the beginning and falls fast after 40
 * (0.1, 0.01)
 * 
 * very flat and relatively unlikely in the beginning:
 * (0.01, 0.01)
 * 
 * certain at the beginning but then rapidly impossible:
 * (1, 0.01)
 * 
 * @author brodo
 */
@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class ExponentialProbDistrScaledDTO extends AbstractDistributionDTO {
    double rate;
    double scalingFactorX;
    double scalingFactorY;
    
    public ExponentialProbDistrScaledDTO(double _rate, double _scalingX, double _scalingY){
        rate = _rate; scalingFactorX = _scalingX; scalingFactorY = _scalingY;
    }
    
    @Override
    public double getProb(int time){
        double realTime = time*scalingFactorX;
        return scalingFactorY*rate*Math.exp(-1*rate*realTime); 
    }
}

package com.example.demo.dto.distribution;

import com.example.demo.dto.AbstractDistributionDTO;
import lombok.Data;
import lombok.EqualsAndHashCode;

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
public class ExponentialProbDistrDTO extends AbstractDistributionDTO {
    double rate;
    double scalingFactor;
    @Override
    public double getProb(int time){
        double realTime = time*scalingFactor;
        return rate*Math.exp(-1*rate*realTime);
    }
}
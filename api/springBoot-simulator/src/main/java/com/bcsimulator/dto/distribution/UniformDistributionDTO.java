package com.bcsimulator.dto.distribution;

import com.bcsimulator.dto.AbstractDistributionDTO;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class UniformDistributionDTO extends AbstractDistributionDTO {
//    private UniformParamsDTO params; // Parametri per la distribuzione uniforme
    private double value;
    @Override
    public double getProb(int time){
        return this.getValue();
    }
}
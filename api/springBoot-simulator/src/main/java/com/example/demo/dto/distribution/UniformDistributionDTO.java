package com.example.demo.dto.distribution;

import com.example.demo.dto.AbstractDistributionDTO;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class UniformDistributionDTO extends AbstractDistributionDTO {
//    private UniformParamsDTO params; // Parametri per la distribuzione uniforme
    private double value;
    @Override
    public double getProb(int time){
        return this.getValue();
    }
}
package com.example.demo.dto.distribution;

import com.example.demo.dto.AbstractDistributionDTO;
import lombok.Data;

@Data
public class UniformDistributionDTO extends AbstractDistributionDTO {
    private UniformParamsDTO params; // Parametri per la distribuzione uniforme
}
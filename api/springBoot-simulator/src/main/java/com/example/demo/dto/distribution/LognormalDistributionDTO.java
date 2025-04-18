package com.example.demo.dto.distribution;

import com.example.demo.dto.AbstractDistributionDTO;
import lombok.Data;

@Data
public class LognormalDistributionDTO extends AbstractDistributionDTO {
    LognormalParamsDTO params; // Parametri per la distribuzione lognormale
}
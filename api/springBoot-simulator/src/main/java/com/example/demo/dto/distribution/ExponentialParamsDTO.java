package com.example.demo.dto.distribution;

import com.example.demo.dto.AbstractParamsDistributionDTO;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)

public class ExponentialParamsDTO extends AbstractParamsDistributionDTO {
    private double rate;
    private double scalingFactor;
}
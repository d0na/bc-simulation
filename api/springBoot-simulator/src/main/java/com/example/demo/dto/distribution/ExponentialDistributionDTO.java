package com.example.demo.dto.distribution;

import com.example.demo.dto.AbstractDistributionDTO;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class ExponentialDistributionDTO extends AbstractDistributionDTO {
//    public ExponentialDistributionDTO(ExponentialParamsDTO params) {
//        super(DistributionType.EXPONENTIAL);
////        this.setParams(params);
//    }
}
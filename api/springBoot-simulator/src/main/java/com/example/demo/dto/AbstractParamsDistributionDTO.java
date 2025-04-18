package com.example.demo.dto;

import com.example.demo.dto.distribution.LognormalParamsDTO;
import com.example.demo.dto.distribution.UniformParamsDTO;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import lombok.Data;

@Data
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "params", visible = true)
@JsonSubTypes({
//        @JsonSubTypes.Type(value = ExponentialParamsDTO.class, name = "EXPONENTIAL"),
        @JsonSubTypes.Type(value = LognormalParamsDTO.class, name = "LOGNORMAL"),
        @JsonSubTypes.Type(value = UniformParamsDTO.class, name = "UNIFORM")
})
public abstract class AbstractParamsDistributionDTO { }
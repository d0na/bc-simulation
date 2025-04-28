package com.example.demo.dto;

import com.example.demo.dto.distribution.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import lombok.Data;
import lombok.NoArgsConstructor;

@JsonTypeInfo(
        use = JsonTypeInfo.Id.NAME,
        property = "type",
        visible = true
)
@JsonSubTypes({
        @JsonSubTypes.Type(value = UniformDistributionDTO.class, name = "UNIFORM"),
        @JsonSubTypes.Type(value = NormalProbDistrDTO.class, name = "NORMAL"),
        @JsonSubTypes.Type(value = NormalProbDistrScaledDTO.class, name = "NORMAL_SCALED"),
        @JsonSubTypes.Type(value = LognormalProbDistrDTO.class, name = "LOGNORMAL"),
        @JsonSubTypes.Type(value = LognormalProbDistrScaledDTO.class, name = "LOGNORMAL_SCALED"),
        @JsonSubTypes.Type(value = ExponentialProbDistrDTO.class, name = "EXPONENTIAL"),
        @JsonSubTypes.Type(value = ExponentialProbDistrScaledDTO.class, name = "EXPONENTIAL_SCALED"),
        @JsonSubTypes.Type(value = FixedProbDistrDTO.class, name = "FIXED"),
})
@Data
@NoArgsConstructor
public abstract class AbstractDistributionDTO {
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private DistributionType type; // Tipo di distribuzione (e.g. EXPONENTIAL, LOGNORMAL, etc.)
    public double getProb(int time){
        return time;
    }

}
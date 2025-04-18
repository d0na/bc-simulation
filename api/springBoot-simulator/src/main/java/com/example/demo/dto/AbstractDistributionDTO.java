package com.example.demo.dto;

import com.example.demo.dto.distribution.LognormalDistributionDTO;
import com.example.demo.dto.distribution.UniformDistributionDTO;
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
        @JsonSubTypes.Type(value = LognormalDistributionDTO.class, name = "LOGNORMAL")
})
@Data
@NoArgsConstructor
public abstract class AbstractDistributionDTO {
//    private DistributionType type; // Tipo di distribuzione (e.g. EXPONENTIAL, LOGNORMAL, etc.)
}
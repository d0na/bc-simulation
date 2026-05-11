package com.bcsimulator.dto;

import lombok.Data;

import java.util.List;

@Data
public class DataSetRequestDTO {
    Long fileId;
    List<String> columns;

}
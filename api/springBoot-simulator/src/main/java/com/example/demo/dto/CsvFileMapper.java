package com.example.demo.dto;

import com.example.demo.model.CsvFile;

public class CsvFileMapper {

    public static CsvFileDTO toDto(CsvFile entity) {
        return new CsvFileDTO(
                entity.getId(),
                entity.getName(),
                entity.getPath(),
                entity.getCreatedAt(),
                entity.getColumns()
        );
    }
}

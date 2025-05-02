package com.example.demo.dto;

import lombok.Data;
import java.util.List;

import java.time.LocalDateTime;
import java.util.Arrays;

@Data
public class CsvFileDTO {
    private Long id;
    private String name;
    private String path;
    private LocalDateTime createdAt;
    private List<String> columns;

    public CsvFileDTO(Long id, String name, String path, LocalDateTime createdAt, String columnsString) {
        this.id = id;
        this.name = name;
        this.path = path;
        this.createdAt = createdAt;
        this.columns = parseColumns(columnsString);
    }

    private List<String> parseColumns(String columnsString) {
        if (columnsString == null || columnsString.isBlank()) {
            return List.of();
        }
        return Arrays.asList(columnsString.split("\t"));
    }
}

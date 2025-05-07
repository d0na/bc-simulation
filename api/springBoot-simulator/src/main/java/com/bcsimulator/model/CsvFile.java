package com.bcsimulator.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "csv_file")
@Data
public class CsvFile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String path;
    private LocalDateTime createdAt;

    @Column(columnDefinition = "TEXT")
    private String columns; // es: "time,value1,value2,value3"
}

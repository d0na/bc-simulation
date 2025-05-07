package com.bcsimulator.service;

import com.bcsimulator.dto.CsvFileDTO;
import com.bcsimulator.model.CsvFile;
import com.bcsimulator.repository.CsvFileRepository;
import com.opencsv.CSVReader;
import com.opencsv.exceptions.CsvValidationException;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.FileReader;
import java.io.IOException;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Service
public class CsvFileService {

    @Autowired
    private CsvFileRepository repository;

    public List<CsvFileDTO> getAllCsvFiles() {
        return repository.findAll().stream()
                .map(f -> new CsvFileDTO(
                        f.getId(),
                        f.getName(),
                        f.getPath(),
                        f.getCreatedAt(),
                        f.getColumns() != null ? f.getColumns() : ""  // evita NPE
                ))
                .toList();
    }


    public List<String> getColumnsForFile(Long fileId) {
        return repository.findById(fileId)
                .map(f -> {
                    // Se le colonne sono memorizzate come stringa, splittale
                    if (f.getColumns() != null && !f.getColumns().isEmpty()) {
                        return Arrays.asList(f.getColumns().split("\t"));
                    }
                    return Collections.<String>emptyList();
                })
                .orElseThrow(() -> new EntityNotFoundException("File with id " + fileId + " not found"));
    }
}

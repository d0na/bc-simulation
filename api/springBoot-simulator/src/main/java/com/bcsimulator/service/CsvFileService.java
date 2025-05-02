package com.bcsimulator.service;

import com.bcsimulator.dto.CsvFileDTO;
import com.bcsimulator.model.CsvFile;
import com.bcsimulator.repository.CsvFileRepository;
import com.opencsv.CSVReader;
import com.opencsv.exceptions.CsvValidationException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.FileReader;
import java.io.IOException;
import java.util.Arrays;
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


    public List<String> getColumnsForFile(Long fileId) throws IOException {
        CsvFile file = repository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));

        try (CSVReader reader = new CSVReader(new FileReader(file.getPath()))) {
            String[] header = reader.readNext();
            return Arrays.asList(header);
        } catch (CsvValidationException e) {
            throw new RuntimeException(e);
        }
    }
}

package com.bcsimulator.controller;

import com.bcsimulator.dto.CsvFileDTO;
import com.bcsimulator.dto.CsvFileMapper;
import com.bcsimulator.model.CsvFile;
import com.bcsimulator.repository.CsvFileRepository;
import com.bcsimulator.service.CsvFileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.List;

@RestController
@RequestMapping("/results/csv")
public class CsvFileController {

    @Autowired
    private CsvFileService service;
    @Autowired
    private CsvFileRepository cvsFileRepository;

    @GetMapping("/files")
    public List<CsvFileDTO> getCsvFiles() {
        return service.getAllCsvFiles();
    }

    @GetMapping("/results/csv/files")
    public List<CsvFileDTO> getAllCsvFiles() {
        List<CsvFile> files = cvsFileRepository.findAll();
        return files.stream()
                .map(CsvFileMapper::toDto)
                .toList();
    }

    @GetMapping("/{id}/columns")
    public List<String> getColumns(@PathVariable Long id) throws IOException {
        return service.getColumnsForFile(id);
    }

    private CsvFile getCsvFileById(Long id) {
        return cvsFileRepository.findById(id).orElseThrow(() -> new RuntimeException("File not found"));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> downloadCsvFile(@PathVariable Long id) throws IOException {
        CsvFile csvFile = getCsvFileById(id);

        // Carica il file dal disco
        File file = new File(csvFile.getPath());
        if (!file.exists()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }

        // Leggi il contenuto del file in un array di byte
        byte[] fileContent = Files.readAllBytes(file.toPath());

        // Imposta l'header per il download del file
        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + csvFile.getName() + "\"");
        headers.add(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_OCTET_STREAM_VALUE);

        return new ResponseEntity<>(fileContent, headers, HttpStatus.OK);
    }
}


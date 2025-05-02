package com.example.demo.repository;

import com.example.demo.model.CsvFile;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CsvFileRepository extends JpaRepository<CsvFile, Long> {
}

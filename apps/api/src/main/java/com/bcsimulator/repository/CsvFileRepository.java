package com.bcsimulator.repository;

import com.bcsimulator.model.CsvFile;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CsvFileRepository extends JpaRepository<CsvFile, Long> {
}

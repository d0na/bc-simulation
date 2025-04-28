package com.example.demo.service;

import com.example.demo.dto.PointDTO;
import com.opencsv.CSVReader;
import com.opencsv.exceptions.CsvValidationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.FileReader;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;


@Service
@RequiredArgsConstructor
@Slf4j
public class GraphService {


    public List<PointDTO> loadDataFromCsv(String filename) throws IOException, CsvValidationException {
        List<PointDTO> points = new ArrayList<>();
        try (
                CSVReader reader = new CSVReader(new FileReader(filename))) {
            String[] line;
            reader.readNext(); // skip header
            while ((line = reader.readNext()) != null) {
                PointDTO point = new PointDTO();
                point.setX(Double.parseDouble(line[0]));
                point.setY(Double.parseDouble(line[1])); // es. gasTotalMean
                points.add(point);
            }
        }
        return points;
    }
}

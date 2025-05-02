package com.bcsimulator.service;

import com.bcsimulator.model.CsvFile;
import com.bcsimulator.dto.ChartDataResponseDTO;
import com.bcsimulator.dto.ChartRequestDTO;
import com.bcsimulator.dto.ChartSeries;
import com.bcsimulator.dto.DataSetRequestDTO;
import com.bcsimulator.repository.CsvFileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ChartService {

    @Autowired
    private CsvFileRepository repository;

    public ChartDataResponseDTO generateChartData(ChartRequestDTO request) {
        List<String> labels = new ArrayList<>();
        List<ChartSeries> seriesList = new ArrayList<>();

        for (DataSetRequestDTO dsRequest : request.getDatasets()) {
            CsvFile file = repository.findById(dsRequest.getFileId())
                    .orElseThrow(() -> new RuntimeException("File not found"));

            Map<String, Integer> colIndex = new HashMap<>();
            Map<String, List<Double>> columnData = new HashMap<>();  // Mappa per i dati delle colonne

            try (BufferedReader reader = new BufferedReader(new FileReader(file.getPath()))) {
                // Legge la prima riga dell'header
                String headerLine = reader.readLine();
                if (headerLine != null) {
                    // Separiamo l'header usando \t
                    String[] header = headerLine.split("\t");
                    for (int i = 0; i < header.length; i++) {
                        String columnName = header[i].trim();  // Rimuove eventuali spazi bianchi
                        if (dsRequest.getColumns().contains(columnName)) {
                            colIndex.put(columnName, i);
                            columnData.put(columnName, new ArrayList<>());  // Crea una lista per ogni colonna
                        }
                    }
                }

                // Legge ogni linea successiva del CSV
                String line;
                int rowCount = 0;  // Contatore righe
                while ((line = reader.readLine()) != null) {
                    rowCount++;  // Incrementa il contatore righe

                    // Separiamo la riga con \t per ottenere i valori delle colonne
                    String[] lineValues = line.split("\t");

                    // Aggiungi il valore della prima colonna come "time" per tutte le righe
                    if (labels.size() < rowCount) {
                        labels.add(lineValues[0]); // prima colonna = time
                    }

                    // Aggiungi i valori per ogni colonna specificata
                    for (String col : dsRequest.getColumns()) {
                        Integer columnIndex = colIndex.get(col); // Ottiene l'indice della colonna
                        if (columnIndex != null && columnIndex < lineValues.length) {  // Verifica che l'indice non sia fuori dal range
                            try {
                                // Aggiungi il valore della colonna alla lista corrispondente
                                columnData.get(col).add(Double.parseDouble(lineValues[columnIndex]));
                            } catch (NumberFormatException e) {
                                // Gestisce l'errore se il valore non è un numero valido
                                System.err.println("Valore non numerico per la colonna '" + col + "' nella riga: " + line);
                            }
                        } else {
                            // Gestisci l'errore se la colonna non è trovata
                            System.err.println("Colonna '" + col + "' non trovata nel file.");
                        }
                    }
                }

                // Debug: stampa il numero di righe lette
                System.out.println("Totale righe lette: " + rowCount);

            } catch (IOException e) {
                throw new RuntimeException("Errore durante la lettura del file CSV", e);
            }

            // Crea le serie per ogni colonna
            for (String col : dsRequest.getColumns()) {
                seriesList.add(new ChartSeries(file.getName() + " - " + col, columnData.get(col)));
            }
        }

        return new ChartDataResponseDTO(seriesList);
    }

}

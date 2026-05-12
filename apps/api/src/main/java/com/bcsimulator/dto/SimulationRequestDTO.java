package com.bcsimulator.dto;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.batch.core.JobParameters;
import org.springframework.batch.core.JobParametersBuilder;

import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Slf4j
public class SimulationRequestDTO {
    List<String> entities;
    List<EventDTO> events;
    @NotNull(message = "Simulation name is required")
    String name;
    String description;
    int numAggr;
    int maxTime;
    int numRuns;
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();


    public String toJson() {
        try {
            return new ObjectMapper().writerWithDefaultPrettyPrinter().writeValueAsString(this);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
    }

    public JobParameters toJobParameters() throws JsonProcessingException {
        normalize();
        String outputFile = buildOutFileName("./output", this.maxTime, this.numAggr, this.name);

        return new JobParametersBuilder()
                .addLong("timestamp", System.currentTimeMillis()) // per unicità
                .addLong("numAggr", (long) this.numAggr)
                .addLong("maxTime", (long) this.maxTime)
                .addString("name", Objects.requireNonNullElse(this.name, "Simulation"))
                .addString("description", Objects.requireNonNullElse(this.description, ""))
                .addLong("numRuns", (long) this.numRuns)
                .addString("outfile", outputFile)
                .addString("events", OBJECT_MAPPER.writeValueAsString(this.events))
                .addString("entities", OBJECT_MAPPER.writeValueAsString(this.entities))
                .addString("uuid", java.util.UUID.randomUUID().toString())
                .toJobParameters();
    }


    private String buildOutFileName(String dir, int maxTime, int numAggr, String name) {
        File outputDir = new File(dir);
        if (!outputDir.exists() && !outputDir.mkdirs()) {
            throw new IllegalStateException("Failed to create output directory: " + outputDir.getAbsolutePath());
        }
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
        String timestamp = LocalDateTime.now().format(formatter);
        String safeName = Objects.requireNonNullElse(name, "Simulation").trim().replaceAll("[^a-zA-Z0-9._-]", "_");
        return dir + "/" + safeName + "_t" + maxTime + "_aggr" + numAggr + "_" + timestamp + ".tsv";
    }

    public void normalize() {
        if (entities == null) {
            entities = new ArrayList<>();
        }
        if (events == null) {
            events = new ArrayList<>();
        }
        events.forEach(EventDTO::normalize);
    }

    public static SimulationRequestDTO fromJobParameters(JobParameters params) {

        SimulationRequestDTO dto = new SimulationRequestDTO();

        dto.setNumAggr(params.getLong("numAggr").intValue());
        dto.setMaxTime(params.getLong("maxTime").intValue());
        dto.setNumRuns(params.getLong("numRuns").intValue());
        dto.setName(params.getString("name"));
        dto.setDescription(params.getString("description"));

        // Per la lista events, se è serializzata come JSON, possiamo deserializzarla
        String eventsJson = params.getString("events");
        log.info("eventsJson: " + eventsJson);
        if (eventsJson != null) {
            ObjectMapper objectMapper = new ObjectMapper();
            try {
                List<EventDTO> events = objectMapper.readValue(eventsJson, new TypeReference<List<EventDTO>>() {
                });
                dto.setEvents(events);
            } catch (IOException e) {
                throw new RuntimeException("Failed to deserialize events", e);
            }
        }


        // Deserialize entities
        String entitiesJson = params.getString("entities");
        if (entitiesJson != null && !entitiesJson.isEmpty()) {
            try {
                List<String> entities = OBJECT_MAPPER.readValue(entitiesJson, new TypeReference<List<String>>() {
                });
                dto.setEntities(entities);
            } catch (IOException e) {
                log.error("Failed to deserialize entities", e);
                throw new RuntimeException("Failed to deserialize entities", e);
            }
        }

        dto.normalize();
        return dto;
    }


    private static final ObjectMapper objectMapper = new ObjectMapper();

    public static SimulationRequestDTO fromJobParametersTo(JobParameters jobParameters) {
        String json = jobParameters.getString("simulationRequest");
        try {
            return objectMapper.readValue(json, SimulationRequestDTO.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse SimulationRequestDTO from JobParameters", e);
        }
    }
}

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

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

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
        ObjectMapper objectMapper = new ObjectMapper();
        String eventsJson;

        try {
            eventsJson = objectMapper.writeValueAsString(this.events);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize events list", e);
        }

        return new JobParametersBuilder()
                .addLong("timestamp", System.currentTimeMillis()) // per unicità
                .addLong("numAggr", (long) this.numAggr)
                .addLong("maxTime", (long) this.maxTime)
                .addString("name", this.name)
                .addLong("maxTime", (long) this.maxTime)
                .addLong("numRuns", (long) this.numRuns)
                .addString("outfile", buildOutFileName("./output",this.maxTime, this.numAggr,this.name))
                .addString("events", OBJECT_MAPPER.writeValueAsString(this.events))
                .addString("entities", OBJECT_MAPPER.writeValueAsString(this.entities))
                .addString("uuid", java.util.UUID.randomUUID().toString())
                .toJobParameters();
    }


    private String buildOutFileName(String dir, int maxTime, int numAggr, String name) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
        String timestamp = LocalDateTime.now().format(formatter);
        return dir + "/" + name + "_t" + maxTime + "_aggr" + numAggr + "_" + timestamp + ".tsv";
    }

    public static SimulationRequestDTO fromJobParameters(JobParameters params) {

        SimulationRequestDTO dto = new SimulationRequestDTO();

        dto.setNumAggr(params.getLong("numAggr").intValue());
        dto.setMaxTime(params.getLong("maxTime").intValue());
        dto.setNumRuns(params.getLong("numRuns").intValue());
        dto.setName(params.getString("name"));

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

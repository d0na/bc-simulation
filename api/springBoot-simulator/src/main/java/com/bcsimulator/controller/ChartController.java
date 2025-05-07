package com.bcsimulator.controller;

import com.bcsimulator.dto.ChartDataResponseDTO;
import com.bcsimulator.dto.graph.GraphRequestDTO;
import com.bcsimulator.service.ChartService;
import com.bcsimulator.dto.ChartRequestDTO;
import com.bcsimulator.service.GnuplotService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;

@RestController
@RequestMapping("/results/charts")
public class ChartController {

    @Autowired
    private ChartService service;
    @Autowired
    private GnuplotService graphService;

    @PostMapping("/preview")
    public ChartDataResponseDTO generateChart(@RequestBody ChartRequestDTO request) {
        return service.getData(request);
    }

    @PostMapping("/generate")
    public ResponseEntity<String> generateGraph(@RequestBody GraphRequestDTO request) {
        try {
            graphService.generateGraph(request);
            return ResponseEntity.ok("Graph generated successfully: " + request.getTitle() + "." + request.getOutputFormat());
        } catch (IOException | InterruptedException e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error generating graph: " + e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid request: " + e.getMessage());
        }
    }

    @PostMapping(value = "/generate2", produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<byte[]> generateGraph2(@RequestBody GraphRequestDTO request) {
        try {
            byte[] imageBytes = graphService.getGraphImage(request);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.IMAGE_PNG); // o IMAGE_SVG_XML se svg
            headers.setContentDisposition(ContentDisposition
                    .attachment()
                    .filename("graph" + "." + request.getOutputFormat())
                    .build());

            return new ResponseEntity<>(imageBytes, headers, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}

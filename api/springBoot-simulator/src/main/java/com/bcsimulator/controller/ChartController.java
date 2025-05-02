package com.bcsimulator.controller;

import com.bcsimulator.dto.ChartDataResponseDTO;
import com.bcsimulator.service.ChartService;
import com.bcsimulator.dto.ChartRequestDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/results/charts")
public class ChartController {

    @Autowired
    private ChartService service;

    @PostMapping("/preview")
    public ChartDataResponseDTO generateChart(@RequestBody ChartRequestDTO request) {
        return service.generateChartData(request);
    }
}

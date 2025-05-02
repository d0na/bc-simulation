package com.example.demo.controller;

import com.example.demo.dto.ChartDataResponseDTO;
import com.example.demo.dto.ChartRequestDTO;
import com.example.demo.service.ChartService;
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

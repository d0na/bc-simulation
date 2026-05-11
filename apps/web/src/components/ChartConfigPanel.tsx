import React from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, OutlinedInput, Chip, Typography, SelectChangeEvent } from '@mui/material';
import {CsvFile} from "./types/CsvFile.ts";

interface Props {
    selectedFiles: CsvFile[];
    chartConfig: { columns: string[]; type: string };
    setChartConfig: (config: { columns: string[]; type: string }) => void;
}

const ChartConfigPanel: React.FC<Props> = ({ selectedFiles, chartConfig, setChartConfig }) => {
    const allColumns = [...new Set(selectedFiles.flatMap((f) => f.columns[0]?.split('\t') ?? []))];

    const handleColumnsChange = (event: SelectChangeEvent<string[]>) => {
        const value = event.target.value as string[];
        setChartConfig({ ...chartConfig, columns: value });
    };

    const handleTypeChange = (event: SelectChangeEvent) => {
        setChartConfig({ ...chartConfig, type: event.target.value });
    };

    return (
        <Box sx={{ my: 2 }}>
            <Typography variant="h6">Configura Grafico</Typography>

            <FormControl fullWidth sx={{ mt: 1 }}>
                <InputLabel>Colonne</InputLabel>
                <Select
                    multiple
                    value={chartConfig.columns}
                    onChange={handleColumnsChange}
                    input={<OutlinedInput label="Colonne" />}
                    renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                            {(selected as string[]).map((val) => <Chip key={val} label={val} sx={{ m: 0.5 }} />)}
                        </Box>
                    )}
                >
                    {allColumns.map((col) => (
                        <MenuItem key={col} value={col}>{col}</MenuItem>
                    ))}
                </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Tipo di Grafico</InputLabel>
                <Select value={chartConfig.type} onChange={handleTypeChange}>
                    <MenuItem value="line">Line Chart</MenuItem>
                    <MenuItem value="bar">Bar Chart</MenuItem>
                    <MenuItem value="area">Area Chart</MenuItem>
                </Select>
            </FormControl>
        </Box>
    );
};

export default ChartConfigPanel;

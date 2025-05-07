import React, { useState, useMemo } from "react";
import {
    Box,
    Checkbox,
    FormControlLabel,
    Button,
    TextField,
    Typography,
    Select,
    MenuItem,
    InputLabel,
    FormControl,
} from "@mui/material";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ReferenceLine,
} from "recharts";

interface ChartSeries {
    label: string;
    data: number[];
}

interface ChartDataResponseDTO {
    series: ChartSeries[];
}

interface Props {
    data: ChartDataResponseDTO;
}

interface ChartPoint {
    [key: string]: number;
}

const COLORS = [
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#ff7300",
    "#413ea0",
    "#ff4c4c",
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
];

const DynamicChartViewer: React.FC<Props> = ({ data }) => {
    const [selectedX, setSelectedX] = useState<string>("");
    const [selectedSeries, setSelectedSeries] = useState<string[]>([]);
    const [refLines, setRefLines] = useState<number[]>([]);
    const [newRefLine, setNewRefLine] = useState("");
    const [formula, setFormula] = useState<string>("");
    const [chartConfig, setChartConfig] = useState<{
        x: string;
        series: string[];
        refLines: number[];
        formula: string;
    } | null>(null);

    // Prepara i dati per il grafico
    const chartData = useMemo<ChartPoint[]>(() => {
        if (data.series.length === 0) return [];

        const length = data.series[0].data.length;
        const points: ChartPoint[] = [];

        for (let i = 0; i < length; i++) {
            const point: ChartPoint = {};
            data.series.forEach((series) => {
                point[series.label] = series.data[i];
            });

            // Se è stata impostata una formula, calcolala
            if (chartConfig?.formula) {
                try {
                    // Sostituisco nel testo della formula i valori delle serie al tempo i
                    const formulaExpr = chartConfig.formula.replace(
                        /\b[a-zA-Z0-9 _\-]+\b/g,
                        (match) => {
                            const value = point[match];
                            return value !== undefined ? value.toString() : "0";
                        }
                    );
                    point["formula"] = eval(formulaExpr);
                } catch (err) {
                    point["formula"] = 0;
                }
            }

            points.push(point);
        }

        return points;
    }, [data, chartConfig]);

    const toggleSeries = (label: string) => {
        setSelectedSeries((prev) =>
            prev.includes(label)
                ? prev.filter((l) => l !== label)
                : [...prev, label]
        );
    };

    const addReferenceLine = () => {
        const value = parseFloat(newRefLine);
        if (!isNaN(value)) {
            setRefLines((prev) => [...prev, value]);
            setNewRefLine("");
        }
    };

    const applyChartConfig = () => {
        setChartConfig({
            x: selectedX,
            series: selectedSeries,
            refLines,
            formula,
        });
    };

    return (
        <Box p={2}>
            <Typography variant="h5" gutterBottom>
                Dynamic Chart Viewer
            </Typography>

            {/* Selezione Asse X */}
            <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="x-select-label">Asse X</InputLabel>
                <Select
                    labelId="x-select-label"
                    value={selectedX}
                    onChange={(e) => setSelectedX(e.target.value)}
                    label="Asse X"
                >
                    {data.series.map((series) => (
                        <MenuItem key={series.label} value={series.label}>
                            {series.label}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            {/* Selezione Serie Y */}
            <Box display="flex" flexWrap="wrap" mb={2}>
                {data.series.map(
                    (series) =>
                        series.label !== selectedX && (
                            <FormControlLabel
                                key={series.label}
                                control={
                                    <Checkbox
                                        checked={selectedSeries.includes(series.label)}
                                        onChange={() => toggleSeries(series.label)}
                                    />
                                }
                                label={series.label}
                            />
                        )
                )}
            </Box>

            {/* Aggiunta Reference Line */}
            <Box display="flex" alignItems="center" mb={2}>
                <TextField
                    label="Aggiungi linea Y"
                    value={newRefLine}
                    onChange={(e) => setNewRefLine(e.target.value)}
                    type="number"
                    size="small"
                />
                <Button
                    onClick={addReferenceLine}
                    variant="contained"
                    sx={{ ml: 2 }}
                    disabled={!selectedX}
                >
                    Aggiungi
                </Button>
            </Box>

            {/* Formula */}
            <TextField
                label="Formula (es. 'sim1 - sim2')"
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
                fullWidth
                sx={{ mb: 2 }}
            />

            {/* Applica Config */}
            <Button
                variant="contained"
                color="primary"
                onClick={applyChartConfig}
                disabled={!selectedX}
                sx={{ mb: 3 }}
            >
                Applica
            </Button>

            {/* Grafico */}
            {chartConfig && (
                <LineChart width={900} height={450} data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={chartConfig.x} />
                    <YAxis />
                    <Tooltip />
                    <Legend />

                    {/* Serie Y */}
                    {chartConfig.series.map((label, idx) => (
                        <Line
                            key={label}
                            type="monotone"
                            dataKey={label}
                            stroke={COLORS[idx % COLORS.length]}
                            dot={false}
                        />
                    ))}

                    {/* Formula */}
                    {chartConfig.formula && (
                        <Line
                            type="monotone"
                            dataKey="formula"
                            stroke="#000"
                            strokeDasharray="5 5"
                            dot={false}
                        />
                    )}

                    {/* Reference lines */}
                    {chartConfig.refLines.map((value, idx) => (
                        <ReferenceLine
                            key={`ref-${value}-${idx}`}
                            y={value}
                            label={`Y=${value}`}
                            stroke="red"
                        />
                    ))}
                </LineChart>
            )}
        </Box>
    );
};

export default DynamicChartViewer;

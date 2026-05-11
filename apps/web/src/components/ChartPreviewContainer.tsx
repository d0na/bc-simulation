import React, { useState } from "react";
import axios from "axios";
import { Box, Button, TextField, Typography } from "@mui/material";
import DynamicChartViewer from "./DynamicChartViewer";

interface DatasetRequest {
    fileId: number;
    columns: string[];
}

const ChartPreviewContainer: React.FC = () => {
    const [datasets, setDatasets] = useState<DatasetRequest[]>([
        { fileId: 1, columns: ["time", "gasTotalMean(16)"] },
        { fileId: 2, columns: ["time", "gasTotalMean(16)"] },
    ]);

    const [chartData, setChartData] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFetchChart = async () => {
        try {
            const response = await axios.post("http://localhost:8099/results/charts/preview", {datasets}, {
                headers: { "Content-Type": "application/json" },
            });
            setChartData(response.data);
            setError(null);
        } catch (err: any) {
            console.error(err);
            setError("Errore nel recupero dati.");
        }
    };

    return (
        <Box p={2}>
            <Typography variant="h5" gutterBottom>
                Preview grafico da API
            </Typography>

            {/* Bottone per richiamare l'endpoint */}
            <Button variant="contained" onClick={handleFetchChart}>
                Carica grafico
            </Button>

            {error && (
                <Typography color="error" mt={2}>
                    {error}
                </Typography>
            )}

            {/* Se riceve dati li passa al viewer */}
            {chartData && (
                <Box mt={4}>
                    <DynamicChartViewer data={chartData} />
                </Box>
            )}
        </Box>
    );
};

export default ChartPreviewContainer;

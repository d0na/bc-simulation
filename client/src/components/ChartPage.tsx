import React, { useState } from "react";
import {
    Container,
    Stepper,
    Step,
    StepLabel,
    Typography,
    CircularProgress,
    Alert,
} from "@mui/material";
import SimulationSelector from "./SimulationSelector";
import ColumnsSelector from "./ColumnsSelector";
import axios from "axios";
import ChartViewerNew from "./ChartViewerNew.tsx";

const steps = ["Seleziona Simulazioni", "Seleziona Colonne", "Visualizza Grafico"];

const ChartPage: React.FC = () => {
    const [activeStep, setActiveStep] = useState(0);
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
    const [datasets, setDatasets] = useState<any[]>([]);
    const [chartData, setChartData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleNextFromFiles = (selected: string[]) => {
        setSelectedFiles(selected);
        setActiveStep(1);
    };

    const handleColumnsConfirm = (datasets: any[]) => {
        setDatasets(datasets);
        setLoading(true);
        setError(null);
        axios
            .post("http://localhost:8099/results/charts/preview", { datasets })
            .then((res) => {
                setChartData(res.data);
                setActiveStep(2);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Errore API:", err);
                setError("Errore nel recupero del grafico. Riprova.");
                setLoading(false);
            });
    };

    return (
        <Container sx={{ mt: 4 }}>
            <Typography variant="h4" sx={{ mb: 4 }}>
                Visualizzazione Risultati Simulazione
            </Typography>

            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                {steps.map((label) => (
                    <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>

            {activeStep === 0 && <SimulationSelector onNext={handleNextFromFiles} />}

            {activeStep === 1 && (
                <ColumnsSelector
                    selectedFiles={selectedFiles}
                    onConfirm={handleColumnsConfirm}
                />
            )}

            {activeStep === 2 && (
                <>
                    {loading && (
                        <div style={{ textAlign: "center", marginTop: 40 }}>
                            <CircularProgress />
                        </div>
                    )}

                    {error && (
                        <Alert severity="error" sx={{ mt: 3 }}>
                            {error}
                        </Alert>
                    )}

                    {chartData && !loading && !error ? (
                        <>
                            {console.log(chartData)} {/* Aggiungi questo per controllare i dati */}
                            <ChartViewerNew chartData={chartData} />
                        </>
                    ) : (
                        <Typography variant="h6" sx={{ mt: 4 }}>
                            Seleziona un grafico per visualizzare i dati.
                        </Typography>
                    )}
                </>
            )}

        </Container>
    );
};

export default ChartPage;

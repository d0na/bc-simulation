import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Box,
    Button,
    Card,
    CardContent,
    Checkbox,
    CircularProgress,
    Container,
    FormControl,
    FormControlLabel,
    FormGroup,
    FormLabel,
    Grid,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    SelectChangeEvent,
    Typography,
} from '@mui/material';
import {CsvFile} from "./types/CsvFile.ts";

// Interfacce per i tipi di dati
interface Simulation {
    id: string;
    name: string;
}

interface Column {
    name: string;
    type: string;
}

interface SelectedSimulation {
    simulationId: string;
    columns: string[];
}

interface ChartSeries {
    label: string;
    data: number[];
}

interface DataSetRequestDTO {
    simulationId: string;
    columns: string[];
}

interface ChartRequestDTO {
    datasets: DataSetRequestDTO[];
    chartType: string;
}

const chartTypes = ['line', 'bar', 'scatter', 'area'];

const SimulationColumnSelector: React.FC = () => {
    // Stati
    const [loading, setLoading] = useState<boolean>(true);
    const [simulations, setSimulations] = useState<CsvFile[]>([]);
    const [selectedSimulation, setSelectedSimulation] = useState<string>('');
    const [columns, setColumns] = useState<Column[]>([]);
    const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
    const [selectedDatasets, setSelectedDatasets] = useState<SelectedSimulation[]>([]);
    const [chartType, setChartType] = useState<string>('line');
    const [generatedJson, setGeneratedJson] = useState<string>('');

    // Carica la lista delle simulazioni all'avvio
    useEffect(() => {
        fetchSimulations();
    }, []);

    // Carica le colonne quando viene selezionata una simulazione
    useEffect(() => {
        if (selectedSimulation) {
            fetchColumns(selectedSimulation);
        } else {
            setColumns([]);
            setSelectedColumns([]);
        }
    }, [selectedSimulation]);

    // Funzione per caricare le simulazioni
    const fetchSimulations = async () => {
        setLoading(true);
        try {
            const response = await axios.get('http://localhost:8099/results/csv/files');
            setSimulations(response.data);
        } catch (error) {
            console.error('Errore nel caricamento delle simulazioni:', error);
        } finally {
            setLoading(false);
        }
    };

    // Funzione per caricare le colonne di una simulazione
    const fetchColumns = async (simulationId: string) => {
        setLoading(true);
        try {
            const response = await axios.get(`http://localhost:8099/results/csv/${simulationId}/columns`);
            setColumns(response.data);
        } catch (error) {
            console.error('Errore nel caricamento delle colonne:', error);
        } finally {
            setLoading(false);
        }
    };

    // Gestore del cambio della simulazione selezionata
    const handleSimulationChange = (event: SelectChangeEvent) => {
        setSelectedSimulation(event.target.value);
    };

    // Gestore del cambio delle colonne selezionate
    const handleColumnChange = (columnName: string) => {
        setSelectedColumns(prevSelected => {
            if (prevSelected.includes(columnName)) {
                return prevSelected.filter(name => name !== columnName);
            } else {
                return [...prevSelected, columnName];
            }
        });
    };

    // Gestore del cambio del tipo di grafico
    const handleChartTypeChange = (event: SelectChangeEvent) => {
        setChartType(event.target.value);
    };

    // Aggiunge una simulazione con le colonne selezionate
    const handleAddDataset = () => {
        if (selectedSimulation && selectedColumns.length > 0) {
            const newDataset: SelectedSimulation = {
                simulationId: selectedSimulation,
                columns: [...selectedColumns],
            };

            setSelectedDatasets(prev => [...prev, newDataset]);

            // Reset delle selezioni correnti
            setSelectedSimulation('');
            setSelectedColumns([]);
        }
    };

    // Rimuove un dataset
    const handleRemoveDataset = (index: number) => {
        setSelectedDatasets(prev => prev.filter((_, i) => i !== index));
    };

    // Genera il JSON finale
    const generateJson = () => {
        const chartRequest: ChartRequestDTO = {
            datasets: selectedDatasets.map(dataset => ({
                simulationId: dataset.simulationId,
                columns: dataset.columns,
            })),
            chartType: chartType,
        };

        setGeneratedJson(JSON.stringify(chartRequest, null, 2));
    };

    // Invia i dati all'API
    const sendToApi = async () => {
        try {
            const chartRequest: ChartRequestDTO = {
                datasets: selectedDatasets.map(dataset => ({
                    simulationId: dataset.simulationId,
                    columns: dataset.columns,
                })),
                chartType: chartType,
            };

            // Qui dovresti specificare l'URL corretto della tua API
            const response = await axios.post('http://localhost:8099/api/chart', chartRequest);

            alert('Dati inviati con successo!');
            console.log('Risposta API:', response.data);
        } catch (error) {
            console.error('Errore nell\'invio dei dati:', error);
            alert('Errore nell\'invio dei dati. Controlla la console per dettagli.');
        }
    };

    // Trova il nome della simulazione dato l'ID
    const getSimulationName = (id: string): string => {
        const simulation = simulations.find(sim => sim.id === id);
        return simulation ? simulation.name : id;
    };

    return (
        <Container maxWidth="lg">
            <Box sx={{ my: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Selettore Simulazioni e Colonne
                </Typography>

                <Grid container spacing={3}>
                    {/* Selezione della simulazione */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Seleziona Simulazione
                                </Typography>

                                <FormControl fullWidth margin="normal">
                                    <InputLabel>Simulazione</InputLabel>
                                    <Select
                                        value={selectedSimulation}
                                        onChange={handleSimulationChange}
                                        label="Simulazione"
                                    >
                                        {simulations.map((sim) => (
                                            <MenuItem key={sim.id} value={sim.id}>
                                                {sim.name} - {sim.createdAt}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                {loading && <CircularProgress size={24} sx={{ mt: 2 }} />}

                                {/* Selezione delle colonne */}
                                {selectedSimulation && columns.length > 0 && (
                                    <Box sx={{ mt: 3 }}>
                                        <FormControl component="fieldset" fullWidth>
                                            <FormLabel component="legend">Colonne</FormLabel>
                                            <FormGroup>
                                                {columns.map((column) => (
                                                    <FormControlLabel
                                                        key={column.name}
                                                        control={
                                                            <Checkbox
                                                                checked={selectedColumns.includes(column.name)}
                                                                onChange={() => handleColumnChange(column.name)}
                                                            />
                                                        }
                                                        label={`${column.name} (${column.type})`}
                                                    />
                                                ))}
                                            </FormGroup>
                                        </FormControl>
                                    </Box>
                                )}

                                {selectedSimulation && selectedColumns.length > 0 && (
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        sx={{ mt: 2 }}
                                        onClick={handleAddDataset}
                                    >
                                        Aggiungi Dataset
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Selezione del tipo di grafico e datasets selezionati */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Configura Grafico
                                </Typography>

                                <FormControl fullWidth margin="normal">
                                    <InputLabel>Tipo di Grafico</InputLabel>
                                    <Select
                                        value={chartType}
                                        onChange={handleChartTypeChange}
                                        label="Tipo di Grafico"
                                    >
                                        {chartTypes.map((type) => (
                                            <MenuItem key={type} value={type}>
                                                {type.charAt(0).toUpperCase() + type.slice(1)}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <Typography variant="subtitle1" sx={{ mt: 3 }}>
                                    Dataset Selezionati
                                </Typography>

                                {selectedDatasets.length === 0 ? (
                                    <Typography variant="body2" color="text.secondary">
                                        Nessun dataset selezionato
                                    </Typography>
                                ) : (
                                    selectedDatasets.map((dataset, index) => (
                                        <Paper
                                            key={index}
                                            elevation={1}
                                            sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}
                                        >
                                            <Typography variant="subtitle2">
                                                {getSimulationName(dataset.simulationId)}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {dataset.columns.join(', ')}
                                            </Typography>
                                            <Button
                                                size="small"
                                                color="error"
                                                onClick={() => handleRemoveDataset(index)}
                                                sx={{ mt: 1 }}
                                            >
                                                Rimuovi
                                            </Button>
                                        </Paper>
                                    ))
                                )}

                                {selectedDatasets.length > 0 && (
                                    <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            onClick={generateJson}
                                        >
                                            Genera JSON
                                        </Button>
                                        <Button
                                            variant="contained"
                                            color="success"
                                            onClick={sendToApi}
                                        >
                                            Invia all'API
                                        </Button>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Visualizzazione JSON */}
                    {generatedJson && (
                        <Grid item xs={12}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        JSON generato
                                    </Typography>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 2,
                                            bgcolor: 'grey.100',
                                            borderRadius: 1,
                                            overflow: 'auto',
                                            maxHeight: '300px'
                                        }}
                                    >
                                        <pre style={{ margin: 0 }}>{generatedJson}</pre>
                                    </Paper>
                                </CardContent>
                            </Card>
                        </Grid>
                    )}
                </Grid>
            </Box>
        </Container>
    );
};

export default SimulationColumnSelector;
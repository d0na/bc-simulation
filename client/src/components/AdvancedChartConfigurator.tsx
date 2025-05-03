import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
    Box, Checkbox, FormControlLabel, Button, TextField, Typography,
    Select, MenuItem, InputLabel, FormControl, CircularProgress,
    Tabs, Tab, Paper, Divider, IconButton, Tooltip as MuiTooltip,
    Alert, Chip, Stack, Slider, Switch, Dialog, DialogTitle,
    DialogContent, DialogActions, FormGroup, Grid
} from "@mui/material";
import {
    LineChart, Line, ScatterChart, Scatter, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine,
    ResponsiveContainer, ZAxis, Brush
} from "recharts";
import { AddCircle, Delete, Save, Visibility, GetApp } from "@mui/icons-material";
import * as math from 'mathjs';

// Types
interface CsvFile {
    id: number;
    name: string;
    path: string;
    createdAt: string;
    columns: string[];
}

interface ChartPoint {
    [key: string]: any;
}

interface PlotLayer {
    id: string;
    name: string;
    fileId: number | null;
    xColumn: string;
    yColumn: string;
    formula: string;
    type: 'line' | 'scatter' | 'area';
    style: {
        stroke: string;
        fill: string;
        opacity: number;
        lineWidth: number;
        pointSize: number;
        useBezier: boolean;
        fillArea: boolean;
    };
}

interface ChartRequest {
    datasets: {
        fileId: number;
        columns: string[];
        formula?: string;
    }[];
    chartType: string;
}

interface ChartSeries {
    label: string;
    data: number[];
}

// Component
const AdvancedChartConfigurator: React.FC = () => {
    // State
    const [activeTab, setActiveTab] = useState(0);
    const [files, setFiles] = useState<CsvFile[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [chartData, setChartData] = useState<ChartPoint[]>([]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [referenceLines, setReferenceLines] = useState<{value: number, label: string, color: string}[]>([]);
    const [newRefLine, setNewRefLine] = useState("");
    const [newRefLineLabel, setNewRefLineLabel] = useState("");
    const [newRefLineColor, setNewRefLineColor] = useState("#ff0000");

    // Layers state
    const [layers, setLayers] = useState<PlotLayer[]>([]);
    const [previewEnabled, setPreviewEnabled] = useState(false);
    const [exportDialogOpen, setExportDialogOpen] = useState(false);
    const [templateName, setTemplateName] = useState("");

    // Derived state
    const allColumns = useMemo(() => {
        const allCols: string[] = [];
        files.forEach(file => {
            file.columns.forEach(col => {
                if (!allCols.includes(col)) allCols.push(col);
            });
        });
        return allCols;
    }, [files]);

    const fileColumns = useMemo(() => {
        const cols: { [key: number]: string[] } = {};
        files.forEach(file => {
            cols[file.id] = file.columns;
        });
        return cols;
    }, [files]);

    const colorPalette = [
        "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd",
        "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"
    ];

    // Effects
    useEffect(() => {
        fetchFiles();
    }, []);

    useEffect(() => {
        if (previewEnabled && layers.some(l => l.fileId !== null)) {
            generateChartData();
        }
    }, [previewEnabled, layers]);

    // API Functions
    const fetchFiles = async () => {
        setIsLoading(true);
        try {
            const res = await axios.get("http://localhost:8099/results/csv/files");
            setFiles(res.data as CsvFile[]);
        } catch (err) {
            console.error(err);
            setErrorMessage("Errore nel caricamento dei file");
        } finally {
            setIsLoading(false);
        }
    };

    const generateChartData = async () => {
        if (layers.length === 0) return;

        setIsLoading(true);
        setErrorMessage(null);

        try {
            // Prepare request based on layers
            const request: ChartRequest = {
                datasets: layers
                    .filter(layer => layer.fileId !== null)
                    .map(layer => ({
                        fileId: layer.fileId as number,
                        columns: [layer.xColumn, layer.yColumn].filter(Boolean),
                        formula: layer.formula || undefined
                    })),
                chartType: "combined"
            };

            // For development, use mock data if API isn't available
            let chartSeriesData: ChartSeries[];
            try {
                const response = await axios.post("http://localhost:8099/results/charts/preview", request);
                chartSeriesData = response.data.series;
            } catch (apiErr) {
                console.warn("API call failed, using mock data", apiErr);
                // Generate mock data
                chartSeriesData = generateMockChartData(request);
            }

            // Transform data for Recharts format
            const transformedData = transformChartData(chartSeriesData, layers);
            setChartData(transformedData);
        } catch (err) {
            console.error("Error generating chart:", err);
            setErrorMessage("Errore nella generazione del grafico");
        } finally {
            setIsLoading(false);
        }
    };

    // Helper Functions
    const generateMockChartData = (request: ChartRequest): ChartSeries[] => {
        // Generate mock data for development/testing
        return request.datasets.map((dataset, idx) => {
            const xValues = Array.from({ length: 100 }, (_, i) => i);
            let yValues: number[];

            // Find the corresponding layer to get formula info
            const layer = layers.find(l => l.fileId === dataset.fileId &&
                l.xColumn === dataset.columns[0] &&
                l.yColumn === dataset.columns[1]);

            if (layer?.formula) {
                try {
                    // Generate data based on formula
                    const scope = { x: xValues };
                    const expr = layer.formula.replace(/\$(\d+)/g, (_, colIdx) => {
                        return `x[${colIdx-1}]`;
                    });
                    yValues = xValues.map(x => {
                        try {
                            scope.x = x;
                            return math.evaluate(expr, scope);
                        } catch {
                            return Math.random() * 100;
                        }
                    });
                } catch {
                    yValues = xValues.map(() => Math.random() * 100);
                }
            } else {
                // Simple sine wave with randomness for demo
                yValues = xValues.map(x =>
                    50 + 30 * Math.sin(0.1 * x + idx) + (Math.random() - 0.5) * 10
                );
            }

            return {
                label: layer?.name || `Series ${idx+1}`,
                data: yValues
            };
        });
    };

    const transformChartData = (seriesData: ChartSeries[], layersConfig: PlotLayer[]): ChartPoint[] => {
        if (!seriesData.length) return [];

        // Find the longest data series
        const maxLength = Math.max(...seriesData.map(s => s.data.length));
        const result: ChartPoint[] = [];

        for (let i = 0; i < maxLength; i++) {
            const point: ChartPoint = { index: i };

            // Add each series data to the point
            seriesData.forEach((series, seriesIdx) => {
                const layer = layersConfig[seriesIdx];
                if (layer && i < series.data.length) {
                    // Use x value if available, otherwise use index
                    point[layer.xColumn || 'x'] = i;
                    point[layer.name] = series.data[i];
                }
            });

            result.push(point);
        }

        return result;
    };

    const addLayer = () => {
        const newId = `layer-${Date.now()}`;
        const colorIndex = layers.length % colorPalette.length;

        setLayers([...layers, {
            id: newId,
            name: `Serie ${layers.length + 1}`,
            fileId: files.length > 0 ? files[0].id : null,
            xColumn: '',
            yColumn: '',
            formula: '',
            type: 'line',
            style: {
                stroke: colorPalette[colorIndex],
                fill: colorPalette[colorIndex],
                opacity: 0.8,
                lineWidth: 2,
                pointSize: 4,
                useBezier: false,
                fillArea: false
            }
        }]);
    };

    const removeLayer = (layerId: string) => {
        setLayers(layers.filter(layer => layer.id !== layerId));
    };

    const updateLayer = (layerId: string, updates: Partial<PlotLayer>) => {
        setLayers(layers.map(layer =>
            layer.id === layerId ? { ...layer, ...updates } : layer
        ));
    };

    const updateLayerStyle = (layerId: string, styleUpdates: Partial<PlotLayer['style']>) => {
        setLayers(layers.map(layer =>
            layer.id === layerId ? {
                ...layer,
                style: { ...layer.style, ...styleUpdates }
            } : layer
        ));
    };

    const addReferenceLine = () => {
        const value = parseFloat(newRefLine);
        if (!isNaN(value)) {
            setReferenceLines([...referenceLines, {
                value,
                label: newRefLineLabel || `Y=${value}`,
                color: newRefLineColor
            }]);
            setNewRefLine("");
            setNewRefLineLabel("");
        }
    };

    const removeReferenceLine = (index: number) => {
        setReferenceLines(referenceLines.filter((_, i) => i !== index));
    };

    const saveAsTemplate = () => {
        // Example implementation - would need backend API
        console.log("Saving template:", {
            name: templateName,
            layers,
            referenceLines
        });
        setExportDialogOpen(false);
        // Here you would call the API to save the template
    };

    const exportImage = () => {
        // This is a placeholder - actual implementation would use html2canvas or similar
        console.log("Exporting image");

        // Example approach (not implemented)
        /*
        html2canvas(document.querySelector("#chart-container")).then(canvas => {
          const link = document.createElement('a');
          link.download = 'chart.png';
          link.href = canvas.toDataURL();
          link.click();
        });
        */
    };

    // UI Components
    const renderTabs = () => (
        <Paper variant="outlined" sx={{ mb: 3 }}>
            <Tabs
                value={activeTab}
                onChange={(_, newValue) => setActiveTab(newValue)}
                variant="fullWidth"
            >
                <Tab label="Selezione File" />
                <Tab label="Configurazione Plot" />
                <Tab label="Anteprima" />
            </Tabs>
        </Paper>
    );

    const renderFileSelection = () => (
        <Box>
            <Typography variant="h6" gutterBottom>Seleziona File CSV:</Typography>

            {isLoading && <CircularProgress size={24} sx={{ ml: 2 }} />}
            {errorMessage && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert>}

            <Box display="flex" flexWrap="wrap" sx={{ mb: 3 }}>
                {files.map(file => (
                    <Chip
                        key={file.id}
                        label={file.name}
                        onClick={() => console.log("File info:", file)}
                        sx={{ m: 0.5 }}
                    />
                ))}
            </Box>

            <Button
                variant="contained"
                color="primary"
                onClick={fetchFiles}
                startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : undefined}
            >
                Aggiorna Lista File
            </Button>

            <Button
                variant="outlined"
                sx={{ ml: 2 }}
                onClick={() => setActiveTab(1)}
            >
                Avanti
            </Button>
        </Box>
    );

    const renderLayerConfiguration = () => (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Configurazione Layer Plot:</Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddCircle />}
                    onClick={addLayer}
                >
                    Aggiungi Layer
                </Button>
            </Box>

            {layers.length === 0 && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    Nessun layer configurato. Aggiungi un layer per iniziare.
                </Alert>
            )}

            {layers.map((layer, index) => (
                <Paper key={layer.id} variant="outlined" sx={{ p: 2, mb: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="subtitle1" fontWeight="bold">
                            Layer {index + 1}: {layer.name}
                        </Typography>
                        <IconButton color="error" onClick={() => removeLayer(layer.id)}>
                            <Delete />
                        </IconButton>
                    </Box>

                    <Grid container spacing={2}>
                        {/* Basic Config */}
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Nome Layer"
                                value={layer.name}
                                onChange={(e) => updateLayer(layer.id, { name: e.target.value })}
                                margin="dense"
                            />

                            <FormControl fullWidth margin="dense">
                                <InputLabel>File CSV</InputLabel>
                                <Select
                                    value={layer.fileId || ''}
                                    onChange={(e) => updateLayer(layer.id, { fileId: Number(e.target.value) })}
                                    label="File CSV"
                                >
                                    {files.map(file => (
                                        <MenuItem key={file.id} value={file.id}>{file.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {layer.fileId && (
                                <>
                                    <FormControl fullWidth margin="dense">
                                        <InputLabel>Colonna X</InputLabel>
                                        <Select
                                            value={layer.xColumn || ''}
                                            onChange={(e) => updateLayer(layer.id, { xColumn: e.target.value })}
                                            label="Colonna X"
                                        >
                                            {fileColumns[layer.fileId]?.map(col => (
                                                <MenuItem key={col} value={col}>{col}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    <FormControl fullWidth margin="dense">
                                        <InputLabel>Colonna Y</InputLabel>
                                        <Select
                                            value={layer.yColumn || ''}
                                            onChange={(e) => updateLayer(layer.id, { yColumn: e.target.value })}
                                            label="Colonna Y"
                                        >
                                            {fileColumns[layer.fileId]?.map(col => (
                                                <MenuItem key={col} value={col}>{col}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    <TextField
                                        fullWidth
                                        label="Formula (es. $16-$17 o sin($3)*$5)"
                                        value={layer.formula}
                                        onChange={(e) => updateLayer(layer.id, { formula: e.target.value })}
                                        helperText="Usa $n per riferimento alla colonna numero n"
                                        margin="dense"
                                    />
                                </>
                            )}
                        </Grid>

                        {/* Style Config */}
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth margin="dense">
                                <InputLabel>Tipo Plot</InputLabel>
                                <Select
                                    value={layer.type}
                                    onChange={(e) => updateLayer(layer.id, {
                                        type: e.target.value as 'line' | 'scatter' | 'area'
                                    })}
                                    label="Tipo Plot"
                                >
                                    <MenuItem value="line">Linea</MenuItem>
                                    <MenuItem value="scatter">Punti (Scatter)</MenuItem>
                                    <MenuItem value="area">Area</MenuItem>
                                </Select>
                            </FormControl>

                            <Box display="flex" alignItems="center" mt={1}>
                                <Typography variant="body2" mr={1}>Colore:</Typography>
                                <input
                                    type="color"
                                    value={layer.style.stroke}
                                    onChange={(e) => updateLayerStyle(layer.id, {
                                        stroke: e.target.value,
                                        fill: e.target.value
                                    })}
                                    style={{ width: 40, height: 30 }}
                                />

                                <Box ml={2}>
                                    <Typography variant="body2" gutterBottom>Opacità: {layer.style.opacity}</Typography>
                                    <Slider
                                        value={layer.style.opacity}
                                        min={0.1}
                                        max={1}
                                        step={0.1}
                                        onChange={(_, value) => updateLayerStyle(layer.id, { opacity: value as number })}
                                        sx={{ width: 100 }}
                                    />
                                </Box>
                            </Box>

                            {layer.type === 'line' && (
                                <>
                                    <Typography variant="body2" gutterBottom>Spessore linea: {layer.style.lineWidth}px</Typography>
                                    <Slider
                                        value={layer.style.lineWidth}
                                        min={1}
                                        max={5}
                                        step={0.5}
                                        onChange={(_, value) => updateLayerStyle(layer.id, { lineWidth: value as number })}
                                    />

                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={layer.style.useBezier}
                                                onChange={(e) => updateLayerStyle(layer.id, { useBezier: e.target.checked })}
                                            />
                                        }
                                        label="Smooth Bezier"
                                    />
                                </>
                            )}

                            {layer.type === 'scatter' && (
                                <>
                                    <Typography variant="body2" gutterBottom>Dimensione punti: {layer.style.pointSize}</Typography>
                                    <Slider
                                        value={layer.style.pointSize}
                                        min={1}
                                        max={10}
                                        step={1}
                                        onChange={(_, value) => updateLayerStyle(layer.id, { pointSize: value as number })}
                                    />
                                </>
                            )}

                            {layer.type === 'area' && (
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={layer.style.fillArea}
                                            onChange={(e) => updateLayerStyle(layer.id, { fillArea: e.target.checked })}
                                        />
                                    }
                                    label="Riempi Area"
                                />
                            )}
                        </Grid>
                    </Grid>
                </Paper>
            ))}

            {/* Reference Line config */}
            {layers.length > 0 && (
                <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Linee di Riferimento
                    </Typography>

                    <Box display="flex" alignItems="flex-end" mb={2}>
                        <TextField
                            label="Valore Y"
                            value={newRefLine}
                            onChange={(e) => setNewRefLine(e.target.value)}
                            type="number"
                            size="small"
                            sx={{ width: 100, mr: 2 }}
                        />

                        <TextField
                            label="Etichetta"
                            value={newRefLineLabel}
                            onChange={(e) => setNewRefLineLabel(e.target.value)}
                            size="small"
                            sx={{ width: 150, mr: 2 }}
                        />

                        <input
                            type="color"
                            value={newRefLineColor}
                            onChange={(e) => setNewRefLineColor(e.target.value)}
                            style={{ width: 40, height: 30, marginRight: 16 }}
                        />

                        <Button
                            variant="outlined"
                            onClick={addReferenceLine}
                            size="small"
                        >
                            Aggiungi
                        </Button>
                    </Box>

                    {referenceLines.map((line, idx) => (
                        <Chip
                            key={idx}
                            label={`${line.label} (${line.value})`}
                            onDelete={() => removeReferenceLine(idx)}
                            sx={{
                                m: 0.5,
                                bgcolor: `${line.color}22`,
                                borderLeft: `4px solid ${line.color}`
                            }}
                        />
                    ))}
                </Paper>
            )}

            <Box display="flex" justifyContent="space-between">
                <Button variant="outlined" onClick={() => setActiveTab(0)}>
                    Indietro
                </Button>

                <Box>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={previewEnabled}
                                onChange={(e) => setPreviewEnabled(e.target.checked)}
                            />
                        }
                        label="Preview in tempo reale"
                    />

                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => setActiveTab(2)}
                        disabled={layers.length === 0}
                        sx={{ ml: 2 }}
                    >
                        Anteprima
                    </Button>
                </Box>
            </Box>
        </Box>
    );

    const renderChart = () => {
        if (chartData.length === 0) {
            return (
                <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height={400}>
                    <Typography variant="body1" gutterBottom>
                        Nessun dato da visualizzare
                    </Typography>
                    <Button
                        variant="contained"
                        onClick={generateChartData}
                        disabled={layers.length === 0}
                    >
                        Genera Grafico
                    </Button>
                </Box>
            );
        }

        return (
            <Box id="chart-container" height={500} position="relative">
                {isLoading && (
                    <Box
                        position="absolute"
                        top="50%"
                        left="50%"
                        sx={{ transform: 'translate(-50%, -50%)' }}
                        zIndex={10}
                        bgcolor="rgba(255,255,255,0.7)"
                        p={3}
                        borderRadius={2}
                    >
                        <CircularProgress />
                        <Typography variant="body2" mt={1}>
                            Generazione grafico...
                        </Typography>
                    </Box>
                )}

                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={chartData}
                        margin={{ top: 20, right: 30, bottom: 30, left: 20 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey={layers[0]?.xColumn || 'index'}
                            label={{ value: layers[0]?.xColumn || 'X', position: 'bottom' }}
                        />
                        <YAxis label={{ value: 'Value', angle: -90, position: 'left' }} />
                        <Tooltip />
                        <Legend />
                        <Brush dataKey={layers[0]?.xColumn || 'index'} height={30} stroke="#8884d8" />

                        {layers.map(layer => {
                            if (layer.type === 'line') {
                                return (
                                    <Line
                                        key={layer.id}
                                        type={layer.style.useBezier ? "monotone" : "linear"}
                                        dataKey={layer.name}
                                        name={layer.name}
                                        stroke={layer.style.stroke}
                                        strokeWidth={layer.style.lineWidth}
                                        dot={{ r: layer.style.pointSize / 2 }}
                                        strokeOpacity={layer.style.opacity}
                                    />
                                );
                            } else if (layer.type === 'area') {
                                return (
                                    <Area
                                        key={layer.id}
                                        type={layer.style.useBezier ? "monotone" : "linear"}
                                        dataKey={layer.name}
                                        name={layer.name}
                                        stroke={layer.style.stroke}
                                        fill={layer.style.fill}
                                        strokeWidth={layer.style.lineWidth}
                                        fillOpacity={layer.style.opacity * (layer.style.fillArea ? 0.6 : 0)}
                                        strokeOpacity={layer.style.opacity}
                                    />
                                );
                            }
                            // Default to scatter
                            return null;
                        })}

                        {/* Render scatters separately for better readability */}
                        {layers.filter(l => l.type === 'scatter').length > 0 && (
                            <ScatterChart>
                                {layers.filter(l => l.type === 'scatter').map(layer => (
                                    <Scatter
                                        key={layer.id}
                                        name={layer.name}
                                        dataKey={layer.name}
                                        fill={layer.style.fill}
                                        fillOpacity={layer.style.opacity}
                                        shape="circle"
                                    >
                                        {/* This is for individual point customization if needed */}
                                    </Scatter>
                                ))}
                            </ScatterChart>
                        )}

                        {referenceLines.map((line, idx) => (
                            <ReferenceLine
                                key={idx}
                                y={line.value}
                                stroke={line.color}
                                strokeDasharray="3 3"
                                label={{
                                    value: line.label,
                                    position: 'right',
                                    fill: line.color,
                                    fontSize: 12
                                }}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </Box>
        );
    };

    const renderChartPreview = () => (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Anteprima Grafico</Typography>

                <Box>
                    <Button
                        variant="outlined"
                        startIcon={<Save />}
                        onClick={() => setExportDialogOpen(true)}
                        sx={{ mr: 1 }}
                    >
                        Salva/Esporta
                    </Button>

                    <Button
                        variant="contained"
                        onClick={generateChartData}
                        disabled={layers.length === 0}
                        startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <Visibility />}
                    >
                        Aggiorna
                    </Button>
                </Box>
            </Box>

            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                {renderChart()}
            </Paper>

            <Button variant="outlined" onClick={() => setActiveTab(1)}>
                Torna alla configurazione
            </Button>
        </Box>
    );

    const renderExportDialog = () => (
        <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)}>
            <DialogTitle>Salva o Esporta Grafico</DialogTitle>
            <DialogContent>
                <Typography variant="body2" gutterBottom>
                    Salva la configurazione come template o esporta il grafico come immagine
                </Typography>

                <TextField
                    fullWidth
                    label="Nome Template"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    margin="normal"
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setExportDialogOpen(false)}>
                    Annulla
                </Button>
                <Button onClick={saveAsTemplate} disabled={!templateName}>
                    Salva Template
                </Button>
                <Button onClick={exportImage} color="primary">
                    Esporta PNG
                </Button>
            </DialogActions>
        </Dialog>
    );

    // Main Render
    return (
        <Box p={3}>
            <Typography variant="h4" gutterBottom>
                GNUPlot-like Chart Configurator
            </Typography>

            {renderTabs()}

            {activeTab === 0 && renderFileSelection()}
            {activeTab === 1 && renderLayerConfiguration()}
            {activeTab === 2 && renderChartPreview()}

            {renderExportDialog()}
        </Box>
    );
};

export default AdvancedChartConfigurator;
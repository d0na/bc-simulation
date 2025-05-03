import React, {useEffect, useState} from 'react';
import axios from 'axios';
import {
    Box,
    Button,
    Checkbox,
    Chip,
    CircularProgress,
    Collapse,
    FormControl,
    FormControlLabel,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    TextField,
    Typography
} from '@mui/material';
import {Add, ExpandLess, ExpandMore, Remove, Send} from '@mui/icons-material';
import {Link} from "react-router-dom";

interface CsvFileDTO {
    id: number;
    name: string;
    path: string;
    createdAt: string;
    columns: string[];
}

interface FillConfigDTO {
    transparent: boolean;
    solid: number;
}

interface PlotConfigDTO {
    dataFileAlias: string;
    using: string;
    type: string;
    title: string;
    color: string;
    smooth: string;
    lineWidth: number;
    fill?: FillConfigDTO;
}

interface GraphRequestDTO {
    title: string;
    outputFormat: string;
    size: string;
    xlabel: string;
    ylabel: string;
    xRange: string;
    yRange: string;
    logscaleY: boolean;
    extraOptions?: string;
    dataFiles: {
        alias: string;
        path: string;
    }[];
    plots: PlotConfigDTO[];
}

const GraphRequestForm: React.FC = () => {
    const [csvFiles, setCsvFiles] = useState<CsvFileDTO[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<{ [key: string]: CsvFileDTO }>({});
    const [request, setRequest] = useState<GraphRequestDTO>({
        title: '',
        outputFormat: 'png',
        size: '800,600',
        xlabel: '',
        ylabel: '',
        xRange: '',
        yRange: '',
        logscaleY: false,
        extraOptions: '',  // <-- Inizializza il nuovo campo
        dataFiles: [],
        plots: []
    });

    const [expandedPlot, setExpandedPlot] = useState<number | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationResult, setGenerationResult] = useState<any>(null);

    useEffect(() => {
        axios.get('http://localhost:8099/results/csv/files')
            .then(response => setCsvFiles(response.data))
            .catch(error => console.error('Error fetching files:', error));
    }, []);

    const handleExportJson = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(request, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "graph_config.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleImportJson = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const jsonData = JSON.parse(e.target?.result as string);

                    // Inizializza i valori nei campi della form
                    setRequest(prev => ({
                        ...prev,
                        title: jsonData.title || '',
                        outputFormat: jsonData.outputFormat || 'png',
                        size: jsonData.size || '800,600',
                        xlabel: jsonData.xlabel || '',
                        ylabel: jsonData.ylabel || '',
                        xRange: jsonData.xRange || '',
                        yRange: jsonData.yRange || '',
                        logscaleY: jsonData.logscaleY || false,
                        dataFiles: jsonData.dataFiles || [],
                        plots: jsonData.plots || []
                    }));

                    // Inizializza i file selezionati
                    const files = jsonData.dataFiles.reduce((acc: { [key: string]: CsvFileDTO }, file: {
                        alias: string,
                        path: string
                    }) => {
                        const fileAlias = file.alias;
                        acc[fileAlias] = {
                            name: fileAlias,
                            path: file.path,
                            columns: [] // Assicurati di riempire anche la lista delle colonne
                        };
                        return acc;
                    }, {});

                    setSelectedFiles(files);
                } catch (error) {
                    alert("Invalid JSON file");
                }
            };
            reader.readAsText(file);
        }
    };


    const handleGenerateChart = async () => {
        setIsGenerating(true);
        try {
            const response = await axios.post(
                'http://localhost:8099/results/charts/generate2',
                request,
                {
                    headers: {'Content-Type': 'application/json'},
                    responseType: 'blob' // <-- fondamentale per ricevere l'immagine binaria
                }
            );

            // Crea un URL temporaneo per il blob ricevuto
            const imageUrl = URL.createObjectURL(response.data);
            setGenerationResult(imageUrl);
            console.log('Chart generated:', imageUrl);
        } catch (error) {
            console.error('Error generating chart:', error);
            setGenerationResult(null);
        } finally {
            setIsGenerating(false);
        }
    };


    const handleFileSelection = (file: CsvFileDTO) => {
        const alias = `${file.name} (${file.id})`; // Aggiunge ID per distinguere file con stesso nome
        const newSelectedFiles = {...selectedFiles};

        if (newSelectedFiles[alias]) {
            delete newSelectedFiles[alias];
        } else {
            newSelectedFiles[alias] = file;
        }
        setSelectedFiles(newSelectedFiles);

        setRequest(prev => ({
            ...prev,
            dataFiles: Object.entries(newSelectedFiles).map(([alias, file]) => ({
                alias,
                path: file.path
            }))
        }));
    };

    const formatUsingExpression = (expr: string) => {
        // Se è una semplice coppia di numeri (es. "1:2") lascia invariato
        if (/^\d+:\d+$/.test(expr)) return expr;

        // Altrimenti formatta come "1:($16-$17):($16+$17)"
        return expr.split(':').map((part, index) => {
            // Il primo elemento (indice 0) non deve avere $ nei numeri
            if (index === 0) return part;

            // Per gli altri elementi, aggiungi $ ai numeri dentro parentesi
            return part.replace(/(\d+)/g, (match) => {
                // Se il numero è già preceduto da $ o è dentro una formula matematica
                if (part.includes('(') && part.includes(')')) {
                    return `$${match}`;
                }
                return match;
            });
        }).join(':');
    };

    const addPlot = () => {
        setRequest(prev => ({
            ...prev,
            plots: [
                ...prev.plots,
                {
                    dataFileAlias: Object.keys(selectedFiles)[0] || '',
                    using: '',
                    type: 'line',
                    title: '',
                    color: '#000000',
                    smooth: '',
                    lineWidth: 1,
                    fill: {
                        transparent: false,
                        solid: 0.5
                    }
                }
            ]
        }));
        setExpandedPlot(request.plots.length);
    };

    const removePlot = (index: number) => {
        setRequest(prev => ({
            ...prev,
            plots: prev.plots.filter((_, i) => i !== index)
        }));
    };

    const updatePlot = (index: number, field: string, value: any) => {
        setRequest(prev => {
            const newPlots = [...prev.plots];

            // Formatta automaticamente l'espressione "using"
            if (field === 'using' && newPlots[index].dataFileAlias) {
                const file = selectedFiles[newPlots[index].dataFileAlias];
                value = formatUsingExpression(value, file?.columns || []);
            }

            if (field.includes('.')) {
                const [parent, child] = field.split('.');
                newPlots[index] = {
                    ...newPlots[index],
                    [parent]: {
                        ...(newPlots[index] as any)[parent],
                        [child]: value
                    }
                };
            } else {
                newPlots[index] = {
                    ...newPlots[index],
                    [field]: value
                };
            }
            return {...prev, plots: newPlots};
        });
    };

    const handleSubmit = async () => {
        try {
            const response = await axios.post(
                'http://localhost:8099/results/charts/generate',
                request,
                {
                    headers: {'Content-Type': 'application/json'}
                }
            );
            console.log('Chart generated:', response.data);
        } catch (error) {
            console.error('Error generating chart:', error);
        }
    };

    const getColumnSuggestions = (fileAlias: string) => {
        const file = selectedFiles[fileAlias];
        return file?.columns || [];
    };

    return (
        <Box sx={{p: 3}}>
            <Button component={Link} to="/" variant="contained" sx={{mb: 2}}>
                Back to Home
            </Button>
            <Typography variant="h4" gutterBottom>Graph Configuration</Typography>
            <Box sx={{display: 'flex', gap: 2, mb: 3}}>
                <Button variant="outlined" component="label">
                    Import Config JSON
                    <input type="file" hidden accept="application/json" onChange={handleImportJson}/>
                </Button>
            </Box>
            <Paper sx={{p: 3, mb: 3}}>
                <Typography variant="h6" gutterBottom>General Settings</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Title"
                            value={request.title}
                            onChange={(e) => setRequest({...request, title: e.target.value})}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                            <InputLabel>Output Format</InputLabel>
                            <Select
                                value={request.outputFormat}
                                onChange={(e) => setRequest({...request, outputFormat: e.target.value})}
                            >
                                <MenuItem value="png">PNG</MenuItem>
                                <MenuItem value="svg">SVG</MenuItem>
                                <MenuItem value="jpg">JPG</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Size (width,height)"
                            value={request.size}
                            onChange={(e) => setRequest({...request, size: e.target.value})}
                            helperText="Example: 800,600"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="X Label"
                            value={request.xlabel}
                            onChange={(e) => setRequest({...request, xlabel: e.target.value})}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Y Label"
                            value={request.ylabel}
                            onChange={(e) => setRequest({...request, ylabel: e.target.value})}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="X Range (min:max)"
                            value={request.xRange}
                            onChange={(e) => setRequest({...request, xRange: e.target.value})}
                            helperText="Example: 0:100"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Y Range (min:max)"
                            value={request.yRange}
                            onChange={(e) => setRequest({...request, yRange: e.target.value})}
                            helperText="Example: 0:100"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={request.logscaleY}
                                    onChange={(e) => setRequest({...request, logscaleY: e.target.checked})}
                                />
                            }
                            label="Logarithmic Y Scale"
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Extra GNUplot Options"
                            value={request.extraOptions || ''}
                            onChange={(e) => setRequest({...request, extraOptions: e.target.value})}
                            multiline
                            rows={4}
                            helperText="Enter additional GNUplot commands (e.g., set xrange [0:86400], set ytics font 'Times-New-Roman,15')"
                            placeholder={`set xrange [0:86400]\nset yrange [0:*]\nset xtics font 'Times-New-Roman,15'\nset ytics font 'Times-New-Roman,15'`}
                        />
                    </Grid>
                </Grid>
            </Paper>

            <Paper sx={{p: 3, mb: 3}}>
                <Typography variant="h6" gutterBottom>Select Data Files</Typography>
                <Grid container spacing={2}>
                    {csvFiles.map(file => {
                        const alias = `${file.name} (${file.id})`;
                        return (
                            <Grid item xs={12} sm={6} md={4} key={file.id}>
                                <Paper
                                    sx={{
                                        p: 2,
                                        border: selectedFiles[alias] ? '2px solid #1976d2' : '1px solid #ddd',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => handleFileSelection(file)}
                                >
                                    <Typography>{file.name}</Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        ID: {file.id} • {file.columns.length} columns
                                    </Typography>
                                </Paper>
                            </Grid>
                        );
                    })}
                </Grid>
            </Paper>

            <Paper sx={{p: 3, mb: 3}}>
                <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2}}>
                    <Typography variant="h6">Plot Configurations</Typography>
                    <Button startIcon={<Add/>} onClick={addPlot} disabled={Object.keys(selectedFiles).length === 0}>
                        Add Plot
                    </Button>
                </Box>

                {request.plots.map((plot, index) => (
                    <Paper key={index} sx={{p: 2, mb: 2}}>
                        <Box sx={{display: 'flex', justifyContent: 'space-between'}}>
                            <Typography variant="subtitle1">Plot {index + 1}</Typography>
                            <Box>
                                <IconButton onClick={() => setExpandedPlot(expandedPlot === index ? null : index)}>
                                    {expandedPlot === index ? <ExpandLess/> : <ExpandMore/>}
                                </IconButton>
                                <IconButton onClick={() => removePlot(index)}>
                                    <Remove color="error"/>
                                </IconButton>
                            </Box>
                        </Box>

                        <Collapse in={expandedPlot === index}>
                            <Grid container spacing={2} sx={{mt: 1}}>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth>
                                        <InputLabel>Data File</InputLabel>
                                        <Select
                                            value={plot.dataFileAlias}
                                            onChange={(e) => updatePlot(index, 'dataFileAlias', e.target.value)}
                                        >
                                            {Object.keys(selectedFiles).map(alias => (
                                                <MenuItem key={alias} value={alias}>{alias}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Using Expression"
                                        value={plot.using.replace(/\$/g, '')} // Rimuove $ per l'editing
                                        onChange={(e) => updatePlot(index, 'using', e.target.value)}
                                        helperText="Examples: 1:2 or 1:(16-17):(16+17)"
                                    />
                                    <Box sx={{mt: 1}}>
                                        <Typography variant="caption">Available columns:</Typography>
                                        <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1}}>
                                            {getColumnSuggestions(plot.dataFileAlias).map((col, i) => (
                                                <Chip
                                                    key={col}
                                                    label={`${i + 1}: ${col}`}
                                                    size="small"
                                                    onClick={() => {
                                                        const currentUsing = plot.using.replace(/\$/g, '');
                                                        updatePlot(
                                                            index,
                                                            'using',
                                                            currentUsing ? `${currentUsing}:${i + 1}` : `${i + 1}`
                                                        );
                                                    }}
                                                />
                                            ))}
                                        </Box>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth>
                                        <InputLabel>Plot Type</InputLabel>
                                        <Select
                                            value={plot.type}
                                            onChange={(e) => updatePlot(index, 'type', e.target.value)}
                                        >
                                            <MenuItem value="line">Line</MenuItem>
                                            <MenuItem value="points">Points</MenuItem>
                                            <MenuItem value="filledcurves">Filled Curves</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Title"
                                        value={plot.title}
                                        onChange={(e) => updatePlot(index, 'title', e.target.value)}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Color"
                                        type="color"
                                        value={plot.color}
                                        onChange={(e) => updatePlot(index, 'color', e.target.value)}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Line Width"
                                        type="number"
                                        inputProps={{min: 0.1, max: 10, step: 0.1}}
                                        value={plot.lineWidth}
                                        onChange={(e) => updatePlot(index, 'lineWidth', parseFloat(e.target.value))}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth>
                                        <InputLabel>Smooth Type</InputLabel>
                                        <Select
                                            value={plot.smooth || ''}
                                            onChange={(e) => updatePlot(index, 'smooth', e.target.value || undefined)}
                                            label="Smooth Type"
                                        >
                                            <MenuItem value="">None</MenuItem>
                                            <MenuItem value="bezier">Bezier</MenuItem>
                                            <MenuItem value="sbezier">Super Bezier</MenuItem>
                                            <MenuItem value="csplines">Cubic Splines</MenuItem>
                                            <MenuItem value="acsplines">Weighted Cubic Splines</MenuItem>
                                            <MenuItem value="unique">Unique</MenuItem>
                                            <MenuItem value="frequency">Frequency</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                {(plot.type === 'filledcurves' || plot.type === 'line') && (
                                    <>
                                        <Grid item xs={12} sm={6}>
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        checked={plot.fill?.transparent || false}
                                                        onChange={(e) => updatePlot(index, 'fill.transparent', e.target.checked)}
                                                    />
                                                }
                                                label="Transparent Fill"
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="Fill Opacity"
                                                type="number"
                                                inputProps={{min: 0, max: 1, step: 0.1}}
                                                value={plot.fill?.solid || 0.5}
                                                onChange={(e) => updatePlot(index, 'fill.solid', parseFloat(e.target.value))}
                                            />
                                        </Grid>
                                    </>
                                )}
                            </Grid>
                        </Collapse>
                    </Paper>
                ))}
            </Paper>

            <Box sx={{mt: 4}}>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleGenerateChart}
                    disabled={isGenerating || request.plots.length === 0}
                    startIcon={isGenerating ? <CircularProgress size={20}/> : <Send/>}
                    sx={{mt: 2}}
                >
                    {isGenerating ? 'Generating...' : 'Generate Chart'}
                </Button>
            </Box>
            <Box sx={{mt: 4}}>
                // Aggiungi questo componente dove vuoi mostrare il risultato
                {generationResult && (
                    <Paper sx={{p: 2, mt: 2}}>
                        <Typography variant="h6">Generation Result</Typography>
                        <img src={generationResult} alt="Generated Chart" style={{maxWidth: '100%'}}/>
                    </Paper>
                )}
            </Box>
            <Box sx={{mt: 4}}>
                <Typography variant="h6">Request JSON Preview</Typography>
                <Paper sx={{p: 2, mt: 1}}>
                    <pre style={{margin: 0, overflowX: 'auto'}}>
                        {JSON.stringify(request, null, 2)}
                    </pre>
                </Paper>
                <Box sx={{display: 'flex', gap: 2, mb: 3}}>
                    <Button variant="outlined" onClick={handleExportJson}>
                        Export Config JSON
                    </Button>

                </Box>
            </Box>


        </Box>

    );
};

export default GraphRequestForm;
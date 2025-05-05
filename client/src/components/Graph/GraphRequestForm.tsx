import React, { useEffect, useState } from 'react';
import {Box, Button, Paper, Typography, CircularProgress, Modal, Divider} from '@mui/material';
import {Send, Add, ArrowBack, AddCircle, Close} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import GeneralSettings from './GeneralSettings';
import FileSelector from './FileSelector';
import PlotConfiguration from './PlotConfiguration';
import {CsvFileDTO, GraphRequestDTO} from "../types/types.ts";
import {formatUsingExpression} from "../../utils.ts";
import IconButton from "@mui/material/IconButton";

const GraphRequestForm: React.FC = () => {
    const [csvFiles, setCsvFiles] = useState<CsvFileDTO[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<{ [key: string]: CsvFileDTO }>({});
    const [request, setRequest] = useState<GraphRequestDTO>({
        title: '',
        outputFormat: 'png',
        size: '800,600',
        xlabel: '',
        ylabel: '',
        xrange: '',
        yrange: '',
        logscaleY: false,
        extraOptions: '',
        dataFiles: [],
        plots: []
    });

    const [expandedPlot, setExpandedPlot] = useState<number | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationResult, setGenerationResult] = useState<any>(null);
    const [openJsonModal, setOpenJsonModal] = useState(false);
    const navigate = useNavigate();

    const handleOpenJsonModal = () => setOpenJsonModal(true);
    const handleCloseJsonModal = () => setOpenJsonModal(false);

    useEffect(() => {
        axios.get('http://localhost:8099/results/csv/files')
            .then(response => setCsvFiles(response.data))
            .catch(error => console.error('Error fetching files:', error));
    }, []);

    useEffect(() => {
        axios.get('http://localhost:8099/results/csv/files')
            .then(response => setCsvFiles(response.data))
            .catch(error => console.error('Error fetching files:', error));
    }, []);


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
                        xrange: jsonData.xRange || '',
                        yrange: jsonData.yRange || '',
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

    const handleExportJson = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(request, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `graph_config_${new Date().toISOString().slice(0, 10)}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleGenerateChart = async () => {
        setGenerationResult(null);
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
        <Box sx={{ p: 3 }}>


            <Typography variant="h4" gutterBottom>Graph Configuration</Typography>

            <GeneralSettings request={request} setRequest={setRequest} />
            <FileSelector
                csvFiles={csvFiles}
                selectedFiles={selectedFiles}
                handleFileSelection={handleFileSelection}
            />

            <Paper sx={{ p: 3, mb: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">Plot Configurations</Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddCircle />}
                        onClick={addPlot}
                        disabled={Object.keys(selectedFiles).length === 0}
                    >
                        Add Plot
                    </Button>
                </Box>
                {request.plots.map((plot, index) => (
                    <PlotConfiguration
                        key={index}
                        plot={plot}
                        index={index}
                        expandedPlot={expandedPlot}
                        selectedFiles={selectedFiles}
                        updatePlot={updatePlot}
                        removePlot={removePlot}
                        setExpandedPlot={setExpandedPlot}
                    />
                ))}
            </Paper>

            <Box sx={{ mt: 4 }}>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleGenerateChart}
                    disabled={isGenerating || request.plots.length === 0}
                    startIcon={isGenerating ? <CircularProgress size={20} /> : <Send />}
                    sx={{ mt: 2 }}
                >
                    {isGenerating ? 'Generating...' : 'Generate Chart'}
                </Button>
            </Box>

            {generationResult && (
                <Box sx={{ mt: 4 }}>
                    <Paper sx={{ p: 2, mt: 2 }}>
                        {/*<Typography variant="h6">Generation Result</Typography>*/}
                        <img src={generationResult} alt="Generated Chart" style={{ maxWidth: '100%' }} />
                    </Paper>
                </Box>
            )}

            <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                <Button variant="outlined" component="label"   sx={{ mb: 3 }} >
                    Import Config JSON
                    <input type="file" hidden accept="application/json" onChange={handleImportJson}/>
                </Button>
                <Button
                    variant="outlined"
                    onClick={handleOpenJsonModal}
                    sx={{ mb: 3 }}
                >
                    View JSON Config
                </Button>
                <Button
                    variant="outlined"
                    onClick={handleExportJson}
                    sx={{ mb: 3 }}
                >
                    Export Config JSON
                </Button>
            </Box>

            {/* Modal per visualizzare il JSON */}
            <Modal
                open={openJsonModal}
                onClose={handleCloseJsonModal}
                aria-labelledby="json-modal-title"
                aria-describedby="json-modal-description"
            >
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '80%',
                    maxWidth: 800,
                    bgcolor: 'background.paper',
                    boxShadow: 24,
                    p: 4,
                    borderRadius: 1,
                    maxHeight: '80vh',
                    overflow: 'auto'
                }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography id="json-modal-title" variant="h6">JSON Configuration</Typography>
                        <IconButton onClick={handleCloseJsonModal}>
                            <Close />
                        </IconButton>
                    </Box>
                    <Paper sx={{ p: 2 }}>
                        <pre style={{ margin: 0, overflowX: 'auto' }}>
                            {JSON.stringify(request, null, 2)}
                        </pre>
                    </Paper>
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="contained"
                            onClick={handleCloseJsonModal}
                            sx={{ mr: 2 }}
                        >
                            Close
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleExportJson}
                        >
                            Export JSON
                        </Button>
                    </Box>
                </Box>
            </Modal>
            <Divider sx={{ my: 2 }} />
            <Button
                variant="contained"
                color="primary"
                startIcon={<ArrowBack />}
                onClick={() => navigate('/')}
                sx={{ marginTop: 3 }}
            >
                Home
                </Button>

        </Box>
    );
};

export default GraphRequestForm;
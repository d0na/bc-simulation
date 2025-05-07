import React, { useState, useEffect } from 'react';
import { Box, Typography, Button } from '@mui/material';
import axios from 'axios';
import { Link } from 'react-router-dom';
import CsvFileList from '../components/CsvFileList';
import ChartConfigPanel from '../components/ChartConfigPanel';
import ChartViewer from '../components/ChartViewer';
import { CsvFile } from '../types/CsvFile';

const ResultsPage: React.FC = () => {
    const [csvFiles, setCsvFiles] = useState<CsvFile[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<CsvFile[]>([]);
    const [chartConfig, setChartConfig] = useState<{ columns: string[]; type: string }>({
        columns: [],
        type: 'line',
    });

    useEffect(() => {
        const fetchCsvFiles = async () => {
            try {
                const response = await axios.get<CsvFile[]>('http://localhost:8099/results/csv/files');
                setCsvFiles(response.data);
            } catch (error) {
                console.error('Errore recupero CSV:', error);
            }
        };

        fetchCsvFiles();
    }, []);

    return (
        <Box sx={{ p: 3 }} style={{backgroundColor: '#lightblue'}}>
            <Typography variant="h4" gutterBottom>📊 Risultati Simulazioni</Typography>
            <Button component={Link} to="/" variant="contained" sx={{ mb: 2 }}>
                Back to Home
            </Button>

            <CsvFileList csvFiles={csvFiles} selectedFiles={selectedFiles} setSelectedFiles={setSelectedFiles} />

            {selectedFiles.length > 0 && (
                <>
                    <ChartConfigPanel selectedFiles={selectedFiles} chartConfig={chartConfig} setChartConfig={setChartConfig} />
                    <ChartViewer selectedFiles={selectedFiles} chartConfig={chartConfig} />
                </>
            )}
        </Box>
    );
};

export default ResultsPage;

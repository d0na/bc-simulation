import React from 'react';
import { Box, Grid, Paper, Typography } from '@mui/material';
import {CsvFileDTO} from "../types/types.ts";

interface FileSelectorProps {
    csvFiles: CsvFileDTO[];
    selectedFiles: { [key: string]: CsvFileDTO };
    handleFileSelection: (file: CsvFileDTO) => void;
}

const FileSelector: React.FC<FileSelectorProps> = ({ csvFiles, selectedFiles, handleFileSelection }) => {
    return (
        <Paper sx={{ p: 3, mb: 3 }}>
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
    );
};

export default FileSelector;
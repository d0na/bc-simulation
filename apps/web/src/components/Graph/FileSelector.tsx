import React, { useState } from 'react';
import { Box, Paper, Typography, Modal, IconButton, Tooltip, Chip } from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import { Info, Code, CheckCircle } from '@mui/icons-material';
import {CsvFileDTO} from "../types/types.ts";

interface FileSelectorProps {
    csvFiles: CsvFileDTO[];
    selectedFiles: { [key: string]: CsvFileDTO };
    handleFileSelection: (file: CsvFileDTO) => void;
}

const modalStyle = {
    position: 'absolute' as 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '80%',
    maxHeight: '80vh',
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
    overflow: 'auto'
};

const CARD_HEIGHT = 90;

const FileSelector: React.FC<FileSelectorProps> = ({ csvFiles, selectedFiles, handleFileSelection }) => {
    const [selectedJson, setSelectedJson] = useState<string | null>(null);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('it-IT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    // Calcola il numero totale di file selezionati
    const selectedCount = Object.keys(selectedFiles).length;

    return (
        <Box sx={{ width: '100%', mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
                    Select Data Files
                </Typography>
                {selectedCount > 0 && (
                    <Typography variant="body2" color="primary">
                        {selectedCount} file{selectedCount > 1 ? 's' : ''} selected
                    </Typography>
                )}
            </Box>

            {/* Mostra i campi selezionati */}
            {selectedCount > 0 && (
                <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {Object.values(selectedFiles).map((file) => (
                        <Box key={file.id} sx={{ 
                            border: '1px solid #e0e0e0',
                            borderRadius: 1,
                            p: 1,
                            bgcolor: '#f5f5f5'
                        }}>
                            <Typography variant="caption" sx={{ fontWeight: 'medium', display: 'block' }}>
                                {file.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Selected columns: {file.columns.length}
                            </Typography>
                        </Box>
                    ))}
                </Box>
            )}

            <Grid container spacing={1.5}>
                {csvFiles.map((file) => (
                        <Grid item xs={12} sm={6} md={4} key={file.id}>
                            <Paper
                                sx={{
                                p: 1,
                                cursor: 'pointer',
                                border: selectedFiles[file.id] ? '2px solid #1976d2' : '1px solid #e0e0e0',
                                position: 'relative',
                                height: CARD_HEIGHT,
                                display: 'flex',
                                flexDirection: 'column',
                                bgcolor: selectedFiles[file.id] ? 'primary.50' : 'background.paper',
                                '&:hover': {
                                    boxShadow: 2,
                                    bgcolor: selectedFiles[file.id] ? 'primary.100' : 'grey.50'
                                }
                                }}
                                onClick={() => handleFileSelection(file)}
                            >
                            <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                mb: 0.25
                            }}>
                                <Box sx={{ flex: 1, mr: 0.5, display: 'flex', alignItems: 'center' }}>
                                    {selectedFiles[file.id] && (
                                        <CheckCircle 
                                            sx={{ 
                                                fontSize: '1rem', 
                                                color: 'primary.main',
                                                mr: 0.5 
                                            }} 
                                        />
                                    )}
                                    <Typography variant="caption" component="div" sx={{ 
                                        fontWeight: 'medium',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        fontSize: '0.875rem'
                                    }}>
                                        {file.name}
                                    </Typography>
                                </Box>
                                {file.configurationJson && (
                                    <IconButton 
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedJson(file.configurationJson);
                                        }}
                                        sx={{ 
                                            p: 0.25,
                                            '& .MuiSvgIcon-root': {
                                                fontSize: '1rem'
                                            }
                                        }}
                                    >
                                        <Code fontSize="small" />
                                    </IconButton>
                                )}
                            </Box>
                            
                            <Box sx={{ flex: 1, fontSize: '0.75rem' }}>
                                <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: 'inherit' }}>
                                    ID: {file.id}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: 'inherit' }}>
                                    Created: {formatDate(file.createdAt)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: 'inherit' }}>
                                    Columns: {file.columns.length}
                                </Typography>
                            </Box>

                            {file.description && (
                                <Tooltip title={file.description} placement="top">
                                    <IconButton 
                                        size="small" 
                                        sx={{ 
                                            position: 'absolute', 
                                            right: 2, 
                                            bottom: 2,
                                            p: 0.25,
                                            '& .MuiSvgIcon-root': {
                                                fontSize: '1rem'
                                            }
                                        }}
                                    >
                                        <Info fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            )}
                            </Paper>
                        </Grid>
                ))}
            </Grid>

            <Modal
                open={!!selectedJson}
                onClose={() => setSelectedJson(null)}
                aria-labelledby="json-modal-title"
            >
                <Box sx={modalStyle}>
                    <Typography id="json-modal-title" variant="h6" component="h2" gutterBottom>
                        Configuration JSON
                    </Typography>
                    <Box sx={{ 
                        backgroundColor: '#f5f5f5',
                        p: 2,
                        borderRadius: 1,
                        maxHeight: 'calc(70vh - 100px)',
                        overflow: 'auto'
                    }}>
                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
                            {selectedJson ? JSON.stringify(JSON.parse(selectedJson), null, 2) : ''}
                        </pre>
                    </Box>
                </Box>
            </Modal>
        </Box>
    );
};

export default FileSelector;

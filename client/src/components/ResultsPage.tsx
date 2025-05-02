import React, { useState, useEffect } from 'react';
import { List, ListItem, ListItemText, Drawer, Typography, Box, Divider } from '@mui/material';

const ResultsPage = () => {
    const [csvFiles, setCsvFiles] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        // Simulazione di una chiamata API per ottenere i dati
        const fetchCsvFiles = async () => {
            const response = await fetch('/results/csv/files');
            const data = await response.json();
            setCsvFiles(data);
        };

        fetchCsvFiles();
    }, []);

    const handleListItemClick = (file) => {
        setSelectedFile(file);
    };

    const handleDrawerClose = () => {
        setSelectedFile(null);
    };

    return (
        <Box sx={{ display: 'flex' }}>
            {/* Lista dei file CSV */}
            <List sx={{ width: 250, bgcolor: 'background.paper' }}>
                {csvFiles.map((file) => (
                    <ListItem button key={file.id} onClick={() => handleListItemClick(file)}>
                        <ListItemText primary={file.name} />
                    </ListItem>
                ))}
            </List>

            {/* Pannello laterale per il dettaglio */}
            <Drawer
                sx={{
                    width: 400,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: 400,
                        boxSizing: 'border-box',
                    },
                }}
                variant="persistent"
                anchor="right"
                open={Boolean(selectedFile)}
            >
                <Box sx={{ padding: 2 }}>
                    <Typography variant="h6">{selectedFile?.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                        {selectedFile?.path}
                    </Typography>
                    <Divider sx={{ marginY: 2 }} />
                    <Typography variant="body1">
                        <strong>Colonne:</strong>
                    </Typography>
                    <ul>
                        {selectedFile?.columns?.map((col, index) => (
                            <li key={index}>{col}</li>
                        ))}
                    </ul>
                    <Typography variant="body2" color="text.secondary">
                        Creato il: {new Date(selectedFile?.createdAt).toLocaleString()}
                    </Typography>
                    <Box sx={{ marginTop: 2 }}>
                        <button onClick={handleDrawerClose}>Chiudi</button>
                    </Box>
                </Box>
            </Drawer>
        </Box>
    );
};

export default ResultsPage;

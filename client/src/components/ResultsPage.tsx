import React, { useState, useEffect } from 'react';
import {
    List, ListItem, ListItemText, Drawer, Typography, Box, Divider, Button, AppBar, Toolbar, IconButton
} from '@mui/material';
import axios from "axios";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const ResultsPage = () => {
    const [csvFiles, setCsvFiles] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        const fetchCsvFiles = async () => {
            try {
                const response = await axios.get('http://localhost:8099/results/csv/files');
                setCsvFiles(response.data);
            } catch (error) {
                console.error('Errore nel recupero dei file CSV:', error);
            }
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
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>

            {/* AppBar superiore */}
            <AppBar position="static">
                <Toolbar>
                    <IconButton color="inherit" href="/" edge="start">
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>
                        Risultati Simulazioni
                    </Typography>
                </Toolbar>
            </AppBar>

            {/* Lista dei file CSV */}
            <Box sx={{ display: 'flex', flex: 1 }}>
                <List sx={{ width: 300, borderRight: '1px solid #ccc', overflowY: 'auto' }}>
                    {csvFiles.map((file) => (
                        <React.Fragment key={file.id}>
                            <ListItem button onClick={() => handleListItemClick(file)}>
                                <ListItemText primary={file.name} secondary={new Date(file.createdAt).toLocaleString()} />
                            </ListItem>
                            <Divider />
                        </React.Fragment>
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
                    <Box sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>{selectedFile?.name}</Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Percorso: {selectedFile?.path}
                        </Typography>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle1">Colonne</Typography>
                        <List dense>
                            {selectedFile?.columns?.map((col, index) => (
                                <ListItem key={index}>
                                    <ListItemText primary={col} />
                                </ListItem>
                            ))}
                        </List>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="body2" color="text.secondary">
                            Creato il: {new Date(selectedFile?.createdAt).toLocaleString()}
                        </Typography>
                        <Button variant="contained" color="primary" onClick={handleDrawerClose} sx={{ mt: 3 }}>
                            Chiudi Dettaglio
                        </Button>
                    </Box>
                </Drawer>
            </Box>
        </Box>
    );
};

export default ResultsPage;

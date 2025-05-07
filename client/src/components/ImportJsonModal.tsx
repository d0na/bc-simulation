import { useState } from 'react';
import {
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Box,
} from '@mui/material';
import { SimulatorFormModal } from './SimulatorFormModal';  // Importa il tuo form principale
import axios from 'axios';

const ImportJsonModal = ({ setFormData, formData }: any) => {
    const [open, setOpen] = useState(false);
    const [jsonInput, setJsonInput] = useState("");
    const [error, setError] = useState<string | null>(null);

    const handleJsonChange = (e: any) => {
        setJsonInput(e.target.value);
    };

    const handleJsonImport = () => {
        try {
            const parsedJson = JSON.parse(jsonInput);
            setFormData(parsedJson); // Carica i dati nel form
            setOpen(false); // Chiudi la modale
        } catch (e) {
            setError("Invalid JSON format");
        }
    };

    return (
        <>
            <Button variant="outlined" onClick={() => setOpen(true)}>
                Import JSON
            </Button>

            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
                <DialogTitle>Import Simulation Configuration</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Paste your JSON here"
                        multiline
                        rows={10}
                        variant="outlined"
                        fullWidth
                        value={jsonInput}
                        onChange={handleJsonChange}
                    />
                    {error && <Box color="error.main" mt={2}>{error}</Box>}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)} color="secondary">Cancel</Button>
                    <Button onClick={handleJsonImport} variant="contained" color="primary">
                        Import
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default ImportJsonModal;

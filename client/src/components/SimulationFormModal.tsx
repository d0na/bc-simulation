import  { useState } from 'react';
import {
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    FormControl,
    InputLabel,
    Select
} from '@mui/material';
import axios from "axios";

const SimulationFormModal = () => {
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({
        numAggr: 60,
        maxTime: 1209600,
        numRuns: 10,
        dir: './output/',
        simType: 'SimParams5Scaled'
    });

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault(); // 👈 previeni comportamento di default


        console.log('Form Submitted:', formData);
        try {
            const response = await axios.post('http://localhost:8099/simulate-rev', formData, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log('Risposta dal server:', response.data);
            setOpen(false);
        } catch (error) {
            console.error('Errore nella simulazione:', error);
        }
    };

    return (
        <>
            <Button variant="contained" onClick={() => setOpen(true)}>
                SIM
            </Button>

            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>Simulation Parameters</DialogTitle>
                <DialogContent>

                    <FormControl fullWidth margin="dense">
                        <InputLabel>Aggregation Granularity</InputLabel>
                        <Select
                            name="numAggr"
                            value={formData.numAggr}
                            label="Aggregation Granularity"
                            onChange={handleChange}
                        >
                            <MenuItem value={1}>SECONDS</MenuItem>
                            <MenuItem value={60}>MINUTES</MenuItem>
                            <MenuItem value={3600}>HOURS</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl fullWidth margin="dense">
                        <InputLabel>Simulation Duration</InputLabel>
                        <Select
                            name="maxTime"
                            value={formData.maxTime}
                            label="Simulation Duration"
                            onChange={handleChange}
                        >
                            <MenuItem value={86400}>ONE_DAY</MenuItem>
                            <MenuItem value={604800}>SEVEN_DAYS</MenuItem>
                            <MenuItem value={864000}>TEN_DAYS</MenuItem>
                            <MenuItem value={1209600}>TWO_WEEKS</MenuItem>
                            <MenuItem value={2592000}>ONE_MONTH</MenuItem>
                        </Select>
                    </FormControl>

                    <TextField
                        margin="dense"
                        label="Number of Runs" //
                        type="number"
                        name="numRuns"
                        value={formData.numRuns}
                        onChange={handleChange}
                        fullWidth
                    />

                    <TextField
                        margin="dense"
                        label="Directory Output"
                        name="dir"
                        value={formData.dir}
                        onChange={handleChange}
                        fullWidth
                    />

                    <FormControl fullWidth margin="dense">
                        <InputLabel>Sim Type</InputLabel>
                        <Select
                            name="simType"
                            value={formData.simType}
                            label="Sim Type"
                            onChange={handleChange}
                        >
                            <MenuItem value="SimParams5Scaled">SimParams5Scaled</MenuItem>
                            <MenuItem value="SimParams6Scaled">SimParams6Scaled</MenuItem> {/* Aggiungi qui */}
                        </Select>
                    </FormControl>

                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSubmit}>Submit</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default SimulationFormModal;

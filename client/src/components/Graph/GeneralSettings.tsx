import React from 'react';
import {
    Box,
    Typography,
    Grid,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormControlLabel,
    Checkbox
} from '@mui/material';

interface GeneralSettingsProps {
    request: any;
    setRequest: React.Dispatch<React.SetStateAction<any>>;
}

const GeneralSettings: React.FC<GeneralSettingsProps> = ({ request, setRequest }) => {
    return (
        <Box sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>General Settings</Typography>
            <Grid container spacing={2}>
                {/* Prima riga - Titolo e Formato */}
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        label="Title"
                        value={request.title}
                        onChange={(e) => setRequest({...request, title: e.target.value})}
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                        <InputLabel id="output-format-label" sx={{ backgroundColor: 'white', px: 0.5 }}>
                            Output Format
                        </InputLabel>
                        <Select
                            labelId="output-format-label"
                            value={request.outputFormat}
                            label="Output Format"
                            onChange={(e) => setRequest({ ...request, outputFormat: e.target.value })}
                        >
                            <MenuItem value="png">PNG</MenuItem>
                            <MenuItem value="svg">SVG</MenuItem>
                            <MenuItem value="jpg">JPG</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>

                {/* Seconda riga - Dimensioni e Labels */}
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        label="Size (width,height)"
                        value={request.size}
                        onChange={(e) => setRequest({...request, size: e.target.value})}
                        helperText="Example: 800,600"
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        label="X Label"
                        value={request.xlabel}
                        onChange={(e) => setRequest({...request, xlabel: e.target.value})}
                    />
                </Grid>

                {/* Terza riga - Y Label e Scala logaritmica */}
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        label="Y Label"
                        value={request.ylabel}
                        onChange={(e) => setRequest({...request, ylabel: e.target.value})}
                    />
                </Grid>
                <Grid item xs={12} md={6}>
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

                {/* Quarta riga - Range */}
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        label="X Range (min:max)"
                        value={request.xrange}
                        onChange={(e) => setRequest({...request, xrange: e.target.value})}
                        helperText="Example: 0:100"
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        label="Y Range (min:max)"
                        value={request.yrange}
                        onChange={(e) => setRequest({...request, yrange: e.target.value})}
                        helperText="Example: 0:100"
                    />
                </Grid>

                {/* Quinta riga - Opzioni extra (a larghezza intera) */}
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
        </Box>
    );
};

export default GeneralSettings;
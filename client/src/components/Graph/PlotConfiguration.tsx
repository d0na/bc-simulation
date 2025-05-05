import React from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    Grid,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    FormControlLabel,
    Checkbox,
    IconButton,
    Collapse,
    Alert,
    Slider,
    Stack,
    Divider
} from '@mui/material';
import { ExpandLess, ExpandMore, Delete, AddCircle } from '@mui/icons-material';
import { PlotConfigDTO } from '../types/types.ts';

interface PlotConfigurationProps {
    plot: PlotConfigDTO;
    index: number;
    expandedPlot: number | null;
    selectedFiles: { [key: string]: any };
    updatePlot: (index: number, field: string, value: any) => void;
    removePlot: (index: number) => void;
    setExpandedPlot: React.Dispatch<React.SetStateAction<number | null>>;
    onAddPlot: () => void;
    plotsCount: number;
    generationResult?: string;
}

const PlotConfiguration: React.FC<PlotConfigurationProps> = ({
                                                                 plot,
                                                                 index,
                                                                 expandedPlot,
                                                                 selectedFiles,
                                                                 updatePlot,
                                                                 removePlot,
                                                                 setExpandedPlot,
                                                                 onAddPlot,
                                                                 plotsCount,
                                                                 generationResult
                                                             }) => {
    const getColumnSuggestions = (fileAlias: string) => {
        const file = selectedFiles[fileAlias];
        return file?.columns || [];
    };

    const columns = getColumnSuggestions(plot.dataFileAlias);

    return (
        <Box>
            {plotsCount === 0 && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    ANy plot configured. Add a plot to get started.
                </Alert>
            )}

            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="subtitle1" fontWeight="bold">
                        Plot {index + 1}
                    </Typography>
                    <Box>
                        <IconButton
                            onClick={() => setExpandedPlot(expandedPlot === index ? null : index)}
                            size="small"
                        >
                            {expandedPlot === index ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                        <IconButton
                            color="error"
                            onClick={() => removePlot(index)}
                            size="small"
                        >
                            <Delete />
                        </IconButton>
                    </Box>
                </Box>

                <Collapse in={expandedPlot === index}>
                    <Grid container spacing={2}>
                        {/* Colonna sinistra - Configurazione dati */}
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth margin="dense">
                                <InputLabel>TSV file</InputLabel>
                                <Select
                                    value={plot.dataFileAlias}
                                    onChange={(e) => updatePlot(index, 'dataFileAlias', e.target.value)}
                                    label="File CSV"
                                >
                                    {Object.keys(selectedFiles).map(alias => (
                                        <MenuItem key={alias} value={alias}>{alias}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <TextField
                                fullWidth
                                label="Using Expression"
                                value={plot.using.replace(/\$/g, '')}
                                onChange={(e) => updatePlot(index, 'using', e.target.value)}
                                helperText="Examples: 1:2 or 1:(16-17):(16+17)"
                                margin="dense"
                            />

                            <TextField
                                fullWidth
                                label="Plot title"
                                value={plot.title}
                                onChange={(e) => updatePlot(index, 'title', e.target.value)}
                                margin="dense"
                            />
                        </Grid>

                        {/* Colonna destra - Stile linea */}
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth margin="dense">
                                <InputLabel>Plot Type</InputLabel>
                                <Select
                                    value={plot.type}
                                    onChange={(e) => updatePlot(index, 'type', e.target.value)}
                                    label="Plot Type"
                                >
                                    <MenuItem value="line">Linea</MenuItem>
                                    <MenuItem value="points">Punti</MenuItem>
                                    <MenuItem value="filledcurves">Aree</MenuItem>
                                </Select>
                            </FormControl>

                            <Box mt={2}>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Box>
                                        <Typography variant="body2">Colore</Typography>
                                        <input
                                            type="color"
                                            value={plot.color}
                                            onChange={(e) => updatePlot(index, 'color', e.target.value)}
                                            style={{ width: 40, height: 40 }}
                                        />
                                    </Box>

                                    <Box flex={1}>
                                        <Typography variant="body2">Spessore</Typography>
                                        <Slider
                                            value={plot.lineWidth}
                                            min={0.1}
                                            max={5}
                                            step={0.1}
                                            onChange={(_, value) => updatePlot(index, 'lineWidth', value)}
                                            valueLabelDisplay="auto"
                                            size="small"
                                        />
                                    </Box>
                                </Stack>

                                <Box mt={2}>
                                    <Typography variant="body2">Opacità</Typography>
                                    <Slider
                                        value={plot.fill?.solid || 0.5}
                                        min={0}
                                        max={1}
                                        step={0.1}
                                        onChange={(_, value) => updatePlot(index, 'fill.solid', value)}
                                        valueLabelDisplay="auto"
                                        size="small"
                                    />
                                </Box>
                            </Box>

                            {plot.type === 'line' && (
                                <FormControl fullWidth margin="dense" sx={{ mt: 1 }}>
                                    <InputLabel>Tipo Smooth</InputLabel>
                                    <Select
                                        value={plot.smooth || ''}
                                        onChange={(e) => updatePlot(index, 'smooth', e.target.value || undefined)}
                                        label="Tipo Smooth"
                                    >
                                        <MenuItem value="">None</MenuItem>
                                        <MenuItem value="bezier">Bezier</MenuItem>
                                        <MenuItem value="sbezier">Super Bezier</MenuItem>
                                        <MenuItem value="csplines">Cubic Splines</MenuItem>
                                        <MenuItem value="acsplines">Weighted Cubic Splines</MenuItem>
                                    </Select>
                                </FormControl>
                            )}

                            {(plot.type === 'filledcurves' || plot.type === 'line') && (
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={plot.fill?.transparent || false}
                                            onChange={(e) => updatePlot(index, 'fill.transparent', e.target.checked)}
                                        />
                                    }
                                    label="Transparent Fill"
                                    sx={{ mt: 1 }}
                                />
                            )}
                        </Grid>

                        {/* Lista colonne a larghezza intera */}
                        <Grid item xs={12}>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle2" gutterBottom>
                                Columns available in selected file:
                            </Typography>
                            <Box display="flex" flexWrap="wrap" gap={1}>
                                {columns.length > 0 ? (
                                    columns.map((col, i) => (
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
                                            variant="outlined"
                                            sx={{
                                                cursor: 'pointer',
                                                '&:hover': {
                                                    backgroundColor: 'action.hover'
                                                }
                                            }}
                                        />
                                    ))
                                ) : (
                                    <Typography variant="body2" color="text.secondary">
                                        Columns not available
                                    </Typography>
                                )}
                            </Box>
                        </Grid>
                    </Grid>
                </Collapse>
            </Paper>

            {/* Anteprima grafica */}
            {generationResult && (
                <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                        Graph Preview
                    </Typography>
                    <Box
                        component="img"
                        src={generationResult}
                        alt="Generated chart preview"
                        sx={{
                            width: '100%',
                            height: 'auto',
                            maxWidth: '600px',
                            border: '1px solid #ddd',
                            borderRadius: 1,
                            display: 'block',
                            mx: 'auto'
                        }}
                    />
                </Paper>
            )}
        </Box>
    );
};

export default PlotConfiguration;
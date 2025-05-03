import React, { useEffect, useState } from "react";
import axios from "axios";
import {
    Box, Button, TextField, Typography, Select, MenuItem,
    InputLabel, FormControl, Chip, Autocomplete, Grid,
    Tabs, Tab, Divider, Slider, InputAdornment
} from "@mui/material";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    Legend, ReferenceLine, ResponsiveContainer
} from "recharts";
import { TabContext, TabPanel } from '@mui/lab';

interface DatasetRequest {
    fileId: number;
    columns: string[];
}

interface CsvFile {
    id: number;
    name: string;
    path: string;
    createdAt: string;
    columns: string[];
}

interface ChartPoint {
    [key: string]: any;
}

interface AxisConfig {
    scale: 'linear' | 'log';
    min?: number;
    max?: number;
}

const DynamicChartConfigurator: React.FC = () => {
    // State for files and selection
    const [files, setFiles] = useState<CsvFile[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<number[]>([]);
    const [allColumns, setAllColumns] = useState<string[]>([]);

    // Chart configuration
    const [xAxis, setXAxis] = useState<string>('');
    const [yAxes, setYAxes] = useState<string[]>([]);
    const [chartData, setChartData] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Axis configuration
    const [xAxisConfig, setXAxisConfig] = useState<AxisConfig>({ scale: 'linear' });
    const [yAxisConfig, setYAxisConfig] = useState<AxisConfig>({ scale: 'linear' });

    // Reference lines
    const [referenceLines, setReferenceLines] = useState<{value: number, color: string, axis: 'x' | 'y'}[]>([]);
    const [newRefLine, setNewRefLine] = useState('');
    const [newRefColor, setNewRefColor] = useState('#ff0000');
    const [newRefAxis, setNewRefAxis] = useState<'x' | 'y'>('y');

    // UI state
    const [activeTab, setActiveTab] = useState('1');

    // Mock datasets configuration
    const [datasets, setDatasets] = useState<DatasetRequest[]>([
        { fileId: 1, columns: ["time", "gasTotalMean(16)"] },
        { fileId: 2, columns: ["time", "gasTotalMean(16)"] },
    ]);

    // Load files on mount
    useEffect(() => {
        axios.get("http://localhost:8099/results/csv/files")
            .then(res => setFiles(res.data as CsvFile[]))
            .catch(err => console.error("Error loading files:", err));
    }, []);

    useEffect(() => {
        console.log("Nuovo chartData:", chartData);
    }, [chartData]);

    // Update available columns when selected files change
    useEffect(() => {
        if (selectedFiles.length > 0) {
            const columns = new Set<string>();
            selectedFiles.forEach(fileId => {
                const file = files.find(f => f.id === fileId);
                file?.columns.forEach(col => columns.add(col));
            });
            setAllColumns(Array.from(columns));

            // Reset selections if columns are no longer available
            if (xAxis && !columns.has(xAxis)) setXAxis('');
            setYAxes(prev => prev.filter(col => columns.has(col)));
        } else {
            setAllColumns([]);
            setXAxis('');
            setYAxes([]);
        }
    }, [selectedFiles, files, xAxis]);

    // Generate chart data from API
    const generateChartData = async () => {
        if (!xAxis || yAxes.length === 0) return;

        try {
            // Prepare datasets based on current selections
            const requestDatasets = selectedFiles.map(fileId => ({
                fileId,
                columns: [xAxis, ...yAxes]
            }));

            const response = await axios.post(
                "http://localhost:8099/results/charts/preview",
                { datasets: requestDatasets },
                { headers: { "Content-Type": "application/json" } }
            );

            // Fallback to mock data if API fails
            if (!response.data || response.data.length === 0) {
                throw new Error("Empty response from server");
            }

            setChartData(response.data);

            setError(null);
            setActiveTab('2');
        } catch (err) {
            console.error("API error, using mock data:", err);
            setError("Errore nel recupero dati. Usando dati mock.");
        }
    };

    // Add reference line
    const addReferenceLine = () => {
        const value = parseFloat(newRefLine);
        if (!isNaN(value)) {
            setReferenceLines(prev => [
                ...prev,
                { value, color: newRefColor, axis: newRefAxis }
            ]);
            setNewRefLine('');
        }
    };

    // Remove reference line
    const removeReferenceLine = (index: number) => {
        setReferenceLines(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>Advanced Chart Configurator</Typography>

            {error && (
                <Typography color="error" sx={{ mb: 2 }}>
                    {error}
                </Typography>
            )}

            <TabContext value={activeTab}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
                        <Tab label="Data Selection" value="1" />
                        <Tab label="Chart Configuration" value="2" disabled={!xAxis || yAxes.length === 0} />
                    </Tabs>
                </Box>

                {/* Data Selection Tab */}
                <TabPanel value="1">
                    <Grid container spacing={3}>
                        {/* File Selection */}
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom>Select Files</Typography>
                            <Autocomplete
                                multiple
                                options={files}
                                getOptionLabel={(option) => option.name}
                                value={files.filter(f => selectedFiles.includes(f.id))}
                                onChange={(_, newValue) => {
                                    setSelectedFiles(newValue.map(f => f.id));
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Select CSV files"
                                        placeholder="Search files..."
                                    />
                                )}
                                renderTags={(value, getTagProps) =>
                                    value.map((option, index) => (
                                        <Chip
                                            label={option.name}
                                            {...getTagProps({ index })}
                                            key={option.id}
                                        />
                                    ))
                                }
                            />
                        </Grid>

                        {/* Column Selection */}
                        {allColumns.length > 0 && (
                            <>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="h6" gutterBottom>X-Axis Column</Typography>
                                    <Autocomplete
                                        options={allColumns}
                                        value={xAxis}
                                        onChange={(_, newValue) => setXAxis(newValue || '')}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="Select X-axis column"
                                                required
                                            />
                                        )}
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <Typography variant="h6" gutterBottom>Y-Axis Columns</Typography>
                                    <Autocomplete
                                        multiple
                                        options={allColumns.filter(col => col !== xAxis)}
                                        value={yAxes}
                                        onChange={(_, newValue) => setYAxes(newValue)}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="Select Y-axis columns"
                                                placeholder="Add columns..."
                                            />
                                        )}
                                    />
                                </Grid>
                            </>
                        )}
                    </Grid>

                    <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="contained"
                            onClick={generateChartData}
                            disabled={!xAxis || yAxes.length === 0}
                            size="large"
                        >
                            Configure Chart
                        </Button>
                    </Box>
                </TabPanel>

                {/* Chart Configuration Tab */}
                <TabPanel value="2">
                    <Grid container spacing={3}>
                        {/* Chart Display */}
                        <Grid item xs={12} md={8}>
                            <Box sx={{ height: '500px' }}>
                                {chartData !== null  ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis
                                                dataKey={xAxis}
                                                scale={xAxisConfig.scale}
                                                domain={[xAxisConfig.min || 'auto', xAxisConfig.max || 'auto']}
                                            />
                                            <YAxis
                                                scale={yAxisConfig.scale}
                                                domain={[yAxisConfig.min || 'auto', yAxisConfig.max || 'auto']}
                                            />
                                            <Tooltip />
                                            <Legend />
                                            {yAxes.map((col, idx) => (
                                                <Line
                                                    key={col}
                                                    type="monotone"
                                                    dataKey={col}
                                                    stroke={`hsl(${(idx * 360) / yAxes.length}, 70%, 50%)`}
                                                    activeDot={{ r: 8 }}
                                                />
                                            ))}
                                            {referenceLines.map((line, idx) => (
                                                <ReferenceLine
                                                    key={`ref-${idx}`}
                                                    x={line.axis === 'x' ? line.value : undefined}
                                                    y={line.axis === 'y' ? line.value : undefined}
                                                    stroke={line.color}
                                                    label={{
                                                        value: line.value.toString(),
                                                        position: line.axis === 'x' ? 'top' : 'right'
                                                    }}
                                                />
                                            ))}
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <Typography>No chart data available</Typography>
                                )}
                            </Box>
                        </Grid>

                        {/* Configuration Options */}
                        <Grid item xs={12} md={4}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                {/* X-Axis Configuration */}
                                <Box>
                                    <Typography variant="h6" gutterBottom>X-Axis Settings</Typography>
                                    <FormControl fullWidth sx={{ mb: 2 }}>
                                        <InputLabel>Scale Type</InputLabel>
                                        <Select
                                            value={xAxisConfig.scale}
                                            onChange={(e) => setXAxisConfig({
                                                ...xAxisConfig,
                                                scale: e.target.value as 'linear' | 'log'
                                            })}
                                        >
                                            <MenuItem value="linear">Linear</MenuItem>
                                            <MenuItem value="log">Logarithmic</MenuItem>
                                        </Select>
                                    </FormControl>
                                    <Grid container spacing={2}>
                                        <Grid item xs={6}>
                                            <TextField
                                                label="Min Value"
                                                type="number"
                                                value={xAxisConfig.min || ''}
                                                onChange={(e) => setXAxisConfig({
                                                    ...xAxisConfig,
                                                    min: e.target.value ? Number(e.target.value) : undefined
                                                })}
                                                fullWidth
                                            />
                                        </Grid>
                                        <Grid item xs={6}>
                                            <TextField
                                                label="Max Value"
                                                type="number"
                                                value={xAxisConfig.max || ''}
                                                onChange={(e) => setXAxisConfig({
                                                    ...xAxisConfig,
                                                    max: e.target.value ? Number(e.target.value) : undefined
                                                })}
                                                fullWidth
                                            />
                                        </Grid>
                                    </Grid>
                                </Box>

                                {/* Y-Axis Configuration */}
                                <Box>
                                    <Typography variant="h6" gutterBottom>Y-Axis Settings</Typography>
                                    <FormControl fullWidth sx={{ mb: 2 }}>
                                        <InputLabel>Scale Type</InputLabel>
                                        <Select
                                            value={yAxisConfig.scale}
                                            onChange={(e) => setYAxisConfig({
                                                ...yAxisConfig,
                                                scale: e.target.value as 'linear' | 'log'
                                            })}
                                        >
                                            <MenuItem value="linear">Linear</MenuItem>
                                            <MenuItem value="log">Logarithmic</MenuItem>
                                        </Select>
                                    </FormControl>
                                    <Grid container spacing={2}>
                                        <Grid item xs={6}>
                                            <TextField
                                                label="Min Value"
                                                type="number"
                                                value={yAxisConfig.min || ''}
                                                onChange={(e) => setYAxisConfig({
                                                    ...yAxisConfig,
                                                    min: e.target.value ? Number(e.target.value) : undefined
                                                })}
                                                fullWidth
                                            />
                                        </Grid>
                                        <Grid item xs={6}>
                                            <TextField
                                                label="Max Value"
                                                type="number"
                                                value={yAxisConfig.max || ''}
                                                onChange={(e) => setYAxisConfig({
                                                    ...yAxisConfig,
                                                    max: e.target.value ? Number(e.target.value) : undefined
                                                })}
                                                fullWidth
                                            />
                                        </Grid>
                                    </Grid>
                                </Box>

                                {/* Reference Lines */}
                                <Box>
                                    <Typography variant="h6" gutterBottom>Reference Lines</Typography>
                                    <Grid container spacing={2} alignItems="center">
                                        <Grid item xs={4}>
                                            <TextField
                                                label="Value"
                                                value={newRefLine}
                                                onChange={(e) => setNewRefLine(e.target.value)}
                                                type="number"
                                                fullWidth
                                            />
                                        </Grid>
                                        <Grid item xs={3}>
                                            <TextField
                                                label="Color"
                                                type="color"
                                                value={newRefColor}
                                                onChange={(e) => setNewRefColor(e.target.value)}
                                                fullWidth
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <Box
                                                                sx={{
                                                                    width: 20,
                                                                    height: 20,
                                                                    backgroundColor: newRefColor,
                                                                    border: '1px solid #ccc'
                                                                }}
                                                            />
                                                        </InputAdornment>
                                                    )
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={3}>
                                            <FormControl fullWidth>
                                                <InputLabel>Axis</InputLabel>
                                                <Select
                                                    value={newRefAxis}
                                                    onChange={(e) => setNewRefAxis(e.target.value as 'x' | 'y')}
                                                    label="Axis"
                                                >
                                                    <MenuItem value="x">X-Axis</MenuItem>
                                                    <MenuItem value="y">Y-Axis</MenuItem>
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        <Grid item xs={2}>
                                            <Button
                                                variant="contained"
                                                onClick={addReferenceLine}
                                                disabled={!newRefLine}
                                                fullWidth
                                            >
                                                Add
                                            </Button>
                                        </Grid>
                                    </Grid>

                                    {referenceLines.length > 0 && (
                                        <Box sx={{ mt: 2 }}>
                                            {referenceLines.map((line, idx) => (
                                                <Box
                                                    key={idx}
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        mb: 1,
                                                        p: 1,
                                                        backgroundColor: '#f5f5f5',
                                                        borderRadius: 1
                                                    }}
                                                >
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        <Box
                                                            sx={{
                                                                width: 16,
                                                                height: 16,
                                                                backgroundColor: line.color,
                                                                mr: 1,
                                                                border: '1px solid #ccc'
                                                            }}
                                                        />
                                                        <Typography>
                                                            {line.axis.toUpperCase()}-Axis: {line.value}
                                                        </Typography>
                                                    </Box>
                                                    <Button
                                                        size="small"
                                                        color="error"
                                                        onClick={() => removeReferenceLine(idx)}
                                                    >
                                                        Remove
                                                    </Button>
                                                </Box>
                                            ))}
                                        </Box>
                                    )}
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>
                </TabPanel>
            </TabContext>
        </Box>
    );
};

export default DynamicChartConfigurator;
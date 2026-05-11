import React, {useState} from "react";
import {
    Box,
    Button,
    Chip,
    Collapse,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    InputAdornment,
    MenuItem,
    Paper,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import {Add, Close, ContentCopy, Delete, Edit, Refresh, Save, Send, Upload, Visibility, Settings, Group, EventNote, Preview} from "@mui/icons-material";
import axios from "axios";
import DistributionModal from "./DistributionModal.tsx";
import {distributionTypes, Event, EventDependency, ProbabilityDistribution, SimulationConfig} from "../types.ts";
import {defaultParamsByDistribution} from "./distributionConfigs.ts";
import {getProbFromParams,} from "./distributionFormulas.ts";
import {Line} from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip as ChartTooltip,
    Legend
} from 'chart.js';
import DistributionPreviewModal from "./DistributionPreviewModal";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    ChartTooltip,
    Legend
);

const durationOptions = [
    {value: 86400, label: "1 Day"},
    {value: 604800, label: "7 Days"},
    {value: 864000, label: "10 Days"},
    {value: 1209600, label: "14 Days"},
    {value: 2592000, label: "30 Days"},
];

const aggregationOptions = [
    {value: 1, label: "Seconds"},
    {value: 60, label: "Minutes"},
    {value: 3600, label: "Hours"},
];


const downloadConfig = (config: SimulationConfig) => {
    const element = document.createElement("a");
    const file = new Blob([JSON.stringify(config, null, 2)], {type: "application/json"});
    element.href = URL.createObjectURL(file);
    element.download = `${config.name}_simulation_config.json`;
    document.body.appendChild(element);
    element.click();
};

const getProbabilityDistribution = (event: Event) => {
    if (!event.dependencies || event.dependencies.length === 0) {
        return [];
    }

    return event.dependencies.map(dep => {
        const type = dep.probabilityDistribution.type;
        const dist = dep.probabilityDistribution;

    switch (type) {
        case "FIXED":
            return {
                type,
                fixedTime: dist.fixedTime,
            };
        case "UNIFORM":
            return {
                type,
                value: dist.value,
            };
        case "NORMAL_SCALED":
        case "LOGNORMAL_SCALED":
            return {
                type,
                mean: dist.mean,
                std: dist.std,
                scalingFactorX: dist.scalingFactorX,
                scalingFactorY: dist.scalingFactorY,
            };
        case "NORMAL":
        case "LOGNORMAL":
            return {
                type,
                mean: dist.mean,
                std: dist.std,
                scalingFactor: dist.scalingFactor,
            };
        case "EXPONENTIAL_SCALED":
            return {
                type,
                rate: dist.rate,
                scalingFactorX: dist.scalingFactorX,
                scalingFactorY: dist.scalingFactorY,
            };
        case "EXPONENTIAL":
            return {
                type,
                rate: dist.rate,
                scalingFactor: dist.scalingFactor,
            };
        case "BASS":
        case "BASS_CUMULATIVE":
            return {
                type,
                p: dist.p,
                q: dist.q,
                scalingFactor: dist.scalingFactor,
            };
        case "GARTNER_SASAKI":
            return {
                type,
                A: dist.A,
                B: dist.B,
                C: dist.C,
                D: dist.D,
                E: dist.E,
                F: dist.F,
                G: dist.G,
                H: dist.H,
                I: dist.I,
                scalingFactor: dist.scalingFactor,
            };
        default:
            return {};
    }
    });
};

const SimulationConfiguratorModalForm: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [events, setEvents] = useState<Event[]>([]);
    const [openDistributions, setOpenDistributions] = useState<(boolean | boolean[])[]>([]);
    const [name, setName] = useState("Simulation");
    const [description, setDescription] = useState("");
    const [duration, setDuration] = useState<number>(604800);
    const [aggregation, setAggregation] = useState<number>(60);
    const [entityInput, setEntityInput] = useState("");
    const [entities, setEntities] = useState<string[]>([]);
    const [configPreview, setConfigPreview] = useState<SimulationConfig | null>(null);
    const [numRuns, setNumRuns] = useState<number | string>("5");
    const [expandedEvent, setExpandedEvent] = useState<number | null>(null);
    const [previewModalOpen, setPreviewModalOpen] = useState(false);

    // Palette di colori predefinita per i grafici
    const chartColors = [
        '#2196F3', // Blue
        '#F44336', // Red
        '#4CAF50', // Green
        '#FF9800', // Orange
        '#9C27B0', // Purple
        '#00BCD4', // Cyan
        '#FFC107', // Amber
        '#795548', // Brown
        '#607D8B', // Blue Grey
        '#E91E63', // Pink
        '#673AB7', // Deep Purple
        '#3F51B5', // Indigo
        '#009688', // Teal
        '#FF5722', // Deep Orange
        '#8BC34A'  // Light Green
    ];

    // Funzione per ottenere un colore dalla palette
    const getChartColor = (index: number) => {
        return chartColors[index % chartColors.length];
    };

    const handleReset = () => {
        if (window.confirm("Are you sure you want to reset all fields?")) {
            setName("");
            setDescription("");
            setDuration(604800);
            setAggregation(60);
            setEntityInput("");
            setEntities([]);
            setEvents([]);
            setNumRuns("5");
            setConfigPreview(null);
        }
    };

    const handleAddEvent = () => {
        const newEvent: Event = {
            eventName: "",
            description: "",
            instanceOf: null,
            dependencies: [],
            gasCost: 0,
            relatedEvents: null
        };
        setEvents([...events, newEvent]);
        setOpenDistributions([...openDistributions, false]);
        setExpandedEvent(events.length);
    };
    const [showAllDistributions, setShowAllDistributions] = useState<boolean>(false);

    const handleImportConfig = (config: SimulationConfig) => {
        setName(config.name);
        setDescription(config.description || "");
        setDuration(config.maxTime);
        setAggregation(config.numAggr);
        setNumRuns(config.numRuns);
        setEntities(config.entities);
        setEvents(config.events);
    };

    const handleRemoveEvent = (index: number) => {
        const updated = events.filter((_, i) => i !== index);
        const modals = openDistributions.filter((_, i) => i !== index);
        setEvents(updated);
        setOpenDistributions(modals);
        if (expandedEvent === index) setExpandedEvent(null);
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const jsonConfig = JSON.parse(e.target?.result as string) as SimulationConfig;
                    handleImportConfig(jsonConfig);
                } catch (error) {
                    alert("Invalid JSON file");
                }
            };
            reader.readAsText(file);
        }
    };

    const handleEventChange = (index: number, field: string, value: any) => {
        const updated = [...events];
        const updatedEvent = updated[index];

        if (field.startsWith("dependencies[")) {
            const matches = field.match(/dependencies\[(\d+)\]\.(.+)/);
            if (matches) {
                const [_, depIndex, depField] = matches;
                if (!updatedEvent.dependencies) {
                    updatedEvent.dependencies = [];
                }
                while (updatedEvent.dependencies.length <= parseInt(depIndex)) {
                    updatedEvent.dependencies.push({
                        dependOn: null,
                        maxProbabilityMatches: null,
                        probabilityDistribution: { type: "" as const }
                    });
                }
                if (depField.startsWith("probabilityDistribution.")) {
                    const paramName = depField.split(".")[1];
                    (updatedEvent.dependencies[parseInt(depIndex)].probabilityDistribution as any)[paramName] = value;
        } else {
                    (updatedEvent.dependencies[parseInt(depIndex)] as any)[depField] = value;
                }
            }
        } else {
            (updatedEvent as any)[field] = value;
        }

        setEvents(updated);
    };

    const handleAddEntity = () => {
        const trimmed = entityInput.trim();
        if (trimmed && !entities.includes(trimmed)) {
            setEntities([...entities, trimmed]);
            setEntityInput("");
        }
    };

    const handleRemoveEntity = (index: number) => {
        setEntities(prev => prev.filter((_, i) => i !== index));
    };

    const handleOpenModalDistribution = (index: number) => {
        const updated = [...openDistributions];
        updated[index] = true;
        setOpenDistributions(updated);
    };

    const handleCloseModalDistribution = (index: number) => {
        const updated = [...openDistributions];
        updated[index] = false;
        setOpenDistributions(updated);
    };

    const handleAddDependency = (eventIndex: number) => {
        const updated = [...events];
        const event = updated[eventIndex];
        if (!event.dependencies) {
            event.dependencies = [];
        }
        event.dependencies.push({
            dependOn: null,
            maxProbabilityMatches: null,
            probabilityDistribution: { type: "" as const }
        });
        setEvents(updated);
        // Add a new distribution modal state
        const updatedModals = [...openDistributions];
        updatedModals[eventIndex] = Array.isArray(updatedModals[eventIndex]) 
            ? [...updatedModals[eventIndex], false]
            : [false];
        setOpenDistributions(updatedModals);
    };

    const handleRemoveDependency = (eventIndex: number, depIndex: number) => {
        const updated = [...events];
        const event = updated[eventIndex];
        if (event.dependencies) {
            event.dependencies.splice(depIndex, 1);
            if (event.dependencies.length === 0) {
                event.dependencies = null;
            }
        }
        setEvents(updated);
        // Remove the corresponding distribution modal state
        const updatedModals = [...openDistributions];
        if (Array.isArray(updatedModals[eventIndex])) {
            updatedModals[eventIndex].splice(depIndex, 1);
        }
        setOpenDistributions(updatedModals);
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        const config = {
            maxTime: duration,
            numAggr: aggregation,
            numRuns: numRuns,
            name: name,
            description: description,
            entities: entities,
            events: events.map(event => ({
                ...event,
                dependencies: event.dependencies?.map(dep => ({
                    ...dep,
                    probabilityDistribution: getProbabilityDistribution(event)[event.dependencies?.indexOf(dep) || 0]
                }))
            })),
        };

        try {
            const response = await axios.post('http://localhost:8099/newsimulation', config, {
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

    const handlePreview = () => {
        const config: SimulationConfig = {
            name,
            description,
            maxTime: duration,
            numAggr: aggregation,
            numRuns: Number(numRuns),
            entities,
            events
        };
        setConfigPreview(config);
    };

    const handleDurationChange = (value: string) => {
        const num = parseInt(value);
        if (!isNaN(num)) {
            setDuration(num);
        }
    };

    const handleAggregationChange = (value: string) => {
        const num = parseInt(value);
        if (!isNaN(num)) {
            setAggregation(num);
        }
    };

    const renderDistributionFields = (event: Event, index: number) => {
        // This function is no longer needed as we're handling distributions in dependencies
        return null;
    };

    const generateMultiDistributionData = () => {
        const PREVIEW_POINTS = 100;
        const totalDuration = duration || 604800;

        return events
            .filter(e => e.dependencies?.some(d => d.probabilityDistribution?.type))
            .map((event, idx) => {
                // For each event, create a line for each dependency's distribution
                return event.dependencies?.map((dep, depIdx) => {
                    const {type} = dep.probabilityDistribution;
                    const params = dep.probabilityDistribution;

                const getProb = (t: number): number =>
                    getProbFromParams(type, t, params);

                const step = totalDuration / PREVIEW_POINTS;
                const data = Array.from({length: PREVIEW_POINTS + 1}, (_, i) => {
                    const t = i * step;
                    return {x: t, y: Math.max(getProb(t), 1e-6)};
                });

                return {
                        label: `${event.eventName || "Event " + (idx + 1)} - Dep ${depIdx + 1}`,
                    data,
                    borderWidth: 1,
                    pointRadius: 0,
                    fill: false,
                };
                }) || [];
            })
            .flat();
    };

    // Funzione per raccogliere tutti i dati delle distribuzioni
    const getAllDistributions = () => {
        const distributions: { label: string; data: { x: number; y: number; }[]; borderColor: string; }[] = [];
        
        events.forEach((event, eventIndex) => {
            event.dependencies?.forEach((dep, depIndex) => {
                const data = Array.from({ length: 100 }, (_, i) => {
                    const t = i * (duration / 100);
                    const prob = Math.max(0, getProbFromParams(dep.probabilityDistribution.type, t, dep.probabilityDistribution));
                    return { x: t, y: prob };
                });

                distributions.push({
                    label: `${event.eventName} - Dependency ${depIndex + 1}`,
                    data,
                    borderColor: getChartColor(eventIndex * 10 + depIndex)
                });
            });
        });

        return distributions;
    };

    return (
        <>
            <Button variant="contained" onClick={() => setOpen(true)}>
                Simulation
            </Button>

            <Dialog
                open={open}
                onClose={() => setOpen(false)}
                maxWidth="lg"
                fullWidth
                PaperProps={{
                    sx: { 
                        minHeight: '80vh',
                        maxHeight: '90vh',
                        width: '90%'
                    }
                }}
            >
                <DialogTitle>Configure Simulation</DialogTitle>
                <DialogContent>
                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                        {configPreview ? (
                            <Box>
                                <Typography variant="subtitle1" gutterBottom>
                                    Configuration Preview
                                </Typography>
                                <pre style={{whiteSpace: 'pre-wrap'}}>
                                    {JSON.stringify(configPreview, null, 2)}
                                </pre>
                                        <Button
                                    onClick={() => setConfigPreview(null)}
                                    color="primary"
                                    variant="outlined"
                                    sx={{mt: 2}}
                                        >
                                    Edit
                                        </Button>
                                        <Button
                                    onClick={() => downloadConfig(configPreview)}
                                    color="primary"
                                    variant="outlined"
                                    sx={{mt: 2, ml: 2}}
                                    startIcon={<ContentCopy/>}
                                        >
                                    Download
                                        </Button>
                            </Box>
                        ) : (
                            <Stack spacing={0.5}>
                                <Paper elevation={0} sx={{p: 1.5}}>
                                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                                        <Settings fontSize="small" color="action" />
                                        <Typography variant="subtitle1">
                                    Basic Configuration
                                </Typography>
                                    </Stack>
                                    <Stack spacing={1.5}>
                                        <TextField
                                            label="Simulation Name"
                                            required
                                            error={!name}
                                            helperText={!name ? "Name is required" : " "}
                                            size="small"
                                            fullWidth
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                        />
                                        <TextField
                                            label="Description"
                                            size="small"
                                            fullWidth
                                            multiline
                                            rows={2}
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            helperText="Optional: Add a description for this simulation"
                                        />
                                        <Box sx={{ display: 'flex', gap: 2 }}>
                                        <TextField
                                            label="Duration"
                                            select
                                            required
                                                error={!duration}
                                                helperText={!duration ? "Duration is required" : " "}
                                            size="small"
                                                fullWidth
                                                value={duration.toString()}
                                                onChange={(e) => handleDurationChange(e.target.value)}
                                        >
                                            {durationOptions.map((opt) => (
                                                    <MenuItem key={opt.value} value={opt.value.toString()}>
                                                    {opt.label}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                        <TextField
                                            label="Aggregation"
                                            select
                                                required
                                                error={!aggregation}
                                                helperText={!aggregation ? "Aggregation is required" : " "}
                                            fullWidth
                                            size="small"
                                                value={aggregation.toString()}
                                                onChange={(e) => handleAggregationChange(e.target.value)}
                                        >
                                            {aggregationOptions.map((opt) => (
                                                    <MenuItem key={opt.value} value={opt.value.toString()}>
                                                    {opt.label}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                        <TextField
                                            label="Number of Runs"
                                            required
                                                error={!numRuns}
                                                helperText={!numRuns ? "Number of runs is required" : " "}
                                                type="number"
                                            size="small"
                                                fullWidth
                                            value={numRuns}
                                                onChange={(e) => setNumRuns(e.target.value)}
                                        />
                                        </Box>
                                    </Stack>
                            </Paper>

                                <Paper elevation={0} sx={{p: 1.5}}>
                                    <Stack direction="row" spacing={2} alignItems="center">
                                        <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 'fit-content' }}>
                                            <Group fontSize="small" color="action" />
                                            <Typography variant="subtitle1">
                                    Entities
                                </Typography>
                                        </Stack>
                                        <TextField
                                            label="Entity Name"
                                            size="small"
                                            value={entityInput}
                                            sx={{ width: 200 }}
                                            onChange={(e) => setEntityInput(e.target.value)}
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleAddEntity();
                                                }
                                            }}
                                            InputProps={{
                                                endAdornment: (
                                                    <InputAdornment position="end">
                                                        <IconButton
                                                            onClick={handleAddEntity}
                                                            edge="end"
                                                            size="small"
                                                        >
                                                            <Add/>
                                                        </IconButton>
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                        <Box sx={{display: "flex", flexWrap: "wrap", gap: 0.5, flex: 1}}>
                                        {entities.map((entity, index) => (
                                            <Chip
                                                key={index}
                                                label={entity}
                                                onDelete={() => handleRemoveEntity(index)}
                                                size="small"
                                            />
                                        ))}
                                    </Box>
                                </Stack>
                            </Paper>

                                <Paper elevation={0} sx={{p: 1.5, mt: 1}}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <EventNote fontSize="small" color="action" />
                                            <Typography variant="subtitle1">
                                                Events
                                            </Typography>
                                        </Stack>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        startIcon={<Add/>}
                                        onClick={handleAddEvent}
                                    >
                                        Add Event
                                    </Button>
                                </Stack>
                                <Divider sx={{my: 2}}/>
                                <Stack spacing={2}>
                                    {events.map((event, index) => (
                                            <Paper key={index} variant="outlined" sx={{p: 2}}>
                                                <Stack spacing={2}>
                                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                    <Typography variant="subtitle2">
                                                        Event {index + 1}{event.eventName && `: ${event.eventName}`}
                                                    </Typography>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleRemoveEvent(index)}
                                                        color="error"
                                                    >
                                                        <Delete fontSize="small"/>
                                                    </IconButton>
                                                </Stack>

                                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                                            <Box sx={{ width: 'calc(33.33% - 16px)' }}>
                                                <TextField
                                                    label="Event Name"
                                                    required
                                                    error={!event.eventName}
                                                    helperText={!event.eventName ? "Event name is required" : " "}
                                                    size="small"
                                                    fullWidth
                                                    value={event.eventName}
                                                    onChange={(e) => handleEventChange(index, "eventName", e.target.value)}
                                                                    sx={{ minWidth: '200px' }}
                                                                />
                                                            </Box>
                                                            <Box sx={{ width: 'calc(33.33% - 16px)' }}>
                                                <TextField
                                                    label="Gas Cost"
                                                    required
                                                    error={!event.gasCost || event.gasCost <= 0}
                                                    helperText={(!event.gasCost || event.gasCost <= 0) ? "Gas Cost is required" : " "}
                                                    type="number"
                                                    size="small"
                                                    fullWidth
                                                    value={event.gasCost}
                                                    onChange={(e) => handleEventChange(index, "gasCost", Number(e.target.value))}
                                                                    sx={{ minWidth: '200px' }}
                                                />
                                                            </Box>
                                                            <Box sx={{ width: 'calc(33.33% - 16px)' }}>
                                                    <TextField
                                                        label="Instance Of"
                                                        select
                                                        size="small"
                                                        fullWidth
                                                        value={event.instanceOf || ""}
                                                        onChange={(e) => handleEventChange(index, "instanceOf", e.target.value || null)}
                                                                    sx={{ minWidth: '200px' }}
                                                    >
                                                        <MenuItem value="">None</MenuItem>
                                                        {entities.map((entity, idx) => (
                                                            <MenuItem key={idx} value={entity}>
                                                                {entity}
                                                            </MenuItem>
                                                        ))}
                                                    </TextField>
                                                            </Box>
                                                        </Box>

                                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                                            <Box sx={{ width: 'calc(33.33% - 16px)' }}>
                                                                <TextField
                                                                    label="Description"
                                                                    size="small"
                                                                    fullWidth
                                                                    multiline
                                                                    rows={2}
                                                                    value={event.description}
                                                                    onChange={(e) => handleEventChange(index, "description", e.target.value)}
                                                                    sx={{ minWidth: '400px' }}
                                                                />
                                                            </Box>
                                                        </Box>

                                                        <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default' }}>
                                                            <Stack spacing={2}>
                                                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                                    <Typography variant="subtitle2">Dependencies</Typography>
                                                                    <Button
                                                                        variant="outlined"
                                                                        size="small"
                                                                        startIcon={<Add />}
                                                                        onClick={() => handleAddDependency(index)}
                                                                    >
                                                                        Add Dependency
                                                                    </Button>
                                                                </Stack>
                                                                
                                                                {event.dependencies?.map((dep, depIndex) => (
                                                                    <Paper key={depIndex} variant="outlined" sx={{ p: 2 }}>
                                                                        <Stack spacing={2}>
                                                                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                                                <Typography variant="subtitle2">
                                                                                    Dependency {depIndex + 1}
                                                                                </Typography>
                                                                                <IconButton
                                                                                    size="small"
                                                                                    onClick={() => handleRemoveDependency(index, depIndex)}
                                                                                    color="error"
                                                                                >
                                                                                    <Delete fontSize="small" />
                                                                                </IconButton>
                                                                            </Stack>

                                                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                                                                <Box sx={{ width: 'calc(33.33% - 16px)' }}>
                                                    <TextField
                                                        label="Depends On"
                                                        select
                                                        size="small"
                                                        fullWidth
                                                                                        value={dep.dependOn || ""}
                                                                                        onChange={(e) => handleEventChange(index, `dependencies[${depIndex}].dependOn`, e.target.value || null)}
                                                                                        sx={{ minWidth: '200px' }}
                                                    >
                                                        <MenuItem value="">None</MenuItem>
                                                        {entities.map((entity, idx) => (
                                                            <MenuItem key={idx} value={entity}>
                                                                {entity}
                                                            </MenuItem>
                                                        ))}
                                                    </TextField>
                                                                                </Box>
                                                                                <Box sx={{ width: 'calc(33.33% - 16px)' }}>
                                                                                    <TextField
                                                                                        label="Max Probability Matches"
                                                                                        size="small"
                                                                                        fullWidth
                                                                                        value={dep.maxProbabilityMatches || ""}
                                                                                        onChange={(e) => handleEventChange(index, `dependencies[${depIndex}].maxProbabilityMatches`, e.target.value)}
                                                                                        helperText="Use '#entityName' to reference an entity count"
                                                                                        sx={{ minWidth: '200px' }}
                                                                                    />
                                                                                </Box>
                                                                                <Box sx={{ width: 'calc(33.33% - 16px)' }}>
                                                <TextField
                                                    label="Distribution Type"
                                                    select
                                                    required
                                                                                        error={!dep.probabilityDistribution.type}
                                                                                        helperText={!dep.probabilityDistribution.type ? "Distribution Type is required" : " "}
                                                    size="small"
                                                    fullWidth
                                                                                        value={dep.probabilityDistribution.type}
                                                    onChange={(e) => {
                                                        const selectedType = e.target.value;
                                                                                            handleEventChange(index, `dependencies[${depIndex}].probabilityDistribution.type`, selectedType);
                                                                                            const updatedModals = [...openDistributions];
                                                                                            if (!Array.isArray(updatedModals[index])) {
                                                                                                updatedModals[index] = [];
                                                                                            }
                                                                                            updatedModals[index][depIndex] = true;
                                                                                            setOpenDistributions(updatedModals);
                                                    }}
                                                                                        sx={{ minWidth: '200px' }}
                                                >
                                                    {distributionTypes.map((opt) => (
                                                        <MenuItem key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </MenuItem>
                                                    ))}
                                                </TextField>
                                                                                </Box>
                                                                            </Box>

                                                                            {dep.probabilityDistribution.type && (
                                                                                <Box sx={{ mt: 1 }}>
                                                                                    <Typography variant="subtitle2" gutterBottom color="text.secondary">
                                                                                        Distribution Parameters
                                                                                    </Typography>
                                                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                                                                        {Object.entries(dep.probabilityDistribution)
                                                                                            .filter(([key]) => key !== 'type')
                                                                                            .map(([key, value]) => (
                                                                                                <Box sx={{ width: 'calc(33.33% - 16px)' }} key={key}>
                                                                                                    <TextField
                                                                                                        label={key}
                                                                                                        size="small"
                                                                                                        type="number"
                                                                                                        fullWidth
                                                                                                        value={value}
                                                                                                        onChange={(e) => {
                                                                                                            const newValue = e.target.value;
                                                                                                            const updatedDistribution = {
                                                                                                                ...dep.probabilityDistribution,
                                                                                                                [key]: Number(newValue)
                                                                                                            };
                                                                                                            handleEventChange(
                                                                                                                index,
                                                                                                                `dependencies[${depIndex}].probabilityDistribution`,
                                                                                                                updatedDistribution
                                                                                                            );
                                                                                                        }}
                                                                                                        InputProps={{
                                                                                                            inputProps: { 
                                                                                                                step: "0.01"
                                                                                                            }
                                                                                                        }}
                                                                                                        sx={{ minWidth: '200px' }}
                                                                                                    />
                                                                                                </Box>
                                                                                            ))}
                                                                                    </Box>

                                                                                    <Box sx={{ mt: 2, height: 200, bgcolor: 'background.paper', p: 2, borderRadius: 1 }}>
                                                                                        <Typography variant="subtitle2" gutterBottom>
                                                                                            Distribution Preview
                    </Typography>
                    <Line
                                                                                            data={{
                                                                                                datasets: [{
                                                                                                    label: `${event.eventName} - Dependency ${depIndex + 1}`,
                                                                                                    data: Array.from({ length: 100 }, (_, i) => {
                                                                                                        const t = i * (duration / 100);
                                                                                                        const prob = Math.max(0, getProbFromParams(dep.probabilityDistribution.type, t, dep.probabilityDistribution));
                                                                                                        return {
                                                                                                            x: t,
                                                                                                            y: prob
                                                                                                        };
                                                                                                    }),
                                                                                                    borderWidth: 3,
                                                                                                    pointRadius: 0,
                                                                                                    fill: false,
                                                                                                    borderColor: getChartColor(index * 10 + depIndex),
                                                                                                }]
                                                                                            }}
                        options={{
                            responsive: true,
                                                                                                maintainAspectRatio: false,
                            scales: {
                                x: {
                                                                                                        type: 'linear',
                                                                                                        title: {
                                                                                                            display: true,
                                                                                                            text: 'Time'
                                                                                                        },
                                                                                                        ticks: {
                                                                                                            callback: function(value) {
                                                                                                                const numValue = Number(value);
                                                                                                                if (numValue >= 3600) {
                                                                                                                    return Math.round(numValue / 3600) + 'h';
                                                                                                                }
                                                                                                                if (numValue >= 60) {
                                                                                                                    return Math.round(numValue / 60) + 'm';
                                                                                                                }
                                                                                                                return numValue + 's';
                                                                                                            }
                                                                                                        }
                                },
                                y: {
                                                                                                        type: 'linear',
                                                                                                        min: 0,
                                                                                                        title: {
                                                                                                            display: true,
                                                                                                            text: 'Probability'
                                                                                                        },
                                                                                                        ticks: {
                                                                                                            callback: function(value) {
                                                                                                                const numValue = Number(value);
                                                                                                                // Determina il numero di decimali necessari
                                                                                                                let decimals;
                                                                                                                if (numValue >= 0.01) {
                                                                                                                    decimals = 2;  // Per valori >= 0.01
                                                                                                                } else if (numValue >= 0.001) {
                                                                                                                    decimals = 3;  // Per valori >= 0.001
                                                                                                                } else if (numValue >= 0.0001) {
                                                                                                                    decimals = 4;  // Per valori >= 0.0001
                                                                                                                } else if (numValue >= 0.00001) {
                                                                                                                    decimals = 5;  // Per valori >= 0.00001
                                                                                                                } else if (numValue >= 0.000001) {
                                                                                                                    decimals = 6;  // Per valori >= 0.000001
                                                                                                                } else if (numValue >= 0.0000001) {
                                                                                                                    decimals = 7;  // Per valori >= 0.0000001
                                                                                                                } else if (numValue >= 0.00000001) {
                                                                                                                    decimals = 8;  // Per valori >= 0.00000001
                                                                                                                } else {
                                                                                                                    decimals = 9;  // Per valori più piccoli
                                                                                                                }
                                                                                                                return numValue.toFixed(decimals).replace('.', ',');
                                                                                                            },
                                                                                                            count: 6
                                                                                                        },
                                                                                                        grace: '5%'
                                                                                                    }
                                                                                                },
                                                                                                plugins: {
                                                                                                    legend: {
                                                                                                        display: true,
                                                                                                        position: 'top' as const,
                                                                                                    },
                                                                                                    tooltip: {
                                                                                                        callbacks: {
                                                                                                            label: function(context) {
                                                                                                                const value = Number(context.parsed.y);
                                                                                                                const time = Number(context.parsed.x);
                                                                                                                let timeStr;
                                                                                                                if (time >= 3600) {
                                                                                                                    timeStr = (time / 3600).toFixed(1) + ' hours';
                                                                                                                } else if (time >= 60) {
                                                                                                                    timeStr = (time / 60).toFixed(1) + ' minutes';
                                                                                                                } else {
                                                                                                                    timeStr = time.toFixed(1) + ' seconds';
                                                                                                                }
                                                                                                                // Usa la stessa logica per i decimali del valore
                                                                                                                let decimals;
                                                                                                                if (value >= 0.01) {
                                                                                                                    decimals = 2;
                                                                                                                } else if (value >= 0.001) {
                                                                                                                    decimals = 3;
                                                                                                                } else if (value >= 0.0001) {
                                                                                                                    decimals = 4;
                                                                                                                } else if (value >= 0.00001) {
                                                                                                                    decimals = 5;
                                                                                                                } else if (value >= 0.000001) {
                                                                                                                    decimals = 6;
                                                                                                                } else if (value >= 0.0000001) {
                                                                                                                    decimals = 7;
                                                                                                                } else if (value >= 0.00000001) {
                                                                                                                    decimals = 8;
                                                                                                                } else {
                                                                                                                    decimals = 9;
                                                                                                                }
                                                                                                                const probStr = value.toFixed(decimals).replace('.', ',');
                                                                                                                return `Time: ${timeStr}, Probability: ${probStr}`;
                                                                                                            }
                                                                                                        }
                                                                                                    }
                                                                                                }
                        }}
                    />
                                                                                    </Box>
                                                                                </Box>
                                                                            )}

                                                                            <DistributionModal
                                                                                open={Array.isArray(openDistributions[index]) && openDistributions[index][depIndex]}
                                                                                duration={duration}
                                                                                initialValue={defaultParamsByDistribution[dep.probabilityDistribution.type]}
                                                                                onClose={() => {
                                                                                    const updatedModals = [...openDistributions];
                                                                                    if (Array.isArray(updatedModals[index])) {
                                                                                        updatedModals[index][depIndex] = false;
                                                                                    }
                                                                                    setOpenDistributions(updatedModals);
                                                                                }}
                                                                                onConfirm={(res) => {
                                                                                    handleEventChange(index, `dependencies[${depIndex}].probabilityDistribution`, res);
                                                                                    const updatedModals = [...openDistributions];
                                                                                    if (Array.isArray(updatedModals[index])) {
                                                                                        updatedModals[index][depIndex] = false;
                                                                                    }
                                                                                    setOpenDistributions(updatedModals);
                                                                                }}
                                                                            />
                                                                        </Stack>
                                                                    </Paper>
                                                                ))}
                                                            </Stack>
                                                        </Paper>
                                                    </Box>
                                                </Stack>
                                            </Paper>
                                        ))}
                                    </Stack>
                                </Paper>
                            </Stack>
                        )}
                    </Box>
                </DialogContent>

                <DialogActions>
                    <Button
                        startIcon={<Upload/>}
                        component="label"
                        sx={{mr: "auto"}}
                    >
                        Import Config
                        <input type="file" hidden accept=".json" onChange={handleFileUpload}/>
                    </Button>
                    <Button
                        onClick={handleReset}
                        color="error"
                        startIcon={<Refresh/>}
                    >
                        Reset
                    </Button>
                    {!configPreview && (
                        <Button
                            onClick={handlePreview}
                            color="info"
                            startIcon={<Visibility/>}
                        >
                            Preview
                        </Button>
                    )}
                    <Button
                        onClick={() => setPreviewModalOpen(true)}
                        color="secondary"
                        startIcon={<Preview/>}
                        disabled={!events.some(e => e.dependencies && e.dependencies.length >= 1) || getAllDistributions().length < 2}
                        sx={{ mr: 1 }}
                    >
                        Compare Distributions
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        color="primary"
                        variant="contained"
                        startIcon={<Send/>}
                        disabled={!name || !duration || !aggregation || !numRuns}
                    >
                        Submit simulation
                    </Button>
                </DialogActions>
            </Dialog>

            <DistributionPreviewModal
                open={previewModalOpen}
                onClose={() => setPreviewModalOpen(false)}
                distributions={getAllDistributions()}
                duration={duration}
            />
        </>
    );
};

export default SimulationConfiguratorModalForm;



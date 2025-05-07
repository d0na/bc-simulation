import React, {useState} from "react";
import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Grid,
    IconButton,
    InputAdornment,
    MenuItem,
    Paper,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import {Add, Close, ContentCopy, Delete, Edit, Refresh, Save, Send, Upload, Visibility,} from "@mui/icons-material";
import axios from "axios";

type ProbabilityDistribution = {
    type: string;
    [key: string]: any;
};

type SimulationConfig = {
    entities: string[];
    events: Event[];
    name: string;
    numAggr: number;
    maxTime: number;
    numRuns: number;
};

type Event = {
    eventName: string;
    eventDescription: string;
    instanceOf: string | null;
    dependOn: string | null;
    probabilityDistribution: ProbabilityDistribution;
    gasCost: number;
    relatedEvents: string[] | null;
};

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

const distributionTypes = [
    {value: "UNIFORM", label: "Uniform"},
    {value: "NORMAL_SCALED", label: "Normal Scaled"},
    {value: "NORMAL", label: "Normal"},
    {value: "LOGNORMAL_SCALED", label: "LogNormal Scaled"},
    {value: "LOGNORMAL", label: "LogNormal"},
    {value: "EXPONENTIAL", label: "Exponential"},
    {value: "EXPONENTIAL_SCALED", label: "Exponential Scaled"},
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
    const type = event.probabilityDistribution.type;
    const dist = event.probabilityDistribution;

    switch (type) {
        case "FIXED":
            return {type, fixedTime: dist.fixedTime, tolerance: dist.tolerance};
        case "UNIFORM":
            return {type, value: dist.value};
        case "NORMAL_SCALED":
        case "LOGNORMAL_SCALED":
            return {
                type,
                mean: dist.mean,
                std: dist.std,
                scalingFactorX: dist.scalingFactorX,
                scalingFactorY: dist.scalingFactorY
            };
        case "NORMAL":
        case "LOGNORMAL":
            return {type, mean: dist.mean, std: dist.std, scalingFactor: dist.scalingFactor};
        case "EXPONENTIAL_SCALED":
            return {type, rate: dist.rate, scalingFactorX: dist.scalingFactorX, scalingFactorY: dist.scalingFactorY};
        case "EXPONENTIAL":
            return {type, rate: dist.rate, scalingFactor: dist.scalingFactor};
        default:
            return {};
    }
};

const SimulationConfiguratorModalForm: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [events, setEvents] = useState<Event[]>([]);
    const [name, setName] = useState("Simulation");
// Per cambiare la duration predefinita a 7 giorni (604800 secondi)
    const [duration, setDuration] = useState<number>(604800);

// Per cambiare l'aggregation predefinita a minuti (60 secondi)
    const [aggregation, setAggregation] = useState<number>(60);
    const [entityInput, setEntityInput] = useState("");
    const [entities, setEntities] = useState<string[]>([]);
    const [configPreview, setConfigPreview] = useState<SimulationConfig | null>(null);
    const [numRuns, setNumRuns] = useState<number | "">("5");
    const [expandedEvent, setExpandedEvent] = useState<number | null>(null);

    const handleReset = () => {
        if (window.confirm("Are you sure you want to reset all fields?")) {
            setName("");
            setDuration("");
            setAggregation("");
            setEntityInput("");
            setEntities([]);
            setEvents([]);
            setNumRuns("");
            setConfigPreview(null);
        }
    };

    const handleAddEvent = () => {
        const newEvent: Event = {
            eventName: "",
            eventDescription: "",
            instanceOf: null,
            dependOn: null,
            probabilityDistribution: {type: ""},
            gasCost: 0,
            relatedEvents: null
        };
        setEvents([...events, newEvent]);
        setExpandedEvent(events.length);
    };

    const handleImportConfig = (config: SimulationConfig) => {
        setName(config.name);
        setDuration(config.maxTime);
        setAggregation(config.numAggr);
        setNumRuns(config.numRuns);
        setEntities(config.entities);
        setEvents(config.events);
    };

    const handleRemoveEvent = (index: number) => {
        const updated = events.filter((_, i) => i !== index);
        setEvents(updated);
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

        if (field.startsWith("probabilityDistribution.")) {
            const paramName = field.split(".")[1];
            updatedEvent.probabilityDistribution[paramName] = value;
        } else {
            updatedEvent[field as keyof Event] = value;
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

    const handleSubmit = async (e?: React.FormEvent) => {
        const config = {
            maxTime: duration,
            numAggr: aggregation,
            numRuns: numRuns,
            name: name,
            entities: entities,
            events: events.map(event => ({
                ...event,
                probabilityDistribution: getProbabilityDistribution(event),
            })),
        };

        console.log("Configuration ready:", config);
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
            entities,
            events,
            name,
            numAggr: aggregation as number,
            maxTime: duration as number,
            numRuns: numRuns as number,
        };
        setConfigPreview(config);
    };

    const renderDistributionFields = (event: Event, index: number) => {
        const type = event.probabilityDistribution.type;
        const dist = event.probabilityDistribution;

        const fields = [];
        const commonProps = {
            size: "small" as const,
            fullWidth: true,
            sx: {mb: 1},
            type: "number",
        };

        switch (type) {
            case "FIXED":
                fields.push(
                    <TextField
                        {...commonProps}
                        key="fixedTime"
                        label="Fixed Time (s)"
                        value={dist.fixedTime || ""}
                        onChange={(e) => handleEventChange(index, "probabilityDistribution.fixedTime", parseFloat(e.target.value))}
                    />,
                    <TextField
                        {...commonProps}
                        key="tolerance"
                        label="Tolerance (s)"
                        value={dist.tolerance || ""}
                        onChange={(e) => handleEventChange(index, "probabilityDistribution.tolerance", parseFloat(e.target.value))}
                    />
                );
                break;
            case "UNIFORM":
                fields.push(
                    <TextField
                        {...commonProps}
                        key="value"
                        label="Value"
                        value={dist.value || ""}
                        onChange={(e) => handleEventChange(index, "probabilityDistribution.value", parseFloat(e.target.value))}
                    />
                );
                break;
            case "NORMAL":
            case "LOGNORMAL":
                fields.push(
                    <TextField
                        {...commonProps}
                        key="mean"
                        label="Mean"
                        value={dist.mean || ""}
                        onChange={(e) => handleEventChange(index, "probabilityDistribution.mean", parseFloat(e.target.value))}
                    />,
                    <TextField
                        {...commonProps}
                        key="std"
                        label="Standard Deviation"
                        value={dist.std || ""}
                        onChange={(e) => handleEventChange(index, "probabilityDistribution.std", parseFloat(e.target.value))}
                    />,
                    <TextField
                        {...commonProps}
                        key="scalingFactor"
                        label="Scaling Factor"
                        value={dist.scalingFactor || ""}
                        onChange={(e) => handleEventChange(index, "probabilityDistribution.scalingFactor", parseFloat(e.target.value))}
                    />
                );
                break;
            case "NORMAL_SCALED":
            case "LOGNORMAL_SCALED":
                fields.push(
                    <TextField
                        {...commonProps}
                        key="mean"
                        label="Mean"
                        value={dist.mean || ""}
                        onChange={(e) => handleEventChange(index, "probabilityDistribution.mean", parseFloat(e.target.value))}
                    />,
                    <TextField
                        {...commonProps}
                        key="std"
                        label="Standard Deviation"
                        value={dist.std || ""}
                        onChange={(e) => handleEventChange(index, "probabilityDistribution.std", parseFloat(e.target.value))}
                    />,
                    <TextField
                        {...commonProps}
                        key="scalingFactorX"
                        label="Scaling Factor X"
                        value={dist.scalingFactorX || ""}
                        onChange={(e) => handleEventChange(index, "probabilityDistribution.scalingFactorX", parseFloat(e.target.value))}
                    />,
                    <TextField
                        {...commonProps}
                        key="scalingFactorY"
                        label="Scaling Factor Y"
                        value={dist.scalingFactorY || ""}
                        onChange={(e) => handleEventChange(index, "probabilityDistribution.scalingFactorY", parseFloat(e.target.value))}
                    />
                );
                break;
            case "EXPONENTIAL":
                fields.push(
                    <TextField
                        {...commonProps}
                        key="rate"
                        label="Rate"
                        value={dist.rate || ""}
                        onChange={(e) => handleEventChange(index, "probabilityDistribution.rate", parseFloat(e.target.value))}
                    />,
                    <TextField
                        {...commonProps}
                        key="scalingFactor"
                        label="Scaling Factor"
                        value={dist.scalingFactor || ""}
                        onChange={(e) => handleEventChange(index, "probabilityDistribution.scalingFactor", parseFloat(e.target.value))}
                    />
                );
                break;
            case "EXPONENTIAL_SCALED":
                fields.push(
                    <TextField
                        {...commonProps}
                        key="rate"
                        label="Rate"
                        value={dist.rate || ""}
                        onChange={(e) => handleEventChange(index, "probabilityDistribution.rate", parseFloat(e.target.value))}
                    />,
                    <TextField
                        {...commonProps}
                        key="scalingFactorX"
                        label="Scaling Factor X"
                        value={dist.scalingFactorX || ""}
                        onChange={(e) => handleEventChange(index, "probabilityDistribution.scalingFactorX", parseFloat(e.target.value))}
                    />,
                    <TextField
                        {...commonProps}
                        key="scalingFactorY"
                        label="Scaling Factor Y"
                        value={dist.scalingFactorY || ""}
                        onChange={(e) => handleEventChange(index, "probabilityDistribution.scalingFactorY", parseFloat(e.target.value))}
                    />
                );
                break;
            default:
                return null;
        }

        return (
            <Grid container spacing={1}>
                {fields.map((field, i) => (
                    <Grid item xs={6} key={i}>
                        {field}
                    </Grid>
                ))}
            </Grid>
        );
    };

    return (
        <>
            <Button variant="contained" onClick={() => setOpen(true)}>
                Simulation
            </Button>

            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
                <DialogTitle>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6">Simulation Configurator</Typography>
                        <IconButton onClick={() => setOpen(false)}>
                            <Close/>
                        </IconButton>
                    </Stack>
                </DialogTitle>

                <DialogContent dividers>
                    {configPreview ? (
                        <Paper elevation={0} sx={{p: 2, position: "relative"}}>
                            <Stack spacing={2}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography variant="h6">Configuration Preview</Typography>
                                    <Stack direction="row" spacing={1}>
                                        <Tooltip title="Copy to clipboard">
                                            <IconButton
                                                onClick={() => navigator.clipboard.writeText(JSON.stringify(configPreview, null, 2))}
                                            >
                                                <ContentCopy fontSize="small"/>
                                            </IconButton>
                                        </Tooltip>
                                        <Button
                                            onClick={() => downloadConfig(configPreview)}
                                            size="small"
                                            startIcon={<Save/>}
                                        >
                                            Save
                                        </Button>
                                        <Button
                                            onClick={() => setConfigPreview(null)}
                                            size="small"
                                            startIcon={<Edit/>}
                                        >
                                            Edit
                                        </Button>
                                    </Stack>
                                </Stack>

                                <Paper variant="outlined" sx={{p: 2, maxHeight: 400, overflow: "auto"}}>
                                    <pre style={{margin: 0}}>
                                        {JSON.stringify(configPreview, null, 2)}
                                    </pre>
                                </Paper>
                            </Stack>
                        </Paper>
                    ) : (
                        <Stack spacing={3}>
                            <Paper elevation={0} sx={{p: 2}}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Basic Configuration
                                </Typography>
                                <Divider sx={{mb: 2}}/>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            label="Simulation Name"
                                            required
                                            error={!name }
                                            helperText={(!name ) ? "Name is required" : " "}
                                            fullWidth
                                            size="small"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}

                                        />
                                    </Grid>

                                    {/* Nuova riga per Duration */}
                                    <Grid item xs={12}>
                                        <TextField
                                            label="Duration"
                                            select
                                            required
                                            error={!duration || duration <= 0}
                                            helperText={(!duration || duration <= 0) ? "Duration is required" : " "}
                                            size="small"
                                            value={duration}
                                            onChange={(e) => setDuration(Number(e.target.value))}
                                        >
                                            {durationOptions.map((opt) => (
                                                <MenuItem key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>

                                    {/* Nuova riga per Aggregation */}
                                    <Grid item xs={12}>
                                        <TextField
                                            label="Aggregation"
                                            required
                                            error={!aggregation || aggregation <= 0}
                                            helperText={(!aggregation || aggregation <= 0) ? "Aggregation is required" : " "}
                                            select
                                            fullWidth
                                            size="small"
                                            value={aggregation}
                                            onChange={(e) => setAggregation(Number(e.target.value))}
                                        >
                                            {aggregationOptions.map((opt) => (
                                                <MenuItem key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>

                                    {/* Nuova riga per Number of Runs */}
                                    <Grid item xs={12}>
                                        <TextField
                                            label="Number of Runs"
                                            type="number"
                                            required
                                            error={!numRuns || numRuns <= 0}
                                            helperText={(!numRuns || numRuns <= 0) ? "Number of Runs is required" : " "}
                                            fullWidth
                                            size="small"
                                            value={numRuns}
                                            onChange={(e) => setNumRuns(Number(e.target.value))}
                                        />
                                    </Grid>
                                </Grid>
                            </Paper>

                            <Paper elevation={0} sx={{p: 2}}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Entities
                                </Typography>
                                <Divider sx={{mb: 2}}/>
                                <Stack spacing={2}>
                                    <Stack direction="row" spacing={1}>
                                        <TextField
                                            label="Add New Entity"
                                            fullWidth
                                            size="small"
                                            value={entityInput}
                                            onChange={(e) => setEntityInput(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && handleAddEntity()}
                                            InputProps={{
                                                endAdornment: (
                                                    <InputAdornment position="end">
                                                        <IconButton
                                                            edge="end"
                                                            onClick={handleAddEntity}
                                                            disabled={!entityInput.trim()}
                                                        >
                                                            <Add/>
                                                        </IconButton>
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    </Stack>
                                    <Box sx={{display: "flex", flexWrap: "wrap", gap: 1}}>
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

                            <Paper elevation={0} sx={{p: 2}}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography variant="subtitle1">Events</Typography>
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
                                        <Paper key={index} variant="outlined" sx={{p: 1}}>
                                            <Stack spacing={1}>
                                                <Stack direction="row" justifyContent="space-between"
                                                       alignItems="center">
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
                                                <TextField
                                                    label="Event Name"
                                                    required
                                                    error={!event.eventName}
                                                    helperText={!event.eventName ? "Event name is required" : " "}
                                                    size="small"
                                                    fullWidth
                                                    value={event.eventName}
                                                    onChange={(e) => handleEventChange(index, "eventName", e.target.value)}
                                                />
                                                <TextField
                                                    label="Description"
                                                    size="small"
                                                    fullWidth
                                                    multiline
                                                    rows={2}
                                                    value={event.eventDescription}
                                                    onChange={(e) => handleEventChange(index, "eventDescription", e.target.value)}
                                                />
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
                                                />
                                                {/* Nuova riga singola per Instance Of */}
                                                <Grid item xs={12}>
                                                    <TextField
                                                        label="Instance Of"
                                                        select
                                                        size="small"
                                                        fullWidth
                                                        value={event.instanceOf || ""}
                                                        onChange={(e) => handleEventChange(index, "instanceOf", e.target.value || null)}
                                                    >
                                                        <MenuItem value="">None</MenuItem>
                                                        {entities.map((entity, idx) => (
                                                            <MenuItem key={idx} value={entity}>
                                                                {entity}
                                                            </MenuItem>
                                                        ))}
                                                    </TextField>
                                                </Grid>

                                                {/* Nuova riga singola per Depends On */}
                                                <Grid item xs={12}>
                                                    <TextField
                                                        label="Depends On"
                                                        select
                                                        size="small"
                                                        fullWidth
                                                        value={event.dependOn || ""}
                                                        onChange={(e) => handleEventChange(index, "dependOn", e.target.value || null)}
                                                    >
                                                        <MenuItem value="">None</MenuItem>
                                                        {entities.map((entity, idx) => (
                                                            <MenuItem key={idx} value={entity}>
                                                                {entity}
                                                            </MenuItem>
                                                        ))}
                                                    </TextField>
                                                </Grid>
                                                <TextField
                                                    label="Distribution Type"
                                                    select
                                                    required
                                                    error={!event.probabilityDistribution.type}
                                                    helperText={!event.probabilityDistribution.type ? "Distribution Type is required" : " "}
                                                    size="small"
                                                    fullWidth
                                                    value={event.probabilityDistribution.type}
                                                    onChange={(e) => handleEventChange(index, "probabilityDistribution.type", e.target.value)}
                                                >
                                                    {distributionTypes.map((opt) => (
                                                        <MenuItem key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </MenuItem>
                                                    ))}
                                                </TextField>
                                                {renderDistributionFields(event, index)}
                                            </Stack>
                                        </Paper>
                                    ))}
                                </Stack>
                            </Paper>
                        </Stack>
                    )}
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
        </>
    );
};

export default SimulationConfiguratorModalForm;
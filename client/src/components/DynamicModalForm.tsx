import React, {useState} from "react";
import {
    Box,
    TextField,
    Button,
    MenuItem,
    Typography,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

type ProbabilityDistribution = {
    type: string;
    [key: string]: any; // Parametri specifici per ogni tipo
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

type SimulationConfig = {
    entities: string[];
    events: Event[];
    name: string;
    numAggr: number;
    maxTime: number;
    numRuns: number;
    dir: string;
};


const durationOptions = [
    {value: 86400, label: "ONE_DAY (86400)"},
    {value: 604800, label: "SEVEN_DAYS (604800)"},
    {value: 864000, label: "TEN_DAYS (864000)"},
    {value: 1209600, label: "TWO_WEEKS (1209600)"},
    {value: 2592000, label: "ONE_MONTH (2592000)"},
];

const aggregationOptions = [
    {value: 1, label: "SECONDS (1)"},
    {value: 60, label: "MINUTES (60)"},
    {value: 3600, label: "HOURS (3600)"},
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

const getProbabilityDistribution = (event: Event) => {
    const type = event.probabilityDistribution.type;

    switch (type) {
        case "FIXED":
            return {
                type: "FIXED",
                fixedTime: event.probabilityDistribution.fixedTime,
                tolerance: event.probabilityDistribution.tolerance
            };
        case "UNIFORM":
            return {
                type: "UNIFORM",
                value: event.probabilityDistribution.value
            };
        case "NORMAL_SCALED":
            return {
                type: "NORMAL_SCALED",
                mean: event.probabilityDistribution.mean,
                std: event.probabilityDistribution.std,
                scalingFactorX: event.probabilityDistribution.scalingFactorX,
                scalingFactorY: event.probabilityDistribution.scalingFactorY
            };
        case "NORMAL":
            return {
                type: "NORMAL",
                mean: event.probabilityDistribution.mean,
                std: event.probabilityDistribution.std,
                scalingFactor: event.probabilityDistribution.scalingFactor
            };
        case "LOGNORMAL_SCALED":
            return {
                type: "LOGNORMAL_SCALED",
                mean: event.probabilityDistribution.mean,
                std: event.probabilityDistribution.std,
                scalingFactorX: event.probabilityDistribution.scalingFactorX,
                scalingFactorY: event.probabilityDistribution.scalingFactorY
            };
        case "LOGNORMAL":
            return {
                type: "LOGNORMAL",
                mean: event.probabilityDistribution.mean,
                std: event.probabilityDistribution.std,
                scalingFactor: event.probabilityDistribution.scalingFactor
            };
        case "EXPONENTIAL_SCALED":
            return {
                type: "EXPONENTIAL_SCALED",
                rate: event.probabilityDistribution.rate,
                scalingFactorX: event.probabilityDistribution.scalingFactorX,
                scalingFactorY: event.probabilityDistribution.scalingFactorY
            };
        case "EXPONENTIAL":
            return {
                type: "EXPONENTIAL",
                rate: event.probabilityDistribution.rate,
                scalingFactor: event.probabilityDistribution.scalingFactor
            };
        default:
            return {};
    }
};


const DynamicFormModal: React.FC = () => {
        const [open, setOpen] = useState(false);
        const [events, setEvents] = useState<Event[]>([]);
        const [name, setName] = useState("");
        const [dir, setDir] = useState("");
        const [duration, setDuration] = useState<number | "">("");
        const [aggregation, setAggregation] = useState<number | "">("");
        const [entityInput, setEntityInput] = useState("");
        const [entities, setEntities] = useState<string[]>([]);

        const [numRuns, setNumRuns] = useState<number | "">("");


        const handleAddBlock = () => {
            setEvents([
                ...events, {
                    eventName: "",
                    eventDescription: "",
                    instanceOf: null,
                    dependOn: null,
                    probabilityDistribution: {
                        type: ""
                    },
                    gasCost: 0,
                    relatedEvents: null
                }]);
        };

        const handleImportConfig = (config: SimulationConfig) => {
            setName(config.name);
            setDir(config.dir);
            setDuration(config.maxTime);
            setAggregation(config.numAggr);
            setNumRuns(config.numRuns);
            setEntities(config.entities);
            setEvents(config.events);
        };


        const handleRemoveBlock = (index: number) => {
            const updated = events.filter((_, i) => i !== index);
            setEvents(updated);
        };

        const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const text = e.target?.result as string;
                    const jsonConfig = JSON.parse(text) as SimulationConfig;
                    handleImportConfig(jsonConfig);
                };
                reader.readAsText(file);
            }
        };


        const handleBlockChange = (index: number, param: string, value: any) => {
            const updated = [...events];
            const updatedEvent = updated[index];

            // Gestisci la modifica di un parametro dentro probabilityDistribution
            if (param.startsWith("probabilityDistribution.")) {
                const paramName = param.split(".")[1]; // Estrae il nome del parametro (ad esempio "type")
                updatedEvent.probabilityDistribution[paramName] = value;
            }

            setEvents(updated); // Aggiorna lo stato
        };


        const handleAddEntity = () => {
            const trimmed = entityInput.trim();
            if (trimmed && !entities.includes(trimmed)) {
                setEntities([...entities, trimmed]);
                setEntityInput("");
            }
        };

        const handleParamChange = (index: number, param: string, value: any) => {
            const updated = [...events]; // Assicurati di aggiornare il giusto stato, in questo caso blocks
            const updatedEvent = updated[index];

            // Se param è un tipo di parametro in probabilityDistribution, aggiorna il campo corrispondente
            updatedEvent.probabilityDistribution[param] = value;

            setEvents(updated); // Aggiorna lo stato con il nuovo array
        };


        const handleRemoveEntity = (index: number) => {
            setEntities((prev) => prev.filter((_, i) => i !== index));
        };


        const handleSubmit = () => {
            const configJson = {
                maxTime: duration,
                numAggr: aggregation,
                dir: dir,
                numRuns: numRuns,
                configuration: {
                    entities: entities,
                    events: events.map((event) => ({
                        eventName: event.eventName,
                        eventDescription: event.eventDescription,
                        instanceOf: event.instanceOf || null,
                        dependOn: event.dependOn || null,
                        probabilityDistribution: getProbabilityDistribution(event),
                        gasCost: event.gasCost,
                    })),
                    name: name,
                }
            };

            console.log("JSON pronto da inviare:", configJson);
            // eventuale POST qui

            setOpen(false);
        };

        return (
            <div>
                <Button variant="contained" onClick={() => setOpen(true)}>
                    Apri Form
                </Button>

                <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
                    <DialogTitle>
                        Simulation configurator
                        <IconButton
                            aria-label="close"
                            onClick={() => setOpen(false)}
                            sx={{position: "absolute", right: 8, top: 8}}
                        >
                            <CloseIcon/>
                        </IconButton>
                    </DialogTitle>

                    <Button component="label">
                        Import Config
                        <input type="file" hidden onChange={handleFileUpload}/>
                    </Button>

                    <DialogContent dividers>
                        <Stack spacing={2}>
                            <TextField
                                label="Simulation name"
                                fullWidth
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />

                            <TextField
                                label="Output directory"
                                fullWidth
                                value={dir}
                                onChange={(e) => setDir(e.target.value)}
                            />

                            <TextField
                                label="Duration"
                                select
                                fullWidth
                                value={duration}
                                onChange={(e) => setDuration(Number(e.target.value))}
                            >
                                {durationOptions.map((opt) => (
                                    <MenuItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </MenuItem>
                                ))}
                            </TextField>

                            <TextField
                                label="Numero di simulazioni (numRuns)"
                                type="number"
                                fullWidth
                                value={numRuns}
                                onChange={(e) => setNumRuns(Number(e.target.value))}
                            />

                            <TextField
                                label="Aggregation"
                                select
                                fullWidth
                                value={aggregation}
                                onChange={(e) => setAggregation(Number(e.target.value))}
                            >
                                {aggregationOptions.map((opt) => (
                                    <MenuItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </MenuItem>
                                ))}
                            </TextField>

                            <Typography variant="h6">Entities</Typography>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <TextField
                                    label="Nuova entity"
                                    value={entityInput}
                                    fullWidth
                                    onChange={(e) => setEntityInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            handleAddEntity();
                                        }
                                    }}
                                />
                                <Button onClick={handleAddEntity} variant="contained">
                                    Aggiungi
                                </Button>
                            </Stack>

                            <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
                                {entities.map((entity, index) => (
                                    <Box
                                        key={index}
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            bgcolor: "primary.light",
                                            px: 1.5,
                                            py: 0.5,
                                            borderRadius: 2,
                                        }}
                                    >
                                        <Typography variant="body2" color="white" sx={{mr: 1}}>
                                            {entity}
                                        </Typography>
                                        <IconButton size="small" onClick={() => handleRemoveEntity(index)}>
                                            <CloseIcon fontSize="small" sx={{color: "white"}}/>
                                        </IconButton>
                                    </Box>
                                ))}
                            </Box>


                            {events.map((event, index) => (
                                <Box
                                    key={index}
                                    p={2}
                                    border={1}
                                    borderColor="grey.300"
                                    borderRadius={2}
                                >
                                    <Stack spacing={2}>
                                        <Typography variant="h6" component="div" gutterBottom>
                                            Event {index + 1} {event.eventName && `(${event.eventName})`}
                                        </Typography>

                                        {/* Input per il nome dell'evento */}
                                        <TextField
                                            label="Event Name"
                                            fullWidth
                                            value={event.eventName}
                                            onChange={(e) =>
                                                handleBlockChange(index, "eventName", e.target.value)
                                            }
                                        />

                                        <TextField
                                            label="Description"
                                            fullWidth
                                            multiline
                                            rows={1}  // Puoi scegliere il numero di righe che preferisci
                                            value={event.eventDescription}
                                            onChange={(e) =>
                                                handleBlockChange(index, "eventDescription", e.target.value)
                                            }
                                        />


                                        <TextField
                                            label="Gas cost"
                                            type="number"
                                            fullWidth
                                            value={event.gasCost}
                                            onChange={(e) =>
                                                handleBlockChange(index, "gasCost", Number(e.target.value))
                                            }
                                        />

                                        <TextField
                                            label="Instance Of"
                                            select
                                            fullWidth
                                            value={event.instanceOf || ""}  // Gestisci il caso in cui sia null
                                            onChange={(e) =>
                                                handleBlockChange(index, "instanceOf", e.target.value || null)  // Imposta null se non selezionato nulla
                                            }
                                        >
                                            {/* Aggiungi l'opzione "Nessuno" per il valore null */}
                                            <MenuItem value={null}>
                                                None
                                            </MenuItem>

                                            {/* Popola le entità dinamicamente */}
                                            {entities.map((entity, idx) => (
                                                <MenuItem key={idx} value={entity}>
                                                    {entity}
                                                </MenuItem>
                                            ))}
                                        </TextField>

                                        <TextField
                                            label="Depend On"
                                            select
                                            fullWidth
                                            value={event.dependOn || ""}  // Gestisci il caso in cui sia null
                                            onChange={(e) =>
                                                handleBlockChange(index, "dependOn", e.target.value || null)  // Imposta null se non selezionato nulla
                                            }
                                        >
                                            {/* Aggiungi l'opzione "Nessuno" per il valore null */}
                                            <MenuItem value={null}>
                                                None
                                            </MenuItem>

                                            {/* Popola le entità dinamicamente */}
                                            {entities.map((entity, idx) => (
                                                <MenuItem key={idx} value={entity}>
                                                    {entity}
                                                </MenuItem>
                                            ))}
                                        </TextField>


                                        <TextField
                                            label="Distribution Type"
                                            select
                                            fullWidth
                                            value={event?.probabilityDistribution?.type}
                                            onChange={(e) =>
                                                handleBlockChange(index, "probabilityDistribution.type", e.target.value)
                                            }
                                        >
                                            {distributionTypes.map((opt) => (
                                                <MenuItem key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </MenuItem>
                                            ))}
                                        </TextField>

                                        {(() => {
                                            const type = event?.probabilityDistribution?.type;
                                            switch (type) {
                                                case "EXPONENTIAL":
                                                    return (
                                                        <>
                                                            <TextField
                                                                label="Rate"
                                                                type="number"
                                                                value={event?.probabilityDistribution?.rate || ""}
                                                                onChange={(e) => handleParamChange(index, "rate", parseFloat(e.target.value))}
                                                            />
                                                            <TextField
                                                                label="Scaling Factor"
                                                                type="number"
                                                                value={event?.probabilityDistribution?.scalingFactor || ""}
                                                                onChange={(e) => handleParamChange(index, "scalingFactor", parseFloat(e.target.value))}
                                                            />
                                                        </>
                                                    );
                                                case "EXPONENTIAL_SCALED":
                                                    return (
                                                        <>
                                                            <TextField
                                                                label="Rate"
                                                                type="number"
                                                                value={event?.probabilityDistribution?.rate || ""}
                                                                onChange={(e) => handleParamChange(index, "rate", parseFloat(e.target.value))}
                                                            />
                                                            <TextField
                                                                label="Scaling Factor X"
                                                                type="number"
                                                                value={event?.probabilityDistribution?.scalingFactorX || ""}
                                                                onChange={(e) => handleParamChange(index, "scalingFactorX", parseFloat(e.target.value))}
                                                            />
                                                            <TextField
                                                                label="Scaling Factor Y"
                                                                type="number"
                                                                value={event?.probabilityDistribution?.scalingFactorY || ""}
                                                                onChange={(e) => handleParamChange(index, "scalingFactorY", parseFloat(e.target.value))}
                                                            />
                                                        </>
                                                    );
                                                case "NORMAL":
                                                case "LOGNORMAL":
                                                    return (
                                                        <>
                                                            <TextField
                                                                label="Mean"
                                                                type="number"
                                                                value={event?.probabilityDistribution?.mean || ""}
                                                                onChange={(e) => handleParamChange(index, "mean", parseFloat(e.target.value))}
                                                            />
                                                            <TextField
                                                                label="Std Dev"
                                                                type="number"
                                                                value={event?.probabilityDistribution?.std || ""}
                                                                onChange={(e) => handleParamChange(index, "std", parseFloat(e.target.value))}
                                                            />
                                                            <TextField
                                                                label="Scaling Factor"
                                                                type="number"
                                                                value={event?.probabilityDistribution?.scalingFactor || ""}
                                                                onChange={(e) => handleParamChange(index, "scalingFactor", parseFloat(e.target.value))}
                                                            />
                                                        </>
                                                    );
                                                case "NORMAL_SCALED":
                                                case "LOGNORMAL_SCALED":
                                                    return (
                                                        <>
                                                            <TextField
                                                                label="Mean"
                                                                type="number"
                                                                value={event?.probabilityDistribution?.mean || ""}
                                                                onChange={(e) => handleParamChange(index, "mean", parseFloat(e.target.value))}
                                                            />
                                                            <TextField
                                                                label="Std Dev"
                                                                type="number"
                                                                value={event?.probabilityDistribution?.std || ""}
                                                                onChange={(e) => handleParamChange(index, "std", parseFloat(e.target.value))}
                                                            />
                                                            <TextField
                                                                label="Scaling Factor X"
                                                                type="number"
                                                                value={event?.probabilityDistribution?.scalingFactorX || ""}
                                                                onChange={(e) => handleParamChange(index, "scalingFactorX", parseFloat(e.target.value))}
                                                            />
                                                            <TextField
                                                                label="Scaling Factor Y"
                                                                type="number"
                                                                value={event?.probabilityDistribution?.scalingFactorY || ""}
                                                                onChange={(e) => handleParamChange(index, "scalingFactorY", parseFloat(e.target.value))}
                                                            />
                                                        </>
                                                    );
                                                case "FIXED":
                                                    return (
                                                        <>
                                                            <TextField
                                                                label="Fixed Time"
                                                                type="number"
                                                                value={event?.probabilityDistribution?.fixedTime || ""}
                                                                onChange={(e) => handleParamChange(index, "fixedTime", parseFloat(e.target.value))}
                                                            />
                                                            <TextField
                                                                label="Tolerance"
                                                                type="number"
                                                                value={event?.probabilityDistribution?.tolerance || ""}
                                                                onChange={(e) => handleParamChange(index, "tolerance", parseFloat(e.target.value))}
                                                            />
                                                        </>
                                                    );
                                                case "UNIFORM":
                                                    return (
                                                        <TextField
                                                            label="Value"
                                                            type="number"
                                                            value={event?.probabilityDistribution?.value || ""}
                                                            onChange={(e) => handleParamChange(index, "value", parseFloat(e.target.value))}
                                                        />
                                                    );
                                                default:
                                                    return null;
                                            }
                                        })()}


                                        <Button
                                            color="error"
                                            onClick={() => handleRemoveBlock(index)}
                                        >
                                            Rimuovi Blocco
                                        </Button>
                                    </Stack>
                                </Box>
                            ))}

                            <Button variant="outlined" onClick={handleAddBlock}>
                                + Add Event
                            </Button>
                        </Stack>
                    </DialogContent>

                    <DialogActions>
                        <Button onClick={() => setOpen(false)}>Annulla</Button>
                        <Button onClick={handleSubmit} variant="contained">
                            Invia
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        );
    }
;

export default DynamicFormModal;

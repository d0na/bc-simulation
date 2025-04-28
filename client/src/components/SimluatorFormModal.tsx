import React, { useState } from 'react';
import {
    Button,
    Modal,
    Box,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Divider,
    IconButton,
    Typography,
    Grid,
    Paper
} from '@mui/material';
import { Add, Remove } from '@mui/icons-material';

const durationOptions = [
    { value: 86400, label: 'ONE_DAY (86400)' },
    { value: 604800, label: 'SEVEN_DAYS (604800)' },
    { value: 864000, label: 'TEN_DAYS (864000)' },
    { value: 1209600, label: 'TWO_WEEKS (1209600)' },
    { value: 2592000, label: 'ONE_MONTH (2592000)' },
];

const aggregationOptions = [
    { value: 1, label: 'SECONDS (1)' },
    { value: 60, label: 'MINUTES (60)' },
    { value: 3600, label: 'HOURS (3600)' },
];

const distributionTypes = [
    { value: 'UNIFORM', label: 'Uniform' },
    { value: 'NORMAL_SCALED', label: 'Normal Scaled' },
    { value: 'NORMAL', label: 'Normal' },
    { value: 'LOGNORMAL_SCALED', label: 'LogNormal Scaled' },
    { value: 'LOGNORMAL', label: 'LogNormal' },
    { value: 'EXPONENTIAL', label: 'Exponential' },
    { value: 'EXPONENTIAL_SCALED', label: 'Exponential Scaled' },
];

const SimulatorFormModal = ({ onGenerate }) => {
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({
        dir: './output',
        maxTime: 86400,
        numAggr: 1,
        numRuns: 5,
        events: []
    });

    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        onGenerate(formData);
        handleClose();
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleEventChange = (index, field, value) => {
        setFormData(prev => {
            const newEvents = [...prev.events];
            newEvents[index] = { ...newEvents[index], [field]: value };
            return { ...prev, events: newEvents };
        });
    };

    const handleDistributionChange = (eventIndex, field, value) => {
        setFormData(prev => {
            const newEvents = [...prev.events];
            newEvents[eventIndex] = {
                ...newEvents[eventIndex],
                probabilityDistribution: {
                    ...(newEvents[eventIndex].probabilityDistribution || {}),
                    [field]: value
                }
            };
            return { ...prev, events: newEvents };
        });
    };

    const handleRelatedEventChange = (eventIndex, relatedIndex, field, value) => {
        setFormData(prev => {
            const newEvents = [...prev.events];
            const relatedEvents = [...(newEvents[eventIndex].relatedEvents || [])];
            relatedEvents[relatedIndex] = { ...relatedEvents[relatedIndex], [field]: value };
            newEvents[eventIndex] = { ...newEvents[eventIndex], relatedEvents };
            return { ...prev, events: newEvents };
        });
    };

    const addEvent = () => {
        setFormData(prev => ({
            ...prev,
            events: [
                ...prev.events,
                {
                    eventName: '',
                    eventDescription: '',
                    gasCost: 0,
                    probabilityDistribution: { type: 'UNIFORM' },
                    relatedEvents: []
                }
            ]
        }));
    };

    const removeEvent = (index) => {
        setFormData(prev => ({
            ...prev,
            events: prev.events.filter((_, i) => i !== index)
        }));
    };

    const addRelatedEvent = (eventIndex) => {
        setFormData(prev => {
            const newEvents = [...prev.events];
            newEvents[eventIndex] = {
                ...newEvents[eventIndex],
                relatedEvents: [
                    ...(newEvents[eventIndex].relatedEvents || []),
                    {
                        eventName: '',
                        eventDescription: '',
                        gasCost: 0,
                        probabilityDistribution: { type: 'UNIFORM' },
                        relatedEvents: []
                    }
                ]
            };
            return { ...prev, events: newEvents };
        });
    };

    const removeRelatedEvent = (eventIndex, relatedIndex) => {
        setFormData(prev => {
            const newEvents = [...prev.events];
            newEvents[eventIndex] = {
                ...newEvents[eventIndex],
                relatedEvents: newEvents[eventIndex].relatedEvents.filter((_, i) => i !== relatedIndex)
            };
            return { ...prev, events: newEvents };
        });
    };

    const renderDistributionFields = (eventIndex, distributionType) => {
        const dist = formData.events[eventIndex]?.probabilityDistribution || {};

        switch (distributionType) {
            case 'UNIFORM':
                return (
                    <TextField
                        label="Value"
                        type="number"
                        value={dist.value || ''}
                        onChange={(e) => handleDistributionChange(eventIndex, 'value', parseFloat(e.target.value))}
                        fullWidth
                        margin="normal"
                        InputProps={{ step: "0.0001" }}
                    />
                );
            case 'NORMAL':
                return (
                    <>
                        <TextField
                            label="Mean"
                            type="number"
                            value={dist.mean || ''}
                            onChange={(e) => handleDistributionChange(eventIndex, 'mean', parseFloat(e.target.value))}
                            fullWidth
                            margin="normal"
                        />
                        <TextField
                            label="Standard Deviation"
                            type="number"
                            value={dist.std || ''}
                            onChange={(e) => handleDistributionChange(eventIndex, 'std', parseFloat(e.target.value))}
                            fullWidth
                            margin="normal"
                            InputProps={{ min: 0 }}
                        />
                        <TextField
                            label="Scaling Factor"
                            type="number"
                            value={dist.scalingFactor || ''}
                            onChange={(e) => handleDistributionChange(eventIndex, 'scalingFactor', parseFloat(e.target.value))}
                            fullWidth
                            margin="normal"
                            InputProps={{ step: "0.01", min: 0 }}
                        />
                    </>
                );
            case 'NORMAL_SCALED':
                return (
                    <>
                        <TextField
                            label="Mean"
                            type="number"
                            value={dist.mean || ''}
                            onChange={(e) => handleDistributionChange(eventIndex, 'mean', parseFloat(e.target.value))}
                            fullWidth
                            margin="normal"
                        />
                        <TextField
                            label="Standard Deviation"
                            type="number"
                            value={dist.std || ''}
                            onChange={(e) => handleDistributionChange(eventIndex, 'std', parseFloat(e.target.value))}
                            fullWidth
                            margin="normal"
                            InputProps={{ min: 0 }}
                        />
                        <TextField
                            label="Scaling Factor X"
                            type="number"
                            value={dist.scalingFactorX || ''}
                            onChange={(e) => handleDistributionChange(eventIndex, 'scalingFactorX', parseFloat(e.target.value))}
                            fullWidth
                            margin="normal"
                            InputProps={{ step: "0.01", min: 0 }}
                        />
                        <TextField
                            label="Scaling Factor Y"
                            type="number"
                            value={dist.scalingFactorY || ''}
                            onChange={(e) => handleDistributionChange(eventIndex, 'scalingFactorY', parseFloat(e.target.value))}
                            fullWidth
                            margin="normal"
                            InputProps={{ step: "0.01", min: 0 }}
                        />
                    </>
                );
            case 'LOGNORMAL':
                return (
                    <>
                        <TextField
                            label="Mean"
                            type="number"
                            value={dist.mean || ''}
                            onChange={(e) => handleDistributionChange(eventIndex, 'mean', parseFloat(e.target.value))}
                            fullWidth
                            margin="normal"
                        />
                        <TextField
                            label="Standard Deviation"
                            type="number"
                            value={dist.std || ''}
                            onChange={(e) => handleDistributionChange(eventIndex, 'std', parseFloat(e.target.value))}
                            fullWidth
                            margin="normal"
                            InputProps={{ min: 0 }}
                        />
                        <TextField
                            label="Scaling Factor"
                            type="number"
                            value={dist.scalingFactor || ''}
                            onChange={(e) => handleDistributionChange(eventIndex, 'scalingFactor', parseFloat(e.target.value))}
                            fullWidth
                            margin="normal"
                            InputProps={{ step: "0.01", min: 0 }}
                        />
                    </>
                );
            case 'LOGNORMAL_SCALED':
                return (
                    <>
                        <TextField
                            label="Mean"
                            type="number"
                            value={dist.mean || ''}
                            onChange={(e) => handleDistributionChange(eventIndex, 'mean', parseFloat(e.target.value))}
                            fullWidth
                            margin="normal"
                        />
                        <TextField
                            label="Standard Deviation"
                            type="number"
                            value={dist.std || ''}
                            onChange={(e) => handleDistributionChange(eventIndex, 'std', parseFloat(e.target.value))}
                            fullWidth
                            margin="normal"
                            InputProps={{ min: 0 }}
                        />
                        <TextField
                            label="Scaling Factor X"
                            type="number"
                            value={dist.scalingFactorX || ''}
                            onChange={(e) => handleDistributionChange(eventIndex, 'scalingFactorX', parseFloat(e.target.value))}
                            fullWidth
                            margin="normal"
                            InputProps={{ step: "0.01", min: 0 }}
                        />
                        <TextField
                            label="Scaling Factor Y"
                            type="number"
                            value={dist.scalingFactorY || ''}
                            onChange={(e) => handleDistributionChange(eventIndex, 'scalingFactorY', parseFloat(e.target.value))}
                            fullWidth
                            margin="normal"
                            InputProps={{ step: "0.01", min: 0 }}
                        />
                    </>
                );
            case 'EXPONENTIAL':
                return (
                    <>
                        <TextField
                            label="Rate"
                            type="number"
                            value={dist.rate || ''}
                            onChange={(e) => handleDistributionChange(eventIndex, 'rate', parseFloat(e.target.value))}
                            fullWidth
                            margin="normal"
                            InputProps={{ step: "0.01", min: 0 }}
                        />
                        <TextField
                            label="Scaling Factor"
                            type="number"
                            value={dist.scalingFactor || ''}
                            onChange={(e) => handleDistributionChange(eventIndex, 'scalingFactor', parseFloat(e.target.value))}
                            fullWidth
                            margin="normal"
                            InputProps={{ step: "0.01", min: 0 }}
                        />
                    </>
                );
            case 'EXPONENTIAL_SCALED':
                return (
                    <>
                        <TextField
                            label="Rate"
                            type="number"
                            value={dist.rate || ''}
                            onChange={(e) => handleDistributionChange(eventIndex, 'rate', parseFloat(e.target.value))}
                            fullWidth
                            margin="normal"
                            InputProps={{ step: "0.01", min: 0 }}
                        />
                        <TextField
                            label="Scaling Factor X"
                            type="number"
                            value={dist.scalingFactorX || ''}
                            onChange={(e) => handleDistributionChange(eventIndex, 'scalingFactorX', parseFloat(e.target.value))}
                            fullWidth
                            margin="normal"
                            InputProps={{ step: "0.01", min: 0 }}
                        />
                        <TextField
                            label="Scaling Factor Y"
                            type="number"
                            value={dist.scalingFactorY || ''}
                            onChange={(e) => handleDistributionChange(eventIndex, 'scalingFactorY', parseFloat(e.target.value))}
                            fullWidth
                            margin="normal"
                            InputProps={{ step: "0.01", min: 0 }}
                        />
                    </>
                );
            default:
                return null;
        }
    };

    const EventForm = ({ event, eventIndex, onRemove }) => {
        const distType = event.probabilityDistribution?.type || 'UNIFORM';

        return (
            <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                        <TextField
                            label="Event Name"
                            value={event.eventName}
                            onChange={(e) => handleEventChange(eventIndex, 'eventName', e.target.value)}
                            fullWidth
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField
                            label="Event Description"
                            value={event.eventDescription}
                            onChange={(e) => handleEventChange(eventIndex, 'eventDescription', e.target.value)}
                            fullWidth
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField
                            label="Gas Cost"
                            type="number"
                            value={event.gasCost}
                            onChange={(e) => handleEventChange(eventIndex, 'gasCost', parseInt(e.target.value))}
                            fullWidth
                            InputProps={{ inputProps: { min: 0 } }}
                        />
                    </Grid>
                </Grid>

                <FormControl fullWidth margin="normal">
                    <InputLabel>Distribution Type</InputLabel>
                    <Select
                        value={distType}
                        label="Distribution Type"
                        onChange={(e) => handleDistributionChange(eventIndex, 'type', e.target.value)}
                    >
                        {distributionTypes.map((type) => (
                            <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {renderDistributionFields(eventIndex, distType)}

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<Add />}
                        onClick={() => addRelatedEvent(eventIndex)}
                    >
                        Add Related Event
                    </Button>
                    {onRemove && (
                        <Button
                            variant="outlined"
                            color="error"
                            startIcon={<Remove />}
                            onClick={onRemove}
                        >
                            Remove Event
                        </Button>
                    )}
                </Box>

                {event.relatedEvents?.map((relatedEvent, relatedIndex) => (
                    <Box key={relatedIndex} sx={{ ml: 4, mt: 2 }}>
                        <EventForm
                            event={relatedEvent}
                            eventIndex={eventIndex}
                            relatedIndex={relatedIndex}
                            onRemove={() => removeRelatedEvent(eventIndex, relatedIndex)}
                        />
                    </Box>
                ))}
            </Paper>
        );
    };

    return (
        <>
            <Button variant="contained" onClick={handleOpen}>
                Open Simulator Form
            </Button>

            <Modal open={open} onClose={handleClose}>
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '80%',
                    maxWidth: 800,
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    bgcolor: 'background.paper',
                    boxShadow: 24,
                    p: 4,
                    borderRadius: 1
                }}>
                    <Typography variant="h5" component="h2" gutterBottom>
                        Simulator Configuration
                    </Typography>

                    <form onSubmit={handleSubmit}>
                        <TextField
                            name="dir"
                            label="Output Directory"
                            value={formData.dir}
                            onChange={handleChange}
                            fullWidth
                            margin="normal"
                        />

                        <FormControl fullWidth margin="normal">
                            <InputLabel>Simulation Duration</InputLabel>
                            <Select
                                name="maxTime"
                                value={formData.maxTime}
                                label="Simulation Duration"
                                onChange={handleChange}
                            >
                                {durationOptions.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth margin="normal">
                            <InputLabel>Aggregation</InputLabel>
                            <Select
                                name="numAggr"
                                value={formData.numAggr}
                                label="Aggregation"
                                onChange={handleChange}
                            >
                                {aggregationOptions.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            name="numRuns"
                            label="Number of Runs"
                            type="number"
                            value={formData.numRuns}
                            onChange={handleChange}
                            fullWidth
                            margin="normal"
                            inputProps={{ min: 1, max: 100 }}
                        />

                        <Divider sx={{ my: 3 }}>Events</Divider>

                        {formData.events.map((event, index) => (
                            <EventForm
                                key={index}
                                event={event}
                                eventIndex={index}
                                onRemove={() => removeEvent(index)}
                            />
                        ))}

                        <Button
                            variant="outlined"
                            startIcon={<Add />}
                            onClick={addEvent}
                            fullWidth
                            sx={{ mb: 2 }}
                        >
                            Add Event
                        </Button>

                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                            <Button onClick={handleClose} sx={{ mr: 2 }}>
                                Cancel
                            </Button>
                            <Button type="submit" variant="contained">
                                Generate JSON
                            </Button>
                        </Box>
                    </form>
                </Box>
            </Modal>
        </>
    );
};

export default SimulatorFormModal;
import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    IconButton,
    Box,
    Slider,
    Typography,
    Stack
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { Line } from 'react-chartjs-2';

interface DistributionData {
    label: string;
    data: { x: number; y: number; }[];
    borderColor: string;
}

interface Props {
    open: boolean;
    onClose: () => void;
    distributions: DistributionData[];
    duration: number;
}

const DistributionPreviewModal: React.FC<Props> = ({ open, onClose, distributions, duration }) => {
    const [yScale, setYScale] = useState<number>(1);
    const [xScale, setXScale] = useState<number>(duration);

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="lg"
            fullWidth
        >
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    Distribution Preview
                    <IconButton onClick={onClose} size="small">
                        <Close />
                    </IconButton>
                </Box>
            </DialogTitle>
            <DialogContent>
                <Stack spacing={2}>
                    <Box height={500}>
                        <Line
                            data={{
                                datasets: distributions.map(dist => ({
                                    label: dist.label,
                                    data: dist.data,
                                    borderColor: dist.borderColor,
                                    borderWidth: 3,
                                    pointRadius: 0,
                                    fill: false
                                }))
                            }}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                    x: {
                                        type: 'linear',
                                        max: xScale,
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
                                        max: yScale,
                                        title: {
                                            display: true,
                                            text: 'Probability'
                                        },
                                        ticks: {
                                            callback: function(value) {
                                                const numValue = Number(value);
                                                if (Math.abs(numValue) < 1e-9) {
                                                    return "0";
                                                }
                                                let decimals;
                                                if (numValue >= 0.01) {
                                                    decimals = 2;
                                                } else if (numValue >= 0.001) {
                                                    decimals = 3;
                                                } else if (numValue >= 0.0001) {
                                                    decimals = 4;
                                                } else if (numValue >= 0.00001) {
                                                    decimals = 5;
                                                } else if (numValue >= 0.000001) {
                                                    decimals = 6;
                                                } else if (numValue >= 0.0000001) {
                                                    decimals = 7;
                                                } else if (numValue >= 0.00000001) {
                                                    decimals = 8;
                                                } else {
                                                    decimals = 9;
                                                }
                                                return numValue.toFixed(decimals).replace('.', ',');
                                            }
                                        }
                                    }
                                },
                                plugins: {
                                    legend: {
                                        position: 'top'
                                    }
                                }
                            }}
                        />
                    </Box>
                    <Box px={2}>
                        <Typography variant="subtitle2" gutterBottom>Zoom Controls</Typography>
                        <Stack direction="row" spacing={3}>
                            <Box flex={1}>
                                <Typography variant="body2" gutterBottom>Time Axis (X)</Typography>
                                <Slider
                                    value={xScale}
                                    onChange={(_, value) => setXScale(value as number)}
                                    min={duration * 0.1}
                                    max={duration}
                                    step={duration * 0.05}
                                    valueLabelDisplay="auto"
                                    valueLabelFormat={(value) => {
                                        if (value >= 3600) {
                                            return Math.round(value / 3600) + 'h';
                                        }
                                        if (value >= 60) {
                                            return Math.round(value / 60) + 'm';
                                        }
                                        return value + 's';
                                    }}
                                />
                            </Box>
                            <Box flex={1}>
                                <Typography variant="body2" gutterBottom>Probability Axis (Y)</Typography>
                                <Slider
                                    value={yScale}
                                    onChange={(_, value) => setYScale(value as number)}
                                    min={0.001}
                                    max={1}
                                    step={0.001}
                                    valueLabelDisplay="auto"
                                    valueLabelFormat={(value) => value.toFixed(3)}
                                />
                            </Box>
                        </Stack>
                    </Box>
                </Stack>
            </DialogContent>
        </Dialog>
    );
};

export default DistributionPreviewModal; 

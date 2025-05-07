import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';
import { Box, Typography } from '@mui/material';
import {CsvFile} from "./types/CsvFile.ts";

interface Props {
    selectedFiles: CsvFile[];
    chartConfig: { columns: string[]; type: string };
}

const ChartViewer: React.FC<Props> = ({ selectedFiles, chartConfig }) => {
    const demoData = [
        { time: 1, value1: 10, value2: 20 },
        { time: 2, value1: 15, value2: 25 },
    ];

    return (
        <Box sx={{ mt: 4 }}>
            <Typography variant="h6">Grafico</Typography>

            {chartConfig.type === 'line' && (
                <LineChart width={800} height={400} data={demoData}>
                    <CartesianGrid stroke="#ccc" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {chartConfig.columns.map((col, idx) => (
                        <Line key={idx} type="monotone" dataKey={col} stroke="#8884d8" />
                    ))}
                </LineChart>
            )}

            {chartConfig.type === 'bar' && (
                <BarChart width={800} height={400} data={demoData}>
                    <CartesianGrid stroke="#ccc" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {chartConfig.columns.map((col, idx) => (
                        <Bar key={idx} dataKey={col} fill="#8884d8" />
                    ))}
                </BarChart>
            )}
        </Box>
    );
};

export default ChartViewer;

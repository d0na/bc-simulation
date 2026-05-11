import React from "react";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
} from "recharts";
import { Typography } from "@mui/material";

interface ChartSeries {
    name: string;
    data: number[];
}

interface ChartDataResponse {
    labels: string[];
    series: ChartSeries[];
}

interface Props {
    chartData: ChartDataResponse | null;
}

const ChartViewerNew: React.FC<Props> = ({ chartData }) => {
    if (!chartData) {
        return <Typography variant="h6">Nessun dato da visualizzare</Typography>;
    }

    const chartRows = chartData?.labels?.map((label, idx) => {
        const point: any = { label };
        chartData.series.forEach((s) => {
            point[s.name] = s.data[idx];
        });
        return point;
    });

    return (
        <div>
            <Typography variant="h6" sx={{ mb: 2 }}>
                Risultato Grafico
            </Typography>
            <ResponsiveContainer width="100%" height={500}>
                <LineChart data={chartRows}>
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {chartData?.series?.map((s) => (
                        <Line
                            key={s.name}
                            type="monotone"
                            dataKey={s.name}
                            stroke="#8884d8"
                            dot={false}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ChartViewerNew;

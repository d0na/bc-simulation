import React, { useState } from 'react';
import {
  Box, Slider, Typography, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import { Line } from 'react-chartjs-2';
import { Chart, LineElement, PointElement, CategoryScale, LinearScale } from 'chart.js';
import {DistributionType} from "../types.ts";

Chart.register(LineElement, PointElement, CategoryScale, LinearScale);


const DistributionVisualizer: React.FC = () => {
  const [distribution, setDistribution] = useState<DistributionType>('NORMAL');
  const [params, setParams] = useState({
    mean: 100,
    std: 10,
    scalingFactor: 1,
    lambda: 0.01,
    baseProb: 1,
  });

  const handleParamChange = (name: string) => (_: Event, value: number | number[]) => {
    setParams(prev => ({ ...prev, [name]: value as number }));
  };

  const generateData = () => {
    const data: { x: number, y: number }[] = [];
    const maxTime = 500;
    for (let t = 0; t < maxTime; t++) {
      data.push({ x: t, y: getProb(t) });
    }
    return data;
  };

  const getProb = (t: number): number => {
    const { mean, std, scalingFactor, lambda, baseProb } = params;
    const realTime = t * scalingFactor;

    switch (distribution) {
      case 'NORMAL':
        return normal(t, mean, std);
      case 'NORMAL_SCALED':
        return normal(realTime, mean, std);
      case 'EXPONENTIAL':
        return baseProb * Math.exp(-lambda * t);
      case 'EXPONENTIAL_SCALED':
        return baseProb * Math.exp(-lambda * realTime);
      case 'LOGNORMAL':
        return lognormal(t, mean, std);
      case 'LOGNORMAL_SCALED':
        return lognormal(realTime, mean, std);
      default:
        return 0;
    }
  };

  const normal = (x: number, mean: number, std: number) => {
    const coeff = 1 / (std * Math.sqrt(2 * Math.PI));
    const exp = Math.exp(-Math.pow(x - mean, 2) / (2 * std * std));
    return coeff * exp;
  };

  const lognormal = (x: number, mean: number, std: number) => {
    if (x <= 0) return 0;
    const coeff = 1 / (x * std * Math.sqrt(2 * Math.PI));
    const exp = Math.exp(-Math.pow(Math.log(x) - mean, 2) / (2 * std * std));
    return coeff * exp;
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom>Distribution Visualizer</Typography>

      <FormControl sx={{ mb: 2, minWidth: 200 }}>
        <InputLabel>Distribution</InputLabel>
        <Select
          value={distribution}
          label="Distribution"
          onChange={e => setDistribution(e.target.value as DistributionType)}
        >
          <MenuItem value="NORMAL">Normal</MenuItem>
          <MenuItem value="NORMAL_SCALED">Normal Scaled</MenuItem>
          <MenuItem value="EXPONENTIAL">Exponential</MenuItem>
          <MenuItem value="EXPONENTIAL_SCALED">Exponential Scaled</MenuItem>
          <MenuItem value="LOGNORMAL">Lognormal</MenuItem>
          <MenuItem value="LOGNORMAL_SCALED">Lognormal Scaled</MenuItem>
        </Select>
      </FormControl>

      {distribution.includes('NORMAL') || distribution.includes('LOGNORMAL') ? (
        <>
          <Typography>Mean: {params.mean}</Typography>
          <Slider min={1} max={200} value={params.mean} onChange={handleParamChange('mean')} />
          <Typography>Std Dev: {params.std}</Typography>
          <Slider min={1} max={100} value={params.std} onChange={handleParamChange('std')} />
        </>
      ) : null}

      {distribution.includes('SCALED') ? (
        <>
          <Typography>Scaling Factor: {params.scalingFactor}</Typography>
          <Slider min={0.01} max={5} step={0.01} value={params.scalingFactor} onChange={handleParamChange('scalingFactor')} />
        </>
      ) : null}

      {distribution.includes('EXPONENTIAL') ? (
        <>
          <Typography>Lambda: {params.lambda}</Typography>
          <Slider min={0.0001} max={1} step={0.0001} value={params.lambda} onChange={handleParamChange('lambda')} />
          <Typography>Base Probability: {params.baseProb}</Typography>
          <Slider min={0.0001} max={1} step={0.0001} value={params.baseProb} onChange={handleParamChange('baseProb')} />
        </>
      ) : null}

      <Line
        data={{
          datasets: [{
            label: `${distribution} Probability`,
            data: generateData(),
            borderWidth: 2,
            fill: false,
            pointRadius: 0,
          }]
        }}
        options={{
          responsive: true,
          scales: {
            x: { type: 'linear', title: { display: true, text: 'Time' } },
            y: { beginAtZero: true, title: { display: true, text: 'Probability' } }
          }
        }}
      />
    </Box>
  );
};

export default DistributionVisualizer;

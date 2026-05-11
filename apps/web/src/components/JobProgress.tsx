import React, { useEffect, useState } from 'react';
import { TableCell, LinearProgress, Typography } from '@mui/material';

interface JobProgressProps {
    progress: number;        // Percentuale (es. 42.5)
    startTime: string;       // es. "2025-04-14T14:00:00Z"
}

const JobProgress: React.FC<JobProgressProps> = ({ progress, startTime }) => {
    const [animatedProgress, setAnimatedProgress] = useState(progress);
    const [elapsedTime, setElapsedTime] = useState(0);     // in secondi
    const [remainingTime, setRemainingTime] = useState(0); // in secondi

    // Interpolazione morbida del progress
    useEffect(() => {
        const interval = setInterval(() => {
            setAnimatedProgress(prev => {
                const delta = progress - prev;
                if (Math.abs(delta) < 0.1) return progress;
                return prev + delta * 0.2;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [progress]);

    // Calcolo tempo trascorso e rimanente
    useEffect(() => {
        const interval = setInterval(() => {
            const startMillis = new Date(startTime).getTime();
            const now = Date.now();
            const elapsed = (now - startMillis) / 1000;
            setElapsedTime(elapsed);

            if (animatedProgress > 0) {
                const estimatedTotal = elapsed / (animatedProgress / 100);
                const remaining = estimatedTotal - elapsed;
                setRemainingTime(Math.max(remaining, 0));
            } else {
                setRemainingTime(0);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [animatedProgress, startTime]);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        const parts = [];
        if (h > 0) parts.push(`${h}h`);
        if (m > 0 || h > 0) parts.push(`${m}m`);
        parts.push(`${s}s`);
        return parts.join(' ');
    };

    return (
        <>
            <Typography variant="body2" color="textSecondary">
                {animatedProgress.toFixed(2)}% | EL: {formatTime(elapsedTime)} | RM: {formatTime(remainingTime)}
            </Typography>
            <LinearProgress
                variant="determinate"
                value={animatedProgress}
                sx={{ height: 8, borderRadius: 4, mt: 1 }}
            />
        </>
    );
};

export default JobProgress;

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import {
    Button,
    CircularProgress,
    Stack,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper
} from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RefreshIcon from '@mui/icons-material/Refresh';
import bcLogo from "../assets/blockchain-10000.svg";
import StopCircleIcon from '@mui/icons-material/StopCircle';
import IconButton from '@mui/material/IconButton';
import JobProgress from "./JobProgress.tsx";

interface JobStep {
    stepName: string;
    stepStatus: string;
}

interface Job {
    jobName: string;
    jobInstanceId: number;
    jobExecutionId: number;
    startTime: string;
    endTime: string;
    status: string;
    exitStatus: string;
    steps: JobStep[];
    progress: number;
}

function JobsPage() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);

    const fetchJobs = async () => {
        setLoading(true);
        try {
            const res = await axios.get('http://localhost:8099/jobs/status');
            setJobs(res.data);
            setLastUpdated(new Date().toLocaleString());
        } catch (err) {
            console.error('Errore nel recupero dei job:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
        const interval = setInterval(fetchJobs, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleStopJob = async (executionId: number) => {
        try {
            await axios.post(`http://localhost:8099/jobs/stop/${executionId}`);
            alert(`Richiesta di STOP inviata per jobExecutionId: ${executionId}`);
            fetchJobs(); // aggiorna la lista
        } catch (err) {
            console.error("Errore nello stop del job:", err);
            alert("Errore nello stop del job");
        }
    };

    return (
        <div>
            <div>
                <a href="https://" target="_blank">
                    <img src={bcLogo} className="logo" alt="Blockchain logo" />
                </a>
            </div>
            <h1>Jobs Status</h1>

            <Stack direction="row" spacing={2} justifyContent="center" marginBottom={2}>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/')}
                >
                    Home
                </Button>

                <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={<RefreshIcon />}
                    onClick={fetchJobs}
                    disabled={loading}
                >
                    {loading ? 'Aggiornamento...' : 'Refresh'}
                </Button>
            </Stack>

            {lastUpdated && (
                <Typography variant="body2" >
                   Last update: {lastUpdated}
                </Typography>
            )}

            {loading && (
                <Stack alignItems="center" marginY={2}>
                    <CircularProgress size={32} />
                </Stack>
            )}

            <TableContainer component={Paper} sx={{ marginTop: 2 }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Job Name</TableCell>
                            <TableCell>Instance ID</TableCell>
                            <TableCell>Execution ID</TableCell>
                            <TableCell>Start Time</TableCell>
                            <TableCell>End Time</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Exit Status</TableCell>
                            <TableCell>Steps</TableCell>
                            <TableCell>Progress</TableCell>
                            <TableCell>Actions</TableCell>

                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {jobs.map((job) => (
                            <TableRow key={job.jobExecutionId}>
                                <TableCell>{job.jobName}</TableCell>
                                <TableCell>{job.jobInstanceId}</TableCell>
                                <TableCell>{job.jobExecutionId}</TableCell>
                                <TableCell>{new Date(job.startTime).toLocaleString()}</TableCell>
                                <TableCell>{new Date(job.endTime).toLocaleString()}</TableCell>
                                <TableCell>{job.status}</TableCell>
                                <TableCell>{job.exitStatus}</TableCell>
                                <TableCell>
                                    <ul>
                                        {job.steps.map((step, index) => (
                                            <li key={index}>
                                                {step.stepName}: {step.stepStatus}
                                            </li>
                                        ))}
                                    </ul>
                                </TableCell>
                                <TableCell style={{ width: 250 }}>
                                    {/*<LinearProgress*/}
                                    {/*    variant="determinate"*/}
                                    {/*    value={job.progress}*/}
                                    {/*    sx={{ height: 8, borderRadius: 4 }}*/}
                                    {/*/>*/}
                                    <JobProgress progress={job.progress} startTime={job.startTime} />
                                </TableCell>
                                <TableCell>
                                    <IconButton
                                        color="error"
                                        onClick={() => handleStopJob(job.jobExecutionId)}
                                        title="Stop Job"
                                    >
                                        <StopCircleIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Button
                variant="contained"
                color="primary"
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate('/')}
                sx={{ marginTop: 3 }}
            >
                Home
            </Button>
        </div>
    );
}

export default JobsPage;

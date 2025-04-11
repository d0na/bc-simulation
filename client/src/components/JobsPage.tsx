import  { useEffect, useState } from 'react';
import axios from 'axios';
import {useNavigate} from "react-router-dom";
import {Button, CircularProgress, Stack, Typography} from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RefreshIcon from '@mui/icons-material/Refresh';
import bcLogo from "../assets/blockchain-10000.svg";

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

    // Effetto per caricare i jobs ogni 15 secondi
    useEffect(() => {
        fetchJobs();  // Carica i jobs al primo caricamento
        const interval = setInterval(fetchJobs, 5000);  // Ricarica ogni 15 secondi

        return () => clearInterval(interval);  // Pulisce l'intervallo al dismontaggio del componente
    }, []);

    return (
        <div>
            <div>
            <div>
                <a href="https://" target="_blank">
                    <img src={bcLogo} className="logo" alt="Blockchain logo"/>
                </a>
            </div>
            {/*<h1>Blockchain Simulation (BC Simulation)</h1>*/}
            </div>
            <h1>Jobs Status</h1>
            {/* Pulsanti */}
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

            {/* Indicazione data refresh */}
            {lastUpdated && (
                <Typography variant="body2" >
                    Ultimo aggiornamento: {lastUpdated}
                </Typography>
            )}

            {/* Loader */}
            {loading && (
                <Stack alignItems="center" marginY={2}>
                    <CircularProgress size={32} />
                </Stack>
            )}

            <table>
                <thead>
                <tr>
                    <th>Job Name</th>
                    <th>Instance ID</th>
                    <th>Execution ID</th>
                    <th>Start Time</th>
                    <th>End Time</th>
                    <th>Status</th>
                    <th>Exit Status</th>
                    <th>Steps</th>
                </tr>
                </thead>
                <tbody>
                {jobs.map((job) => (
                    <tr key={job.jobExecutionId}>
                        <td>{job.jobName}</td>
                        <td>{job.jobInstanceId}</td>
                        <td>{job.jobExecutionId}</td>
                        <td>{new Date(job.startTime).toLocaleString()}</td>
                        <td>{new Date(job.endTime).toLocaleString()}</td>
                        <td>{job.status}</td>
                        <td>{job.exitStatus}</td>
                        <td>
                            <ul>
                                {job.steps.map((step, index) => (
                                    <li key={index}>
                                        {step.stepName}: {step.stepStatus}
                                    </li>
                                ))}
                            </ul>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
            {/* Pulsante per tornare alla home */}
            <Button
                variant="contained"
                color="primary"
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate('/')}
                style={{ marginBottom: '20px' }}
            >
                Home
            </Button>
        </div>
    );
}

export default JobsPage;

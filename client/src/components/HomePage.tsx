import React, {useState,} from 'react';
import {Link} from 'react-router-dom';
import {Box, Button, Collapse, Container, Stack} from '@mui/material';
import bcLogo from '../assets/blockchain-10000.svg';
import '../App.css';
import axios from 'axios';
import SimulationConfiguratorModalForm from "./SimulationConfiguratorModalForm.tsx";
import { ExpandMore, ExpandLess } from '@mui/icons-material';

function HomePage() {
    const [simulationStatus, setSimulationStatus] = useState<string | null>(null);
    const [job1Status, setJob1Status] = useState<string | null>(null);
    const [job2Status, setJob2Status] = useState<string | null>(null);
    const [expanded, setExpanded] = useState(false);

    const toggleExpand = () => {
        setExpanded(!expanded);
    };
    const handleSimulationClick = async () => {
        try {
            // Invia la richiesta al server Spring Boot
            const response = await axios.post('http://localhost:8099/jobs/simulation');

            // Se la simulazione ha successo, salva lo status
            setSimulationStatus(`Simulation started successfully: ${response.status}`);
        } catch (error) {
            console.error('Error during simulation:', error);
            setSimulationStatus('Error occurred while starting simulation');
        }
    };


    const handleJob1Click = async () => {
        try {
            const response = await axios.post('http://localhost:8099/jobs/import-user');
            setJob1Status(`Job started successfully: ${response.status}`);
        } catch (error) {
            console.error('Error during job:', error);
            setJob1Status('Error occurred while starting cleanup job');
        }
    };

    const handleJob2Click = async () => {
        try {
            const response = await axios.post('http://localhost:8099/jobs/hallo');
            setJob2Status(`Job started successfully: ${response.status}`);
        } catch (error) {
            console.error('Error during job:', error);
            setJob2Status('Error occurred while starting report job');
        }
    };



    return (
        <Container>
            <Box textAlign="center" mb={4}>
                <a href="https://" target="_blank" rel="noopener noreferrer">
                    <img src={bcLogo} className="logo" alt="Blockchain logo" style={{ maxWidth: '150px' }} />
                </a>
                <h1>BESE</h1>
                <h1>(Blockchain Event Simulation Engine)</h1>
            </Box>

            <Stack direction="row" spacing={3} justifyContent="center" alignItems="flex-start" sx={{ marginTop: 2 }}>
                <div className="card">
                    <p>Launch your simulation</p>
                    <SimulationConfiguratorModalForm />
                    {job2Status && (
                        <div>
                            <p>Status: {job2Status}</p>
                        </div>
                    )}
                </div>
            </Stack>
            <Stack
                direction="row"
                spacing={3}
                justifyContent="center"
                alignItems="flex-start"
                sx={{
                    marginTop: 2,
                    padding: 2,
                    backgroundColor: 'background.paper',
                    borderRadius: 1,
                    flexWrap: 'wrap'
                }}
            >
                <Link to="/jobs">
                    <Button variant="contained" color="secondary">
                        View Job Statuses
                    </Button>
                </Link>
                <Link to="/results">
                    <Button variant="contained" color="primary">
                        Simulation Results
                    </Button>
                </Link>
                <Link to="/graph">
                    <Button variant="contained" color="primary">
                        Graph configuration
                    </Button>
                </Link>
            </Stack>

            <Box textAlign="center" mt={4}>
                <Button
                    variant="outlined"
                    onClick={toggleExpand}
                    endIcon={expanded ? <ExpandLess /> : <ExpandMore />}
                >
                    {expanded ? 'Hide Options' : 'Show More Options'}
                </Button>
            </Box>

            <Collapse in={expanded}>
                <Stack
                    direction="row"
                    spacing={3}
                    justifyContent="center"
                    alignItems="flex-start"
                    sx={{
                        marginTop: 2,
                        padding: 2,
                        backgroundColor: 'background.paper',
                        borderRadius: 1,
                        flexWrap: 'wrap'
                    }}
                >
                    <Link to="/charts2">
                        <Button variant="contained" color="primary">
                            Charts 2
                        </Button>
                    </Link>
                    <Link to="/charts">
                        <Button variant="contained" color="primary">
                            Create Charts
                        </Button>
                    </Link>
                    <Link to="/test">
                        <Button variant="contained" color="primary">
                            Test
                        </Button>
                    </Link>
                    <Link to="/test1">
                        <Button variant="contained" color="primary">
                            Test1
                        </Button>
                    </Link>
                    <Link to="/test2">
                        <Button variant="contained" color="primary">
                            Test2
                        </Button>
                    </Link>
                    <Link to="/test3">
                        <Button variant="contained" color="primary">
                            Test3
                        </Button>
                    </Link>
                    <Link to="/test4">
                        <Button variant="contained" color="primary">
                            Test4
                        </Button>
                    </Link>
                </Stack>
            </Collapse>
        </Container>
    );
};

export default HomePage;
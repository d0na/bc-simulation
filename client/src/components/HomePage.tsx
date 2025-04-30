import {useState,} from 'react';
import { Link} from 'react-router-dom';
import {Container, Button, Stack} from '@mui/material';
import bcLogo from '../assets/blockchain-10000.svg';
import '../App.css';
import axios from 'axios';
import SimulationConfiguratorModalForm from "./SimulationConfiguratorModalForm.tsx";
import SimulationFormModal from "./SimulationFormModal.tsx";

function HomePage() {
    const [simulationStatus, setSimulationStatus] = useState<string | null>(null);
    const [job1Status, setJob1Status] = useState<string | null>(null);
    const [job2Status, setJob2Status] = useState<string | null>(null);

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
                <div>
                    <a href="https://" target="_blank">
                        <img src={bcLogo} className="logo" alt="Blockchain logo"/>
                    </a>
                </div>
                <h1>Blockchain Simulation Engine</h1>
                <Stack direction="row" spacing={3} justifyContent="center" alignItems="flex-start" sx={{ marginTop: 2 }}>
                    <div className="card">
                        <p>Launch your </p>
                        <Button variant="contained" color="primary" onClick={handleJob1Click}>
                            Job1
                        </Button>
                        {job1Status && (
                            <div>
                                <p>Status: {job1Status}</p>
                            </div>
                        )}
                    </div>

                    <div className="card">
                        <p>Launch your </p>
                        <SimulationFormModal/>
                    </div>

                    <div className="card">
                        <p>Launch your </p>
                        <SimulationConfiguratorModalForm/>
                        {job2Status && (
                            <div>
                                <p>Status: {job2Status}</p>
                            </div>
                        )}
                    </div>

                </Stack>


                <Link to="/jobs">
                    <Button variant="contained" color="secondary" style={{marginTop: '20px'}}>
                        View Job Statuses
                    </Button>
                </Link>
            </Container>
    );
}

export default HomePage;

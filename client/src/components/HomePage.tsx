import {useState,} from 'react';
import { Link} from 'react-router-dom';
import {Container, Button} from '@mui/material';

import bcLogo from '../assets/blockchain-10000.svg';
import '../App.css';
import axios from 'axios';

function HomePage() {
    const [simulationStatus, setSimulationStatus] = useState<string | null>(null);

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

    return (
            <Container>
                <div>
                    <a href="https://" target="_blank">
                        <img src={bcLogo} className="logo" alt="Blockchain logo"/>
                    </a>
                </div>
                <h1>Blockchain Simulation (BC Simulation)</h1>
                <div className="card">
                    <p>Launch your simulation</p>
                    <Button variant="contained" color="primary" onClick={handleSimulationClick}>
                        Simulation
                    </Button>
                    {simulationStatus && (
                        <div>
                            <p>Status: {simulationStatus}</p>
                        </div>
                    )}
                </div>

                <Link to="/jobs">
                    <Button variant="contained" color="secondary" style={{marginTop: '20px'}}>
                        View Job Statuses
                    </Button>
                </Link>
            </Container>
    );
}

export default HomePage;

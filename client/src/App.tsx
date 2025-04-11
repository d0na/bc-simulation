import {Route,  Routes, BrowserRouter as Router} from 'react-router-dom';

import './App.css';
import JobsPage from './components/JobsPage';
import HomePage from './components/HomePage';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<HomePage />} /> {/* Rotta per la pagina di atterraggio */}
                <Route path="/jobs" element={<JobsPage />} /> {/* Rotta per la pagina dei jobs */}
            </Routes>
        </Router>
    )
}

export default App;

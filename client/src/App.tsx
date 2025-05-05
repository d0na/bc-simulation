import {Route,  Routes, BrowserRouter as Router} from 'react-router-dom';

import './App.css';
import JobsPage from './components/JobsPage';
import HomePage from './components/HomePage';
import ResultsPage from './components/ResultsPage';
import ChartPage from "./components/ChartPage.tsx";
import CsvFileDownloadPage from "./components/CsvFileDownloadPage.tsx";
import SimulationColumnSelector from "./components/SimulationColumnSelector.tsx";
import ChartPreviewContainer from "./components/ChartPreviewContainer.tsx";
import DynamicChartConfigurator from "./components/DynamicChartConfigurator.tsx";
import AdvancedChartConfigurator from "./components/AdvancedChartConfigurator.tsx";
import GraphRequestForm from "./components/Graph/GraphRequestForm.tsx";
import GraphRequestOldForm from "./components/GraphRequestForm.tsx";

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<HomePage />} /> {/* Rotta per la pagina di atterraggio */}
                <Route path="/jobs" element={<JobsPage />} /> {/* Rotta per la pagina dei jobs */}
                <Route path="/charts" element={<ChartPage />} /> {/* Rotta per la pagina dei jobs */}
                <Route path="/charts2" element={<ResultsPage />} /> {/* Rotta per la pagina dei jobs */}
                <Route path="/results" element={<CsvFileDownloadPage />} /> {/* Rotta per la pagina dei jobs */}
                <Route path="/test" element={<ChartPreviewContainer />} /> {/* Rotta per la pagina dei jobs */}
                <Route path="/test1" element={<SimulationColumnSelector />} /> {/* Rotta per la pagina dei jobs */}
                <Route path="/test2" element={<DynamicChartConfigurator />} /> {/* Rotta per la pagina dei jobs */}
                <Route path="/test3" element={<AdvancedChartConfigurator />} /> {/* Rotta per la pagina dei jobs */}
                <Route path="/graph" element={<GraphRequestForm/>} /> {/* Rotta per la pagina dei jobs */}
                <Route path="/test4" element={<GraphRequestOldForm/>} /> {/* Rotta per la pagina dei jobs */}
            </Routes>
        </Router>
    )
}

export default App;

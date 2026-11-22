import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import CityDashboard from './pages/CityDashboard';
import ComplaintDetail from './pages/ComplaintDetail';
import CorporatorDashboard from './pages/CorporatorDashboard';
import FilePage from './pages/FilePage';
import ScoreboardPage from './pages/ScoreboardPage';
import TrafficPage from './pages/TrafficPage';
import CrowdIntelPage from './pages/CrowdIntelPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<CityDashboard />} />
          <Route path="file" element={<FilePage />} />
          <Route path="complaints/:id" element={<ComplaintDetail />} />
          <Route path="corporator/:id" element={<CorporatorDashboard />} />
          <Route path="scoreboard" element={<ScoreboardPage />} />
          <Route path="traffic" element={<TrafficPage />} />
          <Route path="crowd-intel" element={<CrowdIntelPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

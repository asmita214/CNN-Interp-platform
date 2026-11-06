import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import Overview from './pages/Overview';
import FeatureAtlas from './pages/FeatureAtlas';
import FeatureDetail from './pages/FeatureDetail';
import Clusters from './pages/Clusters';
import Dataset from './pages/Dataset';
import Settings from './pages/Settings';
import RoadmapPage from './pages/RoadmapPage';
import SaeDashboard from './pages/SaeDashboard';
import Steering from './pages/Steering';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Overview />} />
          <Route path="/atlas" element={<FeatureAtlas />} />
          <Route path="/feature/:featureId" element={<FeatureDetail />} />
          <Route path="/clusters" element={<Clusters />} />
          <Route path="/dataset" element={<Dataset />} />
          <Route path="/sae-dashboard" element={<SaeDashboard />} />
          <Route path="/steering" element={<Steering />} />
          <Route path="/activation-maximization" element={<RoadmapPage type="activation-maximization" />} />
          <Route path="/performance" element={<RoadmapPage type="performance" />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import OrganizationChartPage from './components/OrganizationChartPage';
import AuditTrailSearch from './components/AuditTrailSearch';
import UsersList from './components/UsersList';
import SimulationPage from './components/SimulationPage';
import SettingsPage from './components/SettingsPage';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard/:orgId" element={<Dashboard />} />
          <Route path="/organization-chart/:orgId" element={<OrganizationChartPage />} />
          <Route path="/audit-trail" element={<AuditTrailSearch />} />
          <Route path="/users" element={<UsersList />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/simulation" element={<SimulationPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
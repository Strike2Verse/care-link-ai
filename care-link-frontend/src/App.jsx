import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ScanPillPage from './pages/ScanPill.jsx';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import MedicalVault from './pages/MedicalVault';
import Medications from './pages/Medications';
import DashboardLayout from './components/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminPanel from './pages/AdminPanel';
import ManageFamilyAccess from './pages/ManageFamilyAccess';
import AccessRequests from './pages/AccessRequests';
import SOSEmergency from './pages/SOSEmergency';
import ChatbotLauncher from './components/chatbot/ChatbotLauncher';
import PatientReport from './pages/PatientReport';
import './index.css';

function App() {
  return (
    <Router>
      <ChatbotLauncher />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/report/:patientId" element={<PatientReport />} />

        {/* Protected Dashboard Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="vault" element={<MedicalVault />} />
          <Route path="medications" element={<Medications />} />
          <Route path="admin" element={<AdminPanel />} />
          <Route path="scan" element={<ScanPillPage />} />
          <Route path="family-access" element={<ManageFamilyAccess />} />
          <Route path="access-requests" element={<AccessRequests />} />
          <Route path="sos" element={<SOSEmergency />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;


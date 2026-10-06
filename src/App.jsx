import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PostJob from './pages/PostJob';
import Profile from './pages/Profile';
import Home from './pages/Home';
import ATS from './pages/ATS';
import ApplyJob from './pages/ApplyJob';
import ScheduleInterview from './pages/ScheduleInterview';
import ApplicantDetail from './pages/ApplicantDetail';
import Subscription from './pages/Subscription';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import './App.css';

const MainContent = () => {
  return (
    <main className="main-content">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/company-dashboard" element={<Dashboard />} />
        <Route path="/candidate-dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/post-job" element={<PostJob />} />
        <Route path="/ats" element={<ATS />} />
        {/* Dedicated Executive Pages */}
        <Route path="/apply/:jobId" element={<ApplyJob />} />
        <Route path="/schedule/:jobId" element={<ScheduleInterview />} />
        <Route path="/applicant/:id" element={<ApplicantDetail />} />
        <Route path="/subscription" element={<Subscription />} />
      </Routes>
    </main>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-layout">
          <Navbar />
          <MainContent />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

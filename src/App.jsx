import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PostJob from './pages/PostJob';
import Profile from './pages/Profile';
import Home from './pages/Home';
import ATS from './pages/ATS';
import Global3DBackground from './components/Global3DBackground';
import './App.css';

// Wrapper to conditionally apply layout classes
const MainContent = () => {
  const location = useLocation();
  const fullWidthPaths = ['/', '/dashboard', '/company-dashboard', '/candidate-dashboard', '/ats', '/profile'];
  const isFullWidthPage = fullWidthPaths.includes(location.pathname);

  return (
    <div className={`main-content ${isFullWidthPage ? 'full-width' : ''}`}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/company-dashboard" element={<Dashboard />} />
        <Route path="/candidate-dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/post-job" element={<PostJob />} />
        <Route path="/ats" element={<ATS />} />
      </Routes>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Global3DBackground />
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

import { useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
    const { user, logout, isAuthenticated } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    const fullWidthPaths = ['/', '/dashboard', '/company-dashboard', '/candidate-dashboard', '/ats', '/profile'];
    const isFullWidthPage = fullWidthPaths.includes(location.pathname);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <nav className="navbar">
            <div className={`nav-container ${isFullWidthPage ? 'full-width' : ''}`}>
                <Link to="/" className="nav-brand">SkillSync</Link>
                <ul className="nav-links">
                    {!isAuthenticated && (
                        <li><Link to="/" className="nav-link">Home</Link></li>
                    )}
                    {isAuthenticated ? (
                        <>
                            {user && user.role === 'interviewer' && (
                                <li><Link to="/post-job" className="nav-link">Post Job</Link></li>
                            )}
                            {user && user.role === 'candidate' && (
                                <li><Link to="/ats" className="nav-link">Your ATS</Link></li>
                            )}
                            <li><Link to="/dashboard" className="nav-link">Dashboard</Link></li>
                            <li><Link to="/profile" className="nav-link">Profile</Link></li>
                            <li><button onClick={handleLogout} className="btn-nav btn-outline">Logout</button></li>
                        </>
                    ) : (
                        <>
                            <li><Link to="/login" className="btn-nav btn-primary">Login</Link></li>
                        </>
                    )}
                </ul>
            </div>
        </nav>
    );
};

export default Navbar;

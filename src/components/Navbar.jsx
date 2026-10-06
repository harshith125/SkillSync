import { useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
    const { user, logout, isAuthenticated } = useContext(AuthContext);
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const isActive = (path) => location.pathname === path;

    return (
        <header className="navbar-pro">
            <div className="nav-container-pro">
                {/* Brand / Logo */}
                <Link to="/" className="nav-brand-pro">
                    <span className="brand-icon">⚡</span>
                    <span className="brand-text">SkillSync</span>
                    <span className="brand-badge">PRO</span>
                </Link>

                {/* Navigation Links */}
                <nav className="nav-links-pro">
                    {!isAuthenticated && (
                        <Link to="/" className={`nav-link-pro ${isActive('/') ? 'active' : ''}`}>
                            Home
                        </Link>
                    )}

                    {isAuthenticated && (
                        <>
                            <Link to="/dashboard" className={`nav-link-pro ${isActive('/dashboard') ? 'active' : ''}`}>
                                Dashboard
                            </Link>

                            {user && user.role === 'interviewer' && (
                                <Link to="/post-job" className={`nav-link-pro ${isActive('/post-job') ? 'active' : ''}`}>
                                    Post a Job
                                </Link>
                            )}

                            {user && user.role === 'candidate' && (
                                <Link to="/ats" className={`nav-link-pro ${isActive('/ats') ? 'active' : ''}`}>
                                    ATS Scanner
                                </Link>
                            )}

                            <Link to="/profile" className={`nav-link-pro ${isActive('/profile') ? 'active' : ''}`}>
                                Profile
                            </Link>
                        </>
                    )}
                </nav>

                {/* User / Auth Actions */}
                <div className="nav-actions-pro">
                    {isAuthenticated ? (
                        <div className="user-profile-menu">
                            <span className="role-chip">
                                {user?.role === 'interviewer' ? '🏢 Recruiter' : '🎓 Candidate'}
                            </span>
                            {user?.isPro ? (
                                <span className="badge badge-success" title="SkillSync PRO Active">⭐ PRO</span>
                            ) : user?.role === 'interviewer' ? (
                                <Link to="/subscription" className="badge badge-warning" title="Upgrade to SkillSync PRO">
                                    ⚡ Upgrade
                                </Link>
                            ) : null}
                            <span className="user-name-display">
                                {user?.fullName || user?.companyName || 'User'}
                            </span>
                            <button onClick={handleLogout} className="btn-logout-pro" title="Sign out">
                                Log Out
                            </button>
                        </div>
                    ) : (
                        <div className="guest-actions">
                            <Link to="/login" className="btn-login-pro">
                                Sign In
                            </Link>
                            <Link to="/register" className="btn-register-pro">
                                Get Started
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Navbar;

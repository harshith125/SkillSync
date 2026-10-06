import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import '../styles/Form.css';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);

    const [role, setRole] = useState('candidate'); // 'candidate' or 'interviewer'
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [errorMsg, setErrorMsg] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const { email, password } = formData;

    const onChange = e => setFormData({
        ...formData,
        [e.target.name]: e.target.value
    });

    const onSubmit = async e => {
        e.preventDefault();
        setErrorMsg('');
        setSubmitting(true);
        try {
            const res = await login({ email, password });
            if (res.success) {
                if (res.user.role === 'interviewer') {
                    navigate('/dashboard');
                } else if (res.user.role === 'candidate') {
                    navigate('/dashboard');
                } else {
                    navigate('/dashboard');
                }
            } else {
                setErrorMsg(res.msg || 'Invalid email or password. Please try again.');
            }
        } catch (err) {
            setErrorMsg('Authentication service unavailable. Please check backend connection.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="form-container">
            <h2 className="form-title">Welcome Back</h2>
            <p className="form-subtitle">Sign in to your SkillSync account</p>

            <div className="role-toggle">
                <button
                    type="button"
                    className={`role-btn ${role === 'candidate' ? 'active' : ''}`}
                    onClick={() => setRole('candidate')}
                >
                    🎓 Candidate
                </button>
                <button
                    type="button"
                    className={`role-btn ${role === 'interviewer' ? 'active' : ''}`}
                    onClick={() => setRole('interviewer')}
                >
                    🏢 Recruiter
                </button>
            </div>

            {errorMsg && (
                <div className="auth-error-box">
                    <span>⚠️</span>
                    <div>{errorMsg}</div>
                </div>
            )}

            <form onSubmit={onSubmit}>
                <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                        type="email"
                        name="email"
                        value={email}
                        onChange={onChange}
                        placeholder={role === 'candidate' ? 'name@example.com' : 'recruiter@company.com'}
                        className="form-input"
                        required
                    />
                </div>

                <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <label className="form-label" style={{ marginBottom: 0 }}>Password</label>
                        <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>
                            Forgot password?
                        </Link>
                    </div>
                    <div className="password-input-wrapper">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={password}
                            onChange={onChange}
                            placeholder="••••••••"
                            className="form-input"
                            required
                        />
                        <button
                            type="button"
                            className="password-toggle-btn"
                            onClick={() => setShowPassword(!showPassword)}
                            title={showPassword ? 'Hide password' : 'Show password'}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                            {showPassword ? (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                    <circle cx="12" cy="12" r="3" />
                                </svg>
                            ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                    <line x1="1" y1="1" x2="23" y2="23" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                <button 
                    type="submit" 
                    className="btn-block"
                    disabled={submitting}
                >
                    {submitting ? 'Signing In...' : `Sign In as ${role === 'candidate' ? 'Candidate' : 'Recruiter'}`}
                </button>
            </form>

            <div className="form-footer">
                Don't have an account? <Link to="/register">Create an Account</Link>
            </div>
        </div>
    );
};

export default Login;

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../api';
import '../styles/Form.css';

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();

    const [verifying, setVerifying] = useState(true);
    const [tokenValid, setTokenValid] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        const verifyToken = async () => {
            try {
                setVerifying(true);
                const res = await authAPI.verifyResetToken(token);
                if (res.data?.valid) {
                    setTokenValid(true);
                    if (res.data.email) setUserEmail(res.data.email);
                } else {
                    setTokenValid(false);
                    setErrorMsg(res.data?.msg || 'Password reset link is invalid or expired.');
                }
            } catch (err) {
                setTokenValid(false);
                setErrorMsg(err.response?.data?.msg || 'Password reset link is invalid or has expired.');
            } finally {
                setVerifying(false);
            }
        };

        if (token) {
            verifyToken();
        } else {
            setVerifying(false);
            setTokenValid(false);
            setErrorMsg('No reset token provided.');
        }
    }, [token]);

    const onSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');

        if (password.length < 6) {
            setErrorMsg('Password must be at least 6 characters long.');
            return;
        }

        if (password !== confirmPassword) {
            setErrorMsg('Passwords do not match. Please re-enter.');
            return;
        }

        try {
            setSubmitting(true);
            const res = await authAPI.resetPassword(token, password);
            setSuccessMsg(res.data?.msg || 'Password reset successful! Redirecting to login...');
            setTimeout(() => {
                navigate('/login');
            }, 2500);
        } catch (err) {
            setErrorMsg(err.response?.data?.msg || 'Failed to reset password. The link may have expired.');
        } finally {
            setSubmitting(false);
        }
    };

    if (verifying) {
        return (
            <div className="form-container" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
                    Verifying security token...
                </p>
            </div>
        );
    }

    if (!tokenValid) {
        return (
            <div className="form-container" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>⏰</div>
                <h2 className="form-title" style={{ color: '#dc2626' }}>Link Expired or Invalid</h2>
                <p className="form-subtitle" style={{ marginBottom: '1.5rem' }}>
                    {errorMsg || 'This password reset link is invalid or has already been used.'}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <Link to="/forgot-password" className="btn-block" style={{ textDecoration: 'none', textAlign: 'center', margin: 0 }}>
                        Request New Reset Link
                    </Link>
                    <Link to="/login" style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>
                        Return to Sign In
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="form-container">
            <h2 className="form-title">Create New Password</h2>
            <p className="form-subtitle">
                {userEmail ? `Enter a new password for ${userEmail}` : 'Enter your new secure password'}
            </p>

            {errorMsg && (
                <div className="auth-error-box">
                    <span>⚠️</span>
                    <span>{errorMsg}</span>
                </div>
            )}

            {successMsg ? (
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🎉</div>
                    <h3 style={{ fontSize: '1.1rem', color: '#16a34a', marginBottom: '0.5rem', fontWeight: 600 }}>
                        Password Updated!
                    </h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                        {successMsg}
                    </p>
                    <Link to="/login" className="btn-block" style={{ textDecoration: 'none', textAlign: 'center', display: 'block', margin: 0 }}>
                        Go to Sign In Now →
                    </Link>
                </div>
            ) : (
                <form onSubmit={onSubmit}>
                    <div className="form-group">
                        <label className="form-label">New Password *</label>
                        <div className="password-input-wrapper">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="At least 6 characters"
                                className="form-input"
                                required
                                autoFocus
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

                    <div className="form-group">
                        <label className="form-label">Confirm New Password *</label>
                        <div className="password-input-wrapper">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                name="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Re-enter new password"
                                className="form-input"
                                required
                            />
                            <button
                                type="button"
                                className="password-toggle-btn"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                title={showConfirmPassword ? 'Hide password' : 'Show password'}
                                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                            >
                                {showConfirmPassword ? (
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
                        {submitting ? 'Resetting Password...' : 'Save New Password'}
                    </button>
                </form>
            )}

            <div className="form-footer">
                Back to <Link to="/login">Sign In</Link>
            </div>
        </div>
    );
};

export default ResetPassword;

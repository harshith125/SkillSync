import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../api';
import '../styles/Form.css';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [resetUrl, setResetUrl] = useState('');
    const [emailSent, setEmailSent] = useState(false);

    const onSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');
        setResetUrl('');
        setEmailSent(false);

        if (!email.trim()) {
            setErrorMsg('Please enter your email address.');
            return;
        }

        try {
            setSubmitting(true);
            const res = await authAPI.forgotPassword(email.trim());
            setSuccessMsg(res.data?.msg || 'Password reset link generated!');
            if (res.data?.resetUrl) {
                setResetUrl(res.data.resetUrl);
            }
            if (res.data?.emailSent) {
                setEmailSent(true);
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.msg || 'Could not process reset link. Please check your email.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="form-container">
            <h2 className="form-title">Forgot Password</h2>
            <p className="form-subtitle">
                Enter your registered email address and we'll send you a password reset link.
            </p>

            {errorMsg && (
                <div className="auth-error-box">
                    <span>⚠️</span>
                    <span>{errorMsg}</span>
                </div>
            )}

            {successMsg ? (
                <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
                        {emailSent ? '✉️' : '🔑'}
                    </div>
                    <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.5rem', fontWeight: 600 }}>
                        {emailSent ? 'Check Your Inbox' : 'Reset Link Generated'}
                    </h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                        {successMsg}
                    </p>

                    {!emailSent && resetUrl && (
                        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', marginBottom: '1.25rem', textAlign: 'left' }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.5px' }}>
                                Direct Reset Link:
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#2563eb', wordBreak: 'break-all', background: '#ffffff', padding: '0.5rem 0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1', marginBottom: '0.75rem' }}>
                                {resetUrl}
                            </div>
                            <Link 
                                to={resetUrl.replace(/^https?:\/\/[^/]+/, '')} 
                                className="btn-block" 
                                style={{ textDecoration: 'none', textAlign: 'center', display: 'block', margin: 0, padding: '0.65rem' }}
                            >
                                Proceed to Reset Password →
                            </Link>
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                        <Link to="/login" style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>
                            ← Return to Sign In
                        </Link>
                        <button 
                            type="button" 
                            onClick={() => { setSuccessMsg(''); setErrorMsg(''); setResetUrl(''); }}
                            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.84rem', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                            Try another email address
                        </button>
                    </div>
                </div>
            ) : (
                <form onSubmit={onSubmit}>
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input
                            type="email"
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@example.com"
                            className="form-input"
                            required
                            autoFocus
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="btn-block"
                        disabled={submitting}
                    >
                        {submitting ? 'Sending Reset Link...' : 'Send Password Reset Link'}
                    </button>
                </form>
            )}

            <div className="form-footer">
                Remember your password? <Link to="/login">Sign In</Link>
            </div>
        </div>
    );
};

export default ForgotPassword;

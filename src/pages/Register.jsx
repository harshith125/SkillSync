import { useState, useContext, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import '../styles/Form.css';

const Register = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { register } = useContext(AuthContext);

    const initialRole = searchParams.get('role') || 'candidate';
    const [role, setRole] = useState(initialRole);
    const [errorMsg, setErrorMsg] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (searchParams.get('role')) {
            setRole(searchParams.get('role'));
        }
    }, [searchParams]);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        college: '',
        score: '',
        yearsOfExperience: 0,
        skills: '',
        companyName: '',
        location: '',
        aboutCompany: ''
    });

    const {
        email, password, confirmPassword,
        fullName, college, score, yearsOfExperience,
        skills, companyName, location, aboutCompany
    } = formData;

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        setErrorMsg('');

        if (password !== confirmPassword) {
            setErrorMsg('Passwords do not match. Please re-enter.');
            return;
        }

        if (password.length < 6) {
            setErrorMsg('Password must be at least 6 characters long.');
            return;
        }

        const skillList = typeof skills === 'string'
            ? skills.split(',').map(s => s.trim()).filter(Boolean)
            : [];

        const payload = {
            email,
            password,
            role,
            ...(role === 'candidate' ? {
                fullName,
                college,
                score,
                experience: { years: Number(yearsOfExperience) || 0 },
                skills: skillList
            } : {
                companyName,
                location,
                aboutCompany
            })
        };

        setSubmitting(true);
        try {
            const res = await register(payload);
            if (res.success) {
                navigate('/dashboard');
            } else {
                setErrorMsg(res.msg || 'Registration failed. Please check your information.');
            }
        } catch (err) {
            setErrorMsg('Registration service error. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="form-container" style={{ maxWidth: '540px' }}>
            <h2 className="form-title">Create Account</h2>
            <p className="form-subtitle">Join SkillSync to accelerate your hiring or job discovery</p>

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
                    🏢 Recruiter / Company
                </button>
            </div>

            {errorMsg && (
                <div className="auth-error-box">
                    <span>⚠️</span>
                    <div>{errorMsg}</div>
                </div>
            )}

            <form onSubmit={onSubmit}>
                {role === 'candidate' ? (
                    <>
                        <div className="form-group">
                            <label className="form-label">Full Name *</label>
                            <input
                                type="text"
                                name="fullName"
                                value={fullName}
                                onChange={onChange}
                                placeholder="Jane Doe"
                                className="form-input"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">University / Institution</label>
                            <input
                                type="text"
                                name="college"
                                value={college}
                                onChange={onChange}
                                placeholder="Stanford University"
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Years of Experience</label>
                            <input
                                type="number"
                                name="yearsOfExperience"
                                min="0"
                                max="30"
                                value={yearsOfExperience}
                                onChange={onChange}
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Skills (Comma Separated)</label>
                            <input
                                type="text"
                                name="skills"
                                value={skills}
                                onChange={onChange}
                                placeholder="React, Python, Node.js, AWS"
                                className="form-input"
                            />
                        </div>
                    </>
                ) : (
                    <>
                        <div className="form-group">
                            <label className="form-label">Company / Organization Name *</label>
                            <input
                                type="text"
                                name="companyName"
                                value={companyName}
                                onChange={onChange}
                                placeholder="Acme Technologies Inc."
                                className="form-input"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Headquarters / Location *</label>
                            <input
                                type="text"
                                name="location"
                                value={location}
                                onChange={onChange}
                                placeholder="San Francisco, CA / Remote"
                                className="form-input"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Company Overview</label>
                            <textarea
                                name="aboutCompany"
                                value={aboutCompany}
                                onChange={onChange}
                                placeholder="Brief overview of your company mission and culture..."
                                className="form-textarea"
                                rows={3}
                            />
                        </div>
                    </>
                )}

                <div className="form-group">
                    <label className="form-label">Email Address *</label>
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
                    <label className="form-label">Password *</label>
                    <div className="password-input-wrapper">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={password}
                            onChange={onChange}
                            placeholder="At least 6 characters"
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

                <div className="form-group">
                    <label className="form-label">Confirm Password *</label>
                    <div className="password-input-wrapper">
                        <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            name="confirmPassword"
                            value={confirmPassword}
                            onChange={onChange}
                            placeholder="Re-enter password"
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
                    {submitting ? 'Creating Account...' : `Register as ${role === 'candidate' ? 'Candidate' : 'Recruiter'}`}
                </button>
            </form>

            <div className="form-footer">
                Already registered? <Link to="/login">Sign In to Account</Link>
            </div>
        </div>
    );
};

export default Register;

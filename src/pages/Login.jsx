import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, Environment } from '@react-three/drei';
import AuthContext from '../context/AuthContext';
import '../styles/Form.css';

const LoginVisual3D = ({ color }) => {
    return (
        <Float speed={2} rotationIntensity={1.5} floatIntensity={2}>
            <Sphere args={[1, 64, 64]} scale={2.4}>
                <MeshDistortMaterial
                    color={color}
                    envMapIntensity={0.6}
                    clearcoat={1}
                    clearcoatRoughness={0.1}
                    metalness={0.1}
                    distort={0.4}
                    speed={2}
                />
            </Sphere>
        </Float>
    );
};

const Login = () => {
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);

    // Although the backend doesn't require role for login (email is unique), 
    // the user requested to ask "who is logging in".
    const [role, setRole] = useState('candidate'); // 'candidate' or 'interviewer'

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const { email, password } = formData;

    const [error, setError] = useState('');

    const onChange = e => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (error) setError(''); // Clear error on typing
    };

    const onSubmit = async e => {
        e.preventDefault();
        setError(''); // Clear previous errors
        const res = await login({ email, password });
        if (res.success) {
            if (res.user.role === 'interviewer') {
                navigate('/company-dashboard');
            } else if (res.user.role === 'candidate') {
                navigate('/candidate-dashboard');
            } else {
                navigate('/dashboard');
            }
        } else {
            setError(res.msg); // Set error message
        }
    };

    const isCandidate = role === 'candidate';
    const primaryColor = isCandidate ? '#6366f1' : '#0ea5e9'; // Indigo vs Sky Blue
    const secondaryColor = isCandidate ? '#ec4899' : '#10b981'; // Pink vs Emerald

    return (
        <div style={{ position: 'relative', minHeight: 'calc(100vh - 80px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="form-container"
                style={{
                    perspective: 1000,
                    zIndex: 10,
                    margin: 0,
                    '--primary': primaryColor,
                    '--secondary': secondaryColor,
                    '--primary-hover': isCandidate ? '#4f46e5' : '#0284c7'
                }}
            >
                <div className="form-left" style={{ position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                        <Canvas camera={{ position: [0, 0, 5] }}>
                            <ambientLight intensity={0.5} />
                            <pointLight position={[10, 10, 10]} intensity={1.5} color={primaryColor} />
                            <LoginVisual3D color={primaryColor} />
                            <Environment preset="city" />
                        </Canvas>
                    </div>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <h1 className="visual-title">
                            {isCandidate ? 'Unlock Your\nPotential.' : 'Find Your\nNext Star.'}
                        </h1>
                        <p className="visual-text">
                            {isCandidate
                                ? 'Join thousands of professionals finding their dream jobs through 3D immersive matchmaking.'
                                : 'Connect with top-tier talent using our AI-driven applicant tracking system.'}
                        </p>
                    </div>
                </div>

                <div className="form-right">
                    <h2 className="form-title">
                        {isCandidate ? 'Candidate Portal' : 'Company Access'}
                    </h2>
                    <p className="form-subtitle">Please enter your details to sign in.</p>

                    <div className="role-toggle" style={{ marginBottom: '2rem' }}>
                        <button
                            className={`role-btn ${role === 'candidate' ? 'active' : ''}`}
                            onClick={() => { setRole('candidate'); setError(''); }}
                        >
                            Candidate
                        </button>
                        <button
                            className={`role-btn ${role === 'interviewer' ? 'active' : ''}`}
                            onClick={() => { setRole('interviewer'); setError(''); }}
                        >
                            Company
                        </button>
                    </div>

                    <form onSubmit={onSubmit}>
                        {/* Error Message Display */}
                        {error && (
                            <div style={{
                                background: '#fee2e2',
                                color: '#ef4444',
                                padding: '0.75rem',
                                borderRadius: '8px',
                                marginBottom: '1.5rem',
                                fontSize: '0.9rem',
                                fontWeight: '600',
                                textAlign: 'center',
                                border: '1px solid #fecaca'
                            }}>
                                ⚠️ {error}
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={email}
                                onChange={onChange}
                                className="form-input"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input
                                type="password"
                                name="password"
                                value={password}
                                onChange={onChange}
                                className="form-input"
                                required
                            />
                        </div>
                        <button type="submit" className="btn-block">
                            {isCandidate ? 'Login as Candidate' : 'Login as Company'}
                        </button>

                        <div style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '1.5rem' }}>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>New to SkillSync?</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <Link to="/register?role=candidate" className="btn-outline-glass" style={{ textAlign: 'center' }}>
                                    Join
                                </Link>
                                <Link to="/register?role=interviewer" className="btn-outline-glass" style={{ textAlign: 'center' }}>
                                    Hire
                                </Link>
                            </div>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;

import { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, Environment } from '@react-three/drei';
import AuthContext from '../context/AuthContext';
import '../styles/Form.css';

const RegisterVisual3D = ({ color }) => {
    return (
        <Float speed={2} rotationIntensity={1.5} floatIntensity={2}>
            <Sphere args={[1, 64, 64]} scale={2.2}>
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

const Register = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { register } = useContext(AuthContext);

    // Auto-select role based on URL param
    const initialRole = searchParams.get('role') || 'candidate';
    const [role, setRole] = useState(initialRole);
    const [activeTab, setActiveTab] = useState('personal');

    useEffect(() => {
        if (searchParams.get('role')) {
            setRole(searchParams.get('role'));
        }
    }, [searchParams]);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        // Candidate Fields
        fullName: '',
        college: '',
        score: '',
        yearsOfExperience: 0,
        experienceDescription: '',
        skills: '',
        resume: '',
        linkedin: '',
        // Company Fields
        companyName: '',
        location: '',
        aboutCompany: ''
    });

    const { email, password, confirmPassword, fullName, college, score, yearsOfExperience, experienceDescription, skills, resume, linkedin, companyName, location, aboutCompany } = formData;

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        const payload = {
            email,
            password,
            role,
            ...(role === 'candidate' ? {
                fullName,
                college,
                score,
                experience: { years: yearsOfExperience, description: experienceDescription },
                skills: skills.split(',').map(s => s.trim()),
                resume,
                links: { linkedin }
            } : {
                companyName,
                location,
                aboutCompany
            })
        };

        const res = await register(payload);
        if (res.success) {
            navigate('/dashboard');
        } else {
            alert(res.msg);
        }
    };

    const isCandidate = role === 'candidate';
    const primaryColor = isCandidate ? '#6366f1' : '#0284c7'; // Indigo vs Sky Blue

    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 100, damping: 10 }
        }
    };

    return (
        <div className="register-page">
            <motion.div
                className="form-container"
                style={{ '--primary': primaryColor }}
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                {/* Left Side: Visual Brand */}
                <div className="form-left">
                    {/* 3D Visual Layer */}
                    <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                        <Canvas camera={{ position: [0, 0, 5] }}>
                            <ambientLight intensity={0.5} />
                            <pointLight position={[10, 10, 10]} intensity={1.5} color={primaryColor} />
                            <RegisterVisual3D color={primaryColor} />
                            <Environment preset="city" />
                        </Canvas>
                    </div>

                    {/* 3D Visual Layer */}

                    <motion.div className="visual-content" variants={itemVariants} style={{ zIndex: 1, position: 'relative' }}>
                        <motion.h1 className="visual-title" variants={itemVariants}>
                            {isCandidate ? 'Start Your\nJourney.' : 'Build Your\nDream Team.'}
                        </motion.h1>
                        <motion.p className="visual-text" variants={itemVariants}>
                            {isCandidate
                                ? 'Create an account to unlock AI-powered job matches and showcase your skills in 3D.'
                                : 'Register your company to access top talent and streamline your recruitment process.'}
                        </motion.p>
                    </motion.div>
                </div>

                {/* Right Side: Form */}
                <div className="form-right">
                    <div style={{ maxWidth: '550px', width: '100%', margin: 'auto' }}>
                        <motion.div variants={itemVariants}>
                            <h2 className="form-title">Create Account</h2>
                            <p className="form-subtitle">Enter your details to get started.</p>
                        </motion.div>

                        <motion.div className="role-toggle" variants={itemVariants}>
                            <button
                                className={`role-btn ${role === 'candidate' ? 'active' : ''}`}
                                onClick={() => { setRole('candidate'); setActiveTab('personal'); }}
                            >
                                Candidate
                            </button>
                            <button
                                className={`role-btn ${role === 'interviewer' ? 'active' : ''}`}
                                onClick={() => { setRole('interviewer'); }}
                            >
                                Company
                            </button>
                        </motion.div>

                        {/* Candidate Tabs */}
                        {role === 'candidate' && (
                            <div className="form-tabs">
                                <button type="button" className={`tab-btn ${activeTab === 'personal' ? 'active' : ''}`} onClick={() => setActiveTab('personal')}>
                                    Personal
                                </button>
                                <button type="button" className={`tab-btn ${activeTab === 'education' ? 'active' : ''}`} onClick={() => setActiveTab('education')}>
                                    Education
                                </button>
                                <button type="button" className={`tab-btn ${activeTab === 'skills' ? 'active' : ''}`} onClick={() => setActiveTab('skills')}>
                                    Skills & Exp
                                </button>
                            </div>
                        )}

                        <form onSubmit={onSubmit}>

                            {/* 1. PERSONAL TAB (Or Common for Candidate) */}
                            {(activeTab === 'personal' || role === 'interviewer') && (
                                <motion.div
                                    key="personal-tab"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="form-group">
                                        <label className="form-label">Email Address</label>
                                        <input type="email" name="email" value={email} onChange={onChange} className="form-input" required />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div className="form-group">
                                            <label className="form-label">Password</label>
                                            <input type="password" name="password" value={password} onChange={onChange} className="form-input" required />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Confirm Password</label>
                                            <input type="password" name="confirmPassword" value={confirmPassword} onChange={onChange} className="form-input" required />
                                        </div>
                                    </div>

                                    {role === 'candidate' && (
                                        <>
                                            <div className="form-group">
                                                <label className="form-label">Full Name</label>
                                                <input type="text" name="fullName" value={fullName} onChange={onChange} className="form-input" required />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">LinkedIn Profile</label>
                                                <input type="text" name="linkedin" value={linkedin} onChange={onChange} className="form-input" />
                                            </div>
                                        </>
                                    )}
                                </motion.div>
                            )}


                            {/* 2. EDUCATION TAB */}
                            {role === 'candidate' && activeTab === 'education' && (
                                <motion.div
                                    key="edu-tab"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="form-group">
                                        <label className="form-label">College / University</label>
                                        <input type="text" name="college" value={college} onChange={onChange} className="form-input" required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Score (GPA/%)</label>
                                        <input type="text" name="score" value={score} onChange={onChange} className="form-input" required />
                                    </div>
                                </motion.div>
                            )}

                            {/* 3. SKILLS TAB */}
                            {role === 'candidate' && activeTab === 'skills' && (
                                <motion.div
                                    key="skills-tab"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="form-group">
                                        <label className="form-label">Key Skills (comma separated)</label>
                                        <input type="text" name="skills" value={skills} onChange={onChange} className="form-input" placeholder="React, Node.js, Python" required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Years of Experience</label>
                                        <input type="number" name="yearsOfExperience" value={yearsOfExperience} onChange={onChange} className="form-input" required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Experience Description</label>
                                        <textarea name="experienceDescription" value={experienceDescription} onChange={onChange} className="form-textarea" rows="3"></textarea>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Resume Link</label>
                                        <input type="text" name="resume" value={resume} onChange={onChange} className="form-input" placeholder="GDrive/Dropbox Link" />
                                    </div>
                                </motion.div>
                            )}

                            {/* Company Fields (Always Show if Role is Interviewer) */}
                            {role === 'interviewer' && (
                                <motion.div
                                    key="company-tab"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <div className="form-group">
                                        <label className="form-label">Company Name</label>
                                        <input type="text" name="companyName" value={companyName} onChange={onChange} className="form-input" required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Location</label>
                                        <input type="text" name="location" value={location} onChange={onChange} className="form-input" required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">About Company</label>
                                        <textarea name="aboutCompany" value={aboutCompany} onChange={onChange} className="form-textarea" rows="3"></textarea>
                                    </div>
                                </motion.div>
                            )}

                            {/* Navigation Buttons for Multi-step */}
                            {role === 'candidate' ? (
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                    {activeTab !== 'personal' && (
                                        <button
                                            type="button"
                                            className="btn-block"
                                            style={{ background: '#cbd5e1', color: '#334155' }}
                                            onClick={() => {
                                                if (activeTab === 'skills') setActiveTab('education');
                                                if (activeTab === 'education') setActiveTab('personal');
                                            }}
                                        >
                                            Back
                                        </button>
                                    )}

                                    {activeTab !== 'skills' ? (
                                        <button
                                            type="button"
                                            className="btn-block"
                                            onClick={() => {
                                                if (activeTab === 'personal') setActiveTab('education');
                                                else if (activeTab === 'education') setActiveTab('skills');
                                            }}
                                        >
                                            Next
                                        </button>
                                    ) : (
                                        <button type="submit" className="btn-block">Register</button>
                                    )}
                                </div>
                            ) : (
                                <button type="submit" className="btn-block">Register</button>
                            )}

                            <motion.div className="form-footer" variants={itemVariants}>
                                <p>Already have an account? <Link to="/login" className="form-link">Login here</Link></p>
                            </motion.div>
                        </form>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;

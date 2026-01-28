import { useState, useContext, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { Float, Environment, Sphere, MeshDistortMaterial } from '@react-three/drei';
import AuthContext from '../context/AuthContext';
import './PostJob.css';

const JobVisual3D = () => {
    return (
        <group>
            <Float speed={2} rotationIntensity={1.5} floatIntensity={2}>
                <mesh position={[0, 0, 0]}>
                    <icosahedronGeometry args={[1.8, 0]} />
                    <MeshDistortMaterial color="#a5f3fc" envMapIntensity={0.6} clearcoat={1} clearcoatRoughness={0.1} metalness={0.1} distort={0.3} speed={2} wireframe />
                </mesh>
            </Float>
            <Float speed={3} rotationIntensity={2} floatIntensity={1}>
                <Sphere args={[1, 32, 32]} position={[0, 0, 0]} scale={0.8}>
                    <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.8} transparent opacity={0.6} />
                </Sphere>
            </Float>
        </group>
    );
};

const PostJob = () => {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        requirements: '',
        experienceRequired: 0,
        salary: '',
        location: user?.location || '',
        deadline: ''
    });

    const [showSuccess, setShowSuccess] = useState(false);

    const { title, description, requirements, experienceRequired, salary, location, deadline } = formData;

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/api/jobs', formData);
            setShowSuccess(true);
        } catch (err) {
            console.error(err);
            alert('Error posting job');
        }
    };

    return (
        <div className="post-job-page">
            <motion.div
                className="job-card"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
            >
                {/* Left Side: Visuals */}
                <div className="job-visual">
                    <motion.h1
                        className="visual-title"
                        initial={{ x: -30, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        Find the <br /> <span>Perfect Fit.</span>
                    </motion.h1>
                    <motion.p
                        className="visual-desc"
                        initial={{ x: -30, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                    >
                        Use our AI-driven matching engine to connect with top-tier talent instantly.
                    </motion.p>

                    <div className="model-container">
                        <Canvas camera={{ position: [0, 0, 4] }}>
                            <ambientLight intensity={0.5} />
                            <pointLight position={[10, 10, 10]} intensity={1.5} color="#4f46e5" />
                            <Suspense fallback={null}>
                                <JobVisual3D />
                                <Environment preset="city" />
                            </Suspense>
                        </Canvas>
                    </div>
                </div>

                {/* Right Side: Form */}
                <div className="job-form-section">
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        <h2 className="section-title">Post a New Role</h2>
                        <p className="section-subtitle">Fill in the details to find your next star employee.</p>

                        <form onSubmit={onSubmit} className="form-grid">
                            <div className="form-group-full">
                                <label className="form-label">Job Title</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={title}
                                    onChange={onChange}
                                    className="form-input"
                                    placeholder="e.g. Senior Full Stack Engineer"
                                    required
                                />
                            </div>

                            <div className="form-group-full">
                                <label className="form-label">Job Description</label>
                                <textarea
                                    name="description"
                                    value={description}
                                    onChange={onChange}
                                    className="form-textarea"
                                    rows="4"
                                    required
                                ></textarea>
                            </div>

                            <div className="form-group-full">
                                <label className="form-label">Required Skills (Comma separated)</label>
                                <input
                                    type="text"
                                    name="requirements"
                                    value={requirements}
                                    onChange={onChange}
                                    className="form-input"
                                    placeholder="React, Node.js, AWS, TypeScript"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Min Experience (Years)</label>
                                <input
                                    type="number"
                                    name="experienceRequired"
                                    value={experienceRequired}
                                    onChange={onChange}
                                    className="form-input"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Salary Range</label>
                                <input
                                    type="text"
                                    name="salary"
                                    value={salary}
                                    onChange={onChange}
                                    className="form-input"
                                    placeholder="$120k - $150k"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Location</label>
                                <input
                                    type="text"
                                    name="location"
                                    value={location}
                                    onChange={onChange}
                                    className="form-input"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Application Deadline</label>
                                <input
                                    type="date"
                                    name="deadline"
                                    value={deadline}
                                    onChange={onChange}
                                    className="form-input"
                                    required
                                />
                            </div>

                            <div className="form-group-full" style={{ marginTop: '1rem' }}>
                                <button type="submit" className="btn-submit">
                                    🚀 Launch Job Post
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            </motion.div>

            {/* Success Modal Overlay */}
            {showSuccess && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(5px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        style={{
                            background: 'white',
                            padding: '2.5rem',
                            borderRadius: '24px',
                            textAlign: 'center',
                            maxWidth: '400px',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.2)'
                        }}
                    >
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '0.5rem' }}>Job Posted!</h2>
                        <p style={{ color: '#64748b', marginBottom: '2rem' }}>
                            Your job listing is live. Matching candidates will be notified shortly via email.
                        </p>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="btn-submit"
                            style={{ margin: 0 }}
                        >
                            Back to Dashboard
                        </button>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default PostJob;

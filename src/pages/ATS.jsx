import { useRef, useEffect, useState, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import AtsScanner from '../components/AtsScanner';
import { useDropzone } from 'react-dropzone';
import api from '../api';
import '../styles/Form.css';
import './ATS.css';

const ATS = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [averageScore, setAverageScore] = useState(0);

    // Analysis State
    const [file, setFile] = useState(null);
    const [jobDescription, setJobDescription] = useState('');
    const [analyzing, setAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);

    // Fetch existing application data
    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            const token = localStorage.getItem('token');
            if (token) {
                api.defaults.headers.common['x-auth-token'] = token;
            }
            const res = await api.get('/applications/my');
            setApplications(res.data);

            if (res.data.length > 0) {
                // If we have an analysis result, use that score, otherwise average
                if (!analysisResult) {
                    const total = res.data.reduce((acc, app) => acc + (app.aiScore || 0), 0);
                    setAverageScore(Math.round(total / res.data.length));
                }
            } else {
                if (!analysisResult) setAverageScore(50);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // DROPZONE Logic
    const onDrop = (acceptedFiles) => {
        setFile(acceptedFiles[0]);
    };
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'application/msword': ['.doc']
        },
        maxFiles: 1
    });

    const [error, setError] = useState(null);

    const handleAnalyze = async () => {
        if (!file) return;
        setAnalyzing(true);
        setAnalysisResult(null);
        setError(null);

        const formData = new FormData();
        formData.append('resume', file);
        formData.append('jobDescription', jobDescription);

        try {
            const token = localStorage.getItem('token');
            const res = await api.post('/ats/analyze', formData, {
                headers: {
                    'x-auth-token': token
                }
            });
            setAnalysisResult(res.data);
            setAverageScore(res.data.score); // Update the visual header
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.msg || 'Analysis failed. Ensure the file is valid.';
            setError(msg);
        } finally {
            setAnalyzing(false);
        }
    };

    const appliedCount = applications.filter(a => a.status === 'applied').length;
    const progressCount = applications.filter(a => ['in-progress', 'interview'].includes(a.status)).length;

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <div className="ats-container">
            {/* 3D Header Section */}
            <div className="ats-3d-header">
                <div className="ats-text-content">
                    <motion.h1
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        Your Application <br /> <span className="highlight-text">Intelligence</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        Upload your resume to get a detailed ATS score breakdown.
                    </motion.p>
                </div>

                <div className="ats-visual">
                    <Canvas camera={{ position: [0, 0, 4] }}>
                        <ambientLight intensity={0.5} />
                        <pointLight position={[10, 10, 10]} intensity={1.5} color="#6366f1" />
                        <Suspense fallback={null}>
                            <AtsScanner score={averageScore} />
                        </Suspense>
                        <Environment preset="city" />
                    </Canvas>
                </div>
            </div>

            {/* Analysis Section */}
            <div className="analysis-section-wrapper">
                <div className="upload-card">
                    <h3>🚀 ATS Resume Analyzer</h3>
                    <p className="upload-subtitle">Check if your resume passes the bot screening</p>

                    <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''} ${file ? 'has-file' : ''}`}>
                        <input {...getInputProps()} />
                        {file ? (
                            <div className="file-info">
                                <span className="file-icon">📄</span>
                                <div>
                                    <p className="file-name">{file.name}</p>
                                    <p className="file-size">{(file.size / 1024).toFixed(1)} KB</p>
                                </div>
                            </div>
                        ) : (
                            <div className="drop-placeholder">
                                <span className="upload-icon">☁️</span>
                                <p>Please upload file in the PDF or Word format</p>
                                <span className="btn-browse">Or Click to Browse</span>
                            </div>
                        )}
                    </div>

                    <div className="jd-input-group">
                        <label>Target Job Description (Optional)</label>
                        <textarea
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            placeholder="Paste the job description here for keyword matching..."
                            rows="4"
                        />
                    </div>

                    {error && (
                        <div style={{ color: '#ef4444', marginBottom: '1rem', background: '#fee2e2', padding: '0.5rem', borderRadius: '8px', border: '1px solid #fecaca' }}>
                            ⚠️ {error}
                        </div>
                    )}

                    <button
                        onClick={handleAnalyze}
                        disabled={!file || analyzing}
                        className="btn-analyze"
                    >
                        {analyzing ? 'Scanning...' : 'Analyze My Resume'}
                    </button>
                </div>

                {/* Analysis Results */}
                <AnimatePresence>
                    {analysisResult && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="result-card"
                        >
                            <div className="result-header">
                                <div
                                    className="score-big"
                                    style={{ '--score': analysisResult.score }}
                                >
                                    <div className="score-inner">
                                        <span className="value">{analysisResult.score}</span>
                                        <span className="label">ATS Score</span>
                                    </div>
                                </div>
                                <div className="score-summary">
                                    <h4>{analysisResult.summary}</h4>
                                    <p>Based on keywords, formatting, and sections.</p>
                                </div>
                            </div>

                            <div className="improvements-list">
                                <h4>💡 Improvements Needed</h4>
                                {analysisResult.improvements.length === 0 && <p className="success-text">No critical issues found!</p>}
                                {analysisResult.improvements.map((imp, idx) => (
                                    <div key={idx} className={`improvement-item ${imp.type}`}>
                                        <span className="icon">
                                            {imp.type === 'critical' ? '🔴' : imp.type === 'major' ? '🟠' : '🔵'}
                                        </span>
                                        <p>{imp.text}</p>
                                    </div>
                                ))}
                            </div>

                            {analysisResult.aiDetails && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="ai-detailed-report"
                                >
                                    <div className="report-grid">
                                        <div className="report-col">
                                            <h4 className="strengths-title">✅ Strengths</h4>
                                            <ul>
                                                {analysisResult.aiDetails.strengths.map((s, i) => <li key={i}>{s}</li>)}
                                            </ul>
                                        </div>
                                        <div className="report-col">
                                            <h4 className="weaknesses-title">⚠️ Weaknesses</h4>
                                            <ul>
                                                {analysisResult.aiDetails.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                                            </ul>
                                        </div>
                                    </div>

                                    <div className="suggestions-box">
                                        <h4>🚀 Action Plan</h4>
                                        <div className="suggestions-tags">
                                            {analysisResult.aiDetails.suggestions.map((s, i) => (
                                                <span key={i} className="suggestion-tag">{s}</span>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Application Grid */}
            <div className="ats-grid">
                {/* Status Column: Applied */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="ats-column"
                >
                    <div className="column-header status-applied">
                        <h3>Job History</h3>
                        <span className="count">{appliedCount}</span>
                    </div>
                    <div className="ats-cards-list">
                        {applications.filter(a => a.status === 'applied').length === 0 && (
                            <p className="empty-msg">No active applications.</p>
                        )}
                        {applications.filter(a => a.status === 'applied').map(app => (
                            <div key={app._id} className="ats-card">
                                <h4>{app.job?.title || 'Unknown Job'}</h4>
                                <p className="company">{app.job?.company || 'Unknown Co.'}</p>
                                <div className="card-footer">
                                    <span className="score-badge">Match: {app.aiScore}%</span>
                                    <span className="date">{formatDate(app.appliedAt)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Status Column: In Progress */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="ats-column glass-neon"
                >
                    <div className="column-header status-progress">
                        <h3>Interviews</h3>
                        <span className="count">{progressCount}</span>
                    </div>
                    <div className="ats-cards-list">
                        {applications.filter(a => ['in-progress', 'interview'].includes(a.status)).length === 0 && (
                            <p className="empty-msg">No interviews yet.</p>
                        )}
                        {applications.filter(a => ['in-progress', 'interview'].includes(a.status)).map(app => (
                            <div key={app._id} className="ats-card active-card">
                                <h4>{app.job?.title}</h4>
                                <p className="company">{app.job?.company}</p>
                                <div className="status-badge">{app.status}</div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default ATS;

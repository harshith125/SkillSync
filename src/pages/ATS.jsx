import { useEffect, useState, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import AtsScanner from '../components/AtsScanner';
import { useDropzone } from 'react-dropzone';
import { applicationsAPI, atsAPI } from '../api';
import './ATS.css';

const ATS = () => {
    const [applications, setApplications] = useState([]);
    const [averageScore, setAverageScore] = useState(0);

    // Analysis State
    const [file, setFile] = useState(null);
    const [jobDescription, setJobDescription] = useState('');
    const [analyzing, setAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            const res = await applicationsAPI.getMyApplications();
            setApplications(res.data);

            if (res.data.length > 0) {
                const total = res.data.reduce((acc, app) => acc + (app.aiScore || 0), 0);
                setAverageScore(Math.round(total / res.data.length));
            } else {
                setAverageScore(72);
            }
        } catch (err) {
            console.warn('Could not fetch candidate applications:', err.message);
            setAverageScore(72);
        }
    };

    const onDrop = (acceptedFiles) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
            setErrorMessage('');
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
        },
        maxFiles: 1
    });

    const handleAnalyze = async () => {
        if (!file) return;
        setAnalyzing(true);
        setAnalysisResult(null);
        setErrorMessage('');

        const formData = new FormData();
        formData.append('resume', file);
        formData.append('jobDescription', jobDescription);

        try {
            const res = await atsAPI.analyze(formData);
            setAnalysisResult(res.data);
            setAverageScore(res.data.score || 85);
        } catch (err) {
            setErrorMessage(err.response?.data?.msg || 'Resume parsing failed. Please verify that the PDF/DOCX file is valid and uncorrupted.');
        } finally {
            setAnalyzing(false);
        }
    };

    return (
        <div className="ats-page-container">
            {/* Header Section */}
            <div className="ats-header-card card-pro">
                <div className="ats-text-content">
                    <span className="badge badge-primary">AI Diagnostic Studio</span>
                    <h1>Resume ATS Scanner & Optimizer</h1>
                    <p>
                        Test your resume against applicant tracking algorithms and target job descriptions. Identify missing keywords, formatting discrepancies, and structural improvements.
                    </p>
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

            {/* Error Message */}
            {errorMessage && (
                <div className="alert-banner-error" style={{ margin: '20px 0' }}>
                    <span>⚠️</span>
                    <div>{errorMessage}</div>
                </div>
            )}

            {/* Two Column Layout: Upload on Left, Results on Right */}
            <div className="ats-workspace-grid">
                {/* Uploader Card */}
                <div className="ats-upload-pane card-pro">
                    <h3>Upload Resume for Diagnostic</h3>
                    <p className="upload-subtitle">Supports PDF and Word (DOCX) formats up to 5MB</p>

                    <div 
                        {...getRootProps()} 
                        className={`ats-dropzone ${isDragActive ? 'active' : ''} ${file ? 'has-file' : ''}`}
                    >
                        <input {...getInputProps()} />
                        {file ? (
                            <div className="file-ready-box">
                                <span className="doc-icon">📄</span>
                                <div className="file-meta-text">
                                    <strong>{file.name}</strong>
                                    <span>{(file.size / 1024).toFixed(1)} KB • Ready for scanning</span>
                                </div>
                                <button 
                                    type="button" 
                                    className="btn-remove-file"
                                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                >
                                    ✕
                                </button>
                            </div>
                        ) : (
                            <div className="ats-drop-prompt">
                                <span className="upload-cloud-icon">☁️</span>
                                <div className="drop-main-text">
                                    <strong>Click to upload</strong> or drag and drop your resume
                                </div>
                                <div className="drop-sub-text">PDF or DOCX (Max 5MB)</div>
                            </div>
                        )}
                    </div>

                    <div className="input-group-pro" style={{ marginTop: '20px' }}>
                        <label className="input-label-pro">
                            <span>Target Role / Job Description (Optional)</span>
                            <span className="label-hint">For keyword matching</span>
                        </label>
                        <textarea
                            className="input-field-pro"
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            placeholder="Paste the target job description or requirements list here to run keyword density & gap analysis..."
                            rows={5}
                        />
                    </div>

                    <button
                        onClick={handleAnalyze}
                        disabled={!file || analyzing}
                        className="btn-primary"
                        style={{ width: '100%', marginTop: '12px' }}
                    >
                        {analyzing ? (
                            <>
                                <span className="spinner-inline"></span>
                                Parsing & Computing Score...
                            </>
                        ) : (
                            '⚡ Run ATS Diagnostic Scan'
                        )}
                    </button>
                </div>

                {/* Results Card */}
                <div className="ats-results-pane card-pro">
                    <h3>Diagnostic Report</h3>
                    {analysisResult ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="analysis-results-content"
                        >
                            <div className="score-summary-strip">
                                <div className="score-badge-circle">
                                    <div className="score-num">{analysisResult.score}%</div>
                                    <div className="score-lbl">ATS Fit</div>
                                </div>
                                <div>
                                    <h4 className="result-headline">
                                        {analysisResult.score >= 80 ? '🎉 Exceptional ATS Compatibility' : analysisResult.score >= 60 ? '👍 Competitive Resume' : '⚠️ Optimization Recommended'}
                                    </h4>
                                    <p className="result-desc">
                                        {analysisResult.score >= 80 
                                            ? 'Your resume possesses strong section hierarchy and matches core job keywords.'
                                            : 'Review the flagged improvements below to elevate keyword density and section structure.'}
                                    </p>
                                </div>
                            </div>

                            {/* Keywords Matched & Missing */}
                            <div className="keywords-grid">
                                {analysisResult.keywords?.matched?.length > 0 && (
                                    <div className="kw-box matched-box">
                                        <h5>✓ Matched Keywords ({analysisResult.keywords.matched.length})</h5>
                                        <div className="kw-tags-wrap">
                                            {analysisResult.keywords.matched.map((kw, i) => (
                                                <span key={i} className="kw-tag matched">{kw}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {analysisResult.keywords?.missing?.length > 0 && (
                                    <div className="kw-box missing-box">
                                        <h5>✕ Missing Target Keywords ({analysisResult.keywords.missing.length})</h5>
                                        <div className="kw-tags-wrap">
                                            {analysisResult.keywords.missing.map((kw, i) => (
                                                <span key={i} className="kw-tag missing">{kw}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Actionable Recommendations */}
                            {analysisResult.improvements?.length > 0 && (
                                <div className="improvements-list-box">
                                    <h5>Actionable Improvements</h5>
                                    <ul>
                                        {analysisResult.improvements.map((imp, idx) => (
                                            <li key={idx} className={`imp-item ${imp.type}`}>
                                                <span className="imp-bullet">👉</span>
                                                <span>{imp.text}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <div className="ats-idle-state">
                            <div style={{ fontSize: '3rem' }}>📄</div>
                            <h4>No scan active</h4>
                            <p>Upload your resume PDF on the left and click "Run ATS Diagnostic Scan" to inspect keyword density and formatting.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ATS;

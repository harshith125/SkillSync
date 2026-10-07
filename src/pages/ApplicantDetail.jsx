import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { applicationsAPI } from '../api';
import './ApplicantDetail.css';

const ApplicantDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const [application, setApplication] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updatingStage, setUpdatingStage] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchApplicant = async () => {
            try {
                setLoading(true);
                const res = await applicationsAPI.getById(id);
                setApplication(res.data);
            } catch (err) {
                setError(err.response?.data?.msg || 'Could not find candidate application details.');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchApplicant();
        }
    }, [id]);

    const handleStageChange = async (newStage) => {
        try {
            setUpdatingStage(true);
            setMessage('');
            setError('');
            const res = await applicationsAPI.updateStage(id, newStage);
            setApplication(res.data.application || { ...application, currentStage: newStage });
            setMessage(`Candidate successfully advanced to stage: "${newStage}". Notification email dispatched.`);
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to update candidate hiring stage.');
        } finally {
            setUpdatingStage(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to remove this application from the pipeline?')) {
            return;
        }

        try {
            setDeleting(true);
            await applicationsAPI.delete(id);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to delete application.');
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="applicant-detail-loading">
                <div className="spinner-ring"></div>
                <p>Loading candidate evaluation dossier...</p>
            </div>
        );
    }

    if (!application && error) {
        return (
            <div className="card-pro" style={{ textAlign: 'center', padding: '40px' }}>
                <h2>Application Not Found</h2>
                <p>{error}</p>
                <Link to="/dashboard" className="btn-secondary" style={{ marginTop: '16px' }}>
                    ← Back to Dashboard
                </Link>
            </div>
        );
    }

    const candidate = application?.candidate;
    const job = application?.job;
    const stagesList = job?.stages && job.stages.length > 0
        ? job.stages
        : ['Applied', 'Orientation / Round 1', 'Technical Assessment', 'HR Interview', 'Selected'];

    const aiScore = application?.aiScore || 0;
    const scoreColor = aiScore >= 80 ? 'emerald' : aiScore >= 60 ? 'amber' : 'rose';

    return (
        <div className="applicant-detail-page">
            {/* Breadcrumbs */}
            <div className="breadcrumb-nav">
                <Link to="/dashboard">Dashboard</Link>
                <span className="breadcrumb-sep">/</span>
                <Link to="/dashboard">Candidates</Link>
                <span className="breadcrumb-sep">/</span>
                <span className="breadcrumb-current">{candidate?.fullName || 'Candidate Profile'}</span>
            </div>

            {/* Page Header Strip */}
            <div className="applicant-header-card card-pro">
                <div className="candidate-primary-meta">
                    <div className="candidate-big-avatar">
                        {(candidate?.fullName || 'C').charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div className="candidate-headline">
                            <h1>{candidate?.fullName || 'Anonymous Candidate'}</h1>
                            <span className={`badge badge-${scoreColor}`}>
                                {aiScore}% Match Score
                            </span>
                        </div>
                        <div className="candidate-submeta">
                            <span>📧 {candidate?.email}</span>
                            {candidate?.mobile && <span>📱 {candidate.mobile}</span>}
                            <span>🎯 Applied for: <strong>{job?.title}</strong></span>
                        </div>
                    </div>
                </div>

                {/* Recruiter Quick Actions */}
                {user?.role === 'interviewer' && (
                    <div className="header-action-group">
                        <Link 
                            to={`/schedule/${job?._id}?applicantId=${application._id}`}
                            className="btn-primary"
                        >
                            📅 Schedule Interview
                        </Link>
                        <button 
                            onClick={handleDelete} 
                            className="btn-danger" 
                            disabled={deleting}
                        >
                            {deleting ? 'Removing...' : 'Delete Application'}
                        </button>
                    </div>
                )}
            </div>

            {/* Alert Messages */}
            {message && (
                <div className="alert-banner-success" style={{ marginTop: '16px' }}>
                    <span>✅</span>
                    <div>{message}</div>
                </div>
            )}
            {error && (
                <div className="alert-banner-error" style={{ marginTop: '16px' }}>
                    <span>⚠️</span>
                    <div>{error}</div>
                </div>
            )}

            {/* Two Column Layout */}
            <div className="applicant-content-grid">
                {/* Left Column: AI Evaluation & Fit Report */}
                <div className="dossier-left-pane">
                    {/* Stage Advancement Control (Recruiter only) */}
                    {user?.role === 'interviewer' && (
                        <div className="card-pro stage-controller-card">
                            <div className="stage-controller-header">
                                <div>
                                    <h3>Hiring Stage Management</h3>
                                    <p>Select stage to advance candidate. Automatically updates pipeline and notifies candidate.</p>
                                </div>
                                <span className="badge badge-info">Current: {application?.currentStage}</span>
                            </div>

                            <div className="stages-pills-selector">
                                {stagesList.map((stg, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        className={`stage-pill-btn ${application?.currentStage === stg ? 'active' : ''}`}
                                        onClick={() => handleStageChange(stg)}
                                        disabled={updatingStage || application?.currentStage === stg}
                                    >
                                        <span className="stage-num">{i + 1}</span>
                                        <span>{stg}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Gemini AI Screening Report */}
                    <div className="card-pro ai-dossier-card">
                        <div className="ai-report-top">
                            <div>
                                <h3>Gemini AI Fit Evaluation</h3>
                                <p>Deep automated assessment against job description and required competencies.</p>
                            </div>
                            <div className={`ai-score-donut ${scoreColor}`}>
                                <div className="donut-value">{aiScore}%</div>
                                <div className="donut-label">Fit Score</div>
                            </div>
                        </div>

                        {/* Summary */}
                        {application?.aiSummary && (
                            <div className="ai-summary-block">
                                <h4>Executive Fit Summary</h4>
                                <p>{application.aiSummary}</p>
                            </div>
                        )}

                        {/* Strengths & Weaknesses */}
                        <div className="sw-grid">
                            <div className="sw-column strengths-col">
                                <h4>Key Strengths</h4>
                                <ul>
                                    {(application?.aiStrengths || ['Solid alignment with required core qualifications']).map((str, idx) => (
                                        <li key={idx}>✓ {str}</li>
                                    ))}
                                </ul>
                            </div>
                            <div className="sw-column weaknesses-col">
                                <h4>Gaps & Notes</h4>
                                <ul>
                                    {(application?.aiWeaknesses || ['Further depth can be assessed in technical interview']).map((weak, idx) => (
                                        <li key={idx}>• {weak}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Candidate Submitted Projects & Experience */}
                    {(application?.relevantProjects || application?.relevantExperience) && (
                        <div className="card-pro" style={{ marginTop: '20px' }}>
                            <h3>Application Notes & Experience</h3>
                            {application.relevantExperience && (
                                <div style={{ marginBottom: '16px' }}>
                                    <h4 style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Relevant Experience Highlights</h4>
                                    <p style={{ marginTop: '4px', whiteSpace: 'pre-line' }}>{application.relevantExperience}</p>
                                </div>
                            )}
                            {application.relevantProjects && (
                                <div>
                                    <h4 style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Portfolio & Project Links</h4>
                                    <p style={{ marginTop: '4px', whiteSpace: 'pre-line' }}>{application.relevantProjects}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Column: Candidate Profile & Resume */}
                <div className="dossier-right-pane">
                    {/* Resume Card */}
                    <div className="card-pro resume-preview-card">
                        <h3>Resume & Documents</h3>
                        {application?.customResume || candidate?.resume ? (
                            <div className="resume-download-box">
                                <div className="doc-icon">📄</div>
                                <div className="doc-info">
                                    <div className="doc-name">Candidate Resume (PDF/DOC)</div>
                                    <div className="doc-hint">Uploaded during application submission</div>
                                </div>
                                <a 
                                    href={application.customResume || candidate.resume}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-primary btn-sm"
                                >
                                    View / Download PDF
                                </a>
                            </div>
                        ) : (
                            <div className="no-resume-box">
                                No custom resume PDF attached to this application.
                            </div>
                        )}
                    </div>

                    {/* Candidate Profile Details */}
                    <div className="card-pro" style={{ marginTop: '20px' }}>
                        <h3>Candidate Background</h3>
                        <div className="candidate-info-list">
                            <div className="info-row">
                                <span className="info-label">Experience:</span>
                                <span className="info-val">{candidate?.experience ? `${candidate.experience} years` : 'Not specified'}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Education:</span>
                                <span className="info-val">{candidate?.education || 'Not specified'}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Applied Date:</span>
                                <span className="info-val">{new Date(application.appliedAt).toLocaleDateString()}</span>
                            </div>
                        </div>

                        {/* Candidate Skills */}
                        {candidate?.skills && candidate.skills.length > 0 && (
                            <div className="candidate-skills-wrap" style={{ marginTop: '16px' }}>
                                <h4>Tagged Candidate Skills</h4>
                                <div className="skill-tags-wrap" style={{ marginTop: '8px' }}>
                                    {candidate.skills.map((sk, idx) => (
                                        <span key={idx} className="skill-tag-item">{sk}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApplicantDetail;

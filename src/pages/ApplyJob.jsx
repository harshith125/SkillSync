import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { jobsAPI, applicationsAPI } from '../api';
import './ApplyJob.css';

const ApplyJob = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const [job, setJob] = useState(null);
    const [loadingJob, setLoadingJob] = useState(true);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Application Form State
    const [relevantProjects, setRelevantProjects] = useState('');
    const [relevantExperience, setRelevantExperience] = useState('');
    const [resumeFile, setResumeFile] = useState(null);
    const [dragActive, setDragActive] = useState(false);

    useEffect(() => {
        const fetchJob = async () => {
            try {
                setLoadingJob(true);
                const res = await jobsAPI.getById(jobId);
                setJob(res.data);
            } catch (err) {
                setError(err.response?.data?.msg || 'Failed to load job details. The job may no longer exist.');
            } finally {
                setLoadingJob(false);
            }
        };

        if (jobId) {
            fetchJob();
        }
    }, [jobId]);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                setError('Resume file must be under 10MB.');
                return;
            }
            setResumeFile(file);
            setError('');
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                setError('Resume file must be under 10MB.');
                return;
            }
            setResumeFile(file);
            setError('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!resumeFile && !user?.resume) {
            setError('Please upload your resume (PDF or DOCX) to proceed with AI screening.');
            return;
        }

        try {
            setSubmitting(true);
            setError('');

            const formData = new FormData();
            if (resumeFile) {
                formData.append('resume', resumeFile);
            }
            formData.append('relevantProjects', relevantProjects);
            formData.append('relevantExperience', relevantExperience);

            await applicationsAPI.apply(jobId, formData);

            setSuccessMessage('Your application was submitted successfully! Our Gemini AI screening engine has analyzed your profile.');
            setTimeout(() => {
                navigate('/dashboard');
            }, 2500);
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to submit application. Please verify details and try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loadingJob) {
        return (
            <div className="apply-loading-container">
                <div className="spinner-ring"></div>
                <p>Loading position specifications...</p>
            </div>
        );
    }

    if (!job && error) {
        return (
            <div className="apply-error-container card-pro">
                <h2>Position Unavailable</h2>
                <p>{error}</p>
                <Link to="/dashboard" className="btn-secondary" style={{ marginTop: '16px' }}>
                    ← Back to Job Listings
                </Link>
            </div>
        );
    }

    return (
        <div className="apply-page-container">
            {/* Breadcrumb Navigation */}
            <div className="breadcrumb-nav">
                <Link to="/dashboard">Dashboard</Link>
                <span className="breadcrumb-sep">/</span>
                <Link to="/dashboard">Job Openings</Link>
                <span className="breadcrumb-sep">/</span>
                <span className="breadcrumb-current">{job?.title || 'Apply'}</span>
            </div>

            {/* Split Page Layout */}
            <div className="apply-split-grid">
                {/* Left Column: Job Overview */}
                <div className="job-overview-pane card-pro">
                    <div className="company-badge-header">
                        <div className="company-initial-badge">
                            {(job?.companyName || 'C').charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div className="company-name">{job?.companyName || 'Verified Partner'}</div>
                            <h1 className="job-heading-title">{job?.title}</h1>
                        </div>
                    </div>

                    <div className="job-key-meta-pills">
                        <div className="meta-pill">
                            <span className="meta-icon">📍</span>
                            <span>{job?.location || 'Remote / Hybrid'}</span>
                        </div>
                        {job?.salary && (
                            <div className="meta-pill">
                                <span className="meta-icon">💰</span>
                                <span>{job.salary}</span>
                            </div>
                        )}
                        <div className="meta-pill">
                            <span className="meta-icon">⏱️</span>
                            <span>{job?.experienceRequired ? `${job.experienceRequired}+ Yrs Exp` : 'Open Experience'}</span>
                        </div>
                        {job?.deadline && (
                            <div className="meta-pill highlight">
                                <span className="meta-icon">📅</span>
                                <span>Deadline: {new Date(job.deadline).toLocaleDateString()}</span>
                            </div>
                        )}
                    </div>

                    <div className="section-divider"></div>

                    {/* Hiring Stages Pipeline Preview */}
                    <div className="stages-preview-box">
                        <div className="stages-title">Hiring Process Stages</div>
                        <div className="stages-timeline">
                            {(job?.stages && job.stages.length > 0 ? job.stages : ['Applied', 'Assessment', 'Interview', 'Decision']).map((stage, idx) => (
                                <div key={idx} className="timeline-step">
                                    <div className="step-circle">{idx + 1}</div>
                                    <div className="step-label">{stage}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="section-divider"></div>

                    {/* Job Description */}
                    <div className="job-description-content">
                        <h3>About the Role</h3>
                        <p>{job?.description}</p>
                    </div>

                    {/* Requirements Tags */}
                    {job?.requirements && job.requirements.length > 0 && (
                        <div className="job-requirements-tags">
                            <h3>Key Skill Requirements</h3>
                            <div className="skill-tags-wrap">
                                {job.requirements.map((req, i) => (
                                    <span key={i} className="skill-tag-item">{req}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Application Form */}
                <div className="application-form-pane card-pro">
                    <div className="form-header-pro">
                        <h2>Submit Your Candidacy</h2>
                        <p>Complete the profile below. Your resume is evaluated in real-time by our Gemini AI ATS screening model.</p>
                    </div>

                    {error && (
                        <div className="alert-banner-error">
                            <span>⚠️</span>
                            <div>{error}</div>
                        </div>
                    )}

                    {successMessage && (
                        <div className="alert-banner-success">
                            <span>✅</span>
                            <div>{successMessage}</div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="apply-actual-form">
                        {/* Candidate Summary (Auto-populated from Auth) */}
                        <div className="applicant-id-strip">
                            <div className="applicant-avatar">
                                {(user?.fullName || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div className="applicant-id-info">
                                <div className="applicant-name">{user?.fullName || 'Candidate'}</div>
                                <div className="applicant-email">{user?.email}</div>
                            </div>
                            <span className="badge badge-info">Logged In</span>
                        </div>

                        {/* Resume Upload Area */}
                        <div className="input-group-pro">
                            <label className="input-label-pro">
                                <span>Curriculum Vitae / Resume (PDF or DOCX) *</span>
                                <span className="label-hint">Max 10MB</span>
                            </label>

                            <div 
                                className={`dropzone-upload-box ${dragActive ? 'drag-active' : ''} ${resumeFile ? 'has-file' : ''}`}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                            >
                                <input 
                                    type="file" 
                                    id="resume-file-input"
                                    accept=".pdf,.doc,.docx"
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                />

                                {resumeFile ? (
                                    <div className="uploaded-file-card">
                                        <div className="file-icon-wrap">📄</div>
                                        <div className="file-details">
                                            <div className="file-name">{resumeFile.name}</div>
                                            <div className="file-meta">{(resumeFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for AI screening</div>
                                        </div>
                                        <button 
                                            type="button" 
                                            className="btn-remove-file"
                                            onClick={() => setResumeFile(null)}
                                            title="Remove File"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ) : (
                                    <label htmlFor="resume-file-input" className="dropzone-label-content">
                                        <div className="upload-arrow-circle">☁️</div>
                                        <div className="upload-prompt-text">
                                            <strong>Click to upload</strong> or drag and drop your resume
                                        </div>
                                        <div className="upload-subtext">PDF, DOC, or DOCX up to 10MB</div>
                                        {user?.resume && (
                                            <div className="existing-resume-note">
                                                Note: Leave empty to use your existing profile resume.
                                            </div>
                                        )}
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* Relevant Experience */}
                        <div className="input-group-pro">
                            <label htmlFor="relevantExperience" className="input-label-pro">
                                Relevant Work Experience & Achievements
                            </label>
                            <textarea 
                                id="relevantExperience"
                                className="input-field-pro"
                                placeholder="Highlight roles, key metrics, technologies, or achievements most relevant to this position..."
                                value={relevantExperience}
                                onChange={(e) => setRelevantExperience(e.target.value)}
                                rows={3}
                            />
                        </div>

                        {/* Relevant Projects */}
                        <div className="input-group-pro">
                            <label htmlFor="relevantProjects" className="input-label-pro">
                                Key Projects or Portfolio Highlights
                            </label>
                            <textarea 
                                id="relevantProjects"
                                className="input-field-pro"
                                placeholder="List links to GitHub repos, deployed projects, case studies, or design portfolios..."
                                value={relevantProjects}
                                onChange={(e) => setRelevantProjects(e.target.value)}
                                rows={3}
                            />
                        </div>

                        {/* Actions */}
                        <div className="form-action-bar">
                            <Link to="/dashboard" className="btn-secondary">
                                Cancel
                            </Link>
                            <button 
                                type="submit" 
                                className="btn-primary" 
                                disabled={submitting || !!successMessage}
                            >
                                {submitting ? (
                                    <>
                                        <span className="spinner-inline"></span>
                                        Screening & Submitting...
                                    </>
                                ) : (
                                    'Submit Application'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ApplyJob;

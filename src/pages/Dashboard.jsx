import { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { jobsAPI, applicationsAPI, googleAPI } from '../api';
import './Dashboard.css';

const Dashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [jobs, setJobs] = useState([]);
    const [myApplications, setMyApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionMsg, setActionMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    // Recruiter-specific state
    const [jobFilterTab, setJobFilterTab] = useState('all'); // 'all' | 'active' | 'closed'
    const [selectedJobId, setSelectedJobId] = useState(null);
    const [selectedJob, setSelectedJob] = useState(null);
    const [candidates, setCandidates] = useState([]);
    const [loadingCandidates, setLoadingCandidates] = useState(false);
    const [stageFilter, setStageFilter] = useState('All');
    const [googleStatus, setGoogleStatus] = useState({ connected: false, googleEmail: null });
    const [connectingGoogle, setConnectingGoogle] = useState(false);

    // Candidate-specific state
    const [searchQuery, setSearchQuery] = useState('');
    const [candidateTab, setCandidateTab] = useState('browse'); // 'browse' | 'applications'

    // Initial Load
    useEffect(() => {
        if (!user) return;
        loadDashboardData();
        if (user.role === 'interviewer') {
            loadGoogleStatus();
        }
    }, [user]);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            setErrorMsg('');
            if (user?.role === 'interviewer') {
                const res = await jobsAPI.getMyJobs();
                const jobList = Array.isArray(res.data) ? res.data : [];
                setJobs(jobList);
                if (jobList.length > 0 && !selectedJobId) {
                    selectJobForCandidates(jobList[0]._id, jobList[0]);
                }
            } else {
                const [jobsRes, appsRes] = await Promise.all([
                    jobsAPI.getAll(),
                    applicationsAPI.getMyApplications().catch(() => ({ data: [] }))
                ]);
                setJobs(Array.isArray(jobsRes.data) ? jobsRes.data : []);
                setMyApplications(Array.isArray(appsRes.data) ? appsRes.data : []);
            }
        } catch (err) {
            setErrorMsg('Unable to retrieve dashboard information. Please verify your connection.');
        } finally {
            setLoading(false);
        }
    };

    const loadGoogleStatus = async () => {
        try {
            const res = await googleAPI.getStatus();
            setGoogleStatus(res.data);
        } catch (err) {
            console.warn('[Google Status Error]:', err.message);
        }
    };

    // Recruiter: Select job to view applicants
    const selectJobForCandidates = async (jobId, jobObj) => {
        setSelectedJobId(jobId);
        setSelectedJob(jobObj);
        setStageFilter('All');
        try {
            setLoadingCandidates(true);
            const res = await applicationsAPI.getByJob(jobId);
            setCandidates(res.data.applications || []);
            if (res.data.job) {
                setSelectedJob(res.data.job);
            }
        } catch (err) {
            console.error('Error loading candidates:', err);
        } finally {
            setLoadingCandidates(false);
        }
    };

    // Recruiter: Connect Google Calendar via OAuth (PRO Feature)
    const handleConnectGoogle = async () => {
        if (!user?.isPro) {
            navigate('/subscription');
            return;
        }
        try {
            setConnectingGoogle(true);
            const res = await googleAPI.getAuthUrl();
            if (res.data?.url) {
                window.location.href = res.data.url;
            }
        } catch (err) {
            if (err.response?.status === 403 || err.response?.data?.requiresPro) {
                navigate('/subscription');
            } else {
                setErrorMsg('Failed to initiate Google authorization.');
            }
            setConnectingGoogle(false);
        }
    };

    // Recruiter: Disconnect Google Calendar
    const handleDisconnectGoogle = async () => {
        if (!window.confirm('Disconnect your Google account from SkillSync?')) return;
        try {
            await googleAPI.disconnect();
            setGoogleStatus({ connected: false, googleEmail: null });
            setActionMsg('Google Calendar disconnected successfully.');
        } catch (err) {
            setErrorMsg('Failed to disconnect Google Calendar.');
        }
    };

    // Recruiter: Toggle Job Status (active / closed) via PATCH
    const handleToggleJobStatus = async (jobId, currentStatus) => {
        const nextStatus = currentStatus === 'active' ? 'closed' : 'active';
        try {
            await jobsAPI.patchStatus(jobId, nextStatus);
            setJobs(jobs.map(j => j._id === jobId ? { ...j, status: nextStatus } : j));
            if (selectedJob && selectedJob._id === jobId) {
                setSelectedJob({ ...selectedJob, status: nextStatus });
            }
            setActionMsg(`Job status updated to "${nextStatus}".`);
        } catch (err) {
            setErrorMsg(err.response?.data?.msg || 'Failed to update job status.');
        }
    };

    // Recruiter: Close Job & Send Leaderboard via PUT
    const handleCloseJobAndEmail = async (jobId) => {
        if (!window.confirm('Close this job posting and send candidate ranking report to your email?')) return;
        try {
            const res = await jobsAPI.close(jobId);
            setJobs(jobs.map(j => j._id === jobId ? { ...j, status: 'closed' } : j));
            if (selectedJob && selectedJob._id === jobId) {
                setSelectedJob({ ...selectedJob, status: 'closed' });
            }
            setActionMsg(res.data?.msg || 'Job closed. Leaderboard report emailed.');
        } catch (err) {
            setErrorMsg(err.response?.data?.msg || 'Failed to close job.');
        }
    };

    // Recruiter: Delete Job via DELETE
    const handleDeleteJob = async (jobId) => {
        if (!window.confirm('Permanently delete this job and all its candidate records?')) return;
        try {
            await jobsAPI.delete(jobId);
            const remaining = jobs.filter(j => j._id !== jobId);
            setJobs(remaining);
            if (selectedJobId === jobId) {
                if (remaining.length > 0) {
                    selectJobForCandidates(remaining[0]._id, remaining[0]);
                } else {
                    setSelectedJobId(null);
                    setSelectedJob(null);
                    setCandidates([]);
                }
            }
            setActionMsg('Job posting deleted successfully.');
        } catch (err) {
            setErrorMsg(err.response?.data?.msg || 'Failed to delete job.');
        }
    };

    // Recruiter: Update Candidate Stage via PATCH
    const handleUpdateCandidateStage = async (appId, newStage) => {
        try {
            await applicationsAPI.updateStage(appId, newStage);
            setCandidates(candidates.map(c => c._id === appId ? { ...c, currentStage: newStage } : c));
            setActionMsg(`Candidate moved to stage "${newStage}".`);
        } catch (err) {
            setErrorMsg(err.response?.data?.msg || 'Failed to update candidate stage.');
        }
    };

    // Candidate: Withdraw Application via DELETE
    const handleWithdrawApplication = async (appId) => {
        if (!window.confirm('Are you sure you want to withdraw your application?')) return;
        try {
            await applicationsAPI.delete(appId);
            setMyApplications(myApplications.filter(a => a._id !== appId));
            setActionMsg('Application withdrawn successfully.');
        } catch (err) {
            setErrorMsg(err.response?.data?.msg || 'Failed to withdraw application.');
        }
    };

    // Filter jobs for Recruiter tab
    const filteredRecruiterJobs = jobs.filter(j => {
        if (jobFilterTab === 'active') return j.status === 'active';
        if (jobFilterTab === 'closed') return j.status === 'closed';
        return true;
    });

    // Filter candidates for Recruiter
    const filteredCandidates = stageFilter === 'All'
        ? candidates
        : candidates.filter(c => c.currentStage === stageFilter);

    // Filter jobs for Candidate
    const filteredCandidateJobs = jobs.filter(j => {
        const q = searchQuery.toLowerCase();
        return (
            j.title?.toLowerCase().includes(q) ||
            j.companyName?.toLowerCase().includes(q) ||
            j.location?.toLowerCase().includes(q) ||
            (j.requirements && j.requirements.some(r => r.toLowerCase().includes(q)))
        );
    });

    if (loading) {
        return (
            <div className="dashboard-loading-state">
                <div className="spinner-ring"></div>
                <p>Loading enterprise workspace...</p>
            </div>
        );
    }

    return (
        <div className="dashboard-pro-container">
            {/* Top Workspace Header */}
            <div className="page-header-pro">
                <div className="page-title-wrap">
                    <h1>
                        {user?.role === 'interviewer'
                            ? `Recruiter Operations — ${user.companyName || 'Talent Hub'}`
                            : `Candidate Career Dashboard`}
                    </h1>
                    <div className="page-subtitle">
                        {user?.role === 'interviewer'
                            ? 'Manage postings, track dynamic hiring pipelines, review AI candidate screening, and schedule Google Meet sessions.'
                            : 'Explore open roles, track live application stages, and optimize your profile for automated ATS screening.'}
                    </div>
                </div>

                <div className="header-action-group">
                    {user?.role === 'interviewer' ? (
                        <>
                            <Link to="/post-job" className="btn-primary">
                                + Create New Position
                            </Link>
                            {selectedJobId && (
                                <Link to={`/schedule/${selectedJobId}`} className="btn-secondary">
                                    📅 Schedule Session
                                </Link>
                            )}
                        </>
                    ) : (
                        <Link to="/ats" className="btn-primary">
                            ⚡ AI Resume Optimizer
                        </Link>
                    )}
                </div>
            </div>

            {/* Notification & Error Banners */}
            {actionMsg && (
                <div className="alert-banner-success">
                    <span>✅</span>
                    <div>{actionMsg}</div>
                    <button className="banner-close-btn" onClick={() => setActionMsg('')}>✕</button>
                </div>
            )}
            {errorMsg && (
                <div className="alert-banner-error">
                    <span>⚠️</span>
                    <div>{errorMsg}</div>
                    <button className="banner-close-btn" onClick={() => setErrorMsg('')}>✕</button>
                </div>
            )}

            {/* =========================================================================
                RECRUITER WORKSPACE
               ========================================================================= */}
            {user?.role === 'interviewer' && (
                <>
                    {/* Top KPI Metrics Row */}
                    <div className="metrics-grid-pro">
                        <div className="metric-card-pro">
                            <div className="metric-header">
                                <span className="metric-title">Active Positions</span>
                                <div className="metric-icon-wrap">💼</div>
                            </div>
                            <div className="metric-value">
                                {jobs.filter(j => j.status === 'active').length}
                            </div>
                            <div className="metric-caption">{jobs.length} total postings created</div>
                        </div>

                        <div className="metric-card-pro">
                            <div className="metric-header">
                                <span className="metric-title">Total Applicants</span>
                                <div className="metric-icon-wrap">👥</div>
                            </div>
                            <div className="metric-value">
                                {jobs.reduce((acc, j) => acc + (j.totalApplicants || 0), 0)}
                            </div>
                            <div className="metric-caption">Processed across all active pipelines</div>
                        </div>

                        <div className="metric-card-pro">
                            <div className="metric-header">
                                <span className="metric-title">Google Calendar</span>
                                <div className="metric-icon-wrap">
                                    {googleStatus.connected ? '🟢' : '⚪'}
                                </div>
                            </div>
                            <div className="metric-value" style={{ fontSize: '1.25rem' }}>
                                {googleStatus.connected ? 'Active Sync' : 'Not Connected'}
                            </div>
                            <div className="metric-caption">
                                {googleStatus.connected ? googleStatus.googleEmail : 'Connect to automate Meet links'}
                            </div>
                        </div>

                        <div className="metric-card-pro">
                            <div className="metric-header">
                                <span className="metric-title">Scheduled Sessions</span>
                                <div className="metric-icon-wrap">🎥</div>
                            </div>
                            <div className="metric-value">
                                {jobs.reduce((acc, j) => acc + (j.scheduledMeets?.length || 0), 0)}
                            </div>
                            <div className="metric-caption">Google Meet interview meetings</div>
                        </div>
                    </div>

                    {/* Google OAuth Banner if not connected */}
                    {!googleStatus.connected && (
                        <div className="google-connect-banner card-pro">
                            <div className="banner-left">
                                <span className="banner-icon">📅</span>
                                <div>
                                    <div className="banner-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span>Connect Google Calendar for Automated Video Interviews</span>
                                        {!user?.isPro ? (
                                            <span className="badge badge-warning">PRO FEATURE</span>
                                        ) : (
                                            <span className="badge badge-success">⭐ PRO ACTIVE</span>
                                        )}
                                    </div>
                                    <div className="banner-desc">
                                        Enable SkillSync to automatically create Google Calendar events with one-click Google Meet video links when scheduling rounds.
                                    </div>
                                </div>
                            </div>
                            {user?.isPro ? (
                                <button 
                                    className="btn-primary" 
                                    onClick={handleConnectGoogle}
                                    disabled={connectingGoogle}
                                >
                                    {connectingGoogle ? 'Redirecting to Google...' : 'Connect Google Calendar'}
                                </button>
                            ) : (
                                <Link to="/subscription" className="btn-primary">
                                    ⭐ Upgrade to PRO (from ₹299)
                                </Link>
                            )}
                        </div>
                    )}

                    {/* Main Two-Column Recruiter Workspace */}
                    <div className="recruiter-workspace-layout">
                        {/* Left Column: Job Openings Panel */}
                        <div className="jobs-panel card-pro">
                            <div className="panel-title-bar">
                                <div>
                                    <h3>Job Openings ({jobs.length})</h3>
                                    <p>Select a job to view ranked candidates and stages.</p>
                                </div>
                            </div>

                            {/* Job Status Filter Tabs */}
                            <div className="filter-tabs-row">
                                <button 
                                    className={`tab-btn ${jobFilterTab === 'all' ? 'active' : ''}`}
                                    onClick={() => setJobFilterTab('all')}
                                >
                                    All ({jobs.length})
                                </button>
                                <button 
                                    className={`tab-btn ${jobFilterTab === 'active' ? 'active' : ''}`}
                                    onClick={() => setJobFilterTab('active')}
                                >
                                    Active ({jobs.filter(j => j.status === 'active').length})
                                </button>
                                <button 
                                    className={`tab-btn ${jobFilterTab === 'closed' ? 'active' : ''}`}
                                    onClick={() => setJobFilterTab('closed')}
                                >
                                    Closed ({jobs.filter(j => j.status === 'closed').length})
                                </button>
                            </div>

                            {/* Job List Cards */}
                            <div className="job-cards-list">
                                {filteredRecruiterJobs.length === 0 ? (
                                    <div className="empty-notice">
                                        <p>No job postings found in this filter.</p>
                                        <Link to="/post-job" className="btn-secondary btn-sm" style={{ marginTop: '10px' }}>
                                            + Create Position
                                        </Link>
                                    </div>
                                ) : (
                                    filteredRecruiterJobs.map(job => (
                                        <div 
                                            key={job._id}
                                            className={`job-item-card ${selectedJobId === job._id ? 'selected' : ''}`}
                                            onClick={() => selectJobForCandidates(job._id, job)}
                                        >
                                            <div className="job-card-top">
                                                <h4 className="job-item-title">{job.title}</h4>
                                                <span className={`badge ${job.status === 'active' ? 'badge-active' : 'badge-warning'}`}>
                                                    {job.status}
                                                </span>
                                            </div>

                                            <div className="job-item-meta">
                                                <span>📍 {job.location || 'Remote'}</span>
                                                <span>👥 {job.totalApplicants || 0} Applicants</span>
                                            </div>

                                            <div className="job-card-actions" onClick={(e) => e.stopPropagation()}>
                                                <Link 
                                                    to={`/schedule/${job._id}`}
                                                    className="card-action-btn"
                                                    title="Schedule Session on Dedicated Page"
                                                >
                                                    📅 Schedule
                                                </Link>
                                                {job.status === 'active' && (
                                                    <button 
                                                        className="card-action-btn"
                                                        onClick={() => handleCloseJobAndEmail(job._id)}
                                                        title="Close job and receive candidate leaderboard email"
                                                    >
                                                        🔒 Close
                                                    </button>
                                                )}
                                                <button 
                                                    className="card-action-btn danger"
                                                    onClick={() => handleDeleteJob(job._id)}
                                                    title="Delete Job"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Right Column: Candidate Pipeline & AI Leaderboard */}
                        <div className="candidates-pipeline-panel card-pro">
                            {selectedJob ? (
                                <>
                                    <div className="pipeline-header-bar">
                                        <div>
                                            <div className="badge-line">
                                                <span className={`badge ${selectedJob.status === 'active' ? 'badge-active' : 'badge-warning'}`}>
                                                    {selectedJob.status}
                                                </span>
                                                {selectedJob.deadline && (
                                                    <span className="deadline-tag">
                                                        Deadline: {new Date(selectedJob.deadline).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                            <h2>{selectedJob.title} — Candidate Roster</h2>
                                            <p className="pipeline-subtitle">
                                                Candidates automatically ranked by Gemini AI ATS fit score.
                                            </p>
                                        </div>

                                        <div className="pipeline-cta-group">
                                            <Link 
                                                to={`/schedule/${selectedJob._id}`}
                                                className="btn-primary btn-sm"
                                            >
                                                📅 Schedule Session (Dedicated Page)
                                            </Link>
                                        </div>
                                    </div>

                                    {/* Stage Filter Chips */}
                                    <div className="stages-chip-row">
                                        <button 
                                            className={`stage-chip ${stageFilter === 'All' ? 'active' : ''}`}
                                            onClick={() => setStageFilter('All')}
                                        >
                                            All Candidates ({candidates.length})
                                        </button>
                                        {(selectedJob.stages || ['Applied', 'Round 1', 'Technical', 'HR', 'Selected']).map((stg, i) => {
                                            const count = candidates.filter(c => c.currentStage === stg).length;
                                            return (
                                                <button 
                                                    key={i}
                                                    className={`stage-chip ${stageFilter === stg ? 'active' : ''}`}
                                                    onClick={() => setStageFilter(stg)}
                                                >
                                                    {stg} ({count})
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Candidates Table / Roster */}
                                    {loadingCandidates ? (
                                        <div className="pipeline-loading">
                                            <div className="spinner-ring"></div>
                                            <p>Retrieving AI-ranked candidate scores...</p>
                                        </div>
                                    ) : filteredCandidates.length === 0 ? (
                                        <div className="empty-candidates-notice">
                                            <div style={{ fontSize: '2.5rem' }}>📋</div>
                                            <h4>No candidates in this stage</h4>
                                            <p>Candidates will appear here as soon as they submit applications.</p>
                                        </div>
                                    ) : (
                                        <div className="candidates-table-wrap">
                                            <table className="enterprise-table">
                                                <thead>
                                                    <tr>
                                                        <th>Rank & Candidate</th>
                                                        <th>Gemini AI Score</th>
                                                        <th>Current Stage</th>
                                                        <th>Advance Stage</th>
                                                        <th>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredCandidates.map((app, index) => {
                                                        const aiScore = app.aiScore || 0;
                                                        const scoreBadge = aiScore >= 80 ? 'badge-success' : aiScore >= 60 ? 'badge-warning' : 'badge-primary';
                                                        return (
                                                            <tr key={app._id}>
                                                                <td>
                                                                    <div className="candidate-cell">
                                                                        <div className="rank-number">#{index + 1}</div>
                                                                        <div className="candidate-cell-avatar">
                                                                            {(app.candidate?.fullName || 'C').charAt(0).toUpperCase()}
                                                                        </div>
                                                                        <div>
                                                                            <Link 
                                                                                to={`/applicant/${app._id}`}
                                                                                className="candidate-cell-name"
                                                                            >
                                                                                {app.candidate?.fullName || 'Anonymous Candidate'}
                                                                            </Link>
                                                                            <div className="candidate-cell-email">{app.candidate?.email}</div>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <span className={`badge ${scoreBadge}`}>
                                                                        {aiScore}% Match
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    <span className="current-stage-pill">
                                                                        {app.currentStage || 'Applied'}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    <select 
                                                                        className="stage-select-dropdown"
                                                                        value={app.currentStage || ''}
                                                                        onChange={(e) => handleUpdateCandidateStage(app._id, e.target.value)}
                                                                    >
                                                                        {(selectedJob.stages || ['Applied', 'Round 1', 'Technical', 'HR', 'Selected']).map((s, idx) => (
                                                                            <option key={idx} value={s}>{s}</option>
                                                                        ))}
                                                                    </select>
                                                                </td>
                                                                <td>
                                                                    <div className="table-actions-cell">
                                                                        <Link 
                                                                            to={`/applicant/${app._id}`}
                                                                            className="btn-secondary btn-sm"
                                                                            title="Open full page dossier with AI report & resume"
                                                                        >
                                                                            Dossier
                                                                        </Link>
                                                                        <Link 
                                                                            to={`/schedule/${selectedJob._id}?applicantId=${app._id}`}
                                                                            className="btn-primary btn-sm"
                                                                            title="Schedule individual interview session"
                                                                        >
                                                                            Meet
                                                                        </Link>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="no-job-selected-view">
                                    <div style={{ fontSize: '3rem' }}>💼</div>
                                    <h3>Select a job opening</h3>
                                    <p>Select a job from the left pane to manage applicant stages and schedule sessions.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* =========================================================================
                CANDIDATE WORKSPACE
               ========================================================================= */}
            {user?.role === 'candidate' && (
                <div className="candidate-workspace-wrap">
                    {/* Candidate KPI Metrics */}
                    <div className="metrics-grid-pro">
                        <div className="metric-card-pro">
                            <div className="metric-header">
                                <span className="metric-title">Applications Submitted</span>
                                <div className="metric-icon-wrap">📤</div>
                            </div>
                            <div className="metric-value">{myApplications.length}</div>
                            <div className="metric-caption">Active in evaluation pipelines</div>
                        </div>

                        <div className="metric-card-pro">
                            <div className="metric-header">
                                <span className="metric-title">Available Positions</span>
                                <div className="metric-icon-wrap">💼</div>
                            </div>
                            <div className="metric-value">{jobs.length}</div>
                            <div className="metric-caption">Matching verified companies</div>
                        </div>

                        <div className="metric-card-pro">
                            <div className="metric-header">
                                <span className="metric-title">Average ATS Score</span>
                                <div className="metric-icon-wrap">⚡</div>
                            </div>
                            <div className="metric-value">
                                {myApplications.length > 0
                                    ? Math.round(myApplications.reduce((acc, a) => acc + (a.aiScore || 0), 0) / myApplications.length)
                                    : '—'}%
                            </div>
                            <div className="metric-caption">Calculated by Gemini AI screening</div>
                        </div>
                    </div>

                    {/* Navigation Tabs for Candidate */}
                    <div className="candidate-tabs-bar">
                        <button 
                            className={`candidate-nav-tab ${candidateTab === 'browse' ? 'active' : ''}`}
                            onClick={() => setCandidateTab('browse')}
                        >
                            🔍 Explore Job Openings ({jobs.length})
                        </button>
                        <button 
                            className={`candidate-nav-tab ${candidateTab === 'applications' ? 'active' : ''}`}
                            onClick={() => setCandidateTab('applications')}
                        >
                            📋 My Applications ({myApplications.length})
                        </button>
                    </div>

                    {/* Tab 1: Browse Jobs */}
                    {candidateTab === 'browse' && (
                        <div className="browse-jobs-section">
                            <div className="search-filter-box card-pro">
                                <input 
                                    type="text"
                                    className="input-field-pro"
                                    placeholder="Search by job title, company, required skill, or location..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <div className="candidate-jobs-grid">
                                {filteredCandidateJobs.length === 0 ? (
                                    <div className="empty-notice card-pro" style={{ gridColumn: '1 / -1' }}>
                                        <p>No job postings match your search query.</p>
                                    </div>
                                ) : (
                                    filteredCandidateJobs.map(job => {
                                        const alreadyApplied = myApplications.some(a => a.job?._id === job._id || a.job === job._id);
                                        return (
                                            <div key={job._id} className="candidate-job-card card-pro">
                                                <div className="job-card-head">
                                                    <div>
                                                        <div className="job-company-badge">{job.companyName || 'Verified Partner'}</div>
                                                        <h3 className="job-role-title">{job.title}</h3>
                                                    </div>
                                                    {job.deadline && (
                                                        <span className="badge badge-warning">
                                                            Due: {new Date(job.deadline).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="job-meta-row">
                                                    <span>📍 {job.location || 'Remote'}</span>
                                                    {job.salary && <span>💰 {job.salary}</span>}
                                                    <span>⏱️ {job.experienceRequired ? `${job.experienceRequired}+ Yrs` : 'Open'}</span>
                                                </div>

                                                <p className="job-snippet-desc">
                                                    {job.description ? job.description.slice(0, 140) + '...' : ''}
                                                </p>

                                                {job.requirements && (
                                                    <div className="job-tags-slice">
                                                        {job.requirements.slice(0, 4).map((r, i) => (
                                                            <span key={i} className="skill-chip">{r}</span>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className="job-card-bottom-cta">
                                                    {alreadyApplied ? (
                                                        <span className="badge badge-success">✓ Applied</span>
                                                    ) : (
                                                        <Link 
                                                            to={`/apply/${job._id}`}
                                                            className="btn-primary"
                                                            style={{ width: '100%' }}
                                                        >
                                                            Apply on Dedicated Page →
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}

                    {/* Tab 2: My Applications */}
                    {candidateTab === 'applications' && (
                        <div className="my-applications-section card-pro">
                            <h3>My Submitted Applications</h3>
                            {myApplications.length === 0 ? (
                                <div className="empty-notice">
                                    <p>You haven't submitted any applications yet.</p>
                                    <button 
                                        className="btn-primary" 
                                        onClick={() => setCandidateTab('browse')}
                                        style={{ marginTop: '12px' }}
                                    >
                                        Browse Open Roles
                                    </button>
                                </div>
                            ) : (
                                <div className="candidates-table-wrap">
                                    <table className="enterprise-table">
                                        <thead>
                                            <tr>
                                                <th>Position & Company</th>
                                                <th>Applied Date</th>
                                                <th>Hiring Stage</th>
                                                <th>AI Fit Score</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {myApplications.map(app => {
                                                const jobInfo = app.job || {};
                                                return (
                                                    <tr key={app._id}>
                                                        <td>
                                                            <strong>{jobInfo.title || 'Position'}</strong>
                                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                                {jobInfo.companyName || 'Company'}
                                                            </div>
                                                        </td>
                                                        <td>{new Date(app.appliedAt).toLocaleDateString()}</td>
                                                        <td>
                                                            <span className="badge badge-info">
                                                                {app.currentStage || 'Applied'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className={`badge ${app.aiScore >= 80 ? 'badge-success' : 'badge-primary'}`}>
                                                                {app.aiScore || 0}%
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <button 
                                                                className="btn-danger btn-sm"
                                                                onClick={() => handleWithdrawApplication(app._id)}
                                                            >
                                                                Withdraw
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Dashboard;

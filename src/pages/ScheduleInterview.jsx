import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { jobsAPI, applicationsAPI, googleAPI } from '../api';
import './ScheduleInterview.css';

const ScheduleInterview = () => {
    const { user } = useContext(AuthContext);
    const { jobId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [job, setJob] = useState(null);
    const [applicants, setApplicants] = useState([]);
    const [googleStatus, setGoogleStatus] = useState({ connected: false, googleEmail: null });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Schedule Form State
    const [meetingTitle, setMeetingTitle] = useState('');
    const [meetingDescription, setMeetingDescription] = useState('');
    const [meetingDate, setMeetingDate] = useState('');
    const [meetingTime, setMeetingTime] = useState('10:00 AM');
    const [selectedStage, setSelectedStage] = useState('All');
    const [selectedCandidateIds, setSelectedCandidateIds] = useState([]);
    const [useGoogleMeet, setUseGoogleMeet] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const [jobRes, appsRes, googleRes] = await Promise.all([
                    jobsAPI.getById(jobId),
                    applicationsAPI.getByJob(jobId).catch(() => ({ data: { applications: [] } })),
                    googleAPI.getStatus().catch(() => ({ data: { connected: false } }))
                ]);

                const jobData = jobRes.data;
                setJob(jobData);
                setApplicants(appsRes.data.applications || []);
                setGoogleStatus(googleRes.data);

                setMeetingTitle(`Interview / Orientation — ${jobData.title}`);

                // Default date to tomorrow
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                setMeetingDate(tomorrow.toISOString().split('T')[0]);

                // Check pre-selected candidate from URL query if any
                const preselectedApplicantId = searchParams.get('applicantId');
                if (preselectedApplicantId) {
                    setSelectedCandidateIds([preselectedApplicantId]);
                }
            } catch (err) {
                setError(err.response?.data?.msg || 'Failed to load scheduling details for this position.');
            } finally {
                setLoading(false);
            }
        };

        if (jobId) {
            loadData();
        }
    }, [jobId, searchParams]);

    // Filter applicants according to selected stage
    const filteredApplicants = selectedStage === 'All'
        ? applicants
        : applicants.filter(app => app.currentStage === selectedStage);

    // Toggle candidate selection
    const toggleCandidate = (id) => {
        if (selectedCandidateIds.includes(id)) {
            setSelectedCandidateIds(selectedCandidateIds.filter(item => item !== id));
        } else {
            setSelectedCandidateIds([...selectedCandidateIds, id]);
        }
    };

    const handleSelectAllInStage = () => {
        const stageIds = filteredApplicants.map(app => app._id);
        const allSelected = stageIds.every(id => selectedCandidateIds.includes(id));
        if (allSelected) {
            setSelectedCandidateIds(selectedCandidateIds.filter(id => !stageIds.includes(id)));
        } else {
            const combined = Array.from(new Set([...selectedCandidateIds, ...stageIds]));
            setSelectedCandidateIds(combined);
        }
    };

    const handleConnectGoogle = async () => {
        try {
            const res = await googleAPI.getAuthUrl();
            if (res.data?.url) {
                window.location.href = res.data.url;
            }
        } catch (err) {
            setError('Could not initialize Google OAuth flow.');
        }
    };

    const handleSubmitSchedule = async (e) => {
        e.preventDefault();

        if (!meetingTitle || !meetingDate || !meetingTime) {
            setError('Meeting title, date, and time are required.');
            return;
        }

        if (filteredApplicants.length === 0) {
            setError(`No candidates found in ${selectedStage === 'All' ? 'the applicant list' : `stage "${selectedStage}"`}.`);
            return;
        }

        try {
            setSubmitting(true);
            setError('');

            const payload = {
                title: meetingTitle,
                description: meetingDescription,
                date: meetingDate,
                time: meetingTime,
                stage: selectedStage
            };

            const res = await jobsAPI.scheduleMeeting(jobId, payload);

            setSuccessMsg(res.data?.msg || 'Interview session successfully scheduled! Google Meet invitations dispatched.');
            setTimeout(() => {
                navigate('/dashboard');
            }, 2500);
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to schedule interview session.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="schedule-loading-view">
                <div className="spinner-ring"></div>
                <p>Loading session studio and candidate roster...</p>
            </div>
        );
    }

    return (
        <div className="schedule-page-container">
            {/* Breadcrumb Navigation */}
            <div className="breadcrumb-nav">
                <Link to="/dashboard">Dashboard</Link>
                <span className="breadcrumb-sep">/</span>
                <Link to="/dashboard">Jobs</Link>
                <span className="breadcrumb-sep">/</span>
                <span className="breadcrumb-current">Schedule Session ({job?.title})</span>
            </div>

            {/* Page Header */}
            <div className="page-header-pro">
                <div className="page-title-wrap">
                    <h1>Schedule Interview Session</h1>
                    <div className="page-subtitle">
                        Create calendar events, generate automated Google Meet video links, and invite shortlisted candidates for <strong>{job?.title}</strong>.
                    </div>
                </div>
                <Link to="/dashboard" className="btn-secondary">
                    ← Back to Dashboard
                </Link>
            </div>

            {/* Alerts */}
            {error && (
                <div className="alert-banner-error">
                    <span>⚠️</span>
                    <div>{error}</div>
                </div>
            )}

            {successMsg && (
                <div className="alert-banner-success">
                    <span>✅</span>
                    <div>{successMsg}</div>
                </div>
            )}

            <div className="schedule-layout-grid">
                {/* Left Column: Scheduling Form */}
                <div className="schedule-form-pane card-pro">
                    <form onSubmit={handleSubmitSchedule}>
                        {/* Google Integration Banner */}
                        <div className={`google-sync-card ${googleStatus.connected ? 'is-connected' : 'is-disconnected'}`}>
                            <div className="sync-icon-circle">
                                {googleStatus.connected ? '🟢' : '⚪'}
                            </div>
                            <div className="sync-text-wrap">
                                <div className="sync-title">
                                    {googleStatus.connected
                                        ? `Google Calendar Connected (${googleStatus.googleEmail})`
                                        : 'Google Calendar Not Connected'}
                                </div>
                                <div className="sync-subtext">
                                    {googleStatus.connected
                                        ? 'Meeting will be synced to your Google Calendar with automated Google Meet video link.'
                                        : 'Connect your Google account for automatic Google Meet link creation and Calendar invites.'}
                                </div>
                            </div>
                            {!googleStatus.connected && (
                                !user?.isPro ? (
                                    <Link to="/subscription" className="btn-primary btn-sm" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                        ⭐ Upgrade to PRO
                                    </Link>
                                ) : (
                                    <button 
                                        type="button" 
                                        className="btn-primary btn-sm"
                                        onClick={handleConnectGoogle}
                                    >
                                        Connect Calendar
                                    </button>
                                )
                            )}
                        </div>

                        {/* Session Title */}
                        <div className="input-group-pro">
                            <label className="input-label-pro">Session / Meeting Title *</label>
                            <input 
                                type="text"
                                className="input-field-pro"
                                value={meetingTitle}
                                onChange={(e) => setMeetingTitle(e.target.value)}
                                placeholder="e.g. Technical Round 1 - Full Stack Developer"
                                required
                            />
                        </div>

                        {/* Stage Selector */}
                        <div className="input-group-pro">
                            <label className="input-label-pro">
                                <span>Target Candidate Stage *</span>
                                <span className="label-hint">Invite candidates in this stage</span>
                            </label>
                            <select 
                                className="input-field-pro"
                                value={selectedStage}
                                onChange={(e) => setSelectedStage(e.target.value)}
                            >
                                <option value="All">All Applicants ({applicants.length} total)</option>
                                {(job?.stages || []).map((stage, idx) => {
                                    const count = applicants.filter(a => a.currentStage === stage).length;
                                    return (
                                        <option key={idx} value={stage}>
                                            {stage} ({count} candidates)
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        {/* Date and Time Grid */}
                        <div className="form-two-col">
                            <div className="input-group-pro">
                                <label className="input-label-pro">Date *</label>
                                <input 
                                    type="date"
                                    className="input-field-pro"
                                    value={meetingDate}
                                    onChange={(e) => setMeetingDate(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="input-group-pro">
                                <label className="input-label-pro">Time *</label>
                                <input 
                                    type="text"
                                    className="input-field-pro"
                                    value={meetingTime}
                                    onChange={(e) => setMeetingTime(e.target.value)}
                                    placeholder="10:00 AM"
                                    required
                                />
                            </div>
                        </div>

                        {/* Meeting Agenda / Description */}
                        <div className="input-group-pro">
                            <label className="input-label-pro">Session Agenda & Candidate Instructions</label>
                            <textarea 
                                className="input-field-pro"
                                value={meetingDescription}
                                onChange={(e) => setMeetingDescription(e.target.value)}
                                placeholder="Share the agenda, preparation materials, or interview format with the candidates..."
                                rows={4}
                            />
                        </div>

                        {/* Options Checkboxes */}
                        <div className="options-checkbox-group">
                            <label className="checkbox-row">
                                <input 
                                    type="checkbox" 
                                    checked={useGoogleMeet}
                                    onChange={(e) => setUseGoogleMeet(e.target.checked)}
                                />
                                <span>Auto-generate Google Meet conference link</span>
                            </label>
                        </div>

                        {/* Form Submit Bar */}
                        <div className="schedule-action-bar">
                            <Link to="/dashboard" className="btn-secondary">
                                Cancel
                            </Link>
                            <button 
                                type="submit" 
                                className="btn-primary" 
                                disabled={submitting || !!successMsg}
                            >
                                {submitting ? (
                                    <>
                                        <span className="spinner-inline"></span>
                                        Scheduling & Dispathing Invites...
                                    </>
                                ) : (
                                    `Schedule & Invite (${filteredApplicants.length} Candidates)`
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Right Column: Candidate Roster in Selected Stage */}
                <div className="schedule-roster-pane card-pro">
                    <div className="roster-header">
                        <div>
                            <h3>Attendee Roster ({filteredApplicants.length})</h3>
                            <p className="roster-subtitle">Stage: <strong>{selectedStage}</strong></p>
                        </div>
                        {filteredApplicants.length > 0 && (
                            <button 
                                type="button" 
                                className="btn-secondary btn-sm"
                                onClick={handleSelectAllInStage}
                            >
                                Select All
                            </button>
                        )}
                    </div>

                    <div className="roster-list-scroll">
                        {filteredApplicants.length === 0 ? (
                            <div className="roster-empty-state">
                                <div>👥</div>
                                <p>No candidates currently in stage "<strong>{selectedStage}</strong>".</p>
                                <span>Move candidates into this stage from the Leaderboard or select "All Applicants".</span>
                            </div>
                        ) : (
                            filteredApplicants.map((app) => (
                                <div 
                                    key={app._id} 
                                    className={`roster-candidate-card ${selectedCandidateIds.includes(app._id) ? 'selected' : ''}`}
                                    onClick={() => toggleCandidate(app._id)}
                                >
                                    <input 
                                        type="checkbox"
                                        checked={selectedCandidateIds.includes(app._id)}
                                        onChange={() => {}} // handled by parent onClick
                                    />
                                    <div className="roster-candidate-info">
                                        <div className="candidate-name-row">
                                            <span className="roster-name">{app.candidate?.fullName || 'Anonymous Candidate'}</span>
                                            {app.aiScore !== undefined && (
                                                <span className={`badge ${app.aiScore >= 80 ? 'badge-success' : app.aiScore >= 60 ? 'badge-warning' : 'badge-primary'}`}>
                                                    {app.aiScore}% Match
                                                </span>
                                            )}
                                        </div>
                                        <div className="roster-email">{app.candidate?.email}</div>
                                        <div className="roster-stage-chip">Current: {app.currentStage}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Past Meetings for this Job */}
                    {job?.scheduledMeets && job.scheduledMeets.length > 0 && (
                        <div className="past-sessions-box">
                            <h4>Past Scheduled Sessions ({job.scheduledMeets.length})</h4>
                            <div className="past-sessions-list">
                                {job.scheduledMeets.map((m, idx) => (
                                    <div key={idx} className="past-meet-item">
                                        <div className="meet-info-line">
                                            <strong>{m.title}</strong>
                                            <span className="meet-time-pill">{m.date ? new Date(m.date).toLocaleDateString() : ''} at {m.time}</span>
                                        </div>
                                        <div className="meet-link-row">
                                            <a href={m.meetLink} target="_blank" rel="noopener noreferrer" className="meet-join-link">
                                                🔗 Open Meet Link
                                            </a>
                                            <span className="badge badge-info">{m.recipientsCount || 0} Invited</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ScheduleInterview;

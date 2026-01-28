import { useContext, useEffect, useState, Suspense } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { Float, Environment, MeshDistortMaterial, Icosahedron } from '@react-three/drei';
import AuthContext from '../context/AuthContext';
import './Dashboard.css';

const DashboardVisual3D = () => {
    return (
        <Float speed={2} rotationIntensity={1} floatIntensity={1}>
            <Icosahedron args={[1, 1]} scale={2}>
                <MeshDistortMaterial
                    color="#6366f1"
                    speed={2}
                    distort={0.4}
                    radius={1}
                    metalness={0.5}
                    roughness={0.2}
                />
            </Icosahedron>
        </Float>
    );
};

const Dashboard = () => {
    const { user } = useContext(AuthContext);
    const [jobs, setJobs] = useState([]);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);

    // State for Company View
    const [activeJobId, setActiveJobId] = useState(null);
    const [jobCandidates, setJobCandidates] = useState([]);
    const [loadingCandidates, setLoadingCandidates] = useState(false);

    // Smart Apply State
    const [selectedJobForApply, setSelectedJobForApply] = useState(null);
    const [applyFormData, setApplyFormData] = useState({
        relevantProjects: '',
        relevantExperience: '',
        resume: null
    });

    // Fetch Jobs & Applications
    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                const token = localStorage.getItem('token');
                const config = { headers: { 'x-auth-token': token } };

                const jobsEndpoint = user.role === 'interviewer'
                    ? '/jobs/my-jobs'
                    : '/jobs';

                // Parallel fetch
                const [jobsRes, appsRes] = await Promise.all([
                    api.get(jobsEndpoint, config),
                    user.role === 'candidate' ? api.get('/applications/my', config) : Promise.resolve({ data: [] })
                ]);

                // Ensure data is array
                setJobs(Array.isArray(jobsRes.data) ? jobsRes.data : []);
                if (appsRes.data) setApplications(Array.isArray(appsRes.data) ? appsRes.data : []);
            } catch (err) {
                console.error("Dashboard Fetch Error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    // Fetch Candidates when a job is selected
    useEffect(() => {
        if (!activeJobId) return;

        const fetchCandidates = async () => {
            setLoadingCandidates(true);
            try {
                const token = localStorage.getItem('token');
                const res = await api.get(`/applications/job/${activeJobId}`, {
                    headers: { 'x-auth-token': token }
                });
                setJobCandidates(Array.isArray(res.data) ? res.data : []);
            } catch (err) {
                console.error("Fetch candidates failed", err);
            } finally {
                setLoadingCandidates(false);
            }
        };

        fetchCandidates();
    }, [activeJobId]);

    const [isOpenToWork, setIsOpenToWork] = useState(user?.isOpenToWork || false);

    useEffect(() => {
        if (user) setIsOpenToWork(user.isOpenToWork);
    }, [user]);

    const handleToggleWork = async () => {
        const newValue = !isOpenToWork;
        setIsOpenToWork(newValue);
        try {
            const token = localStorage.getItem('token');
            await api.put('/auth/profile', { isOpenToWork: newValue }, {
                headers: { 'x-auth-token': token }
            });
        } catch (err) {
            console.error(err);
            setIsOpenToWork(!newValue);
            alert('Failed to update status');
        }
    };

    // Helper to check match status
    const isJobMatch = (job) => {
        if (!user || !user.skills || !job.requirements) return false;
        const userSkills = user.skills.map(s => typeof s === 'string' ? s.toLowerCase() : '');
        const jobRequirements = Array.isArray(job.requirements) ? job.requirements : [];
        const jobSkills = jobRequirements.map(s => typeof s === 'string' ? s.toLowerCase() : '');
        // Simple overlap check
        return jobSkills.some(skill => userSkills.includes(skill) && skill !== '');
    };

    if (!user) return <div style={{ textAlign: 'center', marginTop: '4rem', color: '#64748b' }}>Loading Workspace...</div>;



    const handleApplyClick = async (job) => {
        const match = isJobMatch(job);
        if (match) {
            // Fast Track Apply
            try {
                const token = localStorage.getItem('token');
                await api.post(`/applications/apply/${job._id}`, {}, {
                    headers: { 'x-auth-token': token }
                });
                alert('Application sent successfully!');
                const res = await api.get('/applications/my', { headers: { 'x-auth-token': token } });
                setApplications(Array.isArray(res.data) ? res.data : []);
            } catch (err) {
                console.error(err);
                alert(err.response?.data?.msg || 'Application failed');
            }
        } else {
            // Open Manual Form
            setSelectedJobForApply(job);
            setApplyFormData({ relevantProjects: '', relevantExperience: '', resume: null });
        }
    };

    const handleApplySubmit = async (e) => {
        e.preventDefault();
        if (!selectedJobForApply) return;

        try {
            const token = localStorage.getItem('token');
            const data = new FormData();
            data.append('relevantProjects', applyFormData.relevantProjects);
            data.append('relevantExperience', applyFormData.relevantExperience);
            if (applyFormData.resume) {
                data.append('resume', applyFormData.resume);
            }

            await api.post(`/applications/apply/${selectedJobForApply._id}`, data, {
                headers: {
                    'x-auth-token': token,
                    'Content-Type': 'multipart/form-data'
                }
            });

            alert('Manual Application sent successfully!');
            setSelectedJobForApply(null); // Close modal
            const res = await api.get('/applications/my', { headers: { 'x-auth-token': token } });
            setApplications(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.msg || 'Application failed');
        }
    };

    const handleShortlist = async (appId) => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { 'x-auth-token': token } };
            await api.put(`/applications/${appId}/status`, { status: 'shortlisted' }, config);

            // Update local state to show shortlisted status
            setJobCandidates(prev => prev.map(app =>
                app._id === appId ? { ...app, status: 'shortlisted' } : app
            ));

            alert('Candidate Shortlisted! An email has been sent.');
        } catch (err) {
            console.error("Shortlisting failed", err);
            alert('Failed to shortlist candidate');
        }
    };

    // Calculate Real Stats
    const totalJobs = jobs.length;
    const myAppsCount = applications.length;

    // Calculate Matches (Robust Safeties)
    const userSkills = (user.skills && Array.isArray(user.skills))
        ? user.skills.map(s => typeof s === 'string' ? s.toLowerCase() : '')
        : [];

    const matchedJobsCount = jobs.filter(job => {
        const jobRequirements = (job.requirements && Array.isArray(job.requirements)) ? job.requirements : [];
        const jobSkills = jobRequirements.map(s => typeof s === 'string' ? s.toLowerCase() : '');
        return jobSkills.some(skill => userSkills.includes(skill) && skill !== '');
    }).length;

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="dashboard-container-pro">
            {/* Professional Header */}
            <div className="dashboard-header-pro">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1 className="welcome-title">
                            Welcome back, <span className="text-gradient">{user.role === 'candidate' ? user.fullName : user.companyName}</span>
                        </h1>
                        <p className="welcome-subtitle">
                            {activeJobId ? 'Reviewing Applicants' : 'Your professional workspace overview.'}
                        </p>
                    </motion.div>

                    <div style={{ width: '200px', height: '150px' }}>
                        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
                            <ambientLight intensity={0.5} />
                            <pointLight position={[10, 10, 10]} intensity={1.5} color="#6366f1" />
                            <Suspense fallback={null}>
                                <DashboardVisual3D />
                                <Environment preset="city" />
                            </Suspense>
                        </Canvas>
                    </div>
                </div>

                {user.role === 'candidate' && (
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleToggleWork}
                        className={`status-toggle-pro ${isOpenToWork ? 'active' : ''}`}
                    >
                        <span className="status-dot"></span>
                        {isOpenToWork ? 'Open to Work' : 'Not Looking'}
                    </motion.button>
                )}

                {user.role === 'interviewer' && !activeJobId && (
                    <Link to="/post-job" className="btn-primary-pro">
                        Post New Job
                    </Link>
                )}
                {user.role === 'interviewer' && activeJobId && (
                    <button onClick={() => setActiveJobId(null)} className="btn-primary-pro" style={{ background: '#64748b', border: 'none', cursor: 'pointer' }}>
                        ← Back to Jobs
                    </button>
                )}
            </div>

            {/* REAL Stats Grid - Hide when viewing candidates */}
            {!activeJobId && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.5 }}
                    className="stats-grid-pro"
                >
                    <div className="stat-card">
                        <div className="stat-icon blue">💼</div>
                        <div className="stat-info">
                            <h3>{totalJobs}</h3>
                            <p>{user.role === 'candidate' ? 'Active Jobs' : 'My Posted Jobs'}</p>
                        </div>
                    </div>

                    {user.role === 'candidate' && (
                        <>
                            <div className="stat-card">
                                <div className="stat-icon green">✨</div>
                                <div className="stat-info">
                                    <h3>{matchedJobsCount}</h3>
                                    <p>Relevant Matches</p>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon purple">🚀</div>
                                <div className="stat-info">
                                    <h3>{myAppsCount}</h3>
                                    <p>Applications</p>
                                </div>
                            </div>
                        </>
                    )}

                    {user.role === 'interviewer' && (
                        <div className="stat-card">
                            <div className="stat-icon purple">👥</div>
                            <div className="stat-info">
                                <h3>--</h3>
                                <p>Total Candidates</p>
                            </div>
                        </div>
                    )}
                </motion.div>
            )}

            <div className="section-divider">
                <h2>
                    {activeJobId
                        ? `Applicants for "${jobs.find(j => j._id === activeJobId)?.title || 'Job'}"`
                        : (user.role === 'candidate' ? 'Recommended Opportunities' : 'Your Job Listings')
                    }
                </h2>
                {user.role === 'candidate' && !activeJobId && (
                    <div className="filter-tabs">
                        <button className="filter-tab active">All</button>
                    </div>
                )}
            </div>

            {/* CANDIDATE VIEW MODE */}
            {activeJobId ? (
                loadingCandidates ? (
                    <div className="loading-state"><div className="spinner"></div><p>Loading Candidates...</p></div>
                ) : (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="jobs-grid-3d"
                    >
                        {jobCandidates.length === 0 ? (
                            <div className="empty-state-3d" style={{ gridColumn: '1/-1', textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>
                                <h3>No Applicants Yet</h3>
                                <p>Candidates will appear here once they apply.</p>
                            </div>
                        ) : (
                            jobCandidates.map(app => (
                                <motion.div
                                    key={app._id}
                                    variants={cardVariants}
                                    whileHover={{ y: -4 }}
                                    className="job-card-3d"
                                    style={{ borderLeft: `4px solid ${app.aiScore >= 80 ? '#22c55e' : '#cbd5e1'}` }}
                                >
                                    <div className="card-content">
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                                            <div style={{
                                                width: '50px', height: '50px', borderRadius: '50%', background: '#f1f5f9',
                                                overflow: 'hidden', border: '2px solid white', boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                                            }}>
                                                {app.candidate?.profilePicture ? (
                                                    <img src={app.candidate.profilePicture} alt="pic" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        onError={e => e.target.style.display = 'none'} />
                                                ) : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>}
                                            </div>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{app.candidate?.fullName}</h3>
                                                    {app.status === 'shortlisted' && (
                                                        <span className="status-pill pill-active" style={{ fontSize: '0.6rem', padding: '0.1rem 0.5rem' }}>Shortlisted</span>
                                                    )}
                                                </div>
                                                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Applied: {new Date(app.appliedAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>

                                        <div className="match-badge" style={{ marginBottom: '1rem' }}>
                                            <span>⚡ {app.aiScore}% Match Score</span>
                                        </div>

                                        <div className="skills-cloud" style={{ marginBottom: '1.5rem' }}>
                                            {app.candidate?.skills && app.candidate.skills.slice(0, 3).map((s, i) => (
                                                <span key={i} className="skill-chip">{s}</span>
                                            ))}
                                        </div>

                                        <div className="action-area">
                                            <a href={app.candidate?.resume} target="_blank" rel="noreferrer" className="btn-apply-3d" style={{ textAlign: 'center', textDecoration: 'none', flex: 1 }}>
                                                View Resume
                                            </a>
                                            <button
                                                className={`btn-apply-3d ${app.status === 'shortlisted' ? '' : 'btn-match'}`}
                                                style={{ marginLeft: '0.5rem', opacity: app.status === 'shortlisted' ? 0.6 : 1 }}
                                                onClick={() => app.status !== 'shortlisted' && handleShortlist(app._id)}
                                                disabled={app.status === 'shortlisted'}
                                            >
                                                {app.status === 'shortlisted' ? 'Shortlisted' : 'Shortlist'}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </motion.div>
                )
            ) : (
                /* NORMAL DASHBOARD VIEW */
                loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Syncing Data...</p>
                    </div>
                ) : (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="jobs-grid-3d"
                    >
                        {jobs.length === 0 ? (
                            <div className="empty-state-3d" style={{ textAlign: 'center', gridColumn: '1/-1', padding: '4rem', color: '#94a3b8' }}>
                                <h3>No Active Jobs Found</h3>
                            </div>
                        ) : (
                            jobs.map(job => {
                                // Client-side match check
                                const jobRequirements = (job.requirements && Array.isArray(job.requirements)) ? job.requirements : [];
                                const jobSkills = jobRequirements.map(s => typeof s === 'string' ? s.toLowerCase() : '');
                                const isMatch = userSkills.some(skill => jobSkills.includes(skill) && skill !== '');

                                // Check if already applied
                                const hasApplied = Array.isArray(applications) && applications.some(app => app.job && app.job._id === job._id);

                                return (
                                    <motion.div
                                        key={job._id}
                                        variants={cardVariants}
                                        whileHover={{ y: -4 }}
                                        className={`job-card-3d ${isMatch ? 'matched-glow' : ''}`}
                                    >
                                        <div className="card-content">
                                            <div className="card-top">
                                                <h3 className="job-title">{job.title}</h3>
                                                <span className={`status-pill pill-${job.status}`}>
                                                    {job.status || 'Active'}
                                                </span>
                                            </div>
                                            <p className="company-name">{job.companyName}</p>

                                            <div className="meta-grid">
                                                <div className="meta-item">
                                                    <span className="icon">📍</span> {job.location}
                                                </div>
                                                <div className="meta-item">
                                                    <span className="icon">💼</span> {job.experienceRequired} Years
                                                </div>
                                                <div className="meta-item full-width">
                                                    <span className="icon">💰</span> {job.salary}
                                                </div>
                                            </div>

                                            <div className="skills-cloud">
                                                {jobRequirements.slice(0, 4).map((skill, index) => (
                                                    <span key={index} className="skill-chip">
                                                        {skill}
                                                    </span>
                                                ))}
                                                {jobRequirements.length > 4 && <span className="skill-chip">+{jobRequirements.length - 4}</span>}
                                            </div>

                                            <div className="action-area">
                                                {user.role === 'candidate' ? (
                                                    <>
                                                        {isMatch && (
                                                            <div className="match-badge">
                                                                <span>✨ Skill Match</span>
                                                            </div>
                                                        )}
                                                        {hasApplied ? (
                                                            <button disabled className="btn-apply-3d" style={{
                                                                opacity: 1,
                                                                cursor: 'default',
                                                                background: applications.find(a => a.job?._id === job._id)?.status === 'shortlisted' ? '#ecfdf5' : '#f1f5f9',
                                                                color: applications.find(a => a.job?._id === job._id)?.status === 'shortlisted' ? '#059669' : '#64748b',
                                                                borderColor: applications.find(a => a.job?._id === job._id)?.status === 'shortlisted' ? '#10b981' : '#cbd5e1'
                                                            }}>
                                                                {applications.find(a => a.job?._id === job._id)?.status.toUpperCase() || 'Applied'}
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleApplyClick(job)}
                                                                className={`btn-apply-3d ${isMatch ? 'btn-match' : ''}`}
                                                            >
                                                                {isMatch ? 'Apply Now' : 'Apply Job'}
                                                            </button>
                                                        )}
                                                    </>
                                                ) : (
                                                    /* INTERVIEWER ACTIONS */
                                                    <button
                                                        className="btn-apply-3d btn-match" style={{ width: '100%' }}
                                                        onClick={() => setActiveJobId(job._id)}
                                                    >
                                                        View Applicants
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </motion.div>
                )
            )}

            {/* MANUAL APPLICATION MODAL */}
            <AnimatePresence>
                {selectedJobForApply && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedJobForApply(null)}
                        style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(5, 15, 30, 0.7)',
                            backdropFilter: 'blur(8px)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            zIndex: 1000
                        }}
                    >
                        <motion.div
                            className="apply-modal"
                            initial={{ scale: 0.9, y: 50, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.9, y: 50, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                                padding: '2.5rem',
                                borderRadius: '24px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
                                width: '90%', maxWidth: '600px',
                                color: 'white',
                                position: 'relative'
                            }}
                        >
                            <button
                                onClick={() => setSelectedJobForApply(null)}
                                style={{
                                    position: 'absolute', top: '20px', right: '20px',
                                    background: 'none', border: 'none', color: '#64748b',
                                    fontSize: '1.5rem', cursor: 'pointer'
                                }}
                            >
                                &times;
                            </button>

                            <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem', background: 'linear-gradient(to right, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                Complete Application
                            </h2>
                            <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
                                This job requires some additional details for consideration.
                            </p>

                            <form onSubmit={handleApplySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontSize: '0.9rem' }}>
                                        Featured Projects (Related to this role)
                                    </label>
                                    <textarea
                                        className="form-input"
                                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', resize: 'vertical' }}
                                        rows="3"
                                        value={applyFormData.relevantProjects}
                                        onChange={(e) => setApplyFormData({ ...applyFormData, relevantProjects: e.target.value })}
                                        placeholder="Describe 1-2 key projects..."
                                        required
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontSize: '0.9rem' }}>
                                        Relevant Experience
                                    </label>
                                    <textarea
                                        className="form-input"
                                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', resize: 'vertical' }}
                                        rows="3"
                                        value={applyFormData.relevantExperience}
                                        onChange={(e) => setApplyFormData({ ...applyFormData, relevantExperience: e.target.value })}
                                        placeholder="Highlight specific experience for this JD..."
                                        required
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontSize: '0.9rem' }}>
                                        Update Resume (Optional)
                                    </label>
                                    <div style={{ position: 'relative', overflow: 'hidden', display: 'inline-block' }}>
                                        <input
                                            type="file"
                                            accept=".pdf,.doc,.docx"
                                            onChange={(e) => setApplyFormData({ ...applyFormData, resume: e.target.files[0] })}
                                            style={{ color: '#cbd5e1' }}
                                        />
                                    </div>
                                    <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                                        If skipped, we will use your profile resume.
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    className="btn-apply-3d btn-match"
                                    style={{ marginTop: '1rem', padding: '1rem', fontSize: '1rem' }}
                                >
                                    Submit Application
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Dashboard;

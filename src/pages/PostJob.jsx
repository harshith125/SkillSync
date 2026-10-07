import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { jobsAPI } from '../api';
import './PostJob.css';

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

    const [stages, setStages] = useState([
        'Applied',
        'Orientation / Round 1',
        'Technical Assessment',
        'HR Interview',
        'Selected'
    ]);
    const [newStageName, setNewStageName] = useState('');
    const [postedJob, setPostedJob] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const { title, description, requirements, experienceRequired, salary, location, deadline } = formData;

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleAddStage = () => {
        if (!newStageName.trim()) return;
        if (stages.includes(newStageName.trim())) {
            setErrorMsg('A stage with this title already exists.');
            return;
        }
        setStages([...stages, newStageName.trim()]);
        setNewStageName('');
        setErrorMsg('');
    };

    const handleRemoveStage = (index) => {
        if (stages.length <= 1) {
            setErrorMsg('A hiring pipeline must retain at least one stage.');
            return;
        }
        setStages(stages.filter((_, i) => i !== index));
    };

    const onSubmit = async e => {
        e.preventDefault();
        setErrorMsg('');

        if (!deadline) {
            setErrorMsg('Application deadline is mandatory.');
            return;
        }

        setSubmitting(true);
        try {
            const res = await jobsAPI.create({
                ...formData,
                stages
            });
            setPostedJob(res.data);
        } catch (err) {
            setErrorMsg(err.response?.data?.msg || 'Error posting job. Please verify required fields.');
        } finally {
            setSubmitting(false);
        }
    };

    const todayStr = new Date().toISOString().split('T')[0];

    // If job successfully posted, show full-page confirmation view (No modal popups!)
    if (postedJob) {
        return (
            <div className="post-job-success-page card-pro">
                <div className="success-icon-badge">🎉</div>
                <h2>Job Opening Successfully Published!</h2>
                <p className="success-desc">
                    <strong>{postedJob.title}</strong> is now live. Candidate applications will be evaluated automatically by our Gemini AI ATS screening model.
                </p>

                <div className="success-meta-card">
                    <div className="meta-item">
                        <span>Company:</span>
                        <strong>{postedJob.companyName || user?.companyName}</strong>
                    </div>
                    <div className="meta-item">
                        <span>Deadline:</span>
                        <strong>{new Date(postedJob.deadline).toLocaleDateString()}</strong>
                    </div>
                    <div className="meta-item">
                        <span>Pipeline Stages:</span>
                        <strong>{stages.length} configured stages</strong>
                    </div>
                </div>

                <div className="success-actions-row">
                    <Link to="/dashboard" className="btn-primary">
                        Go to Dashboard & Pipeline
                    </Link>
                    <button 
                        className="btn-secondary"
                        onClick={() => {
                            setPostedJob(null);
                            setFormData({
                                title: '',
                                description: '',
                                requirements: '',
                                experienceRequired: 0,
                                salary: '',
                                location: user?.location || '',
                                deadline: ''
                            });
                        }}
                    >
                        + Post Another Role
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="post-job-container">
            {/* Breadcrumb Navigation */}
            <div className="breadcrumb-nav">
                <Link to="/dashboard">Dashboard</Link>
                <span className="breadcrumb-sep">/</span>
                <span className="breadcrumb-current">Create Position</span>
            </div>

            <div className="page-header-pro">
                <div className="page-title-wrap">
                    <h1>Create New Position</h1>
                    <div className="page-subtitle">
                        Define job parameters, required competencies, mandatory deadline, and custom hiring stages.
                    </div>
                </div>
                <Link to="/dashboard" className="btn-secondary">
                    ← Cancel
                </Link>
            </div>

            {errorMsg && (
                <div className="alert-banner-error">
                    <span>⚠️</span>
                    <div>{errorMsg}</div>
                </div>
            )}

            <div className="post-job-grid">
                {/* Form Pane */}
                <div className="post-job-form-pane card-pro">
                    <form onSubmit={onSubmit}>
                        {/* Title */}
                        <div className="input-group-pro">
                            <label className="input-label-pro">Position Title *</label>
                            <input 
                                type="text"
                                name="title"
                                className="input-field-pro"
                                placeholder="e.g. Lead Full Stack Engineer"
                                value={title}
                                onChange={onChange}
                                required
                            />
                        </div>

                        {/* Location & Salary */}
                        <div className="form-two-col">
                            <div className="input-group-pro">
                                <label className="input-label-pro">Location / Work Mode *</label>
                                <input 
                                    type="text"
                                    name="location"
                                    className="input-field-pro"
                                    placeholder="e.g. Remote / New York, NY"
                                    value={location}
                                    onChange={onChange}
                                    required
                                />
                            </div>
                            <div className="input-group-pro">
                                <label className="input-label-pro">Compensation Range</label>
                                <input 
                                    type="text"
                                    name="salary"
                                    className="input-field-pro"
                                    placeholder="e.g. $120,000 - $150,000 / yr"
                                    value={salary}
                                    onChange={onChange}
                                />
                            </div>
                        </div>

                        {/* Experience & Mandatory Deadline */}
                        <div className="form-two-col">
                            <div className="input-group-pro">
                                <label className="input-label-pro">Minimum Experience (Years)</label>
                                <input 
                                    type="number"
                                    name="experienceRequired"
                                    min="0"
                                    max="30"
                                    className="input-field-pro"
                                    value={experienceRequired}
                                    onChange={onChange}
                                />
                            </div>
                            <div className="input-group-pro">
                                <label className="input-label-pro">
                                    <span>Application Deadline *</span>
                                    <span className="label-hint">Mandatory</span>
                                </label>
                                <input 
                                    type="date"
                                    name="deadline"
                                    min={todayStr}
                                    className="input-field-pro"
                                    value={deadline}
                                    onChange={onChange}
                                    required
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div className="input-group-pro">
                            <label className="input-label-pro">Role Description & Responsibilities *</label>
                            <textarea 
                                name="description"
                                className="input-field-pro"
                                placeholder="Describe the mission, daily duties, team structure, and impact of this role..."
                                value={description}
                                onChange={onChange}
                                rows={5}
                                required
                            />
                        </div>

                        {/* Requirements */}
                        <div className="input-group-pro">
                            <label className="input-label-pro">
                                <span>Required Skills & Tech Stack</span>
                                <span className="label-hint">Comma separated</span>
                            </label>
                            <input 
                                type="text"
                                name="requirements"
                                className="input-field-pro"
                                placeholder="React, Node.js, TypeScript, PostgreSQL, AWS"
                                value={requirements}
                                onChange={onChange}
                            />
                        </div>

                        {/* Dynamic Hiring Stages Customizer */}
                        <div className="custom-stages-section">
                            <div className="stages-title-bar">
                                <div>
                                    <h4>Custom Hiring Pipeline Stages</h4>
                                    <p>Candidates advance through these stages during the interview lifecycle.</p>
                                </div>
                            </div>

                            <div className="stages-chips-editor">
                                {stages.map((stg, idx) => (
                                    <div key={idx} className="stage-editor-chip">
                                        <span className="stage-idx">{idx + 1}</span>
                                        <span className="stage-name">{stg}</span>
                                        {stages.length > 1 && (
                                            <button 
                                                type="button" 
                                                className="btn-remove-stage"
                                                onClick={() => handleRemoveStage(idx)}
                                                title="Remove stage"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="add-stage-input-row">
                                <input 
                                    type="text"
                                    className="input-field-pro"
                                    placeholder="Add custom stage (e.g. System Design Round)"
                                    value={newStageName}
                                    onChange={(e) => setNewStageName(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddStage(); } }}
                                />
                                <button 
                                    type="button" 
                                    className="btn-secondary"
                                    onClick={handleAddStage}
                                >
                                    + Add Stage
                                </button>
                            </div>
                        </div>

                        {/* Submit Action */}
                        <div className="form-action-bar">
                            <Link to="/dashboard" className="btn-secondary">
                                Cancel
                            </Link>
                            <button 
                                type="submit" 
                                className="btn-primary" 
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <>
                                        <span className="spinner-inline"></span>
                                        Publishing Position...
                                    </>
                                ) : (
                                    '🚀 Publish Position'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PostJob;

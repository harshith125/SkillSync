import { useState, useContext, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import ProfileIdentity from '../components/ProfileIdentity';
import './Profile.css';

const Profile = () => {
    const { user, loadUser } = useContext(AuthContext);

    // Initial state setup for complex object
    const [formData, setFormData] = useState({
        // Basic
        fullName: '',
        companyName: '',
        email: '',
        mobile: '',
        location: '',
        profilePicture: '', // Image URL

        // Education - 10th
        tenthSchool: '',
        tenthScore: '',
        tenthYear: '',
        tenthCert: '',

        // Education - 12th
        twelfthCollege: '',
        twelfthScore: '',
        twelfthYear: '',
        twelfthCert: '',
        twelfthCourse: '',

        // Education - Degree
        degreeName: '',
        degreeCollege: '',
        degreeScore: '',
        degreeYear: '',
        degreeCert: '',
        degreeStatus: 'Completed',

        // Professional
        experienceYears: 0,
        skills: '',
        isOpenToWork: true,

        // Links
        linkedin: '',
        github: '',
        portfolio: '',
        resume: '', // General Resume

        // Company
        aboutCompany: ''
    });

    const [activeTab, setActiveTab] = useState('personal'); // personal, education, professional
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState(null);

    useEffect(() => {
        if (user) {
            setFormData({
                fullName: user.fullName || '',
                companyName: user.companyName || '',
                email: user.email || '',
                mobile: user.mobile || '',
                location: user.location || '',
                profilePicture: user.profilePicture || '',

                // 10th
                tenthSchool: user.education?.tenth?.school || '',
                tenthScore: user.education?.tenth?.score || '',
                tenthYear: user.education?.tenth?.year || '',
                tenthCert: user.education?.tenth?.certificate || '',

                // 12th
                twelfthCollege: user.education?.twelfth?.college || '',
                twelfthScore: user.education?.twelfth?.score || '',
                twelfthYear: user.education?.twelfth?.year || '',
                twelfthCert: user.education?.twelfth?.certificate || '',
                twelfthCourse: user.education?.twelfth?.course || '',

                // Degree
                degreeName: user.education?.degree?.name || '',
                degreeCollege: user.education?.degree?.college || '',
                degreeScore: user.education?.degree?.score || '',
                degreeYear: user.education?.degree?.year || '',
                degreeCert: user.education?.degree?.certificate || '',
                degreeStatus: user.education?.degree?.status || 'Completed',

                experienceYears: user.experience ? user.experience.years : 0,
                skills: user.skills ? user.skills.join(', ') : '',
                aboutCompany: user.aboutCompany || '',
                linkedin: user.links?.linkedin || '',
                github: user.links?.github || '',
                portfolio: user.links?.portfolio || '',
                resume: user.resume || '',
                isOpenToWork: user.isOpenToWork !== undefined ? user.isOpenToWork : true
            });
        }
    }, [user]);

    const onChange = e => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData(prev => ({ ...prev, [e.target.name]: value }));
    };

    const onSubmit = async e => {
        e.preventDefault();
        setLoading(true);
        setMsg(null);

        // Construct Payload
        const payload = {
            mobile: formData.mobile,
            location: formData.location,
            isOpenToWork: formData.isOpenToWork,
            links: {
                linkedin: formData.linkedin,
                github: formData.github,
                portfolio: formData.portfolio
            }
        };

        if (user.role === 'candidate') {
            payload.fullName = formData.fullName;
            payload.experience = { years: formData.experienceYears, description: '' };
            payload.skills = formData.skills.split(',').map(s => s.trim()).filter(s => s);
            payload.resume = formData.resume;

            payload.education = {
                tenth: {
                    school: formData.tenthSchool,
                    score: formData.tenthScore,
                    year: formData.tenthYear,
                    certificate: formData.tenthCert
                },
                twelfth: {
                    college: formData.twelfthCollege,
                    score: formData.twelfthScore,
                    year: formData.twelfthYear,
                    course: formData.twelfthCourse,
                    certificate: formData.twelfthCert
                },
                degree: {
                    name: formData.degreeName,
                    college: formData.degreeCollege,
                    score: formData.degreeScore,
                    year: formData.degreeYear,
                    status: formData.degreeStatus,
                    certificate: formData.degreeCert
                }
            };
        } else {
            payload.companyName = formData.companyName;
            payload.aboutCompany = formData.aboutCompany;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.put('http://localhost:5000/api/auth/profile', payload, {
                headers: { 'x-auth-token': token }
            });
            await loadUser();
            setMsg({ type: 'success', text: 'Profile Updated Successfully!' });
            // window.scrollTo(0, 0); // No need to jump, message is enough
        } catch (err) {
            console.error(err);
            setMsg({ type: 'error', text: err.response?.data?.msg || 'Update failed' });
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('profilePicture', file);

        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await axios.post('http://localhost:5000/api/auth/profile-picture', formData, {
                headers: {
                    'x-auth-token': token
                }
            });

            // Update local state with new image
            setFormData(prev => ({ ...prev, profilePicture: res.data.profilePicture }));
            setMsg({ type: 'success', text: 'Profile Photo Updated!' });
            await loadUser(); // Refresh user context
        } catch (err) {
            console.error(err);
            const errorMsg = err.response?.data?.msg || err.message || 'Image Upload Failed';
            setMsg({ type: 'error', text: errorMsg });
        } finally {
            setLoading(false);
        }
    };

    if (!user) return <div className="loading-spinner">Loading...</div>;

    const tabs = [
        { id: 'personal', label: 'Personal' },
        { id: 'education', label: 'Education' },
        { id: 'professional', label: 'Skills & Exp' }
    ];

    return (
        <div className="profile-wrapper">
            <div className="profile-layout-grid">

                {/* LEFT SIDE: Identity & 3D */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className="identity-section"
                >
                    <div className="identity-card-3d">
                        <div className="scene-container">
                            {formData.profilePicture ? (
                                <img
                                    src={formData.profilePicture}
                                    alt="Profile"
                                    className="profile-pic-static"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = "https://via.placeholder.com/200?text=Error";
                                    }}
                                />
                            ) : (
                                <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
                                    <ambientLight intensity={0.5} />
                                    <pointLight position={[10, 10, 10]} intensity={1.5} color="#ec4899" />
                                    <pointLight position={[-10, -10, -10]} intensity={1} color="#6366f1" />
                                    <Suspense fallback={null}>
                                        <ProfileIdentity picture={null} />
                                    </Suspense>
                                    <Environment preset="city" />
                                </Canvas>
                            )}
                        </div>

                        <div className="profile-upload-btn-wrapper">
                            <label htmlFor="profile-upload" className="upload-label">
                                📷 Choose Photo
                            </label>
                            <input
                                id="profile-upload"
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                style={{ display: 'none' }}
                            />
                        </div>

                        <h2 className="user-name-glitch">
                            {user.role === 'candidate' ? (formData.fullName || 'Candidate') : (formData.companyName || 'Company')}
                        </h2>

                        <div className="user-role-badge">
                            {user.role === 'candidate' ? 'Software Engineer Candidate' : 'Hiring Partner'}
                        </div>

                        {msg && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`alert alert-${msg.type}`}
                                style={{ marginTop: '2rem' }}
                            >
                                {msg.text}
                            </motion.div>
                        )}
                    </div>
                </motion.div>

                {/* RIGHT SIDE: Form & Details */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="form-container-glass"
                >
                    {user.role === 'candidate' && (
                        <div className="profile-tabs-3d">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`tab-btn-3d ${activeTab === tab.id ? 'active' : ''}`}
                                >
                                    {tab.label}
                                    {activeTab === tab.id && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="moving-indicator"
                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}

                    <form onSubmit={onSubmit} className="profile-form-3d">
                        {/* PERSONAL TAB */}
                        <AnimatePresence mode="wait">
                            {activeTab === 'personal' && (
                                <motion.div
                                    key="personal"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <h3 className="section-title-3d">Personal Information</h3>

                                    <div className="form-group">
                                        <label className="form-label">Email Address (Locked)</label>
                                        <input type="email" value={formData.email} disabled className="form-input-3d disabled" />
                                    </div>

                                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                        <div className="form-group">
                                            <label className="form-label">Full Name</label>
                                            <input type="text" name="fullName" value={formData.fullName} onChange={onChange} className="form-input-3d" placeholder="John Doe" />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Phone Number</label>
                                            <input type="tel" name="mobile" value={formData.mobile} onChange={onChange} className="form-input-3d" placeholder="+91 99999 99999" />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Current Location</label>
                                        <input type="text" name="location" value={formData.location} onChange={onChange} className="form-input-3d" placeholder="City, Country" />
                                    </div>

                                    {user.role === 'candidate' && (
                                        <div className="form-group">
                                            <label className="form-label">Resume Link (Google Drive / Doc)</label>
                                            <input type="text" name="resume" value={formData.resume} onChange={onChange} className="form-input-3d" placeholder="https://..." />
                                        </div>
                                    )}

                                    {user.role === 'interviewer' && (
                                        <div className="form-group">
                                            <label className="form-label">About Company</label>
                                            <textarea name="aboutCompany" value={formData.aboutCompany} onChange={onChange} className="form-input-3d" rows="4"></textarea>
                                        </div>
                                    )}

                                </motion.div>
                            )}

                            {/* EDUCATION TAB */}
                            {activeTab === 'education' && user.role === 'candidate' && (
                                <motion.div
                                    key="education"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <h3 className="section-title-3d">Education Journey</h3>

                                    <div className="education-card-3d">
                                        <h4>🎓 Undergraduate Degree</h4>
                                        <div className="form-row" style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <input type="text" name="degreeName" value={formData.degreeName} onChange={onChange} className="form-input-3d" placeholder="Degree (e.g. B.Tech)" />
                                            <input type="text" name="degreeCollege" value={formData.degreeCollege} onChange={onChange} className="form-input-3d" placeholder="University / College" />
                                            <input type="text" name="degreeYear" value={formData.degreeYear} onChange={onChange} className="form-input-3d" placeholder="Year of Passing" />
                                            <input type="text" name="degreeScore" value={formData.degreeScore} onChange={onChange} className="form-input-3d" placeholder="CGPA / %" />
                                        </div>
                                    </div>

                                    <div className="education-card-3d">
                                        <h4>🏛️ Intermediate / 12th</h4>
                                        <div className="form-row" style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <input type="text" name="twelfthCollege" value={formData.twelfthCollege} onChange={onChange} className="form-input-3d" placeholder="Note: College Name" />
                                            <input type="text" name="twelfthScore" value={formData.twelfthScore} onChange={onChange} className="form-input-3d" placeholder="Score" />
                                        </div>
                                    </div>

                                    <div className="education-card-3d">
                                        <h4>🏫 School / 10th</h4>
                                        <div className="form-row" style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <input type="text" name="tenthSchool" value={formData.tenthSchool} onChange={onChange} className="form-input-3d" placeholder="School Name" />
                                            <input type="text" name="tenthScore" value={formData.tenthScore} onChange={onChange} className="form-input-3d" placeholder="CGPA" />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* PROFESSIONAL TAB */}
                            {activeTab === 'professional' && user.role === 'candidate' && (
                                <motion.div
                                    key="professional"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <h3 className="section-title-3d">Professional Skills</h3>

                                    <div className="form-group">
                                        <label className="form-label">Key Skills (Comma Separated)</label>
                                        <textarea
                                            name="skills"
                                            value={formData.skills}
                                            onChange={onChange}
                                            className="form-input-3d"
                                            placeholder="React, Node.js, Python, AWS..."
                                            rows="3"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Total Experience (Years)</label>
                                        <input type="number" name="experienceYears" value={formData.experienceYears} onChange={onChange} className="form-input-3d" style={{ width: '100px' }} />
                                    </div>

                                    <h4 style={{ marginTop: '2rem', marginBottom: '1rem', color: '#64748b' }}>Social Presence</h4>
                                    <div className="form-group">
                                        <input type="text" name="linkedin" value={formData.linkedin} onChange={onChange} className="form-input-3d" placeholder="LinkedIn URL" style={{ marginBottom: '1rem' }} />
                                        <input type="text" name="github" value={formData.github} onChange={onChange} className="form-input-3d" placeholder="GitHub URL" style={{ marginBottom: '1rem' }} />
                                        <input type="text" name="portfolio" value={formData.portfolio} onChange={onChange} className="form-input-3d" placeholder="Portfolio URL" />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div style={{ marginTop: '3rem' }}>
                            <button type="submit" className="btn-save-3d" disabled={loading}>
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                            {/* Debug Info Removed */}
                        </div>
                    </form>
                </motion.div>
            </div>
        </div>
    );
};

export default Profile;

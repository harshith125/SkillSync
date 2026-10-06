import { useRef, Suspense, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import AuthContext from '../context/AuthContext';
import './Home.css';

const Home = () => {
    const { isAuthenticated, user } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated && user) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, user, navigate]);

    const targetRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: targetRef,
        offset: ["start start", "end start"]
    });

    const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
    const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.2]);

    return (
        <div className="home-container" ref={targetRef}>
            {/* Hero Section */}
            <motion.div style={{ y, opacity }} className="hero-section">
                <div className="hero-content">
                    <span className="hero-badge">
                        ✨ Next-Gen Hiring & ATS Platform
                    </span>
                    <h1 className="hero-title">
                        Intelligent Hiring & <br />
                        <span className="text-gradient-pro">Automated Interview Sync</span>
                    </h1>
                    <p className="hero-subtitle">
                        Empowering recruiters and candidates with Gemini AI resume screening, dynamic multi-stage hiring pipelines, and direct Google Meet interview scheduling.
                    </p>

                    <div className="cta-group">
                        <Link to="/register?role=interviewer" className="btn-primary btn-hero">
                            Hire Top Talent →
                        </Link>
                        <Link to="/register?role=candidate" className="btn-secondary btn-hero">
                            Find Open Roles
                        </Link>
                    </div>

                    <div className="hero-social-proof">
                        <span className="proof-tag">✓ Zero Pop-Ups, Clean Dedicated Workflows</span>
                        <span className="proof-tag">✓ Direct RESTful API Integration</span>
                    </div>
                </div>

                {/* Hero Feature Showcase Graphic */}
                <div className="hero-preview-graphic card-pro">
                    <div className="graphic-header">
                        <div className="graphic-dots">
                            <span className="dot red"></span>
                            <span className="dot yellow"></span>
                            <span className="dot green"></span>
                        </div>
                        <span className="graphic-title">SkillSync ATS Intelligence Engine</span>
                    </div>

                    <div className="graphic-body">
                        <div className="metric-pill-demo">
                            <span className="pill-score">94%</span>
                            <div>
                                <strong>Lead Full Stack Engineer</strong>
                                <p>Strong alignment with React, Node.js & Cloud Architecture</p>
                            </div>
                        </div>

                        <div className="stages-demo-strip">
                            <div className="demo-stage active">1. Applied</div>
                            <div className="demo-stage active">2. Technical Review</div>
                            <div className="demo-stage">3. Meet Interview</div>
                            <div className="demo-stage">4. Decision</div>
                        </div>

                        <div className="google-meet-demo-box">
                            <div className="g-meet-icon">🟢</div>
                            <div className="g-meet-text">
                                <strong>Google Meet Generated</strong>
                                <span>meet.google.com/xyz-qwer-vbn</span>
                            </div>
                            <span className="badge badge-success">Synced</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Platform Core Capabilities Section */}
            <div className="features-section">
                <div className="features-header">
                    <h2>Enterprise Capabilities Built for Scale</h2>
                    <p>Designed for fast-moving recruitment teams and ambitious candidates.</p>
                </div>

                <div className="features-grid">
                    <div className="feature-card-pro card-pro">
                        <div className="feature-icon-badge">🤖</div>
                        <h3>Gemini AI Resume Screening</h3>
                        <p>
                            Extract text from PDF/DOCX resumes and generate instant fit scores, key strengths, and competency gap summaries.
                        </p>
                    </div>

                    <div className="feature-card-pro card-pro">
                        <div className="feature-icon-badge">📅</div>
                        <h3>Google Calendar & Meet Sync</h3>
                        <p>
                            Native OAuth 2.0 integration generates conference links and synchronizes interviews with calendar invites automatically.
                        </p>
                    </div>

                    <div className="feature-card-pro card-pro">
                        <div className="feature-icon-badge">🎯</div>
                        <h3>Dynamic Hiring Pipelines</h3>
                        <p>
                            Recruiters customize interview stages per role and advance applicants seamlessly via full-page dossiers.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;

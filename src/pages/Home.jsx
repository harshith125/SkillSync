import { useRef, Suspense, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Tilt } from 'react-tilt';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Float, Sparkles } from '@react-three/drei';
import AuthContext from '../context/AuthContext';
import CubeModel from '../components/CubeModel';
import { FeatureCanvas } from '../components/FeatureModels';
import './Home.css';

const Home = () => {
    const { isAuthenticated, user } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated && user) {
            if (user.role === 'interviewer') {
                navigate('/company-dashboard');
            } else if (user.role === 'candidate') {
                navigate('/candidate-dashboard');
            } else {
                navigate('/dashboard');
            }
        }
    }, [isAuthenticated, user, navigate]);

    // Parallax Effect for Hero
    const targetRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: targetRef,
        offset: ["start start", "end start"]
    });

    const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
    const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                delayChildren: 0.3,
                staggerChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.5, ease: "easeOut" }
        }
    };

    // 3D Tilt Options
    const tiltOptions = {
        reverse: false,
        max: 15,
        perspective: 1000,
        scale: 1.05,
        speed: 1000,
        transition: true,
        axis: null,
        reset: true,
        easing: "cubic-bezier(.03,.98,.52,.99)"
    };

    return (
        <div className="home-container" ref={targetRef}>
            {/* Hero Section with Parallax */}
            <motion.div
                style={{ y, opacity }}
                className="hero-section"
            >
                <div className="hero-content">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={containerVariants}
                    >
                        <motion.span variants={itemVariants} className="hero-badge">
                            🚀 The Future of Hiring
                        </motion.span>
                        <motion.h1 variants={itemVariants} className="hero-title">
                            Sync Your Skills with <br />
                            <span className="text-gradient-3d">Your Dream Job</span>
                        </motion.h1>
                        <motion.p variants={itemVariants} className="hero-subtitle">
                            Experience the future of hiring with our AI-powered ATS, automated resume parsing,
                            and smart matchmaking algorithms—all in an immersive, dimension-breaking interface.
                        </motion.p>

                        <motion.div variants={itemVariants} className="cta-group" style={{ position: 'relative', zIndex: 100 }}>
                            <Link to="/login" style={{ textDecoration: 'none' }}>
                                <motion.button
                                    whileHover={{ scale: 1.05, boxShadow: "0 0 25px rgba(99, 102, 241, 0.6)" }}
                                    whileTap={{ scale: 0.95 }}
                                    className="btn-hero-3d btn-primary"
                                    style={{ cursor: 'pointer' }}
                                >
                                    Sync Now
                                </motion.button>
                            </Link>
                            <Link to="/register" style={{ textDecoration: 'none' }}>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="btn-hero-3d btn-glass"
                                    style={{ cursor: 'pointer' }}
                                >
                                    Create Profile
                                </motion.button>
                            </Link>
                        </motion.div>
                    </motion.div>
                </div>

                {/* Real 3D Canvas Element */}
                <motion.div
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="hero-3d-visual"
                >
                    <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
                        <ambientLight intensity={0.5} />
                        <pointLight position={[10, 10, 10]} intensity={1} />
                        <spotLight position={[-10, -10, -10]} angle={0.15} penumbra={1} />

                        <Float speed={2} rotationIntensity={1} floatIntensity={1}>
                            <Suspense fallback={null}>
                                <CubeModel scale={1} position={[0, 0, 0]} />
                            </Suspense>
                        </Float>
                        <Environment preset="city" />
                        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={2} />
                    </Canvas>
                </motion.div>
            </motion.div>

            {/* Features Section with 3D Tilt Cards */}
            <div className="features-section">
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="features-header"
                >
                    <h2>Why SkillSync?</h2>
                    <p>Elevate your potential with our dimension-breaking platform.</p>
                </motion.div>

                <div className="features-grid">
                    <Tilt options={tiltOptions} className="tilt-card">
                        <div className="feature-card-inner">
                            <div className="card-gradient"></div>
                            <FeatureCanvas type="match" color="#6366f1" />
                            <h3>AI Matchmaking</h3>
                            <p>Our neural engine finds opportunities that align perfectly with your skillset.</p>
                        </div>
                    </Tilt>

                    <Tilt options={tiltOptions} className="tilt-card">
                        <div className="feature-card-inner">
                            <div className="card-gradient"></div>
                            <FeatureCanvas type="sync" color="#ec4899" />
                            <h3>Instant Sync</h3>
                            <p>Real-time notifications sent instantly when a matching role is discovered.</p>
                        </div>
                    </Tilt>

                    <Tilt options={tiltOptions} className="tilt-card">
                        <div className="feature-card-inner">
                            <div className="card-gradient"></div>
                            <FeatureCanvas type="profile" color="#0ea5e9" />
                            <h3>Premium Profile</h3>
                            <p>Stand out with a profile designed to showcase experience in 3D.</p>
                        </div>
                    </Tilt>
                </div>
            </div>
        </div>
    );
};

export default Home;

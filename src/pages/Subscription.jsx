import { useState, useEffect, useContext } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { subscriptionAPI } from '../api';
import './Subscription.css';

const PLANS = [
    {
        id: '1_month',
        title: '1 Month PRO',
        duration: '1 Month',
        price: 299,
        badge: 'Flexible',
        savings: null,
        desc: 'Ideal for rapid hiring sprints and single-role interview pipelines.'
    },
    {
        id: '3_months',
        title: '3 Months PRO',
        duration: '3 Months',
        price: 799,
        badge: 'Most Popular',
        savings: 'Save ₹98',
        desc: 'Our recommended quarterly plan for growing recruitment teams.'
    },
    {
        id: '6_months',
        title: '6 Months PRO',
        duration: '6 Months',
        price: 1399,
        badge: 'Best Value',
        savings: 'Save ₹395',
        desc: 'Maximum savings for continuous hiring and talent acquisition.'
    }
];

const Subscription = () => {
    const { user, loadUser } = useContext(AuthContext);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [selectedPlanId, setSelectedPlanId] = useState('3_months');
    const [utrNumber, setUtrNumber] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [proStatus, setProStatus] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [customQrImage, setCustomQrImage] = useState(() => localStorage.getItem('skillsync_custom_qr') || null);

    const handleQrImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                const dataUrl = reader.result;
                setCustomQrImage(dataUrl);
                try {
                    localStorage.setItem('skillsync_custom_qr', dataUrl);
                } catch (err) {}
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveQrImage = () => {
        setCustomQrImage(null);
        try {
            localStorage.removeItem('skillsync_custom_qr');
        } catch (err) {}
    };

    useEffect(() => {
        if (searchParams.get('error') === 'pro_required') {
            setErrorMsg('SkillSync PRO is required to connect Google Calendar and automate Meet scheduling.');
        }

        const fetchStatus = async () => {
            try {
                const res = await subscriptionAPI.getStatus();
                setProStatus(res.data);
            } catch (err) {
                console.warn('Could not fetch PRO status:', err.message);
            }
        };

        fetchStatus();
    }, [searchParams]);

    const activePlan = PLANS.find(p => p.id === selectedPlanId) || PLANS[1];

    const handleActivatePro = async (e) => {
        e.preventDefault();
        setErrorMsg('');

        if (!utrNumber.trim() || utrNumber.trim().length < 6) {
            setErrorMsg('Please enter your 12-digit UPI UTR / Transaction Reference ID.');
            return;
        }

        try {
            setSubmitting(true);
            const res = await subscriptionAPI.activate({
                plan: activePlan.id,
                utrNumber: utrNumber.trim()
            });

            setSuccessMsg(res.data.msg || 'SkillSync PRO Activated Successfully!');
            await loadUser(); // Reload user context to reflect isPro: true immediately

            setTimeout(() => {
                navigate('/dashboard');
            }, 2500);
        } catch (err) {
            setErrorMsg(err.response?.data?.msg || 'Failed to activate subscription. Please verify transaction ID.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="subscription-page-container">
            {/* Breadcrumb Navigation */}
            <div className="breadcrumb-nav">
                <Link to="/dashboard">Dashboard</Link>
                <span className="breadcrumb-sep">/</span>
                <span className="breadcrumb-current">SkillSync PRO Plans</span>
            </div>

            {/* Header */}
            <div className="sub-header-center">
                <span className="badge badge-primary">⚡ Upgrade to SkillSync PRO</span>
                <h1>Unlock Automated Google Calendar & Meet Sync</h1>
                <p>
                    Supercharge your hiring operations with automated Google Calendar scheduling, instant Google Meet link generation, and candidate calendar sync.
                </p>
            </div>

            {/* Active PRO Notice if already PRO */}
            {user?.isPro && (
                <div className="already-pro-banner card-pro">
                    <span className="pro-star-badge">⭐</span>
                    <div>
                        <strong>You are already a SkillSync PRO Member!</strong>
                        <p>Google Calendar sync and automated Meet links are fully enabled on your account.</p>
                    </div>
                    <Link to="/dashboard" className="btn-primary btn-sm">
                        Go to Dashboard →
                    </Link>
                </div>
            )}

            {errorMsg && (
                <div className="alert-banner-error" style={{ margin: '14px 0' }}>
                    <span>⚠️</span>
                    <div>{errorMsg}</div>
                </div>
            )}

            {successMsg && (
                <div className="alert-banner-success" style={{ margin: '14px 0' }}>
                    <span>🎉</span>
                    <div>{successMsg}</div>
                </div>
            )}

            {/* Main Layout Grid */}
            <div className="subscription-grid-layout">
                {/* Left Column: Plan Cards */}
                <div className="plans-selection-col">
                    <h3 className="section-title">1. Select Subscription Duration</h3>

                    <div className="plans-cards-stack">
                        {PLANS.map(plan => {
                            const isSelected = selectedPlanId === plan.id;
                            return (
                                <div 
                                    key={plan.id}
                                    className={`plan-tier-card card-pro ${isSelected ? 'selected' : ''}`}
                                    onClick={() => setSelectedPlanId(plan.id)}
                                >
                                    <div className="plan-card-top">
                                        <div className="plan-radio-row">
                                            <input 
                                                type="radio"
                                                name="plan"
                                                checked={isSelected}
                                                onChange={() => setSelectedPlanId(plan.id)}
                                            />
                                            <strong className="plan-title">{plan.title}</strong>
                                        </div>
                                        <span className={`badge ${plan.id === '3_months' ? 'badge-success' : 'badge-info'}`}>
                                            {plan.badge}
                                        </span>
                                    </div>

                                    <div className="plan-price-row">
                                        <span className="plan-price">₹{plan.price}</span>
                                        <span className="plan-duration">/ {plan.duration}</span>
                                        {plan.savings && (
                                            <span className="savings-pill">{plan.savings}</span>
                                        )}
                                    </div>

                                    <p className="plan-desc">{plan.desc}</p>
                                </div>
                            );
                        })}
                    </div>

                    {/* Features Included List */}
                    <div className="features-included-card card-pro">
                        <h4>Everything Included in SkillSync PRO:</h4>
                        <ul className="pro-features-checklist">
                            <li>✓ <strong>Automated Google Calendar 2-Way Sync</strong></li>
                            <li>✓ <strong>One-Click Automated Google Meet Generation</strong></li>
                            <li>✓ <strong>Direct Candidate Calendar Invitations</strong></li>
                            <li>✓ <strong>Dynamic Hiring Pipelines & Unlimited Stages</strong></li>
                            <li>✓ <strong>Priority Gemini AI Resume Ranking</strong></li>
                            <li>✓ <strong>Verified Recruiter PRO Badge</strong></li>
                        </ul>
                    </div>
                </div>

                {/* Right Column: QR Code Payment & UTR Submission */}
                <div className="payment-checkout-col card-pro">
                    <div className="checkout-title-box">
                        <h3>2. Scan QR & Complete Payment</h3>
                        <p>Instant automated activation upon reference submission</p>
                    </div>

                    <div className="qr-display-box">
                        <div className="qr-image-wrapper">
                            <img 
                                src={customQrImage || "/payment-qr.png"} 
                                onError={(e) => { 
                                    if (!customQrImage) {
                                        e.target.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`upi://pay?pa=vidiyalanagaharshithvidiyala@okaxis&pn=SkillSync%20PRO&am=${activePlan.price}&cu=INR`)}`;
                                    }
                                }}
                                alt="Payment QR Scanner" 
                                className="qr-image-tag"
                            />
                        </div>

                        <div className="qr-payment-amount">
                            <span className="amount-label">Amount to Pay</span>
                            <span className="amount-val">₹{activePlan.price}</span>
                            <span className="amount-plan-name">({activePlan.title})</span>
                        </div>

                        <div className="upi-app-badges">
                            <span className="upi-chip">GPay</span>
                            <span className="upi-chip">PhonePe</span>
                            <span className="upi-chip">Paytm</span>
                            <span className="upi-chip">BHIM UPI</span>
                        </div>

                        <div style={{ marginTop: '0.85rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                            <label style={{ fontSize: '0.78rem', color: '#2563eb', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 600, background: '#eff6ff', border: '1px solid #bfdbfe', padding: '5px 12px', borderRadius: '5px', transition: 'all 0.15s ease' }}>
                                <span>📷 Upload My Scanner / QR Image</span>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleQrImageUpload} 
                                    style={{ display: 'none' }} 
                                />
                            </label>
                            {customQrImage && (
                                <button 
                                    type="button" 
                                    onClick={handleRemoveQrImage}
                                    style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.74rem', cursor: 'pointer', textDecoration: 'underline' }}
                                >
                                    Reset to default scanner
                                </button>
                            )}
                        </div>
                    </div>

                    <form onSubmit={handleActivatePro} className="utr-submit-form">
                        <div className="input-group-pro">
                            <label className="input-label-pro">
                                <span>12-Digit UTR / UPI Reference Number *</span>
                                <span className="label-hint">From payment receipt</span>
                            </label>
                            <input 
                                type="text"
                                className="input-field-pro"
                                placeholder="e.g. 427819283741"
                                value={utrNumber}
                                onChange={(e) => setUtrNumber(e.target.value)}
                                maxLength={24}
                                required
                            />
                        </div>

                        <button 
                            type="submit" 
                            className="btn-primary" 
                            style={{ width: '100%', padding: '10px' }}
                            disabled={submitting || !!successMsg}
                        >
                            {submitting ? (
                                <>
                                    <span className="spinner-inline"></span>
                                    Verifying & Activating PRO...
                                </>
                            ) : (
                                `✓ Confirm & Activate PRO (₹${activePlan.price})`
                            )}
                        </button>

                        <div className="instant-notice">
                            ⚡ Instant Activation: Your account will immediately upgrade to PRO and unlock Google Calendar integration.
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Subscription;

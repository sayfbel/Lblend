import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { User, Mail, Lock, Briefcase } from 'lucide-react';
import Logo from './Logo';
import FashionSelect from './FashionSelect';

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [occupation, setOccupation] = useState('Developer');
    const [verificationCode, setVerificationCode] = useState('');
    const [googleToken, setGoogleToken] = useState(null);
    
    const [step, setStep] = useState(1);
    const [message, setMessage] = useState('');
    const [successful, setSuccessful] = useState(false);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();

    React.useEffect(() => {
        if (location.state && location.state.step === 2) {
            setStep(2);
            if (location.state.email) {
                setEmail(location.state.email);
            }
        }
        
        const params = new URLSearchParams(location.search);
        const gToken = params.get('google_token');
        if (gToken) {
            setGoogleToken(gToken);
        }
    }, [location]);

    const occupationOptions = ['Developer', 'Designer', 'Video Editor', 'Content Creator', 'student(bac)', 'Other'];

    const handleRegister = async (e) => {
        e.preventDefault();
        setMessage('');
        setLoading(true);
        try {
            if (googleToken) {
                const response = await axios.post('http://localhost:5000/api/register-google', {
                    google_token: googleToken,
                    password,
                    occupation
                });
                setMessage(response.data.message);
                setSuccessful(true);
                setTimeout(() => navigate('/login'), 2000);
            } else {
                await axios.post('http://localhost:5000/api/register', {
                    username, email, password, occupation
                });
                setMessage("Code sent! Check your Gmail.");
                setStep(2);
            }
            setLoading(false);
        } catch (error) {
            const resMessage = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
            setMessage(resMessage);
            setLoading(false);
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        setMessage('');
        setLoading(true);
        try {
            const response = await axios.post('http://localhost:5000/api/verify-code', {
                email, code: verificationCode
            });
            setMessage(response.data.message);
            setSuccessful(true);
            setTimeout(() => navigate('/login'), 2000);
        } catch (error) {
            const resMessage = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
            setMessage(resMessage);
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        setMessage('');
        try {
            const response = await axios.post('http://localhost:5000/api/resend-code', { email });
            setMessage(response.data.message || "New code sent! Check your Gmail.");
            setSuccessful(true);
            setTimeout(() => setSuccessful(false), 3000);
        } catch (error) {
            const resMessage = (error.response && error.response.data && error.response.data.message) || "Failed to resend code.";
            setMessage(resMessage);
            setSuccessful(false);
        }
    };

    return (
        <div style={{ display: 'flex', width: '100vw', height: '100vh', background: '#fff', overflow: 'hidden' }}>
            {/* Left Side: Brand Green */}
            <div style={{ 
                flex: '1', 
                background: 'var(--secondary)', 
                display: 'none', 
                lg: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '40px',
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
            }} className="register-left-panel">
                <div style={{ 
                    position: 'absolute', 
                    width: '600px', 
                    height: '600px', 
                    background: 'rgba(255,255,255,0.03)', 
                    borderRadius: '50%',
                    bottom: '-100px',
                    left: '-100px'
                }} />
                <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', justifyContent: 'center' }}>
                         {[1,2,3].map(i => <div key={i} style={{ width: '20px', height: '20px', background: 'var(--accent)', borderRadius: '4px' }} />)}
                    </div>
                    <h2 style={{ fontSize: '3rem', fontWeight: '900', letterSpacing: '-2px' }}>L'BLEND SPACE</h2>
                    <p style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.7)', maxWidth: '400px', fontWeight: '500' }}>Access high-performance digital fashion assets and elite community tools.</p>
                </div>
            </div>

            {/* Right Side: Form */}
            <div style={{ flex: '1', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
                <div style={{ width: '100%', maxWidth: '400px', padding: '10px' }} className="animate-fade-in">
                    <div style={{ marginBottom: '20px' }}>
                        <Logo />
                    </div>
                    
                    <h1 style={{ fontWeight: '800', fontSize: '2.5rem', color: 'var(--secondary)', marginBottom: '5px' }}>
                        {step === 1 ? 'Sign Up' : 'Identify'}
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontWeight: '600', marginBottom: '20px', fontSize: '0.85rem' }}>
                        {step === 1 ? 'Join the next generation of fashion creators.' : 'Verify your digital identity code.'}
                    </p>

                    {message && (
                        <div style={{ 
                            color: successful ? 'var(--secondary)' : '#e11d48', 
                            backgroundColor: successful ? 'var(--accent)' : '#fff1f2',
                            padding: '10px', borderRadius: '10px', marginBottom: '15px', textAlign: 'center', fontSize: '0.8rem', fontWeight: '600'
                        }}>{message}</div>
                    )}

                    {step === 1 ? (
                        <form onSubmit={handleRegister}>
                            {googleToken && (
                                <div style={{ marginBottom: '1.2rem', padding: '10px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, fontWeight: '600' }}>
                                        Google Account detected. Please complete your profile by providing a Security Key and selecting your Mission Role.
                                    </p>
                                </div>
                            )}

                            {!googleToken && (
                                <>
                                    <div className="input-group" style={{ marginBottom: '0.8rem' }}>
                                        <label style={{ marginBottom: '0.4rem', fontSize: '0.75rem' }}><User size={12}/> Profile Name</label>
                                        <input type="text" placeholder="John Doe" value={username} onChange={(e) => setUsername(e.target.value)} required style={{ padding: '0.8rem' }} />
                                    </div>
                                    <div className="input-group" style={{ marginBottom: '0.8rem' }}>
                                        <label style={{ marginBottom: '0.4rem', fontSize: '0.75rem' }}><Mail size={12}/> Email Hub</label>
                                        <input type="email" placeholder="name@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ padding: '0.8rem' }} />
                                    </div>
                                </>
                            )}
                            <div className="input-group" style={{ marginBottom: '1.2rem' }}>
                                <label style={{ marginBottom: '0.4rem', fontSize: '0.75rem' }}><Lock size={12}/> Security Key</label>
                                <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ padding: '0.8rem' }} />
                            </div>
                            
                            {/* NEW FASHION SELECTOR */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <FashionSelect 
                                    label="Mission Role" 
                                    options={occupationOptions} 
                                    value={occupation} 
                                    onChange={setOccupation} 
                                />
                            </div>

                            <button className="btn-primary" style={{ width: '100%', marginBottom: '15px', padding: '1rem' }} disabled={loading}>
                                {loading ? 'Initializing...' : 'Initiate Registration'}
                            </button>

                            {!googleToken && (
                                <button 
                                    type="button"
                                    onClick={() => window.location.href = 'http://localhost:5000/api/auth/google'}
                                    style={{ background: '#ffffff', border: '1px solid var(--border)', color: 'var(--secondary)', padding: '0.8rem', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%', fontSize: '0.85rem', fontWeight: '700' }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M23.5 12.2c0-.8-.1-1.5-.2-2.2H12v4.3h6.5c-.3 1.5-1.1 2.8-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.7z" fill="#4285F4"/>
                                        <path d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1.1.7-2.5 1.2-4 1.2-3.1 0-5.7-2.1-6.7-4.9H1.4v3.1C3.4 21.5 7.4 24 12 24z" fill="#34A853"/>
                                        <path d="M5.3 14.4c-.2-.7-.4-1.5-.4-2.4s.2-1.7.4-2.4V6.5H1.4C.5 8.2 0 10 0 12s.5 3.8 1.4 5.5l3.9-3.1z" fill="#FBBC05"/>
                                        <path d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C17.9 1.1 15.2 0 12 0 7.4 0 3.4 2.5 1.4 6.5l3.9 3.1c1-2.8 3.6-4.8 6.7-4.8z" fill="#EA4335"/>
                                    </svg>
                                    Continue with Google
                                </button>
                            )}
                        </form>
                    ) : (
                        <form onSubmit={handleVerify}>
                            <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                                <label style={{ textAlign: 'center', display: 'block', marginBottom: '1rem', fontSize: '0.75rem' }}>6-DIGIT CODE</label>
                                <input
                                    type="text" placeholder="000000" maxLength="6"
                                    value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)}
                                    style={{ textAlign: 'center', fontSize: '2rem', letterSpacing: '8px', fontWeight: 'bold' }} required
                                />
                            </div>
                            <button className="btn-primary" style={{ width: '100%', marginBottom: '15px', padding: '1rem' }} disabled={loading}>
                                {loading ? 'Activating...' : 'Verify Identity'}
                            </button>
                            <button
                                type="button"
                                onClick={handleResendCode}
                                style={{
                                    width: '100%',
                                    marginBottom: '15px',
                                    padding: '1rem',
                                    background: 'transparent',
                                    border: '1px solid var(--border)',
                                    color: 'var(--secondary)',
                                    borderRadius: '12px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem'
                                }}
                            >
                                Resend Verification Code
                            </button>
                        </form>
                    )}

                    <div style={{ textAlign: 'center', marginTop: '15px', fontSize: '0.8rem' }}>
                        <p style={{ color: 'var(--text-muted)', fontWeight: '600' }}>
                            Existing profile? <Link to="/login" style={{ color: 'var(--secondary)', textDecoration: 'none', fontWeight: '800' }}>Access Now</Link>
                        </p>
                    </div>
                </div>
            </div>
            
            <style>{`
                @media (max-width: 968px) { .register-left-panel { display: none !important; } }
                @media (min-width: 969px) { .register-left-panel { display: flex !important; } }
            `}</style>
        </div>
    );
};

export default Register;

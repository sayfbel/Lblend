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
    }, [location]);

    const occupationOptions = ['Developer', 'Designer', 'Video Editor', 'Content Creator', 'Other'];

    const handleRegister = async (e) => {
        e.preventDefault();
        setMessage('');
        setLoading(true);
        try {
            await axios.post('http://localhost:5000/api/register', {
                username, email, password, occupation
            });
            setMessage("Code sent! Check your Gmail.");
            setStep(2);
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
                            <div className="input-group" style={{ marginBottom: '0.8rem' }}>
                                <label style={{ marginBottom: '0.4rem', fontSize: '0.75rem' }}><User size={12}/> Profile Name</label>
                                <input type="text" placeholder="John Doe" value={username} onChange={(e) => setUsername(e.target.value)} required style={{ padding: '0.8rem' }} />
                            </div>
                            <div className="input-group" style={{ marginBottom: '0.8rem' }}>
                                <label style={{ marginBottom: '0.4rem', fontSize: '0.75rem' }}><Mail size={12}/> Email Hub</label>
                                <input type="email" placeholder="name@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ padding: '0.8rem' }} />
                            </div>
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

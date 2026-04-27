import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import AuthService from '../services/auth.service';
import Logo from './Logo';

const GoogleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M23.5 12.2c0-.8-.1-1.5-.2-2.2H12v4.3h6.5c-.3 1.5-1.1 2.8-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.7z" fill="#4285F4"/>
        <path d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1.1.7-2.5 1.2-4 1.2-3.1 0-5.7-2.1-6.7-4.9H1.4v3.1C3.4 21.5 7.4 24 12 24z" fill="#34A853"/>
        <path d="M5.3 14.4c-.2-.7-.4-1.5-.4-2.4s.2-1.7.4-2.4V6.5H1.4C.5 8.2 0 10 0 12s.5 3.8 1.4 5.5l3.9-3.1z" fill="#FBBC05"/>
        <path d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C17.9 1.1 15.2 0 12 0 7.4 0 3.4 2.5 1.4 6.5l3.9 3.1c1-2.8 3.6-4.8 6.7-4.8z" fill="#EA4335"/>
    </svg>
);

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        const userDataStr = params.get('user');
        const errorMsg = params.get('error');
        if (errorMsg) setMessage(decodeURIComponent(errorMsg));
        if (token && userDataStr) {
            const userData = JSON.parse(decodeURIComponent(userDataStr));
            localStorage.setItem('user', JSON.stringify({ ...userData, accessToken: token }));
            navigate('/dashboard');
            window.location.reload();
        }
    }, [location, navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setMessage('');
        setLoading(true);
        try {
            await AuthService.login(email, password);
            navigate('/dashboard');
            window.location.reload();
        } catch (error) {
            const resMessage = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
            
            if (resMessage.includes("not verified")) {
                navigate('/register', { state: { step: 2, email } });
            } else {
                setMessage(resMessage);
            }
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', width: '100vw', height: '100vh', background: '#fff', overflow: 'hidden' }}>
            {/* Left Side: Form */}
            <div style={{ flex: '1', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
                <div style={{ width: '100%', maxWidth: '400px', padding: '10px' }} className="animate-fade-in">
                    <div style={{ marginBottom: '25px' }}>
                        <Logo />
                    </div>
                    
                    <h1 style={{ fontWeight: '800', fontSize: '2.5rem', color: 'var(--secondary)', marginBottom: '5px' }}>Login</h1>
                    <p style={{ color: 'var(--text-muted)', fontWeight: '600', marginBottom: '20px', fontSize: '0.9rem' }}>Welcome back! Please enter your details.</p>
                    
                    <form onSubmit={handleLogin}>
                        <div className="input-group" style={{ marginBottom: '1.2rem' }}>
                            <label style={{ marginBottom: '0.5rem' }}>Identity / Email</label>
                            <input type="email" placeholder="Enter email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </div>
                        
                        <div className="input-group" style={{ marginBottom: '0.8rem' }}>
                            <label style={{ marginBottom: '0.5rem' }}>Security / Password</label>
                            <input type={showPassword ? "text" : "password"} placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                            <input type="checkbox" id="showPass" checked={showPassword} onChange={() => setShowPassword(!showPassword)} style={{ width: '16px', height: '16px' }} />
                            <label htmlFor="showPass" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', cursor: 'pointer' }}>Show Password</label>
                        </div>

                        {message && (
                            <div style={{ color: '#e11d48', background: '#fff1f2', padding: '10px', borderRadius: '10px', marginBottom: '15px', textAlign: 'center', fontSize: '0.8rem', fontWeight: '600' }}>
                                {message}
                            </div>
                        )}

                        <button className="btn-primary" style={{ width: '100%', marginBottom: '15px', padding: '1rem' }}>
                            {loading ? 'Entering...' : 'Log In'}
                        </button>
                    </form>

                    <button 
                        onClick={() => window.location.href = 'http://localhost:5000/api/auth/google'}
                        style={{ background: '#ffffff', border: '1px solid var(--border)', color: 'var(--secondary)', padding: '0.8rem', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%', fontSize: '0.85rem', fontWeight: '700' }}
                    >
                        <GoogleIcon /> Continue with Google
                    </button>

                    <div style={{ textAlign: 'center', marginTop: '25px', fontSize: '0.8rem' }}>
                        <p style={{ color: 'var(--text-muted)', fontWeight: '600' }}>
                            New here? <Link to="/register" style={{ color: 'var(--secondary)', textDecoration: 'none', fontWeight: '800' }}>Create an account</Link>
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Side: Brand Green */}
            <div style={{ 
                flex: '1', 
                background: 'var(--secondary)', // The Green Color
                display: 'none', 
                lg: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '40px',
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
            }} className="login-right-panel">
                <div style={{ 
                    position: 'absolute', 
                    width: '600px', 
                    height: '600px', 
                    background: 'rgba(255,255,255,0.03)', 
                    borderRadius: '50%',
                    top: '-100px',
                    right: '-100px'
                }} />
                <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', justifyContent: 'center' }}>
                        {[1,2,3].map(i => <div key={i} style={{ width: '20px', height: '20px', background: 'var(--accent)', borderRadius: '4px' }} />)}
                    </div>
                    <h2 style={{ fontSize: '3rem', fontWeight: '900', letterSpacing: '-1px' }}>L'BLEND HUB</h2>
                    <p style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.7)', maxWidth: '400px', fontWeight: '500' }}>The elite operations center for modern fashion management.</p>
                </div>
            </div>
            
            {/* Inline Style for Responsive Hide */}
            <style>{`
                @media (max-width: 968px) {
                    .login-right-panel { display: none !important; }
                }
                @media (min-width: 969px) {
                    .login-right-panel { display: flex !important; }
                }
            `}</style>
        </div>
    );
};

export default Login;

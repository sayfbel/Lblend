import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const OperationalAlert = ({ message, type = 'success', onClose, duration = 5000 }) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
            setTimeout(onClose, 500); // Wait for fade out
        }, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    if (!visible) return null;

    const styles = {
        container: {
            position: 'fixed',
            top: '40px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100000, // Above everything
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            padding: '20px 40px',
            borderRadius: '24px',
            background: '#ffffff',
            boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
            border: '1px solid rgba(0,0,0,0.05)',
            backdropFilter: 'blur(10px)',
            minWidth: '400px',
            maxWidth: '600px',
            animation: 'alertSlideDown 0.6s cubic-bezier(0.2, 1, 0.3, 1)',
        },
        iconArea: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '45px',
            height: '45px',
            borderRadius: '12px',
            background: type === 'success' ? '#ecfdf5' : type === 'error' ? '#fff1f2' : '#f0f9ff',
            color: type === 'success' ? '#059669' : type === 'error' ? '#e11d48' : '#0369a1',
        },
        content: {
            flex: 1,
        },
        title: {
            fontSize: '0.7rem',
            fontWeight: '900',
            letterSpacing: '2px',
            color: 'var(--secondary)',
            opacity: 0.4,
            marginBottom: '4px',
            display: 'block'
        },
        text: {
            fontSize: '0.95rem',
            fontWeight: '700',
            color: 'var(--secondary)',
            margin: 0,
            lineHeight: 1.4
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.iconArea}>
                {type === 'success' && <CheckCircle size={22} />}
                {type === 'error' && <AlertCircle size={22} />}
                {type === 'info' && <Info size={22} />}
            </div>
            <div style={styles.content}>
                <span style={styles.title}>OPERATIONAL INTEL</span>
                <p style={styles.text}>{message}</p>
            </div>
            <button onClick={() => setVisible(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={18} />
            </button>
            <style>
                {`
                    @keyframes alertSlideDown {
                        from { transform: translate(-50%, -100%); opacity: 0; }
                        to { transform: translate(-50%, 0); opacity: 1; }
                    }
                `}
            </style>
        </div>
    );
};

export default OperationalAlert;

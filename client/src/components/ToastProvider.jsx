import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle, AlertCircle, Info, X, Check, AlertTriangle } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within ToastProvider');
    return context;
};

let toastIdCounter = 0;

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const toastRefs = useRef({});

    const removeToast = useCallback((id) => {
        // Start exit animation
        const el = toastRefs.current[id];
        if (el) {
            el.style.animation = 'toastSlideOut 0.4s cubic-bezier(0.4, 0, 1, 1) forwards';
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
                delete toastRefs.current[id];
            }, 400);
        } else {
            setToasts(prev => prev.filter(t => t.id !== id));
        }
    }, []);

    const addToast = useCallback((message, type = 'success', duration = 5000) => {
        const id = ++toastIdCounter;
        setToasts(prev => [...prev, { id, message, type, duration }]);

        if (duration > 0) {
            setTimeout(() => removeToast(id), duration);
        }

        return id;
    }, [removeToast]);

    const success = useCallback((message) => addToast(message, 'success', 5000), [addToast]);
    const error = useCallback((message) => addToast(message, 'error', 6000), [addToast]);
    const info = useCallback((message) => addToast(message, 'info', 5000), [addToast]);
    const warning = useCallback((message) => addToast(message, 'warning', 6000), [addToast]);

    // Confirm: shows a toast with Yes/No buttons, returns a Promise<boolean>
    const confirm = useCallback((message) => {
        return new Promise((resolve) => {
            const id = ++toastIdCounter;
            setToasts(prev => [...prev, {
                id,
                message,
                type: 'confirm',
                duration: 0, // Never auto-dismiss
                onConfirm: () => { removeToast(id); resolve(true); },
                onCancel: () => { removeToast(id); resolve(false); }
            }]);
        });
    }, [removeToast]);

    const getIcon = (type) => {
        switch (type) {
            case 'success': return <CheckCircle size={20} />;
            case 'error': return <AlertCircle size={20} />;
            case 'warning': return <AlertTriangle size={20} />;
            case 'confirm': return <AlertTriangle size={20} />;
            case 'info':
            default: return <Info size={20} />;
        }
    };

    const getColors = (type) => {
        switch (type) {
            case 'success': return { bg: '#ecfdf5', color: '#059669', border: '#bbf7d0' };
            case 'error': return { bg: '#fff1f2', color: '#e11d48', border: '#fecdd3' };
            case 'warning': return { bg: '#fffbeb', color: '#d97706', border: '#fde68a' };
            case 'confirm': return { bg: '#fffbeb', color: '#d97706', border: '#fde68a' };
            case 'info':
            default: return { bg: '#f0f9ff', color: '#0369a1', border: '#bae6fd' };
        }
    };

    const getTitle = (type) => {
        switch (type) {
            case 'success': return 'MISSION SUCCESS';
            case 'error': return 'SYSTEM ALERT';
            case 'warning': return 'CAUTION';
            case 'confirm': return 'CONFIRMATION REQUIRED';
            case 'info':
            default: return 'INTEL UPDATE';
        }
    };

    return (
        <ToastContext.Provider value={{ success, error, info, warning, confirm }}>
            {children}

            {/* TOAST CONTAINER - Bottom Right */}
            <div style={{
                position: 'fixed',
                bottom: '30px',
                right: '30px',
                zIndex: 999999,
                display: 'flex',
                flexDirection: 'column-reverse',
                gap: '14px',
                maxWidth: '420px',
                width: '100%',
                pointerEvents: 'none'
            }}>
                {toasts.map((toast, index) => {
                    const colors = getColors(toast.type);
                    return (
                        <div
                            key={toast.id}
                            ref={(el) => { if (el) toastRefs.current[toast.id] = el; }}
                            style={{
                                pointerEvents: 'auto',
                                background: '#ffffff',
                                borderRadius: '20px',
                                padding: '20px 24px',
                                boxShadow: '0 20px 60px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.05)',
                                border: '1px solid rgba(0,0,0,0.06)',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '16px',
                                animation: 'toastSlideIn 0.5s cubic-bezier(0.2, 1, 0.3, 1)',
                                backdropFilter: 'blur(20px)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            {/* Progress bar for auto-dismiss toasts */}
                            {toast.duration > 0 && (
                                <div style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    height: '3px',
                                    background: colors.color,
                                    borderRadius: '0 0 20px 20px',
                                    animation: `toastProgress ${toast.duration}ms linear forwards`,
                                    opacity: 0.4
                                }} />
                            )}

                            {/* Icon */}
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '12px',
                                background: colors.bg,
                                color: colors.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                {getIcon(toast.type)}
                            </div>

                            {/* Content */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <span style={{
                                    fontSize: '0.6rem',
                                    fontWeight: '900',
                                    letterSpacing: '2px',
                                    color: colors.color,
                                    display: 'block',
                                    marginBottom: '6px'
                                }}>
                                    {getTitle(toast.type)}
                                </span>
                                <p style={{
                                    fontSize: '0.9rem',
                                    fontWeight: '700',
                                    color: 'var(--secondary, #004842)',
                                    margin: 0,
                                    lineHeight: 1.45,
                                    wordBreak: 'break-word'
                                }}>
                                    {toast.message}
                                </p>

                                {/* Confirm Buttons */}
                                {toast.type === 'confirm' && (
                                    <div style={{
                                        display: 'flex',
                                        gap: '10px',
                                        marginTop: '16px'
                                    }}>
                                        <button
                                            onClick={toast.onCancel}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px',
                                                padding: '10px 22px',
                                                borderRadius: '12px',
                                                border: '2px solid #fecdd3',
                                                background: '#fff1f2',
                                                color: '#e11d48',
                                                cursor: 'pointer',
                                                fontWeight: '800',
                                                fontSize: '0.75rem',
                                                letterSpacing: '0.5px',
                                                transition: 'all 0.3s'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = '#e11d48';
                                                e.currentTarget.style.color = '#fff';
                                                e.currentTarget.style.borderColor = '#e11d48';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = '#fff1f2';
                                                e.currentTarget.style.color = '#e11d48';
                                                e.currentTarget.style.borderColor = '#fecdd3';
                                            }}
                                        >
                                            <X size={16} /> DENY
                                        </button>
                                        <button
                                            onClick={toast.onConfirm}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px',
                                                padding: '10px 22px',
                                                borderRadius: '12px',
                                                border: '2px solid #bbf7d0',
                                                background: '#ecfdf5',
                                                color: '#059669',
                                                cursor: 'pointer',
                                                fontWeight: '800',
                                                fontSize: '0.75rem',
                                                letterSpacing: '0.5px',
                                                transition: 'all 0.3s'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = '#059669';
                                                e.currentTarget.style.color = '#fff';
                                                e.currentTarget.style.borderColor = '#059669';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = '#ecfdf5';
                                                e.currentTarget.style.color = '#059669';
                                                e.currentTarget.style.borderColor = '#bbf7d0';
                                            }}
                                        >
                                            <Check size={16} /> CONFIRM
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Close button (only for non-confirm toasts) */}
                            {toast.type !== 'confirm' && (
                                <button
                                    onClick={() => removeToast(toast.id)}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: 'var(--text-muted, #94a3b8)',
                                        padding: '4px',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s',
                                        flexShrink: 0
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            <style>{`
                @keyframes toastSlideIn {
                    from {
                        transform: translateX(120%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes toastSlideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(120%);
                        opacity: 0;
                    }
                }
                @keyframes toastProgress {
                    from { width: 100%; }
                    to { width: 0%; }
                }
            `}</style>
        </ToastContext.Provider>
    );
};

export default ToastProvider;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, BellDot, Clock, Check, X, Shield, Activity, GitBranch, MessageSquare } from 'lucide-react';

const NotificationDropdown = ({ user }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    const fetchNotifications = async () => {
        try {
            const response = await axios.get(`http://localhost:5000/api/notifications/${user.id}`);
            setNotifications(response.data);
            setUnreadCount(response.data.filter(n => !n.is_read).length);
        } catch (error) { console.error('Notification Failure'); }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, [user.id]);

    const markAsRead = async (id) => {
        try {
            await axios.post('http://localhost:5000/api/notifications/read', { notificationId: id });
            fetchNotifications();
        } catch (error) { console.error('Mark as read failure'); }
    };

    const getIcon = (type) => {
        switch(type) {
            case 'broadcast': return <Activity size={14} color="var(--accent-dark)" />;
            case 'request': return <UserPlus size={14} color="var(--secondary)" />;
            case 'acceptance': return <Check size={14} color="#10b981" />;
            case 'branch': return <GitBranch size={14} color="var(--secondary)" />;
            case 'commit': return <MessageSquare size={14} color="var(--secondary)" />;
            default: return <Bell size={14} />;
        }
    };

    return (
        <div style={{ position: 'relative' }}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', position: 'relative', color: 'var(--secondary)' }}
            >
                {unreadCount > 0 ? <BellDot size={24} className="animate-pulse" /> : <Bell size={24} />}
                {unreadCount > 0 && (
                    <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#e11d48', color: 'white', fontSize: '0.6rem', fontWeight: '900', padding: '2px 6px', borderRadius: '100px', border: '2px solid white' }}>
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div onClick={() => setIsOpen(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 1000 }}></div>
                    <div className="animate-fade-in" style={{ 
                        position: 'absolute', top: '40px', right: '0', width: '380px', 
                        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(30px)',
                        borderRadius: '24px', boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
                        zIndex: 1001, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)'
                    }}>
                        <div style={{ padding: '20px 25px', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '900', color: 'var(--secondary)' }}>NOTIFICATIONS</h4>
                            <span style={{ fontSize: '0.6rem', fontWeight: '900', color: 'var(--accent-dark)', opacity: 0.6 }}>{unreadCount} NEW</span>
                        </div>
                        
                        <div style={{ maxHeight: '450px', overflowY: 'auto' }}>
                            {notifications.length > 0 ? notifications.map(notif => (
                                <div 
                                    key={notif.id} 
                                    onClick={() => markAsRead(notif.id)}
                                    style={{ 
                                        padding: '18px 25px', borderBottom: '1px solid rgba(0,0,0,0.02)',
                                        display: 'flex', gap: '15px', cursor: 'pointer',
                                        background: notif.is_read ? 'transparent' : 'rgba(0,72,66,0.02)',
                                        transition: 'all 0.3s'
                                    }}
                                >
                                    <div style={{ padding: '10px', borderRadius: '12px', background: '#f8fafc', height: 'fit-content' }}>
                                        {getIcon(notif.type)}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: '700', color: 'var(--secondary)', lineHeight: 1.4, opacity: notif.is_read ? 0.5 : 1 }}>
                                            {notif.message}
                                        </p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', opacity: 0.4 }}>
                                            <Clock size={10} />
                                            <span style={{ fontSize: '0.6rem', fontWeight: '800' }}>{new Date(notif.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        </div>
                                    </div>
                                    {!notif.is_read && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-dark)', marginTop: '5px' }}></div>}
                                </div>
                            )) : (
                                <div style={{ padding: '40px', textAlign: 'center', opacity: 0.3 }}>
                                    <p style={{ fontWeight: '800', fontSize: '0.8rem' }}>No transmissions detected.</p>
                                </div>
                            )}
                        </div>

                        <div style={{ padding: '15px', background: '#fcfcfc', textAlign: 'center' }}>
                            <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-dark)', fontSize: '0.7rem', fontWeight: '900', cursor: 'pointer' }}>MINIMIZE MANIFEST</button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

const UserPlus = ({ size, color }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" x2="19" y1="8" y2="14" /><line x1="22" x2="16" y1="11" y2="11" />
    </svg>
);

export default NotificationDropdown;

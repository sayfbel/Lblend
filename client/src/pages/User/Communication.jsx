import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
    Send, 
    Users, 
    MessageSquare, 
    Shield, 
    Activity, 
    Clock, 
    Lock,
    UserCheck,
    UserMinus,
    X
} from 'lucide-react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import ReactDOM from 'react-dom';
import { useToast } from '../../components/ToastProvider';

const Communication = () => {
    const { user } = useOutletContext();
    const navigate = useNavigate();
    const toast = useToast();
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const chatEndRef = useRef(null);

    const handleSelectAgent = (agent) => {
        if (agent.id === user.id) return navigate('/dashboard/identity');
        navigate(`/dashboard/nexus?id=${agent.id}`);
    };

    const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
    const [activeMobileTab, setActiveMobileTab] = useState('CHANNELS'); // CHANNELS, CHAT, PERSONNEL
    const [isManifestOpen, setIsManifestOpen] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchProjects = async () => {
        try {
            const response = await axios.get(`http://localhost:5000/api/intelligence/projects/${user.id}`);
            setProjects(response.data);
            if (response.data.length > 0 && !selectedProject) {
                setSelectedProject(response.data[0]);
            }
        } catch (error) { console.error('Intelligence manifest failed'); }
    };

    const fetchProjectData = async () => {
        if (!selectedProject) return;
        try {
            const [msgRes, memRes] = await Promise.all([
                axios.get(`http://localhost:5000/api/intelligence/messages/${selectedProject.id}`),
                axios.get(`http://localhost:5000/api/intelligence/members/${selectedProject.id}`)
            ]);
            setMessages(msgRes.data);
            setMembers(memRes.data);
        } catch (error) { console.error('Data pull failed'); }
    };

    useEffect(() => { fetchProjects(); }, [user.id]);
    useEffect(() => {
        if (selectedProject) {
            fetchProjectData();
            const interval = setInterval(fetchProjectData, 4000);
            return () => clearInterval(interval);
        }
    }, [selectedProject]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage || !selectedProject) return;
        try {
            await axios.post('http://localhost:5000/api/intelligence/messages', {
                announcement_id: selectedProject.id,
                user_id: user.id,
                message: newMessage
            });
            setNewMessage('');
            fetchProjectData();
        } catch (error) { console.error('Transmission failure'); }
    };

    const handleToggleBlock = async (memberLogId, currentStatus) => {
        try {
            await axios.post('http://localhost:5000/api/intelligence/toggle-block', {
                memberLogId,
                status: !currentStatus
            });
            fetchProjectData();
        } catch (error) { toast.error('Neutralization failed'); }
    };

    if (!projects.length) return (
        <div style={{ height: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={60} color="var(--border)" style={{ marginBottom: '30px', opacity: 0.3 }} />
            <p style={{ fontWeight: '800', color: 'var(--text-muted)', fontSize: '1.2rem' }}>No active intelligence channels found.</p>
        </div>
    );

    const isAdmiral = selectedProject?.user_id === user.id;
    const myMembership = members.find(m => m.user_id === user.id);
    const isNeutralized = !!myMembership?.is_blocked;

    return (
        <div className="animate-fade-in" style={{ 
            height: isMobile ? 'calc(100vh - 110px)' : 'calc(100vh - 180px)', 
            display: isMobile ? 'flex' : 'grid', 
            flexDirection: 'column',
            gridTemplateColumns: isMobile ? 'none' : '320px 1fr', 
            gap: isMobile ? '10px' : '30px',
            position: 'relative'
        }}>
            
            {isMobile && (
                <div style={{ display: 'flex', background: '#fff', borderRadius: 'var(--radius-md)', padding: '4px', marginBottom: '8px', border: '1px solid #f1f5f9' }}>
                    {['CHANNELS', 'CHAT', 'PERSONNEL'].map(tab => (
                        <button 
                            key={tab} 
                            onClick={() => setActiveMobileTab(tab)}
                            style={{ 
                                flex: 1, padding: '10px', border: 'none', borderRadius: 'calc(var(--radius-md) - 4px)', 
                                background: activeMobileTab === tab ? 'var(--secondary)' : 'transparent',
                                color: activeMobileTab === tab ? '#fff' : 'var(--secondary)',
                                fontSize: '0.65rem', fontWeight: '800', letterSpacing: '1px'
                            }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            )}

            {/* Channels Column */}
            {(!isMobile || activeMobileTab === 'CHANNELS') && (
                <div className="blend-card" style={{ 
                    padding: isMobile ? '15px' : '30px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    height: isMobile ? '100%' : 'auto'
                }}>
                    <h4 style={{ fontSize: '0.65rem', fontWeight: '800', letterSpacing: '1px', color: 'var(--secondary)', marginBottom: '20px', opacity: 0.4 }}>CHANNELS</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
                        {projects.map(proj => (
                                <div 
                                    key={proj.id} 
                                    onClick={() => { setSelectedProject(proj); isMobile && setActiveMobileTab('CHAT'); }}
                                    style={{ 
                                        padding: isMobile ? '14px 16px' : '18px 20px', borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'all 0.3s',
                                        background: selectedProject?.id === proj.id ? 'var(--secondary)' : 'transparent',
                                        color: selectedProject?.id === proj.id ? '#fff' : 'var(--secondary)',
                                        border: selectedProject?.id === proj.id ? 'none' : '1px solid #f1f5f9'
                                    }}
                                >
                                    <p style={{ margin: 0, fontWeight: '800', fontSize: '0.85rem', letterSpacing: '-0.3px' }}>{proj.project_name}</p>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '0.6rem', fontWeight: '700', opacity: 0.6 }}>{proj.owner_name}</p>
                                </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Main Center Content (Chat / Drawer) */}
            {(!isMobile || activeMobileTab === 'CHAT' || activeMobileTab === 'PERSONNEL') && (
                <div className="blend-card" style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    position: 'relative', 
                    overflow: 'hidden',
                    flex: 1,
                    padding: 0
                }}>
                    {/* Primary Chat UI */}
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', opacity: (!isMobile && isManifestOpen) ? 0.3 : 1, transition: 'opacity 0.3s' }}>
                        <div style={{ padding: isMobile ? '15px 20px' : '25px 40px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', zIndex: 10 }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: isMobile ? '1rem' : '1.3rem', fontWeight: '800', color: 'var(--secondary)', letterSpacing: '-0.5px' }}>{selectedProject?.project_name}</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></div>
                                    <span style={{ fontSize: '0.55rem', fontWeight: '800', color: '#10b981' }}>CHANNEL ACTIVE</span>
                                </div>
                            </div>
                            {!isMobile && (
                                <button 
                                    onClick={() => setIsManifestOpen(true)} 
                                    title="View Personnel Manifest"
                                    style={{ background: 'rgba(0,72,66,0.05)', border: 'none', borderRadius: '10px', width: '40px', height: '40px', cursor: 'pointer', color: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <Users size={20} />
                                </button>
                            )}
                        </div>

                        <div style={{ flex: 1, padding: isMobile ? '20px' : '30px 40px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: isMobile ? '15px' : '20px' }}>
                            {messages.map((msg, idx) => (
                                <div key={msg.id} style={{ display: 'flex', gap: '12px', maxWidth: '90%', alignSelf: msg.user_id === user.id ? 'flex-end' : 'flex-start', flexDirection: msg.user_id === user.id ? 'row-reverse' : 'row' }}>
                                    <div 
                                        onClick={() => handleSelectAgent({ id: msg.user_id, username: msg.username, avatar: msg.avatar, occupation: msg.occupation, email: msg.email })}
                                        style={{ width: isMobile ? '30px' : '35px', height: isMobile ? '30px' : '35px', borderRadius: '8px', background: 'var(--secondary)', flexShrink: 0, overflow: 'hidden', cursor: 'pointer' }}
                                    >
                                        {msg.avatar ? <img src={msg.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ textAlign: 'center', color: 'white', lineHeight: isMobile ? '30px' : '35px', fontSize: '0.7rem', fontWeight: '900' }}>{msg.username[0].toUpperCase()}</div>}
                                    </div>
                                    <div style={{ textAlign: msg.user_id === user.id ? 'right' : 'left' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: msg.user_id === user.id ? 'flex-end' : 'flex-start', marginBottom: '4px' }}>
                                            <span 
                                                onClick={() => handleSelectAgent({ id: msg.user_id, username: msg.username, avatar: msg.avatar, occupation: msg.occupation, email: msg.email })}
                                                style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--secondary)', cursor: 'pointer' }}
                                            >{msg.username}</span>
                                            <span style={{ fontSize: '0.55rem', fontWeight: '700', opacity: 0.4 }}>{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        </div>
                                        <div style={{ background: msg.user_id === user.id ? 'var(--secondary)' : '#f8fafc', color: msg.user_id === user.id ? '#fff' : 'var(--secondary)', padding: isMobile ? '10px 15px' : '15px 22px', borderRadius: msg.user_id === user.id ? '18px 4px 18px 18px' : '4px 18px 18px 18px', fontSize: isMobile ? '0.85rem' : '0.95rem', fontWeight: '600' }}>
                                            {msg.message}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>

                        {isNeutralized && (
                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(15px)', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center' }}>
                                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#fff1f2', color: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                                    <ShieldAlert size={30} />
                                </div>
                                <h3 style={{ fontSize: '1.4rem', fontWeight: '950', color: 'var(--secondary)', marginBottom: '8px' }}>Access Neutralized</h3>
                                <p style={{ color: 'var(--text-muted)', fontWeight: '700', maxWidth: '280px', fontSize: '0.8rem' }}>Your clearance for this intelligence hub has been revoked by the Admiral.</p>
                            </div>
                        )}

                        <form onSubmit={handleSendMessage} className="input-group" style={{ padding: isMobile ? '15px' : '30px 40px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '10px', marginBottom: 0 }}>
                            <input 
                                type="text" 
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Transmit intelligence..."
                                style={{ flex: 1, padding: isMobile ? '12px 18px' : '18px 25px', borderRadius: 'var(--radius-md)', background: '#f8fafc' }}
                                disabled={isNeutralized}
                            />
                            <button type="submit" disabled={isNeutralized} style={{ width: isMobile ? '45px' : '65px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--secondary)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}>
                                <Send size={isMobile ? 18 : 22} />
                            </button>
                        </form>
                    </div>

                    {/* Personnel Slide Drawer (Desktop) / Tab Content (Mobile) */}
                    {(((isMobile && activeMobileTab === 'PERSONNEL') || (!isMobile))) && (
                        <div style={{ 
                            position: isMobile ? 'relative' : 'absolute',
                            top: 0, 
                            right: isMobile ? 0 : (isManifestOpen ? 0 : '-360px'),
                            width: isMobile ? '100%' : '360px',
                            height: '100%',
                            background: '#fff',
                            boxShadow: isMobile ? 'none' : '-20px 0 60px rgba(0,0,0,0.05)',
                            transition: 'right 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)',
                            zIndex: 100,
                            display: 'flex',
                            flexDirection: 'column',
                            borderLeft: isMobile ? 'none' : '1px solid #f1f5f9'
                        }}>
                             {/* Personnel Header */}
                            <div style={{ padding: '25px 40px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
                                <h4 style={{ margin: 0, fontSize: '0.65rem', fontWeight: '800', letterSpacing: '1px', color: 'var(--secondary)', opacity: 0.4 }}>PERSONNEL MANIFEST</h4>
                                {!isMobile && (
                                    <button 
                                        onClick={() => setIsManifestOpen(false)} 
                                        style={{ background: 'var(--secondary)', border: 'none', borderRadius: '10px', width: '35px', height: '35px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>

                            <div style={{ flex: 1, padding: '30px 40px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {members.map(member => (
                                    <div key={member.member_log_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div 
                                            onClick={() => handleSelectAgent({ id: member.user_id, username: member.username, avatar: member.avatar, occupation: member.occupation, email: member.email })}
                                            style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                                        >
                                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--secondary)', overflow: 'hidden' }}>
                                                {member.avatar ? <img src={member.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ textAlign: 'center', color: 'white', lineHeight: '40px', fontSize: '0.8rem', fontWeight: '900' }}>{member.username[0].toUpperCase()}</div>}
                                            </div>
                                            <div style={{ opacity: member.is_blocked ? 0.3 : 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '800', color: 'var(--secondary)' }}>{member.username}</p>
                                                    {member.user_id === selectedProject?.user_id && <Shield size={10} color="var(--accent-dark)" />}
                                                </div>
                                                <p style={{ margin: 0, fontSize: '0.6rem', fontWeight: '700', color: 'var(--text-muted)' }}>{member.occupation?.toUpperCase()}</p>
                                            </div>
                                        </div>
                                        
                                        {isAdmiral && member.user_id !== user.id && (
                                            <button 
                                                onClick={() => handleToggleBlock(member.member_log_id, !!member.is_blocked)}
                                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.4, transition: 'all 0.3s' }}
                                                title={member.is_blocked ? "Restore Access" : "Neutralize Access"}
                                            >
                                                {!!member.is_blocked ? <UserCheck size={18} color="#10b981" /> : <UserMinus size={18} color="#e11d48" />}
                                            </button>
                                        )}

                                        {!!member.is_blocked && !isAdmiral && (
                                            <div style={{ padding: '4px 8px', borderRadius: '6px', background: '#fff1f2', color: '#e11d48', fontSize: '0.5rem', fontWeight: '950' }}>NEUTRALIZED</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Communication;

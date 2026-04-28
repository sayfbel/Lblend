import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import { Briefcase, ArrowRight, Clock, User, ShieldAlert, CheckCircle, Lock, Users, Search, ExternalLink } from 'lucide-react';
import OperationalAlert from '../../components/OperationalAlert';
import { useOutletContext, useNavigate } from 'react-router-dom';

const GithubIcon = ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
    </svg>
);

const YoutubeIcon = ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.42a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.94 2c1.72.42 8.6.42 8.6.42s6.88 0 8.6-.42a2.78 2.78 0 0 0 1.94-2A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"></path>
        <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"></polygon>
    </svg>
);

const DriveIcon = ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19L15 5H9L2 19H7L12 11L17 19H22Z"></path>
    </svg>
);

const FigmaIcon = ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5z"></path>
        <path d="M12 2h3.5a3.5 3.5 0 1 1 0 7H12V2z"></path>
        <path d="M12 12.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 1 1-7 0z"></path>
        <path d="M5 19.5A3.5 3.5 0 0 1 8.5 16H12v3.5a3.5 3.5 0 1 1-7 0z"></path>
        <path d="M5 12.5A3.5 3.5 0 0 1 8.5 9H12v7H8.5A3.5 3.5 0 0 1 5 12.5z"></path>
    </svg>
);



const Overview = () => {
    const { user } = useOutletContext();
    const navigate = useNavigate();
    const [announcements, setAnnouncements] = useState([]);
    const [agents, setAgents] = useState([]);
    const [alert, setAlert] = useState(null);
    const [selectedMission, setSelectedMission] = useState(null);
    const [isJoining, setIsJoining] = useState(false);
    const [activeFilter, setActiveFilter] = useState("ALL");
    const [searchQuery, setSearchQuery] = useState("");

    const STATUS_FILTERS = ["ALL", "Design", "Development", "Marketing", "Strategy", "Photography", "Modeling", "Styling"];

    const fetchAnnouncements = async () => {
        try {
            const response = await axios.get(`http://localhost:5000/api/announcements?userId=${user.id}`);
            setAnnouncements(response.data);
        } catch (error) { console.error('Intelligence Retrieval Failure'); }
    };

    const fetchAgents = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/users');
            setAgents(response.data.filter(a => a.id !== user.id));
        } catch (error) { console.error('Nexus network failure'); }
    };

    useEffect(() => { 
        fetchAnnouncements(); 
        fetchAgents();
    }, [user.id]);

    const handleSelectAgent = (agent) => {
        if (agent.id === user.id) return navigate('/dashboard/identity');
        navigate(`/dashboard/nexus?id=${agent.id}`);
    };

    const handleJoinMission = async () => {
        if (!selectedMission || isJoining) return;
        setIsJoining(true);
        try {
            await axios.post('http://localhost:5000/api/intelligence/join', {
                announcement_id: selectedMission.id,
                user_id: user.id
            });
            setAlert({ message: `Mission "${selectedMission.project_name}" Engaged. Proceed to Intelligence for secure comms.` });
            setSelectedMission(null);
            fetchAnnouncements();
        } catch (error) { setAlert({ message: 'Deployment Failure. Security clearance denied.' }); }
        finally { setIsJoining(false); }
    };

    const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '100px' }}>
            {alert && <OperationalAlert message={alert.message} onClose={() => setAlert(null)} />}

            <div style={{ marginBottom: isMobile ? '40px' : '60px' }}>
                <h2 className="heading-xl">Intelligence <br/><span style={{ color: 'var(--accent)' }}>Live Feed</span></h2>
                <p style={{ color: 'var(--text-muted)', fontWeight: '600', marginTop: '15px', fontSize: isMobile ? '0.85rem' : '1rem' }}>Global mission broadcasts and tactical opportunities.</p>
            </div>

            {/* TACTICAL CONTROL ROW */}
            <div style={{ 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between', 
                alignItems: isMobile ? 'stretch' : 'center', 
                marginBottom: isMobile ? '30px' : '50px', 
                gap: isMobile ? '20px' : '40px' 
            }}>
                {/* Tactical Network Pill Bar */}
                <div style={{ 
                    padding: isMobile ? '12px 20px' : '15px 35px', 
                    background: '#f8fafc', 
                    borderRadius: '100px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: isMobile ? '20px' : '40px',
                    border: '1px solid #f1f5f9',
                    flex: 1,
                    maxWidth: isMobile ? '100%' : '800px',
                    overflowX: 'auto',
                    scrollbarWidth: 'none'
                }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: '800', letterSpacing: '1px', color: 'var(--secondary)', opacity: 0.3, whiteSpace: 'nowrap' }}>TACTICAL NETWORK</div>
                    <div style={{ display: 'flex', gap: '4px', position: 'relative' }}>
                        {agents.map(agent => (
                            <div 
                                key={agent.id} 
                                onClick={() => handleSelectAgent(agent)}
                                style={{ 
                                    width: isMobile ? '32px' : '38px', 
                                    height: isMobile ? '32px' : '38px', 
                                    borderRadius: '50%', 
                                    overflow: 'hidden', 
                                    border: '2px solid #fff', 
                                    boxShadow: '0 4px 10px rgba(0,0,0,0.05)', 
                                    cursor: 'pointer', 
                                    flexShrink: 0,
                                    position: 'relative',
                                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' 
                                }}
                                onMouseEnter={(e) => { if (!isMobile) { e.currentTarget.style.transform = 'translateY(-10px) scale(1.2)'; e.currentTarget.style.zIndex = '100'; } }}
                                onMouseLeave={(e) => { if (!isMobile) { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.zIndex = '1'; } }}
                            >
                                {agent.avatar ? <img src={agent.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ background: 'var(--secondary)', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '0.7rem' }}>{agent.username[0]}</div>}
                            </div>
                        ))}
                    </div>
                </div>

                {/* TACTICAL SEARCH MANIFEST */}
                <div style={{ 
                    position: 'relative',
                    flex: isMobile ? '1' : '0 1 400px',
                    width: isMobile ? '100%' : 'auto'
                }}>
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '15px', 
                        background: '#ffffff',
                        border: '1px solid #f1f5f9',
                        padding: isMobile ? '12px 20px' : '15px 25px',
                        borderRadius: '100px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.02)',
                        transition: 'all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)'
                    }} 
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 15px 35px rgba(230, 208, 76, 0.1)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#f1f5f9'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.02)'; }}
                    >
                        <Search size={isMobile ? 18 : 20} style={{ color: 'var(--secondary)', opacity: 0.4 }} />
                        <input 
                            placeholder="QUERY MISSION MANIFEST..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                border: 'none',
                                background: 'transparent',
                                fontSize: isMobile ? '0.85rem' : '0.9rem',
                                fontWeight: '700',
                                color: 'var(--secondary)',
                                letterSpacing: '0.5px',
                                outline: 'none',
                                textTransform: 'uppercase',
                                width: '100%',
                                padding: 0
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* STATUS SELECTOR / SECTOR FILTERS */}
            <div style={{ marginBottom: isMobile ? '35px' : '50px', display: 'flex', gap: isMobile ? '10px' : '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: '900', letterSpacing: '2px', color: 'var(--secondary)', opacity: 0.4, marginRight: '15px', textTransform: 'uppercase' }}>SECTOR FILTER</div>
                {STATUS_FILTERS.map(filter => (
                    <button
                        key={filter}
                        onClick={() => setActiveFilter(filter)}
                        style={{
                            background: activeFilter === filter ? 'var(--secondary)' : '#ffffff',
                            color: activeFilter === filter ? 'white' : 'var(--secondary)',
                            border: `1px solid ${activeFilter === filter ? 'var(--secondary)' : '#f1f5f9'}`,
                            padding: isMobile ? '10px 20px' : '12px 28px',
                            fontSize: '0.65rem',
                            fontWeight: '900',
                            letterSpacing: '1px',
                            cursor: 'pointer',
                            borderRadius: '100px',
                            transition: 'all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)',
                            textTransform: 'uppercase',
                            boxShadow: activeFilter === filter ? '0 10px 20px rgba(0,72,66,0.15)' : '0 4px 10px rgba(0,0,0,0.02)'
                        }}
                        onMouseEnter={(e) => { 
                            if (activeFilter !== filter) {
                                e.currentTarget.style.borderColor = 'var(--accent)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 8px 20px rgba(230, 208, 76, 0.15)';
                            }
                        }}
                        onMouseLeave={(e) => { 
                            if (activeFilter !== filter) {
                                e.currentTarget.style.borderColor = '#f1f5f9';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.02)';
                            }
                        }}
                    >
                        {filter}
                    </button>
                ))}
            </div>

            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(calc(min(100%, 360px)), 1fr))', 
                gap: isMobile ? '20px' : '30px' 
            }}>
                {announcements.filter(a => {
                    const matchesFilter = activeFilter === "ALL" || (a.help_needed && a.help_needed.includes(activeFilter));
                    const matchesSearch = a.project_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                        a.description.toLowerCase().includes(searchQuery.toLowerCase());
                    return matchesFilter && matchesSearch;
                }).length > 0 ? announcements.filter(a => {
                    const matchesFilter = activeFilter === "ALL" || (a.help_needed && a.help_needed.includes(activeFilter));
                    const matchesSearch = a.project_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                        a.description.toLowerCase().includes(searchQuery.toLowerCase());
                    return matchesFilter && matchesSearch;
                }).map((ann) => {
                    const isMyProject = ann.user_id === user.id;
                    const alreadyJoined = !!ann.membership_id;
                    const isBlocked = !!ann.my_block_status;

                    return (
                        <div 
                            key={ann.id} 
                            className="blend-card"
                            style={{ 
                                padding: '0', 
                                display: 'flex', 
                                flexDirection: 'column', 
                                position: 'relative',
                                overflow: 'hidden',
                                transition: 'all 0.4s ease'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-10px)'; e.currentTarget.style.borderColor = 'var(--accent)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'transparent'; }}
                        >
                            <div style={{ padding: '35px 35px 25px 35px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '25px' }}>
                                    <div 
                                        onClick={() => handleSelectAgent({ id: ann.user_id, username: ann.username, avatar: ann.avatar, occupation: ann.occupation, email: ann.email })}
                                        style={{ display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer' }}
                                    >
                                        <div style={{ width: '45px', height: '45px', borderRadius: '14px', background: isMyProject ? 'var(--secondary)' : 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isMyProject ? '#fff' : 'var(--secondary)', boxShadow: '0 8px 20px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                                            {ann.avatar ? <img src={ann.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ fontWeight: '900', fontSize: '1rem' }}>{ann.username[0]}</div>}
                                        </div>
                                        <div>
                                            <h4 style={{ fontSize: '0.85rem', fontWeight: '900', color: 'var(--secondary)', margin: 0, letterSpacing: '-0.3px' }}>{ann.username}</h4>
                                            <p style={{ fontSize: '0.6rem', fontWeight: '800', color: 'var(--accent-dark)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{ann.occupation?.toUpperCase()}</p>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{ fontSize: '0.55rem', fontWeight: '950', letterSpacing: '1.5px', color: 'var(--accent-dark)', textTransform: 'uppercase', opacity: 0.8 }}>BROADCAST</span>
                                        <p style={{ margin: '2px 0 0 0', fontSize: '0.55rem', fontWeight: '700', color: 'var(--text-muted)' }}>{new Date(ann.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.5rem', fontWeight: '700', color: 'var(--secondary)', marginBottom: '15px', letterSpacing: '-0.5px', textTransform: 'uppercase', lineHeight: 1.1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ann.project_name}</h3>
                                
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '25px', minHeight: '20px' }}>
                                    {ann.help_needed && ann.help_needed.split(',').map(tag => (
                                        <span key={tag} style={{ fontSize: '0.55rem', fontWeight: '900', color: 'var(--secondary)', borderBottom: '1.5px solid var(--accent)', paddingBottom: '1px', letterSpacing: '0.2px' }}>#{tag.toUpperCase()}</span>
                                    ))}
                                </div>

                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.6', height: '4.8em', overflow: 'hidden', marginBottom: '25px', fontWeight: '500', opacity: 0.8 }}>{ann.description}</p>
                                
                                {ann.github_url && (
                                    <div style={{ marginBottom: '10px' }}>
                                        {(() => {
                                            const getSourceDetailsFromUrl = (url) => {
                                                if (!url) return { text: 'INTEL SOURCE', Icon: ExternalLink };
                                                const lowerUrl = url.toLowerCase();
                                                if (lowerUrl.includes('github.com')) return { text: 'GITHUB SOURCE', Icon: GithubIcon };
                                                if (lowerUrl.includes('figma.com')) return { text: 'FIGMA SOURCE', Icon: FigmaIcon };
                                                if (lowerUrl.includes('drive.google.com')) return { text: 'DRIVE SOURCE', Icon: DriveIcon };
                                                if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return { text: 'YOUTUBE SOURCE', Icon: YoutubeIcon };
                                                return { text: 'SECURE FILE', Icon: ExternalLink };
                                            };
                                            const { text, Icon } = getSourceDetailsFromUrl(ann.github_url);
                                            return (
                                                <a href={ann.github_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--secondary)', fontWeight: '800', fontSize: '0.65rem', textDecoration: 'none', letterSpacing: '1px' }}>
                                                    <Icon size={14} color="var(--accent-dark)" /> {text}
                                                </a>
                                            );
                                        })()}
                                    </div>
                                )}
                            </div>

                            <div style={{ marginTop: 'auto', background: '#f8fafc', padding: '20px 35px', borderTop: '1px solid #f1f5f9' }}>
                                {(() => {
                                    const OCCUPATION_TO_SKILL = {
                                        "Designer": "Design",
                                        "Developer": "Development",
                                        "Marketing Specialist": "Marketing",
                                        "Manager": "Strategy",
                                        "Photographer": "Photography",
                                        "Fashion Model": "Modeling",
                                        "Digital Stylist": "Styling",
                                        "Artist": "Design",
                                        "Producer": "Strategy"
                                    };
                                    const requiredTag = OCCUPATION_TO_SKILL[user.occupation];
                                    const isQualified = ann.help_needed && requiredTag && ann.help_needed.includes(requiredTag);

                                    if (isMyProject) {
                                        return (
                                            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: '900', letterSpacing: '1.5px', textTransform: 'uppercase', padding: '10px' }}>
                                                PERSONAL MISSION LOG
                                            </div>
                                        );
                                    }
                                    if (isBlocked) {
                                        return (
                                            <button disabled style={{ width: '100%', padding: '15px', border: 'none', background: '#fff1f2', color: '#e11d48', fontWeight: '900', fontSize: '0.7rem', letterSpacing: '1px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '12px' }}>
                                                <ShieldAlert size={14} /> ACCESS NEUTRALIZED
                                            </button>
                                        );
                                    }
                                    if (alreadyJoined) {
                                        return (
                                            <button disabled style={{ width: '100%', padding: '15px', border: '1px solid #e2e8f0', background: '#fff', color: 'var(--secondary)', fontWeight: '900', fontSize: '0.7rem', letterSpacing: '1px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: 0.6, borderRadius: '12px' }}>
                                                <CheckCircle size={14} /> CLEARANCE OBTAINED
                                            </button>
                                        );
                                    }
                                    if (!isQualified) {
                                        return (
                                            <button disabled style={{ width: '100%', padding: '15px', border: 'none', background: '#f1f5f9', color: 'var(--text-muted)', fontWeight: '900', fontSize: '0.7rem', letterSpacing: '1px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: 0.5, borderRadius: '12px' }}>
                                                <Lock size={14} /> ROLE NOT REQUESTED
                                            </button>
                                        );
                                    }
                                    return (
                                        <button onClick={() => setSelectedMission(ann)} style={{ width: '100%', padding: '18px', border: 'none', background: 'var(--secondary)', color: '#fff', fontWeight: '900', fontSize: '0.75rem', letterSpacing: '1.5px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', cursor: 'pointer', borderRadius: '12px', transition: 'all 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent-dark)'} onMouseLeave={(e) => e.currentTarget.style.background = 'var(--secondary)'}>
                                            ENGAGE MISSION <ArrowRight size={18} />
                                        </button>
                                    );
                                })()}
                            </div>
                        </div>
                    );
                }) : (
                    <div style={{ gridColumn: '1 / -1', padding: '100px 40px', textAlign: 'center', background: '#fff', borderRadius: '40px', border: '1px dashed var(--border)' }}>
                        <div style={{ width: '80px', height: '100px', margin: '0 auto 30px auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <Lock size={64} style={{ opacity: 0.1 }} />
                        </div>
                        <h3 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--secondary)', letterSpacing: '-1.5px' }}>Silence in the Hub</h3>
                        <p style={{ color: 'var(--text-muted)', fontWeight: '700', fontSize: '1rem', marginTop: '10px' }}>No active missions are currently broadcasting. Be the first to <span style={{ color: 'var(--accent-dark)' }}>Broadcast</span> a mission.</p>
                    </div>
                )}

            </div>


            {selectedMission && ReactDOM.createPortal(
                <div style={OverlayStyle}>
                    <div style={ModalStyle}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'var(--secondary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 30px auto' }}>
                            <Briefcase size={32} />
                        </div>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--secondary)', letterSpacing: '-1.5px', marginBottom: '15px' }}>Mission Briefing</h2>
                        <h3 style={{ fontSize: '1.2rem', color: 'var(--accent-dark)', fontWeight: '800', marginBottom: '30px', textTransform: 'uppercase' }}>{selectedMission.project_name}</h3>
                        
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: '1.7', marginBottom: '45px', fontWeight: '600' }}>
                           You are about to engage with {selectedMission.username}'s project. Upon action, you will obtain instant clearance for the mission's Intelligence Hub.
                        </p>

                        <div style={{ display: 'flex', gap: '20px' }}>
                            <button onClick={() => setSelectedMission(null)} style={{ flex: 1, padding: '22px', borderRadius: '18px', border: '1px solid #f1f5f9', background: 'transparent', color: 'var(--secondary)', fontWeight: '800', cursor: 'pointer' }}>ABORT MISSION</button>
                            <button onClick={handleJoinMission} className="btn-primary" style={{ flex: 2, padding: '22px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                                {isJoining ? 'PROCESSING...' : <>ENGAGE MISSION <ArrowRight size={20}/></>}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

const OverlayStyle = { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,40,36,0.3)', backdropFilter: 'blur(30px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' };
const ModalStyle = { background: '#fff', width: '100%', maxWidth: '700px', padding: '60px', borderRadius: '40px', boxShadow: '0 40px 120px rgba(0,0,0,0.3)', textAlign: 'center' };

export default Overview;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Briefcase, GitBranch, ArrowLeft, ExternalLink, Globe, Search } from 'lucide-react';
import { useLocation, useOutletContext } from 'react-router-dom';

const Nexus = () => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const agentIdFromUrl = queryParams.get('id');
    const { setCustomBreadcrumb } = useOutletContext() || {};

    const [agents, setAgents] = useState([]);
    const [selectedAgent, setSelectedAgent] = useState(null);
    const [portfolio, setPortfolio] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchAgents = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/users');
            setAgents(response.data);
        } catch (error) { console.error('Nexus network failure'); }
    };

    const fetchPortfolio = async (agentId) => {
        setLoading(true);
        try {
            const response = await axios.get(`http://localhost:5000/api/users/${agentId}/portfolio`);
            setPortfolio(response.data);
        } catch (error) { console.error('Portfolio retrieval failed'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchAgents(); }, []);

    useEffect(() => {
        if (agentIdFromUrl && agents.length > 0) {
            const agent = agents.find(a => a.id === parseInt(agentIdFromUrl));
            if (agent) {
                setSelectedAgent(agent);
                fetchPortfolio(agent.id);
            }
        }
    }, [agentIdFromUrl, agents]);

    const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleSelectAgent = (agent) => {
        setSelectedAgent(agent);
        fetchPortfolio(agent.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const filteredAgents = agents.filter(a => 
        a.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.occupation?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        if (selectedAgent && setCustomBreadcrumb) {
            setCustomBreadcrumb(
                <span 
                    onClick={() => setSelectedAgent(null)} 
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--secondary)' }}
                >
                    <ArrowLeft size={14} /> 
                    <span>L'BLEND / NEXUS / <span style={{ color: 'var(--accent-dark)' }}>{selectedAgent.username}</span></span>
                </span>
            );
        } else if (setCustomBreadcrumb) {
            setCustomBreadcrumb(null);
        }

        return () => {
            if (setCustomBreadcrumb) setCustomBreadcrumb(null);
        };
    }, [selectedAgent, setCustomBreadcrumb]);

    if (selectedAgent) {
        return (
            <div className="animate-fade-in" style={{ paddingBottom: '100px' }}>
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: isMobile ? '1fr' : 'minmax(350px, 1fr) 2fr', 
                    gap: isMobile ? '40px' : '80px', 
                    alignItems: 'start' 
                }}>
                    {/* Agent Sidebar (The Dossier Profile) */}
                    <div className="blend-card" style={{ 
                        padding: '0', 
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        background: '#fff'
                    }}>
                        <div style={{ height: '120px', background: 'linear-gradient(135deg, var(--secondary) 0%, #002a27 100%)', position: 'relative' }}>
                             <div style={{ position: 'absolute', bottom: '-50px', left: '50%', transform: 'translateX(-50%)', width: '120px', height: '120px', borderRadius: '32px', overflow: 'hidden', border: '5px solid #fff', boxShadow: '0 15px 35px rgba(0,0,0,0.1)' }}>
                                {selectedAgent.avatar ? <img src={selectedAgent.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ background: 'var(--secondary)', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '2.5rem' }}>{selectedAgent.username[0]}</div>}
                            </div>
                        </div>
                        
                        <div style={{ padding: '70px 40px 40px 40px', textAlign: 'center' }}>
                            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '2rem', fontWeight: '700', color: 'var(--secondary)', letterSpacing: '-1px', marginBottom: '8px', textTransform: 'uppercase' }}>{selectedAgent.username}</h2>
                            <p style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--accent-dark)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '35px' }}>{selectedAgent.occupation}</p>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left', borderTop: '1px solid #f1f5f9', paddingTop: '30px' }}>
                                <div>
                                    <p style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--secondary)', opacity: 0.3, letterSpacing: '1px', marginBottom: '10px' }}>SECURE CHANNEL</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <Globe size={18} color="var(--secondary)" />
                                        <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--secondary)' }}>{selectedAgent.email}</span>
                                    </div>
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--secondary)', opacity: 0.3, letterSpacing: '1px', marginBottom: '10px' }}>PERSONNEL BRIEFING</p>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.6', fontWeight: '600', margin: 0 }}>
                                        {selectedAgent.description || 'No operational briefing provided.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Agent Portfolio Content */}
                    <div>
                        <div style={{ marginBottom: isMobile ? '30px' : '50px' }}>
                            <h3 className="heading-lg">Combat <br/><span style={{ color: 'var(--accent)' }}>Portfolio</span></h3>
                            <div style={{ height: '3px', width: '80px', background: 'var(--secondary)', marginTop: '15px' }}></div>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                            {loading ? (
                                [1,2,3].map(i => <div key={i} style={{ height: '140px', background: '#fff', border: '1px solid #f0f3f5', opacity: 0.5 }} />)
                            ) : portfolio.length > 0 ? portfolio.map(project => (
                                <div key={project.id} className="blend-card" style={{ 
                                    padding: isMobile ? '25px' : '30px 40px', 
                                    display: 'flex', 
                                    flexDirection: isMobile ? 'column' : 'row',
                                    justifyContent: 'space-between', 
                                    alignItems: isMobile ? 'flex-start' : 'center', 
                                    gap: isMobile ? '20px' : '0',
                                    transition: 'all 0.3s'
                                }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'transparent'; }}>
                                    <div>
                                        <h4 style={{ fontFamily: "'Outfit', sans-serif", fontSize: isMobile ? '1.2rem' : '1.4rem', fontWeight: '700', color: 'var(--secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>{project.project_name}</h4>
                                        <div style={{ display: 'flex', gap: '20px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.65rem', fontWeight: '900', color: 'var(--accent-dark)', letterSpacing: '0.5px' }}>
                                                <GitBranch size={16} /> {project.branch_count} BRANCHES
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.65rem', fontWeight: '900', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
                                                <User size={16} /> {project.member_count} PERSONNEL
                                            </div>
                                        </div>
                                    </div>
                                    <a href={project.github_url} target="_blank" rel="noopener noreferrer" style={{ width: isMobile ? '100%' : '55px', height: '55px', border: '2px solid var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--secondary)', transition: 'all 0.3s', background: 'transparent' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--secondary)'; e.currentTarget.style.color = '#fff'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--secondary)'; }}>
                                        <ExternalLink size={20} />
                                        {isMobile && <span style={{ marginLeft: '10px', fontWeight: '900', fontSize: '0.7rem' }}>VIEW REPOSITORY</span>}
                                    </a>
                                </div>
                            )) : (
                                <div style={{ padding: isMobile ? '40px' : '80px', textAlign: 'center', background: '#f8fafc', borderRadius: 'var(--radius-lg)', border: '1px solid #f1f5f9' }}>
                                    <p style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '-0.5px' }}>Tactical log is currently empty for this agent.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '100px' }}>
            <div style={{ marginBottom: isMobile ? '40px' : '60px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: 'center', gap: isMobile ? '30px' : 0 }}>
                <div>
                     <h2 className="heading-xl">Personnel <span style={{ color: 'var(--accent)' }}>Network</span></h2>
                     <p style={{ color: 'var(--text-muted)', fontWeight: '600', marginTop: '10px', letterSpacing: '-0.3px', fontSize: isMobile ? '0.85rem' : '1.05rem' }}>Access the unified directory of high-clearance agents.</p>
                </div>
                
                <div className="input-group" style={{ width: isMobile ? '100%' : '450px', marginBottom: 0 }}>
                    <div style={{ position: 'relative' }}>
                        <Search style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'var(--secondary)', opacity: 0.4 }} size={isMobile ? 18 : 22} />
                        <input 
                            type="text" 
                            placeholder="Search agents..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ paddingLeft: isMobile ? '55px' : '65px', background: '#f8fafc' }}
                        />
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(calc(min(100%, 280px)), 1fr))', gap: '25px' }}>
                {filteredAgents.map(agent => (
                    <div 
                        key={agent.id} 
                        onClick={() => handleSelectAgent(agent)}
                        className="blend-card"
                        style={{ 
                            padding: '25px', 
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            textAlign: 'left',
                            gap: '15px',
                            transition: 'all 0.4s',
                            position: 'relative'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = 'var(--shadow-deep)'; e.currentTarget.style.borderColor = 'var(--accent)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-soft)'; e.currentTarget.style.borderColor = 'transparent'; }}
                    >
                        <div style={{ width: '100%', aspectRatio: '1 / 1', borderRadius: '32px', overflow: 'hidden', border: '4px solid #f8fafc', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', marginBottom: '10px' }}>
                            {agent.avatar ? <img src={agent.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ background: 'var(--secondary)', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '3rem' }}>{agent.username[0]}</div>}
                        </div>
                        
                        <div style={{ width: '100%' }}>
                            <h4 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.4rem', fontWeight: '800', color: 'var(--secondary)', margin: '0 0 5px 0', letterSpacing: '-0.5px', textTransform: 'uppercase' }}>{agent.username}</h4>
                            <p style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--accent-dark)', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>{agent.occupation || 'UNASSIGNED ROLE'}</p>
                            <p style={{ fontSize: '0.65rem', fontWeight: '700', color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', opacity: 0.6 }}>{agent.description || 'NO DESCRIPTION'}</p>
                        </div>

                        <div style={{ position: 'absolute', bottom: '25px', right: '25px', opacity: 0.15 }}>
                            <ArrowLeft style={{ transform: 'rotate(180deg)' }} size={20} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Nexus;

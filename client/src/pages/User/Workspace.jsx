import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import {
    Briefcase,
    Edit2,
    Trash2,
    X,
    Save,
    AlertTriangle,
    Check,
    UserPlus,
    UserCheck,
    Users,
    ChevronRight,
    Terminal,
    GitBranch
} from 'lucide-react';
import AuthService from '../../services/auth.service';
import ProjectWorkshop from './ProjectWorkshop';
import { useToast } from '../../components/ToastProvider';

const HELP_OPTIONS = ["Design", "Development", "Marketing", "Strategy", "Photography", "Modeling", "Styling"];

const Workspace = () => {
    const toast = useToast();
    const [allProjects, setAllProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [editingProject, setEditingProject] = useState(null);
    const [deletingProject, setDeletingProject] = useState(null);
    const [pendingRequests, setPendingRequests] = useState({});
    const [viewingRequests, setViewingRequests] = useState(null); // Project ID being viewed
    const [loading, setLoading] = useState(true);
    const [selectedFile, setSelectedFile] = useState(null);

    const user = AuthService.getCurrentUser();

    const fetchManifest = async () => {
        try {
            const response = await axios.get(`http://localhost:5000/api/intelligence/projects/${user.id}`);
            // Tiered Clearance: Only show owned projects OR projects where membership is accepted
            const vettedProjects = response.data.filter(p =>
                p.user_id === user.id || p.membership_accepted == 1
            );
            setAllProjects(vettedProjects);

            // For owned projects, fetch pending join requests
            vettedProjects.filter(p => p.user_id === user.id).forEach(proj => {
                fetchRequests(proj.id);
            });
        } catch (error) { console.error('Workspace Manifest Failure'); }
        finally { setLoading(false); }
    };

    const fetchRequests = async (projectId) => {
        try {
            const response = await axios.get(`http://localhost:5000/api/intelligence/requests/${projectId}`);
            setPendingRequests(prev => ({ ...prev, [projectId]: response.data }));
        } catch (err) { console.error('Request Manifest Failure'); }
    };

    const toggleRequests = (projectId) => {
        setViewingRequests(projectId);
    };

    useEffect(() => { fetchManifest(); }, [user.id]);

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            let finalUrl = editingProject.github_url;
            
            if (selectedFile) {
                const formData = new FormData();
                formData.append('file', selectedFile);
                const uploadRes = await axios.post('http://localhost:5000/api/upload-datafile', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                finalUrl = uploadRes.data.fileUrl;
            }

            await axios.put(`http://localhost:5000/api/announcements/${editingProject.id}`, {
                ...editingProject,
                github_url: finalUrl
            });
            setEditingProject(null);
            setSelectedFile(null);
            fetchManifest();
        } catch (err) { toast.error('Sync Failure'); }
    };

    const toggleEditHelp = (option) => {
        let currentHelp = editingProject.help_needed ? editingProject.help_needed.split(',') : [];
        if (currentHelp.includes(option)) {
            currentHelp = currentHelp.filter(h => h !== option);
        } else {
            currentHelp = [...currentHelp, option];
        }
        setEditingProject({ ...editingProject, help_needed: currentHelp.join(',') });
    };

    const confirmDelete = async () => {
        try {
            await axios.delete(`http://localhost:5000/api/announcements/${deletingProject.id}`);
            setDeletingProject(null);
            fetchManifest();
        } catch (err) { toast.error('Decommission Failure'); }
    };

    const handleAcceptRequest = async (memberLogId, projectId) => {
        try {
            await axios.post('http://localhost:5000/api/intelligence/accept', { memberLogId });
            fetchRequests(projectId);
            fetchManifest();
        } catch (err) { toast.error('Clearance Grant Failure'); }
    };

    const handleLeaveProject = async (project) => {
        const confirmed = await toast.confirm(`Leave collaboration project "${project.project_name}"?`);
        if (!confirmed) return;
        try {
            await axios.post('http://localhost:5000/api/intelligence/leave', {
                announcement_id: project.id,
                user_id: user.id
            });
            toast.success(`Successfully left collaboration project "${project.project_name}"`);
            fetchManifest();
        } catch (err) {
            toast.error('Failed to leave the collaboration project');
        }
    };

    const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (selectedProject) return <ProjectWorkshop project={selectedProject} onBack={() => setSelectedProject(null)} />;

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '100px' }}>
            <div style={{ marginBottom: isMobile ? '40px' : '60px' }}>
                <h2 className="heading-xl">Digital <br /><span style={{ color: 'var(--accent-dark)' }}>Workspace</span></h2>
                <p style={{ color: 'var(--text-muted)', fontWeight: '600', marginTop: '15px', fontSize: isMobile ? '0.85rem' : '1rem' }}>Your personal missions and active collaborations.</p>
            </div>

            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(calc(min(100%, 400px)), 1fr))', 
                gap: isMobile ? '25px' : '40px' 
            }}>
                {allProjects.length > 0 ? allProjects.map((project) => {
                    const isOwner = project.user_id === user.id;
                    const hasRequests = isOwner && pendingRequests[project.id]?.length > 0;

                    return (
                        <div key={project.id} className="blend-card" style={{ 
                            padding: '0', 
                            overflow: 'hidden', 
                            display: 'flex', 
                            flexDirection: 'column',
                            position: 'relative',
                            transition: 'all 0.4s'
                        }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.borderColor = 'var(--accent)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'transparent'; }}>
                            
                            <div style={{ padding: '35px 35px 25px 35px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '25px' }}>
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ width: '45px', height: '45px', borderRadius: '14px', background: isOwner ? 'var(--secondary)' : 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isOwner ? '#fff' : 'var(--secondary)', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }}>
                                            {isOwner ? <Briefcase size={20} /> : <Terminal size={20} />}
                                        </div>
                                        {hasRequests && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); toggleRequests(project.id); }}
                                                title={`${pendingRequests[project.id].length} Pending Clearance Requests`}
                                                className="pulse-badge"
                                                style={{ 
                                                    position: 'absolute', 
                                                    top: '-6px', 
                                                    right: '-6px', 
                                                    background: '#e11d48', 
                                                    color: '#fff', 
                                                    border: '2px solid #fff', 
                                                    borderRadius: '50%', 
                                                    width: '20px', 
                                                    height: '20px', 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    justifyContent: 'center', 
                                                    cursor: 'pointer', 
                                                    fontSize: '0.6rem', 
                                                    fontWeight: '900',
                                                    boxShadow: '0 4px 10px rgba(225,29,72,0.3)',
                                                    zIndex: 10
                                                }}
                                            >
                                                {pendingRequests[project.id].length}
                                            </button>
                                        )}
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{ fontSize: '0.6rem', fontWeight: '800', letterSpacing: '1.5px', color: 'var(--accent-dark)', textTransform: 'uppercase', opacity: 0.8 }}>{isOwner ? 'COMMANDER' : 'COLLABORATOR'}</span>
                                        {!isOwner && <p style={{ margin: '2px 0 0 0', fontSize: '0.6rem', fontWeight: '700', color: 'var(--text-muted)' }}>Lead: {project.owner_name}</p>}
                                    </div>
                                </div>

                                <h4 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.6rem', fontWeight: '700', color: 'var(--secondary)', marginBottom: '15px', letterSpacing: '-0.5px', textTransform: 'uppercase', lineHeight: 1.1 }}>{project.project_name}</h4>
                                
                                <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.65rem', fontWeight: '800', color: 'var(--secondary)', opacity: 0.5 }}>
                                        <GitBranch size={14} /> {project.branch_count} BRANCHES
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.65rem', fontWeight: '800', color: 'var(--secondary)', opacity: 0.5 }}>
                                        <Users size={14} /> {project.member_count} PERSONNEL
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', background: '#f8fafc', padding: '15px 35px', gap: '15px', borderTop: '1px solid #f1f5f9' }}>
                                <button
                                    onClick={() => setSelectedProject(project)}
                                    style={{
                                        flex: 1,
                                        padding: '16px',
                                        background: 'var(--secondary)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '12px',
                                        fontWeight: '800',
                                        fontSize: '0.75rem',
                                        letterSpacing: '1.5px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '10px',
                                        transition: 'all 0.3s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent-dark)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'var(--secondary)'}
                                >
                                    ACCESS HUB <ChevronRight size={16} />
                                </button>
                                
                                {isOwner && (
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={() => setEditingProject(project)} style={{ background: '#fff', border: '1px solid #e2e8f0', width: '48px', height: '48px', borderRadius: '12px', cursor: 'pointer', color: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'} onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}><Edit2 size={18} /></button>
                                        <button onClick={() => setDeletingProject(project)} style={{ background: '#fff', border: '1px solid #e2e8f0', width: '48px', height: '48px', borderRadius: '12px', cursor: 'pointer', color: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = '#e11d48'} onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}><Trash2 size={18} /></button>
                                    </div>
                                )}
                                {!isOwner && (
                                    <button 
                                        onClick={() => handleLeaveProject(project)} 
                                        style={{ 
                                            background: '#fff', 
                                            border: '1px solid #fecdd3', 
                                            width: '48px', 
                                            height: '48px', 
                                            borderRadius: '12px', 
                                            cursor: 'pointer', 
                                            color: '#e11d48', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            gap: '8px',
                                            fontWeight: '800',
                                            fontSize: '0.7rem',
                                            letterSpacing: '0.5px',
                                            transition: 'all 0.3s',
                                            whiteSpace: 'nowrap'
                                        }} 
                                        title="Leave Collaboration" 
                                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#e11d48'; e.currentTarget.style.background = '#fff1f2'; }} 
                                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#fecdd3'; e.currentTarget.style.background = '#fff'; }}
                                    >
                                        <X size={16} /> LEAVE
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                }) : (
                    <div style={{ gridColumn: '1 / -1', padding: '120px 40px', textAlign: 'center', background: '#fff', borderRadius: '40px', border: '1px dashed var(--border)' }}>
                        <div style={{ width: '80px', height: '100px', margin: '0 auto 30px auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <Briefcase size={64} style={{ opacity: 0.1 }} />
                        </div>
                        <h3 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--secondary)', letterSpacing: '-1.5px' }}>No Missions Commissioned</h3>
                        <p style={{ color: 'var(--text-muted)', fontWeight: '700', fontSize: '1rem', marginTop: '10px' }}>Proceed to <span style={{ color: 'var(--accent-dark)' }}>Broadcast</span> or <span style={{ color: 'var(--accent-dark)' }}>Overview</span> to initiate a mission.</p>
                    </div>
                )}
            </div>

            {/* PORTAL OVERLAYS SAME AS BEFORE */}
            {editingProject && ReactDOM.createPortal(
                <div style={OverlayStyle}>
                    <div style={ModalStyle}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
                            <h2 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--secondary)', letterSpacing: '-1.5px' }}>Update <span style={{ color: 'var(--accent-dark)' }}>Mission</span></h2>
                            <button onClick={() => setEditingProject(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.5 }}><X size={28} /></button>
                        </div>

                        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div className="input-group">
                                <label>PROJECT IDENTITY</label>
                                <input maxLength={30} value={editingProject.project_name} onChange={(e) => setEditingProject({ ...editingProject, project_name: e.target.value })} />
                            </div>

                            <div className="input-group">
                                <label>INTEL SOURCE (URL OR FILE)</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '5px' }}>
                                    {editingProject.github_url?.startsWith('http://localhost:5000/datafiles/') ? (
                                        <div style={{ ...InputStyle, background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {editingProject.github_url.split('/').pop()}
                                            </span>
                                            <button 
                                                type="button" 
                                                onClick={() => { setEditingProject({...editingProject, github_url: ''}); setSelectedFile(null); }} 
                                                style={{ background: '#fff1f2', border: 'none', color: '#e11d48', cursor: 'pointer', marginLeft: 'auto', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            >
                                                <X size={16}/>
                                            </button>
                                        </div>
                                    ) : (
                                        <input 
                                            type="text" 
                                            placeholder="Update URL (e.g. GitHub, Drive)..." 
                                            value={editingProject.github_url || ''} 
                                            onChange={(e) => { setEditingProject({ ...editingProject, github_url: e.target.value }); setSelectedFile(null); }} 
                                            style={InputStyle} 
                                        />
                                    )}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                                        <span style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-muted)' }}>OR REPLACE WITH FILE:</span>
                                    </div>
                                </div>
                            </div>

                            <div className="input-group">
                                <label>SUPPORT REQUIRED</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '15px' }}>
                                    {HELP_OPTIONS.map(option => (
                                        <div
                                            key={option}
                                            onClick={() => toggleEditHelp(option)}
                                            style={{
                                                padding: '10px 18px', borderRadius: '100px', cursor: 'pointer', transition: 'all 0.3s',
                                                background: editingProject.help_needed?.includes(option) ? 'var(--secondary)' : '#f1f5f9',
                                                color: editingProject.help_needed?.includes(option) ? 'white' : 'var(--secondary)',
                                                fontSize: '0.75rem', fontWeight: '800'
                                            }}
                                        >
                                            {editingProject.help_needed?.includes(option) && <Check size={14} style={{ marginRight: '6px' }} />}
                                            {option.toUpperCase()}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="input-group">
                                <label>MISSION OBJECTIVES</label>
                                <textarea maxLength={300} value={editingProject.description} onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })} style={{ minHeight: '120px' }} />
                            </div>

                            <button type="submit" className="btn-primary" style={BtnStyle}><Save size={20} /> SYNCHRONIZE CHANGES</button>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {deletingProject && ReactDOM.createPortal(
                <div style={OverlayStyle}>
                    <div style={{ ...ModalStyle, maxWidth: '500px', textAlign: 'center' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#fff1f2', color: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 30px auto' }}>
                            <AlertTriangle size={40} />
                        </div>
                        <h3 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--secondary)', marginBottom: '15px' }}>Decommission Mission?</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '40px', fontWeight: '600' }}>This will permanently erase all mission logs and data from the network.</p>
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <button onClick={() => setDeletingProject(null)} style={{ flex: 1, padding: '18px', borderRadius: '12px', border: '1px solid var(--border)', background: 'transparent', fontWeight: '800', cursor: 'pointer' }}>CANCEL</button>
                            <button onClick={confirmDelete} style={{ flex: 1, padding: '18px', borderRadius: '12px', border: 'none', background: '#e11d48', color: 'white', fontWeight: '800', cursor: 'pointer' }}>EXECUTE DELETE</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* REQUESTS PORTAL MODAL */}
            {viewingRequests && pendingRequests[viewingRequests] && ReactDOM.createPortal(
                <div style={OverlayStyle}>
                    <div style={{ ...ModalStyle, maxWidth: '600px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px', alignItems: 'center' }}>
                            <div>
                                <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--secondary)', letterSpacing: '-1px', marginBottom: '5px' }}>Clearance <span style={{ color: 'var(--accent-dark)' }}>Queue</span></h2>
                                <p style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>Granting access to current mission parameters.</p>
                            </div>
                            <button onClick={() => setViewingRequests(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.5 }}><X size={24} /></button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {pendingRequests[viewingRequests].map(req => (
                                <div key={req.id} className="blend-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <div style={{ width: '50px', height: '50px', borderRadius: '15px', background: 'var(--secondary)', overflow: 'hidden' }}>
                                            {req.avatar ? <img src={req.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ textAlign: 'center', color: 'white', lineHeight: '50px', fontSize: '1.2rem', fontWeight: '800' }}>{req.username[0]}</div>}
                                        </div>
                                        <div>
                                            <p style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: 'var(--secondary)' }}>{req.username}</p>
                                            <p style={{ margin: 0, fontSize: '0.65rem', fontWeight: '700', color: 'var(--accent-dark)', textTransform: 'uppercase' }}>{req.occupation}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleAcceptRequest(req.id, viewingRequests)} 
                                        className="btn-primary" 
                                        style={{ padding: '12px 25px', fontSize: '0.75rem', borderRadius: '10px' }}
                                    >
                                        GRANT ACCESS
                                    </button>
                                </div>
                            ))}
                            {pendingRequests[viewingRequests].length === 0 && (
                                <div style={{ textAlign: 'center', padding: '40px' }}>
                                    <p style={{ color: 'var(--text-muted)', fontWeight: '700' }}>Queue successfully cleared.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

const OverlayStyle = { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,40,36,0.3)', backdropFilter: 'blur(30px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '20px' };
const ModalStyle = { background: '#fff', width: '100%', maxWidth: '750px', padding: '60px', borderRadius: '40px', boxShadow: '0 40px 120px rgba(0,0,0,0.3)', position: 'relative' };
const LabelStyle = { fontSize: '0.7rem', fontWeight: '800', letterSpacing: '2px', color: 'var(--secondary)', opacity: 0.5 };
const InputStyle = { width: '100%', border: 'none', borderBottom: '2px solid #f1f5f9', padding: '12px 0', fontSize: '1.2rem', fontWeight: '800', color: 'var(--secondary)', outline: 'none', marginTop: '10px' };
const BtnStyle = { marginTop: '20px', borderRadius: '16px', padding: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', fontSize: '1rem' };

export default Workspace;

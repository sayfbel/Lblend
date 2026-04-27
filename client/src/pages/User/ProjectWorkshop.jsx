import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import {
    ArrowLeft,
    GitBranch,
    Send,
    Plus,
    Clock,
    Terminal,
    ChevronRight,
    User,
    Shield,
    Activity,
    Cpu,
    RefreshCw,
    File,
    X,
    Paperclip,
    ExternalLink,
    Image,
    FileText,
    Edit2,
    Trash2,
    Check,
    Maximize
} from 'lucide-react';

// Helper: detect URLs in text and return JSX with clickable links
const linkifyText = (text) => {
    if (!text) return text;
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const parts = text.split(urlRegex);
    return parts.map((part, i) => {
        if (urlRegex.test(part)) {
            // Determine icon based on domain
            let label = 'Link';
            if (part.includes('youtube.com') || part.includes('youtu.be')) label = 'YouTube';
            else if (part.includes('drive.google.com')) label = 'Google Drive';
            else if (part.includes('github.com')) label = 'GitHub';
            else if (part.includes('figma.com')) label = 'Figma';
            else { try { label = new URL(part).hostname.replace('www.', ''); } catch(e) {} }
            return (
                <a
                    key={i}
                    href={part}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        background: 'rgba(0,72,66,0.06)', color: 'var(--secondary)',
                        padding: '4px 12px', borderRadius: '8px', fontSize: '0.75rem',
                        fontWeight: '800', textDecoration: 'none', margin: '0 2px',
                        border: '1px solid rgba(0,72,66,0.1)', transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--secondary)'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,72,66,0.06)'; e.currentTarget.style.color = 'var(--secondary)'; }}
                >
                    <ExternalLink size={12} /> {label}
                </a>
            );
        }
        return <span key={i}>{part}</span>;
    });
};

// Helper: get file name from URL
const getFileName = (url) => {
    if (!url) return '';
    return decodeURIComponent(url.split('/').pop());
};

// Helper: check if file is an image
const isImageFile = (url) => {
    if (!url) return false;
    return /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(url);
};
import AuthService from '../../services/auth.service';
import GitGraph from '../../components/GitGraph';
import { useToast } from '../../components/ToastProvider';

const GithubIcon = ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
    </svg>
);

const ProjectWorkshop = ({ project, onBack }) => {
    const toast = useToast();
    const [internalBranches, setInternalBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [commits, setCommits] = useState([]);
    const [newBranchName, setNewBranchName] = useState('');
    const [newCommitMsg, setNewCommitMsg] = useState('');
    const [commitFile, setCommitFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState('INTERNAL'); // INTERNAL or EXTERNAL
    const [githubData, setGithubData] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [syncing, setSyncing] = useState(false);

    // Context Menu State
    const [contextMenu, setContextMenu] = useState(null); // { x, y, type: 'branch'|'commit', item }
    const [renaming, setRenaming] = useState(null); // { type: 'branch'|'commit', id, value }
    const [fullscreenImage, setFullscreenImage] = useState(null);
    const renameInputRef = useRef(null);

    // Close context menu on click anywhere or Escape
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        const handleKey = (e) => { if (e.key === 'Escape') { setContextMenu(null); setRenaming(null); } };
        document.addEventListener('click', handleClick);
        document.addEventListener('keydown', handleKey);
        return () => { document.removeEventListener('click', handleClick); document.removeEventListener('keydown', handleKey); };
    }, []);

    // Focus rename input ONLY when it first opens
    useEffect(() => {
        if (renaming && renameInputRef.current) {
            renameInputRef.current.focus();
            renameInputRef.current.select();
        }
    }, [renaming?.id, renaming?.type]); // Only trigger when the target item changes, not the value

    // Context menu handlers
    const handleBranchContextMenu = (e, branch) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ x: e.clientX, y: e.clientY, type: 'branch', item: branch });
    };

    const handleCommitContextMenu = (e, commit) => {
        e.preventDefault();
        e.stopPropagation();
        if (commit.sha) return; // Don't allow editing external GitHub commits
        setContextMenu({ x: e.clientX, y: e.clientY, type: 'commit', item: commit });
    };

    // Branch CRUD
    const handleRenameBranch = async () => {
        if (!renaming || renaming.type !== 'branch' || !renaming.value.trim()) return;
        try {
            await axios.put(`http://localhost:5000/api/workshop/branches/${renaming.id}`, { name: renaming.value.trim() });
            toast.success('Branch renamed successfully');
            setRenaming(null);
            // Update selected branch name if it was the one renamed
            if (selectedBranch?.id === renaming.id) {
                setSelectedBranch(prev => ({ ...prev, name: renaming.value.trim() }));
            }
            await fetchInternalBranches();
        } catch (err) { toast.error('Failed to rename branch'); }
    };

    const handleDeleteBranch = async (branch) => {
        const confirmed = await toast.confirm(`Delete branch "${branch.name}"? All commits in this branch will be lost.`);
        if (!confirmed) return;
        try {
            await axios.delete(`http://localhost:5000/api/workshop/branches/${branch.id}`);
            toast.success('Branch deleted');
            if (selectedBranch?.id === branch.id) {
                setSelectedBranch(null);
                setCommits([]);
            }
            await fetchInternalBranches();
        } catch (err) { toast.error('Failed to delete branch'); }
    };

    // Commit CRUD
    const handleEditCommit = async () => {
        if (!renaming || renaming.type !== 'commit' || !renaming.value.trim()) return;
        setLoading(true);
        try {
            let finalFileUrl = renaming.file_url;

            // If a new file is selected, upload it
            if (renaming.newFile) {
                const formData = new FormData();
                formData.append('file', renaming.newFile);
                const uploadRes = await axios.post('http://localhost:5000/api/upload-datafile', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                finalFileUrl = uploadRes.data.fileUrl;
            }

            await axios.put(`http://localhost:5000/api/workshop/commits/${renaming.id}`, { 
                message: renaming.value.trim(),
                file_url: finalFileUrl 
            });
            
            toast.success('Commit updated');
            setRenaming(null);
            if (selectedBranch) await fetchCommits(selectedBranch.id);
        } catch (err) { 
            toast.error('Failed to update commit'); 
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCommit = async (commit) => {
        const confirmed = await toast.confirm(`Delete this commit? This action cannot be undone.`);
        if (!confirmed) return;
        try {
            await axios.delete(`http://localhost:5000/api/workshop/commits/${commit.id}`);
            toast.success('Commit deleted');
            if (selectedBranch) await fetchCommits(selectedBranch.id);
        } catch (err) { toast.error('Failed to delete commit'); }
    };

    const currentUser = AuthService.getCurrentUser() || { id: 0 };

    const fetchInternalBranches = async () => {
        try {
            const response = await axios.get(`http://localhost:5000/api/workshop/branches/${project.id}`);
            setInternalBranches(response.data);
            if (response.data.length > 0 && !selectedBranch) {
                const mainBranch = response.data.find(b => b.name === 'main');
                setSelectedBranch(mainBranch || response.data[0]);
            }
        } catch (error) { console.error('Error fetching internal branches'); }
    };

    const fetchCommits = async (branchId) => {
        try {
            const response = await axios.get(`http://localhost:5000/api/workshop/commits/${branchId}`);
            setCommits(response.data);
        } catch (error) { console.error('Error fetching commits'); }
    };

    const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => { fetchInternalBranches(); }, [project.id]);

    useEffect(() => {
        if (project?.id) { /* mission sync trigger */ }
    }, [project.id]);

    useEffect(() => {
        if (selectedBranch) { fetchCommits(selectedBranch.id); }
    }, [selectedBranch]);

    const handleCreateBranch = async (e) => {
        e.preventDefault();
        if (!newBranchName) return;
        setLoading(true);
        try {
            await axios.post('http://localhost:5000/api/workshop/branches', {
                project_id: project.id,
                name: newBranchName,
                user_id: currentUser.id
            });
            setNewBranchName('');
            await fetchInternalBranches();
        } catch (error) { toast.error('Failed to create branch'); }
        finally { setLoading(false); }
    };

    const handleAddCommit = async (e) => {
        e.preventDefault();
        if (!newCommitMsg || !selectedBranch) return;
        setLoading(true);
        try {
            let fileUrl = null;

            // Upload file first if one is selected
            if (commitFile) {
                const formData = new FormData();
                formData.append('file', commitFile);
                const uploadRes = await axios.post('http://localhost:5000/api/upload-datafile', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                fileUrl = uploadRes.data.fileUrl;
            }

            await axios.post('http://localhost:5000/api/workshop/commits', {
                branch_id: selectedBranch.id,
                user_id: currentUser.id,
                message: newCommitMsg,
                file_url: fileUrl
            });
            setNewCommitMsg('');
            setCommitFile(null);
            await fetchCommits(selectedBranch.id);
        } catch (error) { toast.error('Failed to add commit'); }
        finally { setLoading(false); }
    };

    // Blocked file types (no videos)
    const BLOCKED_EXTENSIONS = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.webm', '.m4v', '.3gp'];
    const ALLOWED_FILE_TYPES = 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.psd,.ai,.sketch,.fig,.svg';

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const ext = '.' + file.name.split('.').pop().toLowerCase();
        if (BLOCKED_EXTENSIONS.includes(ext)) {
            toast.warning('Video files are not allowed. Please upload images or documents.');
            e.target.value = '';
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            toast.warning('File size must not exceed 10MB.');
            e.target.value = '';
            return;
        }
        setCommitFile(file);
    };

    const analyzeGitHub = async () => {
        if (!project.github_url) return;
        setAnalyzing(true);
        try {
            const response = await axios.get(`http://localhost:5000/api/github/analyze?url=${encodeURIComponent(project.github_url)}`);
            setGithubData(response.data);
            setViewMode('EXTERNAL');
        } catch (error) {
            console.error('Analysis error:', error);
            toast.error(error.response?.data?.message || 'Failed to analyze repository');
        } finally {
            setAnalyzing(false);
        }
    };

    const syncGitHub = async () => {
        if (!project.github_url || syncing) return;
        setSyncing(true);
        try {
            // 1. Sync to Database
            await axios.post('http://localhost:5000/api/github/sync', {
                url: project.github_url,
                projectId: project.id,
                userId: currentUser.id
            });

            // 2. Refresh Visual Graph (External Intel)
            const response = await axios.get(`http://localhost:5000/api/github/analyze?url=${encodeURIComponent(project.github_url)}`);
            setGithubData(response.data);

            // 3. Refresh Local Lists (Internal Engine)
            await fetchInternalBranches();
            if (selectedBranch) await fetchCommits(selectedBranch.id);

            toast.success('Digital Infrastructure Synchronized!');
        } catch (error) {
            toast.error('Synchronization failed.');
        } finally {
            setSyncing(false);
        }
    };

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '100px' }}>
            <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: '800', fontSize: '0.7rem', marginBottom: isMobile ? '25px' : '40px', letterSpacing: '1px' }}>
                <ArrowLeft size={14} /> BACK TO MISSIONS
            </button>

            <div style={{ marginBottom: isMobile ? '40px' : '60px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                    <h2 className="heading-xl">{project.project_name}</h2>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
                        <div style={{ padding: '8px 18px', background: 'var(--accent)', color: 'var(--secondary)', borderRadius: '100px', fontSize: '0.6rem', fontWeight: '900', letterSpacing: '1px' }}>LAB / WORKSHOP</div>
                        <div style={{ padding: '8px 18px', background: 'var(--secondary)', color: 'white', borderRadius: '100px', fontSize: '0.6rem', fontWeight: '900', letterSpacing: '1px' }}>CLEARANCE: {project.user_id === currentUser.id ? 'ADMIRAL' : 'RECRUIT'}</div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', background: '#f1f5f9', padding: '6px', borderRadius: '16px' }}>
                    <button
                        onClick={() => setViewMode('INTERNAL')}
                        style={{
                            padding: '12px 20px',
                            borderRadius: '12px',
                            border: 'none',
                            background: viewMode === 'INTERNAL' ? '#fff' : 'transparent',
                            color: 'var(--secondary)',
                            fontWeight: '800',
                            fontSize: '0.7rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: viewMode === 'INTERNAL' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                            transition: 'all 0.3s'
                        }}
                    >
                        <Cpu size={16} /> INTERNAL ENGINE
                    </button>
                    <button
                        onClick={() => { if (githubData) setViewMode('EXTERNAL'); else analyzeGitHub(); }}
                        disabled={!project.github_url || analyzing}
                        style={{
                            padding: '12px 20px',
                            borderRadius: '12px',
                            border: 'none',
                            background: viewMode === 'EXTERNAL' ? '#fff' : 'transparent',
                            color: !project.github_url ? 'var(--text-muted)' : 'var(--secondary)',
                            fontWeight: '800',
                            fontSize: '0.7rem',
                            cursor: project.github_url ? 'pointer' : 'not-allowed',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: viewMode === 'EXTERNAL' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                            transition: 'all 0.3s',
                            opacity: !project.github_url ? 0.4 : 1
                        }}
                    >
                        {analyzing ? <RefreshCw size={16} className="animate-spin" /> : <GithubIcon size={16} />}
                        {githubData ? 'EXTERNAL INTEL' : 'ANALYZE GITHUB'}
                    </button>
                </div>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: viewMode === 'INTERNAL' && !isMobile ? '360px 1fr' : '1fr',
                gap: isMobile ? '40px' : '50px'
            }}>
                {viewMode === 'INTERNAL' ? (
                    <>
                        {/* BRANCH SYSTEM */}
                        <div>
                            <h4 style={{ fontSize: '0.7rem', fontWeight: '900', letterSpacing: '2px', color: 'var(--secondary)', marginBottom: '25px', opacity: 0.4 }}>BRANCH ENGINE</h4>

                            <form onSubmit={handleCreateBranch} style={{ marginBottom: '30px' }}>
                                <div className="input-group" style={{ position: 'relative', display: 'flex', gap: '10px' }}>
                                    <div style={{ position: 'relative', flex: 1 }}>
                                        <input
                                            type="text"
                                            placeholder="Found new branch..."
                                            value={newBranchName}
                                            onChange={(e) => setNewBranchName(e.target.value)}
                                            style={{ paddingRight: '50px', background: '#ffffff', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', marginBottom: 0 }}
                                        />
                                        <button type="submit" disabled={loading} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'var(--secondary)', color: 'white', padding: '10px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Plus size={16} />
                                        </button>
                                    </div>

                                    {project.github_url && (
                                        <button
                                            type="button"
                                            onClick={syncGitHub}
                                            disabled={syncing}
                                            title="Sync GitHub Intel"
                                            style={{
                                                width: '52px',
                                                height: '52px',
                                                borderRadius: '16px',
                                                background: 'var(--accent)',
                                                color: 'var(--secondary)',
                                                border: 'none',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                boxShadow: '0 8px 20px rgba(0,0,0,0.05)',
                                                flexShrink: 0,
                                                transition: 'all 0.3s'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.transform = 'rotate(180deg)'}
                                            onMouseLeave={(e) => e.currentTarget.style.transform = 'rotate(0deg)'}
                                        >
                                            <RefreshCw size={20} className={syncing ? "animate-spin" : ""} />
                                        </button>
                                    )}
                                </div>
                            </form>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {internalBranches.map(branch => {
                                    const isMyBranch = branch.user_id === currentUser.id;

                                    return (
                                        <div
                                            key={branch.id}
                                            onClick={() => setSelectedBranch(branch)}
                                            onContextMenu={(e) => handleBranchContextMenu(e, branch)}
                                            style={{
                                                padding: '15px 20px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                                                background: selectedBranch?.id === branch.id ? 'var(--secondary)' : '#ffffff',
                                                color: selectedBranch?.id === branch.id ? 'white' : 'var(--secondary)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                transition: 'all 0.4s',
                                                border: isMyBranch && selectedBranch?.id !== branch.id ? '1px solid var(--accent)' : '1px solid transparent'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                                                    {branch.avatar ? <img src={branch.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <GitBranch size={16} style={{ margin: '7px' }} />}
                                                </div>
                                                <div>
                                                    {renaming?.type === 'branch' && renaming?.id === branch.id ? (
                                                        <form onSubmit={(e) => { e.preventDefault(); handleRenameBranch(); }} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                                            <input
                                                                ref={renameInputRef}
                                                                value={renaming.value}
                                                                onChange={(e) => setRenaming({ ...renaming, value: e.target.value })}
                                                                onClick={(e) => e.stopPropagation()}
                                                                style={{
                                                                    width: '140px', padding: '4px 8px', borderRadius: '6px',
                                                                    border: '2px solid var(--accent)', fontSize: '0.85rem',
                                                                    fontWeight: '800', color: 'var(--secondary)', outline: 'none',
                                                                    background: '#fff'
                                                                }}
                                                            />
                                                            <button type="submit" onClick={(e) => e.stopPropagation()} style={{ background: '#ecfdf5', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '4px', cursor: 'pointer', display: 'flex', color: '#059669' }}><Check size={14} /></button>
                                                            <button type="button" onClick={(e) => { e.stopPropagation(); setRenaming(null); }} style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '6px', padding: '4px', cursor: 'pointer', display: 'flex', color: '#e11d48' }}><X size={14} /></button>
                                                        </form>
                                                    ) : (
                                                        <>
                                                            <p style={{ fontWeight: '800', fontSize: '0.9rem', margin: 0, letterSpacing: '-0.5px' }}>{branch.name}</p>
                                                            <span style={{ fontSize: '0.55rem', fontWeight: '900', opacity: 0.5 }}>{branch.username || 'SYSTEM'}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            {selectedBranch?.id === branch.id && !renaming && <ChevronRight size={16} />}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* TIMELINE AREA */}
                        <div>
                            {selectedBranch ? (
                                <div className="animate-fade-in">
                                    <div className="blend-card" style={{ padding: isMobile ? '25px' : '40px', marginBottom: isMobile ? '30px' : '50px', boxShadow: '0 10px 40px rgba(0,0,0,0.02)' }}>
                                        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: '35px', gap: isMobile ? '15px' : '0' }}>
                                            <h3 style={{ fontSize: isMobile ? '1.4rem' : '1.8rem', fontWeight: '900', color: 'var(--secondary)', letterSpacing: '-1px' }}>{selectedBranch.name} <span style={{ color: 'var(--border)', fontWeight: '400' }}>/</span> Archive</h3>
                                            <div style={{ padding: '6px 14px', background: '#f8fafc', borderRadius: '100px', fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-muted)' }}>{commits.length} DIGITAL COMMITS</div>
                                        </div>

                                        <form onSubmit={handleAddCommit} style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '15px' }}>
                                            <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                                                <input
                                                    type="text"
                                                    placeholder="Broadcast new mission update..."
                                                    value={newCommitMsg}
                                                    onChange={(e) => setNewCommitMsg(e.target.value)}
                                                    style={{ borderRadius: '18px' }}
                                                />
                                            </div>
                                            <button type="submit" disabled={loading} className="btn-primary" style={{ width: isMobile ? '100%' : 'auto', padding: '15px 40px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                                                <Send size={20} />
                                            </button>

                                            {/* FILE ATTACHMENT BUTTON */}
                                            <input
                                                id="commit-file-upload"
                                                type="file"
                                                accept={ALLOWED_FILE_TYPES}
                                                onChange={handleFileSelect}
                                                style={{ display: 'none' }}
                                            />
                                            {commitFile ? (
                                                <button
                                                    type="button"
                                                    onClick={() => { setCommitFile(null); document.getElementById('commit-file-upload').value = ''; }}
                                                    title={`Remove: ${commitFile.name}`}
                                                    style={{
                                                        width: isMobile ? '100%' : 'auto', padding: '15px 25px', borderRadius: '18px',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                                        background: '#fff1f2', border: '2px solid #fecdd3', color: '#e11d48',
                                                        cursor: 'pointer', fontWeight: '800', fontSize: '0.75rem', transition: 'all 0.3s'
                                                    }}
                                                >
                                                    <X size={18} />
                                                    <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{commitFile.name}</span>
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => document.getElementById('commit-file-upload').click()}
                                                    title="Attach file (images, documents — no videos)"
                                                    className="btn-primary-file"
                                                    style={{
                                                        width: isMobile ? '100%' : 'auto', padding: '15px 30px', borderRadius: '18px',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <File size={20} />
                                                </button>
                                            )}
                                        </form>

                                        {/* FILE ATTACHMENT PREVIEW */}
                                        {commitFile && (
                                            <div style={{
                                                marginTop: '12px', padding: '12px 18px', background: '#f0fdf4',
                                                borderRadius: '14px', border: '1px solid #bbf7d0',
                                                display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.8rem', fontWeight: '700', color: 'var(--secondary)'
                                            }}>
                                                <Paperclip size={14} style={{ color: '#16a34a', flexShrink: 0 }} />
                                                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{commitFile.name}</span>
                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', flexShrink: 0 }}>{(commitFile.size / 1024).toFixed(1)} KB</span>
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ padding: isMobile ? '0' : '0 30px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '40px' : '40px', position: 'relative' }}>
                                            {/* CENTRAL CONNECTING LINE */}
                                            {!isMobile && (
                                                <div style={{
                                                    position: 'absolute',
                                                    left: '170px',
                                                    top: '0',
                                                    bottom: '0',
                                                    width: '2px',
                                                    background: 'var(--border)',
                                                    opacity: 0.2
                                                }}></div>
                                            )}

                                            {commits.map((commit, idx) => {
                                                const isMyCommit = commit.user_id === currentUser.id;
                                                const isExternal = !!commit.sha;

                                                return (
                                                    <div key={commit.id} onContextMenu={(e) => handleCommitContextMenu(e, commit)} style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '15px' : '40px', position: 'relative' }}>
                                                        {!isMobile && (
                                                            <div style={{ width: '150px', textAlign: 'right', paddingTop: '35px' }}>
                                                                <p style={{ fontSize: '0.75rem', fontWeight: '950', color: 'var(--secondary)', letterSpacing: '0.5px' }}>
                                                                    {new Date(commit.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </p>
                                                                <p style={{ fontSize: '0.6rem', fontWeight: '800', color: 'var(--text-muted)', marginTop: '6px', textTransform: 'uppercase' }}>
                                                                    {new Date(commit.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                                                </p>
                                                            </div>
                                                        )}

                                                        {/* TIMELINE NODE (CIRCLE) - Positioned relative to the row gap */}
                                                        {!isMobile && (
                                                            <div style={{
                                                                position: 'absolute',
                                                                left: '166px',
                                                                top: '40px',
                                                                width: '10px',
                                                                height: '10px',
                                                                borderRadius: '50%',
                                                                background: 'var(--accent)',
                                                                border: '2px solid white',
                                                                zIndex: 2,
                                                                boxShadow: '0 0 10px rgba(230,208,76,0.4)'
                                                            }}></div>
                                                        )}

                                                        <div style={{ position: 'relative', flex: 1 }}>
                                                            <div style={{
                                                                background: isMyCommit ? '#ffffff' : 'rgba(0,0,0,0.01)',
                                                                padding: isMobile ? '25px' : '30px 40px',
                                                                borderRadius: '24px',
                                                                border: isMyCommit ? '1px solid rgba(230,208,76,0.3)' : '1px solid rgba(0,0,0,0.04)',
                                                                boxShadow: isMyCommit ? '0 15px 40px rgba(230,208,76,0.12)' : 'none',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: isMobile ? '20px' : '30px'
                                                            }}>
                                                                <div style={{ width: isMobile ? '60px' : '80px', height: isMobile ? '60px' : '80px', borderRadius: '20px', overflow: 'hidden', flexShrink: 0, border: '4px solid #f8fafc', boxShadow: '0 8px 20px rgba(0,0,0,0.05)' }}>
                                                                    {commit.avatar ? (
                                                                        <img src={commit.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                    ) : (
                                                                        <div style={{ width: '100%', height: '100%', background: isExternal ? 'var(--accent-dark)' : 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '900', fontSize: isMobile ? '1.5rem' : '2rem' }}>
                                                                            {(commit.author?.[0] || commit.username?.[0] || 'U').toUpperCase()}
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <div style={{ flex: 1 }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                            <span style={{ fontSize: '0.65rem', fontWeight: '950', color: 'var(--accent-dark)', letterSpacing: '1.5px' }}>{(commit.author || commit.username || 'UNKNOWN').toUpperCase()}</span>
                                                                            {isExternal && <span style={{ padding: '3px 8px', background: 'var(--secondary)', color: 'white', borderRadius: '6px', fontSize: '0.5rem', fontWeight: '900', letterSpacing: '0.5px' }}>GITHUB INTEL</span>}
                                                                        </div>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                            {isExternal && <span style={{ fontSize: '0.6rem', fontWeight: '800', color: 'var(--text-muted)', fontFamily: 'monospace', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>{commit.sha.substring(0, 7)}</span>}
                                                                            {isMobile && <span style={{ fontSize: '0.6rem', fontWeight: '700', color: 'var(--text-muted)' }}>{new Date(commit.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                                                                        </div>
                                                                    </div>
                                                                    <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
                                                                        <div style={{ flex: 1 }}>
                                                                            <p style={{ fontWeight: '850', color: 'var(--secondary)', fontSize: isMobile ? '1.1rem' : '1.35rem', lineHeight: '1.5', margin: 0, letterSpacing: '-0.5px', wordBreak: 'break-word' }}>{linkifyText(commit.message)}</p>
                                                                        </div>

                                                                        {/* RIGHT-CENTER ACTION LINK */}
                                                                        {commit.file_url && (
                                                                            <div style={{ flexShrink: 0 }}>
                                                                                <button 
                                                                                    onClick={(e) => { 
                                                                                        e.stopPropagation(); 
                                                                                        if (isImageFile(commit.file_url)) setFullscreenImage(commit.file_url);
                                                                                        else window.open(commit.file_url, '_blank');
                                                                                    }}
                                                                                    style={{ 
                                                                                        display: 'flex', alignItems: 'center', gap: '10px', 
                                                                                        padding: '12px 20px', background: '#f8fafc', 
                                                                                        borderRadius: '14px', border: '1px solid #e2e8f0',
                                                                                        cursor: 'pointer', color: 'var(--secondary)',
                                                                                        fontWeight: '800', fontSize: '0.7rem',
                                                                                        transition: 'all 0.3s', letterSpacing: '0.5px'
                                                                                    }}
                                                                                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 5px 15px rgba(0,0,0,0.05)'; }}
                                                                                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.boxShadow = 'none'; }}
                                                                                >
                                                                                    {isImageFile(commit.file_url) ? <Image size={16} /> : <FileText size={16} />}
                                                                                    <span>{isImageFile(commit.file_url) ? 'VIEW INTEL' : 'DOWNLOAD FILE'}</span>
                                                                                    <ExternalLink size={12} style={{ opacity: 0.3 }} />
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ height: '500px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#ffffff', borderRadius: '30px', border: '1px dashed var(--border)' }}>
                                    <Activity size={48} color="var(--border)" style={{ marginBottom: '25px', opacity: 0.3 }} />
                                    <p style={{ color: 'var(--text-muted)', fontWeight: '800', fontSize: '1.1rem' }}>Stand by for digital sync...</p>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="animate-fade-in" style={{ gridColumn: '1 / -1' }}>
                        <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                            <div>
                                <h3 style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--secondary)', letterSpacing: '-1px' }}>External <span style={{ color: 'var(--accent-dark)' }}>Intel Graph</span></h3>
                                <p style={{ color: 'var(--text-muted)', fontWeight: '700', fontSize: '0.85rem' }}>Visualizing {githubData?.owner}/{githubData?.repo} mission structure.</p>
                            </div>
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <button
                                    onClick={analyzeGitHub}
                                    disabled={analyzing}
                                    style={{ background: 'transparent', border: '1px solid var(--border)', padding: '12px 25px', borderRadius: '100px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '800', fontSize: '0.7rem', color: 'var(--secondary)' }}
                                >
                                    <RefreshCw size={14} className={analyzing ? "animate-spin" : ""} /> RE-ANALYZE
                                </button>
                            </div>
                        </div>
                        {githubData && <GitGraph data={githubData} />}
                    </div>
                )}
            </div>

            {/* FULLSCREEN LIGHTBOX */}
            {fullscreenImage && ReactDOM.createPortal(
                <div 
                    style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,15,13,0.92)',
                        backdropFilter: 'blur(30px)', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', zIndex: 999999, padding: '40px'
                    }}
                    onClick={() => setFullscreenImage(null)}
                >
                    <button 
                        style={{ position: 'absolute', top: '30px', right: '30px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '15px', borderRadius: '50%', cursor: 'pointer' }}
                        onClick={() => setFullscreenImage(null)}
                    >
                        <X size={24} />
                    </button>
                    <img 
                        src={fullscreenImage} 
                        style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: '20px', boxShadow: '0 50px 100px rgba(0,0,0,0.5)', objectFit: 'contain' }} 
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>,
                document.body
            )}

            {/* RIGHT-CLICK CONTEXT MENU */}
            {contextMenu && ReactDOM.createPortal(
                <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        position: 'fixed',
                        top: contextMenu.y,
                        left: contextMenu.x,
                        zIndex: 999999,
                        background: '#ffffff',
                        borderRadius: '16px',
                        padding: '8px',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.08)',
                        border: '1px solid rgba(0,0,0,0.06)',
                        minWidth: '200px',
                        animation: 'toastSlideIn 0.2s ease-out'
                    }}
                >
                    <div style={{ padding: '8px 14px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.55rem', fontWeight: '900', letterSpacing: '2px', color: 'var(--text-muted, #94a3b8)' }}>
                            {contextMenu.type === 'branch' ? 'BRANCH OPTIONS' : 'COMMIT OPTIONS'}
                        </span>
                    </div>

                    {/* RENAME / EDIT */}
                    <button
                        onClick={() => {
                            if (contextMenu.type === 'branch') {
                                setRenaming({ type: 'branch', id: contextMenu.item.id, value: contextMenu.item.name });
                            } else {
                                setRenaming({ type: 'commit', id: contextMenu.item.id, value: contextMenu.item.message, file_url: contextMenu.item.file_url });
                            }
                            setContextMenu(null);
                        }}
                        style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                            padding: '12px 14px', borderRadius: '10px', border: 'none',
                            background: 'transparent', cursor: 'pointer', color: 'var(--secondary, #004842)',
                            fontWeight: '700', fontSize: '0.85rem', transition: 'all 0.2s',
                            textAlign: 'left'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f0f9ff', color: '#0369a1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Edit2 size={15} />
                        </div>
                        {contextMenu.type === 'branch' ? 'Rename Branch' : 'Edit Commit'}
                    </button>

                    {/* DELETE */}
                    <button
                        onClick={() => {
                            if (contextMenu.type === 'branch') {
                                handleDeleteBranch(contextMenu.item);
                            } else {
                                handleDeleteCommit(contextMenu.item);
                            }
                            setContextMenu(null);
                        }}
                        style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                            padding: '12px 14px', borderRadius: '10px', border: 'none',
                            background: 'transparent', cursor: 'pointer', color: '#e11d48',
                            fontWeight: '700', fontSize: '0.85rem', transition: 'all 0.2s',
                            textAlign: 'left'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#fff1f2'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fff1f2', color: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Trash2 size={15} />
                        </div>
                        {contextMenu.type === 'branch' ? 'Delete Branch' : 'Delete Commit'}
                    </button>
                </div>,
                document.body
            )}

            {/* COMMIT RENAME OVERLAY */}
            {renaming?.type === 'commit' && ReactDOM.createPortal(
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,40,36,0.3)',
                    backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', zIndex: 999998, padding: '20px'
                }} onClick={() => setRenaming(null)}>
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: '#fff', width: '100%', maxWidth: '550px',
                            padding: '50px', borderRadius: '30px',
                            boxShadow: '0 40px 120px rgba(0,0,0,0.25)'
                        }}
                    >
                        <h3 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--secondary, #004842)', marginBottom: '8px', letterSpacing: '-0.5px' }}>
                            Edit <span style={{ color: 'var(--accent-dark, #b8a830)' }}>Commit</span>
                        </h3>
                        <p style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted, #94a3b8)', marginBottom: '30px' }}>
                            Update the commit message below.
                        </p>

                        <form onSubmit={(e) => { e.preventDefault(); handleEditCommit(); }}>
                            <div className="input-group" style={{ marginBottom: '30px' }}>
                                <label style={{ fontSize: '0.65rem', fontWeight: '900', letterSpacing: '2px', color: 'var(--secondary, #004842)', opacity: 0.4, marginBottom: '10px', display: 'block' }}>COMMIT MESSAGE</label>
                                <textarea
                                    ref={renameInputRef}
                                    value={renaming.value}
                                    onChange={(e) => setRenaming({ ...renaming, value: e.target.value })}
                                    style={{ minHeight: '100px', width: '100%', borderRadius: '14px', resize: 'vertical' }}
                                />
                            </div>

                            {/* EDIT FILE ATTACHMENT */}
                            <div style={{ marginBottom: '35px' }}>
                                <label style={{ fontSize: '0.65rem', fontWeight: '900', letterSpacing: '2px', color: 'var(--secondary, #004842)', opacity: 0.4, marginBottom: '15px', display: 'block' }}>ATTACHMENT</label>
                                
                                <input
                                    id="edit-commit-file"
                                    type="file"
                                    accept={ALLOWED_FILE_TYPES}
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) setRenaming({ ...renaming, newFile: file });
                                    }}
                                    style={{ display: 'none' }}
                                />

                                { (renaming.newFile || renaming.file_url) ? (
                                    <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '18px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <div style={{ width: '50px', height: '50px', background: 'var(--accent)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--secondary)' }}>
                                            { (renaming.newFile ? isImageFile(renaming.newFile.name) : isImageFile(renaming.file_url)) ? <Image size={24} /> : <FileText size={24} /> }
                                        </div>
                                        <div style={{ flex: 1, overflow: 'hidden' }}>
                                            <p style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--secondary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {renaming.newFile ? renaming.newFile.name : getFileName(renaming.file_url)}
                                            </p>
                                            <p style={{ fontSize: '0.65rem', fontWeight: '700', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                                                {renaming.newFile ? `${(renaming.newFile.size / 1024).toFixed(1)} KB` : 'Currently attached'}
                                            </p>
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={() => setRenaming({ ...renaming, newFile: null, file_url: null })}
                                            style={{ background: '#fff1f2', border: 'none', color: '#e11d48', padding: '10px', borderRadius: '10px', cursor: 'pointer' }}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ) : (
                                    <button 
                                        type="button"
                                        onClick={() => document.getElementById('edit-commit-file').click()}
                                        style={{ width: '100%', padding: '20px', border: '2px dashed var(--border)', borderRadius: '18px', background: 'transparent', color: 'var(--text-muted)', fontWeight: '800', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}
                                    >
                                        <Plus size={20} /> ATTACH NEW FILE
                                    </button>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    type="button"
                                    onClick={() => setRenaming(null)}
                                    style={{
                                        flex: 1, padding: '16px', borderRadius: '14px',
                                        border: '1px solid #e2e8f0', background: 'transparent',
                                        fontWeight: '800', fontSize: '0.8rem', cursor: 'pointer',
                                        color: 'var(--secondary, #004842)', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center', gap: '8px'
                                    }}
                                >
                                    <X size={16} /> CANCEL
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    style={{
                                        flex: 1, padding: '16px', borderRadius: '14px',
                                        fontWeight: '800', fontSize: '0.8rem',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                    }}
                                >
                                    <Check size={16} /> SAVE CHANGES
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default ProjectWorkshop;

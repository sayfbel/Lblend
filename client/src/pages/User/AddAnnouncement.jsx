import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Megaphone, Folder, AlignLeft, Clock, HelpCircle, Check, X, File, Link } from 'lucide-react';
import AuthService from '../../services/auth.service';

const HELP_OPTIONS = [
    "Design", "Development", "Marketing", "Strategy", "Photography", "Modeling", "Styling"
];

const GithubIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
    </svg>
);

const YoutubeIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.42a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.94 2c1.72.42 8.6.42 8.6.42s6.88 0 8.6-.42a2.78 2.78 0 0 0 1.94-2A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"></path>
        <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"></polygon>
    </svg>
);

const DriveIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19L15 5H9L2 19H7L12 11L17 19H22Z"></path>
    </svg>
);

const AddAnnouncement = () => {
    const [projectName, setProjectName] = useState('');
    const [description, setDescription] = useState('');
    const [githubUrl, setGithubUrl] = useState('');
    const [selectedSource, setSelectedSource] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedHelp, setSelectedHelp] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const user = AuthService.getCurrentUser();

    const toggleHelp = (option) => {
        if (selectedHelp.includes(option)) {
            setSelectedHelp(selectedHelp.filter(h => h !== option));
        } else {
            setSelectedHelp([...selectedHelp, option]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Auto-normalize http:// to https://
        let normalizedUrl = githubUrl.trim();
        if (normalizedUrl.startsWith('http://')) {
            normalizedUrl = normalizedUrl.replace('http://', 'https://');
            setGithubUrl(normalizedUrl);
        }

        // INTEL SOURCE VALIDATION
        if (selectedSource?.id === 'github' && !normalizedUrl.startsWith('https://github.com/')) {
            setMessage('GitHub source must start with https://github.com/');
            return;
        }
        if (selectedSource?.id === 'youtube' && !normalizedUrl.startsWith('https://youtube.com/')) {
            setMessage('YouTube source must start with https://youtube.com/');
            return;
        }
        if (selectedSource?.id === 'drive' && !normalizedUrl.startsWith('https://drive.google.com/')) {
            setMessage('Drive source must start with https://drive.google.com/');
            return;
        }

        setLoading(true);
        setMessage('');

        try {
            let finalUrl = normalizedUrl;

            // FILE UPLOAD PROCESS
            if (selectedSource?.id === 'files' && selectedFile) {
                const formData = new FormData();
                formData.append('file', selectedFile);
                const uploadRes = await axios.post('http://localhost:5000/api/upload-datafile', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                finalUrl = uploadRes.data.fileUrl;
            }

            const announceRes = await axios.post('http://localhost:5000/api/announcements', {
                user_id: user.id,
                project_name: projectName,
                description: description,
                github_url: finalUrl,
                help_needed: selectedHelp.join(',')
            });

            // AUTOMATIC GITHUB SYNC
            if (selectedSource?.id === 'github' && finalUrl.includes('github.com')) {
                try {
                    await axios.post('http://localhost:5000/api/github/sync', {
                        url: finalUrl,
                        projectId: announceRes.data.id,
                        userId: user.id
                    });
                } catch (syncErr) {
                    console.error('Background Sync Failed:', syncErr);
                }
            }

            setMessage('Digital Broadcast Initiated and Syncing successfully!');
            setProjectName('');
            setDescription('');
            setGithubUrl('');
            setSelectedSource(null);
            setSelectedFile(null);
            setSelectedHelp([]);
        } catch (error) {
            setMessage(error.response?.data?.message || 'Broadcast failed. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto', padding: isMobile ? '0' : '20px' }}>
            <div style={{ marginBottom: isMobile ? '40px' : '60px' }}>
                <h2 className="heading-xl">Digital <br /><span style={{ color: 'var(--accent-dark)' }}>Broadcast</span></h2>
                <p style={{ color: 'var(--text-muted)', fontWeight: '600', marginTop: '15px', fontSize: isMobile ? '0.85rem' : '1rem' }}>Initiate a mission and gather your specialized task force.</p>
            </div>


            <div className="blend-card" style={{ marginBottom: '80px' }}>

                {message && (
                    <div style={{
                        background: message.includes('successfully') ? '#f0fdf4' : '#fff1f2',
                        color: message.includes('successfully') ? '#166534' : '#e11d48',
                        padding: '15px', borderRadius: '12px', marginBottom: '30px', textAlign: 'center', fontWeight: '700'
                    }}>{message}</div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '30px' : '40px', marginBottom: '40px' }}>
                        <div className="input-group">
                            <label>PROJECT IDENTITY</label>
                            <input
                                type="text"
                                maxLength={30}
                                placeholder="Enter mission name..."
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="input-group" style={{ position: 'relative', marginBottom: 0 }}>
                            <label style={{ letterSpacing: '3px', marginBottom: '20px', display: 'block' }}>INTEL SOURCE</label>

                            {!selectedSource ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '10px' }}>
                                    {[
                                        { id: 'github', label: 'GitHub', icon: GithubIcon, placeholder: 'https://github.com/repository', color: '#24292e' },
                                        { id: 'youtube', label: 'YouTube', icon: YoutubeIcon, placeholder: 'https://youtube.com/watch?v=...', color: '#ff0000' },
                                        { id: 'drive', label: 'Drive', icon: DriveIcon, placeholder: 'https://drive.google.com/...', color: '#34a853' },
                                        { id: 'files', label: 'Files', icon: File, placeholder: 'Upload files...', color: 'var(--secondary)' }
                                    ].map(source => (
                                        <div
                                            key={source.id}
                                            onClick={() => setSelectedSource(source)}
                                            style={{
                                                height: '80px',
                                                borderRadius: '20px',
                                                border: '1px solid rgba(0,0,0,0.04)',
                                                background: '#ffffff',
                                                cursor: 'pointer',
                                                transition: 'all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '10px',
                                                boxShadow: '0 4px 15px rgba(0,0,0,0.02)'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.borderColor = 'var(--accent)';
                                                e.currentTarget.style.transform = 'translateY(-5px)';
                                                e.currentTarget.style.boxShadow = '0 15px 35px rgba(0,0,0,0.08)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.borderColor = 'rgba(0,0,0,0.04)';
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.02)';
                                            }}
                                        >
                                            <div style={{ color: source.color }}>
                                                <source.icon size={22} />
                                            </div>
                                            <span style={{ fontSize: '0.55rem', fontWeight: '900', color: 'var(--secondary)', opacity: 0.6, letterSpacing: '1px' }}>{source.label.toUpperCase()}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="animate-fade-in" style={{
                                    position: 'relative',
                                    background: '#f8fafc',
                                    padding: '10px',
                                    borderRadius: '22px',
                                    border: '1px solid rgba(0,0,0,0.04)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '15px'
                                }}>
                                    <div style={{
                                        width: '45px',
                                        height: '45px',
                                        background: 'var(--secondary)',
                                        borderRadius: '16px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'var(--accent)',
                                        flexShrink: 0,
                                        boxShadow: '0 8px 16px rgba(0,72,66,0.15)'
                                    }}>
                                        <selectedSource.icon size={18} />
                                    </div>

                                    <div style={{ flex: 1 }}>
                                        {selectedSource.id === 'files' ? (
                                            <>
                                                <input
                                                    id="file-upload"
                                                    type="file"
                                                    onChange={(e) => {
                                                        if (e.target.files && e.target.files[0]) {
                                                            const file = e.target.files[0];
                                                            if (file.size > 5 * 1024 * 1024) {
                                                                setMessage('File size must not exceed 5MB.');
                                                                e.target.value = '';
                                                            } else {
                                                                setSelectedFile(file);
                                                                setMessage('');
                                                            }
                                                        }
                                                    }}
                                                    required
                                                    style={{ display: 'none' }}
                                                />
                                                <label
                                                    htmlFor="file-upload"
                                                    style={{
                                                        width: '100%',
                                                        background: 'transparent',
                                                        padding: '10px 0',
                                                        fontSize: '0.95rem',
                                                        fontWeight: '800',
                                                        color: selectedFile ? 'var(--secondary)' : 'var(--text-muted)',
                                                        cursor: 'pointer',
                                                        display: 'block',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                >
                                                    {selectedFile ? selectedFile.name : 'Choose Secure File...'}
                                                </label>
                                            </>
                                        ) : (
                                            <input
                                                autoFocus
                                                type="text"
                                                placeholder={selectedSource.placeholder}
                                                value={githubUrl}
                                                onChange={(e) => setGithubUrl(e.target.value)}
                                                required
                                                style={{
                                                    width: '100%',
                                                    border: 'none',
                                                    background: 'transparent',
                                                    padding: '10px 0',
                                                    fontSize: '0.95rem',
                                                    fontWeight: '700',
                                                    color: 'var(--secondary)',
                                                    outline: 'none'
                                                }}
                                            />
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => { setSelectedSource(null); setGithubUrl(''); setSelectedFile(null); }}
                                        style={{
                                            background: '#ffffff',
                                            border: '1px solid #f1f5f9',
                                            borderRadius: '12px',
                                            color: '#e11d48',
                                            cursor: 'pointer',
                                            padding: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.3s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#fff1f2'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="input-group" style={{ marginBottom: '40px' }}>
                        <label>SUPPORT REQUIRED (SELECT MULTIPLE)</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                            {HELP_OPTIONS.map(option => (
                                <div
                                    key={option}
                                    onClick={() => toggleHelp(option)}
                                    style={{
                                        padding: '10px 20px', borderRadius: '100px', cursor: 'pointer', transition: 'all 0.3s',
                                        background: selectedHelp.includes(option) ? 'var(--secondary)' : '#f8fafc',
                                        color: selectedHelp.includes(option) ? 'white' : 'var(--secondary)',
                                        fontSize: '0.8rem', fontWeight: '800', border: '1px solid ' + (selectedHelp.includes(option) ? 'var(--secondary)' : '#f1f5f9')
                                    }}
                                >
                                    {selectedHelp.includes(option) && <Check size={14} style={{ marginRight: '8px' }} />}
                                    {option.toUpperCase()}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="input-group" style={{ marginBottom: '60px' }}>
                        <label>MISSION OBJECTIVES</label>
                        <textarea
                            maxLength={300}
                            placeholder="State your objectives..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                            style={{ minHeight: '120px' }}
                        />
                    </div>

                    <div style={{ textAlign: 'right' }}>
                        <button disabled={loading} className="btn-primary" style={{ width: 'auto', padding: '1.2rem 4.5rem', fontSize: '0.85rem', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '15px', marginLeft: 'auto' }}>
                            <Megaphone size={18} /> {loading ? 'Broadcasting...' : 'Initiate Broadcast'}
                        </button>
                    </div>
                </form>
            </div>

        </div>
    );
};

export default AddAnnouncement;

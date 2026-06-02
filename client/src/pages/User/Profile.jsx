import React, { useState, useRef } from 'react';
import axios from 'axios';
import { User, Briefcase, Mail, ShieldCheck, Save, RefreshCw, Camera, Upload, Image as ImageIcon, ChevronRight, FileText } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';

const OCCUPATION_OPTIONS = [
    'Developer', 'Designer', 'Video Editor', 'Content Creator', 'student(bac)', 'Other'
];

const Profile = () => {
    const { user } = useOutletContext();
    const [username, setUsername] = useState(user.username || '');
    const [occupation, setOccupation] = useState(user.occupation || '');
    const [description, setDescription] = useState(user.description || '');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [avatar, setAvatar] = useState(user.avatar || '');
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(user.avatar || '');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setMessage('Identity file size must not exceed 5MB to preserve bandwidth.');
                e.target.value = '';
                return;
            }
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        if (!user || !user.id) {
            setMessage('Error: Invalid personnel ID. Re-login required.');
            setLoading(false);
            return;
        }

        try {
            let finalAvatarUrl = avatar;

            // If a new file is selected, upload it first
            if (selectedFile) {
                const formData = new FormData();
                formData.append('avatar', selectedFile);
                const uploadRes = await axios.post('http://localhost:5000/api/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                finalAvatarUrl = uploadRes.data.imageUrl;
            }

            // Sync Identity with Database
            await axios.put(`http://localhost:5000/api/users/${user.id}`, {
                username,
                occupation,
                description,
                avatar: finalAvatarUrl
            });

            const existingData = JSON.parse(localStorage.getItem('user'));
            const updatedUser = { ...existingData, username, occupation, description, avatar: finalAvatarUrl };
            localStorage.setItem('user', JSON.stringify(updatedUser));

            setMessage('Identity Synchronized successfully.');
            setTimeout(() => window.location.reload(), 1500);
        } catch (error) {
            setMessage('Synchronization failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '100px' }}>
            <div style={{ marginBottom: '60px', textAlign: 'left' }}>
                <h2 className="heading-xl">Mission <br /><span style={{ color: 'var(--accent-dark)' }}>Identity</span></h2>
                <p style={{ color: 'var(--text-muted)', fontWeight: '600', marginTop: '15px' }}>Management and synchronization of your digital personnel record.</p>
            </div>

            <div style={{ padding: '40px 0', position: 'relative', background: 'transparent', border: 'none', boxShadow: 'none' }}>

                <div style={{ display: 'flex', alignItems: 'center', gap: '40px', marginBottom: '60px', paddingBottom: '40px', borderBottom: '1px solid #f1f5f9' }}>
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        style={{ position: 'relative', cursor: 'pointer' }}
                        className="group"
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                            accept="image/*"
                        />
                        <div style={{ width: '120px', height: '120px', borderRadius: '40px', background: 'var(--secondary)', overflow: 'hidden', boxShadow: '0 15px 35px rgba(0,72,66,0.2)', border: '4px solid #fff' }}>
                            {(previewUrl || user.google_avatar) ? (
                                <img src={previewUrl || user.google_avatar} alt="Identity" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '3.5rem', fontWeight: '950' }}>
                                    {username?.[0]?.toUpperCase() || 'U'}
                                </div>
                            )}
                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: '40px', justifyContent: 'center', opacity: 0, transition: '0.3s' }} className="hover-trigger">
                                <Upload size={20} color="white" />
                                <span style={{ color: 'white', fontSize: '0.55rem', fontWeight: '950', letterSpacing: '1px', marginTop: '8px' }}>UPLOAD FILE</span>
                            </div>
                        </div>
                        <div style={{ position: 'absolute', bottom: '-8px', right: '-8px', background: 'var(--accent)', color: 'var(--secondary)', padding: '10px', borderRadius: '15px', border: '4px solid #fff', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}>
                            <Camera size={18} />
                        </div>
                    </div>
                    <div>
                        <span style={{ fontSize: '0.65rem', fontWeight: '950', color: 'var(--accent-dark)', letterSpacing: '2px', opacity: 0.6 }}>ACTIVE PERSONNEL</span>
                        <h4 style={{ fontSize: '2.2rem', fontWeight: '950', color: 'var(--secondary)', margin: '5px 0' }}>{username || 'Anonymous'}</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
                            <p style={{ color: 'var(--text-muted)', fontWeight: '800', margin: 0, fontSize: '0.85rem' }}>{occupation || 'Unassigned Rank'}</p>
                        </div>
                    </div>
                </div>

                {message && (
                    <div style={{
                        background: message.includes('failed') ? '#fff1f2' : '#f0fdf4',
                        color: message.includes('failed') ? '#e11d48' : '#166534',
                        padding: '20px', borderRadius: '16px', marginBottom: '40px', textAlign: 'center', fontWeight: '800'
                    }}>{message}</div>
                )}

                <form onSubmit={handleUpdate}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '40px' }}>
                        <div className="input-group">
                            <label>CODENAME</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>

                        <div className="input-group" style={{ position: 'relative' }}>
                            <label>DIGITAL ROLE</label>

                            <div
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                style={{ 
                                    background: '#f8fafc',
                                    border: dropdownOpen ? '1px solid var(--accent-dark)' : '1px solid #f1f5f9',
                                    padding: '1.1rem',
                                    borderRadius: 'var(--radius-sm)',
                                    cursor: 'pointer',
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center' 
                                }}
                            >
                                <span style={{ fontWeight: '600', color: occupation ? 'var(--secondary)' : 'var(--text-muted)' }}>{occupation || 'Select your rank...'}</span>
                                <ChevronRight size={18} style={{ transform: dropdownOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: '0.3s', color: 'var(--accent-dark)' }} />
                            </div>

                            {dropdownOpen && (
                                <div style={{ position: 'absolute', top: '100%', left: 0, width: '100%', background: '#fff', border: '1px solid #f1f5f9', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', zIndex: 10, marginTop: '10px', overflow: 'hidden' }}>
                                    <div className="custom-scroll" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                                        {OCCUPATION_OPTIONS.map(opt => (
                                            <div
                                                key={opt}
                                                onClick={() => { setOccupation(opt); setDropdownOpen(false); }}
                                                style={{ padding: '15px 20px', fontSize: '1rem', fontWeight: '800', color: occupation === opt ? 'var(--secondary)' : 'var(--text-muted)', background: occupation === opt ? '#f8fafc' : '#fff', cursor: 'pointer', transition: '0.2s', borderLeft: occupation === opt ? '4px solid var(--accent-dark)' : '4px solid transparent' }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = occupation === opt ? '#f8fafc' : '#fff'}
                                            >
                                                {opt}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="input-group" style={{ gridColumn: 'span 2' }}>
                            <label>PERSONNEL DESCRIPTION</label>
                            <textarea
                                maxLength={300}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Detail your operational skills, past missions, and primary objectives..."
                                style={{ minHeight: '120px' }}
                            />
                        </div>

                        <div style={{ background: '#f8fafc', padding: '30px', borderRadius: '24px', gridColumn: 'span 2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                    <ImageIcon size={16} color="var(--accent-dark)" />
                                    <span style={{ fontSize: '0.7rem', fontWeight: '900', letterSpacing: '2px', color: 'var(--secondary)', opacity: 0.5 }}>HARDWARE IDENTITY FILE</span>
                                </div>
                                <p style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--secondary)', margin: 0 }}>{selectedFile ? selectedFile.name : 'No file selected for transmission.'}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                style={{ background: 'var(--secondary)', color: 'white', padding: '12px 25px', borderRadius: '12px', border: 'none', fontSize: '0.7rem', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                            >
                                <Upload size={14} /> SELECT IDENTITY FILE
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '20px', alignItems: 'center' }}>
                        {selectedFile && (
                            <span style={{ fontSize: '0.7rem', fontWeight: '900', color: 'var(--accent-dark)' }}>PREREGISTERED: {Math.round(selectedFile.size / 1024)} KB</span>
                        )}
                        <button
                            type="submit"
                            disabled={loading}
                            style={{ 
                                background: 'var(--secondary)', 
                                color: 'white', 
                                padding: '12px 25px', 
                                borderRadius: '12px', 
                                border: 'none', 
                                fontSize: '0.7rem', 
                                fontWeight: '900', 
                                cursor: 'pointer', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '10px' 
                            }}
                        >
                            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                            {loading ? 'SYNCHRONIZING...' : 'SYNC IDENTITY'}
                        </button>
                    </div>
                </form>
            </div>

            <style>{`
                .group:hover .hover-trigger { opacity: 1 !important; }
                .custom-scroll::-webkit-scrollbar { width: 5px; }
                .custom-scroll::-webkit-scrollbar-track { background: transparent; }
                .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                .custom-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}</style>
        </div>
    );
};

export default Profile;

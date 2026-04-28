import React, { useState, useEffect, useRef, useCallback } from 'react';
// Last updated: 2026-04-28 02:22
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
    Maximize,
    Star,
    Save,
    Layers,
    Eye
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
            else { try { label = new URL(part).hostname.replace('www.', ''); } catch (e) { } }
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

const FigmaIcon = ({ size = 18, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5z"></path>
        <path d="M12 2h3.5a3.5 3.5 0 1 1 0 7H12V2z"></path>
        <path d="M12 12.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 1 1-7 0z"></path>
        <path d="M5 19.5A3.5 3.5 0 0 1 8.5 16H12v3.5a3.5 3.5 0 1 1-7 0z"></path>
        <path d="M5 12.5A3.5 3.5 0 0 1 8.5 9H12v7H8.5A3.5 3.5 0 0 1 5 12.5z"></path>
    </svg>
);

const AdobeXDIcon = ({ size = 18, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
        <path d="M2 17l10 5 10-5"></path>
        <path d="M2 12l10 5 10-5"></path>
    </svg>
);

const BehanceIcon = ({ size = 18, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 12h5"></path>
        <path d="M13 15h5"></path>
        <path d="M9 15h2a2 2 0 1 0 0-4h-2v4Z"></path>
        <path d="M3 9h2a2 2 0 1 1 0 4h-2V9Z"></path>
        <path d="M3 13h2a2 2 0 1 1 0 4h-2v-4Z"></path>
    </svg>
);

const DesignCommitCard = ({ commit, currentUser, onDelete, onEdit, isPrincipal = false, activeNode, onNodeClick }) => {
    const [designData, setDesignData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDesignData = async () => {
            const msg = commit.message?.toLowerCase() || '';
            const isFigma = msg.includes('figma.com');
            const isXD = msg.includes('xd.adobe.com');
            const isBehance = msg.includes('behance.net');

            if (!isFigma && !isXD && !isBehance) {
                setLoading(false);
                return;
            }

            try {
                if (isFigma) {
                    const urlMatch = commit.message.match(/(https:\/\/([\w\.-]+\.)?figma\.com\/[^\s]+)/i);
                    const url = urlMatch ? urlMatch[0] : commit.message;
                    const response = await axios.post('http://localhost:5000/api/figma/oembed', { url });
                    setDesignData(response.data);
                } else if (isXD || isBehance) {
                    const regex = isXD ? /(https:\/\/([\w\.-]+\.)?xd\.adobe\.com\/view\/[^\s]+)/i : /(https:\/\/([\w\.-]+\.)?behance\.net\/gallery\/[^\s]+)/i;
                    const urlMatch = commit.message.match(regex);
                    const url = urlMatch ? urlMatch[0] : commit.message;
                    const response = await axios.post('http://localhost:5000/api/design/metadata', { url });
                    setDesignData(response.data);
                }
            } catch (err) {
                console.error("Failed to fetch Design data for card");
            } finally {
                setLoading(false);
            }
        };
        fetchDesignData();
    }, [commit.message]);

    const isMyCommit = commit.user_id === currentUser.id;
    const isFigmaUrl = commit.message?.toLowerCase().includes('figma.com');
    const isXDUrl = commit.message?.toLowerCase().includes('xd.adobe.com');
    const isBehanceUrl = commit.message?.toLowerCase().includes('behance.net');

    return (
        <div style={{ position: 'relative', height: '100%' }}>
            {/* CONNECTION NODES */}
            {!isPrincipal && (
                <div
                    id={`node-${commit.id}-left`}
                    onClick={(e) => onNodeClick && onNodeClick(commit.id, 'left', e)}
                    style={{
                        position: 'absolute', left: '-12px', top: '50%', transform: 'translateY(-50%)',
                        width: '24px', height: '24px', borderRadius: '50%', background: 'white',
                        border: '4px solid var(--secondary)', cursor: 'pointer', zIndex: 20,
                        boxShadow: activeNode?.id === commit.id && activeNode?.side === 'left' ? '0 0 0 5px rgba(0,72,66,0.2)' : '0 4px 10px rgba(0,0,0,0.1)',
                        transition: 'all 0.2s'
                    }}
                />
            )}
            <div
                id={`node-${commit.id}-right`}
                onClick={(e) => onNodeClick && onNodeClick(commit.id, 'right', e)}
                style={{
                    position: 'absolute', right: '-12px', top: '50%', transform: 'translateY(-50%)',
                    width: '24px', height: '24px', borderRadius: '50%', background: 'white',
                    border: '4px solid var(--accent)', cursor: 'pointer', zIndex: 20,
                    boxShadow: activeNode?.id === commit.id && activeNode?.side === 'right' ? '0 0 0 5px rgba(230,208,76,0.3)' : '0 4px 10px rgba(0,0,0,0.1)',
                    transition: 'all 0.2s'
                }}
            />

            <div style={{
                background: '#ffffff',
                borderRadius: '24px',
                border: isPrincipal ? '2px solid var(--accent)' : '1px solid rgba(0,0,0,0.06)',
                boxShadow: isPrincipal ? '0 15px 50px rgba(184, 168, 48, 0.15)' : '0 10px 40px rgba(0,0,0,0.03)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                transition: 'transform 0.3s, box-shadow 0.3s'
            }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = isPrincipal ? '0 20px 60px rgba(184, 168, 48, 0.25)' : '0 20px 50px rgba(0,0,0,0.08)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = isPrincipal ? '0 15px 50px rgba(184, 168, 48, 0.15)' : '0 10px 40px rgba(0,0,0,0.03)'; }}
            >
                <div
                    style={{ height: '220px', background: '#f1f5f9', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: commit.file_url || designData ? 'pointer' : 'default' }}
                    onClick={() => {
                        const urlToOpen = commit.file_url || 
                            (isFigmaUrl ? commit.message.match(/(https:\/\/([\w\.-]+\.)?figma\.com\/[^\s]+)/i)?.[0] : 
                             isXDUrl ? commit.message.match(/(https:\/\/([\w\.-]+\.)?xd\.adobe\.com\/view\/[^\s]+)/i)?.[0] : 
                             isBehanceUrl ? commit.message.match(/(https:\/\/([\w\.-]+\.)?behance\.net\/gallery\/[^\s]+)/i)?.[0] : null);
                        if (urlToOpen) window.open(urlToOpen, '_blank');
                    }}
                >
                    {loading ? (
                        <RefreshCw size={24} className="animate-spin" color="var(--text-muted)" />
                    ) : designData?.thumbnail_url ? (
                        <img src={designData.thumbnail_url} draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', userSelect: 'none' }} alt="Design Thumbnail" />
                    ) : commit.file_url && isImageFile(commit.file_url) ? (
                        <img src={commit.file_url} draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', userSelect: 'none' }} alt="Attachment" />
                    ) : (
                        <div style={{ color: 'var(--text-muted)', fontWeight: '800' }}>No Preview Available</div>
                    )}

                    {isPrincipal && (
                        <div style={{ position: 'absolute', top: '15px', left: '15px', background: 'var(--secondary)', color: 'var(--accent)', borderRadius: '8px', padding: '6px 12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '0.65rem', fontWeight: '900', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Star size={12} fill="currentColor" /> MAIN PROJECT
                        </div>
                    )}

                    {isFigmaUrl && (
                        <div style={{ position: 'absolute', top: '15px', right: '15px', background: '#fff', borderRadius: '8px', padding: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                            <FigmaIcon size={18} color="#F24E1E" />
                        </div>
                    )}
                    {isXDUrl && (
                        <div style={{ position: 'absolute', top: '15px', right: '15px', background: '#fff', borderRadius: '8px', padding: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                            <AdobeXDIcon size={18} color="#470137" />
                        </div>
                    )}
                    {isBehanceUrl && (
                        <div style={{ position: 'absolute', top: '15px', right: '15px', background: '#fff', borderRadius: '8px', padding: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                            <BehanceIcon size={18} color="#053eff" />
                        </div>
                    )}
                    {commit.file_url && !isFigmaUrl && !isXDUrl && !isBehanceUrl && (
                        <div style={{ position: 'absolute', top: '15px', right: '15px', background: '#fff', borderRadius: '8px', padding: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                            <FileText size={18} color="var(--secondary)" />
                        </div>
                    )}
                </div>
                <div style={{ padding: '25px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h4 style={{ margin: '0 0 15px 0', fontSize: '1.05rem', fontWeight: '800', color: 'var(--secondary)', lineHeight: '1.4' }}>
                        {designData ? designData.title : linkifyText(commit.message)}
                    </h4>
                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px 16px', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'var(--secondary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: '900' }}>
                                {(commit.author?.[0] || commit.username?.[0] || 'U').toUpperCase()}
                            </div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--secondary)', fontWeight: '800' }}>{commit.author || commit.username || 'UNKNOWN'}</span>
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700' }}>
                            {isPrincipal ? 'Project Link' : `Edited ${new Date(commit.created_at).toLocaleDateString()}`}
                        </span>
                    </div>

                    {isMyCommit && !isPrincipal && (
                        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                            <button onClick={() => onEdit(commit)} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'transparent', color: 'var(--secondary)', cursor: 'pointer', fontWeight: '700', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                <Edit2 size={12} /> EDIT
                            </button>
                            <button onClick={() => onDelete(commit)} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #fecdd3', background: '#fff1f2', color: '#e11d48', cursor: 'pointer', fontWeight: '700', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#ffe4e6'} onMouseLeave={(e) => e.currentTarget.style.background = '#fff1f2'}>
                                <Trash2 size={12} /> DELETE
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const SchemaCanvas = ({ commits, project, connections, activeNode, onNodeClick, mousePos, setMousePos, currentUser, setConnections, isDesignProject }) => {
    const toast = useToast();

    const [positions, setPositions] = useState(() => {
        const pos = {};
        pos['principal'] = { x: project.pos_x ?? 50, y: project.pos_y ?? 50 };
        commits.forEach(c => {
            pos[c.id] = { x: c.pos_x ?? 400, y: c.pos_y ?? 50 };
        });
        return pos;
    });

    const [dragging, setDragging] = useState(null);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [saving, setSaving] = useState(false);
    const canvasRef = useRef(null);

    const handlePointerDown = (e, id) => {
        if (e.target.closest('#node-' + id + '-left') || e.target.closest('#node-' + id + '-right')) return;
        setDragging(id);
        const nodeEl = document.getElementById(`canvas-node-${id}`);
        if (!nodeEl) return;
        const nodeRect = nodeEl.getBoundingClientRect();
        setOffset({
            x: e.clientX - nodeRect.left,
            y: e.clientY - nodeRect.top
        });
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e) => {
        if (!canvasRef.current) return;

        if (activeNode && setMousePos) {
            const canvasRect = canvasRef.current.getBoundingClientRect();
            setMousePos({
                x: e.clientX - canvasRect.left,
                y: e.clientY - canvasRect.top
            });
            return;
        }

        if (!dragging) return;
        const canvasRect = canvasRef.current.getBoundingClientRect();
        let newX = e.clientX - canvasRect.left - offset.x;
        let newY = e.clientY - canvasRect.top - offset.y;

        // Native DOM update for ZERO LAG!
        const nodeEl = document.getElementById(`canvas-node-${dragging}`);
        if (nodeEl) {
            nodeEl.style.left = `${newX}px`;
            nodeEl.style.top = `${newY}px`;
        }

        if (window.requestAnimationFrame) {
            window.requestAnimationFrame(updateLinesNative);
        } else {
            updateLinesNative();
        }
    };

    const handlePointerUp = (e) => {
        if (dragging) {
            e.currentTarget.releasePointerCapture(e.pointerId);

            const nodeEl = document.getElementById(`canvas-node-${dragging}`);
            if (nodeEl) {
                setPositions(prev => ({
                    ...prev,
                    [dragging]: { x: parseFloat(nodeEl.style.left), y: parseFloat(nodeEl.style.top) }
                }));
            }

            setDragging(null);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await axios.post('http://localhost:5000/api/workshop/schema', {
                projectId: project.id,
                positions,
                connections
            });
            toast.success('Schema Layout Persisted');
        } catch (err) {
            console.error('Failed to save schema', err);
            toast.error('Failed to persist layout');
        } finally {
            setSaving(false);
        }
    };

    const updateLinesNative = useCallback(() => {
        if (!canvasRef.current) return;
        const gridRect = canvasRef.current.getBoundingClientRect();

        connections.forEach(conn => {
            const fromEl = document.getElementById(`node-${conn.fromId}-${conn.fromSide}`);
            const toEl = document.getElementById(`node-${conn.toId}-${conn.toSide}`);
            const pathEl = document.getElementById(`line-${conn.fromId}-${conn.toId}`);
            if (!fromEl || !toEl || !pathEl) return;

            const fromRect = fromEl.getBoundingClientRect();
            const toRect = toEl.getBoundingClientRect();

            const x1 = fromRect.left + fromRect.width / 2 - gridRect.left;
            const y1 = fromRect.top + fromRect.height / 2 - gridRect.top;
            const x2 = toRect.left + toRect.width / 2 - gridRect.left;
            const y2 = toRect.top + toRect.height / 2 - gridRect.top;

            // Smarter curves based on side
            const c1x = conn.fromSide === 'right' ? x1 + 100 : x1 - 100;
            const c2x = conn.toSide === 'right' ? x2 + 100 : x2 - 100;

            pathEl.setAttribute('d', `M ${x1} ${y1} C ${c1x} ${y1}, ${c2x} ${y2}, ${x2} ${y2}`);
        });
    }, [connections]);

    useEffect(() => {
        const timer = setTimeout(updateLinesNative, 50);
        return () => clearTimeout(timer);
    }, [updateLinesNative, positions]);

    return (
        <div
            id="schema-canvas-wrapper"
            ref={canvasRef}
            className="animate-fade-in"
            style={{ width: '100%', height: '800px', background: '#f8fafc', borderRadius: '30px', position: 'relative', overflow: 'hidden', border: '1px solid #e2e8f0', cursor: dragging ? 'grabbing' : 'default', backgroundImage: 'radial-gradient(#cbd5e1 2px, transparent 2px)', backgroundSize: '40px 40px' }}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
        >
            <button onClick={handleSave} disabled={saving} style={{ position: 'absolute', top: 20, right: 20, zIndex: 100, padding: '12px 24px', background: 'var(--secondary)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />} SAVE SCHEMA
            </button>

            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10, overflow: 'visible' }}>
                {connections.map((conn, i) => (
                    <path
                        key={i}
                        id={`line-${conn.fromId}-${conn.toId}`}
                        d="" // Calculated by updateLinesNative
                        stroke="var(--accent)"
                        strokeWidth="5"
                        fill="none"
                        strokeLinecap="round"
                        style={{
                            pointerEvents: 'auto',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            filter: 'drop-shadow(0 4px 6px rgba(184, 168, 48, 0.4))'
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            const newConns = connections.filter((_, idx) => idx !== i);
                            setConnections(newConns);
                            axios.post('http://localhost:5000/api/workshop/schema', { projectId: project.id, positions: {}, connections: newConns }).catch(console.error);
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.stroke = '#e11d48'; e.currentTarget.style.strokeWidth = '8'; e.currentTarget.style.opacity = '1'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.stroke = 'var(--accent)'; e.currentTarget.style.strokeWidth = '5'; e.currentTarget.style.opacity = '0.8'; }}
                    />
                ))}
                {activeNode && (() => {
                    const fromEl = document.getElementById(`node-${activeNode.id}-${activeNode.side}`);
                    if (!fromEl || !canvasRef.current) return null;
                    const gridRect = canvasRef.current.getBoundingClientRect();
                    const fromRect = fromEl.getBoundingClientRect();
                    const x1 = fromRect.left + fromRect.width / 2 - gridRect.left;
                    const y1 = fromRect.top + fromRect.height / 2 - gridRect.top;

                    const c1x = activeNode.side === 'right' ? x1 + 100 : x1 - 100;
                    const c2x = mousePos.x;

                    return (
                        <path
                            d={`M ${x1} ${y1} C ${c1x} ${y1}, ${c2x} ${mousePos.y}, ${mousePos.x} ${mousePos.y}`}
                            stroke="var(--accent)"
                            strokeWidth="5"
                            fill="none"
                            strokeDasharray="10,10"
                            strokeLinecap="round"
                            style={{ opacity: 0.8 }}
                        />
                    );
                })()}
            </svg>

            <div
                id="canvas-node-principal"
                onPointerDown={(e) => handlePointerDown(e, 'principal')}
                style={{ position: 'absolute', left: positions['principal']?.x || 0, top: positions['principal']?.y || 0, width: '320px', cursor: dragging === 'principal' ? 'grabbing' : 'grab', zIndex: dragging === 'principal' ? 50 : 20 }}
            >
                <DesignCommitCard
                    isPrincipal={true}
                    activeNode={activeNode}
                    onNodeClick={onNodeClick}
                    commit={{
                        id: 'principal',
                        message: isDesignProject ? project.figma_link : project.github_url,
                        user_id: project.user_id,
                        created_at: project.created_at,
                        author: project.username,
                        username: project.username,
                        file_url: null
                    }}
                    currentUser={currentUser}
                    onDelete={() => { }}
                    onEdit={() => { }}
                />
            </div>

            {commits.filter(c => c.message !== 'Genesis: Project Initialized').map(commit => (
                <div
                    key={commit.id}
                    id={`canvas-node-${commit.id}`}
                    onPointerDown={(e) => handlePointerDown(e, commit.id)}
                    style={{ position: 'absolute', left: positions[commit.id]?.x || 0, top: positions[commit.id]?.y || 0, width: '320px', cursor: dragging === commit.id ? 'grabbing' : 'grab', zIndex: dragging === commit.id ? 50 : 20 }}
                >
                    <DesignCommitCard
                        commit={commit}
                        activeNode={activeNode}
                        onNodeClick={onNodeClick}
                        currentUser={currentUser}
                        onDelete={() => { }}
                        onEdit={(c) => {
                            const urls = c.message.match(/(https?:\/\/[^\s]+)/g) || [];
                            const messageWithoutUrls = c.message.replace(/(https?:\/\/[^\s]+)/g, '').trim();
                            setRenaming({ 
                                type: 'commit', 
                                id: c.id, 
                                value: messageWithoutUrls, 
                                file_url: c.file_url,
                                attachedLinks: urls.map(url => {
                                    let type = 'link';
                                    if (url.includes('figma.com')) type = 'figma';
                                    else if (url.includes('xd.adobe.com')) type = 'xd';
                                    else if (url.includes('github.com')) type = 'github';
                                    return { type, url };
                                })
                            });
                        }}
                    />
                </div>
            ))}
        </div>
    );
};

const ProjectWorkshop = ({ project, onBack }) => {
    const toast = useToast();
    const [internalBranches, setInternalBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [commits, setCommits] = useState([]);
    const [newBranchName, setNewBranchName] = useState('');
    const [newCommitMsg, setNewCommitMsg] = useState('');
    const [commitFile, setCommitFile] = useState(null);
    const [attachedLinks, setAttachedLinks] = useState([]); // [{ type: 'figma' | 'link', url: string }]
    const [showSourceSelector, setShowSourceSelector] = useState(false);
    const [showEditSourceSelector, setShowEditSourceSelector] = useState(false);
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState('INTERNAL'); // INTERNAL or EXTERNAL
    const [githubData, setGithubData] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [pendingSource, setPendingSource] = useState(null); // { type, label }
    const [pendingUrl, setPendingUrl] = useState('');
    const [hoveredLink, setHoveredLink] = useState(null);
    
    // Edit Modal specific states
    const [editPendingSource, setEditPendingSource] = useState(null);
    const [editPendingUrl, setEditPendingUrl] = useState('');
    const [editHoveredLink, setEditHoveredLink] = useState(null);
    const sourceBtnStyle = { width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700', fontSize: '0.8rem', color: 'var(--secondary)', transition: 'all 0.2s' };

    // Context Menu State
    const [contextMenu, setContextMenu] = useState(null); // { x, y, type: 'branch'|'commit', item }
    const [renaming, setRenaming] = useState(null); // { type: 'branch'|'commit', id, value }
    const [fullscreenImage, setFullscreenImage] = useState(null);
    const renameInputRef = useRef(null);

    // Node Connection State
    const [activeNode, setActiveNode] = useState(null); // { id, side }
    const [connections, setConnections] = useState([]); // [{ fromId, fromSide, toId, toSide }]
    const [lines, setLines] = useState([]);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const gridRef = useRef(null);

    const handleNodeClick = (id, side, e, customRect) => {
        if (e) {
            const rect = customRect || (gridRef.current ? gridRef.current.getBoundingClientRect() : null);
            if (rect) {
                setMousePos({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top
                });
            }
        }

        if (!activeNode) {
            // Check if this node is already connected
            const existingConnIndex = connections.findIndex(c =>
                (c.fromId === id && c.fromSide === side) ||
                (c.toId === id && c.toSide === side)
            );

            if (existingConnIndex !== -1) {
                // Disconnect and pick up the other end of the line
                const conn = connections[existingConnIndex];
                const newConnections = [...connections];
                newConnections.splice(existingConnIndex, 1);
                setConnections(newConnections);

                // Auto-save disconnection
                axios.post('http://localhost:5000/api/workshop/schema', { projectId: project.id, positions: {}, connections: newConnections }).catch(console.error);

                if (conn.fromId === id && conn.fromSide === side) {
                    setActiveNode({ id: conn.toId, side: conn.toSide });
                } else {
                    setActiveNode({ id: conn.fromId, side: conn.fromSide });
                }
            } else {
                setActiveNode({ id, side });
            }
        } else {
            if (activeNode.id === id && activeNode.side === side) {
                setActiveNode(null); // toggle off
            } else {
                const exists = connections.some(c =>
                    (c.fromId === activeNode.id && c.fromSide === activeNode.side && c.toId === id && c.toSide === side) ||
                    (c.fromId === id && c.fromSide === side && c.toId === activeNode.id && c.toSide === activeNode.side)
                );
                if (!exists) {
                    const newConnections = [...connections, { fromId: activeNode.id, fromSide: activeNode.side, toId: id, toSide: side }];
                    setConnections(newConnections);

                    // Auto-save connection
                    axios.post('http://localhost:5000/api/workshop/schema', { projectId: project.id, positions: {}, connections: newConnections }).catch(console.error);
                }
                setActiveNode(null);
            }
        }
    };

    const updateLines = useCallback(() => {
        if (!gridRef.current) return;
        const gridRect = gridRef.current.getBoundingClientRect();

        const newLines = connections.map(conn => {
            const fromEl = document.getElementById(`node-${conn.fromId}-${conn.fromSide}`);
            const toEl = document.getElementById(`node-${conn.toId}-${conn.toSide}`);
            if (!fromEl || !toEl) return null;

            const fromRect = fromEl.getBoundingClientRect();
            const toRect = toEl.getBoundingClientRect();

            const x1 = fromRect.left + fromRect.width / 2 - gridRect.left;
            const y1 = fromRect.top + fromRect.height / 2 - gridRect.top;
            const x2 = toRect.left + toRect.width / 2 - gridRect.left;
            const y2 = toRect.top + toRect.height / 2 - gridRect.top;

            return { x1, y1, x2, y2, id: `${conn.fromId}-${conn.toId}` };
        }).filter(Boolean);

        setLines(newLines);
    }, [connections]);

    useEffect(() => {
        // Run slightly after render to ensure elements are in DOM
        const timer = setTimeout(updateLines, 100);
        window.addEventListener('resize', updateLines);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', updateLines);
        };
    }, [updateLines, commits]);

    useEffect(() => {
        if (!activeNode) return;
        const handleMouseMove = (e) => {
            if (!gridRef.current) return;
            const gridRect = gridRef.current.getBoundingClientRect();
            setMousePos({
                x: e.clientX - gridRect.left,
                y: e.clientY - gridRect.top
            });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [activeNode]);

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

            // Construct message with links
            let finalMessage = renaming.value.trim();
            if (renaming.attachedLinks) {
                renaming.attachedLinks.forEach(link => {
                    if (!finalMessage.includes(link.url)) {
                        finalMessage += `\n${link.url}`;
                    }
                });
            }

            await axios.put(`http://localhost:5000/api/workshop/commits/${renaming.id}`, {
                message: finalMessage,
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
            const branchType = workspaceType === 'DESIGNER' ? 'DESIGN' : 'DEVELOP';
            const response = await axios.get(`http://localhost:5000/api/workshop/branches/${project.id}?type=${branchType}`);
            setInternalBranches(response.data);
            if (response.data.length > 0) {
                // Try to find main branch, otherwise pick first
                const mainBranch = response.data.find(b => b.name.toLowerCase() === 'main');
                setSelectedBranch(mainBranch || response.data[0]);
            } else {
                setSelectedBranch(null);
                setCommits([]);
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
    const [teamRoles, setTeamRoles] = useState({ hasDesigner: false, hasDeveloper: false });

    const isCurrentUserDesigner = (currentUser.occupation || '').toUpperCase().includes('DESIGN');
    const [workspaceType, setWorkspaceType] = useState(isCurrentUserDesigner ? 'DESIGNER' : 'DEVELOPER');

    // The view structure (Figma vs Terminal) depends entirely on the active workspace
    const isDesignProject = workspaceType === 'DESIGNER';

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchSchema = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/workshop/schema/${project.id}`);
            setConnections(res.data || []);
        } catch (error) { console.error('Error fetching schema', error); }
    };

    useEffect(() => {
        fetchInternalBranches();
        fetchSchema();

        // Analyze Team Roles
        const fetchTeamRoles = async () => {
            try {
                let hasDes = false;
                let hasDev = false;

                const ownerOcc = (project.owner_occupation || '').toUpperCase();
                if (ownerOcc.includes('DESIGN')) hasDes = true;
                else hasDev = true;

                const res = await axios.get(`http://localhost:5000/api/intelligence/members/${project.id}`);
                const members = res.data.filter(m => m.is_accepted);

                members.forEach(m => {
                    const occ = (m.occupation || '').toUpperCase();
                    if (occ.includes('DESIGN')) hasDes = true;
                    else hasDev = true;
                });

                setTeamRoles({ hasDesigner: hasDes, hasDeveloper: hasDev });

                if (hasDes && !hasDev) setWorkspaceType('DESIGNER');
                else if (hasDev && !hasDes) setWorkspaceType('DEVELOPER');
                // if mixed, keep current user's default workspace

                if (hasDes && !hasDev) setViewMode('EXTERNAL');
                else if (hasDev && !hasDes) setViewMode('INTERNAL');
            } catch (err) { console.error(err); }
        };
        fetchTeamRoles();
    }, [project.id]);

    useEffect(() => {
        if (project?.id) { /* mission sync trigger */ }
    }, [project.id]);

    useEffect(() => {
        if (selectedBranch) { fetchCommits(selectedBranch.id); }
        else { setCommits([]); }
    }, [selectedBranch]);

    // Re-fetch branches when workspace type changes to keep them isolated
    useEffect(() => {
        setSelectedBranch(null);
        setInternalBranches([]);
        fetchInternalBranches();
    }, [workspaceType]);

    const handleCreateBranch = async (e) => {
        e.preventDefault();
        if (!newBranchName) return;
        setLoading(true);
        try {
            const branchType = workspaceType === 'DESIGNER' ? 'DESIGN' : 'DEVELOP';
            await axios.post('http://localhost:5000/api/workshop/branches', {
                project_id: project.id,
                name: newBranchName,
                user_id: currentUser.id,
                type: branchType
            });
            setNewBranchName('');
            await fetchInternalBranches();
        } catch (error) { toast.error('Failed to create branch'); }
        finally { setLoading(false); }
    };

    const handleAddCommit = async (e) => {
        e.preventDefault();
        if ((!newCommitMsg && !commitFile) || !selectedBranch) return;
        setLoading(true);
        try {
            let fileUrl = null;
            if (commitFile) {
                const formData = new FormData();
                formData.append('file', commitFile);
                const uploadRes = await axios.post('http://localhost:5000/api/upload-datafile', formData);
                fileUrl = uploadRes.data.fileUrl;
            }

            // Construct message with links if any
            let finalMessage = newCommitMsg;
            attachedLinks.forEach(link => {
                if (!finalMessage.includes(link.url)) {
                    finalMessage += `\n${link.url}`;
                }
            });

            await axios.post('http://localhost:5000/api/workshop/commits', {
                branch_id: selectedBranch.id,
                user_id: currentUser.id,
                message: finalMessage || (commitFile ? commitFile.name : 'Update'),
                file_url: fileUrl
            });
            setNewCommitMsg('');
            setCommitFile(null);
            setAttachedLinks([]);
            fetchCommits(selectedBranch.id);
            toast.success('Update committed to timeline');
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

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* MIXED COLLAB WORKSPACE SWITCH */}
                    {teamRoles.hasDesigner && teamRoles.hasDeveloper && (
                        <div style={{ display: 'flex', background: '#e2e8f0', padding: '4px', borderRadius: '14px', marginRight: '10px' }}>
                            <button
                                onClick={() => setWorkspaceType('DESIGNER')}
                                style={{
                                    padding: '10px 16px', borderRadius: '10px', border: 'none',
                                    background: workspaceType === 'DESIGNER' ? '#fff' : 'transparent',
                                    color: workspaceType === 'DESIGNER' ? 'var(--secondary)' : 'var(--text-muted)',
                                    fontWeight: '800', fontSize: '0.65rem', cursor: 'pointer',
                                    boxShadow: workspaceType === 'DESIGNER' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                                    transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px'
                                }}
                            >
                                <FigmaIcon size={14} color={workspaceType === 'DESIGNER' ? "#F24E1E" : "currentColor"} /> DESIGNER LAB
                            </button>
                            <button
                                onClick={() => setWorkspaceType('DEVELOPER')}
                                style={{
                                    padding: '10px 16px', borderRadius: '10px', border: 'none',
                                    background: workspaceType === 'DEVELOPER' ? '#fff' : 'transparent',
                                    color: workspaceType === 'DEVELOPER' ? 'var(--secondary)' : 'var(--text-muted)',
                                    fontWeight: '800', fontSize: '0.65rem', cursor: 'pointer',
                                    boxShadow: workspaceType === 'DEVELOPER' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                                    transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px'
                                }}
                            >
                                <Terminal size={14} /> DEVELOPER LAB
                            </button>
                        </div>
                    )}

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
                            onClick={() => {
                                if (isDesignProject) {
                                    setViewMode('EXTERNAL');
                                } else {
                                    if (githubData) setViewMode('EXTERNAL'); else analyzeGitHub();
                                }
                            }}
                            disabled={!isDesignProject && (!project.github_url || analyzing)}
                            style={{
                                padding: '12px 20px',
                                borderRadius: '12px',
                                border: 'none',
                                background: viewMode === 'EXTERNAL' ? '#fff' : 'transparent',
                                color: (!isDesignProject && !project.github_url) ? 'var(--text-muted)' : 'var(--secondary)',
                                fontWeight: '800',
                                fontSize: '0.7rem',
                                cursor: (!isDesignProject && !project.github_url) ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                boxShadow: viewMode === 'EXTERNAL' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                                transition: 'all 0.3s',
                                opacity: (!isDesignProject && !project.github_url) ? 0.4 : 1
                            }}
                        >
                            {isDesignProject ? (
                                <Activity size={16} />
                            ) : (
                                analyzing ? <RefreshCw size={16} className="animate-spin" /> : <GithubIcon size={16} />
                            )}
                            {isDesignProject ? 'ANALYZE SCHEMA' : (githubData ? 'EXTERNAL INTEL' : 'ANALYZE GITHUB')}
                        </button>
                    </div>
                </div>
            </div>

            {isDesignProject ? (
                viewMode === 'INTERNAL' ? (
                    <div className="animate-fade-in">
                        <div className="blend-card" style={{ padding: isMobile ? '25px' : '40px', marginBottom: '40px', boxShadow: '0 10px 40px rgba(0,0,0,0.02)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3 style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--secondary)' }}>Design Updates & Links</h3>
                                <div style={{ padding: '6px 14px', background: '#f8fafc', borderRadius: '100px', fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-muted)' }}>{commits.length} CARDS</div>
                            </div>

                            {!selectedBranch ? (
                                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                                    <p style={{ fontWeight: '600' }}>No active design branch found. Please select or create a branch to begin.</p>
                                </div>
                            ) : (
                                isCurrentUserDesigner === isDesignProject ? (
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', alignItems: 'center' }}>
                                            <div style={{ flex: pendingSource ? 1 : 2, position: 'relative', display: 'flex', gap: '15px' }}>
                                                <input
                                                    value={newCommitMsg}
                                                    onChange={(e) => setNewCommitMsg(e.target.value)}
                                                    placeholder="What's the update? (Add a message or link)"
                                                    style={{ flex: 1, padding: '15px 25px', borderRadius: '15px', border: '1px solid var(--border)', background: '#f8fafc', fontWeight: '600', fontSize: '0.9rem' }}
                                                />
                                                
                                                {pendingSource && (
                                                    <div style={{ flex: 1, display: 'flex', gap: '10px', animation: 'fadeIn 0.3s' }}>
                                                        <input
                                                            value={pendingUrl}
                                                            onChange={(e) => setPendingUrl(e.target.value)}
                                                            placeholder={`Paste ${pendingSource.label} link...`}
                                                            autoFocus
                                                            style={{ flex: 1, padding: '15px 20px', borderRadius: '15px', border: '1px solid var(--accent)', background: '#fff', fontWeight: '600', fontSize: '0.85rem' }}
                                                        />
                                                        <button 
                                                            onClick={() => {
                                                                if (pendingUrl) {
                                                                    setAttachedLinks([...attachedLinks, { type: pendingSource.type, url: pendingUrl, label: pendingSource.label }]);
                                                                    setPendingSource(null);
                                                                    setPendingUrl('');
                                                                }
                                                            }}
                                                            style={{ width: '55px', height: '55px', borderRadius: '15px', border: 'none', background: 'var(--accent)', color: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                                        >
                                                            <Check size={20} />
                                                        </button>
                                                        <button 
                                                            onClick={() => { setPendingSource(null); setPendingUrl(''); }}
                                                            style={{ width: '55px', height: '55px', borderRadius: '15px', border: '1px solid var(--border)', background: '#f8fafc', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                                        >
                                                            <X size={20} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* CONFIRMED LINK ICONS */}
                                            {!pendingSource && attachedLinks.map((link, i) => (
                                                <div 
                                                    key={i} 
                                                    style={{ position: 'relative', width: '55px', height: '55px' }}
                                                    onMouseEnter={() => setHoveredLink(i)}
                                                    onMouseLeave={() => setHoveredLink(null)}
                                                >
                                                    <div style={{ 
                                                        width: '100%', height: '100%', borderRadius: '15px', 
                                                        background: 'var(--secondary)', color: 'white', 
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
                                                        transition: 'all 0.3s',
                                                        opacity: hoveredLink === i ? 0.2 : 1
                                                    }}>
                                                        {link.type === 'figma' ? <FigmaIcon size={20} color="white" /> : 
                                                         link.type === 'xd' ? <AdobeXDIcon size={20} color="white" /> :
                                                         link.type === 'behance' ? <BehanceIcon size={20} color="white" /> :
                                                         link.type === 'terminal' ? <Terminal size={20} /> :
                                                         <ExternalLink size={20} />}
                                                    </div>
                                                    {hoveredLink === i && (
                                                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.2s', zIndex: 10 }}>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); window.open(link.url, '_blank'); }}
                                                                style={{ flex: 1, border: 'none', background: 'var(--secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', borderTopLeftRadius: '15px', borderTopRightRadius: '15px', transition: 'all 0.2s' }}
                                                                title="Verify Link"
                                                                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                                                                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                                                            >
                                                                <Eye size={18} />
                                                            </button>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); setAttachedLinks(attachedLinks.filter((_, idx) => idx !== i)); }}
                                                                style={{ flex: 1, border: 'none', background: 'rgba(255,255,255,0.95)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', borderBottomLeftRadius: '15px', borderBottomRightRadius: '15px', borderTop: '1px solid #f1f5f9', transition: 'all 0.2s' }}
                                                                title="Delete"
                                                                onMouseEnter={(e) => e.currentTarget.style.background = '#fff'}
                                                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.95)'}
                                                            >
                                                                <X size={18} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}

                                            {/* FILE ICON */}
                                            {!pendingSource && commitFile && (
                                                <div 
                                                    style={{ position: 'relative', width: '55px', height: '55px' }}
                                                    onMouseEnter={() => setHoveredLink('file')}
                                                    onMouseLeave={() => setHoveredLink(null)}
                                                >
                                                    <div style={{ 
                                                        width: '100%', height: '100%', borderRadius: '15px', 
                                                        background: 'var(--accent)', color: 'var(--secondary)', 
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
                                                        transition: 'all 0.3s',
                                                        opacity: hoveredLink === 'file' ? 0.2 : 1
                                                    }}>
                                                        <Paperclip size={20} />
                                                    </div>
                                                    {hoveredLink === 'file' && (
                                                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.2s', zIndex: 10 }}>
                                                            <div style={{ flex: 1, background: 'var(--accent)', color: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderTopLeftRadius: '15px', borderTopRightRadius: '15px', fontSize: '0.6rem', fontWeight: '900', overflow: 'hidden', whiteSpace: 'nowrap', padding: '0 4px' }}>
                                                                FILE
                                                            </div>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); setCommitFile(null); }}
                                                                style={{ flex: 1, border: 'none', background: 'rgba(255,255,255,0.95)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', borderBottomLeftRadius: '15px', borderBottomRightRadius: '15px', borderTop: '1px solid #f1f5f9', transition: 'all 0.2s' }}
                                                                title="Remove File"
                                                                onMouseEnter={(e) => e.currentTarget.style.background = '#fff'}
                                                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.95)'}
                                                            >
                                                                <X size={18} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            
                                            {!pendingSource && (
                                                <div style={{ position: 'relative' }}>
                                                    <button
                                                        onClick={() => setShowSourceSelector(!showSourceSelector)}
                                                        className="btn-secondary"
                                                        style={{ width: '55px', height: '55px', padding: 0, borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: (attachedLinks.length > 0 || commitFile) ? 'var(--accent)' : '#f8fafc', border: '1px solid var(--border)', cursor: 'pointer' }}
                                                        title="Select Intel Source"
                                                    >
                                                        <Plus size={20} style={{ transform: showSourceSelector ? 'rotate(45deg)' : 'none', transition: 'all 0.3s' }} />
                                                    </button>

                                                    {showSourceSelector && (
                                                        <div style={{
                                                            position: 'absolute', bottom: '70px', right: 0, width: '220px',
                                                            background: '#fff', borderRadius: '18px', boxShadow: '0 15px 40px rgba(0,0,0,0.15)',
                                                            padding: '10px', zIndex: 100, border: '1px solid var(--border)',
                                                            animation: 'slideUp 0.3s ease'
                                                        }}>
                                                            <p style={{ fontSize: '0.65rem', fontWeight: '900', color: 'var(--text-muted)', padding: '10px', letterSpacing: '1px' }}>INTEL SOURCE</p>
                                                            
                                                            {isCurrentUserDesigner ? (
                                                                <>
                                                                    <button onClick={() => { setPendingSource({ type: 'figma', label: 'Figma' }); setShowSourceSelector(false); }} style={sourceBtnStyle} onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}><FigmaIcon size={16} /> Figma Link</button>
                                                                    <button onClick={() => { setPendingSource({ type: 'xd', label: 'Adobe XD' }); setShowSourceSelector(false); }} style={sourceBtnStyle} onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}><AdobeXDIcon size={16} /> Adobe XD</button>
                                                                    <button onClick={() => { setPendingSource({ type: 'behance', label: 'Behance' }); setShowSourceSelector(false); }} style={sourceBtnStyle} onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}><BehanceIcon size={16} /> Behance Link</button>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <button onClick={() => { setPendingSource({ type: 'link', label: 'GitHub' }); setShowSourceSelector(false); }} style={sourceBtnStyle} onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}><GithubIcon size={16} /> GitHub Ref</button>
                                                                    <button onClick={() => { setPendingSource({ type: 'terminal', label: 'Terminal' }); setShowSourceSelector(false); }} style={sourceBtnStyle} onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}><Terminal size={16} /> Terminal Log</button>
                                                                </>
                                                            )}

                                                            <button onClick={() => { document.getElementById('commit-file-upload-design').click(); setShowSourceSelector(false); }} style={sourceBtnStyle} onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}><Paperclip size={16} /> Local File</button>
                                                            <button onClick={() => { setPendingSource({ type: 'link', label: 'Link' }); setShowSourceSelector(false); }} style={sourceBtnStyle} onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}><ExternalLink size={16} /> General Link</button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <button onClick={handleAddCommit} className="btn-primary" style={{ padding: '0 30px', height: '55px', borderRadius: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <Send size={18} /> COMMIT
                                            </button>
                                        </div>

                                        <input
                                            id="commit-file-upload-design"
                                            type="file"
                                            accept={ALLOWED_FILE_TYPES}
                                            onChange={(e) => {
                                                if (e.target.files?.[0]) setCommitFile(e.target.files[0]);
                                            }}
                                            style={{ display: 'none' }}
                                        />

                                    </div>
                                ) : (
                                    <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '18px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '800', fontSize: '0.8rem', border: '1px dashed var(--border)' }}>
                                        Read-Only: Only Designers can broadcast updates to the Design Lab.
                                    </div>
                                )
                            )}
                        </div>

                        <div style={{ position: 'relative', paddingBottom: '100px' }} ref={gridRef}>
                            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10, overflow: 'visible' }}>
                                {lines.map((line, i) => (
                                    <path
                                        key={i}
                                        d={`M ${line.x1} ${line.y1} C ${line.x1 + 50} ${line.y1}, ${line.x2 - 50} ${line.y2}, ${line.x2} ${line.y2}`}
                                        stroke="var(--accent)"
                                        strokeWidth="4"
                                        fill="none"
                                        strokeDasharray="8,8"
                                        strokeLinecap="round"
                                        style={{ filter: 'drop-shadow(0 4px 6px rgba(184, 168, 48, 0.4))', opacity: 0.8 }}
                                    />
                                ))}
                                {activeNode && (() => {
                                    const fromEl = document.getElementById(`node-${activeNode.id}-${activeNode.side}`);
                                    if (!fromEl || !gridRef.current) return null;
                                    const gridRect = gridRef.current.getBoundingClientRect();
                                    const fromRect = fromEl.getBoundingClientRect();
                                    const x1 = fromRect.left + fromRect.width / 2 - gridRect.left;
                                    const y1 = fromRect.top + fromRect.height / 2 - gridRect.top;

                                    const c1x = activeNode.side === 'right' ? x1 + 50 : x1 - 50;
                                    const c2x = mousePos.x;

                                    return (
                                        <path
                                            d={`M ${x1} ${y1} C ${c1x} ${y1}, ${c2x} ${mousePos.y}, ${mousePos.x} ${mousePos.y}`}
                                            stroke="var(--accent)"
                                            strokeWidth="4"
                                            fill="none"
                                            strokeDasharray="8,8"
                                            strokeLinecap="round"
                                            style={{ filter: 'drop-shadow(0 4px 6px rgba(184, 168, 48, 0.4))', opacity: 0.8 }}
                                        />
                                    );
                                })()}
                            </svg>

                            {/* Section 1: Connected Story */}
                            <div style={{ marginBottom: '60px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px', opacity: 0.6 }}>
                                    <Layers size={14} color="var(--accent)" />
                                    <span style={{ fontSize: '0.65rem', fontWeight: '900', letterSpacing: '2px', color: 'var(--secondary)' }}>CONNECTED INTELLIGENCE</span>
                                    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                                </div>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '80px', position: 'relative', zIndex: 15 }}>
                                    {/* Principal Card: Always considered part of the main story if it has any connection */}
                                    {(connections.some(c => c.fromId === 'principal' || c.toId === 'principal') || commits.length === 0) && (
                                        <DesignCommitCard
                                            key="principal"
                                            isPrincipal={true}
                                            activeNode={activeNode}
                                            onNodeClick={handleNodeClick}
                                            commit={{
                                                id: 'principal',
                                                message: isDesignProject ? project.figma_link : project.github_url,
                                                user_id: project.user_id,
                                                created_at: project.created_at,
                                                author: project.username,
                                                username: project.username,
                                                file_url: null
                                            }}
                                            currentUser={currentUser}
                                            onDelete={() => { }}
                                            onEdit={() => { }}
                                        />
                                    )}

                                    {commits.filter(c => c.message !== 'Genesis: Project Initialized' && connections.some(conn => conn.fromId === c.id || conn.toId === c.id)).map(commit => (
                                        <DesignCommitCard
                                            key={commit.id}
                                            commit={commit}
                                            activeNode={activeNode}
                                            onNodeClick={handleNodeClick}
                                            currentUser={currentUser}
                                            onDelete={(c) => handleDeleteCommit(c)}
                                            onEdit={(c) => {
                                                const urls = c.message.match(/(https?:\/\/[^\s]+)/g) || [];
                                                const messageWithoutUrls = c.message.replace(/(https?:\/\/[^\s]+)/g, '').trim();
                                                setRenaming({ 
                                                    type: 'commit', 
                                                    id: c.id, 
                                                    value: messageWithoutUrls, 
                                                    file_url: c.file_url,
                                                    attachedLinks: urls.map(url => {
                                                        let type = 'link';
                                                        if (url.includes('figma.com')) type = 'figma';
                                                        else if (url.includes('xd.adobe.com')) type = 'xd';
                                                        else if (url.includes('behance.net')) type = 'behance';
                                                        else if (url.includes('github.com')) type = 'github';
                                                        return { type, url };
                                                    })
                                                });
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Section 2: Standalone Updates */}
                            {((!connections.some(c => c.fromId === 'principal' || c.toId === 'principal') && commits.length > 0) || 
                               commits.some(c => c.message !== 'Genesis: Project Initialized' && !connections.some(conn => conn.fromId === c.id || conn.toId === c.id))) && (
                                <div style={{ marginTop: '80px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px', opacity: 0.6 }}>
                                        <Send size={14} color="var(--text-muted)" />
                                        <span style={{ fontSize: '0.65rem', fontWeight: '900', letterSpacing: '2px', color: 'var(--text-muted)' }}>INDEPENDENT UPDATES</span>
                                        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                                    </div>
                                    
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '80px', position: 'relative', zIndex: 15 }}>
                                        {/* Principal Card if not connected */}
                                        {!connections.some(c => c.fromId === 'principal' || c.toId === 'principal') && commits.length > 0 && (
                                            <DesignCommitCard
                                                key="principal"
                                                isPrincipal={true}
                                                activeNode={activeNode}
                                                onNodeClick={handleNodeClick}
                                                commit={{
                                                    id: 'principal',
                                                    message: isDesignProject ? project.figma_link : project.github_url,
                                                    user_id: project.user_id,
                                                    created_at: project.created_at,
                                                    author: project.username,
                                                    username: project.username,
                                                    file_url: null
                                                }}
                                                currentUser={currentUser}
                                                onDelete={() => { }}
                                                onEdit={() => { }}
                                            />
                                        )}

                                        {commits.filter(c => c.message !== 'Genesis: Project Initialized' && !connections.some(conn => conn.fromId === c.id || conn.toId === c.id)).map(commit => (
                                            <DesignCommitCard
                                                key={commit.id}
                                                commit={commit}
                                                activeNode={activeNode}
                                                onNodeClick={handleNodeClick}
                                                currentUser={currentUser}
                                                onDelete={(c) => handleDeleteCommit(c)}
                                                onEdit={(c) => {
                                                    const urls = c.message.match(/(https?:\/\/[^\s]+)/g) || [];
                                                    const messageWithoutUrls = c.message.replace(/(https?:\/\/[^\s]+)/g, '').trim();
                                                    setRenaming({ 
                                                        type: 'commit', 
                                                        id: c.id, 
                                                        value: messageWithoutUrls, 
                                                        file_url: c.file_url,
                                                        attachedLinks: urls.map(url => {
                                                            let type = 'link';
                                                            if (url.includes('figma.com')) type = 'figma';
                                                            else if (url.includes('xd.adobe.com')) type = 'xd';
                                                            else if (url.includes('behance.net')) type = 'behance';
                                                            else if (url.includes('github.com')) type = 'github';
                                                            return { type, url };
                                                        })
                                                    });
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <SchemaCanvas
                        commits={commits}
                        project={project}
                        connections={connections}
                        setConnections={setConnections}
                        activeNode={activeNode}
                        onNodeClick={(id, side, e) => {
                            const canvasEl = document.getElementById('schema-canvas-wrapper');
                            handleNodeClick(id, side, e, canvasEl ? canvasEl.getBoundingClientRect() : null);
                        }}
                        mousePos={mousePos}
                        setMousePos={setMousePos}
                        currentUser={currentUser}
                        isDesignProject={isDesignProject}
                    />
                )
            ) : (
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

                                {isCurrentUserDesigner === isDesignProject ? (
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

                                            {project.github_url && !isDesignProject && (
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
                                ) : null}

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

                                            {isCurrentUserDesigner === isDesignProject ? (
                                                <>
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
                                                </>
                                            ) : (
                                                <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '18px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '800', fontSize: '0.8rem', border: '1px dashed var(--border)' }}>
                                                    Read-Only: {isDesignProject ? 'Only Designers can broadcast to the Design Lab.' : 'Only Developers can broadcast to the Development Terminal.'}
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

                                                {commits.filter(c => c.message !== 'Genesis: Project Initialized').map((commit, idx) => {
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
                                        <p style={{ color: 'var(--text-muted)', fontWeight: '800' }}>No active branch. Please select or create a branch to sync data.</p>
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
            )}

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
                                
                                <div style={{ position: 'relative' }}>
                                    <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', alignItems: 'center' }}>
                                        <div style={{ flex: editPendingSource ? 1 : 2, position: 'relative', display: 'flex', gap: '15px' }}>
                                            <textarea
                                                ref={renameInputRef}
                                                value={renaming.value}
                                                onChange={(e) => setRenaming({ ...renaming, value: e.target.value })}
                                                placeholder="Update message..."
                                                style={{ flex: 1, padding: '15px 25px', borderRadius: '15px', border: '1px solid var(--border)', background: '#f8fafc', fontWeight: '600', fontSize: '0.9rem', minHeight: '80px', resize: 'vertical' }}
                                            />
                                            
                                            {editPendingSource && (
                                                <div style={{ flex: 1, display: 'flex', gap: '10px', animation: 'fadeIn 0.3s' }}>
                                                    <input
                                                        value={editPendingUrl}
                                                        onChange={(e) => setEditPendingUrl(e.target.value)}
                                                        placeholder={`Paste ${editPendingSource.label} link...`}
                                                        autoFocus
                                                        style={{ flex: 1, padding: '15px 20px', borderRadius: '15px', border: '1px solid var(--accent)', background: '#fff', fontWeight: '600', fontSize: '0.85rem' }}
                                                    />
                                                    <button 
                                                        type="button"
                                                        onClick={() => {
                                                            if (editPendingUrl) {
                                                                setRenaming({
                                                                    ...renaming,
                                                                    attachedLinks: [...(renaming.attachedLinks || []), { type: editPendingSource.type, url: editPendingUrl, label: editPendingSource.label }]
                                                                });
                                                                setEditPendingSource(null);
                                                                setEditPendingUrl('');
                                                            }
                                                        }}
                                                        style={{ width: '55px', height: '80px', borderRadius: '15px', border: 'none', background: 'var(--accent)', color: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                                    >
                                                        <Check size={20} />
                                                    </button>
                                                    <button 
                                                        type="button"
                                                        onClick={() => { setEditPendingSource(null); setEditPendingUrl(''); }}
                                                        style={{ width: '55px', height: '80px', borderRadius: '15px', border: '1px solid var(--border)', background: '#f8fafc', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                                    >
                                                        <X size={20} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* CONFIRMED LINK ICONS */}
                                        {!editPendingSource && renaming.attachedLinks?.map((link, i) => (
                                            <div 
                                                key={i} 
                                                style={{ position: 'relative', width: '55px', height: '80px' }}
                                                onMouseEnter={() => setEditHoveredLink(i)}
                                                onMouseLeave={() => setEditHoveredLink(null)}
                                            >
                                                <div style={{ 
                                                    width: '100%', height: '100%', borderRadius: '15px', 
                                                    background: 'var(--secondary)', color: 'white', 
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
                                                    transition: 'all 0.3s',
                                                    opacity: editHoveredLink === i ? 0.2 : 1
                                                }}>
                                                    {link.type === 'figma' ? <FigmaIcon size={20} color="white" /> : 
                                                     link.type === 'xd' ? <AdobeXDIcon size={20} color="white" /> :
                                                     link.type === 'behance' ? <BehanceIcon size={20} color="white" /> :
                                                     link.type === 'terminal' ? <Terminal size={20} /> :
                                                     <ExternalLink size={20} />}
                                                </div>
                                                {editHoveredLink === i && (
                                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.2s', zIndex: 10 }}>
                                                        <button 
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); window.open(link.url, '_blank'); }}
                                                            style={{ flex: 1, border: 'none', background: 'var(--secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', borderTopLeftRadius: '15px', borderTopRightRadius: '15px', transition: 'all 0.2s' }}
                                                            title="Verify Link"
                                                            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                                                            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                                                        >
                                                            <Eye size={18} />
                                                        </button>
                                                        <button 
                                                            type="button"
                                                            onClick={(e) => { 
                                                                e.stopPropagation(); 
                                                                setRenaming({
                                                                    ...renaming,
                                                                    attachedLinks: renaming.attachedLinks.filter((_, idx) => idx !== i)
                                                                });
                                                            }}
                                                            style={{ flex: 1, border: 'none', background: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', borderBottomLeftRadius: '15px', borderBottomRightRadius: '15px', transition: 'all 0.2s' }}
                                                            title="Delete Link"
                                                            onMouseEnter={(e) => e.currentTarget.style.background = '#dc2626'}
                                                            onMouseLeave={(e) => e.currentTarget.style.background = '#ef4444'}
                                                        >
                                                            <X size={18} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        
                                        {!editPendingSource && (
                                            <div style={{ position: 'relative' }}>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowEditSourceSelector(!showEditSourceSelector)}
                                                    className="btn-secondary"
                                                    style={{ width: '55px', height: '80px', padding: 0, borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: (renaming.attachedLinks?.length > 0) ? 'var(--accent)' : '#f8fafc', border: '1px solid var(--border)', cursor: 'pointer' }}
                                                    title="Select Intel Source"
                                                >
                                                    <Plus size={20} style={{ transform: showEditSourceSelector ? 'rotate(45deg)' : 'none', transition: 'all 0.3s' }} />
                                                </button>

                                                {showEditSourceSelector && (
                                                    <div style={{
                                                        position: 'absolute', bottom: '90px', right: 0, width: '220px',
                                                        background: '#fff', borderRadius: '18px', boxShadow: '0 15px 40px rgba(0,0,0,0.15)',
                                                        padding: '10px', zIndex: 100, border: '1px solid var(--border)',
                                                        animation: 'slideUp 0.3s ease'
                                                    }}>
                                                        <p style={{ fontSize: '0.65rem', fontWeight: '900', color: 'var(--text-muted)', padding: '10px', letterSpacing: '1px' }}>INTEL SOURCE</p>
                                                        
                                                        {isCurrentUserDesigner ? (
                                                            <>
                                                                <button type="button" onClick={() => { setEditPendingSource({ type: 'figma', label: 'Figma' }); setShowEditSourceSelector(false); }} style={sourceBtnStyle} onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}><FigmaIcon size={16} /> Figma Link</button>
                                                                <button type="button" onClick={() => { setEditPendingSource({ type: 'xd', label: 'Adobe XD' }); setShowEditSourceSelector(false); }} style={sourceBtnStyle} onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}><AdobeXDIcon size={16} /> Adobe XD</button>
                                                                <button type="button" onClick={() => { setEditPendingSource({ type: 'behance', label: 'Behance' }); setShowEditSourceSelector(false); }} style={sourceBtnStyle} onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}><BehanceIcon size={16} /> Behance Link</button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button type="button" onClick={() => { setEditPendingSource({ type: 'link', label: 'GitHub' }); setShowEditSourceSelector(false); }} style={sourceBtnStyle} onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}><GithubIcon size={16} /> GitHub Ref</button>
                                                                <button type="button" onClick={() => { setEditPendingSource({ type: 'terminal', label: 'Terminal' }); setShowEditSourceSelector(false); }} style={sourceBtnStyle} onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}><Terminal size={16} /> Terminal Log</button>
                                                            </>
                                                        )}

                                                        <button type="button" onClick={() => { setEditPendingSource({ type: 'link', label: 'Link' }); setShowEditSourceSelector(false); }} style={sourceBtnStyle} onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}><ExternalLink size={16} /> General Link</button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
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

                                {(renaming.newFile || renaming.file_url) ? (
                                    <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '18px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <div style={{ width: '50px', height: '50px', background: 'var(--accent)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--secondary)' }}>
                                            {(renaming.newFile ? isImageFile(renaming.newFile.name) : isImageFile(renaming.file_url)) ? <Image size={24} /> : <FileText size={24} />}
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

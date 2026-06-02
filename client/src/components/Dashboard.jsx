import React, { useState, useEffect } from 'react';
import {
    Briefcase,
    Megaphone,
    User,
    LogOut,
    LayoutGrid,
    MessageSquare,
    Users,
    Menu,
    X
} from 'lucide-react';

import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import AuthService from '../services/auth.service';
import NotificationDropdown from './NotificationDropdown';

const Dashboard = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
    const [customBreadcrumb, setCustomBreadcrumb] = useState(null);
    const user = AuthService.getCurrentUser() || { id: 0, username: 'Guest', occupation: 'Unspecified' };

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 1024);
            if (window.innerWidth > 1024) setIsSidebarOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleLogout = () => {
        AuthService.logout();
        window.location.href = '/';
    };

    // Extract active sector from URL
    const activeTab = location.pathname.split('/').pop();

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#fcfcfc', overflow: 'hidden', position: 'relative' }}>
            {/* Mobile Header */}
            {isMobile && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, height: '70px',
                    background: '#004842', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', padding: '0 25px', zIndex: 100,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            {[1, 2, 3].map(i => (
                                <div key={i} style={{ width: '12px', height: '8px', background: '#E6D04C', borderRadius: '1px' }} />
                            ))}
                        </div>
                        <h1 style={{ fontSize: '1rem', fontWeight: '900', letterSpacing: '2px', color: '#fff', margin: 0 }}>L'BLEND</h1>
                    </div>
                    <button 
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
                    >
                        {isSidebarOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>
                </div>
            )}

            {/* Sidebar Overlay for Mobile */}
            {isMobile && isSidebarOpen && (
                <div 
                    onClick={() => setIsSidebarOpen(false)}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,40,36,0.4)', backdropFilter: 'blur(10px)', zIndex: 150 }}
                />
            )}

            {/* Sidebar */}
            <aside style={{
                width: isMobile ? '300px' : '320px',
                backgroundColor: '#fff',
                borderRight: '1px solid #f1f5f9',
                display: 'flex',
                flexDirection: 'column',
                padding: isMobile ? '100px 30px 40px 30px' : '40px',
                boxSizing: 'border-box',
                zIndex: 200,
                position: isMobile ? 'fixed' : 'relative',
                height: '100vh',
                left: isMobile ? (isSidebarOpen ? 0 : '-300px') : 0,
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
            }}>
                {!isMobile && (
                    <div style={{ marginBottom: '60px' }}>
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '15px' }}>
                            {[1, 2, 3].map(i => (
                                <div key={i} style={{ width: '30px', height: '20px', background: '#E6D04C', borderRadius: '3px', boxShadow: '0 4px 10px rgba(230, 208, 76, 0.2)' }} />
                            ))}
                        </div>
                        <h1 style={{ fontSize: '1.4rem', fontWeight: '900', letterSpacing: '4px', color: '#004842', margin: 0 }}>L'BLEND</h1>
                    </div>
                )}

                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <SidebarLink to="/dashboard/overview" icon={<LayoutGrid size={20} />} label="Overview" active={activeTab === 'overview'} onClick={() => isMobile && setIsSidebarOpen(false)} />
                    <SidebarLink to="/dashboard/broadcasts" icon={<Megaphone size={20} />} label="Broadcasts" active={activeTab === 'broadcasts'} onClick={() => isMobile && setIsSidebarOpen(false)} />
                    <SidebarLink to="/dashboard/projects" icon={<Briefcase size={20} />} label="Projects" active={activeTab === 'projects'} onClick={() => isMobile && setIsSidebarOpen(false)} />
                    <SidebarLink to="/dashboard/intelligence" icon={<MessageSquare size={20} />} label="Intelligence" active={activeTab === 'intelligence'} onClick={() => isMobile && setIsSidebarOpen(false)} />
                    <SidebarLink to="/dashboard/nexus" icon={<Users size={20} />} label="Nexus" active={activeTab === 'nexus'} onClick={() => isMobile && setIsSidebarOpen(false)} />
                    <SidebarLink to="/dashboard/identity" icon={<User size={20} />} label="Identity" active={activeTab === 'identity'} onClick={() => isMobile && setIsSidebarOpen(false)} />
                </nav>

                <div style={{ paddingTop: '30px', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                        onClick={handleLogout}
                        style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 24px',
                            borderRadius: '16px', border: 'none', background: 'transparent', color: '#e11d48',
                            fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer', textAlign: 'left', transition: 'all 0.3s'
                        }}
                    >
                        <LogOut size={20} /> Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ 
                flex: 1, 
                height: '100vh', 
                overflowY: 'auto', 
                backgroundColor: '#fcfcfc', 
                position: 'relative',
                paddingTop: isMobile ? '70px' : 0 
            }}>
                {/* Top Bar - Only on Desktop */}
                {!isMobile && (
                    <div style={{ position: 'sticky', top: 0, height: '100px', backgroundColor: 'rgba(252,252,252,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 50px', zIndex: 20 }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: '900', letterSpacing: '2px', color: 'rgba(0,72,66,0.4)', textTransform: 'uppercase' }}>
                            {customBreadcrumb || `L'BLEND / ${activeTab}`}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
                            <NotificationDropdown user={user} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', paddingLeft: '25px', borderLeft: '1px solid #f1f5f9' }}>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontSize: '0.9rem', fontWeight: '900', color: '#004842', margin: 0 }}>{user?.username}</p>
                                    <p style={{ fontSize: '0.65rem', fontWeight: '700', color: 'rgba(0,72,66,0.5)', textTransform: 'uppercase', margin: 0 }}>{user?.occupation}</p>
                                </div>
                                <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: '#004842', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '900', fontSize: '1.2rem', boxShadow: '0 8px 20px rgba(0,72,66,0.15)', overflow: 'hidden', cursor: 'pointer' }} onClick={() => navigate('/dashboard/identity')}>
                                    {(user?.avatar || user?.google_avatar) ? (
                                        <img src={user.avatar || user.google_avatar} alt="Identity" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        user?.username?.[0]?.toUpperCase() || 'G'
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div style={{ padding: isMobile ? '30px 20px' : '0 50px 50px 50px' }}>
                    <Outlet context={{ user, setCustomBreadcrumb }} />
                </div>
            </main>
        </div>
    );
};

const SidebarLink = ({ to, icon, label, active, onClick }) => (
    <NavLink
        to={to}
        onClick={onClick}
        style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 24px',
            borderRadius: '18px', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'all 0.3s cubic-bezier(0.2, 1, 0.3, 1)',
            textDecoration: 'none',
            background: active ? '#004842' : 'transparent',
            color: active ? '#fff' : 'rgba(0,72,66,0.6)',
            fontWeight: '700',
            boxShadow: active ? '0 10px 25px rgba(0,72,66,0.15)' : 'none'
        }}
    >
        <span style={{ color: active ? '#E6D04C' : 'inherit' }}>{icon}</span>
        {label}
    </NavLink>
);

export default Dashboard;

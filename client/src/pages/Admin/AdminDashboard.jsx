import React from 'react';
import { ShieldCheck, Activity, Users } from 'lucide-react';

const AdminDashboard = ({ user }) => {
    return (
        <div className="animate-fade-in">
            <h2 style={{ fontSize: '2rem', marginBottom: '25px' }}>Command <span style={{ color: 'var(--accent-yellow)' }}>Center</span></h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                <div className="glass-card" style={{ padding: '25px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '800' }}>TOTAL NETWORK USERS</p>
                        <Users size={20} color="var(--accent-yellow)"/>
                    </div>
                    <p style={{ fontSize: '2rem', fontWeight: '800', marginTop: '15px' }}>4,921</p>
                </div>
                <div className="glass-card" style={{ padding: '25px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '800' }}>UPLINK HEALTH</p>
                        <Activity size={20} color="var(--accent-yellow)"/>
                    </div>
                    <p style={{ fontSize: '2rem', fontWeight: '800', marginTop: '15px' }}>99.98%</p>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;

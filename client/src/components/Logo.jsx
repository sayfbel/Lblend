import React from 'react';

const Logo = () => (
    <div style={{ display: 'flex', gap: '10px' }}>
        {[1, 2, 3].map(i => (
            <div key={i} style={{ 
                width: '20px', 
                height: '20px', 
                background: 'var(--accent)', 
                borderRadius: '4px',
                boxShadow: '0 2px 10px rgba(230, 208, 76, 0.2)'
            }} />
        ))}
    </div>
);

export default Logo;

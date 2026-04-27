import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const FashionSelect = ({ options, value, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="fashion-select-container" ref={selectRef} style={{ position: 'relative', width: '100%' }}>
      {label && <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '1px', textTransform: 'uppercase' }}>{label}</label>}
      
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: '#f8fafc',
          border: isOpen ? '1px solid var(--secondary)' : '1px solid var(--border)',
          padding: '0.8rem 1.2rem',
          borderRadius: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          boxShadow: isOpen ? '0 0 0 4px rgba(0, 72, 66, 0.05)' : 'none'
        }}
      >
        <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--secondary)' }}>{value}</span>
        <ChevronDown size={18} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(100% + 8px)', // Opens upwards
          left: 0,
          right: 0,
          background: '#ffffff',
          borderRadius: '14px',
          boxShadow: '0 -20px 40px -15px rgba(0,0,0,0.15)', // Shadow adjusted for top
          border: '1px solid var(--border)',
          zIndex: 100,
          overflow: 'hidden',
          animation: 'fashionSlideUp 0.3s cubic-bezier(0.23, 1, 0.32, 1)'
        }}>
          {options.map((opt) => (
            <div 
              key={opt}
              onClick={() => {
                onChange(opt);
                setIsOpen(false);
              }}
              style={{
                padding: '12px 20px',
                fontSize: '0.9rem',
                fontWeight: '600',
                color: value === opt ? 'white' : 'var(--secondary)',
                background: value === opt ? 'var(--secondary)' : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (value !== opt) e.currentTarget.style.background = '#f1f5f9';
              }}
              onMouseLeave={(e) => {
                if (value !== opt) e.currentTarget.style.background = 'transparent';
              }}
            >
              {opt}
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes fashionSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default FashionSelect;

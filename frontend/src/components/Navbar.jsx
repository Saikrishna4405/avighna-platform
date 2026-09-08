import React, { useState } from 'react';
import { Play, Wifi, WifiOff, Globe } from 'lucide-react';

export const Navbar = ({ title, currentUser, onRoleSwitch, onRunDemoScenario, isOnline = true }) => {
  const [lang, setLang] = useState('en');

  return (
    <header className="top-navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <h1 className="page-title">{title}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', background: isOnline ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)', color: isOnline ? '#34d399' : '#fbbf24', padding: '4px 10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
          {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
          <span>{isOnline ? 'ONLINE (SYNCED)' : 'OFFLINE MODE (QUEUED)'}</span>
        </div>
      </div>

      <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Regional Language Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 255, 255, 0.05)', padding: '4px 8px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <Globe size={14} color="#94a3b8" />
          <select 
            value={lang} 
            onChange={(e) => setLang(e.target.value)}
            style={{ background: 'none', border: 'none', color: '#f8fafc', fontSize: '0.78rem', cursor: 'pointer', outline: 'none' }}
          >
            <option value="en" style={{ background: '#0f172a', color: '#fff' }}>English (EN)</option>
            <option value="as" style={{ background: '#0f172a', color: '#fff' }}>অসমীয়া (Assamese)</option>
            <option value="bn" style={{ background: '#0f172a', color: '#fff' }}>বাংলা (Bengali)</option>
            <option value="hi" style={{ background: '#0f172a', color: '#fff' }}>हिंदी (Hindi)</option>
          </select>
        </div>

        <button 
          onClick={onRunDemoScenario}
          className="btn-primary"
          style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)' }}
        >
          <Play size={16} fill="white" />
          <span>SIMULATE EMERGENCY WORKFLOW</span>
        </button>

        {currentUser && (
          <div className="user-badge" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
              <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{currentUser.name}</span>
              <span style={{ fontSize: '0.7rem', color: '#67e8f9' }}>{currentUser.district}</span>
            </div>
            {onRoleSwitch ? (
              <select
                value={currentUser.role}
                onChange={(e) => onRoleSwitch(e.target.value)}
                style={{ cursor: 'pointer', outline: 'none', background: 'rgba(59, 130, 246, 0.25)', color: '#93c5fd', border: '1px solid rgba(59, 130, 246, 0.5)', padding: '4px 8px', borderRadius: '12px', fontWeight: 700, fontSize: '0.75rem' }}
              >
                <option value="ADMIN" style={{ background: '#0f172a', color: '#fff' }}>👑 ADMIN (Full Access)</option>
                <option value="VERIFIER" style={{ background: '#0f172a', color: '#fff' }}>✅ VERIFIER (Approve Blockages)</option>
                <option value="FIELD_OFFICER" style={{ background: '#0f172a', color: '#fff' }}>⚠️ FIELD OFFICER (Report Hazards)</option>
                <option value="LOGISTICS_OPERATOR" style={{ background: '#0f172a', color: '#fff' }}>🚛 LOGISTICS OPS (Fleet & Reroute)</option>
                <option value="DISTRICT_PLANNER" style={{ background: '#0f172a', color: '#fff' }}>🗺️ PLANNER (Corridors)</option>
              </select>
            ) : (
              <span className="role-tag">{currentUser.role}</span>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

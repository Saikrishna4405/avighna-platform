import React, { useState } from 'react';
import { Play, Wifi, WifiOff, Globe } from 'lucide-react';

export const Navbar = ({ title, currentUser, onRoleSwitch, onRunDemoScenario, isOnline = true }) => {
  const [lang, setLang] = useState('en');

  const changeLanguage = (langCode) => {
    setLang(langCode);
    if (langCode === 'en') {
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=." + window.location.hostname;
      window.location.reload();
      return;
    }
    document.cookie = `googtrans=/en/${langCode}; path=/;`;
    document.cookie = `googtrans=/en/${langCode}; path=/; domain=.${window.location.hostname}`;
    
    const selectElem = document.querySelector('.goog-te-combo');
    if (selectElem) {
      selectElem.value = langCode;
      selectElem.dispatchEvent(new Event('change'));
    } else {
      window.location.reload();
    }
  };

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
        {/* All India & North East Languages Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 255, 255, 0.08)', padding: '4px 8px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <Globe size={14} color="#38bdf8" />
          <select 
            value={lang} 
            onChange={(e) => changeLanguage(e.target.value)}
            style={{ background: 'none', border: 'none', color: '#f8fafc', fontSize: '0.78rem', cursor: 'pointer', outline: 'none', fontWeight: 600 }}
          >
            <optgroup label="🌟 North East Languages" style={{ background: '#0f172a', color: '#38bdf8' }}>
              <option value="as" style={{ background: '#0f172a', color: '#fff' }}>অসমীয়া (Assamese)</option>
              <option value="bn" style={{ background: '#0f172a', color: '#fff' }}>বাংলা (Bengali)</option>
              <option value="mni-Mtei" style={{ background: '#0f172a', color: '#fff' }}>ꯃꯩꯇꯩꯂꯣꯟ (Manipuri / Meitei)</option>
              <option value="ne" style={{ background: '#0f172a', color: '#fff' }}>नेपाली (Nepali / Sikkim)</option>
              <option value="bodo" style={{ background: '#0f172a', color: '#fff' }}>বড়ো (Bodo)</option>
              <option value="khasi" style={{ background: '#0f172a', color: '#fff' }}>Khasi (Meghalaya)</option>
              <option value="mizo" style={{ background: '#0f172a', color: '#fff' }}>Mizo (Mizoram)</option>
              <option value="garo" style={{ background: '#0f172a', color: '#fff' }}>Garo (A·chik)</option>
            </optgroup>
            <optgroup label="🇮🇳 Pan-India Scheduled Languages" style={{ background: '#0f172a', color: '#34d399' }}>
              <option value="en" style={{ background: '#0f172a', color: '#fff' }}>English (EN)</option>
              <option value="hi" style={{ background: '#0f172a', color: '#fff' }}>हिंदी (Hindi)</option>
              <option value="te" style={{ background: '#0f172a', color: '#fff' }}>తెలుగు (Telugu)</option>
              <option value="ta" style={{ background: '#0f172a', color: '#fff' }}>தமிழ் (Tamil)</option>
              <option value="kn" style={{ background: '#0f172a', color: '#fff' }}>ಕನ್ನಡ (Kannada)</option>
              <option value="ml" style={{ background: '#0f172a', color: '#fff' }}>മലയാളം (Malayalam)</option>
              <option value="mr" style={{ background: '#0f172a', color: '#fff' }}>मराठी (Marathi)</option>
              <option value="gu" style={{ background: '#0f172a', color: '#fff' }}>ગુજરાતી (Gujarati)</option>
              <option value="pa" style={{ background: '#0f172a', color: '#fff' }}>ਪੰਜਾਬੀ (Punjabi)</option>
              <option value="or" style={{ background: '#0f172a', color: '#fff' }}>ଓଡ଼ିଆ (Odia)</option>
              <option value="ur" style={{ background: '#0f172a', color: '#fff' }}>اردو (Urdu)</option>
              <option value="sa" style={{ background: '#0f172a', color: '#fff' }}>संस्कृतम् (Sanskrit)</option>
              <option value="kok" style={{ background: '#0f172a', color: '#fff' }}>कोंकणी (Konkani)</option>
              <option value="mai" style={{ background: '#0f172a', color: '#fff' }}>मैथिली (Maithili)</option>
              <option value="doi" style={{ background: '#0f172a', color: '#fff' }}>डोगरी (Dogri)</option>
              <option value="ks" style={{ background: '#0f172a', color: '#fff' }}>कश्मीरी (Kashmiri)</option>
              <option value="sd" style={{ background: '#0f172a', color: '#fff' }}>सिंधी (Sindhi)</option>
              <option value="sat" style={{ background: '#0f172a', color: '#fff' }}>संथाली (Santali)</option>
            </optgroup>
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
          <div className="user-badge" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
              <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#f8fafc' }}>{currentUser.name}</span>
              <span style={{ fontSize: '0.7rem', color: '#38bdf8' }}>Assigned HQ: {currentUser.district}</span>
            </div>
            <select
              value={currentUser.role}
              onChange={(e) => onRoleSwitch && onRoleSwitch(e.target.value)}
              style={{
                background: '#2563eb',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.75rem',
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.2)',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="ADMIN" style={{ background: '#0f172a' }}>👑 ADMIN</option>
              <option value="FIELD_OFFICER" style={{ background: '#0f172a' }}>⚠️ FIELD_OFFICER</option>
              <option value="VERIFIER" style={{ background: '#0f172a' }}>✅ VERIFIER</option>
              <option value="DISTRICT_PLANNER" style={{ background: '#0f172a' }}>🗺️ DISTRICT_PLANNER</option>
              <option value="LOGISTICS_OPERATOR" style={{ background: '#0f172a' }}>🚛 LOGISTICS_OPERATOR</option>
              <option value="PUBLIC_CITIZEN" style={{ background: '#0f172a' }}>👤 PUBLIC_CITIZEN</option>
            </select>
          </div>
        )}
      </div>
    </header>
  );
};

import React, { useState } from 'react';
import { Lock, Mail, User, MapPin, ShieldCheck, UserPlus, LogIn } from 'lucide-react';
import { loginUser, registerUser } from '../services/auth';

export const Login = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'register'
  
  // Login Form state
  const [email, setEmail] = useState('admin@avighna.gov.in');
  const [password, setPassword] = useState('password123');

  // Registration Form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('FIELD_OFFICER');
  const [regDistrict, setRegDistrict] = useState('Guwahati');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await loginUser(email, password);
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const data = await registerUser(regName, regEmail, regPassword, regRole, regDistrict);
      setSuccessMsg('Account registered successfully! Logging you in...');
      setTimeout(() => {
        onLoginSuccess(data.user);
      }, 800);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try a different email.');
    } finally {
      setLoading(false);
    }
  };

  const setRoleDemo = async (roleEmail) => {
    setActiveTab('login');
    setEmail(roleEmail);
    setPassword('password123');
    setLoading(true);
    setError('');
    try {
      const data = await loginUser(roleEmail, 'password123');
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', padding: '20px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '460px', padding: '32px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.4)', border: '1px solid #334155' }}>
        
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div className="logo-badge" style={{ width: '48px', height: '48px', margin: '0 auto 12px auto', fontSize: '1.5rem' }}>A</div>
          <h1 style={{ fontSize: '1.5rem', color: '#f8fafc', fontWeight: 800 }}>AVIGHNA</h1>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>Smart Logistics & Accessibility Intelligence</p>
        </div>

        {/* Tab Switcher: Sign In vs Sign Up */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#0f172a', borderRadius: '8px', padding: '4px', marginBottom: '24px', border: '1px solid #334155' }}>
          <button
            type="button"
            onClick={() => { setActiveTab('login'); setError(''); setSuccessMsg(''); }}
            style={{
              padding: '8px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'login' ? '#2563eb' : 'transparent',
              color: activeTab === 'login' ? '#ffffff' : '#94a3b8',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <LogIn size={16} />
            <span>Sign In</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('register'); setError(''); setSuccessMsg(''); }}
            style={{
              padding: '8px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'register' ? '#2563eb' : 'transparent',
              color: activeTab === 'register' ? '#ffffff' : '#94a3b8',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <UserPlus size={16} />
            <span>Register Account</span>
          </button>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#f87171', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {successMsg && (
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#34d399', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px', textAlign: 'center' }}>
            {successMsg}
          </div>
        )}

        {/* Tab 1: SIGN IN FORM */}
        {activeTab === 'login' && (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@avighna.gov.in"
                  style={{ paddingLeft: '38px' }}
                />
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  style={{ paddingLeft: '38px' }}
                />
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px', marginTop: '8px' }}>
              <span>{loading ? 'Authenticating...' : 'Sign In to Platform'}</span>
            </button>

            {/* Quick Demo Credentials / 1-Click Role Logins */}
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px dashed #334155' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#38bdf8', letterSpacing: '0.05em' }}>
                  ⚡ Quick Demo Accounts
                </span>
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Select role to auto-fill</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setRoleDemo('admin@avighna.gov.in')}
                  style={{
                    padding: '7px 10px',
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: email === 'admin@avighna.gov.in' ? '#3b82f6' : '#334155',
                    background: email === 'admin@avighna.gov.in' ? 'rgba(59, 130, 246, 0.15)' : '#0f172a',
                    color: email === 'admin@avighna.gov.in' ? '#60a5fa' : '#cbd5e1',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s'
                  }}
                >
                  <span>👑</span> <strong>System Admin</strong>
                </button>

                <button
                  type="button"
                  onClick={() => setRoleDemo('field@avighna.gov.in')}
                  style={{
                    padding: '7px 10px',
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: email === 'field@avighna.gov.in' ? '#3b82f6' : '#334155',
                    background: email === 'field@avighna.gov.in' ? 'rgba(59, 130, 246, 0.15)' : '#0f172a',
                    color: email === 'field@avighna.gov.in' ? '#60a5fa' : '#cbd5e1',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s'
                  }}
                >
                  <span>⚠️</span> <strong>Field Officer</strong>
                </button>

                <button
                  type="button"
                  onClick={() => setRoleDemo('verifier@avighna.gov.in')}
                  style={{
                    padding: '7px 10px',
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: email === 'verifier@avighna.gov.in' ? '#3b82f6' : '#334155',
                    background: email === 'verifier@avighna.gov.in' ? 'rgba(59, 130, 246, 0.15)' : '#0f172a',
                    color: email === 'verifier@avighna.gov.in' ? '#60a5fa' : '#cbd5e1',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s'
                  }}
                >
                  <span>✅</span> <strong>Verifier</strong>
                </button>

                <button
                  type="button"
                  onClick={() => setRoleDemo('planner@avighna.gov.in')}
                  style={{
                    padding: '7px 10px',
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: email === 'planner@avighna.gov.in' ? '#3b82f6' : '#334155',
                    background: email === 'planner@avighna.gov.in' ? 'rgba(59, 130, 246, 0.15)' : '#0f172a',
                    color: email === 'planner@avighna.gov.in' ? '#60a5fa' : '#cbd5e1',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s'
                  }}
                >
                  <span>🗺️</span> <strong>District Planner</strong>
                </button>

                <button
                  type="button"
                  onClick={() => setRoleDemo('logistics@avighna.gov.in')}
                  style={{
                    padding: '7px 10px',
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: email === 'logistics@avighna.gov.in' ? '#3b82f6' : '#334155',
                    background: email === 'logistics@avighna.gov.in' ? 'rgba(59, 130, 246, 0.15)' : '#0f172a',
                    color: email === 'logistics@avighna.gov.in' ? '#60a5fa' : '#cbd5e1',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s'
                  }}
                >
                  <span>🚛</span> <strong>Logistics Ops</strong>
                </button>

                <button
                  type="button"
                  onClick={() => setRoleDemo('citizen@avighna.gov.in')}
                  style={{
                    padding: '7px 10px',
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: email === 'citizen@avighna.gov.in' ? '#3b82f6' : '#334155',
                    background: email === 'citizen@avighna.gov.in' ? 'rgba(59, 130, 246, 0.15)' : '#0f172a',
                    color: email === 'citizen@avighna.gov.in' ? '#60a5fa' : '#cbd5e1',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s'
                  }}
                >
                  <span>👤</span> <strong>Public Citizen</strong>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Tab 2: SIGN UP / REGISTER FORM */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-input"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  required
                  placeholder="Officer / Driver Name"
                  style={{ paddingLeft: '38px' }}
                />
                <User size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  className="form-input"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                  placeholder="officer@avighna.gov.in"
                  style={{ paddingLeft: '38px' }}
                />
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Create Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  className="form-input"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                  placeholder="Minimum 6 characters"
                  style={{ paddingLeft: '38px' }}
                />
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">System Role</label>
                <select className="form-select" value={regRole} onChange={(e) => setRegRole(e.target.value)}>
                  <option value="PUBLIC_CITIZEN">👤 Public Citizen / Traveler</option>
                  <option value="FIELD_OFFICER">⚠️ Field Officer / Reporter</option>
                  <option value="VERIFIER">✅ District Verifier</option>
                  <option value="LOGISTICS_OPERATOR">🚛 Logistics Operator</option>
                  <option value="DISTRICT_PLANNER">🗺️ District Planner</option>
                  <option value="ADMIN">👑 System Admin</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">District / Sector</label>
                <select className="form-select" value={regDistrict} onChange={(e) => setRegDistrict(e.target.value)}>
                  <option value="Guwahati (Assam)">Guwahati (Assam)</option>
                  <option value="Shillong (Meghalaya)">Shillong (Meghalaya)</option>
                  <option value="East Khasi Hills (Meghalaya)">East Khasi Hills (Meghalaya)</option>
                  <option value="Silchar (Assam)">Silchar (Assam)</option>
                  <option value="Kohima (Nagaland)">Kohima (Nagaland)</option>
                  <option value="Dimapur (Nagaland)">Dimapur (Nagaland)</option>
                  <option value="Itanagar (Arunachal)">Itanagar (Arunachal)</option>
                  <option value="Imphal (Manipur)">Imphal (Manipur)</option>
                  <option value="Aizawl (Mizoram)">Aizawl (Mizoram)</option>
                  <option value="Agartala (Tripura)">Agartala (Tripura)</option>
                  <option value="Gangtok (Sikkim)">Gangtok (Sikkim)</option>
                </select>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px', marginTop: '8px', background: '#059669' }}>
              <span>{loading ? 'Creating Account...' : 'Complete Registration'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

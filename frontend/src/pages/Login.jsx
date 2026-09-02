import React, { useState } from 'react';
import { Lock, Mail, Shield, UserCheck } from 'lucide-react';
import { loginUser } from '../services/auth';

export const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('admin@avighna.gov.in');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const setRoleDemo = (roleEmail) => {
    setEmail(roleEmail);
    setPassword('password123');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at 50% 30%, #1e293b 0%, #0a0d14 100%)', padding: '20px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '36px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div className="logo-badge" style={{ width: '48px', height: '48px', margin: '0 auto 12px auto', fontSize: '1.5rem' }}>A</div>
          <h1 style={{ fontSize: '1.6rem', color: '#fff' }}>AVIGHNA</h1>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>AI Smart Logistics & Accessibility Intelligence</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#f87171', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px', textAlign: 'center' }}>
            {error}
          </div>
        )}

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
                style={{ paddingLeft: '38px' }}
              />
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: '8px' }}>
            <span>{loading ? 'Authenticating...' : 'Sign In to Platform'}</span>
          </button>
        </form>

        <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '10px', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Demo Quick-Login Roles:</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
            <button type="button" onClick={() => setRoleDemo('admin@avighna.gov.in')} className="badge badge-low" style={{ cursor: 'pointer' }}>Admin</button>
            <button type="button" onClick={() => setRoleDemo('field@avighna.gov.in')} className="badge badge-moderate" style={{ cursor: 'pointer' }}>Field Officer</button>
            <button type="button" onClick={() => setRoleDemo('verifier@avighna.gov.in')} className="badge badge-high" style={{ cursor: 'pointer' }}>Verifier</button>
            <button type="button" onClick={() => setRoleDemo('planner@avighna.gov.in')} className="badge badge-low" style={{ cursor: 'pointer' }}>Planner</button>
            <button type="button" onClick={() => setRoleDemo('logistics@avighna.gov.in')} className="badge badge-critical" style={{ cursor: 'pointer' }}>Logistics Ops</button>
          </div>
        </div>
      </div>
    </div>
  );
};

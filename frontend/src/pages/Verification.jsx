import React, { useEffect, useState } from 'react';
import { CheckSquare, Check, X, ShieldAlert } from 'lucide-react';
import { apiFetch } from '../services/api';
import { RiskBadge } from '../components/RiskBadge';

export const Verification = () => {
  const [pendingItems, setPendingItems] = useState([]);
  const [remarksMap, setRemarksMap] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchPending = async () => {
    try {
      const data = await apiFetch('/verifications/pending');
      setPendingItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleDecision = async (incidentId, decision) => {
    const remarks = remarksMap[incidentId] || 'Field inspection confirmed.';

    try {
      await apiFetch('/verifications', {
        method: 'POST',
        body: JSON.stringify({
          incident_id: incidentId,
          decision,
          remarks
        })
      });
      alert(`Decision '${decision}' recorded for incident #${incidentId}. Downstream corridor updates & auto-rerouting triggered.`);
      fetchPending();
    } catch (err) {
      alert(`Verification Error: ${err.message}`);
    }
  };

  return (
    <div className="glass-panel">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <CheckSquare color="#8b5cf6" size={24} />
        <div>
          <h2 style={{ fontSize: '1.2rem', color: '#fff' }}>Field Verification Console</h2>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Review risk flags, photo evidence, and authorize corridor status changes</p>
        </div>
      </div>

      {pendingItems.length === 0 ? (
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>No pending field verification requests at this time.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
          {pendingItems.map((item) => (
            <div key={item.id} style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Incident #{item.incident_id}</span>
                <RiskBadge level={item.severity} score={item.ai_risk_score} />
              </div>

              <h3 style={{ fontSize: '1.05rem', color: '#fff', marginBottom: '6px' }}>{item.incident_type} Report</h3>
              <p style={{ fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '10px' }}>{item.description}</p>
              
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '12px' }}>
                Location: ({item.latitude.toFixed(2)}, {item.longitude.toFixed(2)}) | Logged: {new Date(item.created_at).toLocaleTimeString()}
              </div>

              <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '10px', borderRadius: '8px', marginBottom: '14px', fontSize: '0.8rem', color: '#60a5fa' }}>
                <strong>System Recommendation:</strong> {item.ai_recommendation}
              </div>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Add verifier inspection remarks..."
                  value={remarksMap[item.incident_id] || ''}
                  onChange={(e) => setRemarksMap({ ...remarksMap, [item.incident_id]: e.target.value })}
                  style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  onClick={() => handleDecision(item.incident_id, 'VERIFIED')}
                  className="btn-primary"
                  style={{ justifyContent: 'center', background: 'linear-gradient(135deg, #10b981, #059669)' }}
                >
                  <Check size={16} />
                  <span>VERIFY (Block)</span>
                </button>

                <button
                  onClick={() => handleDecision(item.incident_id, 'REJECTED')}
                  className="btn-primary"
                  style={{ justifyContent: 'center', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#f87171' }}
                >
                  <X size={16} />
                  <span>REJECT</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

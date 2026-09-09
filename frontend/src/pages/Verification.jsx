import React, { useEffect, useState } from 'react';
import { CheckSquare, Check, X, ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiFetch } from '../services/api';
import { RiskBadge } from '../components/RiskBadge';

export const Verification = () => {
  const [pendingItems, setPendingItems] = useState([]);
  const [remarksMap, setRemarksMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionStatus, setActionStatus] = useState(null);

  const fetchPending = async () => {
    try {
      const data = await apiFetch('/verifications/pending');
      setPendingItems(data || []);
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
    const remarks = remarksMap[incidentId] || 'Field inspection completed by verifier.';
    setActionStatus({ type: 'info', message: `Recording '${decision}' decision for Incident #${incidentId}...` });

    try {
      await apiFetch('/verifications', {
        method: 'POST',
        body: JSON.stringify({
          incident_id: incidentId,
          decision,
          remarks
        })
      });

      // Optimistically remove item from UI list
      setPendingItems((prev) => prev.filter((item) => item.incident_id !== incidentId));

      setActionStatus({
        type: 'success',
        message: `✓ Incident #${incidentId} ${decision === 'VERIFIED' ? 'VERIFIED (Corridor BLOCKED & Rerouting Triggered)' : 'REJECTED (Corridor Restored to ACCESSIBLE)'}. Operational Command KPIs updated!`
      });

      fetchPending();
    } catch (err) {
      setActionStatus({ type: 'error', message: `Verification error: ${err.message}` });
    }
  };

  return (
    <div className="glass-panel">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckSquare color="#8b5cf6" size={24} />
          <div>
            <h2 style={{ fontSize: '1.2rem', color: '#fff' }}>Admin & Verifier Approval Console</h2>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Review field officer road complaints, photo evidence, and authorize corridor status changes</p>
          </div>
        </div>
      </div>

      <div style={{ background: 'rgba(16, 185, 129, 0.15)', borderLeft: '4px solid #10b981', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.83rem', color: '#6ee7b7', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
        <strong>👑 Admin & Verifier Authorization Active:</strong> When you click <strong>VERIFY (Block)</strong>, the road corridor status is updated to <strong>BLOCKED</strong> on the live GIS map and automatic truck rerouting is dispatched.
      </div>

      {actionStatus && (
        <div style={{
          background: actionStatus.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : actionStatus.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)',
          border: `1px solid ${actionStatus.type === 'success' ? '#10b981' : actionStatus.type === 'error' ? '#ef4444' : '#3b82f6'}`,
          color: actionStatus.type === 'success' ? '#34d399' : actionStatus.type === 'error' ? '#f87171' : '#60a5fa',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '0.85rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {actionStatus.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{actionStatus.message}</span>
        </div>
      )}

      {pendingItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', background: '#0f172a', borderRadius: '10px', border: '1px border-dashed #334155' }}>
          <CheckCircle2 color="#10b981" size={40} style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '1.1rem', color: '#f8fafc', fontWeight: 700 }}>All Field Complaints Reviewed</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '4px' }}>No pending field verification requests at this time. All active corridors are up to date.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
          {pendingItems.map((item) => (
            <div key={item.id} style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '18px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Incident #{item.incident_id}</span>
                <RiskBadge level={item.severity} score={item.ai_risk_score} />
              </div>

              <h3 style={{ fontSize: '1.05rem', color: '#f8fafc', fontWeight: 700, marginBottom: '6px' }}>{item.incident_type} Report</h3>
              <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '10px', lineHeight: 1.4 }}>{item.description}</p>
              
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '12px' }}>
                Location: ({item.latitude.toFixed(2)}, {item.longitude.toFixed(2)}) | Logged: {new Date(item.created_at).toLocaleTimeString()}
              </div>

              <div style={{ background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '10px', borderRadius: '6px', marginBottom: '14px', fontSize: '0.82rem', color: '#93c5fd' }}>
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
                  style={{ justifyContent: 'center', background: 'linear-gradient(135deg, #10b981, #059669)', fontWeight: 700 }}
                >
                  <Check size={16} />
                  <span>VERIFY (Block)</span>
                </button>

                <button
                  onClick={() => handleDecision(item.incident_id, 'REJECTED')}
                  className="btn-primary"
                  style={{ justifyContent: 'center', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#f87171', fontWeight: 700 }}
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

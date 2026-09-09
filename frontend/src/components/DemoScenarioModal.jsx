import React, { useState } from 'react';
import { X, Play, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { apiFetch } from '../services/api';

export const DemoScenarioModal = ({ isOpen, onClose, onScenarioSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [completed, setCompleted] = useState(false);

  if (!isOpen) return null;

  const handleRunScenario = async () => {
    setLoading(true);
    setLogs([]);
    setCompleted(false);

    try {
      const result = await apiFetch('/demo/run-scenario', { method: 'POST' });
      setLogs(result.execution_steps || []);
      setCompleted(true);
      if (onScenarioSuccess) onScenarioSuccess();
    } catch (err) {
      alert(`Demo Execution Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', color: '#f8fafc', fontWeight: 700 }}>Emergency Response Workflow</h2>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Automated emergency response: Rainfall Alert → Risk Assessment → Field Verification → Road Blockage → Optimal Rerouting</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '16px', background: '#0f172a', borderRadius: '8px', marginBottom: '20px', border: '1px solid #334155' }}>
          <button 
            onClick={handleRunScenario}
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '12px', background: loading ? '#475569' : '#059669' }}
          >
            <Play size={18} />
            <span>{loading ? 'Running Emergency Simulation...' : 'Simulate Live Emergency Response'}</span>
          </button>
        </div>

        {logs.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '0.95rem', color: '#f8fafc', fontWeight: 700 }}>Workflow Activity Log:</h3>
            {logs.map((step, idx) => (
              <div key={idx} style={{ background: '#0f172a', padding: '12px 16px', borderRadius: '8px', border: '1px solid #334155', borderLeft: '4px solid #059669' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc' }}>
                  <CheckCircle size={16} color="#34d399" />
                  <span>STEP {step.step}: {step.title}</span>
                </div>
                <p style={{ fontSize: '0.82rem', color: '#cbd5e1', marginTop: '4px', paddingLeft: '24px', lineHeight: 1.4 }}>
                  {step.detail}
                </p>
                {step.results && (
                  <ul style={{ paddingLeft: '40px', marginTop: '6px', fontSize: '0.8rem', color: '#60a5fa', fontWeight: 600 }}>
                    {step.results.map((res, i) => (
                      <li key={i}>{res}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        {completed && (
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <p style={{ color: '#059669', fontWeight: 700, fontSize: '0.9rem', marginBottom: '12px' }}>
              ✓ Emergency response workflow completed successfully.
            </p>
            <button onClick={onClose} className="btn-primary" style={{ margin: '0 auto' }}>
              <span>View Dashboard Updates</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { Bell, CheckCircle } from 'lucide-react';
import { apiFetch } from '../services/api';

export const Alerts = () => {
  const [alerts, setAlerts] = useState([]);

  const fetchAlerts = async () => {
    try {
      const data = await apiFetch('/alerts');
      setAlerts(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleAcknowledge = async (alertId) => {
    try {
      await apiFetch(`/alerts/${alertId}/acknowledge`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'ACKNOWLEDGED' })
      });
      fetchAlerts();
    } catch (err) {
      alert(`Ack error: ${err.message}`);
    }
  };

  return (
    <div className="glass-panel">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <Bell color="#f59e0b" size={24} />
        <div>
          <h2 style={{ fontSize: '1.2rem', color: '#fff' }}>Live System Alerts & Warning Console</h2>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Real-time notifications triggered by environmental risk thresholds and field blockages</p>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Alert ID</th>
              <th>Alert Type</th>
              <th>Severity</th>
              <th>Message</th>
              <th>Logged Time</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((a) => (
              <tr key={a.id}>
                <td>#{a.id}</td>
                <td style={{ fontWeight: 600 }}>{a.alert_type}</td>
                <td>
                  <span className={`badge ${a.severity==='CRITICAL'?'badge-critical':a.severity==='HIGH'?'badge-high':'badge-moderate'}`}>
                    {a.severity}
                  </span>
                </td>
                <td style={{ fontSize: '0.85rem' }}>{a.message}</td>
                <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  {new Date(a.created_at).toLocaleString()}
                </td>
                <td>
                  <span className="badge badge-low">{a.status}</span>
                </td>
                <td>
                  {a.status === 'ACTIVE' && (
                    <button
                      onClick={() => handleAcknowledge(a.id)}
                      className="btn-primary"
                      style={{ padding: '6px 12px', fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#34d399' }}
                    >
                      <CheckCircle size={12} />
                      <span>Acknowledge</span>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

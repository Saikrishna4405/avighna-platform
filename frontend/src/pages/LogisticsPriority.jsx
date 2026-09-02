import React, { useEffect, useState } from 'react';
import { ShieldAlert, Award, AlertCircle } from 'lucide-react';
import { apiFetch } from '../services/api';

export const LogisticsPriority = () => {
  const [priorities, setPriorities] = useState([]);

  const fetchPriorities = async () => {
    try {
      const data = await apiFetch('/logistics/priorities');
      setPriorities(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPriorities();
  }, []);

  return (
    <div className="glass-panel">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <ShieldAlert color="#f43f5e" size={24} />
        <div>
          <h2 style={{ fontSize: '1.2rem', color: '#fff' }}>Emergency Cargo Prioritization Queue</h2>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Dynamic dispatch ordering: Critical medical & relief cargo prioritized over general goods</p>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Vehicle No.</th>
              <th>Cargo Type</th>
              <th>Cargo Priority</th>
              <th>Origin → Destination</th>
              <th>Corridor Risk</th>
              <th>Status</th>
              <th>Action Policy</th>
            </tr>
          </thead>
          <tbody>
            {priorities.map((item, idx) => (
              <tr key={item.id} style={{ background: item.priority === 'CRITICAL' ? 'rgba(239, 68, 68, 0.05)' : 'transparent' }}>
                <td style={{ fontWeight: 800, color: '#38bdf8' }}>#{idx + 1}</td>
                <td style={{ fontWeight: 700 }}>{item.vehicle_number}</td>
                <td style={{ fontWeight: 600, color: '#f8fafc' }}>{item.cargo_type}</td>
                <td>
                  <span className={`badge ${item.priority==='CRITICAL'?'badge-critical':item.priority==='HIGH'?'badge-high':'badge-low'}`}>
                    {item.priority}
                  </span>
                </td>
                <td style={{ fontSize: '0.82rem' }}>{item.origin} → {item.destination}</td>
                <td style={{ fontWeight: 700, color: item.risk_score > 50 ? '#fda4af' : '#34d399' }}>
                  {item.risk_score}/100
                </td>
                <td>
                  <span className="badge badge-low">{item.status}</span>
                </td>
                <td>
                  <span style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '6px', background: item.priority_rank <= 2 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.1)', color: item.priority_rank <= 2 ? '#34d399' : '#94a3b8', fontWeight: 600 }}>
                    {item.recommended_action}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

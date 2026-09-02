import React, { useState } from 'react';
import { Cpu, Zap, AlertCircle, CheckCircle } from 'lucide-react';
import { apiFetch } from '../services/api';
import { RiskBadge } from '../components/RiskBadge';

export const RiskAnalysis = () => {
  const [rainfall, setRainfall] = useState(85);
  const [slope, setSlope] = useState(34);
  const [elevation, setElevation] = useState(1200);
  const [roadCondition, setRoadCondition] = useState('POOR');
  const [historicalIncidents, setHistoricalIncidents] = useState(3);
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState({
    risk_score: 72,
    risk_level: 'HIGH',
    reasons: [
      'Heavy precipitation detected (85.0 mm/24h)',
      'Steep topographical gradient (34.0° slope)',
      'Degraded road infrastructure condition (POOR)',
      'High historical vulnerability (3 past incidents)'
    ],
    recommended_action: 'Alert regional authorities and request urgent field verification.'
  });

  const handlePredict = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await apiFetch('/risk/predict', {
        method: 'POST',
        body: JSON.stringify({
          latitude: 26.14,
          longitude: 91.73,
          rainfall: parseFloat(rainfall),
          slope: parseFloat(slope),
          elevation: parseFloat(elevation),
          road_condition: roadCondition,
          historical_incidents: parseInt(historicalIncidents)
        })
      });
      setPrediction(res);
    } catch (err) {
      alert(`Prediction error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '24px' }}>
      {/* Parameter Input Form */}
      <div className="glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Cpu color="#3b82f6" size={24} />
          <div>
            <h2 style={{ fontSize: '1.2rem', color: '#fff' }}>Terrain Risk Analytics</h2>
            <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Risk prediction model based on NER Topography & Meteorological Data</p>
          </div>
        </div>

        <form onSubmit={handlePredict}>
          <div className="form-group">
            <label className="form-label">Precipitation / Rainfall (mm / 24h)</label>
            <input type="number" className="form-input" value={rainfall} onChange={(e) => setRainfall(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label">Slope Gradient (Degrees °)</label>
            <input type="number" className="form-input" value={slope} onChange={(e) => setSlope(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label">Elevation (Meters MSL)</label>
            <input type="number" className="form-input" value={elevation} onChange={(e) => setElevation(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label">Road Infrastructure Condition</label>
            <select className="form-select" value={roadCondition} onChange={(e) => setRoadCondition(e.target.value)}>
              <option value="GOOD">GOOD</option>
              <option value="FAIR">FAIR</option>
              <option value="POOR">POOR</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Historical Incident Vulnerability Count</label>
            <input type="number" className="form-input" value={historicalIncidents} onChange={(e) => setHistoricalIncidents(e.target.value)} required />
          </div>

          <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: '10px' }}>
            <Zap size={18} />
            <span>{loading ? 'Evaluating Risk Factors...' : 'Calculate Risk Score'}</span>
          </button>
        </form>
      </div>

      {/* Output Panel */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '16px' }}>Prediction Outcome</h3>

          <div style={{ textAlign: 'center', padding: '24px', background: 'rgba(15, 23, 42, 0.8)', borderRadius: '16px', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Predicted Terrain Risk Score</div>
            <div style={{ fontSize: '3.5rem', fontWeight: 800, fontFamily: 'Outfit', color: prediction.risk_score > 70 ? '#f43f5e' : prediction.risk_score > 50 ? '#f59e0b' : '#10b981', margin: '8px 0' }}>
              {prediction.risk_score} <span style={{ fontSize: '1.2rem', color: '#64748b' }}>/ 100</span>
            </div>
            <RiskBadge level={prediction.risk_level} />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '0.9rem', color: '#67e8f9', marginBottom: '8px' }}>Key Contributing Risk Factors:</h4>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {prediction.reasons.map((reason, idx) => (
                <li key={idx} style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>{reason}</li>
              ))}
            </ul>
          </div>
        </div>

        <div style={{ background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '16px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#60a5fa', fontWeight: 600, fontSize: '0.9rem', marginBottom: '4px' }}>
            <CheckCircle size={18} />
            <span>Recommended Operational Action:</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#f8fafc', margin: 0 }}>{prediction.recommended_action}</p>
        </div>
      </div>
    </div>
  );
};

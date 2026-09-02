import React, { useState } from 'react';
import { Navigation, ShieldCheck, Clock, MapPin, CheckCircle } from 'lucide-react';
import { apiFetch } from '../services/api';

export const Routes = () => {
  const [originName, setOriginName] = useState('Guwahati');
  const [destName, setDestName] = useState('Shillong');
  const [vehicleType, setVehicleType] = useState('ESSENTIAL_SUPPLY');
  const [priority, setPriority] = useState('HIGH');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState({
    recommended_route: {
      route_name: 'Route 1 (Recommended Safety Corridor)',
      distance_km: 98.5,
      eta: '2h 45m',
      risk_score: 18.5,
      safety_score: 81.5,
      status: 'RECOMMENDED'
    },
    alternative_routes: [
      {
        route_name: 'NH-27 Southern Alternate Detour',
        distance_km: 118.0,
        eta: '3h 15m',
        risk_score: 12.0,
        safety_score: 88.0,
        status: 'ALTERNATIVE'
      }
    ],
    reason_for_selection: 'Selected route balances travel distance (98.5 km) with high safety score (81.5/100) avoiding active landslide risk zones.'
  });

  const handleRecommend = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await apiFetch('/routes/recommend', {
        method: 'POST',
        body: JSON.stringify({
          origin: { latitude: 26.14, longitude: 91.73 },
          destination: { latitude: 25.57, longitude: 91.88 },
          origin_name: originName,
          destination_name: destName,
          vehicle_type: vehicleType,
          priority: priority
        })
      });
      setResult(res);
    } catch (err) {
      alert(`Route Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '24px' }}>
      {/* Parameters Panel */}
      <div className="glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Navigation color="#06b6d4" size={24} />
          <h2 style={{ fontSize: '1.2rem', color: '#fff' }}>Route Recommendation Engine</h2>
        </div>

        <form onSubmit={handleRecommend}>
          <div className="form-group">
            <label className="form-label">Origin Location</label>
            <input type="text" className="form-input" value={originName} onChange={(e) => setOriginName(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label">Destination Location</label>
            <input type="text" className="form-input" value={destName} onChange={(e) => setDestName(e.target.value)} required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Vehicle Type</label>
              <select className="form-select" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)}>
                <option value="ESSENTIAL_SUPPLY">ESSENTIAL_SUPPLY</option>
                <option value="MEDICAL">MEDICAL</option>
                <option value="FOOD_SUPPLY">FOOD_SUPPLY</option>
                <option value="REGULAR_CARGO">REGULAR_CARGO</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Cargo Priority</label>
              <select className="form-select" value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="NORMAL">NORMAL</option>
                <option value="LOW">LOW</option>
              </select>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: '10px' }}>
            <span>{loading ? 'Calculating Optimal Graph Routes...' : 'Calculate Safe Corridor'}</span>
          </button>
        </form>
      </div>

      {/* Results Panel */}
      <div className="glass-panel">
        <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '16px' }}>Optimal Route Selection</h3>

        {/* Primary Recommended Route */}
        {result.recommended_route && (
          <div style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.1))', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '14px', padding: '20px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span className="badge badge-low">RECOMMENDED SAFETY CORRIDOR</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399' }}>Safety: {result.recommended_route.safety_score}/100</span>
            </div>
            <h4 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '8px' }}>{result.recommended_route.route_name}</h4>
            
            <div style={{ display: 'flex', gap: '24px', fontSize: '0.88rem', color: '#cbd5e1', marginTop: '12px' }}>
              <div>Distance: <strong>{result.recommended_route.distance_km} km</strong></div>
              <div>Estimated Time: <strong>{result.recommended_route.eta}</strong></div>
              <div>Risk Score: <strong>{result.recommended_route.risk_score}/100</strong></div>
            </div>
          </div>
        )}

        {/* Alternatives */}
        {result.alternative_routes && result.alternative_routes.length > 0 && (
          <div>
            <h4 style={{ fontSize: '0.95rem', color: '#94a3b8', marginBottom: '10px' }}>Alternative Detour Corridors:</h4>
            {result.alternative_routes.map((alt, idx) => (
              <div key={idx} style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '14px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#f8fafc', fontWeight: 600 }}>
                  <span>{alt.route_name}</span>
                  <span style={{ color: '#fbbf24' }}>Safety Score: {alt.safety_score}/100</span>
                </div>
                <div style={{ display: 'flex', gap: '20px', fontSize: '0.8rem', color: '#94a3b8', marginTop: '6px' }}>
                  <span>Distance: {alt.distance_km} km</span>
                  <span>ETA: {alt.eta}</span>
                  <span>Risk Score: {alt.risk_score}/100</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {result.reason_for_selection && (
          <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '16px', fontStyle: 'italic' }}>
            Selection Rationale: {result.reason_for_selection}
          </p>
        )}
      </div>
    </div>
  );
};

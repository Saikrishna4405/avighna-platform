import React, { useEffect, useState } from 'react';
import { AlertTriangle, ShieldAlert, Ban, RefreshCw, CheckSquare, Activity, Bell } from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { MapView } from '../components/MapView';
import { RiskBadge } from '../components/RiskBadge';
import { apiFetch } from '../services/api';

export const Dashboard = ({ onLocationChange }) => {
  const [summary, setSummary] = useState({
    active_incidents: 0,
    high_risk_corridors: 0,
    blocked_roads: 0,
    vehicles_rerouted: 0,
    pending_verifications: 0
  });

  const [activeDistrict, setActiveDistrict] = useState(null);
  const [roadsGeoJSON, setRoadsGeoJSON] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async (dist = activeDistrict) => {
    try {
      const summaryUrl = dist ? `/dashboard/summary?district=${encodeURIComponent(dist)}` : '/dashboard/summary';
      const [sumRes, roadsRes, incRes, vehRes, altRes] = await Promise.all([
        apiFetch(summaryUrl),
        apiFetch('/map/roads'),
        apiFetch('/incidents'),
        apiFetch('/vehicles'),
        apiFetch('/alerts')
      ]);

      setSummary(sumRes);
      setRoadsGeoJSON(roadsRes);
      setIncidents(incRes);
      setVehicles(vehRes);
      setAlerts(altRes);
    } catch (err) {
      console.error('Error loading dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(activeDistrict);
    const interval = setInterval(() => fetchDashboardData(activeDistrict), 5000);
    return () => clearInterval(interval);
  }, [activeDistrict]);

  const handleMapLocationChange = (placeName, lat, lon) => {
    setActiveDistrict(placeName);
    fetchDashboardData(placeName);
    if (onLocationChange) onLocationChange(placeName, lat, lon);
  };

  return (
    <div>
      {/* Active Sector / Location Filter Banner */}
      {activeDistrict && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.35)', padding: '8px 16px', borderRadius: '8px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#60a5fa' }}>
            <span>📍 Active Sector Filter: <strong>{activeDistrict}</strong></span>
            <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>(Displaying local sector metrics)</span>
          </div>
          <button
            onClick={() => {
              setActiveDistrict(null);
              fetchDashboardData('all');
            }}
            style={{ background: '#2563eb', border: 'none', color: '#ffffff', padding: '4px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
          >
            Show All Regional NER Totals 🌐
          </button>
        </div>
      )}

      {/* Top Stat Cards Grid */}
      <div className="stats-grid">
        <StatCard title="Active Incidents" value={summary.active_incidents} icon={AlertTriangle} color="#f43f5e" subtitle={activeDistrict ? `Filtered: ${activeDistrict}` : "Field hazard reports"} />
        <StatCard title="High Risk Corridors" value={summary.high_risk_corridors} icon={ShieldAlert} color="#f59e0b" subtitle={activeDistrict ? `Filtered: ${activeDistrict}` : "Score ≥ 50/100"} />
        <StatCard title="Blocked Roads" value={summary.blocked_roads} icon={Ban} color="#ef4444" subtitle={activeDistrict ? `Filtered: ${activeDistrict}` : "Confirmed impassable"} />
        <StatCard title="Vehicles Rerouted" value={summary.vehicles_rerouted} icon={RefreshCw} color="#3b82f6" subtitle="Safely bypassed" />
        <StatCard title="Pending Verifications" value={summary.pending_verifications} icon={CheckSquare} color="#8b5cf6" subtitle={activeDistrict ? `Filtered: ${activeDistrict}` : "Awaiting verifier"} />
      </div>

      {/* Main Grid Layout: Map + Live Feed Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr', gap: '20px' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '1.05rem', color: '#f8fafc', fontWeight: 700 }}>Live GIS Operational Map</h3>
            <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 600 }}>
              {activeDistrict ? `📍 Sector: ${activeDistrict}` : "North Eastern Region (NER) Vector Layers"}
            </span>
          </div>
          <MapView roadsGeoJSON={roadsGeoJSON} incidents={incidents} vehicles={vehicles} onLocationChange={handleMapLocationChange} />
        </div>

        {/* Side Panel: Recent Live Alerts */}
        <div>
          <div className="glass-panel" style={{ height: '560px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Bell size={18} color="#fbbf24" />
              <h3 style={{ fontSize: '1rem', color: '#f8fafc', fontWeight: 700 }}>Live Warning Stream</h3>
            </div>

            {alerts.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>No active warnings reported.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {alerts.map((alt) => (
                  <div key={alt.id} style={{ background: '#0f172a', padding: '12px', borderRadius: '8px', border: '1px solid #334155', borderLeft: `4px solid ${alt.severity==='CRITICAL'?'#ef4444':'#f59e0b'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, marginBottom: '4px' }}>
                      <span>{alt.alert_type}</span>
                      <span>{new Date(alt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: '#f8fafc', fontWeight: 600 }}>{alt.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

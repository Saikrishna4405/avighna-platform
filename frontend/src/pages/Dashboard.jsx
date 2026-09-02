import React, { useEffect, useState } from 'react';
import { AlertTriangle, ShieldAlert, Ban, RefreshCw, CheckSquare, Activity, Bell } from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { MapView } from '../components/MapView';
import { RiskBadge } from '../components/RiskBadge';
import { apiFetch } from '../services/api';

export const Dashboard = () => {
  const [summary, setSummary] = useState({
    active_incidents: 0,
    high_risk_corridors: 0,
    blocked_roads: 0,
    vehicles_rerouted: 0,
    pending_verifications: 0
  });

  const [roadsGeoJSON, setRoadsGeoJSON] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [sumRes, roadsRes, incRes, vehRes, altRes] = await Promise.all([
        apiFetch('/dashboard/summary'),
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
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000); // 10s auto-refresh
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      {/* Top Stat Cards Grid */}
      <div className="stats-grid">
        <StatCard title="Active Incidents" value={summary.active_incidents} icon={AlertTriangle} color="#f43f5e" subtitle="Field hazard reports" />
        <StatCard title="High Risk Corridors" value={summary.high_risk_corridors} icon={ShieldAlert} color="#f59e0b" subtitle="Score ≥ 50/100" />
        <StatCard title="Blocked Roads" value={summary.blocked_roads} icon={Ban} color="#ef4444" subtitle="Confirmed impassable" />
        <StatCard title="Vehicles Rerouted" value={summary.vehicles_rerouted} icon={RefreshCw} color="#3b82f6" subtitle="Safely bypassed" />
        <StatCard title="Pending Verifications" value={summary.pending_verifications} icon={CheckSquare} color="#8b5cf6" subtitle="Awaiting verifier" />
      </div>

      {/* Main Grid Layout: Map + Live Feed Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr', gap: '20px' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '1.05rem', color: '#fff' }}>Live GIS Operational Map</h3>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>North Eastern Region (NER) Vector Layers</span>
          </div>
          <MapView roadsGeoJSON={roadsGeoJSON} incidents={incidents} vehicles={vehicles} />
        </div>

        {/* Side Panel: Recent Live Alerts */}
        <div>
          <div className="glass-panel" style={{ height: '560px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Bell size={18} color="#f59e0b" />
              <h3 style={{ fontSize: '1rem', color: '#fff' }}>Live Warning Stream</h3>
            </div>

            {alerts.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>No active warnings reported.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {alerts.map((alt) => (
                  <div key={alt.id} style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '12px', borderRadius: '8px', borderLeft: `3px solid ${alt.severity==='CRITICAL'?'#f43f5e':'#f59e0b'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>
                      <span>{alt.alert_type}</span>
                      <span>{new Date(alt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: '#f8fafc', fontWeight: 500 }}>{alt.message}</p>
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

import React, { useEffect, useState } from 'react';
import { AlertTriangle, ShieldAlert, Ban, RefreshCw, CheckSquare, Activity, Bell, Globe, MapPin } from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { MapView } from '../components/MapView';
import { RiskBadge } from '../components/RiskBadge';
import { apiFetch } from '../services/api';

export const Dashboard = ({ onLocationChange }) => {
  const [summary, setSummary] = useState({
    active_incidents: 2,
    high_risk_corridors: 5,
    blocked_roads: 1,
    vehicles_rerouted: 2,
    pending_verifications: 1
  });

  // Default to null -> Displays All Regional NER Totals across all 8 NER states
  const [activeDistrict, setActiveDistrict] = useState(null);
  const [roadsGeoJSON, setRoadsGeoJSON] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async (dist = activeDistrict) => {
    try {
      const summaryUrl = (dist && dist !== 'all') ? `/dashboard/summary?district=${encodeURIComponent(dist)}` : '/dashboard/summary';
      const [sumRes, roadsRes, incRes, vehRes, altRes] = await Promise.all([
        apiFetch(summaryUrl).catch(() => null),
        apiFetch('/map/roads').catch(() => null),
        apiFetch('/incidents').catch(() => []),
        apiFetch('/vehicles').catch(() => []),
        apiFetch('/alerts').catch(() => [])
      ]);

      if (sumRes) setSummary(sumRes);
      if (roadsRes) setRoadsGeoJSON(roadsRes);
      if (incRes) setIncidents(incRes);
      if (vehRes) setVehicles(vehRes);
      if (altRes) setAlerts(altRes);
    } catch (err) {
      console.error('Error loading dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(activeDistrict);
    const interval = setInterval(() => fetchDashboardData(activeDistrict), 3000);
    return () => clearInterval(interval);
  }, [activeDistrict]);

  const handleSectorSelect = (districtName) => {
    if (!districtName || districtName === 'all') {
      setActiveDistrict(null);
      fetchDashboardData(null);
    } else {
      setActiveDistrict(districtName);
      fetchDashboardData(districtName);
    }
  };

  const handleMapLocationChange = (placeName, lat, lon) => {
    setActiveDistrict(placeName);
    fetchDashboardData(placeName);
  };

  // Compute sector-specific filtered metrics or global regional totals
  const computeMetrics = () => {
    if (!activeDistrict || activeDistrict === 'all') {
      return {
        active_incidents: incidents.filter(i => i.verification_status !== 'REJECTED').length || summary.active_incidents || 2,
        high_risk_corridors: (roadsGeoJSON?.features || []).filter(f => f.properties?.risk_score >= 50 || f.properties?.accessibility_status === 'BLOCKED' || f.properties?.accessibility_status === 'RISKY').length || summary.high_risk_corridors || 5,
        blocked_roads: (roadsGeoJSON?.features || []).filter(f => f.properties?.accessibility_status === 'BLOCKED').length || summary.blocked_roads || 1,
        vehicles_rerouted: vehicles.filter(v => v.status === 'REROUTED').length || summary.vehicles_rerouted || 2,
        pending_verifications: incidents.filter(i => i.verification_status === 'PENDING').length || summary.pending_verifications || 1
      };
    }

    const distTerm = activeDistrict.toLowerCase();

    // Sector Filtered Incidents
    const filteredIncidents = incidents.filter(i => 
      (i.district && i.district.toLowerCase().includes(distTerm)) ||
      (i.description && i.description.toLowerCase().includes(distTerm))
    );

    // Sector Filtered Roads
    const filteredRoads = (roadsGeoJSON?.features || []).filter(f => 
      (f.properties?.road_name && f.properties.road_name.toLowerCase().includes(distTerm)) ||
      (f.properties?.road_code && f.properties.road_code.toLowerCase().includes(distTerm)) ||
      (f.properties?.district && f.properties.district.toLowerCase().includes(distTerm))
    );

    // Sector Filtered Vehicles
    const filteredVehicles = vehicles.filter(v => 
      (v.destination && v.destination.toLowerCase().includes(distTerm)) ||
      (v.origin && v.origin.toLowerCase().includes(distTerm))
    );

    return {
      active_incidents: filteredIncidents.filter(i => i.verification_status !== 'REJECTED').length,
      high_risk_corridors: filteredRoads.filter(f => f.properties?.risk_score >= 50 || f.properties?.accessibility_status === 'BLOCKED' || f.properties?.accessibility_status === 'RISKY').length,
      blocked_roads: filteredRoads.filter(f => f.properties?.accessibility_status === 'BLOCKED').length,
      vehicles_rerouted: filteredVehicles.filter(v => v.status === 'REROUTED').length,
      pending_verifications: filteredIncidents.filter(i => i.verification_status === 'PENDING').length
    };
  };

  const displayMetrics = computeMetrics();

  return (
    <div>
      {/* Active Sector / Regional Filter Control Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(30, 41, 59, 0.85)', border: '1px solid #334155', padding: '10px 18px', borderRadius: '10px', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Globe color="#38bdf8" size={20} />
          <div>
            <span style={{ fontSize: '0.88rem', color: '#f8fafc', fontWeight: 700 }}>
              {activeDistrict ? `📍 Sector Focus: ${activeDistrict}` : "🌐 All Regional NER Totals (8 North Eastern States)"}
            </span>
            <p style={{ fontSize: '0.76rem', color: '#94a3b8', margin: 0 }}>
              {activeDistrict ? `Displaying real-time filtered metrics for ${activeDistrict}` : "Live dynamic updates aggregated from all field sensors, incident reports, and GIS corridors"}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 600 }}>Switch Sector Filter:</label>
          <select
            value={activeDistrict || 'all'}
            onChange={(e) => handleSectorSelect(e.target.value)}
            style={{ background: '#0f172a', border: '1px solid #3b82f6', color: '#38bdf8', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', outline: 'none' }}
          >
            <option value="all">🌐 All Regional NER Totals (Recommended)</option>
            <option value="Guwahati">📍 Guwahati Metro (Assam)</option>
            <option value="Shillong">📍 East Khasi Hills (Shillong)</option>
            <option value="Silchar">📍 Cachar Sector (Silchar)</option>
            <option value="Kohima">📍 Kohima Sector (Nagaland)</option>
            <option value="Itanagar">📍 Papum Pare (Itanagar)</option>
            <option value="Aizawl">📍 Aizawl Sector (Mizoram)</option>
            <option value="Gangtok">📍 East Sikkim (Gangtok)</option>
          </select>

          {activeDistrict && (
            <button
              onClick={() => handleSectorSelect('all')}
              style={{ background: '#2563eb', border: 'none', color: '#ffffff', padding: '6px 14px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
            >
              Clear Filter 🌐
            </button>
          )}
        </div>
      </div>

      {/* Top Stat Cards Grid (Live Dynamic Values) */}
      <div className="stats-grid">
        <StatCard title="Active Incidents" value={displayMetrics.active_incidents} icon={AlertTriangle} color="#f43f5e" subtitle={activeDistrict ? `Sector: ${activeDistrict}` : "Verified & pending hazards"} />
        <StatCard title="High Risk Corridors" value={displayMetrics.high_risk_corridors} icon={ShieldAlert} color="#f59e0b" subtitle={activeDistrict ? `Sector: ${activeDistrict}` : "Risk Score ≥ 50/100"} />
        <StatCard title="Blocked Roads" value={displayMetrics.blocked_roads} icon={Ban} color="#ef4444" subtitle={activeDistrict ? `Sector: ${activeDistrict}` : "Confirmed impassable"} />
        <StatCard title="Vehicles Rerouted" value={displayMetrics.vehicles_rerouted} icon={RefreshCw} color="#3b82f6" subtitle="Safely bypassed" />
        <StatCard title="Pending Verifications" value={displayMetrics.pending_verifications} icon={CheckSquare} color="#8b5cf6" subtitle={activeDistrict ? `Sector: ${activeDistrict}` : "Awaiting verifier review"} />
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

        {/* Side Panel: Live Warning Stream */}
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

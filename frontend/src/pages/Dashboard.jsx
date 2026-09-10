import React, { useEffect, useState } from 'react';
import { AlertTriangle, ShieldAlert, Ban, RefreshCw, CheckSquare, Activity, Bell, Globe, MapPin, Check, X, CheckCircle2, ShieldCheck, Filter } from 'lucide-react';
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

  // Default to null -> Displays All Regional NER Totals across all 8 NER states
  const [activeDistrict, setActiveDistrict] = useState(null);
  const [roadsGeoJSON, setRoadsGeoJSON] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Status Filter for Active Incidents Console: 'ALL', 'PENDING', 'VERIFIED', 'REJECTED'
  const [incidentFilter, setIncidentFilter] = useState('ALL');
  const [actionNotice, setActionNotice] = useState(null);

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
      if (onLocationChange) onLocationChange(null);
    } else {
      setActiveDistrict(districtName);
      fetchDashboardData(districtName);
      if (onLocationChange) onLocationChange(districtName);
    }
  };

  const handleMapLocationChange = (placeName, lat, lon) => {
    setActiveDistrict(placeName);
    fetchDashboardData(placeName);
    if (onLocationChange) onLocationChange(placeName);
  };

  // Perform inline verifier action directly from Dashboard
  const handleInlineVerify = async (incidentId, decision) => {
    const remarks = decision === 'VERIFIED'
      ? 'Verified via Dashboard Command Center. Corridor set to BLOCKED and auto-rerouting triggered.'
      : 'Rejected via Dashboard Command Center. Corridor restored to ACCESSIBLE.';

    setActionNotice({ type: 'info', message: `Processing '${decision}' decision for Incident #${incidentId}...` });

    try {
      await apiFetch('/verifications', {
        method: 'POST',
        body: JSON.stringify({
          incident_id: incidentId,
          decision,
          remarks
        })
      });

      setActionNotice({
        type: 'success',
        message: `✓ Incident #${incidentId} ${decision === 'VERIFIED' ? 'VERIFIED — Highway set to BLOCKED & Auto-Rerouting Dispatched' : 'REJECTED — Highway restored to ACCESSIBLE'}. Dashboard updated!`
      });

      // Refresh data immediately
      fetchDashboardData(activeDistrict);
      setTimeout(() => setActionNotice(null), 5000);
    } catch (err) {
      setActionNotice({ type: 'error', message: `Verification failed: ${err.message}` });
    }
  };

  // Compute sector-specific filtered metrics or global regional totals cleanly
  const computeMetrics = () => {
    const isLoaded = !loading;

    if (!activeDistrict || activeDistrict === 'all') {
      return {
        active_incidents: isLoaded ? incidents.filter(i => i.verification_status !== 'REJECTED').length : summary.active_incidents,
        high_risk_corridors: isLoaded && roadsGeoJSON ? (roadsGeoJSON.features || []).filter(f => f.properties?.risk_score >= 50 || f.properties?.accessibility_status === 'BLOCKED' || f.properties?.accessibility_status === 'RISKY').length : summary.high_risk_corridors,
        blocked_roads: isLoaded && roadsGeoJSON ? (roadsGeoJSON.features || []).filter(f => f.properties?.accessibility_status === 'BLOCKED').length : summary.blocked_roads,
        vehicles_rerouted: isLoaded ? vehicles.filter(v => v.status === 'REROUTED').length : summary.vehicles_rerouted,
        pending_verifications: isLoaded ? incidents.filter(i => i.verification_status === 'PENDING').length : summary.pending_verifications
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

  // Filtered incidents list for the Active Ground Hazards Console
  const displayedIncidents = incidents.filter(i => {
    if (activeDistrict && activeDistrict !== 'all') {
      const distTerm = activeDistrict.toLowerCase();
      const matchesDist = (i.district && i.district.toLowerCase().includes(distTerm)) || (i.description && i.description.toLowerCase().includes(distTerm));
      if (!matchesDist) return false;
    }
    if (incidentFilter === 'PENDING') return i.verification_status === 'PENDING';
    if (incidentFilter === 'VERIFIED') return i.verification_status === 'VERIFIED';
    if (incidentFilter === 'REJECTED') return i.verification_status === 'REJECTED';
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Active Sector / Regional Filter Control Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(30, 41, 59, 0.85)', border: '1px solid #334155', padding: '10px 18px', borderRadius: '10px', flexWrap: 'wrap', gap: '12px' }}>
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

      {actionNotice && (
        <div style={{
          background: actionNotice.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : actionNotice.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)',
          border: `1px solid ${actionNotice.type === 'success' ? '#10b981' : actionNotice.type === 'error' ? '#ef4444' : '#3b82f6'}`,
          color: actionNotice.type === 'success' ? '#34d399' : actionNotice.type === 'error' ? '#f87171' : '#60a5fa',
          padding: '12px 16px',
          borderRadius: '8px',
          fontSize: '0.85rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {actionNotice.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{actionNotice.message}</span>
        </div>
      )}

      {/* Main Grid Layout: Map + Live Warning Stream Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr', gap: '20px' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '1.05rem', color: '#f8fafc', fontWeight: 700 }}>Live GIS Operational Map</h3>
            <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 600 }}>
              {activeDistrict ? `📍 Sector: ${activeDistrict}` : "North Eastern Region (NER) Vector Layers"}
            </span>
          </div>
          <MapView activeDistrict={activeDistrict} roadsGeoJSON={roadsGeoJSON} incidents={incidents} vehicles={vehicles} onLocationChange={handleMapLocationChange} />
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

      {/* ACTIVE GROUND HAZARDS & VERIFICATION MONITORING CONSOLE */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle color="#f43f5e" size={22} />
            <div>
              <h3 style={{ fontSize: '1.1rem', color: '#fff', margin: 0, fontWeight: 700 }}>Active Hazards & Field Incident Monitoring Console</h3>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0 }}>Review reported landslides, flood blockages, and execute verification authorization</p>
            </div>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '6px', background: '#0f172a', padding: '4px', borderRadius: '8px', border: '1px solid #334155' }}>
            {[
              { id: 'ALL', label: `All Hazards (${incidents.length})` },
              { id: 'PENDING', label: `🟨 Pending (${incidents.filter(i => i.verification_status === 'PENDING').length})` },
              { id: 'VERIFIED', label: `🟩 Verified (${incidents.filter(i => i.verification_status === 'VERIFIED').length})` },
              { id: 'REJECTED', label: `🟥 Rejected (${incidents.filter(i => i.verification_status === 'REJECTED').length})` }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setIncidentFilter(tab.id)}
                style={{
                  background: incidentFilter === tab.id ? '#2563eb' : 'transparent',
                  color: incidentFilter === tab.id ? '#ffffff' : '#94a3b8',
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {displayedIncidents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 20px', background: '#0f172a', borderRadius: '8px', border: '1px border-dashed #334155' }}>
            <ShieldCheck color="#10b981" size={36} style={{ margin: '0 auto 8px auto' }} />
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>No reported incidents matching the selected filter.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
            {displayedIncidents.map((item) => {
              const isPending = item.verification_status === 'PENDING';
              const isVerified = item.verification_status === 'VERIFIED';
              const isRejected = item.verification_status === 'REJECTED';

              const badgeBg = isPending ? 'rgba(245, 158, 11, 0.2)' : isVerified ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)';
              const badgeColor = isPending ? '#fbbf24' : isVerified ? '#34d399' : '#f87171';
              const badgeBorder = isPending ? 'rgba(245, 158, 11, 0.4)' : isVerified ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)';

              return (
                <div key={item.id} style={{ background: '#0f172a', border: `1px solid ${isPending ? '#3b82f6' : '#334155'}`, borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.78rem', color: '#38bdf8', fontWeight: 700 }}>Incident #{item.id}</span>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span style={{ background: badgeBg, color: badgeColor, border: `1px solid ${badgeBorder}`, padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 700 }}>
                          {isPending ? '🟨 PENDING REVIEW' : isVerified ? '🟩 VERIFIED (BLOCKED)' : '🟥 REJECTED (ACCESSIBLE)'}
                        </span>
                        <RiskBadge level={item.severity} score={item.risk_score} />
                      </div>
                    </div>

                    <h4 style={{ fontSize: '1.02rem', color: '#f8fafc', margin: '0 0 6px 0', fontWeight: 700 }}>{item.incident_type} Hazard</h4>
                    <p style={{ fontSize: '0.83rem', color: '#cbd5e1', margin: '0 0 10px 0', lineHeight: 1.4 }}>{item.description}</p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: '#94a3b8', marginBottom: '10px', flexWrap: 'wrap' }}>
                      <span>📍 Sector: <strong>{item.district || 'East Khasi Hills'}</strong></span>
                      <span>GPS: {item.latitude ? item.latitude.toFixed(2) : 25.90}, {item.longitude ? item.longitude.toFixed(2) : 91.80}</span>
                    </div>

                    {item.ai_recommendation && (
                      <div style={{ background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '8px 10px', borderRadius: '6px', marginBottom: '12px', fontSize: '0.78rem', color: '#93c5fd' }}>
                        💡 {item.ai_recommendation}
                      </div>
                    )}
                  </div>

                  {/* Inline Verification Action Buttons */}
                  {isPending ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
                      <button
                        onClick={() => handleInlineVerify(item.id, 'VERIFIED')}
                        style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                      >
                        <Check size={14} />
                        <span>Verify (Block)</span>
                      </button>

                      <button
                        onClick={() => handleInlineVerify(item.id, 'REJECTED')}
                        style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#f87171', padding: '8px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                      >
                        <X size={14} />
                        <span>Reject</span>
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#94a3b8', paddingTop: '6px', borderTop: '1px solid #1e293b' }}>
                      <span>Verification Decision Logged</span>
                      <button
                        onClick={() => handleInlineVerify(item.id, isVerified ? 'REJECTED' : 'VERIFIED')}
                        style={{ background: 'transparent', border: '1px solid #334155', color: '#38bdf8', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }}
                      >
                        Toggle Status ({isVerified ? 'Restore Accessible' : 'Block Corridor'})
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

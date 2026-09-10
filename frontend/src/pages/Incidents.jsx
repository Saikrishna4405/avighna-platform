import React, { useState, useEffect } from 'react';
import { AlertTriangle, Plus, Upload, CheckCircle, Navigation, MapPin, Search, Filter } from 'lucide-react';
import { apiFetch } from '../services/api';
import { queueOfflineIncident, syncOfflineIncidents, getOfflineQueue } from '../services/offlineStorage';

const districtPresetCoords = {
  'East Khasi Hills': { lat: 25.90, lon: 91.88 },
  'Guwahati': { lat: 26.14, lon: 91.73 },
  'Cachar (Silchar)': { lat: 24.83, lon: 92.80 },
  'Kohima': { lat: 25.67, lon: 94.11 },
  'Papum Pare (Itanagar)': { lat: 27.08, lon: 93.60 },
  'Aizawl': { lat: 23.73, lon: 92.71 },
  'East Sikkim (Gangtok)': { lat: 27.33, lon: 88.60 },
  'Imphal': { lat: 24.81, lon: 93.93 }
};

export const Incidents = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [offlineCount, setOfflineCount] = useState(0);

  // Form State
  const [incidentType, setIncidentType] = useState('LANDSLIDE');
  const [severity, setSeverity] = useState('HIGH');
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState(25.90);
  const [longitude, setLongitude] = useState(91.80);
  const [photoUrl, setPhotoUrl] = useState('landslide_field_photo_01.jpg');
  const [district, setDistrict] = useState('East Khasi Hills');
  const [submittedResult, setSubmittedResult] = useState(null);
  const [locatingGPS, setLocatingGPS] = useState(false);

  // Table Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchIncidents = async () => {
    try {
      const data = await apiFetch('/incidents');
      setIncidents(data || []);
      setOfflineCount(getOfflineQueue().length);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleDistrictChange = (val) => {
    setDistrict(val);
    if (districtPresetCoords[val]) {
      setLatitude(districtPresetCoords[val].lat);
      setLongitude(districtPresetCoords[val].lon);
    }
  };

  const handleDetectGPS = () => {
    setLocatingGPS(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(parseFloat(pos.coords.latitude.toFixed(4)));
          setLongitude(parseFloat(pos.coords.longitude.toFixed(4)));
          setLocatingGPS(false);
        },
        (err) => {
          alert(`GPS Location access denied or unavailable: ${err.message}`);
          setLocatingGPS(false);
        },
        { enableHighAccuracy: true }
      );
    } else {
      alert('Geolocation is not supported in this browser.');
      setLocatingGPS(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSubmittedResult(null);

    const payload = {
      incident_type: incidentType,
      severity,
      description: description || `${severity} ${incidentType} hazard reported in ${district}`,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      photo_url: photoUrl,
      district
    };

    try {
      const res = await apiFetch('/incidents', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setSubmittedResult(res);
      setDescription('');
      fetchIncidents();
    } catch (err) {
      const queued = queueOfflineIncident(payload);
      alert(`Network disruption detected. Incident report queued locally (${queued.local_id}). Will auto-sync when online.`);
      setOfflineCount(getOfflineQueue().length);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSync = async () => {
    const res = await syncOfflineIncidents();
    alert(`Synced ${res.synced} offline report(s) to server.`);
    fetchIncidents();
  };

  // Filtered incidents list for the right table
  const filteredIncidents = incidents.filter(inc => {
    if (statusFilter !== 'ALL' && inc.verification_status !== statusFilter) {
      return false;
    }
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      (inc.incident_type && inc.incident_type.toLowerCase().includes(q)) ||
      (inc.district && inc.district.toLowerCase().includes(q)) ||
      (inc.description && inc.description.toLowerCase().includes(q)) ||
      String(inc.id).includes(q)
    );
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px' }}>
      {/* Form Panel */}
      <div className="glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle color="#ef4444" size={24} />
          <div>
            <h2 style={{ fontSize: '1.2rem', color: '#fff', margin: 0 }}>Road Hazard & Incident Reporting</h2>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>Field Officer Console — Submitted complaints are analyzed by CV and queued for Admin approval</p>
          </div>
        </div>

        <div style={{ background: 'rgba(239, 68, 68, 0.12)', borderLeft: '4px solid #ef4444', padding: '10px 14px', borderRadius: '10px', marginTop: '14px', marginBottom: '16px', fontSize: '0.82rem', color: '#fca5a5' }}>
          <strong>⚠️ Field Officer Workflow:</strong> Reports submitted here enter the <strong>Pending Verification Queue</strong>. An Admin or Verifier must approve the report to block the corridor.
        </div>

        {offlineCount > 0 && (
          <div style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.4)', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#fbbf24' }}>{offlineCount} report(s) queued offline.</span>
            <button onClick={handleManualSync} style={{ background: '#f59e0b', color: '#000', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>Sync Now</button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Incident Classification</label>
            <select className="form-select" value={incidentType} onChange={(e) => setIncidentType(e.target.value)}>
              <option value="LANDSLIDE">🚨 LANDSLIDE / SLOPE COLLAPSE</option>
              <option value="FLOOD">🌊 FLASH FLOOD / WATERLOGGING</option>
              <option value="ROAD_DAMAGE">🕳️ ROAD DAMAGE / SUBSIDENCE</option>
              <option value="ROAD_BLOCKED">🚧 ROAD BLOCKED / OBSTRUCTION</option>
              <option value="DEBRIS">🪨 DEBRIS & ROCKFALL</option>
              <option value="BRIDGE_DAMAGE">🌉 BRIDGE COLLAPSE / DAMAGE</option>
              <option value="OTHER">⚠️ OTHER HAZARD</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Severity Level</label>
              <select className="form-select" value={severity} onChange={(e) => setSeverity(e.target.value)}>
                <option value="CRITICAL">🔥 CRITICAL</option>
                <option value="HIGH">⚡ HIGH</option>
                <option value="MEDIUM">🟡 MEDIUM</option>
                <option value="LOW">🔵 LOW</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">District Sector Preset</label>
              <select className="form-select" value={district} onChange={(e) => handleDistrictChange(e.target.value)}>
                <option value="East Khasi Hills">📍 East Khasi Hills (Shillong)</option>
                <option value="Guwahati">📍 Guwahati Metro (Assam)</option>
                <option value="Cachar (Silchar)">📍 Cachar Sector (Silchar)</option>
                <option value="Kohima">📍 Kohima Sector (Nagaland)</option>
                <option value="Papum Pare (Itanagar)">📍 Papum Pare (Itanagar)</option>
                <option value="Aizawl">📍 Aizawl Sector (Mizoram)</option>
                <option value="East Sikkim (Gangtok)">📍 East Sikkim (Gangtok)</option>
                <option value="Imphal">📍 Imphal Sector (Manipur)</option>
              </select>
            </div>
          </div>

          {/* Coordinates Row with Live Device GPS button */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label className="form-label" style={{ margin: 0 }}>Latitude</label>
                <button
                  type="button"
                  onClick={handleDetectGPS}
                  disabled={locatingGPS}
                  style={{ background: '#059669', border: 'none', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                >
                  <Navigation size={10} />
                  <span>{locatingGPS ? 'Locating...' : 'Live GPS'}</span>
                </button>
              </div>
              <input type="number" step="any" className="form-input" value={latitude} onChange={(e) => setLatitude(e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label">Longitude</label>
              <input type="number" step="any" className="form-input" value={longitude} onChange={(e) => setLongitude(e.target.value)} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Field Photograph Attachment (Computer Vision Analysis)</label>
            <select className="form-select" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)}>
              <option value="landslide_field_photo_01.jpg">📸 Photo 1: Major Slope Collapse & Landslide Debris</option>
              <option value="road_blocked_flood_02.jpg">📸 Photo 2: Flash Flood Submerged Highway</option>
              <option value="bridge_damage_03.jpg">📸 Photo 3: Bridge Foundation Structural Cracks</option>
              <option value="rockfall_obstruction_04.jpg">📸 Photo 4: Rockfall Boulder Blocking Corridor</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Description / Field Observations</label>
            <textarea className="form-textarea" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Provide detailed ground observations for verifiers..." />
          </div>

          <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
            <Plus size={18} />
            <span>{loading ? 'Submitting Report...' : 'Submit Incident Report'}</span>
          </button>
        </form>

        {submittedResult && (
          <div style={{ marginTop: '16px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '12px', borderRadius: '8px', color: '#34d399', fontSize: '0.82rem' }}>
            <strong>✓ Incident Logged (ID #{submittedResult.id})</strong><br />
            Risk Score: <strong>{submittedResult.risk_score}/100</strong><br />
            AI Recommendation: {submittedResult.ai_recommendation}
          </div>
        )}
      </div>

      {/* Incident List Table Panel */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', color: '#fff', margin: 0, fontWeight: 700 }}>Active Reported Incidents</h3>
            <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0 }}>List of field complaints and verification status</p>
          </div>

          {/* Search Input */}
          <div style={{ display: 'flex', alignItems: 'center', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', padding: '4px 10px', gap: '6px' }}>
            <Search size={14} color="#38bdf8" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search ID, type, sector..."
              style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '0.78rem', outline: 'none', width: '150px' }}
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '6px', background: '#0f172a', padding: '4px', borderRadius: '8px', border: '1px solid #334155', alignSelf: 'flex-start' }}>
          {[
            { id: 'ALL', label: `All (${incidents.length})` },
            { id: 'PENDING', label: `🟨 Pending (${incidents.filter(i => i.verification_status === 'PENDING').length})` },
            { id: 'VERIFIED', label: `🟩 Verified (${incidents.filter(i => i.verification_status === 'VERIFIED').length})` },
            { id: 'REJECTED', label: `🟥 Rejected (${incidents.filter(i => i.verification_status === 'REJECTED').length})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              style={{
                background: statusFilter === tab.id ? '#2563eb' : 'transparent',
                color: statusFilter === tab.id ? '#ffffff' : '#94a3b8',
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

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Severity</th>
                <th>Location</th>
                <th>Status</th>
                <th>Risk Score</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>
                    No reported incidents found matching the filter.
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((inc) => {
                  const isPending = inc.verification_status === 'PENDING';
                  const isVerified = inc.verification_status === 'VERIFIED';
                  const badgeBg = isPending ? 'rgba(245, 158, 11, 0.2)' : isVerified ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)';
                  const badgeColor = isPending ? '#fbbf24' : isVerified ? '#34d399' : '#f87171';
                  const badgeBorder = isPending ? 'rgba(245, 158, 11, 0.4)' : isVerified ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)';

                  return (
                    <tr key={inc.id}>
                      <td>#{inc.id}</td>
                      <td style={{ fontWeight: 600 }}>{inc.incident_type}</td>
                      <td>
                        <span style={{ color: inc.severity==='CRITICAL'||inc.severity==='HIGH'?'#f87171':'#fbbf24', fontWeight: 600 }}>
                          {inc.severity}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        {inc.latitude ? inc.latitude.toFixed(2) : 25.90}, {inc.longitude ? inc.longitude.toFixed(2) : 91.80} ({inc.district})
                      </td>
                      <td>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: badgeBg,
                          color: badgeColor,
                          border: `1px solid ${badgeBorder}`
                        }}>
                          {inc.verification_status}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: inc.risk_score > 70 ? '#fda4af' : '#34d399' }}>
                        {inc.risk_score ? `${inc.risk_score}/100` : 'N/A'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

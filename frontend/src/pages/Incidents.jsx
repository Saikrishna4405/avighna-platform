import React, { useState, useEffect } from 'react';
import { AlertTriangle, Plus, Upload, CheckCircle } from 'lucide-react';
import { apiFetch } from '../services/api';
import { queueOfflineIncident, syncOfflineIncidents, getOfflineQueue } from '../services/offlineStorage';

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

  const fetchIncidents = async () => {
    try {
      const data = await apiFetch('/incidents');
      setIncidents(data);
      setOfflineCount(getOfflineQueue().length);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSubmittedResult(null);

    const payload = {
      incident_type: incidentType,
      severity,
      description,
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
      fetchIncidents();
    } catch (err) {
      // Offline fallback: Queue locally
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

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '20px' }}>
      {/* Form Panel */}
      <div className="glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <AlertTriangle color="#f43f5e" size={22} />
          <h2 style={{ fontSize: '1.2rem', color: '#fff' }}>Field Incident Report</h2>
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
              <option value="LANDSLIDE">LANDSLIDE</option>
              <option value="FLOOD">FLOOD</option>
              <option value="ROAD_DAMAGE">ROAD_DAMAGE</option>
              <option value="ROAD_BLOCKED">ROAD_BLOCKED</option>
              <option value="DEBRIS">DEBRIS</option>
              <option value="BRIDGE_DAMAGE">BRIDGE_DAMAGE</option>
              <option value="OTHER">OTHER</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Severity Level</label>
              <select className="form-select" value={severity} onChange={(e) => setSeverity(e.target.value)}>
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">District Sector</label>
              <input type="text" className="form-input" value={district} onChange={(e) => setDistrict(e.target.value)} required />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Latitude</label>
              <input type="number" step="any" className="form-input" value={latitude} onChange={(e) => setLatitude(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Longitude</label>
              <input type="number" step="any" className="form-input" value={longitude} onChange={(e) => setLongitude(e.target.value)} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Field Photograph Attachment</label>
            <input type="text" className="form-input" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="Photo filename or URL..." />
          </div>

          <div className="form-group">
            <label className="form-label">Description / Remarks</label>
            <textarea className="form-textarea" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Provide detailed field observations..." />
          </div>

          <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
            <Plus size={18} />
            <span>{loading ? 'Submitting Report...' : 'Submit Incident Report'}</span>
          </button>
        </form>

        {submittedResult && (
          <div style={{ marginTop: '16px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '12px', borderRadius: '8px', color: '#34d399', fontSize: '0.82rem' }}>
            <strong>Incident Logged (ID #{submittedResult.id})</strong><br />
            Risk Score: {submittedResult.risk_score}/100<br />
            Recommendation: {submittedResult.ai_recommendation}
          </div>
        )}
      </div>

      {/* Incident List Table */}
      <div className="glass-panel">
        <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '16px' }}>Active Reported Incidents</h3>
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
              {incidents.map((inc) => (
                <tr key={inc.id}>
                  <td>#{inc.id}</td>
                  <td style={{ fontWeight: 600 }}>{inc.incident_type}</td>
                  <td>
                    <span style={{ color: inc.severity==='CRITICAL'||inc.severity==='HIGH'?'#f87171':'#fbbf24', fontWeight: 600 }}>
                      {inc.severity}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{inc.latitude.toFixed(2)}, {inc.longitude.toFixed(2)} ({inc.district})</td>
                  <td>
                    <span className="badge badge-low">{inc.verification_status}</span>
                  </td>
                  <td style={{ fontWeight: 700, color: inc.risk_score > 70 ? '#fda4af' : '#34d399' }}>
                    {inc.risk_score ? `${inc.risk_score}/100` : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

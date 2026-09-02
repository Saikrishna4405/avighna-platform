import React, { useEffect, useState } from 'react';
import { MapView } from '../components/MapView';
import { apiFetch } from '../services/api';

export const LiveMap = () => {
  const [roadsGeoJSON, setRoadsGeoJSON] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    const loadMapData = async () => {
      try {
        const [r, i, v] = await Promise.all([
          apiFetch('/map/roads'),
          apiFetch('/incidents'),
          apiFetch('/vehicles')
        ]);
        setRoadsGeoJSON(r);
        setIncidents(i);
        setVehicles(v);
      } catch (err) {
        console.error('Failed map fetch:', err);
      }
    };
    loadMapData();
  }, []);

  return (
    <div>
      <div className="glass-panel" style={{ padding: '12px 20px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', color: '#fff' }}>Interactive GIS Accessibility Command Map</h2>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>North Eastern Region Vector Infrastructure & Live GPS Tracking</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem' }}>
          <span style={{ color: '#10b981', fontWeight: 600 }}>● ACCESSIBLE (Green)</span>
          <span style={{ color: '#f59e0b', fontWeight: 600 }}>● RISKY (Amber)</span>
          <span style={{ color: '#f43f5e', fontWeight: 600 }}>● BLOCKED (Red)</span>
        </div>
      </div>
      <MapView roadsGeoJSON={roadsGeoJSON} incidents={incidents} vehicles={vehicles} />
    </div>
  );
};

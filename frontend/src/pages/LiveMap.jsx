import React, { useEffect, useState } from 'react';
import { MapView } from '../components/MapView';
import { apiFetch } from '../services/api';
import { Navigation, Play, RefreshCw, Radio } from 'lucide-react';

export const LiveMap = () => {
  const [roadsGeoJSON, setRoadsGeoJSON] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isAutoMoving, setIsAutoMoving] = useState(true);

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

  useEffect(() => {
    loadMapData();
    // Live GPS polling loop every 3 seconds
    const interval = setInterval(loadMapData, 3000);
    return () => clearInterval(interval);
  }, []);

  // Background auto-simulation step for live GPS movement
  useEffect(() => {
    if (!isAutoMoving) return;
    const moveInterval = setInterval(async () => {
      try {
        await apiFetch('/vehicles/simulate-step', { method: 'POST' });
        loadMapData();
      } catch (e) {
        // silent fail if backend restarting
      }
    }, 4000);
    return () => clearInterval(moveInterval);
  }, [isAutoMoving]);

  const handleLocateMe = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          setIsLocating(false);
        },
        (error) => {
          alert(`Geolocation error: ${error.message}. Please allow location access in your browser.`);
          setIsLocating(false);
        },
        { enableHighAccuracy: true }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
      setIsLocating(false);
    }
  };

  return (
    <div>
      <div className="glass-panel" style={{ padding: '14px 20px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '1.15rem', color: '#fff', margin: 0 }}>Interactive GIS Accessibility Command Map</h2>
            <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Radio size={12} className="animate-pulse" /> LIVE GPS SYNC
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>
            North Eastern Region Vector Infrastructure & Live Fleet GPS Tracking
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Device GPS Location Button */}
          <button
            onClick={handleLocateMe}
            disabled={isLocating}
            className="btn-primary"
            style={{ padding: '7px 12px', fontSize: '0.8rem', background: '#059669', border: 'none' }}
          >
            <Navigation size={14} />
            <span>{isLocating ? 'Locating...' : 'Locate My Device GPS'}</span>
          </button>

          {/* Auto Movement Simulation Toggle */}
          <button
            onClick={() => setIsAutoMoving(!isAutoMoving)}
            className="btn-primary"
            style={{ padding: '7px 12px', fontSize: '0.8rem', background: isAutoMoving ? 'rgba(59, 130, 246, 0.2)' : '#334155', border: '1px solid #3b82f6' }}
          >
            <Play size={14} />
            <span>{isAutoMoving ? 'Live Tracking Active' : 'Resume Live GPS'}</span>
          </button>

          {/* Manual Refresh Button */}
          <button
            onClick={loadMapData}
            style={{ padding: '7px', borderRadius: '6px', background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', cursor: 'pointer' }}
            title="Refresh Map Data"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Legend Bar */}
      <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', marginBottom: '12px', padding: '0 4px' }}>
        <span style={{ color: '#10b981', fontWeight: 600 }}>● ACCESSIBLE (Green)</span>
        <span style={{ color: '#f59e0b', fontWeight: 600 }}>● RISKY (Amber)</span>
        <span style={{ color: '#f43f5e', fontWeight: 600 }}>● BLOCKED (Red)</span>
        <span style={{ color: '#3b82f6', fontWeight: 600 }}>🚛 FLEET GPS VEHICLE</span>
        <span style={{ color: '#10b981', fontWeight: 600 }}>📍 YOUR DEVICE GPS</span>
      </div>

      <MapView roadsGeoJSON={roadsGeoJSON} incidents={incidents} vehicles={vehicles} userLocation={userLocation} />
    </div>
  );
};


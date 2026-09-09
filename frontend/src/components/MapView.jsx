import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Search, Navigation, MapPin, Loader2 } from 'lucide-react';

// Custom Marker Icons
const vehicleIcon = L.divIcon({
  className: 'custom-vehicle-marker',
  html: `<div style="background:#2563eb; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-size:14px; border:2px solid white; box-shadow:0 0 12px rgba(37,99,235,0.9);">🚛</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

const incidentIcon = L.divIcon({
  className: 'custom-incident-marker',
  html: `<div style="background:#ef4444; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-size:13px; border:2px solid white; box-shadow:0 0 12px rgba(239,68,68,0.9);">⚠️</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14]
});

const userIcon = L.divIcon({
  className: 'custom-user-marker',
  html: `<div style="background:#10b981; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-size:15px; border:3px solid white; box-shadow:0 0 15px rgba(16,185,129,0.9);">📍</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

const searchMarkerIcon = L.divIcon({
  className: 'custom-search-marker',
  html: `<div style="background:#8b5cf6; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-size:15px; border:3px solid white; box-shadow:0 0 15px rgba(139,92,246,0.9);">🔍</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

// Component to dynamically re-center map view
function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 12, { duration: 1.5 });
    }
  }, [center, map]);
  return null;
}

export const MapView = ({ roadsGeoJSON, incidents = [], vehicles = [], userLocation = null, mapCenter = null, onLocationChange }) => {
  const defaultCenter = [25.90, 91.88];
  const defaultZoom = 8;

  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchedResult, setSearchedResult] = useState(null);
  const [activeCenter, setActiveCenter] = useState(null);
  const [locatingDevice, setLocatingDevice] = useState(false);
  const [deviceLoc, setDeviceLoc] = useState(userLocation);

  useEffect(() => {
    if (mapCenter) setActiveCenter(mapCenter);
  }, [mapCenter]);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      // Query OpenStreetMap Nominatim free geocoding service
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ', India')}`);
      const data = await res.json();

      if (data && data.length > 0) {
        const top = data[0];
        const lat = parseFloat(top.lat);
        const lon = parseFloat(top.lon);
        const newPos = [lat, lon];
        const shortName = top.display_name.split(',')[0];

        setSearchedResult({
          position: newPos,
          name: top.display_name
        });
        setActiveCenter(newPos);
        if (onLocationChange) onLocationChange(shortName, lat, lon);
      } else {
        alert(`Location "${searchQuery}" not found. Try searching for cities like Shillong, Guwahati, Kohima, Silchar, etc.`);
      }
    } catch (err) {
      alert('Search failed. Please check internet connection.');
    } finally {
      setSearching(false);
    }
  };

  const handleQuickPreset = (cityName, lat, lon) => {
    const newPos = [lat, lon];
    setSearchQuery(cityName);
    setSearchedResult({
      position: newPos,
      name: `${cityName}, North East India`
    });
    setActiveCenter(newPos);
    if (onLocationChange) onLocationChange(cityName, lat, lon);
  };

  const handleDetectDeviceGPS = () => {
    setLocatingDevice(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const loc = [lat, lon];
          setDeviceLoc(loc);
          setActiveCenter(loc);
          setLocatingDevice(false);

          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
            .then((r) => r.json())
            .then((geo) => {
              const townName = geo.address?.city || geo.address?.town || geo.address?.suburb || geo.address?.county || geo.address?.state || 'Live GPS';
              if (onLocationChange) onLocationChange(townName, lat, lon);
            })
            .catch(() => {
              if (onLocationChange) onLocationChange('Live Device GPS', lat, lon);
            });
        },
        (err) => {
          alert(`Location access denied or unavailable: ${err.message}`);
          setLocatingDevice(false);
        },
        { enableHighAccuracy: true }
      );
    } else {
      alert('Geolocation is not supported in this browser.');
      setLocatingDevice(false);
    }
  };

  const getRoadColor = (status, risk) => {
    if (status === 'BLOCKED' || risk > 70) return '#f43f5e';
    if (status === 'RISKY' || risk > 45) return '#f59e0b';
    return '#10b981';
  };

  const [mapTheme, setMapTheme] = useState('dark'); // 'dark', 'street', 'satellite'

  const tileSources = {
    dark: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      attr: '&copy; Esri Canvas Dark'
    },
    street: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{y}/{x}.png',
      attr: '&copy; OpenStreetMap contributors'
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attr: '&copy; Esri World Imagery'
    }
  };

  return (
    <div className="map-container" style={{ width: '100%', height: '560px', minHeight: '500px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #334155', position: 'relative' }}>
      
      {/* OVERLAY SEARCH & THEME BAR */}
      <div style={{ position: 'absolute', top: '12px', left: '60px', right: '12px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '8px', pointerEvents: 'none' }}>
        <div style={{ display: 'flex', gap: '8px', pointerEvents: 'auto', background: 'rgba(15, 23, 42, 0.92)', backdropFilter: 'blur(8px)', padding: '6px 12px', borderRadius: '8px', border: '1px solid #334155', boxShadow: '0 8px 16px rgba(0,0,0,0.4)', alignItems: 'center' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', flex: 1, gap: '8px' }}>
            <Search size={16} color="#38bdf8" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search any place in NE India (e.g. Shillong, Guwahati, Kohima, Silchar)..."
              style={{ flex: 1, background: 'transparent', border: 'none', color: '#f8fafc', fontSize: '0.85rem', outline: 'none' }}
            />
            <button type="submit" disabled={searching} style={{ background: '#2563eb', border: 'none', color: '#fff', padding: '5px 12px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {searching ? <Loader2 size={14} className="animate-spin" /> : <span>Search</span>}
            </button>
          </form>

          {/* Map Layer Theme Buttons */}
          <div style={{ display: 'flex', background: '#0f172a', borderRadius: '6px', padding: '2px', border: '1px solid #334155' }}>
            <button
              onClick={() => setMapTheme('dark')}
              style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', background: mapTheme === 'dark' ? '#2563eb' : 'transparent', color: mapTheme === 'dark' ? '#fff' : '#94a3b8', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}
            >
              🌙 Dark
            </button>
            <button
              onClick={() => setMapTheme('street')}
              style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', background: mapTheme === 'street' ? '#2563eb' : 'transparent', color: mapTheme === 'street' ? '#fff' : '#94a3b8', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}
            >
              🗺️ Street
            </button>
            <button
              onClick={() => setMapTheme('satellite')}
              style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', background: mapTheme === 'satellite' ? '#2563eb' : 'transparent', color: mapTheme === 'satellite' ? '#fff' : '#94a3b8', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}
            >
              🛰️ Satellite
            </button>
          </div>

          <button
            onClick={handleDetectDeviceGPS}
            disabled={locatingDevice}
            style={{ background: '#059669', border: 'none', color: '#fff', padding: '5px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            title="Detect My Live Device Location"
          >
            <Navigation size={14} />
            <span>{locatingDevice ? 'Locating...' : 'GPS'}</span>
          </button>
        </div>

        {/* Quick Location Pills */}
        <div style={{ display: 'flex', gap: '6px', pointerEvents: 'auto', overflowX: 'auto', paddingBottom: '4px' }}>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, alignSelf: 'center', background: 'rgba(15,23,42,0.85)', padding: '2px 6px', borderRadius: '4px' }}>Quick Jump:</span>
          {[
            { name: 'Guwahati', lat: 26.1445, lon: 91.7362 },
            { name: 'Shillong', lat: 25.5788, lon: 91.8933 },
            { name: 'Silchar', lat: 24.8333, lon: 92.7789 },
            { name: 'Kohima', lat: 25.6747, lon: 94.1100 },
            { name: 'Itanagar', lat: 27.0844, lon: 93.6053 },
            { name: 'Imphal', lat: 24.8170, lon: 93.9368 }
          ].map((loc) => (
            <button
              key={loc.name}
              onClick={() => handleQuickPreset(loc.name, loc.lat, loc.lon)}
              style={{
                background: 'rgba(15, 23, 42, 0.88)',
                border: '1px solid #334155',
                color: '#cbd5e1',
                padding: '3px 8px',
                borderRadius: '12px',
                fontSize: '0.72rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '3px'
              }}
            >
              <MapPin size={10} color="#38bdf8" />
              <span>{loc.name}</span>
            </button>
          ))}
        </div>
      </div>

      <MapContainer center={defaultCenter} zoom={defaultZoom} scrollWheelZoom={true} style={{ width: '100%', height: '100%', minHeight: '500px', borderRadius: '12px' }}>
        <MapRecenter center={activeCenter} />

        {/* Selected Dynamic Base Map Layer (100% Free, No API Key Required) */}
        <TileLayer
          key={mapTheme}
          attribution={tileSources[mapTheme].attr}
          url={tileSources[mapTheme].url}
          maxZoom={18}
        />

        {/* Render Road Network Corridors with High-Contrast Outer Outlines */}
        {roadsGeoJSON && roadsGeoJSON.features && roadsGeoJSON.features.map((feature, idx) => {
          const props = feature.properties;
          const coords = feature.geometry.coordinates.map(c => [c[1], c[0]]);
          const color = getRoadColor(props.accessibility_status, props.risk_score);

          return (
            <React.Fragment key={props.road_id || idx}>
              {/* Outer Dark Stroke for High Contrast */}
              <Polyline
                positions={coords}
                pathOptions={{
                  color: '#000000',
                  weight: props.accessibility_status === 'BLOCKED' ? 8 : 6,
                  opacity: 0.9
                }}
              />
              {/* Inner Color Polyline */}
              <Polyline
                positions={coords}
                pathOptions={{
                  color: color,
                  weight: props.accessibility_status === 'BLOCKED' ? 5 : 3.5,
                  dashArray: props.accessibility_status === 'BLOCKED' ? '8, 8' : null,
                  opacity: 1.0
                }}
              >
                <Popup>
                  <div style={{ color: '#0f172a', padding: '4px' }}>
                    <h4 style={{ margin: 0, fontSize: '0.95rem' }}>{props.road_name}</h4>
                    <p style={{ margin: '4px 0', fontSize: '0.8rem' }}>Code: {props.road_code}</p>
                    <p style={{ margin: '4px 0', fontSize: '0.8rem', fontWeight: 600, color }}>
                      Status: {props.accessibility_status} (Risk: {props.risk_score}/100)
                    </p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                      Length: {props.length_km} km | Slope: {props.slope}°
                    </p>
                  </div>
                </Popup>
              </Polyline>
            </React.Fragment>
          );
        })}

        {/* Render Active Incident Hazard Points */}
        {incidents.map((inc) => (
          <Marker key={inc.id} position={[inc.latitude, inc.longitude]} icon={incidentIcon}>
            <Popup>
              <div style={{ color: '#0f172a', padding: '4px' }}>
                <h4 style={{ margin: 0, color: '#dc2626' }}>{inc.incident_type} ({inc.severity})</h4>
                <p style={{ margin: '4px 0', fontSize: '0.8rem' }}>{inc.description}</p>
                <p style={{ margin: '4px 0', fontSize: '0.75rem', color: '#475569' }}>
                  Verification: <strong>{inc.verification_status}</strong>
                </p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Render Fleet Vehicles (Live GPS Markers) */}
        {vehicles.map((v) => (
          <Marker key={v.id} position={[v.latitude, v.longitude]} icon={vehicleIcon}>
            <Popup>
              <div style={{ color: '#0f172a', padding: '4px' }}>
                <h4 style={{ margin: 0, color: '#2563eb' }}>Vehicle: {v.vehicle_number}</h4>
                <p style={{ margin: '4px 0', fontSize: '0.8rem' }}>Cargo: <strong>{v.cargo_type}</strong> ({v.priority})</p>
                <p style={{ margin: '4px 0', fontSize: '0.8rem' }}>
                  Status: <span style={{ fontWeight: 700, color: v.status==='REROUTED'?'#d97706':'#059669' }}>{v.status}</span>
                </p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>Destination: {v.destination} (ETA: {v.eta})</p>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.7rem', color: '#3b82f6', fontWeight: 600 }}>
                  GPS: {v.latitude.toFixed(4)}, {v.longitude.toFixed(4)}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Render Searched Location Marker */}
        {searchedResult && (
          <Marker position={searchedResult.position} icon={searchMarkerIcon}>
            <Popup>
              <div style={{ color: '#0f172a', padding: '4px' }}>
                <h4 style={{ margin: 0, color: '#7c3aed' }}>🔍 Searched Location</h4>
                <p style={{ margin: '4px 0', fontSize: '0.8rem' }}>{searchedResult.name}</p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b21a8', fontWeight: 600 }}>
                  Coords: {searchedResult.position[0].toFixed(4)}, {searchedResult.position[1].toFixed(4)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Render Current User Device Location Marker */}
        {(deviceLoc || userLocation) && (
          <Marker position={deviceLoc || userLocation} icon={userIcon}>
            <Popup>
              <div style={{ color: '#0f172a', padding: '4px' }}>
                <h4 style={{ margin: 0, color: '#059669' }}>📍 Your Live Device Location</h4>
                <p style={{ margin: '4px 0', fontSize: '0.8rem' }}>
                  GPS: <strong>{(deviceLoc || userLocation)[0].toFixed(4)}, {(deviceLoc || userLocation)[1].toFixed(4)}</strong>
                </p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
                  ● Live Geolocation Sync Active
                </p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};



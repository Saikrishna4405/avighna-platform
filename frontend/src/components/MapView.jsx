import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Polygon, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Search, Navigation, MapPin, Loader2, Layers, AlertTriangle, Truck, ShieldAlert } from 'lucide-react';

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

const roadBlockIcon = L.divIcon({
  className: 'custom-roadblock-marker',
  html: `<div style="background:#dc2626; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-size:14px; border:2px solid white; box-shadow:0 0 16px rgba(220,38,38,1.0); font-weight:bold;">⛔</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15]
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

const cityCoordsMap = {
  'Guwahati': [26.1445, 91.7362],
  'Shillong': [25.5788, 91.8933],
  'East Khasi Hills': [25.5788, 91.8933],
  'Silchar': [24.8333, 92.7789],
  'Cachar': [24.8333, 92.7789],
  'Kohima': [25.6747, 94.1100],
  'Dimapur': [25.9060, 93.7270],
  'Itanagar': [27.0844, 93.6053],
  'Papum Pare': [27.0844, 93.6053],
  'Imphal': [24.8170, 93.9368],
  'Aizawl': [23.7307, 92.7173],
  'Gangtok': [27.3389, 88.6065],
  'East Sikkim': [27.3389, 88.6065]
};

// Regional State Boundary Geometries (Polygons)
const regionalBoundaries = [
  {
    name: 'Assam Logistics Corridor',
    color: '#38bdf8',
    coords: [
      [26.8, 89.8], [27.9, 95.8], [27.0, 96.0], [24.8, 92.8], [26.0, 89.8]
    ]
  },
  {
    name: 'Meghalaya Highland Sector',
    color: '#f59e0b',
    coords: [
      [25.9, 89.8], [26.1, 92.8], [25.1, 92.7], [25.0, 89.9]
    ]
  },
  {
    name: 'Nagaland Eastern Border Sector',
    color: '#a855f7',
    coords: [
      [27.0, 94.0], [27.1, 95.3], [25.6, 94.7], [25.4, 93.3]
    ]
  },
  {
    name: 'Arunachal Frontier Sector',
    color: '#10b981',
    coords: [
      [27.0, 91.5], [29.3, 97.4], [27.8, 97.0], [26.9, 93.5]
    ]
  },
  {
    name: 'Manipur Southern Sector',
    color: '#ec4899',
    coords: [
      [25.7, 93.0], [25.6, 94.7], [23.8, 94.5], [24.2, 93.0]
    ]
  }
];

export const MapView = ({ activeDistrict, roadsGeoJSON, incidents = [], vehicles = [], userLocation = null, mapCenter = null, onLocationChange }) => {
  const defaultCenter = [25.90, 91.88];
  const defaultZoom = 8;

  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchedResult, setSearchedResult] = useState(null);
  const [activeCenter, setActiveCenter] = useState(null);
  const [locatingDevice, setLocatingDevice] = useState(false);
  const [deviceLoc, setDeviceLoc] = useState(userLocation);

  // Map layer toggle states
  const [showCorridors, setShowCorridors] = useState(true);
  const [showRoadblocks, setShowRoadblocks] = useState(true);
  const [showHazards, setShowHazards] = useState(true);
  const [showFleet, setShowFleet] = useState(true);
  const [showBoundaries, setShowBoundaries] = useState(true);

  useEffect(() => {
    if (activeDistrict && activeDistrict !== 'all') {
      const matchKey = Object.keys(cityCoordsMap).find(k => activeDistrict.toLowerCase().includes(k.toLowerCase()));
      if (matchKey && cityCoordsMap[matchKey]) {
        setActiveCenter(cityCoordsMap[matchKey]);
      } else {
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(activeDistrict + ', India')}`)
          .then(r => r.json())
          .then(data => {
            if (data && data.length > 0) {
              setActiveCenter([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
            }
          }).catch(() => {});
      }
    } else if (activeDistrict === 'all' || activeDistrict === null) {
      setActiveCenter(defaultCenter);
    }
  }, [activeDistrict]);

  useEffect(() => {
    if (mapCenter) setActiveCenter(mapCenter);
  }, [mapCenter]);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
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
        async (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const loc = [lat, lon];
          setDeviceLoc(loc);
          setActiveCenter(loc);
          setLocatingDevice(false);

          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
            const data = await res.json();
            const addr = data.address || {};
            const cleanCity = addr.city || addr.town || addr.county || addr.state_district || addr.suburb || addr.state || (data.display_name ? data.display_name.split(',')[0] : 'Hyderabad');
            setSearchQuery(cleanCity);
            if (onLocationChange) onLocationChange(cleanCity, lat, lon);
          } catch (e) {
            console.error('GPS reverse geocode failed:', e);
            if (onLocationChange) onLocationChange('Hyderabad', lat, lon);
          }
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

  const [mapTheme, setMapTheme] = useState('osm'); // 'osm', 'satellite', 'dark', 'hybrid'

  const tileSources = {
    osm: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      subdomains: ['a', 'b', 'c'],
      attr: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    },
    dark: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      subdomains: ['a', 'b', 'c'],
      attr: '&copy; Esri Dark Gray'
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      subdomains: ['a', 'b', 'c'],
      attr: '&copy; Esri World Imagery Satellite'
    },
    hybrid: {
      url: 'https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attr: '&copy; Satellite Overlay'
    }
  };

  // Count active blocked roads
  const blockedRoadsCount = roadsGeoJSON?.features ? roadsGeoJSON.features.filter(f => f.properties?.accessibility_status === 'BLOCKED' || f.properties?.risk_score >= 70).length : 0;

  return (
    <div className="map-container" style={{ width: '100%', height: '580px', minHeight: '500px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #334155', position: 'relative' }}>
      
      {/* OVERLAY CONTROLS BAR */}
      <div style={{ position: 'absolute', top: '12px', left: '60px', right: '12px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '8px', pointerEvents: 'none' }}>
        
        {/* ROW 1: SEARCH & THEME SELECTOR */}
        <div style={{ display: 'flex', gap: '8px', pointerEvents: 'auto', background: 'rgba(15, 23, 42, 0.94)', backdropFilter: 'blur(10px)', padding: '6px 12px', borderRadius: '8px', border: '1px solid #334155', boxShadow: '0 8px 16px rgba(0,0,0,0.4)', alignItems: 'center', flexWrap: 'wrap' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: '220px', gap: '8px' }}>
            <Search size={16} color="#38bdf8" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search any city/mandal in India (e.g. Shillong, Guwahati, Kohima)..."
              style={{ flex: 1, background: 'transparent', border: 'none', color: '#f8fafc', fontSize: '0.85rem', outline: 'none' }}
            />
            <button type="submit" disabled={searching} style={{ background: '#2563eb', border: 'none', color: '#fff', padding: '5px 12px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {searching ? <Loader2 size={14} className="animate-spin" /> : <span>Search</span>}
            </button>
          </form>

          {/* Map Layer Theme Buttons */}
          <div style={{ display: 'flex', background: '#0f172a', borderRadius: '6px', padding: '2px', border: '1px solid #334155' }}>
            <button
              onClick={() => setMapTheme('osm')}
              style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', background: mapTheme === 'osm' ? '#2563eb' : 'transparent', color: mapTheme === 'osm' ? '#fff' : '#94a3b8', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}
            >
              🗺️ OpenStreetMap
            </button>
            <button
              onClick={() => setMapTheme('hybrid')}
              style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', background: mapTheme === 'hybrid' ? '#2563eb' : 'transparent', color: mapTheme === 'hybrid' ? '#fff' : '#94a3b8', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}
            >
              🏷️ Hybrid
            </button>
            <button
              onClick={() => setMapTheme('satellite')}
              style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', background: mapTheme === 'satellite' ? '#2563eb' : 'transparent', color: mapTheme === 'satellite' ? '#fff' : '#94a3b8', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}
            >
              🛰️ Satellite
            </button>
            <button
              onClick={() => setMapTheme('dark')}
              style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', background: mapTheme === 'dark' ? '#2563eb' : 'transparent', color: mapTheme === 'dark' ? '#fff' : '#94a3b8', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}
            >
              🌙 Dark
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

        {/* ROW 2: INTERACTIVE GIS LAYER TOGGLES */}
        <div style={{ display: 'flex', gap: '6px', pointerEvents: 'auto', overflowX: 'auto', background: 'rgba(15, 23, 42, 0.90)', backdropFilter: 'blur(8px)', padding: '4px 10px', borderRadius: '6px', border: '1px solid #334155', alignItems: 'center' }}>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Layers size={12} color="#38bdf8" /> Layers:
          </span>
          
          <button
            onClick={() => setShowCorridors(!showCorridors)}
            style={{ background: showCorridors ? 'rgba(37, 99, 235, 0.3)' : 'transparent', border: `1px solid ${showCorridors ? '#2563eb' : '#475569'}`, color: showCorridors ? '#60a5fa' : '#94a3b8', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }}
          >
            🛣️ Corridors
          </button>
          
          <button
            onClick={() => setShowRoadblocks(!showRoadblocks)}
            style={{ background: showRoadblocks ? 'rgba(220, 38, 38, 0.3)' : 'transparent', border: `1px solid ${showRoadblocks ? '#dc2626' : '#475569'}`, color: showRoadblocks ? '#f87171' : '#94a3b8', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }}
          >
            ⛔ Road Blocks ({blockedRoadsCount})
          </button>

          <button
            onClick={() => setShowHazards(!showHazards)}
            style={{ background: showHazards ? 'rgba(217, 119, 6, 0.3)' : 'transparent', border: `1px solid ${showHazards ? '#d97706' : '#475569'}`, color: showHazards ? '#fbbf24' : '#94a3b8', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }}
          >
            ⚠️ Field Hazards ({incidents.length})
          </button>

          <button
            onClick={() => setShowFleet(!showFleet)}
            style={{ background: showFleet ? 'rgba(16, 185, 129, 0.3)' : 'transparent', border: `1px solid ${showFleet ? '#10b981' : '#475569'}`, color: showFleet ? '#34d399' : '#94a3b8', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }}
          >
            🚛 Relief Fleet ({vehicles.length})
          </button>

          <button
            onClick={() => setShowBoundaries(!showBoundaries)}
            style={{ background: showBoundaries ? 'rgba(147, 51, 234, 0.3)' : 'transparent', border: `1px solid ${showBoundaries ? '#9333ea' : '#475569'}`, color: showBoundaries ? '#c084fc' : '#94a3b8', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }}
          >
            🗺️ Boundaries
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

        {/* Selected Dynamic Base Map Layer */}
        <TileLayer
          key={mapTheme}
          attribution={tileSources[mapTheme].attr}
          url={tileSources[mapTheme].url}
          subdomains={tileSources[mapTheme].subdomains || ['mt0', 'mt1', 'mt2', 'mt3']}
          maxNativeZoom={20}
          maxZoom={21}
        />

        {/* Render Regional Administrative Sector Boundaries */}
        {showBoundaries && regionalBoundaries.map((b, i) => (
          <Polygon
            key={i}
            positions={b.coords}
            pathOptions={{
              color: b.color,
              fillColor: b.color,
              fillOpacity: 0.06,
              weight: 2,
              dashArray: '5, 5'
            }}
          >
            <Popup>
              <div style={{ color: '#0f172a', padding: '4px' }}>
                <h4 style={{ margin: 0, color: b.color }}>🗺️ {b.name}</h4>
                <p style={{ margin: '4px 0', fontSize: '0.8rem' }}>
                  Regional Logistics Sector Administrative Border
                </p>
              </div>
            </Popup>
          </Polygon>
        ))}

        {/* Render Road Network Corridors */}
        {showCorridors && roadsGeoJSON && roadsGeoJSON.features && roadsGeoJSON.features.map((feature, idx) => {
          const props = feature.properties;
          const coords = feature.geometry.coordinates.map(c => [c[1], c[0]]);
          const color = getRoadColor(props.accessibility_status, props.risk_score);
          const isBlocked = props.accessibility_status === 'BLOCKED' || props.risk_score >= 70;
          const midpoint = coords[Math.floor(coords.length / 2)];

          return (
            <React.Fragment key={props.road_id || idx}>
              {/* Outer Contrast Outline */}
              <Polyline
                positions={coords}
                pathOptions={{
                  color: '#000000',
                  weight: isBlocked ? 8 : 6,
                  opacity: 0.9
                }}
              />
              {/* Inner Color Polyline */}
              <Polyline
                positions={coords}
                pathOptions={{
                  color: color,
                  weight: isBlocked ? 5 : 3.5,
                  dashArray: isBlocked ? '8, 8' : null,
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

              {/* Road Block Restriction Marker on Midpoint */}
              {showRoadblocks && isBlocked && midpoint && (
                <Marker position={midpoint} icon={roadBlockIcon}>
                  <Popup>
                    <div style={{ color: '#0f172a', padding: '4px' }}>
                      <h4 style={{ margin: 0, color: '#dc2626' }}>⛔ ROAD CLOSED / BLOCKED RESTRICTION</h4>
                      <p style={{ margin: '4px 0', fontSize: '0.85rem', fontWeight: 700 }}>{props.road_name} ({props.road_code})</p>
                      <p style={{ margin: '4px 0', fontSize: '0.8rem', color: '#dc2626' }}>
                        Passage Impassable | Risk Level: <strong>{props.risk_score}/100</strong>
                      </p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                        Automated Rerouting Active: Relief trucks are automatically safely bypassed around this segment.
                      </p>
                    </div>
                  </Popup>
                </Marker>
              )}
            </React.Fragment>
          );
        })}

        {/* Render Active Incident Hazard Buffer Circles & Central Hazard Markers */}
        {showHazards && incidents.map((inc) => {
          const radiusMeters = inc.severity === 'CRITICAL' ? 10000 : inc.severity === 'HIGH' ? 6000 : 3500;
          const circleColor = inc.severity === 'CRITICAL' ? '#ef4444' : inc.severity === 'HIGH' ? '#f59e0b' : '#3b82f6';

          return (
            <React.Fragment key={inc.id}>
              <Circle
                center={[inc.latitude, inc.longitude]}
                radius={radiusMeters}
                pathOptions={{
                  color: circleColor,
                  fillColor: circleColor,
                  fillOpacity: 0.18,
                  weight: 2,
                  dashArray: '6, 6'
                }}
              >
                <Popup>
                  <div style={{ color: '#0f172a', padding: '4px' }}>
                    <h4 style={{ margin: 0, color: circleColor }}>⚠️ {inc.incident_type} Hazard Buffer Zone</h4>
                    <p style={{ margin: '4px 0', fontSize: '0.8rem' }}>
                      Impact Radius: <strong>{(radiusMeters / 1000).toFixed(1)} km Buffer</strong> ({inc.severity} Severity)
                    </p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#475569' }}>
                      Corridors & trucks inside this radius trigger automated rerouting advisories.
                    </p>
                  </div>
                </Popup>
              </Circle>

              <Marker position={[inc.latitude, inc.longitude]} icon={incidentIcon}>
                <Popup>
                  <div style={{ color: '#0f172a', padding: '4px' }}>
                    <h4 style={{ margin: 0, color: '#dc2626' }}>⚠️ {inc.incident_type} ({inc.severity})</h4>
                    <p style={{ margin: '4px 0', fontSize: '0.8rem' }}>{inc.description}</p>
                    <p style={{ margin: '4px 0', fontSize: '0.75rem', color: '#475569' }}>
                      Verification: <strong>{inc.verification_status}</strong>
                    </p>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}

        {/* Render Fleet Vehicles (Live GPS Markers) */}
        {showFleet && vehicles.map((v) => (
          <Marker key={v.id} position={[v.latitude, v.longitude]} icon={vehicleIcon}>
            <Popup>
              <div style={{ color: '#0f172a', padding: '4px' }}>
                <h4 style={{ margin: 0, color: '#2563eb' }}>🚛 Vehicle: {v.vehicle_number}</h4>
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

        {/* Render Active Sector Outer Focus Boundary Circle */}
        {activeDistrict && activeCenter && (
          <Circle
            center={activeCenter}
            radius={15000}
            pathOptions={{
              color: '#38bdf8',
              fillColor: '#0284c7',
              fillOpacity: 0.14,
              weight: 3,
              dashArray: '8, 8'
            }}
          >
            <Popup>
              <div style={{ color: '#0f172a', padding: '4px' }}>
                <h4 style={{ margin: 0, color: '#0284c7' }}>📍 15.0 km Sector Coverage Outer Boundary</h4>
                <p style={{ margin: '4px 0', fontSize: '0.8rem' }}>
                  Active Sector: <strong>{activeDistrict}</strong>
                </p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#0369a1' }}>
                  Outer boundary enclosing all local GIS road corridors, hazard sensors, and fleet vehicles.
                </p>
              </div>
            </Popup>
          </Circle>
        )}
      </MapContainer>

      {/* FLOATING HUD METRICS SUMMARY CARD (BOTTOM RIGHT) */}
      <div style={{ position: 'absolute', bottom: '16px', right: '16px', zIndex: 1000, background: 'rgba(15, 23, 42, 0.92)', backdropFilter: 'blur(10px)', border: '1px solid #334155', borderRadius: '8px', padding: '8px 12px', display: 'flex', gap: '14px', alignItems: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShieldAlert size={14} color="#ef4444" />
          <span style={{ fontSize: '0.75rem', color: '#f8fafc', fontWeight: 600 }}>
            Blocked: <strong style={{ color: '#ef4444' }}>{blockedRoadsCount}</strong>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AlertTriangle size={14} color="#f59e0b" />
          <span style={{ fontSize: '0.75rem', color: '#f8fafc', fontWeight: 600 }}>
            Hazards: <strong style={{ color: '#f59e0b' }}>{incidents.length}</strong>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Truck size={14} color="#34d399" />
          <span style={{ fontSize: '0.75rem', color: '#f8fafc', fontWeight: 600 }}>
            Fleet: <strong style={{ color: '#34d399' }}>{vehicles.length}</strong>
          </span>
        </div>
      </div>
    </div>
  );
};

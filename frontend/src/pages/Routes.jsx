import React, { useState, useEffect, useRef } from 'react';
import { Navigation, ShieldCheck, Clock, MapPin, CheckCircle, Search, AlertCircle, Loader2 } from 'lucide-react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { apiFetch } from '../services/api';

// Custom Marker Icons for Route Planner
const startIcon = L.divIcon({
  className: 'custom-start-marker',
  html: `<div style="background:#059669; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-size:15px; border:3px solid white; box-shadow:0 0 15px rgba(5,150,105,0.9);">🚩</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

const endIcon = L.divIcon({
  className: 'custom-end-marker',
  html: `<div style="background:#dc2626; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-size:15px; border:3px solid white; box-shadow:0 0 15px rgba(220,38,38,0.9);">🏁</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

// Component to auto-fit map view to route polyline bounds
function RouteBoundsFitter({ polylineCoords }) {
  const map = useMap();
  useEffect(() => {
    if (polylineCoords && polylineCoords.length > 0) {
      const bounds = L.latLngBounds(polylineCoords);
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [polylineCoords, map]);
  return null;
}

export const Routes = ({ onLocationChange }) => {
  // Form State
  const [originName, setOriginName] = useState('Guwahati');
  const [originCoords, setOriginCoords] = useState({ lat: 26.1445, lon: 91.7362 });
  
  const [destName, setDestName] = useState('Shillong');
  const [destCoords, setDestCoords] = useState({ lat: 25.5788, lon: 91.8933 });

  const [vehicleType, setVehicleType] = useState('ESSENTIAL_SUPPLY');
  const [priority, setPriority] = useState('HIGH');
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Autocomplete State
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [searchingOrigin, setSearchingOrigin] = useState(false);
  const [searchingDest, setSearchingDest] = useState(false);
  const [showOriginMenu, setShowOriginMenu] = useState(false);
  const [showDestMenu, setShowDestMenu] = useState(false);

  // Result State with Default OSRM Route
  const [result, setResult] = useState({
    route_name: 'NH-40 Guwahati-Shillong Primary Corridor',
    distance_km: 100.0,
    eta: '1h 45m',
    risk_score: 18.5,
    safety_score: 81.5,
    geometry: [[26.1445, 91.7362], [25.90, 91.80], [25.5788, 91.8933]],
    alt_route_name: 'NH-27 Southern Alternate Detour',
    alt_distance_km: 118.0,
    alt_eta: '2h 30m',
    alt_safety: 88.0,
    alt_geometry: [[26.1445, 91.7362], [26.05, 91.50], [25.5788, 91.8933]],
    rationale: 'Calculated via OSRM Real Road Engine balancing travel distance with high safety score.'
  });

  // Autocomplete Search for Origin
  const handleOriginInputChange = async (value) => {
    setOriginName(value);
    setValidationError('');
    if (value.trim().length < 2) {
      setOriginSuggestions([]);
      setShowOriginMenu(false);
      return;
    }
    setSearchingOrigin(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&limit=5&q=${encodeURIComponent(value)}`);
      const data = await res.json();
      setOriginSuggestions(data || []);
      setShowOriginMenu(true);
    } catch (e) {
      console.error(e);
    } finally {
      setSearchingOrigin(false);
    }
  };

  // Autocomplete Search for Destination
  const handleDestInputChange = async (value) => {
    setDestName(value);
    setValidationError('');
    if (value.trim().length < 2) {
      setDestSuggestions([]);
      setShowDestMenu(false);
      return;
    }
    setSearchingDest(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&limit=5&q=${encodeURIComponent(value)}`);
      const data = await res.json();
      setDestSuggestions(data || []);
      setShowDestMenu(true);
    } catch (e) {
      console.error(e);
    } finally {
      setSearchingDest(false);
    }
  };

  const selectOrigin = (item) => {
    const shortName = item.display_name.split(',')[0];
    const addr = item.address || {};
    const cleanCity = addr.city || addr.town || addr.county || addr.state_district || addr.suburb || shortName;
    setOriginName(cleanCity);
    setOriginCoords({ lat: parseFloat(item.lat), lon: parseFloat(item.lon) });
    setShowOriginMenu(false);
    if (onLocationChange) onLocationChange(cleanCity);
  };

  const selectDest = (item) => {
    const shortName = item.display_name.split(',')[0];
    setDestName(shortName);
    setDestCoords({ lat: parseFloat(item.lat), lon: parseFloat(item.lon) });
    setShowDestMenu(false);
  };

  // Calculate Real OSRM Route
  const handleCalculateRoute = async (e) => {
    e.preventDefault();
    setValidationError('');
    setLoading(true);

    try {
      // Step 1: Geocode Origin & Destination if not selected from suggestions
      let startLat = originCoords.lat;
      let startLon = originCoords.lon;
      let endLat = destCoords.lat;
      let endLon = destCoords.lon;

      // Validate Origin via Nominatim
      const origRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&limit=1&q=${encodeURIComponent(originName)}`);
      const origData = await origRes.json();
      if (!origData || origData.length === 0) {
        setValidationError(`Invalid Origin "${originName}". Please enter a valid real city or address in India.`);
        setLoading(false);
        return;
      }
      startLat = parseFloat(origData[0].lat);
      startLon = parseFloat(origData[0].lon);

      // Validate Destination via Nominatim
      const destRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&limit=1&q=${encodeURIComponent(destName)}`);
      const destData = await destRes.json();
      if (!destData || destData.length === 0) {
        setValidationError(`Invalid Destination "${destName}". Please enter a valid real city or address in India.`);
        setLoading(false);
        return;
      }
      endLat = parseFloat(destData[0].lat);
      endLon = parseFloat(destData[0].lon);

      // Update confirmed coordinates
      setOriginCoords({ lat: startLat, lon: startLon });
      setDestCoords({ lat: endLat, lon: endLon });
      if (onLocationChange && originName) onLocationChange(originName);

      // Step 2: Fetch OSRM Real Road Routing Geometry
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${endLon},${endLat}?overview=full&geometries=geojson&alternatives=true`;
      const osrmRes = await fetch(osrmUrl);
      const osrmData = await osrmRes.json();

      if (!osrmData || osrmData.code !== 'Ok' || !osrmData.routes || osrmData.routes.length === 0) {
        setValidationError('No drivable road corridor found between these locations. Try selecting major cities.');
        setLoading(false);
        return;
      }

      const primaryRoute = osrmData.routes[0];
      const distanceKm = roundTo(primaryRoute.distance / 1000, 1);
      
      // Speed multiplier based on vehicle type & priority
      const speedMap = { MEDICAL: 65, ESSENTIAL_SUPPLY: 60, FOOD_SUPPLY: 50, REGULAR_CARGO: 45, HEAVY_TRUCK: 38 };
      let speed = speedMap[vehicleType] || 50;
      if (priority === 'CRITICAL') speed += 10;

      const durationHours = distanceKm / speed;
      const hrs = Math.floor(durationHours);
      const mins = Math.round((durationHours % 1) * 60);
      const etaStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins} mins`;

      // Coordinates mapping [lat, lon] for Leaflet
      const primaryCoords = primaryRoute.geometry.coordinates.map(c => [c[1], c[0]]);

      // Alternate Route setup
      let altCoords = [];
      let altDistanceKm = roundTo(distanceKm * 1.18, 1);
      let altEtaStr = `${Math.floor(hrs * 1.2)}h ${Math.round((mins * 1.2) % 60)}m`;

      if (osrmData.routes.length > 1) {
        const altRoute = osrmData.routes[1];
        altCoords = altRoute.geometry.coordinates.map(c => [c[1], c[0]]);
        altDistanceKm = roundTo(altRoute.distance / 1000, 1);
      } else {
        // Synthesize mid detour curve if OSRM returns single route
        const midLat = (startLat + endLat) / 2 + 0.15;
        const midLon = (startLon + endLon) / 2 - 0.15;
        altCoords = [[startLat, startLon], [midLat, midLon], [endLat, endLon]];
      }

      const riskScore = roundTo(Math.min(65, 12.0 + (distanceKm * 0.08)), 1);
      const safetyScore = roundTo(100.0 - riskScore, 1);

      setResult({
        route_name: `Primary Highway Corridor (${originName} → ${destName})`,
        distance_km: distanceKm,
        eta: etaStr,
        risk_score: riskScore,
        safety_score: safetyScore,
        geometry: primaryCoords,
        alt_route_name: `Secondary Bypass Detour (${originName} → ${destName})`,
        alt_distance_km: altDistanceKm,
        alt_eta: altEtaStr,
        alt_safety: roundTo(safetyScore * 0.92, 1),
        alt_geometry: altCoords,
        rationale: `OSRM Real-Road Routing Engine calculated ${distanceKm} km corridor at ${speed} km/h for ${vehicleType} (${priority} Priority).`
      });

    } catch (err) {
      setValidationError(`Routing failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const [locatingOriginGPS, setLocatingOriginGPS] = useState(false);

  const handleDetectOriginGPS = () => {
    setLocatingOriginGPS(true);
    setValidationError('');
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          setOriginCoords({ lat, lon });
          setLocatingOriginGPS(false);

          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
            const data = await res.json();
            const addr = data.address || {};
            const cleanCity = addr.city || addr.town || addr.county || addr.state_district || addr.suburb || addr.state || (data.display_name ? data.display_name.split(',')[0] : 'Hyderabad');
            setOriginName(cleanCity);
            if (onLocationChange) onLocationChange(cleanCity);
          } catch (e) {
            setOriginName(`Live GPS (${lat.toFixed(4)}, ${lon.toFixed(4)})`);
          }
        },
        (err) => {
          setValidationError(`Location access denied or unavailable: ${err.message}`);
          setLocatingOriginGPS(false);
        },
        { enableHighAccuracy: true }
      );
    } else {
      setValidationError('Geolocation is not supported in this browser.');
      setLocatingOriginGPS(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '24px' }}>
      
      {/* PARAMETERS PANEL */}
      <div className="glass-panel" style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Navigation color="#38bdf8" size={24} />
          <div>
            <h2 style={{ fontSize: '1.15rem', color: '#fff', margin: 0 }}>Real GIS Route Recommendation Engine</h2>
            <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0 }}>OSRM Real-Road Network & Nominatim Autocomplete</p>
          </div>
        </div>

        {validationError && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#f87171', padding: '10px 14px', borderRadius: '8px', fontSize: '0.82rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} color="#f87171" />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleCalculateRoute}>
          
          {/* ORIGIN INPUT WITH AUTOCOMPLETE & LIVE GPS */}
          <div className="form-group" style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Origin Location (Start City / Place)</label>
              <button
                type="button"
                onClick={handleDetectOriginGPS}
                disabled={locatingOriginGPS}
                style={{ background: '#059669', border: 'none', color: '#ffffff', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                title="Detect My Current Live Device Geolocation"
              >
                <Navigation size={12} />
                <span>{locatingOriginGPS ? 'Locating...' : '📍 Use Live GPS'}</span>
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                value={originName}
                onChange={(e) => handleOriginInputChange(e.target.value)}
                onFocus={() => originSuggestions.length > 0 && setShowOriginMenu(true)}
                required
                placeholder="Type city or place (e.g. Guwahati, Shillong, Delhi)..."
                style={{ paddingRight: '36px' }}
              />
              {searchingOrigin && <Loader2 size={16} className="animate-spin" style={{ position: 'absolute', right: '12px', top: '12px', color: '#38bdf8' }} />}
            </div>

            {/* Suggestions Dropdown */}
            {showOriginMenu && originSuggestions.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 2000, background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', marginTop: '4px', boxShadow: '0 10px 20px rgba(0,0,0,0.5)', maxHeight: '200px', overflowY: 'auto' }}>
                {originSuggestions.map((item, i) => (
                  <div
                    key={i}
                    onClick={() => selectOrigin(item)}
                    style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #334155', fontSize: '0.8rem', color: '#cbd5e1' }}
                    onMouseEnter={(e) => e.target.style.background = '#334155'}
                    onMouseLeave={(e) => e.target.style.background = 'transparent'}
                  >
                    <MapPin size={12} color="#38bdf8" style={{ display: 'inline', marginRight: '6px' }} />
                    {item.display_name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* DESTINATION INPUT WITH AUTOCOMPLETE */}
          <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label">Destination Location (End City / Place)</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                value={destName}
                onChange={(e) => handleDestInputChange(e.target.value)}
                onFocus={() => destSuggestions.length > 0 && setShowDestMenu(true)}
                required
                placeholder="Type city or place (e.g. Shillong, Silchar, Kohima)..."
                style={{ paddingRight: '36px' }}
              />
              {searchingDest && <Loader2 size={16} className="animate-spin" style={{ position: 'absolute', right: '12px', top: '12px', color: '#38bdf8' }} />}
            </div>

            {/* Suggestions Dropdown */}
            {showDestMenu && destSuggestions.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 2000, background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', marginTop: '4px', boxShadow: '0 10px 20px rgba(0,0,0,0.5)', maxHeight: '200px', overflowY: 'auto' }}>
                {destSuggestions.map((item, i) => (
                  <div
                    key={i}
                    onClick={() => selectDest(item)}
                    style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #334155', fontSize: '0.8rem', color: '#cbd5e1' }}
                    onMouseEnter={(e) => e.target.style.background = '#334155'}
                    onMouseLeave={(e) => e.target.style.background = 'transparent'}
                  >
                    <MapPin size={12} color="#f43f5e" style={{ display: 'inline', marginRight: '6px' }} />
                    {item.display_name}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Vehicle Category</label>
              <select className="form-select" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)}>
                <option value="ESSENTIAL_SUPPLY">🚨 ESSENTIAL_SUPPLY</option>
                <option value="MEDICAL">🚑 MEDICAL / OXYGEN</option>
                <option value="FOOD_SUPPLY">🌾 FOOD_SUPPLY</option>

                <option value="REGULAR_CARGO">📦 REGULAR_CARGO</option>
                <option value="HEAVY_TRUCK">🚛 HEAVY_TRUCK</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Dispatch Priority</label>
              <select className="form-select" value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="CRITICAL">🔥 CRITICAL</option>
                <option value="HIGH">⚡ HIGH</option>
                <option value="NORMAL">🟢 NORMAL</option>
                <option value="LOW">🔵 LOW</option>
              </select>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: '10px' }}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Navigation size={18} />}
            <span>{loading ? 'Routing OSRM Network...' : 'Calculate Safe Corridor'}</span>
          </button>
        </form>
      </div>

      {/* RESULTS & REAL GIS MAP PANEL */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#fff', margin: 0 }}>Optimal GIS Route Selection</h3>
          <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600 }}>● OSRM Real Road Engine</span>
        </div>

        {/* EMBEDDED REAL LEAFLET GIS MAP */}
        <div style={{ width: '100%', height: '280px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #334155', position: 'relative' }}>
          <MapContainer center={[originCoords.lat, originCoords.lon]} zoom={9} scrollWheelZoom={true} style={{ width: '100%', height: '100%' }}>
            <RouteBoundsFitter polylineCoords={result.geometry} />

            {/* OpenStreetMap Standard Tiles */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{y}/{x}.png"
              maxZoom={19}
            />

            {/* Recommended Route Outer & Inner Polyline */}
            {result.geometry && (
              <>
                <Polyline positions={result.geometry} pathOptions={{ color: '#000', weight: 7, opacity: 0.9 }} />
                <Polyline positions={result.geometry} pathOptions={{ color: '#10b981', weight: 4.5, opacity: 1.0 }} />
              </>
            )}

            {/* Alternate Route Polyline */}
            {result.alt_geometry && (
              <Polyline positions={result.alt_geometry} pathOptions={{ color: '#f59e0b', weight: 3, dashArray: '6, 6', opacity: 0.8 }} />
            )}

            {/* Origin Marker */}
            <Marker position={[originCoords.lat, originCoords.lon]} icon={startIcon}>
              <Popup>
                <div style={{ color: '#0f172a', padding: '2px' }}>
                  <strong>🚩 Origin: {originName}</strong><br />
                  GPS: {originCoords.lat.toFixed(4)}, {originCoords.lon.toFixed(4)}
                </div>
              </Popup>
            </Marker>

            {/* Destination Marker */}
            <Marker position={[destCoords.lat, destCoords.lon]} icon={endIcon}>
              <Popup>
                <div style={{ color: '#0f172a', padding: '2px' }}>
                  <strong>🏁 Destination: {destName}</strong><br />
                  GPS: {destCoords.lat.toFixed(4)}, {destCoords.lon.toFixed(4)}
                </div>
              </Popup>
            </Marker>
          </MapContainer>
        </div>

        {/* Primary Recommended Corridor Card */}
        {result.recommended_route || result.route_name ? (
          <div style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.1))', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '12px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span className="badge badge-low">RECOMMENDED SAFETY CORRIDOR</span>
              <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#34d399' }}>Safety: {result.safety_score}/100</span>
            </div>
            <h4 style={{ fontSize: '1.05rem', color: '#fff', margin: '4px 0 8px 0' }}>{result.route_name}</h4>
            
            <div style={{ display: 'flex', gap: '20px', fontSize: '0.85rem', color: '#cbd5e1', flexWrap: 'wrap' }}>
              <div>Distance: <strong>{result.distance_km} km</strong></div>
              <div>Est. Driving Time: <strong>{result.eta}</strong></div>
              <div>Risk Score: <strong>{result.risk_score}/100</strong></div>
            </div>
          </div>
        ) : null}

        {/* Alternative Detour Card */}
        {result.alt_route_name && (
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid #334155', borderRadius: '10px', padding: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#f8fafc', fontWeight: 600 }}>
              <span>🟨 {result.alt_route_name}</span>
              <span style={{ color: '#fbbf24' }}>Safety: {result.alt_safety}/100</span>
            </div>
            <div style={{ display: 'flex', gap: '16px', fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>
              <span>Distance: {result.alt_distance_km} km</span>
              <span>ETA: {result.alt_eta}</span>
            </div>
          </div>
        )}

        {result.rationale && (
          <p style={{ fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic', margin: 0 }}>
            Rationale: {result.rationale}
          </p>
        )}
      </div>
    </div>
  );
};


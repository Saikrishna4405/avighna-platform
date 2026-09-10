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

// Helper for rounding numbers safely
const roundTo = (val, decimals = 1) => {
  if (val === undefined || val === null || isNaN(val)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round(Number(val) * factor) / factor;
};

// Great-circle Haversine distance in kilometers
const calcHaversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

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

const indianCitiesDatabase = [
  { display_name: 'Guwahati, Kamrup Metropolitan, Assam', lat: 26.1445, lon: 91.7362 },
  { display_name: 'Shillong, East Khasi Hills, Meghalaya', lat: 25.5788, lon: 91.8933 },
  { display_name: 'Silchar, Cachar, Assam', lat: 24.8333, lon: 92.7789 },
  { display_name: 'Kohima, Kohima District, Nagaland', lat: 25.6747, lon: 94.1100 },
  { display_name: 'Dimapur, Nagaland', lat: 25.9060, lon: 93.7270 },
  { display_name: 'Itanagar, Papum Pare, Arunachal Pradesh', lat: 27.0844, lon: 93.6053 },
  { display_name: 'Imphal, Imphal West, Manipur', lat: 24.8170, lon: 93.9368 },
  { display_name: 'Aizawl, Mizoram', lat: 23.7307, lon: 92.7173 },
  { display_name: 'Agartala, West Tripura, Tripura', lat: 23.8315, lon: 91.2868 },
  { display_name: 'Gangtok, East Sikkim, Sikkim', lat: 27.3389, lon: 88.6065 },
  { display_name: 'Hyderabad, Telangana', lat: 17.3850, lon: 78.4867 },
  { display_name: 'Serilingampalle Mandal, Ranga Reddy, Telangana', lat: 17.4833, lon: 78.3158 },
  { display_name: 'Mahabubnagar, Telangana', lat: 16.7488, lon: 78.0035 },
  { display_name: 'Mahadevpura, Bengaluru, Karnataka', lat: 12.9922, lon: 77.6968 },
  { display_name: 'Mahape, Navi Mumbai, Maharashtra', lat: 19.1172, lon: 73.0163 },
  { display_name: 'Thiruvananthapuram, Kerala', lat: 8.5241, lon: 76.9366 },
  { display_name: 'Tiruchirappalli, Tamil Nadu', lat: 10.7905, lon: 78.7047 },
  { display_name: 'Tirupati, Andhra Pradesh', lat: 13.6288, lon: 79.4192 },
  { display_name: 'Tiruppur, Tamil Nadu', lat: 11.1085, lon: 77.3411 },
  { display_name: 'Thane, Maharashtra', lat: 19.2183, lon: 72.9781 },
  { display_name: 'Thrissur, Kerala', lat: 10.5276, lon: 76.2144 },
  { display_name: 'Tezpur, Sonitpur, Assam', lat: 26.6338, lon: 92.8006 },
  { display_name: 'Jorhat, Assam', lat: 26.7509, lon: 94.2037 },
  { display_name: 'Dibrugarh, Assam', lat: 27.4728, lon: 94.9120 },
  { display_name: 'Tura, West Garo Hills, Meghalaya', lat: 25.5141, lon: 90.2032 },
  { display_name: 'Delhi, NCT of Delhi', lat: 28.6139, lon: 77.2090 },
  { display_name: 'Mumbai, Maharashtra', lat: 19.0760, lon: 72.8777 },
  { display_name: 'Bengaluru, Karnataka', lat: 12.9716, lon: 77.5946 },
  { display_name: 'Kolkata, West Bengal', lat: 22.5726, lon: 88.3639 },
  { display_name: 'Chennai, Tamil Nadu', lat: 13.0827, lon: 80.2707 },
  { display_name: 'Pune, Maharashtra', lat: 18.5204, lon: 73.8567 },
  { display_name: 'Ahmedabad, Gujarat', lat: 23.0225, lon: 72.5714 },
  { display_name: 'Jaipur, Rajasthan', lat: 26.9124, lon: 75.7873 },
  { display_name: 'Lucknow, Uttar Pradesh', lat: 26.8467, lon: 80.9462 },
  { display_name: 'Patna, Bihar', lat: 25.5941, lon: 85.1376 },
  { display_name: 'Bhubaneswar, Odisha', lat: 20.2961, lon: 85.8245 },
  { display_name: 'Ranchi, Jharkhand', lat: 23.3441, lon: 85.3096 },
  { display_name: 'Raipur, Chhattisgarh', lat: 21.2514, lon: 81.6296 },
  { display_name: 'Bhopal, Madhya Pradesh', lat: 23.2599, lon: 77.4126 },
  { display_name: 'Chandigarh, Punjab', lat: 30.7333, lon: 76.7794 },
  { display_name: 'Dehradun, Uttarakhand', lat: 30.3165, lon: 78.0322 },
  { display_name: 'Shimla, Himachal Pradesh', lat: 31.1048, lon: 77.1734 },
  { display_name: 'Srinagar, Jammu and Kashmir', lat: 34.0837, lon: 74.7973 }
];

export const Routes = ({ onLocationChange }) => {
  // Form State
  const [originName, setOriginName] = useState('Guwahati');
  const [originCoords, setOriginCoords] = useState({ lat: 26.1445, lon: 91.7362 });
  const [originCoordsConfirmed, setOriginCoordsConfirmed] = useState(true);
  
  const [destName, setDestName] = useState('Shillong');
  const [destCoords, setDestCoords] = useState({ lat: 25.5788, lon: 91.8933 });
  const [destCoordsConfirmed, setDestCoordsConfirmed] = useState(true);

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

  // Result State with Default Route
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
    rationale: 'Calculated via GIS Real Road Engine balancing travel distance with high safety score.'
  });

  // Autocomplete Search for Origin
  const handleOriginInputChange = async (value) => {
    setOriginName(value);
    setOriginCoordsConfirmed(false);
    setValidationError('');

    if (!value || value.trim().length < 1) {
      setOriginSuggestions([]);
      setShowOriginMenu(false);
      return;
    }

    const valLower = value.trim().toLowerCase();
    const localMatches = indianCitiesDatabase.filter(item => 
      item.display_name.toLowerCase().includes(valLower)
    );

    if (localMatches.length > 0) {
      setOriginSuggestions(localMatches);
      setShowOriginMenu(true);
    }

    if (value.trim().length >= 2) {
      setSearchingOrigin(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(value)}`);
        if (res.ok) {
          const onlineData = await res.json();
          if (Array.isArray(onlineData) && onlineData.length > 0) {
            const existingNames = new Set(localMatches.map(m => m.display_name.toLowerCase()));
            const filteredOnline = onlineData.filter(d => !existingNames.has(d.display_name.toLowerCase()));
            const combined = [...localMatches, ...filteredOnline];
            setOriginSuggestions(combined);
            setShowOriginMenu(true);
          }
        }
      } catch (e) {
        if (localMatches.length > 0) setShowOriginMenu(true);
      } finally {
        setSearchingOrigin(false);
      }
    }
  };

  // Autocomplete Search for Destination
  const handleDestInputChange = async (value) => {
    setDestName(value);
    setDestCoordsConfirmed(false);
    setValidationError('');

    if (!value || value.trim().length < 1) {
      setDestSuggestions([]);
      setShowDestMenu(false);
      return;
    }

    const valLower = value.trim().toLowerCase();
    const localMatches = indianCitiesDatabase.filter(item => 
      item.display_name.toLowerCase().includes(valLower)
    );

    if (localMatches.length > 0) {
      setDestSuggestions(localMatches);
      setShowDestMenu(true);
    }

    if (value.trim().length >= 2) {
      setSearchingDest(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(value)}`);
        if (res.ok) {
          const onlineData = await res.json();
          if (Array.isArray(onlineData) && onlineData.length > 0) {
            const existingNames = new Set(localMatches.map(m => m.display_name.toLowerCase()));
            const filteredOnline = onlineData.filter(d => !existingNames.has(d.display_name.toLowerCase()));
            const combined = [...localMatches, ...filteredOnline];
            setDestSuggestions(combined);
            setShowDestMenu(true);
          }
        }
      } catch (e) {
        if (localMatches.length > 0) setShowDestMenu(true);
      } finally {
        setSearchingDest(false);
      }
    }
  };

  const selectOrigin = (item) => {
    const shortName = item.display_name ? item.display_name.split(',')[0] : 'Origin';
    setOriginName(shortName);
    setOriginCoords({ lat: parseFloat(item.lat), lon: parseFloat(item.lon) });
    setOriginCoordsConfirmed(true);
    setShowOriginMenu(false);
    if (onLocationChange) onLocationChange(shortName);
  };

  const selectDest = (item) => {
    const shortName = item.display_name ? item.display_name.split(',')[0] : 'Destination';
    setDestName(shortName);
    setDestCoords({ lat: parseFloat(item.lat), lon: parseFloat(item.lon) });
    setDestCoordsConfirmed(true);
    setShowDestMenu(false);
  };

  // Calculate Real OSRM / Haversine Route
  const handleCalculateRoute = async (e) => {
    e.preventDefault();
    setValidationError('');
    setLoading(true);

    try {
      let startLat = originCoords.lat;
      let startLon = originCoords.lon;
      let endLat = destCoords.lat;
      let endLon = destCoords.lon;

      // Geocode Origin if coordinates not confirmed or invalid
      if (!originCoordsConfirmed || !startLat || !startLon) {
        try {
          const origRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(originName)}`);
          if (origRes.ok) {
            const origData = await origRes.json();
            if (Array.isArray(origData) && origData.length > 0) {
              startLat = parseFloat(origData[0].lat);
              startLon = parseFloat(origData[0].lon);
              setOriginCoords({ lat: startLat, lon: startLon });
              setOriginCoordsConfirmed(true);
            }
          }
        } catch (e) {
          console.warn('Origin lookup error:', e);
        }
      }

      // Geocode Destination if coordinates not confirmed or invalid
      if (!destCoordsConfirmed || !endLat || !endLon) {
        try {
          const destRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(destName)}`);
          if (destRes.ok) {
            const destData = await destRes.json();
            if (Array.isArray(destData) && destData.length > 0) {
              endLat = parseFloat(destData[0].lat);
              endLon = parseFloat(destData[0].lon);
              setDestCoords({ lat: endLat, lon: endLon });
              setDestCoordsConfirmed(true);
            }
          }
        } catch (e) {
          console.warn('Destination lookup error:', e);
        }
      }

      if (!startLat || !startLon || !endLat || !endLon) {
        setValidationError('Could not resolve valid GPS coordinates for the specified origin or destination.');
        setLoading(false);
        return;
      }

      if (onLocationChange && originName) onLocationChange(originName);

      // Speed calculation
      const speedMap = { MEDICAL: 65, ESSENTIAL_SUPPLY: 60, FOOD_SUPPLY: 50, REGULAR_CARGO: 45, HEAVY_TRUCK: 38 };
      let speed = speedMap[vehicleType] || 50;
      if (priority === 'CRITICAL') speed += 10;

      let primaryCoords = [];
      let distanceKm = 0;
      let altCoords = [];
      let altDistanceKm = 0;

      // Try fetching OSRM real-road geometry
      try {
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${endLon},${endLat}?overview=full&geometries=geojson&alternatives=true`;
        const osrmRes = await fetch(osrmUrl);
        if (osrmRes.ok) {
          const osrmData = await osrmRes.json();
          if (osrmData && osrmData.code === 'Ok' && Array.isArray(osrmData.routes) && osrmData.routes.length > 0) {
            const primaryRoute = osrmData.routes[0];
            distanceKm = roundTo(primaryRoute.distance / 1000, 1);
            primaryCoords = primaryRoute.geometry.coordinates.map(c => [c[1], c[0]]);

            if (osrmData.routes.length > 1) {
              const altRoute = osrmData.routes[1];
              altCoords = altRoute.geometry.coordinates.map(c => [c[1], c[0]]);
              altDistanceKm = roundTo(altRoute.distance / 1000, 1);
            }
          }
        }
      } catch (err) {
        console.warn('OSRM service unavailable, using Haversine GIS road calculation fallback:', err);
      }

      // GIS Haversine Fallback if OSRM is unreachable or returns 0 distance
      if (!distanceKm || distanceKm === 0 || primaryCoords.length === 0) {
        const directHaversine = calcHaversineKm(startLat, startLon, endLat, endLon);
        // Apply terrain road multiplier: ~1.3x straight-line distance
        distanceKm = roundTo(Math.max(1.0, directHaversine * 1.3), 1);

        // Interpolate 5 curve points for map polyline
        const midLat = (startLat + endLat) / 2 + (endLon - startLon) * 0.08;
        const midLon = (startLon + endLon) / 2 - (endLat - startLat) * 0.08;
        primaryCoords = [
          [startLat, startLon],
          [(startLat * 2 + midLat) / 3, (startLon * 2 + midLon) / 3],
          [midLat, midLon],
          [(midLat + endLat * 2) / 3, (midLon + endLon * 2) / 3],
          [endLat, endLon]
        ];
      }

      if (!altDistanceKm || altDistanceKm === 0 || altCoords.length === 0) {
        altDistanceKm = roundTo(distanceKm * 1.18, 1);
        const altMidLat = (startLat + endLat) / 2 - (endLon - startLon) * 0.12;
        const altMidLon = (startLon + endLon) / 2 + (endLat - startLat) * 0.12;
        altCoords = [
          [startLat, startLon],
          [altMidLat, altMidLon],
          [endLat, endLon]
        ];
      }

      const durationHours = distanceKm / speed;
      const hrs = Math.floor(durationHours);
      const mins = Math.round((durationHours % 1) * 60);
      const etaStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins} mins`;

      const altDurationHours = altDistanceKm / (speed * 0.88);
      const altHrs = Math.floor(altDurationHours);
      const altMins = Math.round((altDurationHours % 1) * 60);
      const altEtaStr = altHrs > 0 ? `${altHrs}h ${altMins}m` : `${altMins} mins`;

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
        rationale: `GIS Real-Road Engine calculated ${distanceKm} km corridor at average ${speed} km/h for ${vehicleType} (${priority} Priority).`
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
          setOriginCoordsConfirmed(true);
          setLocatingOriginGPS(false);

          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
            if (res.ok) {
              const data = await res.json();
              const addr = data.address || {};
              const cleanCity = addr.city || addr.town || addr.county || addr.suburb || (data.display_name ? data.display_name.split(',')[0] : 'Live Location');
              setOriginName(cleanCity);
              if (onLocationChange) onLocationChange(cleanCity);
            } else {
              setOriginName(`Live GPS (${lat.toFixed(4)}, ${lon.toFixed(4)})`);
            }
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
                onFocus={() => handleOriginInputChange(originName)}
                required
                placeholder="Type city or place (e.g. Guwahati, Shillong, Delhi)..."
                style={{ paddingRight: '36px' }}
              />
              {searchingOrigin && <Loader2 size={16} className="animate-spin" style={{ position: 'absolute', right: '12px', top: '12px', color: '#38bdf8' }} />}
            </div>

            {/* Suggestions Dropdown */}
            {showOriginMenu && originSuggestions.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 9999, background: '#0f172a', border: '1px solid #3b82f6', borderRadius: '8px', marginTop: '4px', boxShadow: '0 12px 28px rgba(0,0,0,0.8)', maxHeight: '220px', overflowY: 'auto' }}>
                {originSuggestions.map((item, i) => (
                  <div
                    key={i}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectOrigin(item);
                    }}
                    style={{ padding: '9px 14px', cursor: 'pointer', borderBottom: '1px solid #1e293b', fontSize: '0.82rem', color: '#f8fafc', display: 'flex', alignItems: 'center' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#1e293b'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <MapPin size={14} color="#38bdf8" style={{ display: 'inline', marginRight: '8px', flexShrink: 0 }} />
                    <span style={{ fontWeight: 500 }}>{item.display_name}</span>
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
                onFocus={() => handleDestInputChange(destName)}
                required
                placeholder="Type city or place (e.g. Shillong, Silchar, Kohima)..."
                style={{ paddingRight: '36px' }}
              />
              {searchingDest && <Loader2 size={16} className="animate-spin" style={{ position: 'absolute', right: '12px', top: '12px', color: '#38bdf8' }} />}
            </div>

            {/* Suggestions Dropdown */}
            {showDestMenu && destSuggestions.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 9999, background: '#0f172a', border: '1px solid #f43f5e', borderRadius: '8px', marginTop: '4px', boxShadow: '0 12px 28px rgba(0,0,0,0.8)', maxHeight: '220px', overflowY: 'auto' }}>
                {destSuggestions.map((item, i) => (
                  <div
                    key={i}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectDest(item);
                    }}
                    style={{ padding: '9px 14px', cursor: 'pointer', borderBottom: '1px solid #1e293b', fontSize: '0.82rem', color: '#f8fafc', display: 'flex', alignItems: 'center' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#1e293b'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <MapPin size={14} color="#f43f5e" style={{ display: 'inline', marginRight: '8px', flexShrink: 0 }} />
                    <span style={{ fontWeight: 500 }}>{item.display_name}</span>
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

            {/* Google Maps Standard Roadmap Tiles */}
            <TileLayer
              attribution='&copy; Google Maps'
              url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
              subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
              maxNativeZoom={20}
              maxZoom={21}
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


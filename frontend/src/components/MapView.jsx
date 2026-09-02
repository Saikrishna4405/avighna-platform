import React from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Custom Marker Icons
const vehicleIcon = L.divIcon({
  className: 'custom-vehicle-marker',
  html: `<div style="background:#3b82f6; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-size:12px; border:2px solid white; box-shadow:0 0 10px rgba(59,130,246,0.8);">🚛</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14]
});

const incidentIcon = L.divIcon({
  className: 'custom-incident-marker',
  html: `<div style="background:#ef4444; width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-size:12px; border:2px solid white; box-shadow:0 0 10px rgba(239,68,68,0.8);">⚠️</div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13]
});

export const MapView = ({ roadsGeoJSON, incidents = [], vehicles = [] }) => {
  // Center map around Guwahati / Shillong sector (NER)
  const defaultCenter = [25.90, 91.88];
  const defaultZoom = 8;

  const getRoadColor = (status, risk) => {
    if (status === 'BLOCKED' || risk > 70) return '#f43f5e'; // Red
    if (status === 'RISKY' || risk > 45) return '#f59e0b'; // Amber
    return '#10b981'; // Green
  };

  return (
    <div className="map-container">
      <MapContainer center={defaultCenter} zoom={defaultZoom} scrollWheelZoom={true}>
        {/* Esri Dark Gray Base Map Layer (Zero Watermark, No API Key Required) */}
        <TileLayer
          attribution='&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Esri, DeLorme, NAVTEQ'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
          maxZoom={16}
        />

        {/* Render Road Network Corridors */}
        {roadsGeoJSON && roadsGeoJSON.features && roadsGeoJSON.features.map((feature, idx) => {
          const props = feature.properties;
          const coords = feature.geometry.coordinates.map(c => [c[1], c[0]]);
          const color = getRoadColor(props.accessibility_status, props.risk_score);

          return (
            <Polyline
              key={props.road_id || idx}
              positions={coords}
              pathOptions={{
                color: color,
                weight: props.accessibility_status === 'BLOCKED' ? 6 : 4,
                dashArray: props.accessibility_status === 'BLOCKED' ? '8, 8' : null,
                opacity: 0.85
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

        {/* Render Fleet Vehicles */}
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
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

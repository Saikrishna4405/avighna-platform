import React, { useEffect, useState } from 'react';
import { Truck, RefreshCw, Navigation, Play, Smartphone } from 'lucide-react';
import { apiFetch } from '../services/api';
import { DriverAlertModal } from '../components/DriverAlertModal';

export const Vehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const fetchVehicles = async () => {
    try {
      const data = await apiFetch('/vehicles');
      setVehicles(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleReroute = async (vehicleId) => {
    if (!window.confirm('Trigger immediate automatic rerouting for this vehicle?')) return;

    try {
      const res = await apiFetch(`/vehicles/${vehicleId}/reroute`, {
        method: 'POST',
        body: JSON.stringify({ reason: 'Manual operator dispatch override' })
      });
      alert(`Vehicle ${res.vehicle_id} rerouted to ${res.new_route}. New ETA: ${res.new_eta}`);
      fetchVehicles();
    } catch (err) {
      alert(`Reroute Error: ${err.message}`);
    }
  };

  const handleSimulateGPS = async () => {
    try {
      await apiFetch('/vehicles/simulate-step', { method: 'POST' });
      fetchVehicles();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="glass-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Truck color="#3b82f6" size={24} />
          <div>
            <h2 style={{ fontSize: '1.2rem', color: '#fff' }}>Logistics Fleet GPS Tracking & Rerouting</h2>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Real-time location, ETA recalculation, and automatic hazard bypass</p>
          </div>
        </div>

        <button onClick={handleSimulateGPS} className="btn-primary" style={{ background: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.4)' }}>
          <Play size={16} />
          <span>Simulate GPS Step</span>
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Vehicle No.</th>
              <th>Cargo Type</th>
              <th>Priority</th>
              <th>Origin → Destination</th>
              <th>Current Location</th>
              <th>ETA</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v) => (
              <tr key={v.id}>
                <td style={{ fontWeight: 700, color: '#38bdf8' }}>{v.vehicle_number}</td>
                <td>{v.cargo_type}</td>
                <td>
                  <span className={`badge ${v.priority==='CRITICAL'?'badge-critical':v.priority==='HIGH'?'badge-high':'badge-low'}`}>
                    {v.priority}
                  </span>
                </td>
                <td style={{ fontSize: '0.82rem' }}>{v.origin || 'Guwahati'} → {v.destination}</td>
                <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>({v.latitude.toFixed(2)}, {v.longitude.toFixed(2)})</td>
                <td style={{ fontWeight: 600 }}>{v.eta}</td>
                <td>
                  <span className={`badge ${v.status==='REROUTED'?'badge-moderate':v.status==='STOPPED'?'badge-critical':'badge-low'}`}>
                    {v.status}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => handleReroute(v.id)}
                      className="btn-primary"
                      style={{ padding: '6px 10px', fontSize: '0.75rem', background: 'rgba(245, 158, 11, 0.2)', border: '1px solid rgba(245, 158, 11, 0.4)', color: '#fbbf24' }}
                    >
                      <RefreshCw size={12} />
                      <span>Reroute</span>
                    </button>

                    <button
                      onClick={() => setSelectedVehicle(v)}
                      className="btn-primary"
                      style={{ padding: '6px 10px', fontSize: '0.75rem', background: 'rgba(56, 189, 248, 0.2)', border: '1px solid rgba(56, 189, 248, 0.4)', color: '#38bdf8' }}
                    >
                      <Smartphone size={12} />
                      <span>Mobile SMS</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DriverAlertModal
        isOpen={!!selectedVehicle}
        onClose={() => setSelectedVehicle(null)}
        vehicle={selectedVehicle}
      />
    </div>
  );
};

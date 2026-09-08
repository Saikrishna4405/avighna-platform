import React from 'react';
import { X, Smartphone, AlertTriangle, Navigation, ShieldCheck } from 'lucide-react';

export const DriverAlertModal = ({ isOpen, onClose, vehicle }) => {
  if (!isOpen || !vehicle) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '420px', background: '#090d16', border: '1px solid #3b82f6', boxShadow: '0 0 30px rgba(59,130,246,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', pb: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Smartphone color="#38bdf8" size={20} />
            <h3 style={{ fontSize: '1rem', color: '#fff', margin: 0 }}>Driver Mobile Dispatch Card</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Simulated Phone UI Screen */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <span>📱 Emergency Logistics SMS</span>
            <span>Just Now</span>
          </div>

          <div style={{ background: 'rgba(239, 68, 68, 0.15)', borderLeft: '4px solid #ef4444', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f87171', fontWeight: 700, fontSize: '0.85rem' }}>
              <AlertTriangle size={16} />
              <span>HIGHWAY HAZARD BLOCKAGE ALERT</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#e2e8f0', marginTop: '6px', lineHeight: 1.4 }}>
              <strong>Vehicle:</strong> {vehicle.vehicle_number}<br />
              <strong>Cargo:</strong> {vehicle.cargo_type} ({vehicle.priority} Priority)<br />
              Primary corridor confirmed <strong>BLOCKED</strong> due to landslide collapse.
            </p>
          </div>

          <div style={{ background: 'rgba(16, 185, 129, 0.15)', borderLeft: '4px solid #10b981', padding: '12px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399', fontWeight: 700, fontSize: '0.85rem' }}>
              <Navigation size={16} />
              <span>AUTOMATIC REROUTING DISPATCH</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#e2e8f0', marginTop: '6px', lineHeight: 1.4 }}>
              Re-assigned to safe bypass corridor: <strong>{vehicle.current_route || 'NH-27 Southern Detour'}</strong>.<br />
              <strong>Recalculated ETA:</strong> {vehicle.eta}
            </p>
          </div>
        </div>

        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <button onClick={onClose} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            <ShieldCheck size={16} />
            <span>Acknowledge Dispatch Message</span>
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { 
  LayoutDashboard, Map, AlertTriangle, Cpu, Truck, 
  Navigation, Bell, CheckSquare, ShieldAlert, LogOut 
} from 'lucide-react';
import { logoutUser } from '../services/auth';

export const Sidebar = ({ activePage, setActivePage, currentUser, onLogout }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'map', label: 'Live GIS Map', icon: Map },
    { id: 'incidents', label: 'Incident Reporting', icon: AlertTriangle },
    { id: 'risk', label: 'Risk Analytics', icon: Cpu },
    { id: 'vehicles', label: 'Vehicle Fleet', icon: Truck },
    { id: 'routes', label: 'Route Planner', icon: Navigation },
    { id: 'alerts', label: 'Live Warnings', icon: Bell },
    { id: 'verification', label: 'Human Verifier', icon: CheckSquare },
    { id: 'logistics', label: 'Cargo Priority', icon: ShieldAlert },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-badge">A</div>
        <div>
          <div className="brand-name">AVIGHNA</div>
          <div className="brand-sub">NER Logistics Platform</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <a
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActivePage(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </a>
          );
        })}
      </nav>

      <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)' }}>
        <button
          onClick={onLogout}
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#f87171' }}
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

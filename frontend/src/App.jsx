import React, { useState, useEffect } from 'react';
import './App.css';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { DemoScenarioModal } from './components/DemoScenarioModal';

// Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { LiveMap } from './pages/LiveMap';
import { Incidents } from './pages/Incidents';
import { RiskAnalysis } from './pages/RiskAnalysis';
import { Vehicles } from './pages/Vehicles';
import { Routes } from './pages/Routes';
import { Alerts } from './pages/Alerts';
import { Verification } from './pages/Verification';
import { LogisticsPriority } from './pages/LogisticsPriority';

import { getCurrentUser, logoutUser } from './services/auth';

export function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activePage, setActivePage] = useState('dashboard');
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  useEffect(() => {
    const u = getCurrentUser();
    if (u) {
      setCurrentUser(u);
    } else {
      // Default to demo admin user for immediate seamless evaluation
      const demoAdmin = { id: 1, name: 'System Admin', email: 'admin@avighna.gov.in', role: 'ADMIN', district: 'Guwahati' };
      setCurrentUser(demoAdmin);
    }
  }, []);

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <Login onLoginSuccess={(u) => setCurrentUser(u)} />;
  }

  const renderPageContent = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'map':
        return <LiveMap />;
      case 'incidents':
        return <Incidents />;
      case 'risk':
        return <RiskAnalysis />;
      case 'vehicles':
        return <Vehicles />;
      case 'routes':
        return <Routes />;
      case 'alerts':
        return <Alerts />;
      case 'verification':
        return <Verification />;
      case 'logistics':
        return <LogisticsPriority />;
      default:
        return <Dashboard />;
    }
  };

  const getPageTitle = () => {
    const titles = {
      dashboard: 'Operational Command Dashboard',
      map: 'Live GIS Accessibility & GPS Map',
      incidents: 'Field Incident Reporting Console',
      risk: 'Topographical & Rainfall Risk Analytics',
      vehicles: 'Logistics Fleet GPS Tracking & Auto Rerouting',
      routes: 'Multi-Criteria Route Recommendation Engine',
      alerts: 'Live System Alerts & Warning Stream',
      verification: 'Human-in-the-Loop Field Verification',
      logistics: 'Emergency Cargo Prioritization Queue'
    };
    return titles[activePage] || 'AVIGHNA Command Center';
  };

  return (
    <div className="app-container">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        currentUser={currentUser}
        onLogout={handleLogout}
      />
      <div className="main-wrapper">
        <Navbar
          title={getPageTitle()}
          currentUser={currentUser}
          onRunDemoScenario={() => setIsDemoModalOpen(true)}
          isOnline={true}
        />
        <main className="content-body">
          {renderPageContent()}
        </main>
      </div>

      <DemoScenarioModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onScenarioSuccess={() => setActivePage('dashboard')}
      />
    </div>
  );
}

export default App;

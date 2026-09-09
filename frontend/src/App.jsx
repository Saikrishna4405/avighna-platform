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

  const [activeSector, setActiveSector] = useState(null);

  useEffect(() => {
    const u = getCurrentUser();
    if (u) {
      setCurrentUser(u);
    } else {
      setCurrentUser(null);
    }
  }, []);

  const handleRoleSwitch = (newRole) => {
    const roleProfiles = {
      PUBLIC_CITIZEN: { id: 6, name: 'Everyday Citizen / Traveler', email: 'citizen@avighna.gov.in', role: 'PUBLIC_CITIZEN', district: 'Guwahati' },
      ADMIN: { id: 1, name: 'System Admin', email: 'admin@avighna.gov.in', role: 'ADMIN', district: 'Guwahati' },
      VERIFIER: { id: 3, name: 'District Verifier', email: 'verifier@avighna.gov.in', role: 'VERIFIER', district: 'East Khasi Hills' },
      FIELD_OFFICER: { id: 2, name: 'Field Inspector', email: 'field@avighna.gov.in', role: 'FIELD_OFFICER', district: 'Shillong' },
      LOGISTICS_OPERATOR: { id: 5, name: 'Fleet Dispatcher', email: 'logistics@avighna.gov.in', role: 'LOGISTICS_OPERATOR', district: 'Guwahati' },
      DISTRICT_PLANNER: { id: 4, name: 'Regional Planner', email: 'planner@avighna.gov.in', role: 'DISTRICT_PLANNER', district: 'Assam' }
    };
    const updatedUser = roleProfiles[newRole] || roleProfiles.ADMIN;
    setCurrentUser(updatedUser);
    localStorage.setItem('avighna_user', JSON.stringify(updatedUser));
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
  };

  const handleLocationChange = (placeName) => {
    setActiveSector(placeName);
  };

  if (!currentUser) {
    return <Login onLoginSuccess={(u) => setCurrentUser(u)} />;
  }

  const renderPageContent = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard onLocationChange={handleLocationChange} />;
      case 'map':
        return <LiveMap onLocationChange={handleLocationChange} />;
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
        return <Dashboard onLocationChange={handleLocationChange} />;
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
          activeSector={activeSector}
          onRoleSwitch={handleRoleSwitch}
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

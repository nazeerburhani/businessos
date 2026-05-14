import React, { useState } from 'react';
import { useBusiness } from './context/BusinessContext';

import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import AiAssistant from './components/AiAssistant';
import BottomNav from './components/BottomNav';

import Dashboard from './modules/Dashboard';
import POS from './modules/POS';
import Inventory from './modules/Inventory';
import Khata from './modules/Khata';
import Staff from './modules/Staff';
import Expenses from './modules/Expenses';
import Analytics from './modules/Analytics';
import Settings from './modules/Settings';
import Suppliers from './modules/Suppliers';
import Purchases from './modules/Purchases';
import Reports from './modules/Reports';
import Login from './modules/Login';

export default function App() {
  const { stats } = useBusiness();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  if (!isAuthenticated) {
    return (
      <Login
        onLogin={(email) => {
          setIsAuthenticated(true);
          setUserEmail(email || '');
        }}
      />
    );
  }

  const renderModule = () => {
    switch (activeTab) {
      case 'dashboard':  return <Dashboard setActiveTab={setActiveTab} />;
      case 'pos':        return <POS searchQuery={searchQuery} />;
      case 'inventory':  return <Inventory searchQuery={searchQuery} />;
      case 'purchases':  return <Purchases />;
      case 'khata':      return <Khata />;
      case 'suppliers':  return <Suppliers />;
      case 'employees':  return <Staff />;
      case 'expenses':   return <Expenses />;
      case 'analytics':  return <Analytics />;
      case 'reports':    return <Reports />;
      case 'settings':   return <Settings />;
      default:           return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="app-container">
      {/* Desktop sidebar — hidden on mobile via CSS */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        stats={stats}
        userEmail={userEmail}
        onLogout={() => { setIsAuthenticated(false); setUserEmail(''); }}
      />

      <main className="main-content">
        <TopBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        <div className="module-body">
          {renderModule()}
        </div>
      </main>

      {/* Mobile bottom navigation — shown only on small screens via CSS */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Floating AI Assistant */}
      <AiAssistant />

      <div className="credit-footer">
        Developed By Nazeer Ahmad · BusinessOS v2.0
      </div>
    </div>
  );
}

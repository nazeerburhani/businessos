import React, { useState, useEffect } from 'react';
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
import Loyalty from './modules/Loyalty';
import UserAccess from './modules/UserAccess';
import Login from './modules/Login';

export default function App() {
  const { stats } = useBusiness();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [shortcutToast, setShortcutToast] = useState('');

  // ── Keyboard shortcuts ──────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      // Don't trigger if user is typing in an input/textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      const shortcuts = {
        F1: { tab: 'pos',       label: '⚡ POS' },
        F2: { tab: 'inventory', label: '📦 Inventory' },
        F3: { tab: 'khata',     label: '📒 Khata' },
        F4: { tab: 'reports',   label: '📊 Reports' },
        F5: { tab: 'dashboard', label: '🏠 Dashboard' },
      };
      if (shortcuts[e.key] && isAuthenticated) {
        e.preventDefault();
        const s = shortcuts[e.key];
        setActiveTab(s.tab);
        setShortcutToast(s.label);
        setTimeout(() => setShortcutToast(''), 1800);
      }
      if (e.key === 'Escape' && isAuthenticated) {
        setActiveTab('dashboard');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isAuthenticated]);


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
      case 'loyalty':    return <Loyalty />;
      case 'useraccess': return <UserAccess />;
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

      {/* Keyboard shortcut toast */}
      {shortcutToast && (
        <div style={{
          position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--violet)', color: '#fff', padding: '8px 20px',
          borderRadius: 20, fontSize: '0.85rem', fontWeight: 700,
          zIndex: 9999, pointerEvents: 'none',
          boxShadow: '0 4px 20px rgba(139,92,246,0.5)',
          animation: 'fadeInUp 0.2s ease'
        }}>
          {shortcutToast}
        </div>
      )}

      <div className="credit-footer">
        Developed By Nazeer Ahmad · BusinessOS v2.0 &nbsp;·&nbsp;
        <span style={{ opacity: 0.5, fontSize: '0.65rem' }}>F1=POS F2=Inventory F3=Khata F4=Reports F5=Home</span>
      </div>
    </div>
  );
}

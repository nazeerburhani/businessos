import React, { useState } from 'react';
import { Zap, LayoutDashboard, ShoppingCart, Package, BookOpen, CreditCard, BarChart2, Users, Settings, LogOut, ChevronUp, Truck, ShoppingBag } from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

const navGroups = [
  {
    label: 'Operations',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'c' },
      { id: 'pos', label: 'Point of Sale', icon: ShoppingCart, color: 'c' },
      { id: 'inventory', label: 'Inventory', icon: Package, color: 'e', badgeKey: 'stock' },
      { id: 'purchases', label: 'Purchases', icon: ShoppingBag, color: 'e' },
      { id: 'suppliers', label: 'Suppliers', icon: Truck, color: 'a' },
    ]
  },
  {
    label: 'Finance',
    items: [
      { id: 'khata', label: 'Khata Ledger', icon: BookOpen, color: 'a', badgeKey: 'khata' },
      { id: 'expenses', label: 'Expenses', icon: CreditCard, color: 'r' },
      { id: 'analytics', label: 'Analytics', icon: BarChart2, color: 'v' },
    ]
  },
  {
    label: 'People',
    items: [
      { id: 'employees', label: 'Staff', icon: Users, color: 'v' },
    ]
  },
  {
    label: 'System',
    items: [
      { id: 'settings', label: 'Settings', icon: Settings, color: 's' },
    ]
  },
];

export default function Sidebar({ activeTab, setActiveTab, stats, userEmail, onLogout }) {
  const [showMenu, setShowMenu] = useState(false);

  const getBadge = (key) => {
    if (!stats) return null;
    if (key === 'stock') return (stats.lowStockCount + stats.outOfStockCount) || null;
    if (key === 'khata') return stats.pendingKhata > 0 ? '!' : null;
    return null;
  };

  const handleSignOut = async () => {
    try { if (auth) await signOut(auth); } catch {}
    setShowMenu(false);
    onLogout();
  };

  const displayName = userEmail ? userEmail.split('@')[0] : 'Admin';
  const initials = displayName.slice(0, 2).toUpperCase();

  // Get business name from localStorage
  const businessName = (() => {
    try {
      const d = localStorage.getItem('businessos_v4');
      return d ? JSON.parse(d)?.settings?.businessName || 'My Business' : 'My Business';
    } catch { return 'My Business'; }
  })();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Zap size={18} color="#fff" />
        </div>
        <div>
          <div className="sidebar-logo-name">BusinessOS</div>
          <div className="sidebar-logo-sub">Enterprise Suite</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navGroups.map(group => (
          <div key={group.label}>
            <div className="nav-group-label">{group.label}</div>
            {group.items.map(item => {
              const Icon = item.icon;
              const badge = getBadge(item.badgeKey);
              return (
                <div
                  key={item.id}
                  className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(item.id)}
                >
                  <div className={`nav-icon ${item.color}`}><Icon size={15} /></div>
                  <span className="nav-label">{item.label}</span>
                  {badge && <span className="nav-badge">{badge}</span>}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-user">
        {showMenu && (
          <div className="user-menu">
            <div className="user-menu-item" onClick={() => { setActiveTab('settings'); setShowMenu(false); }}>
              <Settings size={14} /> Settings
            </div>
            <div className="user-menu-item danger" onClick={handleSignOut}>
              <LogOut size={14} /> Sign Out
            </div>
          </div>
        )}
        <div className="user-avatar-initials">{initials}</div>
        <div className="user-info">
          <div className="user-name">{businessName}</div>
          <div className="user-email">{userEmail || 'admin@business.com'}</div>
        </div>
        <button className="btn btn-ghost btn-icon" style={{ border: 'none', background: 'none' }} onClick={() => setShowMenu(!showMenu)}>
          <ChevronUp size={14} color="var(--txt3)" style={{ transform: showMenu ? 'rotate(180deg)' : 'none', transition: 'var(--t)' }} />
        </button>
      </div>
    </aside>
  );
}

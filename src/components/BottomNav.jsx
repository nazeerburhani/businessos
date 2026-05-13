import React from 'react';
import { LayoutDashboard, ShoppingCart, Package, BookOpen, CreditCard, MoreHorizontal } from 'lucide-react';

const bottomNav = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'pos', label: 'POS', icon: ShoppingCart },
  { id: 'inventory', label: 'Stock', icon: Package },
  { id: 'khata', label: 'Khata', icon: BookOpen },
  { id: 'expenses', label: 'More', icon: MoreHorizontal },
];

export default function BottomNav({ activeTab, setActiveTab }) {
  return (
    <nav className="bottom-nav">
      {bottomNav.map(item => {
        const Icon = item.icon;
        const isActive = activeTab === item.id ||
          (item.id === 'expenses' && ['expenses', 'analytics', 'employees', 'settings'].includes(activeTab));
        return (
          <button
            key={item.id}
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            <Icon size={22} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

import React from 'react';
import { Search, Bell } from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';

export default function TopBar({ searchQuery, setSearchQuery }) {
  const { stats, data } = useBusiness();
  const alertCount = (stats?.lowStockCount || 0) + (stats?.outOfStockCount || 0);

  return (
    <header className="topbar">
      <div className="search-wrap">
        <Search size={15} color="var(--txt3)" />
        <input
          type="text"
          placeholder="Search products, customers…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="topbar-right">
        <div className="topbar-date">
          {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </div>
        <div className="icon-btn">
          <Bell size={16} />
          {alertCount > 0 && <span className="notif-dot" />}
        </div>
        <div style={{ padding: '5px 12px', background: 'var(--emerald-s)', border: '1px solid var(--emerald-g)', borderRadius: 'var(--r)', fontSize: '0.72rem', color: 'var(--emerald)', fontWeight: 600 }}>
          {data?.settings?.businessName || 'My Business'}
        </div>
      </div>
    </header>
  );
}

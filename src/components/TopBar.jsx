import React, { useEffect, useRef, useState } from 'react';
import { Search, Bell, Sun, Moon, Globe, X, AlertTriangle, BookOpen } from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import CommandPalette from './CommandPalette';

export default function TopBar({ searchQuery, setSearchQuery, setActiveTab }) {
  const { stats, data } = useBusiness();
  const { theme, toggleTheme, isDark } = useTheme();
  const { t, lang, toggleLang, isUrdu } = useTranslation();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifGranted, setNotifGranted] = useState(false);
  const notifRef = useRef(null);

  const today = new Date(); today.setHours(0,0,0,0);
  const expiringCount = data.products.filter(p => {
    if (!p.expiryDate) return false;
    const d = new Date(p.expiryDate); d.setHours(0,0,0,0);
    return Math.round((d - today) / 86400000) <= 14;
  }).length;
  const alertCount = (stats?.lowStockCount || 0) + (stats?.outOfStockCount || 0) + expiringCount;
  const overdueKhata = data?.khata?.filter(k => k.balance > 0) || [];

  // ── Close notif panel on outside click ──────────────────────────────────
  useEffect(() => {
    const handler = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Request Notification Permission ────────────────────────────────────
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      setNotifGranted(true);
    }
  }, []);

  const requestNotifPermission = async () => {
    if (!('Notification' in window)) return;
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      setNotifGranted(true);
      // Fire initial alerts
      const lowStock = data.products.filter(p => p.stock <= (p.minStock || 5));
      if (lowStock.length > 0) {
        new Notification('⚠️ BusinessOS — Low Stock Alert', {
          body: `${lowStock.length} product(s) running low: ${lowStock.slice(0, 3).map(p => p.name).join(', ')}`,
          icon: '/icon-192.png',
          tag: 'low-stock',
        });
      }
    }
  };

  // ── Send browser notification for low stock (on mount) ──────────────────
  useEffect(() => {
    if (!notifGranted) return;
    const lowStock = data.products.filter(p => p.stock <= (p.minStock || 5) && p.stock > 0);
    const outOfStock = data.products.filter(p => p.stock === 0);
    if (outOfStock.length > 0) {
      new Notification('🔴 Out of Stock!', {
        body: `${outOfStock.slice(0, 2).map(p => p.name).join(', ')} ${outOfStock.length > 2 ? `+${outOfStock.length - 2} more` : ''} are out of stock.`,
        tag: 'out-of-stock',
        icon: '/icon-192.png',
      });
    }
  }, [notifGranted]);

  const notifications = [
    ...data.products.filter(p => p.stock === 0).map(p => ({
      type: 'critical', icon: '🔴', msg: `${p.name} is OUT OF STOCK`,
    })),
    ...data.products.filter(p => p.stock > 0 && p.stock <= (p.minStock || 5)).map(p => ({
      type: 'warning', icon: '🟡', msg: `${p.name} — only ${p.stock} left (min: ${p.minStock || 5})`,
    })),
    ...(() => {
      const today = new Date(); today.setHours(0,0,0,0);
      return data.products
        .filter(p => p.expiryDate)
        .map(p => { const d = new Date(p.expiryDate); d.setHours(0,0,0,0); return { ...p, daysLeft: Math.round((d-today)/(86400000)) }; })
        .filter(p => p.daysLeft <= 14)
        .map(p => ({ type: 'expiry', icon: '📅', msg: p.daysLeft < 0 ? `${p.name} EXPIRED ${Math.abs(p.daysLeft)}d ago!` : `${p.name} expires in ${p.daysLeft}d` }));
    })(),
    ...overdueKhata.slice(0, 3).map(k => ({
      type: 'khata', icon: '📒', msg: `${k.name} owes ${data.settings.currency} ${k.balance?.toLocaleString()}`,
    })),
  ];

  return (
    <header className="topbar">
      <div className="search-wrap">
        <Search size={15} color="var(--txt3)" />
        <input
          type="text"
          placeholder={t('searchProducts')}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="topbar-right">
        {/* Command Palette */}
        {setActiveTab && <CommandPalette onNavigate={setActiveTab} />}

        {/* Date */}
        <div className="topbar-date">
          {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </div>

        {/* Language toggle */}
        <button
          className="icon-btn"
          onClick={toggleLang}
          title={isUrdu ? 'Switch to English' : 'اردو میں بدلیں'}
          style={{ fontSize: '0.72rem', fontWeight: 700, padding: '4px 8px', width: 'auto', gap: 4, color: isUrdu ? 'var(--amber)' : 'var(--txt2)' }}
        >
          <Globe size={14} />
          {isUrdu ? 'EN' : 'اردو'}
        </button>

        {/* Theme toggle */}
        <button
          className="icon-btn"
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          style={{ color: isDark ? 'var(--amber)' : 'var(--violet)' }}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Notification bell */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            className="icon-btn"
            onClick={() => setNotifOpen(o => !o)}
            title="Notifications"
            style={{ color: alertCount > 0 ? 'var(--amber)' : 'var(--txt2)' }}
          >
            <Bell size={16} />
            {alertCount > 0 && (
              <span style={{
                position: 'absolute', top: 2, right: 2,
                width: 8, height: 8, borderRadius: '50%',
                background: 'var(--rose)',
                boxShadow: '0 0 6px var(--rose)',
              }} />
            )}
          </button>

          {/* Notification dropdown */}
          {notifOpen && (
            <div style={{
              position: 'absolute', top: '110%', right: 0, width: 320,
              background: 'var(--bg-surface)', border: '1px solid var(--border2)',
              borderRadius: 12, boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
              zIndex: 1000, overflow: 'hidden',
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>🔔 Notifications</span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {!notifGranted && (
                    <button
                      style={{ fontSize: '0.65rem', background: 'var(--violet-s)', color: 'var(--violet)', border: '1px solid var(--violet-g)', borderRadius: 6, padding: '2px 8px', cursor: 'pointer' }}
                      onClick={requestNotifPermission}
                    >
                      Enable Push
                    </button>
                  )}
                  <button onClick={() => setNotifOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt3)' }}><X size={14} /></button>
                </div>
              </div>
              <div style={{ maxHeight: 340, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: 30, textAlign: 'center', color: 'var(--txt3)', fontSize: '0.82rem' }}>
                    ✅ All clear! No alerts.
                  </div>
                ) : notifications.map((n, i) => (
                  <div key={i} style={{
                    padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'flex-start',
                    background: n.type === 'critical' ? 'rgba(244,63,94,0.04)' : n.type === 'warning' ? 'rgba(245,158,11,0.04)' : 'rgba(0,200,240,0.04)',
                  }}>
                    <span style={{ fontSize: '1rem', flexShrink: 0 }}>{n.icon}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--txt2)', lineHeight: 1.4 }}>{n.msg}</span>
                  </div>
                ))}
              </div>
              {!notifGranted && (
                <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border)', fontSize: '0.68rem', color: 'var(--txt3)' }}>
                  💡 Enable push notifications to get alerts even when the app is closed.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Business name badge */}
        <div style={{ padding: '5px 12px', background: 'var(--emerald-s)', border: '1px solid var(--emerald-g)', borderRadius: 'var(--r)', fontSize: '0.72rem', color: 'var(--emerald)', fontWeight: 600, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {data?.settings?.businessName || 'My Business'}
        </div>
      </div>
    </header>
  );
}

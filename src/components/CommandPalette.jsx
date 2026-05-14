import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, LayoutDashboard, ShoppingCart, Package, BookOpen, CreditCard, BarChart2, Users, Settings, Truck, ShoppingBag, FileText, Star, Shield, Moon, Tag, RefreshCw, TrendingUp, Globe, Clock, Gift, ArrowRight } from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';

const ALL_MODULES = [
  { id: 'dashboard',  label: 'Dashboard',         icon: LayoutDashboard, group: 'Navigation', keywords: 'home overview' },
  { id: 'pos',        label: 'Point of Sale',      icon: ShoppingCart,    group: 'Navigation', keywords: 'sell cashier checkout' },
  { id: 'inventory',  label: 'Inventory',          icon: Package,         group: 'Navigation', keywords: 'products stock items' },
  { id: 'purchases',  label: 'Purchases',          icon: ShoppingBag,     group: 'Navigation', keywords: 'buy purchase order stock in' },
  { id: 'suppliers',  label: 'Suppliers',          icon: Truck,           group: 'Navigation', keywords: 'vendor supplier company' },
  { id: 'reorder',    label: 'Stock Reorder',      icon: RefreshCw,       group: 'Navigation', keywords: 'reorder low stock purchase order' },
  { id: 'khata',      label: 'Khata Ledger',       icon: BookOpen,        group: 'Navigation', keywords: 'credit customer ledger debt' },
  { id: 'expenses',   label: 'Expenses',           icon: CreditCard,      group: 'Navigation', keywords: 'cost spending bills' },
  { id: 'analytics',  label: 'Analytics',          icon: BarChart2,       group: 'Navigation', keywords: 'charts graphs data trends' },
  { id: 'reports',    label: 'Reports',            icon: FileText,        group: 'Navigation', keywords: 'report summary export' },
  { id: 'margin',     label: 'Margin Analysis',    icon: TrendingUp,      group: 'Navigation', keywords: 'profit margin product analysis' },
  { id: 'coupons',    label: 'Coupons',            icon: Tag,             group: 'Navigation', keywords: 'discount coupon promo code' },
  { id: 'eod',        label: 'EOD Report',         icon: Moon,            group: 'Navigation', keywords: 'end of day closing cash' },
  { id: 'currency',   label: 'Currency Converter', icon: Globe,           group: 'Navigation', keywords: 'forex exchange rate currency' },
  { id: 'loyalty',    label: 'Loyalty Program',    icon: Star,            group: 'Navigation', keywords: 'points rewards loyalty customer' },
  { id: 'employees',  label: 'Staff',              icon: Users,           group: 'Navigation', keywords: 'employee staff payroll hr' },
  { id: 'useraccess', label: 'User Access & PINs', icon: Shield,          group: 'Navigation', keywords: 'user pin role access security' },
  { id: 'shift',      label: 'Shift Manager',      icon: Clock,           group: 'Navigation', keywords: 'shift open close daily' },
  { id: 'settings',   label: 'Settings',           icon: Settings,        group: 'Navigation', keywords: 'configure setup business' },
];

export default function CommandPalette({ onNavigate }) {
  const { data } = useBusiness();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Open on Ctrl+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(o => !o);
        setQuery('');
        setSelectedIdx(0);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const q = query.toLowerCase().trim();

  // Module results
  const moduleResults = ALL_MODULES.filter(m =>
    !q || m.label.toLowerCase().includes(q) || m.keywords.includes(q) || m.id.includes(q)
  );

  // Product results
  const productResults = q ? data.products.filter(p =>
    p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q)
  ).slice(0, 5).map(p => ({ type: 'product', ...p })) : [];

  // Customer results
  const customerResults = q ? data.khata.filter(k =>
    k.name?.toLowerCase().includes(q) || k.phone?.includes(q)
  ).slice(0, 5).map(k => ({ type: 'customer', ...k })) : [];

  const allResults = [
    ...moduleResults.map(m => ({ ...m, resultType: 'module' })),
    ...productResults.map(p => ({ ...p, resultType: 'product', label: p.name, id: 'inventory', sub: `Stock: ${p.stock} · ${data.settings.currency} ${p.price}` })),
    ...customerResults.map(k => ({ ...k, resultType: 'customer', label: k.name, id: 'khata', sub: `Balance: ${data.settings.currency} ${k.balance || 0} · ${k.phone || 'No phone'}` })),
  ];

  const handleSelect = useCallback((item) => {
    onNavigate(item.id);
    setOpen(false);
    setQuery('');
  }, [onNavigate]);

  useEffect(() => {
    setSelectedIdx(0);
  }, [query]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, allResults.length - 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
      if (e.key === 'Enter' && allResults[selectedIdx]) handleSelect(allResults[selectedIdx]);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, selectedIdx, allResults, handleSelect]);

  // Scroll selected into view
  useEffect(() => {
    const el = listRef.current?.children[selectedIdx];
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIdx]);

  if (!open) return (
    <button
      onClick={() => { setOpen(true); setQuery(''); }}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
        background: 'var(--bg-input)', border: '1px solid var(--border)',
        color: 'var(--txt3)', fontSize: '0.78rem', transition: 'all 0.15s',
      }}
      title="Global Search (Ctrl+K)"
    >
      <Search size={13} /> Search… <kbd style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: 4, background: 'var(--border2)', color: 'var(--txt3)', fontFamily: 'monospace' }}>⌘K</kbd>
    </button>
  );

  const getIcon = (item) => {
    if (item.resultType === 'product') return <Package size={16} color="var(--emerald)" />;
    if (item.resultType === 'customer') return <Users size={16} color="var(--amber)" />;
    const Icon = item.icon;
    return Icon ? <Icon size={16} color="var(--cyan)" /> : <ArrowRight size={16} />;
  };

  const getGroupLabel = (item, prev) => {
    if (item.resultType !== prev?.resultType) {
      if (item.resultType === 'module') return 'Modules';
      if (item.resultType === 'product') return 'Products';
      if (item.resultType === 'customer') return 'Customers';
    }
    return null;
  };

  return (
    <>
      {/* Backdrop */}
      <div onClick={() => setOpen(false)} style={{
        position: 'fixed', inset: 0, zIndex: 9998,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        animation: 'anim-fade-in 0.1s ease',
      }} />

      {/* Palette */}
      <div style={{
        position: 'fixed', top: '15vh', left: '50%', transform: 'translateX(-50%)',
        width: 'min(600px, 95vw)', zIndex: 9999,
        background: 'var(--glass-bg)', backdropFilter: 'blur(20px)',
        border: '1px solid var(--border2)', borderRadius: 16,
        boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
        animation: 'anim-fade-in 0.15s ease',
        overflow: 'hidden',
      }}>
        {/* Search input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
          <Search size={18} color="var(--cyan)" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search modules, products, customers…"
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              fontSize: '1rem', color: 'var(--txt)', fontFamily: 'inherit',
            }}
          />
          <kbd onClick={() => setOpen(false)} style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: 5, background: 'var(--border2)', color: 'var(--txt3)', cursor: 'pointer', fontFamily: 'monospace' }}>ESC</kbd>
        </div>

        {/* Results */}
        <div ref={listRef} style={{ maxHeight: '55vh', overflowY: 'auto', padding: '6px 0' }}>
          {allResults.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--txt3)', fontSize: '0.85rem' }}>No results for "{query}"</div>
          ) : allResults.map((item, i) => {
            const groupLabel = getGroupLabel(item, allResults[i - 1]);
            const isSelected = i === selectedIdx;
            return (
              <React.Fragment key={`${item.resultType}-${item.id}-${i}`}>
                {groupLabel && (
                  <div style={{ padding: '8px 18px 4px', fontSize: '0.65rem', fontWeight: 700, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {groupLabel}
                  </div>
                )}
                <div
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIdx(i)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 18px', cursor: 'pointer', transition: 'all 0.1s',
                    background: isSelected ? 'rgba(0,200,240,0.08)' : 'transparent',
                    borderLeft: isSelected ? '3px solid var(--cyan)' : '3px solid transparent',
                  }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: isSelected ? 'rgba(0,200,240,0.12)' : 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {getIcon(item)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: isSelected ? 700 : 500, fontSize: '0.88rem', color: isSelected ? 'var(--cyan)' : 'var(--txt)' }}>{item.label}</div>
                    {item.sub && <div style={{ fontSize: '0.7rem', color: 'var(--txt3)', marginTop: 1 }}>{item.sub}</div>}
                    {item.group && !item.sub && <div style={{ fontSize: '0.68rem', color: 'var(--txt3)', marginTop: 1 }}>{item.group}</div>}
                  </div>
                  {isSelected && <ArrowRight size={14} color="var(--cyan)" />}
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Footer hint */}
        <div style={{ padding: '8px 18px', borderTop: '1px solid var(--border)', display: 'flex', gap: 16, fontSize: '0.65rem', color: 'var(--txt3)' }}>
          <span><kbd style={{ fontFamily: 'monospace', padding: '1px 4px', background: 'var(--border2)', borderRadius: 3 }}>↑↓</kbd> navigate</span>
          <span><kbd style={{ fontFamily: 'monospace', padding: '1px 4px', background: 'var(--border2)', borderRadius: 3 }}>↵</kbd> select</span>
          <span><kbd style={{ fontFamily: 'monospace', padding: '1px 4px', background: 'var(--border2)', borderRadius: 3 }}>ESC</kbd> close</span>
          <span style={{ marginLeft: 'auto' }}>{allResults.length} results</span>
        </div>
      </div>
    </>
  );
}

import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, CreditCard, BookOpen, Package, ShoppingCart, AlertTriangle, CheckCircle, ArrowRight, Zap, Star, Download, Clock, AlertCircle } from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { useTranslation } from '../hooks/useTranslation';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function StatCard({ label, value, icon: Icon, type, meta }) {
  return (
    <div className="card stat-card">
      <div className="stat-card-top">
        <div className="stat-card-label">{label}</div>
        <div className={`stat-card-icon ${type}`}><Icon size={18} /></div>
      </div>
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-meta">{meta}</div>
    </div>
  );
}

export default function Dashboard({ setActiveTab }) {
  const { data, stats } = useBusiness();
  const { t } = useTranslation();
  const cur = data.settings.currency;
  const fmt = (n) => `${cur} ${(n || 0).toLocaleString()}`;

  // PWA install prompt
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installBanner, setInstallBanner] = useState(false);
  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e); setInstallBanner(true); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);
  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setInstallBanner(false);
  };

  const chartData = data.transactions.slice(0, 14).reverse().map(t => ({
    date: t.date?.slice(5) || '',
    revenue: t.total,
  }));

  const lowStock = data.products.filter(p => p.stock <= p.minStock);
  const recentTxns = data.transactions.slice(0, 8);

  // ── Onboarding Steps ───────────────────────────────────────────────────
  const onboardingSteps = [
    {
      id: 1,
      icon: '🏪',
      title: 'Set up your shop',
      desc: 'Add your business name, address, and logo',
      done: data.settings.businessName !== 'My Business' && data.settings.businessName !== '',
      action: () => setActiveTab('settings'),
      actionLabel: 'Open Settings',
    },
    {
      id: 2,
      icon: '📦',
      title: 'Add your first product',
      desc: 'Add products to your inventory with prices and stock',
      done: data.products.length > 0,
      action: () => setActiveTab('inventory'),
      actionLabel: 'Add Product',
    },
    {
      id: 3,
      icon: '💰',
      title: 'Make your first sale',
      desc: 'Go to POS, add products to cart and complete a sale',
      done: data.transactions.length > 0,
      action: () => setActiveTab('pos'),
      actionLabel: 'Open POS',
    },
  ];
  const onboardingDone = onboardingSteps.every(s => s.done);
  const completedCount = onboardingSteps.filter(s => s.done).length;

  return (
    <div className="page-body anim-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <div className="page-subtitle">{t('welcomeBack')} — {data.settings.businessName}</div>
        </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--txt3)' }}>{t('netProfit')}</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: stats.netProfit >= 0 ? 'var(--emerald)' : 'var(--rose)' }}>{fmt(stats.netProfit)}</div>
          </div>
        </div>

      {/* PWA Install Banner */}
      {installBanner && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', marginBottom: 16, borderRadius: 12, background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(0,200,240,0.1))', border: '1px solid var(--violet-g)' }}>
          <Download size={20} color="var(--violet)" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>Install BusinessOS App</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--txt3)' }}>Add to Home Screen for offline access — works without internet!</div>
          </div>
          <button className="btn btn-primary btn-sm" style={{ fontSize: '0.78rem' }} onClick={handleInstall}>Install</button>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setInstallBanner(false)}>×</button>
        </div>
      )}

      {/* ── Onboarding Banner ── */}
      {!onboardingDone && (
        <div className="glass" style={{ padding: 20, marginBottom: 20, border: '1px solid rgba(99,102,241,0.3)', background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(0,200,240,0.05))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Zap size={18} color="var(--violet)" />
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Getting Started</span>
              <span style={{ fontSize: '0.72rem', background: 'var(--violet)', color: '#fff', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>{completedCount}/{onboardingSteps.length}</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--txt3)' }}>Complete these steps to unlock full potential</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {onboardingSteps.map(step => (
              <div key={step.id} style={{ padding: '14px', borderRadius: 10, background: step.done ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${step.done ? 'var(--emerald-g)' : 'var(--border)'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: '1.2rem' }}>{step.icon}</span>
                  {step.done ? <CheckCircle size={14} color="var(--emerald)" /> : <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid var(--border2)' }} />}
                  <span style={{ fontWeight: 700, fontSize: '0.82rem', color: step.done ? 'var(--emerald)' : 'var(--txt)' }}>{step.title}</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--txt3)', marginBottom: 10 }}>{step.desc}</div>
                {!step.done && (
                  <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.7rem', padding: '4px 10px', color: 'var(--violet)' }} onClick={step.action}>
                    {step.actionLabel} <ArrowRight size={11} style={{ display: 'inline' }} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today's quick stats */}
      {stats.todaySales > 0 && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, padding: '10px 16px', background: 'rgba(0,200,240,0.06)', borderRadius: 10, border: '1px solid rgba(0,200,240,0.15)', alignItems: 'center', flexWrap: 'wrap' }}>
          <Star size={14} color="var(--amber)" />
          <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Today:</span>
          <span style={{ fontSize: '0.82rem', color: 'var(--cyan)' }}>{fmt(stats.todayRevenue)}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--txt3)' }}>in {stats.todaySales} sale{stats.todaySales !== 1 ? 's' : ''}</span>
          {stats.expiringSoon > 0 && <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--amber)', fontWeight: 600 }}>⏰ {stats.expiringSoon} products expiring soon</span>}
        </div>
      )}

      <div className="stat-grid">
        <StatCard label="Total Revenue" value={fmt(stats.totalRevenue)} icon={TrendingUp} type="c" meta={`${data.transactions.length} sales`} />
        <StatCard label="Cash in Hand" value={fmt(stats.cashBalance)} icon={DollarSign} type="e" meta="Available cash" />
        <StatCard label="Bank Balance" value={fmt(stats.bankBalance)} icon={CreditCard} type="c" meta="In accounts" />
        <StatCard label="Pending Khata" value={fmt(stats.pendingKhata)} icon={BookOpen} type="a" meta={`${data.khata.length} customers`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, marginBottom: 20 }}>
        <div className="glass" style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={18} color="var(--cyan)" /> Revenue Trend
          </h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="rGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--cyan)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--cyan)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--txt3)" fontSize={11} />
                <YAxis stroke="var(--txt3)" fontSize={11} />
                <Tooltip contentStyle={{ background: '#0a0e1c', border: '1px solid var(--border2)', borderRadius: 8 }} />
                <Area type="monotone" dataKey="revenue" stroke="var(--cyan)" strokeWidth={2.5} fill="url(#rGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state"><TrendingUp size={40} /><p>No transactions yet</p></div>
          )}
        </div>

        <div className="glass" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
              <AlertTriangle size={16} color="var(--amber)" /> Stock Alerts
            </h3>
            {lowStock.length > 0 && (
              <span style={{ fontSize: '0.7rem', color: 'var(--amber)', fontWeight: 600, background: 'rgba(255,170,0,0.1)', padding: '2px 8px', borderRadius: 12 }}>
                {lowStock.length} Action Needed
              </span>
            )}
          </div>

          {lowStock.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <CheckCircle size={32} style={{ color: 'var(--emerald)', opacity: 0.4 }} />
              <p>Inventory is healthy</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 400, overflowY: 'auto', paddingRight: 4 }}>
              {lowStock.map(p => {
                const stockPercent = Math.min(100, (p.stock / (p.minStock * 2)) * 100);
                const statusColor = p.stock === 0 ? 'var(--rose)' : 'var(--amber)';
                
                return (
                  <div key={p.id} className="card" style={{ padding: '12px', borderLeft: `3px solid ${statusColor}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--txt)' }}>{p.name}</div>
                      <span style={{ 
                        fontSize: '0.65rem', 
                        fontWeight: 900, 
                        color: statusColor,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        {p.stock === 0 ? 'CRITICAL' : 'LOW'}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <div style={{ flex: 1, height: 4, background: 'var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                        <div style={{ 
                          height: '100%', 
                          width: `${stockPercent}%`, 
                          background: statusColor,
                          boxShadow: `0 0 8px ${statusColor}44`
                        }} />
                      </div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, minWidth: 45, textAlign: 'right' }}>
                        {p.stock} / {p.minStock}
                      </div>
                    </div>
                    
                    <div style={{ fontSize: '0.65rem', color: 'var(--txt3)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>SKU: {p.sku || 'N/A'}</span>
                      <span>Min Required: {p.minStock}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="glass" style={{ padding: 24 }}>
        <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShoppingCart size={18} color="var(--cyan)" /> Recent Transactions
        </h3>
        {recentTxns.length === 0 ? (
          <div className="empty-state"><ShoppingCart size={40} /><p>No transactions yet — go to POS to make a sale</p></div>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Date</th><th>Items</th><th>Amount</th></tr></thead>
              <tbody>
                {recentTxns.map(t => (
                  <tr key={t.id}>
                    <td style={{ color: 'var(--txt3)' }}>{t.date}</td>
                    <td style={{ color: 'var(--txt2)', fontSize: '0.8rem' }}>{t.items?.map(i => i.name).join(', ')}</td>
                    <td style={{ fontWeight: 700, color: 'var(--emerald)' }}>{cur} {t.total?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Stock Expiry Alerts ── */}
      {(() => {
        const today = new Date();
        today.setHours(0,0,0,0);
        const expiring = data.products
          .filter(p => p.expiryDate)
          .map(p => {
            const exp = new Date(p.expiryDate);
            exp.setHours(0,0,0,0);
            const diff = Math.round((exp - today) / (1000 * 60 * 60 * 24));
            return { ...p, daysLeft: diff };
          })
          .filter(p => p.daysLeft <= 30)
          .sort((a, b) => a.daysLeft - b.daysLeft);

        if (expiring.length === 0) return null;
        return (
          <div className="glass" style={{ padding: 24, marginTop: 20, borderLeft: '4px solid var(--amber)' }}>
            <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--amber)' }}>
              <Clock size={18} /> Stock Expiry Alerts
              <span className="badge badge-warning" style={{ marginLeft: 4 }}>{expiring.length}</span>
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
              {expiring.map(p => {
                const isCritical = p.daysLeft <= 7;
                const isExpired  = p.daysLeft < 0;
                return (
                  <div key={p.id} style={{
                    padding: '12px 14px', borderRadius: 10,
                    background: isExpired ? 'rgba(244,63,94,0.07)' : isCritical ? 'rgba(245,158,11,0.07)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isExpired ? 'var(--rose-g)' : isCritical ? 'var(--amber-g)' : 'var(--border)'}`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{p.name}</span>
                      <span style={{
                        fontSize: '0.68rem', fontWeight: 800, padding: '2px 8px', borderRadius: 10,
                        background: isExpired ? 'var(--rose-s)' : isCritical ? 'var(--amber-s)' : 'var(--bg-input)',
                        color: isExpired ? 'var(--rose)' : isCritical ? 'var(--amber)' : 'var(--txt3)'
                      }}>
                        {isExpired ? `EXPIRED ${Math.abs(p.daysLeft)}d ago` : `${p.daysLeft}d left`}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--txt3)' }}>Expiry: {p.expiryDate} · Stock: {p.stock} {p.unit || 'pcs'}</div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

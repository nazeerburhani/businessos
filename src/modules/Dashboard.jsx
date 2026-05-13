import React from 'react';
import { DollarSign, TrendingUp, CreditCard, BookOpen, Package, ShoppingCart, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
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

export default function Dashboard() {
  const { data, stats } = useBusiness();
  const cur = data.settings.currency;
  const fmt = (n) => `${cur} ${(n || 0).toLocaleString()}`;

  const chartData = data.transactions.slice(0, 14).reverse().map(t => ({
    date: t.date?.slice(5) || '',
    revenue: t.total,
  }));

  const lowStock = data.products.filter(p => p.stock <= p.minStock);
  const recentTxns = data.transactions.slice(0, 8);

  return (
    <div className="page-body anim-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <div className="page-subtitle">Welcome back — {data.settings.businessName}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--txt3)' }}>Net Profit</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: stats.netProfit >= 0 ? 'var(--emerald)' : 'var(--rose)' }}>{fmt(stats.netProfit)}</div>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard label="Total Revenue" value={fmt(stats.totalRevenue)} icon={TrendingUp} type="c" meta={`${data.transactions.length} transactions`} />
        <StatCard label="Total Expenses" value={fmt(stats.totalExpenses)} icon={CreditCard} type="r" meta={`${data.expenses.length} entries`} />
        <StatCard label="Khata Pending" value={fmt(stats.pendingKhata)} icon={BookOpen} type="a" meta={`${data.khata.length} customers`} />
        <StatCard label="Stock Alerts" value={`${stats.outOfStockCount} Out / ${stats.lowStockCount} Low`} icon={Package} type="e" meta={`${data.products.length} products total`} />
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
          <h3 style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={16} color="var(--amber)" /> Stock Alerts
          </h3>
          {lowStock.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <CheckCircle size={32} style={{ color: 'var(--emerald)', opacity: 0.4 }} />
              <p>All stock levels healthy</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {lowStock.map(p => (
                <div key={p.id} className="card" style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{p.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--txt3)' }}>Min: {p.minStock}</div>
                  </div>
                  <span className={`badge ${p.stock === 0 ? 'badge-danger' : 'badge-warning'}`}>
                    {p.stock === 0 ? 'OUT' : `${p.stock} left`}
                  </span>
                </div>
              ))}
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
    </div>
  );
}

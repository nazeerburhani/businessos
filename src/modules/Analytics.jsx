import React from 'react';
import { BarChart2, TrendingUp, TrendingDown, Package, ShoppingCart } from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function Analytics() {
  const { data, stats } = useBusiness();
  const { transactions, expenses, products, settings } = data;
  const cur = settings.currency;

  // Sales by day (last 14 days)
  const salesChart = transactions.slice(0, 14).reverse().map(t => ({ date: t.date?.slice(5) || '', total: t.total }));

  // Expense by category
  const expCats = {};
  expenses.forEach(e => { expCats[e.category] = (expCats[e.category] || 0) + e.amount; });
  const expChart = Object.entries(expCats).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, value]) => ({ name, value }));

  // Top products by stock sold (price * original_stock - current)
  const topProducts = [...products].sort((a, b) => b.price - a.price).slice(0, 5);

  // Monthly breakdown
  const monthMap = {};
  transactions.forEach(t => {
    const m = t.date?.slice(0, 7);
    if (m) monthMap[m] = (monthMap[m] || 0) + t.total;
  });
  const monthChart = Object.entries(monthMap).sort().slice(-6).map(([month, total]) => ({ month: month.slice(5) + '/' + month.slice(2, 4), total }));

  const COLORS = ['var(--cyan)', 'var(--violet)', 'var(--emerald)', 'var(--amber)', 'var(--rose)', '#38bdf8', '#a78bfa', '#6ee7b7'];

  return (
    <div className="page-body anim-fade">
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Analytics</h1>
          <div className="page-subtitle">Business performance overview</div>
        </div>
      </div>

      {/* P&L Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Revenue', value: stats.totalRevenue, color: 'var(--cyan)', icon: TrendingUp },
          { label: 'Total Expenses', value: stats.totalExpenses, color: 'var(--rose)', icon: TrendingDown },
          { label: 'Net Profit / Loss', value: stats.netProfit, color: stats.netProfit >= 0 ? 'var(--emerald)' : 'var(--rose)', icon: BarChart2 },
        ].map(item => (
          <div key={item.label} className="glass" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--txt3)', fontWeight: 600 }}>{item.label}</span>
              <item.icon size={18} color={item.color} />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: item.color, fontFamily: 'Outfit' }}>{cur} {item.value?.toLocaleString()}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Sales Trend */}
        <div className="glass" style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 16, fontSize: '1rem' }}>Sales Trend (Last 14 Transactions)</h3>
          {salesChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={salesChart}>
                <defs>
                  <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--cyan)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--cyan)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--txt3)" fontSize={10} />
                <YAxis stroke="var(--txt3)" fontSize={10} />
                <Tooltip contentStyle={{ background: '#0a0e1c', border: '1px solid var(--border2)', borderRadius: 8, fontSize: '0.8rem' }} />
                <Area type="monotone" dataKey="total" stroke="var(--cyan)" strokeWidth={2} fill="url(#sg)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <div className="empty-state" style={{ padding: 40 }}><TrendingUp size={32} /><p>No data yet</p></div>}
        </div>

        {/* Monthly Revenue */}
        <div className="glass" style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 16, fontSize: '1rem' }}>Monthly Revenue</h3>
          {monthChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--txt3)" fontSize={10} />
                <YAxis stroke="var(--txt3)" fontSize={10} />
                <Tooltip contentStyle={{ background: '#0a0e1c', border: '1px solid var(--border2)', borderRadius: 8, fontSize: '0.8rem' }} />
                <Bar dataKey="total" fill="var(--violet)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="empty-state" style={{ padding: 40 }}><BarChart2 size={32} /><p>No data yet</p></div>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Expense by Category */}
        <div className="glass" style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 16, fontSize: '1rem' }}>Expenses by Category</h3>
          {expChart.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={expChart} layout="vertical">
                  <XAxis type="number" stroke="var(--txt3)" fontSize={10} />
                  <YAxis type="category" dataKey="name" stroke="var(--txt3)" fontSize={10} width={80} />
                  <Tooltip contentStyle={{ background: '#0a0e1c', border: '1px solid var(--border2)', borderRadius: 8, fontSize: '0.8rem' }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {expChart.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </>
          ) : <div className="empty-state" style={{ padding: 40 }}><TrendingDown size={32} /><p>No expense data</p></div>}
        </div>

        {/* Top Products */}
        <div className="glass" style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 16, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Package size={16} color="var(--emerald)" /> Top Products by Value
          </h3>
          {topProducts.length === 0 ? (
            <div className="empty-state" style={{ padding: 40 }}><Package size={32} /><p>No products</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {topProducts.map((p, i) => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ width: 22, height: 22, borderRadius: '50%', background: COLORS[i], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#000', flexShrink: 0 }}>{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--txt3)' }}>{p.category} · Stock: {p.stock}</div>
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--cyan)', fontSize: '0.9rem', flexShrink: 0 }}>{cur} {p.price?.toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

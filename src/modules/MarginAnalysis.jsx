import React, { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, BarChart2, ArrowUp, ArrowDown, Filter } from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function MarginAnalysis() {
  const { data } = useBusiness();
  const { products, transactions, settings } = data;
  const cur = settings.currency;

  const [sort, setSort] = useState('margin_desc'); // margin_desc | margin_asc | revenue_desc | sold_desc
  const [catFilter, setCatFilter] = useState('All');
  const [minMargin, setMinMargin] = useState('');

  const categories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];

  // Calculate per-product metrics
  const productMetrics = products.map(p => {
    const cost = p.costPrice || 0;
    const price = p.price || 0;
    const margin = price > 0 ? ((price - cost) / price * 100) : 0;
    const profit = price - cost;

    // Revenue from transactions
    const salesData = transactions.reduce((acc, t) => {
      const item = t.items?.find(i => i.id === p.id);
      if (item) { acc.qty += item.qty; acc.revenue += item.qty * item.price; acc.profit += item.qty * (item.price - cost); }
      return acc;
    }, { qty: 0, revenue: 0, profit: 0 });

    return {
      ...p,
      margin: Math.round(margin * 10) / 10,
      unitProfit: profit,
      totalRevenue: salesData.revenue,
      totalProfit: salesData.profit,
      totalSold: salesData.qty,
    };
  });

  // Filtered + sorted
  const filtered = productMetrics
    .filter(p => catFilter === 'All' || p.category === catFilter)
    .filter(p => !minMargin || p.margin >= Number(minMargin));

  const sorted = [...filtered].sort((a, b) => {
    switch (sort) {
      case 'margin_desc': return b.margin - a.margin;
      case 'margin_asc':  return a.margin - b.margin;
      case 'revenue_desc':return b.totalRevenue - a.totalRevenue;
      case 'sold_desc':   return b.totalSold - a.totalSold;
      case 'profit_desc': return b.totalProfit - a.totalProfit;
      default: return 0;
    }
  });

  // Summary stats
  const avgMargin = filtered.length ? (filtered.reduce((a, p) => a + p.margin, 0) / filtered.length).toFixed(1) : 0;
  const highMargin = filtered.filter(p => p.margin >= 40).length;
  const lowMargin = filtered.filter(p => p.margin < 15 && p.costPrice > 0).length;
  const totalRevenue = filtered.reduce((a, p) => a + p.totalRevenue, 0);
  const totalProfit = filtered.reduce((a, p) => a + p.totalProfit, 0);

  // Chart top 10 by revenue
  const chartData = [...filtered]
    .filter(p => p.totalRevenue > 0)
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 10)
    .map(p => ({ name: p.name.length > 12 ? p.name.slice(0, 12) + '…' : p.name, revenue: p.totalRevenue, profit: p.totalProfit, margin: p.margin }));

  const getMarginColor = (m) => {
    if (m >= 40) return 'var(--emerald)';
    if (m >= 20) return 'var(--cyan)';
    if (m >= 10) return 'var(--amber)';
    return 'var(--rose)';
  };

  const getMarginBg = (m) => {
    if (m >= 40) return 'var(--emerald-s)';
    if (m >= 20) return 'rgba(0,200,240,0.08)';
    if (m >= 10) return 'var(--amber-s)';
    return 'var(--rose-s)';
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: '#0a0e1c', border: '1px solid var(--border2)', borderRadius: 8, padding: '10px 14px', fontSize: '0.78rem' }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
        <div style={{ color: 'var(--cyan)' }}>Revenue: {cur} {payload[0]?.value?.toLocaleString()}</div>
        <div style={{ color: 'var(--emerald)' }}>Profit: {cur} {payload[1]?.value?.toLocaleString()}</div>
        <div style={{ color: 'var(--amber)' }}>Margin: {payload[0]?.payload?.margin}%</div>
      </div>
    );
  };

  return (
    <div className="page-body anim-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Profit Margin Analysis</h1>
          <div className="page-subtitle">Product-level profitability — identify your best and worst performers</div>
        </div>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Avg Margin', value: `${avgMargin}%`, color: 'var(--cyan)', sub: 'Across all products' },
          { label: 'High Margin (≥40%)', value: highMargin, color: 'var(--emerald)', sub: 'Premium products' },
          { label: 'Low Margin (<15%)', value: lowMargin, color: 'var(--rose)', sub: 'Needs attention' },
          { label: 'Total Revenue', value: `${cur} ${totalRevenue.toLocaleString()}`, color: 'var(--amber)', sub: 'From all sales' },
          { label: 'Total Profit', value: `${cur} ${totalProfit.toLocaleString()}`, color: 'var(--violet)', sub: 'Net after COGS' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '16px' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--txt3)', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontWeight: 900, fontSize: '1.2rem', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.62rem', color: 'var(--txt3)', marginTop: 4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Revenue vs Profit Chart */}
      {chartData.length > 0 && (
        <div className="glass" style={{ padding: 24, marginBottom: 20 }}>
          <h3 style={{ marginBottom: 16, fontSize: '0.92rem', color: 'var(--cyan)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart2 size={16} /> Revenue vs Profit — Top 10 Products
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} barGap={4}>
              <XAxis dataKey="name" stroke="var(--txt3)" fontSize={10} />
              <YAxis stroke="var(--txt3)" fontSize={10} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" fill="var(--cyan)" radius={[4, 4, 0, 0]} opacity={0.7} />
              <Bar dataKey="profit" fill="var(--emerald)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Filters */}
      <div className="glass" style={{ padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <Filter size={15} color="var(--txt3)" />
        <select className="input" style={{ width: 160 }} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
        <select className="input" style={{ width: 180 }} value={sort} onChange={e => setSort(e.target.value)}>
          <option value="margin_desc">Highest Margin First</option>
          <option value="margin_asc">Lowest Margin First</option>
          <option value="revenue_desc">Highest Revenue First</option>
          <option value="profit_desc">Highest Profit First</option>
          <option value="sold_desc">Most Sold First</option>
        </select>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--txt3)' }}>Min margin:</span>
          <input type="number" className="input" style={{ width: 70 }} value={minMargin} onChange={e => setMinMargin(e.target.value)} placeholder="e.g. 20" />
          <span style={{ fontSize: '0.75rem', color: 'var(--txt3)' }}>%</span>
        </div>
        <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--txt3)' }}>{sorted.length} products</span>
      </div>

      {/* Product Table */}
      <div className="glass" style={{ borderRadius: 'var(--r-xl)', overflow: 'hidden' }}>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Product</th><th>Category</th><th>Cost</th><th>Price</th>
                <th>Margin</th><th>Units Sold</th><th>Total Revenue</th><th>Total Profit</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 30, color: 'var(--txt3)' }}>No products with cost price data. Add cost prices in Inventory.</td></tr>
              ) : sorted.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 700 }}>{p.name}</td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--txt3)' }}>{p.category}</td>
                  <td style={{ color: 'var(--txt2)' }}>{p.costPrice ? `${cur} ${p.costPrice}` : <span style={{ color: 'var(--txt3)', fontStyle: 'italic' }}>—</span>}</td>
                  <td style={{ fontWeight: 600 }}>{cur} {p.price}</td>
                  <td>
                    {p.costPrice ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ position: 'relative', width: 80, height: 6, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${Math.min(100, Math.max(0, p.margin))}%`, background: getMarginColor(p.margin), borderRadius: 4 }} />
                        </div>
                        <span style={{ fontWeight: 800, fontSize: '0.88rem', color: getMarginColor(p.margin) }}>{p.margin}%</span>
                      </div>
                    ) : <span style={{ color: 'var(--txt3)', fontStyle: 'italic', fontSize: '0.75rem' }}>No cost</span>}
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--txt2)' }}>{p.totalSold}</td>
                  <td style={{ fontWeight: 700, color: 'var(--cyan)' }}>{p.totalRevenue ? `${cur} ${p.totalRevenue.toLocaleString()}` : '—'}</td>
                  <td style={{ fontWeight: 700, color: p.totalProfit >= 0 ? 'var(--emerald)' : 'var(--rose)' }}>
                    {p.totalRevenue ? `${cur} ${p.totalProfit.toLocaleString()}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div style={{ marginTop: 16, display: 'flex', gap: 16, fontSize: '0.72rem', color: 'var(--txt3)', flexWrap: 'wrap' }}>
        {[['≥40%', 'var(--emerald)', 'Excellent'], ['20–40%', 'var(--cyan)', 'Good'], ['10–20%', 'var(--amber)', 'Fair'], ['<10%', 'var(--rose)', 'Low — review pricing']].map(([range, color, label]) => (
          <span key={range} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: color, display: 'inline-block' }} />
            {range} — {label}
          </span>
        ))}
      </div>
    </div>
  );
}

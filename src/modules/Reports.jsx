import React, { useState, useMemo } from 'react';
import { FileText, Download, TrendingUp, TrendingDown, Calendar, DollarSign, Printer } from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { generateInvoicePDF } from '../utils/invoicePDF';

export default function Reports() {
  const { data, stats } = useBusiness();
  const { transactions, expenses, products, settings } = data;
  const cur = settings.currency;
  const [tab, setTab] = useState('daily');
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);

  const filteredTxns = useMemo(() =>
    transactions.filter(t => t.date >= dateFrom && t.date <= dateTo),
    [transactions, dateFrom, dateTo]
  );

  const filteredExp = useMemo(() =>
    expenses.filter(e => e.date >= dateFrom && e.date <= dateTo),
    [expenses, dateFrom, dateTo]
  );

  const totalRevenue = filteredTxns.reduce((a, t) => a + (t.total || 0), 0);
  const totalExpenses = filteredExp.reduce((a, e) => a + (e.amount || 0), 0);
  const netProfit = totalRevenue - totalExpenses;
  const totalTax = filteredTxns.reduce((a, t) => a + (t.tax || 0), 0);

  // Daily breakdown
  const dailyMap = {};
  filteredTxns.forEach(t => {
    if (!dailyMap[t.date]) dailyMap[t.date] = { sales: 0, count: 0, tax: 0 };
    dailyMap[t.date].sales += t.total || 0;
    dailyMap[t.date].count += 1;
    dailyMap[t.date].tax += t.tax || 0;
  });
  const dailyRows = Object.entries(dailyMap).sort((a,b) => b[0].localeCompare(a[0]));

  // Top products from actual transaction data
  const productSales = {};
  filteredTxns.forEach(t => {
    t.items?.forEach(item => {
      if (!productSales[item.id]) productSales[item.id] = { name: item.name, qty: 0, revenue: 0 };
      productSales[item.id].qty += item.qty || 0;
      productSales[item.id].revenue += (item.price * item.qty) || 0;
    });
  });
  const topProducts = Object.values(productSales).sort((a,b) => b.revenue - a.revenue).slice(0, 10);

  // Payment method breakdown
  const paymentMap = { cash: 0, bank: 0, khata: 0 };
  filteredTxns.forEach(t => {
    const pays = t.payments || [{ method: t.paymentMethod || 'cash', amount: t.total }];
    pays.forEach(p => { paymentMap[p.method] = (paymentMap[p.method] || 0) + (p.amount || 0); });
  });

  const exportDailyCSV = () => {
    const headers = ['Date', 'No. of Sales', 'Revenue', 'Tax', 'Net'];
    const rows = dailyRows.map(([date, d]) => [date, d.count, d.sales, d.tax, d.sales - d.tax]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `daily-report-${dateFrom}-to-${dateTo}.csv`;
    a.click();
  };

  const exportGSTCSV = () => {
    const headers = ['Date', 'Invoice ID', 'Items', 'Subtotal', 'Tax Rate', 'Tax Amount', 'Total'];
    const rows = filteredTxns.map(t => [
      t.date, t.id,
      t.items?.map(i => `${i.name}x${i.qty}`).join(' | ') || '',
      t.subtotal || 0, settings.taxRate, t.tax || 0, t.total || 0
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `gst-report-${dateFrom}-to-${dateTo}.csv`;
    a.click();
  };

  const exportPLCSV = () => {
    const lines = [
      ['P&L Statement', `${dateFrom} to ${dateTo}`], [''],
      ['INCOME'], ['Total Sales Revenue', totalRevenue],
      ['Less: Discounts', filteredTxns.reduce((a,t)=>a+(t.discount||0),0)],
      ['Net Revenue', totalRevenue], [''],
      ['EXPENSES'], ...Object.entries(filteredExp.reduce((acc,e)=>{
        acc[e.category]=(acc[e.category]||0)+e.amount; return acc;
      }, {})).map(([k,v])=>[k,v]),
      ['Total Expenses', totalExpenses], [''],
      ['NET PROFIT / LOSS', netProfit]
    ];
    const csv = lines.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `pl-report-${dateFrom}-to-${dateTo}.csv`;
    a.click();
  };

  const TABS = [
    { id: 'daily', label: 'Daily Sales' },
    { id: 'products', label: 'Top Products' },
    { id: 'gst', label: 'GST Report' },
    { id: 'pl', label: 'P&L Statement' },
  ];

  return (
    <div className="page-body anim-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <div className="page-subtitle">Business performance & tax reports</div>
        </div>
      </div>

      {/* Date Range */}
      <div className="glass" style={{ padding: '14px 20px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <Calendar size={16} color="var(--cyan)" />
        <span style={{ fontSize: '0.82rem', color: 'var(--txt2)' }}>From</span>
        <input className="input" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: 150, height: 34 }} />
        <span style={{ fontSize: '0.82rem', color: 'var(--txt2)' }}>To</span>
        <input className="input" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width: 150, height: 34 }} />
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {['Today', 'This Week', 'This Month'].map(label => (
            <button key={label} className="btn btn-ghost btn-sm" onClick={() => {
              const now = new Date();
              if (label === 'Today') { const d = now.toISOString().split('T')[0]; setDateFrom(d); setDateTo(d); }
              else if (label === 'This Week') { const day = now.getDay(); const mon = new Date(now); mon.setDate(now.getDate() - day + 1); setDateFrom(mon.toISOString().split('T')[0]); setDateTo(now.toISOString().split('T')[0]); }
              else { const first = new Date(now.getFullYear(), now.getMonth(), 1); setDateFrom(first.toISOString().split('T')[0]); setDateTo(now.toISOString().split('T')[0]); }
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Total Revenue', value: totalRevenue, color: 'var(--cyan)', icon: TrendingUp },
          { label: 'Tax Collected', value: totalTax, color: 'var(--amber)', icon: DollarSign },
          { label: 'Total Expenses', value: totalExpenses, color: 'var(--rose)', icon: TrendingDown },
          { label: 'Net Profit', value: netProfit, color: netProfit >= 0 ? 'var(--emerald)' : 'var(--rose)', icon: TrendingUp },
        ].map(c => (
          <div key={c.label} className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--txt3)', fontWeight: 600 }}>{c.label}</span>
              <c.icon size={14} color={c.color} />
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 900, color: c.color }}>{cur} {c.value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t.id} className={`btn btn-sm ${tab === t.id ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {/* Daily Sales Tab */}
      {tab === 'daily' && (
        <div className="glass" style={{ borderRadius: 'var(--r-xl)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700 }}>Daily Sales Breakdown</span>
            <button className="btn btn-ghost btn-sm" onClick={exportDailyCSV}><Download size={13} /> Export CSV</button>
          </div>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Date</th><th>No. of Bills</th><th>Revenue</th><th>Tax</th><th>Net</th></tr></thead>
              <tbody>
                {dailyRows.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--txt3)' }}>No sales in this period</td></tr>
                ) : dailyRows.map(([date, d]) => (
                  <tr key={date}>
                    <td style={{ fontWeight: 600 }}>{date}</td>
                    <td><span className="badge badge-primary">{d.count}</span></td>
                    <td style={{ color: 'var(--cyan)', fontWeight: 700 }}>{cur} {d.sales.toLocaleString()}</td>
                    <td style={{ color: 'var(--amber)' }}>{cur} {d.tax.toLocaleString()}</td>
                    <td style={{ color: 'var(--emerald)', fontWeight: 700 }}>{cur} {(d.sales - d.tax).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top Products Tab */}
      {tab === 'products' && (
        <div className="glass" style={{ borderRadius: 'var(--r-xl)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontWeight: 700 }}>Top Products by Revenue (Actual Sales)</span>
          </div>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>#</th><th>Product</th><th>Units Sold</th><th>Revenue</th></tr></thead>
              <tbody>
                {topProducts.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40, color: 'var(--txt3)' }}>No sales data</td></tr>
                ) : topProducts.map((p, i) => (
                  <tr key={p.name}>
                    <td><span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--cyan-s)', color: 'var(--cyan)', fontSize: '0.72rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{i+1}</span></td>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td><span className="badge badge-success">{p.qty} units</span></td>
                    <td style={{ color: 'var(--cyan)', fontWeight: 700 }}>{cur} {p.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* GST Report Tab */}
      {tab === 'gst' && (
        <div className="glass" style={{ borderRadius: 'var(--r-xl)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontWeight: 700 }}>GST / Tax Report</span>
              <span className="badge badge-primary" style={{ marginLeft: 8, fontSize: '0.65rem' }}>GSTR-1 Format</span>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={exportGSTCSV}><Download size={13} /> Export CSV</button>
          </div>
          <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, borderBottom: '1px solid var(--border)' }}>
            <div><div style={{ fontSize: '0.7rem', color: 'var(--txt3)' }}>Taxable Amount</div><div style={{ fontWeight: 800, color: 'var(--cyan)' }}>{cur} {(totalRevenue - totalTax).toLocaleString()}</div></div>
            <div><div style={{ fontSize: '0.7rem', color: 'var(--txt3)' }}>Tax Collected ({settings.taxRate}%)</div><div style={{ fontWeight: 800, color: 'var(--amber)' }}>{cur} {totalTax.toLocaleString()}</div></div>
            <div><div style={{ fontSize: '0.7rem', color: 'var(--txt3)' }}>Total (incl. tax)</div><div style={{ fontWeight: 800 }}>{cur} {totalRevenue.toLocaleString()}</div></div>
          </div>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Date</th><th>Items</th><th>Subtotal</th><th>Tax</th><th>Total</th><th>Invoice</th></tr></thead>
              <tbody>
                {filteredTxns.filter(t => (t.tax || 0) > 0).length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--txt3)' }}>No taxed transactions in this period</td></tr>
                ) : filteredTxns.filter(t => (t.tax || 0) > 0).map(t => (
                  <tr key={t.id}>
                    <td style={{ color: 'var(--txt3)', fontSize: '0.8rem' }}>{t.date}</td>
                    <td style={{ fontSize: '0.75rem' }}>{t.items?.map(i => `${i.name} ×${i.qty}`).join(', ')}</td>
                    <td>{cur} {(t.subtotal || 0).toLocaleString()}</td>
                    <td style={{ color: 'var(--amber)', fontWeight: 700 }}>{cur} {(t.tax || 0).toLocaleString()}</td>
                    <td style={{ color: 'var(--cyan)', fontWeight: 700 }}>{cur} {(t.total || 0).toLocaleString()}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.68rem', color: 'var(--violet)' }} onClick={() => generateInvoicePDF(t, settings)}>
                        <Printer size={11} /> PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* P&L Tab */}
      {tab === 'pl' && (
        <div className="glass" style={{ borderRadius: 'var(--r-xl)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700 }}>Profit & Loss Statement</span>
            <button className="btn btn-ghost btn-sm" onClick={exportPLCSV}><Download size={13} /> Export CSV</button>
          </div>
          <div style={{ padding: 24, maxWidth: 600 }}>
            <div style={{ fontWeight: 700, color: 'var(--cyan)', marginBottom: 12, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: 1 }}>Income</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.9rem' }}><span>Total Sales Revenue</span><span style={{ fontWeight: 700 }}>{cur} {totalRevenue.toLocaleString()}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.85rem', color: 'var(--txt3)' }}><span>  - Total Discounts Given</span><span>- {cur} {filteredTxns.reduce((a,t)=>a+(t.discount||0),0).toLocaleString()}</span></div>
            <div style={{ height: 1, background: 'var(--border)', margin: '12px 0' }} />

            <div style={{ fontWeight: 700, color: 'var(--rose)', marginBottom: 12, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: 1 }}>Expenses</div>
            {Object.entries(filteredExp.reduce((acc,e) => { acc[e.category]=(acc[e.category]||0)+e.amount; return acc; }, {})).map(([cat, amt]) => (
              <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--txt2)' }}>{cat}</span>
                <span style={{ color: 'var(--rose)' }}>- {cur} {amt.toLocaleString()}</span>
              </div>
            ))}
            {filteredExp.length === 0 && <div style={{ color: 'var(--txt3)', fontSize: '0.82rem', marginBottom: 12 }}>No expenses recorded</div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontWeight: 700, fontSize: '0.9rem' }}><span>Total Expenses</span><span style={{ color: 'var(--rose)' }}>- {cur} {totalExpenses.toLocaleString()}</span></div>
            <div style={{ height: 2, background: 'var(--border2)', margin: '16px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 900 }}>
              <span>NET {netProfit >= 0 ? 'PROFIT' : 'LOSS'}</span>
              <span style={{ color: netProfit >= 0 ? 'var(--emerald)' : 'var(--rose)' }}>{cur} {Math.abs(netProfit).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

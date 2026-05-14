import React, { useState, useRef } from 'react';
import { Moon, DollarSign, TrendingDown, TrendingUp, Printer, Download, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';

const DENOMS_PKR = [5000, 1000, 500, 100, 50, 20, 10, 5, 2, 1];
const DENOMS_INR = [2000, 500, 200, 100, 50, 20, 10, 5, 2, 1];
const DENOMS_USD = [100, 50, 20, 10, 5, 1];

export default function EODReport() {
  const { data, stats, backupData } = useBusiness();
  const { transactions, expenses, settings, accounts } = data;
  const cur = settings.currency;

  // Determine denominations based on currency
  const DENOMS = cur.includes('$') ? DENOMS_USD : cur.includes('₹') ? DENOMS_INR : DENOMS_PKR;

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [counts, setCounts] = useState({});
  const [cashCountOpen, setCashCountOpen] = useState(false);
  const [eodSaved, setEodSaved] = useState(false);
  const printRef = useRef(null);

  // Date-filtered data
  const todayTxns  = transactions.filter(t => t.date === selectedDate);
  const todayExp   = expenses.filter(e => e.date === selectedDate);
  const totalSales = todayTxns.reduce((a, t) => a + (t.total || 0), 0);
  const cashSales  = todayTxns.reduce((a, t) => {
    const cash = t.payments?.find(p => p.method === 'cash');
    return a + (cash ? Number(cash.amount) : (t.paymentMethod === 'cash' ? t.total : 0));
  }, 0);
  const bankSales  = todayTxns.reduce((a, t) => {
    const bank = t.payments?.find(p => p.method === 'bank');
    return a + (bank ? Number(bank.amount) : (t.paymentMethod === 'bank' ? t.total : 0));
  }, 0);
  const khataSales = todayTxns.reduce((a, t) => {
    const khata = t.payments?.find(p => p.method === 'khata');
    return a + (khata ? Number(khata.amount) : (t.paymentMethod === 'khata' ? t.total : 0));
  }, 0);
  const totalExpenses = todayExp.reduce((a, e) => a + (e.amount || 0), 0);
  const netProfit = totalSales - totalExpenses;
  const totalItemsSold = todayTxns.reduce((a, t) => a + (t.items?.reduce((b, i) => b + i.qty, 0) || 0), 0);

  // Cash count
  const cashCountTotal = DENOMS.reduce((a, d) => a + d * (Number(counts[d]) || 0), 0);
  const difference = cashCountTotal - accounts.cash;

  // Top selling items today
  const itemMap = {};
  todayTxns.forEach(t => t.items?.forEach(i => {
    itemMap[i.name] = (itemMap[i.name] || 0) + i.qty;
  }));
  const topItems = Object.entries(itemMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const handlePrint = () => window.print();
  const handleSaveEOD = () => {
    backupData();
    setEodSaved(true);
    setTimeout(() => setEodSaved(false), 3000);
  };

  return (
    <div className="page-body anim-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">End-of-Day Report</h1>
          <div className="page-subtitle">Daily closing summary — cash count, sales & expenses</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="date" className="input" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={{ width: 160 }} />
          <button className="btn btn-ghost" onClick={handlePrint}><Printer size={15} /> Print</button>
          <button className="btn btn-primary" onClick={handleSaveEOD}>
            {eodSaved ? <><CheckCircle size={15} /> Saved!</> : <><Download size={15} /> Save & Backup</>}
          </button>
        </div>
      </div>

      <div ref={printRef} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Date & business header */}
        <div className="glass" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid var(--violet)' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--violet)' }}>{settings.businessName}</div>
            <div style={{ color: 'var(--txt3)', fontSize: '0.8rem' }}>EOD Report for <strong style={{ color: 'var(--txt)' }}>{selectedDate}</strong></div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '0.78rem', color: 'var(--txt3)' }}>
            <div>Generated: {new Date().toLocaleTimeString()}</div>
            <div>Cashier: {data.settings.users?.[0]?.name || 'Owner'}</div>
          </div>
        </div>

        {/* Sales Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {[
            { label: 'Total Sales', value: `${cur} ${totalSales.toLocaleString()}`, sub: `${todayTxns.length} transactions`, color: 'var(--cyan)', bg: 'var(--cyan-s)' },
            { label: 'Net Profit', value: `${cur} ${netProfit.toLocaleString()}`, sub: 'After expenses', color: netProfit >= 0 ? 'var(--emerald)' : 'var(--rose)', bg: netProfit >= 0 ? 'var(--emerald-s)' : 'var(--rose-s)' },
            { label: 'Total Expenses', value: `${cur} ${totalExpenses.toLocaleString()}`, sub: `${todayExp.length} entries`, color: 'var(--rose)', bg: 'var(--rose-s)' },
            { label: 'Items Sold', value: totalItemsSold, sub: 'Units across all txns', color: 'var(--amber)', bg: 'var(--amber-s)' },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: '18px', background: s.bg, border: `1px solid ${s.color}33` }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--txt3)', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontWeight: 900, fontSize: '1.3rem', color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--txt3)', marginTop: 4 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Payment breakdown */}
        <div className="glass" style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 16, fontSize: '0.95rem', color: 'var(--cyan)' }}>💳 Payment Method Breakdown</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {[
              { label: '💵 Cash', value: cashSales, color: 'var(--emerald)' },
              { label: '🏦 Bank Transfer', value: bankSales, color: 'var(--cyan)' },
              { label: '📒 Khata (Credit)', value: khataSales, color: 'var(--amber)' },
            ].map(p => (
              <div key={p.label} style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--txt3)', marginBottom: 6 }}>{p.label}</div>
                <div style={{ fontWeight: 800, fontSize: '1.15rem', color: p.color }}>{cur} {p.value.toLocaleString()}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--txt3)', marginTop: 4 }}>
                  {totalSales > 0 ? `${Math.round(p.value / totalSales * 100)}% of sales` : '0%'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2-col: Top items + Today's expenses */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Top items */}
          <div className="glass" style={{ padding: 24 }}>
            <h3 style={{ marginBottom: 14, fontSize: '0.95rem', color: 'var(--amber)' }}>🏆 Top Items Sold Today</h3>
            {topItems.length === 0 ? (
              <div style={{ color: 'var(--txt3)', fontSize: '0.82rem', textAlign: 'center', padding: 24 }}>No items sold today</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {topItems.map(([name, qty], i) => (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 22, height: 22, borderRadius: '50%', background: i === 0 ? 'var(--amber-s)' : 'var(--bg-input)', color: i === 0 ? 'var(--amber)' : 'var(--txt3)', fontSize: '0.72rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ flex: 1, fontSize: '0.85rem' }}>{name}</span>
                    <span style={{ fontWeight: 700, color: 'var(--amber)' }}>{qty} pcs</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Today's expenses */}
          <div className="glass" style={{ padding: 24 }}>
            <h3 style={{ marginBottom: 14, fontSize: '0.95rem', color: 'var(--rose)' }}>📉 Today's Expenses</h3>
            {todayExp.length === 0 ? (
              <div style={{ color: 'var(--txt3)', fontSize: '0.82rem', textAlign: 'center', padding: 24 }}>No expenses today</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {todayExp.map(e => (
                  <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <span style={{ fontWeight: 600 }}>{e.desc}</span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--txt3)', marginLeft: 6 }}>{e.category}</span>
                    </div>
                    <span style={{ color: 'var(--rose)', fontWeight: 700 }}>{cur} {e.amount?.toLocaleString()}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, paddingTop: 8 }}>
                  <span>Total</span>
                  <span style={{ color: 'var(--rose)' }}>{cur} {totalExpenses.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cash Counter */}
        <div className="glass" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: cashCountOpen ? 16 : 0 }} onClick={() => setCashCountOpen(o => !o)}>
            <h3 style={{ fontSize: '0.95rem', color: 'var(--emerald)', display: 'flex', alignItems: 'center', gap: 8 }}>
              💵 Cash Counter (Denomination Count)
            </h3>
            {cashCountOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
          {cashCountOpen && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10, marginBottom: 16 }}>
                {DENOMS.map(d => (
                  <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--bg-input)', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <span style={{ fontWeight: 700, minWidth: 50, color: 'var(--txt2)' }}>{cur}{d}</span>
                    <span style={{ color: 'var(--txt3)', fontSize: '0.75rem' }}>×</span>
                    <input
                      type="number"
                      className="input"
                      min="0"
                      style={{ width: 60, padding: '4px 8px', fontSize: '0.9rem', textAlign: 'center' }}
                      value={counts[d] || ''}
                      onChange={e => setCounts(prev => ({ ...prev, [d]: e.target.value }))}
                    />
                    <span style={{ fontSize: '0.72rem', color: 'var(--txt3)', minWidth: 60, textAlign: 'right' }}>
                      = {cur}{((Number(counts[d]) || 0) * d).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 20, padding: '12px 16px', borderRadius: 10, background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
                <div><div style={{ fontSize: '0.7rem', color: 'var(--txt3)' }}>COUNTED CASH</div><div style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--emerald)' }}>{cur} {cashCountTotal.toLocaleString()}</div></div>
                <div><div style={{ fontSize: '0.7rem', color: 'var(--txt3)' }}>SYSTEM CASH</div><div style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--cyan)' }}>{cur} {accounts.cash.toLocaleString()}</div></div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--txt3)' }}>DIFFERENCE</div>
                  <div style={{ fontWeight: 900, fontSize: '1.2rem', color: difference === 0 ? 'var(--emerald)' : 'var(--rose)' }}>
                    {difference >= 0 ? '+' : ''}{cur} {difference.toLocaleString()}
                  </div>
                </div>
                <div style={{ marginLeft: 'auto', alignSelf: 'center' }}>
                  {difference === 0 ? <span style={{ color: 'var(--emerald)', fontWeight: 700 }}>✅ Balanced!</span> : <span style={{ color: 'var(--rose)', fontWeight: 700 }}>⚠️ {difference > 0 ? 'Overage' : 'Shortage'}</span>}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Signature section */}
        <div className="glass" style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 16, fontSize: '0.88rem', color: 'var(--txt3)' }}>📝 EOD Confirmation</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
            {['Cashier Signature', 'Manager Signature', 'Date & Stamp'].map(label => (
              <div key={label} style={{ borderBottom: '2px dashed var(--border2)', paddingBottom: 24, textAlign: 'center', fontSize: '0.72rem', color: 'var(--txt3)', paddingTop: 40 }}>{label}</div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

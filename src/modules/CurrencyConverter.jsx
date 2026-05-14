import React, { useState, useEffect } from 'react';
import { RefreshCw, ArrowLeftRight, TrendingUp } from 'lucide-react';

const COMMON_CURRENCIES = [
  { code: 'PKR', symbol: 'Rs.', name: 'Pakistani Rupee' },
  { code: 'INR', symbol: '₹',   name: 'Indian Rupee' },
  { code: 'USD', symbol: '$',   name: 'US Dollar' },
  { code: 'EUR', symbol: '€',   name: 'Euro' },
  { code: 'GBP', symbol: '£',   name: 'British Pound' },
  { code: 'AED', symbol: 'AED ', name: 'UAE Dirham' },
  { code: 'SAR', symbol: 'SAR ', name: 'Saudi Riyal' },
  { code: 'BDT', symbol: '৳',   name: 'Bangladeshi Taka' },
  { code: 'CNY', symbol: '¥',   name: 'Chinese Yuan' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$',  name: 'Australian Dollar' },
  { code: 'MYR', symbol: 'RM',  name: 'Malaysian Ringgit' },
  { code: 'SGD', symbol: 'S$',  name: 'Singapore Dollar' },
  { code: 'TRY', symbol: '₺',   name: 'Turkish Lira' },
  { code: 'OMR', symbol: 'OMR ', name: 'Omani Rial' },
];

// Static fallback rates relative to USD (approximate)
const STATIC_RATES = {
  PKR: 278, INR: 83, USD: 1, EUR: 0.92, GBP: 0.79,
  AED: 3.67, SAR: 3.75, BDT: 110, CNY: 7.24,
  CAD: 1.37, AUD: 1.53, MYR: 4.72, SGD: 1.35,
  TRY: 32.5, OMR: 0.385,
};

function convertRate(amount, from, to) {
  if (from === to) return amount;
  const usd = amount / (STATIC_RATES[from] || 1);
  return usd * (STATIC_RATES[to] || 1);
}

export default function CurrencyConverter() {
  const [amount, setAmount] = useState('1000');
  const [from, setFrom] = useState('PKR');
  const [to, setTo] = useState('USD');
  const [results, setResults] = useState({});
  const [lastUpdated] = useState(new Date().toLocaleDateString());

  const result = convertRate(Number(amount) || 0, from, to);

  // Calculate against all currencies
  useEffect(() => {
    const out = {};
    COMMON_CURRENCIES.forEach(c => {
      out[c.code] = convertRate(Number(amount) || 0, from, c.code);
    });
    setResults(out);
  }, [amount, from]);

  const swap = () => { setFrom(to); setTo(from); };

  const fromCur = COMMON_CURRENCIES.find(c => c.code === from);
  const toCur = COMMON_CURRENCIES.find(c => c.code === to);

  return (
    <div className="page-body anim-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Currency Converter</h1>
          <div className="page-subtitle">Multi-currency conversion — {COMMON_CURRENCIES.length} currencies supported</div>
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--txt3)', alignSelf: 'center' }}>
          📅 Rates as of: {lastUpdated} <span style={{ color: 'var(--amber)' }}>(approximate static rates)</span>
        </div>
      </div>

      {/* Main converter */}
      <div className="glass" style={{ padding: 32, marginBottom: 24, maxWidth: 680, margin: '0 auto 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, alignItems: 'end', marginBottom: 24 }}>
          {/* From */}
          <div className="input-wrap">
            <label className="input-label">From</label>
            <select className="input" value={from} onChange={e => setFrom(e.target.value)}>
              {COMMON_CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
            </select>
          </div>
          {/* Swap */}
          <button className="btn btn-ghost btn-icon" onClick={swap} style={{ marginBottom: 4, color: 'var(--cyan)', border: '1px solid var(--cyan-g)', background: 'var(--cyan-s)' }}>
            <ArrowLeftRight size={18} />
          </button>
          {/* To */}
          <div className="input-wrap">
            <label className="input-label">To</label>
            <select className="input" value={to} onChange={e => setTo(e.target.value)}>
              {COMMON_CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
            </select>
          </div>
        </div>

        {/* Amount input */}
        <div className="input-wrap" style={{ marginBottom: 20 }}>
          <label className="input-label">Amount</label>
          <input className="input" type="number" value={amount} onChange={e => setAmount(e.target.value)}
            style={{ fontSize: '1.5rem', fontWeight: 700, textAlign: 'center', height: 56 }}
            placeholder="Enter amount" />
        </div>

        {/* Result */}
        <div style={{ textAlign: 'center', padding: '24px 20px', borderRadius: 14, background: 'linear-gradient(135deg, rgba(0,200,240,0.08), rgba(139,92,246,0.08))', border: '1px solid var(--cyan-g)' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--txt3)', marginBottom: 8 }}>
            {fromCur?.symbol}{Number(amount || 0).toLocaleString()} {from} =
          </div>
          <div style={{ fontWeight: 900, fontSize: '2.5rem', color: 'var(--cyan)', letterSpacing: '-0.02em' }}>
            {toCur?.symbol}{result.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--txt3)', marginTop: 8 }}>
            1 {from} = {toCur?.symbol}{convertRate(1, from, to).toFixed(4)} {to}
          </div>
        </div>

        {/* Common conversions */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16, justifyContent: 'center' }}>
          {[100, 500, 1000, 5000, 10000].map(v => (
            <button key={v} className={`btn btn-sm ${Number(amount) === v ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setAmount(String(v))} style={{ fontSize: '0.75rem' }}>
              {v.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      {/* All currencies table */}
      <div className="glass" style={{ borderRadius: 'var(--r-xl)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrendingUp size={16} color="var(--violet)" />
          <span style={{ fontWeight: 700 }}>All Exchange Rates — {fromCur?.symbol}{Number(amount || 0).toLocaleString()} {from}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 0 }}>
          {COMMON_CURRENCIES.filter(c => c.code !== from).map((c, i) => {
            const val = results[c.code] || 0;
            const isTo = c.code === to;
            return (
              <div key={c.code}
                onClick={() => setTo(c.code)}
                style={{
                  padding: '14px 20px', cursor: 'pointer', transition: 'all 0.15s',
                  background: isTo ? 'rgba(0,200,240,0.08)' : i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
                  borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)',
                  borderLeft: isTo ? '3px solid var(--cyan)' : '3px solid transparent',
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: isTo ? 'var(--cyan)' : 'var(--txt)' }}>{c.code}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--txt3)' }}>{c.name}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: isTo ? 'var(--cyan)' : 'var(--txt)' }}>
                      {c.symbol}{val.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--txt3)' }}>
                      1 {from} = {c.symbol}{convertRate(1, from, c.code).toFixed(4)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

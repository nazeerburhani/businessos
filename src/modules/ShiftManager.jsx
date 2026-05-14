import React, { useState } from 'react';
import { Clock, Play, Square, DollarSign, TrendingUp, TrendingDown, CheckCircle, AlertTriangle, Printer } from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import Modal from '../components/Modal';

export default function ShiftManager() {
  const { data, saveSettings, backupData } = useBusiness();
  const { settings, transactions, expenses } = data;
  const cur = settings.currency;

  const shift = settings.currentShift || null;
  const [openModal, setOpenModal] = useState(false);
  const [closeModal, setCloseModal] = useState(false);
  const [startCash, setStartCash] = useState('');
  const [closingNote, setClosingNote] = useState('');
  const [closingCash, setClosingCash] = useState('');
  const pastShifts = settings.shiftHistory || [];

  const openShift = () => {
    const s = {
      id: Date.now(),
      openedAt: new Date().toISOString(),
      startCash: Number(startCash) || 0,
      openedBy: settings.users?.[0]?.name || 'Owner',
    };
    saveSettings({ currentShift: s });
    setOpenModal(false);
    setStartCash('');
  };

  const closeShift = () => {
    if (!shift) return;
    const now = new Date();
    const shiftStart = new Date(shift.openedAt);

    // Calculate shift totals from transactions during shift period
    const shiftTxns = transactions.filter(t => new Date(t.timestamp || t.date) >= shiftStart);
    const shiftExp = expenses.filter(e => new Date(e.date) >= shiftStart.toISOString().split('T')[0]);
    const totalSales = shiftTxns.reduce((a, t) => a + (t.total || 0), 0);
    const cashSales = shiftTxns.reduce((a, t) => {
      const cash = t.payments?.find(p => p.method === 'cash');
      return a + (cash ? Number(cash.amount) : (t.paymentMethod === 'cash' ? t.total : 0));
    }, 0);
    const totalExp = shiftExp.reduce((a, e) => a + (e.amount || 0), 0);
    const expectedCash = shift.startCash + cashSales - totalExp;
    const actualCash = Number(closingCash) || 0;
    const variance = actualCash - expectedCash;
    const durationMs = now - shiftStart;
    const hrs = Math.floor(durationMs / 3600000);
    const mins = Math.floor((durationMs % 3600000) / 60000);

    const closed = {
      ...shift,
      closedAt: now.toISOString(),
      closingNote,
      startCash: shift.startCash,
      closingCash: actualCash,
      totalSales,
      cashSales,
      totalExpenses: totalExp,
      netProfit: totalSales - totalExp,
      expectedCash,
      variance,
      txnCount: shiftTxns.length,
      duration: `${hrs}h ${mins}m`,
    };

    saveSettings({
      currentShift: null,
      shiftHistory: [closed, ...pastShifts].slice(0, 20),
    });
    backupData();
    setCloseModal(false);
    setClosingNote('');
    setClosingCash('');
  };

  const shiftStart = shift ? new Date(shift.openedAt) : null;
  const durationLive = shiftStart ? (() => {
    const ms = Date.now() - shiftStart;
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return `${h}h ${m}m`;
  })() : null;

  // Live shift stats
  const liveShiftTxns = shift ? transactions.filter(t => new Date(t.timestamp || `${t.date}T00:00:00`) >= shiftStart) : [];
  const liveSales = liveShiftTxns.reduce((a, t) => a + (t.total || 0), 0);

  return (
    <div className="page-body anim-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Shift Management</h1>
          <div className="page-subtitle">Track daily shifts — opening cash, sales, closing balance</div>
        </div>
        {!shift ? (
          <button className="btn btn-primary" onClick={() => setOpenModal(true)}>
            <Play size={15} /> Open Shift
          </button>
        ) : (
          <button className="btn" style={{ background: 'var(--rose)', color: '#fff' }} onClick={() => setCloseModal(true)}>
            <Square size={15} /> Close Shift
          </button>
        )}
      </div>

      {/* Current Shift Status */}
      {shift ? (
        <div className="glass" style={{ padding: 28, marginBottom: 24, borderLeft: '4px solid var(--emerald)', background: 'rgba(16,185,129,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--emerald)', boxShadow: '0 0 12px var(--emerald)', animation: 'pulse 2s infinite' }} />
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--emerald)' }}>Shift ACTIVE</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--txt3)' }}>Opened by {shift.openedBy} at {shiftStart?.toLocaleTimeString()} · {durationLive} ago</div>
              </div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--emerald)' }}>{durationLive}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {[
              { label: 'Opening Cash', value: `${cur} ${shift.startCash.toLocaleString()}`, color: 'var(--txt)' },
              { label: 'Sales This Shift', value: `${cur} ${liveSales.toLocaleString()}`, color: 'var(--cyan)' },
              { label: 'Transactions', value: liveShiftTxns.length, color: 'var(--violet)' },
              { label: 'Expected Cash', value: `${cur} ${(shift.startCash + liveSales).toLocaleString()}`, color: 'var(--emerald)' },
            ].map(s => (
              <div key={s.label} style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--bg-input)' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--txt3)', marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="glass" style={{ padding: 28, marginBottom: 24, textAlign: 'center', borderLeft: '4px solid var(--border)' }}>
          <Clock size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
          <div style={{ fontWeight: 700, color: 'var(--txt2)' }}>No active shift</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--txt3)', marginTop: 4 }}>Open a shift to start tracking sales and cash balance</div>
        </div>
      )}

      {/* Shift History */}
      {pastShifts.length > 0 && (
        <div className="glass" style={{ borderRadius: 'var(--r-xl)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700 }}>📋 Shift History</div>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Date</th><th>By</th><th>Duration</th><th>Opening</th><th>Sales</th><th>Expenses</th><th>Net Profit</th><th>Cash Variance</th><th>Txns</th></tr></thead>
              <tbody>
                {pastShifts.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontSize: '0.78rem', color: 'var(--txt3)' }}>{new Date(s.openedAt).toLocaleDateString()}<br /><span style={{ fontSize: '0.65rem' }}>{new Date(s.openedAt).toLocaleTimeString()}</span></td>
                    <td style={{ fontWeight: 600 }}>{s.openedBy}</td>
                    <td style={{ color: 'var(--txt2)' }}>{s.duration}</td>
                    <td>{cur} {s.startCash?.toLocaleString()}</td>
                    <td style={{ color: 'var(--cyan)', fontWeight: 700 }}>{cur} {s.totalSales?.toLocaleString()}</td>
                    <td style={{ color: 'var(--rose)' }}>{cur} {s.totalExpenses?.toLocaleString()}</td>
                    <td style={{ fontWeight: 800, color: s.netProfit >= 0 ? 'var(--emerald)' : 'var(--rose)' }}>{cur} {s.netProfit?.toLocaleString()}</td>
                    <td>
                      <span style={{ fontWeight: 700, color: s.variance === 0 ? 'var(--emerald)' : s.variance > 0 ? 'var(--amber)' : 'var(--rose)' }}>
                        {s.variance >= 0 ? '+' : ''}{cur} {s.variance?.toLocaleString()}
                      </span>
                    </td>
                    <td>{s.txnCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Open Shift Modal */}
      <Modal isOpen={openModal} onClose={() => setOpenModal(false)} title="🟢 Open New Shift">
        <div className="modal-body">
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: '3rem' }}>🏪</div>
            <div style={{ fontWeight: 700, marginTop: 8 }}>Starting a new shift for {new Date().toLocaleDateString()}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--txt3)', marginTop: 4 }}>Enter the opening cash in drawer</div>
          </div>
          <div className="input-wrap">
            <label className="input-label">Opening Cash in Drawer ({cur})</label>
            <input className="input" type="number" min="0" value={startCash} onChange={e => setStartCash(e.target.value)}
              placeholder="e.g. 5000" autoFocus style={{ fontSize: '1.4rem', textAlign: 'center', fontWeight: 700 }} />
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={() => setOpenModal(false)}>Cancel</button>
          <button className="btn btn-success" onClick={openShift}><Play size={14} /> Open Shift</button>
        </div>
      </Modal>

      {/* Close Shift Modal */}
      <Modal isOpen={closeModal} onClose={() => setCloseModal(false)} title="🔴 Close Shift" wide>
        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
            {[
              { label: 'Duration', value: durationLive, color: 'var(--txt)' },
              { label: 'Total Sales', value: `${cur} ${liveSales.toLocaleString()}`, color: 'var(--cyan)' },
              { label: 'Opening Cash', value: `${cur} ${(shift?.startCash || 0).toLocaleString()}`, color: 'var(--txt)' },
              { label: 'Expected in Drawer', value: `${cur} ${(shift?.startCash + liveSales || 0).toLocaleString()}`, color: 'var(--emerald)' },
            ].map(s => (
              <div key={s.label} style={{ padding: '12px 14px', borderRadius: 10, background: 'var(--bg-input)' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--txt3)' }}>{s.label}</div>
                <div style={{ fontWeight: 800, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
          <div className="form-grid">
            <div className="input-wrap">
              <label className="input-label">Actual Cash Counted ({cur})</label>
              <input className="input" type="number" min="0" value={closingCash} onChange={e => setClosingCash(e.target.value)} placeholder="Count drawer cash" autoFocus />
              {closingCash && shift && (
                <div style={{ marginTop: 6, fontSize: '0.8rem', fontWeight: 700, color: (Number(closingCash) - shift.startCash - liveSales) === 0 ? 'var(--emerald)' : 'var(--amber)' }}>
                  Variance: {cur} {(Number(closingCash) - (shift?.startCash || 0) - liveSales).toLocaleString()}
                </div>
              )}
            </div>
            <div className="input-wrap">
              <label className="input-label">Closing Note</label>
              <input className="input" value={closingNote} onChange={e => setClosingNote(e.target.value)} placeholder="Any notes..." />
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={() => setCloseModal(false)}>Cancel</button>
          <button className="btn" style={{ background: 'var(--rose)', color: '#fff' }} onClick={closeShift}><Square size={14} /> Close & Save Shift</button>
        </div>
      </Modal>
    </div>
  );
}

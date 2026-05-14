import React, { useState } from 'react';
import { CreditCard, Plus, Trash2, Filter } from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import Modal from '../components/Modal';

const CATEGORIES = ['Rent', 'Utilities', 'Payroll', 'Stock Purchase', 'Marketing', 'Maintenance', 'Transport', 'Office', 'Other'];
const emptyForm = { desc: '', amount: '', category: 'Other', date: new Date().toISOString().split('T')[0], paymentMethod: 'Cash', notes: '', recurring: false };

export default function Expenses() {
  const { data, saveExpense, deleteExpense } = useBusiness();
  const { expenses, settings } = data;
  const cur = settings.currency;
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [catFilter, setCatFilter] = useState('All');
  const [monthFilter, setMonthFilter] = useState('');

  const filtered = expenses.filter(e => {
    const matchC = catFilter === 'All' || e.category === catFilter;
    const matchM = !monthFilter || e.date?.startsWith(monthFilter);
    return matchC && matchM;
  });

  const total = filtered.reduce((a, e) => a + (e.amount || 0), 0);

  const catTotals = CATEGORIES.map(c => ({
    name: c,
    total: expenses.filter(e => e.category === c).reduce((a, e) => a + (e.amount || 0), 0)
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

  const handleSave = (e) => {
    e.preventDefault();
    saveExpense({ ...form, amount: Number(form.amount) });
    setModal(false);
    setForm(emptyForm);
  };

  return (
    <div className="page-body anim-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Expenses</h1>
          <div className="page-subtitle">{expenses.length} total entries</div>
        </div>
        <button className="btn btn-danger" onClick={() => { setForm(emptyForm); setModal(true); }}><Plus size={16} /> Log Expense</button>
      </div>

      {/* Category breakdown */}
      {catTotals.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
          {catTotals.map(c => (
            <div key={c.name} className="card" style={{ padding: '14px 16px', cursor: 'pointer', borderLeft: '3px solid var(--rose)' }} onClick={() => setCatFilter(c.name === catFilter ? 'All' : c.name)}>
              <div style={{ fontSize: '0.7rem', color: 'var(--txt3)', marginBottom: 4 }}>{c.name}</div>
              <div style={{ fontWeight: 700, color: 'var(--rose)' }}>{cur} {c.total?.toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <select className="select-input" style={{ width: 160 }} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="All">All Categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <input className="input" type="month" style={{ width: 160 }} value={monthFilter} onChange={e => setMonthFilter(e.target.value)} />
        {(catFilter !== 'All' || monthFilter) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setCatFilter('All'); setMonthFilter(''); }}>Clear</button>
        )}
        <div style={{ marginLeft: 'auto', fontWeight: 700, color: 'var(--rose)' }}>Total: {cur} {total.toLocaleString()}</div>
      </div>

      {filtered.length === 0 ? (
        <div className="glass empty-state" style={{ padding: 60 }}>
          <CreditCard size={48} /><p>No expenses found. Click "Log Expense" to add one.</p>
        </div>
      ) : (
        <div className="glass tbl-wrap">
          <table className="tbl">
            <thead>
              <tr><th>Date</th><th>Description</th><th>Category</th><th>Payment</th><th>Amount</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.id}>
                  <td style={{ color: 'var(--txt3)', fontSize: '0.8rem' }}>{e.date}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 500 }}>{e.desc}</span>
                      {e.recurring && <span style={{ fontSize: '0.6rem', padding: '1px 5px', borderRadius: 4, background: 'var(--cyan-s)', color: 'var(--cyan)', fontWeight: 700 }}>🔄 Monthly</span>}
                    </div>
                    {e.notes && <div style={{ fontSize: '0.72rem', color: 'var(--txt3)' }}>{e.notes}</div>}
                  </td>
                  <td><span className="badge badge-warning">{e.category}</span></td>
                  <td style={{ color: 'var(--txt3)', fontSize: '0.8rem' }}>{e.paymentMethod || 'Cash'}</td>
                  <td style={{ fontWeight: 700, color: 'var(--rose)' }}>-{cur} {e.amount?.toLocaleString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {e.recurring && (
                        <button className="btn btn-ghost btn-sm btn-icon" title="Repeat this expense" style={{ color: 'var(--cyan)' }} onClick={() => { setForm({ ...e, id: undefined, date: new Date().toISOString().split('T')[0] }); setModal(true); }}>↻</button>
                      )}
                      <button className="btn btn-sm btn-icon" style={{ background: 'var(--rose-s)', border: '1px solid var(--rose-g)', color: 'var(--rose)' }} onClick={() => deleteExpense(e.id)}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Log Expense">
        <form onSubmit={handleSave}>
          <div className="modal-body">
            <div className="input-wrap">
              <label className="input-label">Description *</label>
              <input className="input" required value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} placeholder="e.g. Monthly shop rent" />
            </div>
            <div className="form-grid">
              <div className="input-wrap">
                <label className="input-label">Amount ({cur}) *</label>
                <input className="input" type="number" required min="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div className="input-wrap">
                <label className="input-label">Category</label>
                <select className="select-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="input-wrap">
                <label className="input-label">Date</label>
                <input className="input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="input-wrap">
                <label className="input-label">Payment Method</label>
                <select className="select-input" value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })}>
                  <option>Cash</option><option>Card</option><option>Online</option><option>Cheque</option>
                </select>
              </div>
            </div>
            <div className="input-wrap">
              <label className="input-label">Notes (Optional)</label>
              <textarea className="textarea-input" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0' }}>
              <input type="checkbox" id="recurring-chk" checked={form.recurring || false} onChange={e => setForm({ ...form, recurring: e.target.checked })} style={{ width: 16, height: 16, cursor: 'pointer' }} />
              <label htmlFor="recurring-chk" style={{ cursor: 'pointer', fontSize: '0.85rem' }}>🔄 Mark as Monthly Recurring (e.g. Rent, Utilities)</label>
            </div>
          </div>
          <div className="modal-foot">
            <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-danger">Log Expense</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

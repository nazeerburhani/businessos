import React, { useState } from 'react';
import { BookOpen, Plus, Trash2, Phone, TrendingUp, TrendingDown, Eye, User } from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import Modal from '../components/Modal';

const emptyCustomer = { name: '', phone: '', email: '', address: '', creditLimit: '' };

export default function Khata() {
  const { data, saveKhataCustomer, deleteKhataCustomer, addKhataEntry } = useBusiness();
  const { khata, settings } = data;
  const cur = settings.currency;
  const [search, setSearch] = useState('');
  const [custModal, setCustModal] = useState(false);
  const [custForm, setCustForm] = useState(emptyCustomer);
  const [txnModal, setTxnModal] = useState(null); // { customer, type }
  const [ledgerModal, setLedgerModal] = useState(null);
  const [txnForm, setTxnForm] = useState({ amount: '', desc: '', date: new Date().toISOString().split('T')[0] });

  const filtered = khata.filter(k => k.name?.toLowerCase().includes(search.toLowerCase()) || k.phone?.includes(search));
  const totalDebt = khata.reduce((a, k) => a + (k.balance > 0 ? k.balance : 0), 0);
  const totalCredit = khata.reduce((a, k) => a + (k.balance < 0 ? Math.abs(k.balance) : 0), 0);

  const openCust = (c) => { setCustForm(c ? { ...c } : emptyCustomer); setCustModal(true); };
  const saveCust = (e) => { e.preventDefault(); saveKhataCustomer({ ...custForm, creditLimit: Number(custForm.creditLimit) || 0 }); setCustModal(false); };

  const openTxn = (customer, type) => { setTxnForm({ amount: '', desc: '', date: new Date().toISOString().split('T')[0] }); setTxnModal({ customer, type }); };
  const saveTxn = (e) => {
    e.preventDefault();
    addKhataEntry(txnModal.customer.id, txnForm.amount, txnModal.type, txnForm.desc);
    setTxnModal(null);
  };

  const initials = (name) => name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '??';

  return (
    <div className="page-body anim-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Khata Ledger</h1>
          <div className="page-subtitle">{khata.length} customers · {cur} {totalDebt.toLocaleString()} outstanding</div>
        </div>
        <button className="btn btn-primary" onClick={() => openCust(null)}><Plus size={16} /> Add Customer</button>
      </div>

      {/* Summary Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--txt3)', marginBottom: 6 }}>Total Customers</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{khata.length}</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--rose)', marginBottom: 6 }}>Total Outstanding (Debt)</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--rose)' }}>{cur} {totalDebt.toLocaleString()}</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--emerald)', marginBottom: 6 }}>Total Advance (Credit)</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--emerald)' }}>{cur} {totalCredit.toLocaleString()}</div>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <input className="input" style={{ maxWidth: 360 }} placeholder="Search by name or phone…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="glass empty-state" style={{ padding: 60 }}>
          <BookOpen size={48} />
          <p>No customers yet. Add a customer to start tracking credit.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {filtered.map(c => (
            <div key={c.id} className="card khata-card">
              {/* Header */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 16 }}>
                <div className="khata-avatar">{initials(c.name)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{c.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--txt3)' }}>{c.phone}</div>
                  {c.email && <div style={{ fontSize: '0.75rem', color: 'var(--txt3)' }}>{c.email}</div>}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div className={c.balance > 0 ? 'khata-balance-positive' : c.balance < 0 ? 'khata-balance-negative' : ''} style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                    {cur} {Math.abs(c.balance).toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--txt3)' }}>{c.balance > 0 ? 'OWES YOU' : c.balance < 0 ? 'YOU OWE' : 'SETTLED'}</div>
                  {c.creditLimit > 0 && <div style={{ fontSize: '0.65rem', color: 'var(--txt3)' }}>Limit: {cur} {c.creditLimit?.toLocaleString()}</div>}
                </div>
              </div>

              {/* Recent History */}
              <div style={{ marginBottom: 14, minHeight: 48 }}>
                {c.history?.slice(0, 3).map(h => (
                  <div key={h.id} className="txn-row">
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 500 }}>{h.desc}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--txt3)' }}>{h.date}</div>
                    </div>
                    <span style={{ fontWeight: 700, color: h.type === 'debt' ? 'var(--rose)' : 'var(--emerald)', fontSize: '0.85rem' }}>
                      {h.type === 'debt' ? '+' : '-'}{cur} {h.amount?.toLocaleString()}
                    </span>
                  </div>
                ))}
                {(!c.history || c.history.length === 0) && <div style={{ color: 'var(--txt3)', fontSize: '0.8rem', padding: '8px 0' }}>No transactions yet</div>}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-sm" style={{ flex: 1, background: 'var(--rose-s)', border: '1px solid var(--rose-g)', color: 'var(--rose)' }} onClick={() => openTxn(c, 'debt')}>
                  <TrendingUp size={13} /> Give Credit
                </button>
                <button className="btn btn-sm" style={{ flex: 1, background: 'var(--emerald-s)', border: '1px solid var(--emerald-g)', color: 'var(--emerald)' }} onClick={() => openTxn(c, 'payment')}>
                  <TrendingDown size={13} /> Received
                </button>
                {c.history?.length > 3 && (
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setLedgerModal(c)}><Eye size={14} /></button>
                )}
                {c.phone && (
                  <button className="btn btn-sm btn-icon" style={{ background: '#1a3d2b', border: '1px solid #25D36655', color: '#25D366' }} onClick={() => window.open(`https://wa.me/${c.phone.replace(/\D/g, '')}?text=Dear ${c.name}, your current balance is ${cur} ${Math.abs(c.balance).toLocaleString()}. Developed by Nazeer Ahmad.`)}>
                    <Phone size={13} />
                  </button>
                )}
                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => { deleteKhataCustomer(c.id); }}><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Customer Modal */}
      <Modal isOpen={custModal} onClose={() => setCustModal(false)} title={custForm.id ? 'Edit Customer' : 'Add Customer'}>
        <form onSubmit={saveCust}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="input-wrap" style={{ gridColumn: '1/-1' }}>
                <label className="input-label">Full Name *</label>
                <input className="input" required value={custForm.name} onChange={e => setCustForm({ ...custForm, name: e.target.value })} placeholder="Customer full name" />
              </div>
              <div className="input-wrap">
                <label className="input-label">Phone Number</label>
                <input className="input" value={custForm.phone} onChange={e => setCustForm({ ...custForm, phone: e.target.value })} placeholder="03XXXXXXXXX" />
              </div>
              <div className="input-wrap">
                <label className="input-label">Email</label>
                <input className="input" type="email" value={custForm.email} onChange={e => setCustForm({ ...custForm, email: e.target.value })} placeholder="email@example.com" />
              </div>
              <div className="input-wrap">
                <label className="input-label">Credit Limit ({cur})</label>
                <input className="input" type="number" min="0" value={custForm.creditLimit} onChange={e => setCustForm({ ...custForm, creditLimit: e.target.value })} placeholder="0 = unlimited" />
              </div>
              <div className="input-wrap">
                <label className="input-label">Address</label>
                <input className="input" value={custForm.address} onChange={e => setCustForm({ ...custForm, address: e.target.value })} placeholder="Optional" />
              </div>
            </div>
          </div>
          <div className="modal-foot">
            <button type="button" className="btn btn-ghost" onClick={() => setCustModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">{custForm.id ? 'Update' : 'Add Customer'}</button>
          </div>
        </form>
      </Modal>

      {/* Transaction Modal */}
      <Modal isOpen={!!txnModal} onClose={() => setTxnModal(null)} title={txnModal?.type === 'debt' ? `Give Credit — ${txnModal?.customer?.name}` : `Record Payment — ${txnModal?.customer?.name}`}>
        <form onSubmit={saveTxn}>
          <div className="modal-body">
            <div style={{ padding: '12px 16px', borderRadius: 'var(--r)', background: txnModal?.type === 'debt' ? 'var(--rose-s)' : 'var(--emerald-s)', border: `1px solid ${txnModal?.type === 'debt' ? 'var(--rose-g)' : 'var(--emerald-g)'}`, marginBottom: 4 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--txt3)' }}>Current Balance</div>
              <div style={{ fontWeight: 800, fontSize: '1.2rem', color: txnModal?.customer?.balance > 0 ? 'var(--rose)' : 'var(--emerald)' }}>
                {cur} {Math.abs(txnModal?.customer?.balance || 0).toLocaleString()}
              </div>
            </div>
            <div className="input-wrap">
              <label className="input-label">Amount ({cur}) *</label>
              <input className="input" type="number" required min="1" autoFocus value={txnForm.amount} onChange={e => setTxnForm({ ...txnForm, amount: e.target.value })} placeholder="Enter amount" />
            </div>
            <div className="input-wrap">
              <label className="input-label">Date</label>
              <input className="input" type="date" value={txnForm.date} onChange={e => setTxnForm({ ...txnForm, date: e.target.value })} />
            </div>
            <div className="input-wrap">
              <label className="input-label">Description / Memo</label>
              <textarea className="textarea-input" rows={3} value={txnForm.desc} onChange={e => setTxnForm({ ...txnForm, desc: e.target.value })} placeholder="What is this for?" />
            </div>
          </div>
          <div className="modal-foot">
            <button type="button" className="btn btn-ghost" onClick={() => setTxnModal(null)}>Cancel</button>
            <button type="submit" className="btn" style={{ background: txnModal?.type === 'debt' ? 'var(--rose)' : 'var(--emerald)', color: txnModal?.type === 'debt' ? '#fff' : '#000' }}>
              {txnModal?.type === 'debt' ? 'Record Debt' : 'Record Payment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Full Ledger Modal */}
      <Modal isOpen={!!ledgerModal} onClose={() => setLedgerModal(null)} title={`Full Ledger — ${ledgerModal?.name}`} wide>
        <div className="modal-body">
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Date</th><th>Description</th><th>Type</th><th>Amount</th></tr></thead>
              <tbody>
                {ledgerModal?.history?.map(h => (
                  <tr key={h.id}>
                    <td style={{ color: 'var(--txt3)', fontSize: '0.8rem' }}>{h.date}</td>
                    <td>{h.desc}</td>
                    <td><span className={`badge ${h.type === 'debt' ? 'badge-danger' : 'badge-success'}`}>{h.type === 'debt' ? 'Credit Given' : 'Payment'}</span></td>
                    <td style={{ fontWeight: 700, color: h.type === 'debt' ? 'var(--rose)' : 'var(--emerald)' }}>
                      {h.type === 'debt' ? '+' : '-'}{cur} {h.amount?.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={() => setLedgerModal(null)}>Close</button>
        </div>
      </Modal>
    </div>
  );
}

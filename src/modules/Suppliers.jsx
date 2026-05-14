import React, { useState } from 'react';
import { Truck, Plus, Trash2, Search, Phone, Mail, DollarSign, ArrowDownLeft, ArrowUpRight, FileText, CheckCircle } from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import Modal from '../components/Modal';

export default function Suppliers() {
  const { data, saveSupplier, deleteSupplier, saveSettings } = useBusiness();
  const { suppliers, settings } = data;
  const cur = settings.currency;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSup, setCurrentSup] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [payModal, setPayModal] = useState(null);
  const [payForm, setPayForm] = useState({ amount: '', note: '', date: new Date().toISOString().split('T')[0] });
  const [ledger, setLedger] = useState(null);

  // Save payment against supplier balance
  const recordPayment = (e) => {
    e.preventDefault();
    const amt = Number(payForm.amount);
    if (!amt) return;
    const updated = {
      ...payModal,
      balance: (payModal.balance || 0) - amt,
      payments: [
        { id: Date.now(), date: payForm.date, amount: amt, note: payForm.note },
        ...(payModal.payments || [])
      ]
    };
    saveSupplier(updated);
    setPayModal(null);
    setPayForm({ amount: '', note: '', date: new Date().toISOString().split('T')[0] });
  };

  // Add purchase debt to supplier (when recording a purchase manually)
  const addDebt = (sup, amount, note) => {
    saveSupplier({ ...sup, balance: (sup.balance || 0) + amount, payments: [{ id: Date.now(), date: new Date().toISOString().split('T')[0], amount: -amount, note: note || 'Purchase' }, ...(sup.payments || [])] });
  };

  const handleSave = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const sup = {
      id: currentSup?.id,
      name: formData.get('name'),
      company: formData.get('company'),
      phone: formData.get('phone'),
      email: formData.get('email'),
      address: formData.get('address'),
      category: formData.get('category'),
      balance: currentSup?.balance || 0,
      payments: currentSup?.payments || [],
    };
    saveSupplier(sup);
    setIsModalOpen(false);
  };

  const filtered = (suppliers || []).filter(s =>
    s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalOwed = suppliers.reduce((a, s) => a + Math.max(0, s.balance || 0), 0);

  return (
    <div className="page-body anim-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Supplier Management</h1>
          <div className="page-subtitle">{suppliers.length} suppliers · {cur} {totalOwed.toLocaleString()} outstanding</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setCurrentSup(null); setIsModalOpen(true); }}>
          <Plus size={18} /> Add Supplier
        </button>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Total Suppliers', value: suppliers.length, color: 'var(--cyan)' },
          { label: 'Amount Owed', value: `${cur} ${totalOwed.toLocaleString()}`, color: 'var(--rose)' },
          { label: 'Paid Up', value: suppliers.filter(s => (s.balance || 0) <= 0).length, color: 'var(--emerald)' },
        ].map(s => (
          <div key={s.label} className="glass" style={{ padding: '14px 18px', borderRadius: 12 }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--txt3)' }}>{s.label}</div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="glass" style={{ padding: 12, marginBottom: 20 }}>
        <div className="search-box">
          <Search size={18} color="var(--txt3)" />
          <input className="search-input" placeholder="Search by name or company..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state"><Truck size={48} /><p>No suppliers found. Add your first vendor.</p></div>
      ) : (
        <div className="grid-2">
          {filtered.map(s => {
            const owed = s.balance || 0;
            return (
              <div key={s.id} className="card khata-card" style={{ borderLeft: `3px solid ${owed > 0 ? 'var(--rose)' : 'var(--emerald)'}` }}>
                <div style={{ display: 'flex', gap: 14 }}>
                  <div className="khata-avatar">{(s.company || s.name)?.charAt(0)?.toUpperCase()}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '1rem' }}>{s.company || s.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--txt3)' }}>Contact: {s.name}</div>
                        {s.category && <div style={{ fontSize: '0.68rem', color: 'var(--violet)', marginTop: 2 }}>{s.category}</div>}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 900, fontSize: '1.1rem', color: owed > 0 ? 'var(--rose)' : 'var(--emerald)' }}>
                          {cur} {Math.abs(owed).toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--txt3)', fontWeight: 600 }}>
                          {owed > 0 ? '⬆ YOU OWE' : '✅ CLEAR'}
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: '0.75rem' }}>
                      {s.phone && <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--txt2)' }}><Phone size={12} color="var(--cyan)" /> {s.phone}</div>}
                      {s.email && <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--txt2)' }}><Mail size={12} color="var(--cyan)" /> {s.email}</div>}
                    </div>

                    <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => { setCurrentSup(s); setIsModalOpen(true); }}>Edit</button>
                      <button
                        className="btn btn-sm"
                        style={{ flex: 1, background: owed > 0 ? 'var(--emerald-s)' : 'transparent', border: `1px solid ${owed > 0 ? 'var(--emerald-g)' : 'var(--border)'}`, color: owed > 0 ? 'var(--emerald)' : 'var(--txt3)', fontSize: '0.72rem' }}
                        onClick={() => { setPayModal(s); setPayForm({ amount: '', note: '', date: new Date().toISOString().split('T')[0] }); }}
                        disabled={owed <= 0}
                      >
                        <DollarSign size={12} /> Pay
                      </button>
                      <button
                        className="btn btn-ghost btn-sm btn-icon"
                        style={{ color: 'var(--cyan)' }}
                        title="Payment history"
                        onClick={() => setLedger(s)}
                      ><FileText size={13} /></button>
                      <button className="btn btn-sm btn-icon" style={{ background: 'var(--rose-s)', border: '1px solid var(--rose-g)', color: 'var(--rose)' }} onClick={() => { if (window.confirm(`Delete ${s.company || s.name}?`)) deleteSupplier(s.id); }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Supplier Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentSup ? 'Edit Supplier' : 'Add New Supplier'} wide>
        <form onSubmit={handleSave}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="input-wrap"><label className="input-label">Company Name *</label><input className="input" name="company" defaultValue={currentSup?.company} required placeholder="e.g. Acme Corp" /></div>
              <div className="input-wrap"><label className="input-label">Contact Person *</label><input className="input" name="name" defaultValue={currentSup?.name} required placeholder="e.g. John Doe" /></div>
              <div className="input-wrap"><label className="input-label">Phone</label><input className="input" name="phone" defaultValue={currentSup?.phone} placeholder="+92XXXXXXXXXX" /></div>
              <div className="input-wrap"><label className="input-label">Email</label><input className="input" name="email" defaultValue={currentSup?.email} placeholder="contact@supplier.com" /></div>
              <div className="input-wrap" style={{ gridColumn: '1/-1' }}><label className="input-label">Address</label><textarea className="textarea-input" name="address" defaultValue={currentSup?.address} rows={2} placeholder="Full business address..." /></div>
              <div className="input-wrap"><label className="input-label">Category</label><input className="input" name="category" defaultValue={currentSup?.category} placeholder="e.g. Electronics, Food" /></div>
            </div>
          </div>
          <div className="modal-foot">
            <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary"><CheckCircle size={15} /> Save Supplier</button>
          </div>
        </form>
      </Modal>

      {/* Pay Supplier Modal */}
      <Modal isOpen={!!payModal} onClose={() => setPayModal(null)} title={`Pay Supplier — ${payModal?.company || payModal?.name}`}>
        <form onSubmit={recordPayment}>
          <div className="modal-body">
            <div style={{ padding: '12px 16px', borderRadius: 10, background: 'var(--rose-s)', border: '1px solid var(--rose-g)', marginBottom: 16, textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--txt3)' }}>Amount You Owe</div>
              <div style={{ fontWeight: 900, fontSize: '1.8rem', color: 'var(--rose)' }}>{cur} {(payModal?.balance || 0).toLocaleString()}</div>
            </div>
            <div className="form-grid">
              <div className="input-wrap" style={{ gridColumn: '1/-1' }}>
                <label className="input-label">Payment Amount ({cur}) *</label>
                <input className="input" type="number" required min="1" max={payModal?.balance || undefined} autoFocus value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })} placeholder="Enter amount paid" />
              </div>
              <div className="input-wrap"><label className="input-label">Payment Date</label><input className="input" type="date" value={payForm.date} onChange={e => setPayForm({ ...payForm, date: e.target.value })} /></div>
              <div className="input-wrap"><label className="input-label">Note / Reference</label><input className="input" value={payForm.note} onChange={e => setPayForm({ ...payForm, note: e.target.value })} placeholder="e.g. Cheque #123" /></div>
            </div>
          </div>
          <div className="modal-foot">
            <button type="button" className="btn btn-ghost" onClick={() => setPayModal(null)}>Cancel</button>
            <button type="submit" className="btn btn-success"><DollarSign size={15} /> Record Payment</button>
          </div>
        </form>
      </Modal>

      {/* Supplier Ledger Modal */}
      <Modal isOpen={!!ledger} onClose={() => setLedger(null)} title={`Payment History — ${ledger?.company || ledger?.name}`} wide>
        <div className="modal-body">
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Date</th><th>Note</th><th>Amount</th><th>Type</th></tr></thead>
              <tbody>
                {!(ledger?.payments?.length) ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: 30, color: 'var(--txt3)' }}>No payments recorded yet</td></tr>
                ) : ledger.payments.map(p => (
                  <tr key={p.id}>
                    <td style={{ color: 'var(--txt3)', fontSize: '0.8rem' }}>{p.date}</td>
                    <td>{p.note || '—'}</td>
                    <td style={{ fontWeight: 700, color: p.amount > 0 ? 'var(--emerald)' : 'var(--rose)' }}>
                      {p.amount > 0 ? '✅' : '📦'} {cur} {Math.abs(p.amount).toLocaleString()}
                    </td>
                    <td><span className={`badge ${p.amount > 0 ? 'badge-success' : 'badge-danger'}`}>{p.amount > 0 ? 'Payment' : 'Purchase'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={() => setLedger(null)}>Close</button>
        </div>
      </Modal>
    </div>
  );
}

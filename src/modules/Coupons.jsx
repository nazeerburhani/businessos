import React, { useState } from 'react';
import { Tag, Plus, Trash2, Copy, CheckCircle, Percent, DollarSign } from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import Modal from '../components/Modal';

const emptyCoupon = { code: '', type: '%', value: '', minOrder: '', maxUses: '', active: true, desc: '' };

export default function Coupons() {
  const { data, saveSettings } = useBusiness();
  const cur = data.settings.currency;
  const coupons = data.settings.coupons || [];

  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyCoupon);
  const [copied, setCopied] = useState('');

  const saveCoupon = (e) => {
    e.preventDefault();
    if (!form.code.trim() || !form.value) return;
    const code = form.code.trim().toUpperCase();
    const dup = coupons.find(c => c.code === code && c.id !== form.id);
    if (dup) { alert(`Coupon code "${code}" already exists.`); return; }
    const updated = form.id
      ? coupons.map(c => c.id === form.id ? { ...form, code } : c)
      : [...coupons, { ...form, code, id: Date.now(), usedCount: 0 }];
    saveSettings({ coupons: updated });
    setModal(false);
    setForm(emptyCoupon);
  };

  const deleteCoupon = (id) => {
    saveSettings({ coupons: coupons.filter(c => c.id !== id) });
  };

  const toggleActive = (id) => {
    saveSettings({ coupons: coupons.map(c => c.id === id ? { ...c, active: !c.active } : c) });
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(''), 2000);
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    setForm(f => ({ ...f, code }));
  };

  return (
    <div className="page-body anim-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Discount Coupons</h1>
          <div className="page-subtitle">Create coupon codes for POS — percentage or flat discounts</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(emptyCoupon); setModal(true); }}>
          <Plus size={16} /> Create Coupon
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Total Coupons', value: coupons.length, color: 'var(--cyan)' },
          { label: 'Active', value: coupons.filter(c => c.active).length, color: 'var(--emerald)' },
          { label: 'Total Used', value: coupons.reduce((a, c) => a + (c.usedCount || 0), 0), color: 'var(--amber)' },
        ].map(s => (
          <div key={s.label} className="glass" style={{ padding: '14px 18px', borderRadius: 12 }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--txt3)' }}>{s.label}</div>
            <div style={{ fontWeight: 800, fontSize: '1.3rem', color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Coupon cards */}
      {coupons.length === 0 ? (
        <div className="glass empty-state" style={{ padding: 60 }}>
          <Tag size={48} style={{ opacity: 0.3 }} />
          <p>No coupons yet. Create your first discount coupon code.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 16 }}>
          {coupons.map(c => (
            <div key={c.id} className="card" style={{
              padding: 20, position: 'relative', overflow: 'hidden',
              borderLeft: `4px solid ${c.active ? 'var(--emerald)' : 'var(--border)'}`,
              opacity: c.active ? 1 : 0.6,
            }}>
              {/* Ticket notch decoration */}
              <div style={{ position: 'absolute', top: 0, right: 80, width: '100%', height: '100%', background: 'repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(255,255,255,0.02) 8px, rgba(255,255,255,0.02) 9px)', pointerEvents: 'none' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '1.3rem', color: c.active ? 'var(--cyan)' : 'var(--txt3)', letterSpacing: '0.1em' }}>{c.code}</div>
                  {c.desc && <div style={{ fontSize: '0.73rem', color: 'var(--txt2)', marginTop: 2 }}>{c.desc}</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 900, fontSize: '1.4rem', color: c.type === '%' ? 'var(--violet)' : 'var(--emerald)' }}>
                    {c.type === '%' ? `${c.value}%` : `${cur}${c.value}`}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--txt3)' }}>{c.type === '%' ? 'PERCENT OFF' : 'FLAT OFF'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, fontSize: '0.72rem', color: 'var(--txt3)', marginBottom: 12 }}>
                {c.minOrder && <span>Min order: {cur}{c.minOrder}</span>}
                {c.maxUses && <span>Max uses: {c.maxUses}</span>}
                <span>Used: {c.usedCount || 0}×</span>
              </div>

              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-ghost btn-sm btn-icon" title="Copy code" onClick={() => copyCode(c.code)} style={{ color: copied === c.code ? 'var(--emerald)' : 'var(--txt2)' }}>
                  {copied === c.code ? <CheckCircle size={13} /> : <Copy size={13} />}
                </button>
                <button className="btn btn-ghost btn-sm btn-icon" title="Edit" onClick={() => { setForm({ ...c }); setModal(true); }}>✏️</button>
                <button
                  className="btn btn-sm"
                  style={{ flex: 1, fontSize: '0.72rem', background: c.active ? 'var(--emerald-s)' : 'var(--bg-input)', border: `1px solid ${c.active ? 'var(--emerald-g)' : 'var(--border)'}`, color: c.active ? 'var(--emerald)' : 'var(--txt3)' }}
                  onClick={() => toggleActive(c.id)}
                >
                  {c.active ? '✅ Active' : '⭕ Inactive'}
                </button>
                <button className="btn btn-sm btn-icon" style={{ background: 'var(--rose-s)', border: '1px solid var(--rose-g)', color: 'var(--rose)' }} onClick={() => { if (window.confirm(`Delete coupon ${c.code}?`)) deleteCoupon(c.id); }}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* How to use in POS info */}
      <div style={{ marginTop: 24, padding: '14px 20px', borderRadius: 12, background: 'rgba(0,200,240,0.04)', border: '1px solid var(--cyan-g)', fontSize: '0.8rem', color: 'var(--txt2)' }}>
        💡 <strong>How to use:</strong> In POS, enter the coupon code in the <em>Discount</em> field, or apply it directly as a flat/percent discount. Coupon validation logic is built into the POS coupon input.
      </div>

      {/* Add/Edit Coupon Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title={form.id ? 'Edit Coupon' : 'Create Coupon'} wide>
        <form onSubmit={saveCoupon}>
          <div className="modal-body">
            {/* Code */}
            <div className="input-wrap" style={{ marginBottom: 16 }}>
              <label className="input-label">Coupon Code *</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="input"
                  required
                  value={form.code}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g. SAVE20"
                  style={{ fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.15em', flex: 1 }}
                />
                <button type="button" className="btn btn-ghost" onClick={generateCode} style={{ flexShrink: 0 }}>🎲 Generate</button>
              </div>
            </div>

            {/* Type + Value */}
            <div className="form-grid" style={{ marginBottom: 16 }}>
              <div className="input-wrap">
                <label className="input-label">Discount Type *</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[['%', '% Percent'], ['flat', `${cur} Flat`]].map(([v, l]) => (
                    <button key={v} type="button"
                      onClick={() => setForm(f => ({ ...f, type: v }))}
                      className={`btn btn-sm ${form.type === v ? 'btn-primary' : 'btn-ghost'}`}
                      style={{ flex: 1 }}>
                      {v === '%' ? <Percent size={13} /> : <DollarSign size={13} />} {l}
                    </button>
                  ))}
                </div>
              </div>
              <div className="input-wrap">
                <label className="input-label">Discount Value *</label>
                <input className="input" type="number" required min="1" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} placeholder={form.type === '%' ? 'e.g. 10 (= 10%)' : `e.g. 50 (= ${cur}50 off)`} />
              </div>
              <div className="input-wrap">
                <label className="input-label">Min Order Amount</label>
                <input className="input" type="number" min="0" value={form.minOrder} onChange={e => setForm(f => ({ ...f, minOrder: e.target.value }))} placeholder="0 = no minimum" />
              </div>
              <div className="input-wrap">
                <label className="input-label">Max Uses</label>
                <input className="input" type="number" min="1" value={form.maxUses} onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))} placeholder="Leave blank = unlimited" />
              </div>
              <div className="input-wrap" style={{ gridColumn: '1/-1' }}>
                <label className="input-label">Description (optional)</label>
                <input className="input" value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} placeholder="e.g. Eid special discount" />
              </div>
            </div>

            {form.value && (
              <div style={{ padding: '10px 16px', borderRadius: 10, background: 'var(--violet-s)', border: '1px solid var(--violet-g)', fontSize: '0.8rem', color: 'var(--violet)' }}>
                Preview: Code <strong>{form.code || 'CODE'}</strong> gives <strong>{form.type === '%' ? `${form.value}%` : `${cur}${form.value}`} off</strong>{form.minOrder ? ` on orders over ${cur}${form.minOrder}` : ''}.
              </div>
            )}
          </div>
          <div className="modal-foot">
            <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary"><Tag size={15} /> {form.id ? 'Update' : 'Create'} Coupon</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

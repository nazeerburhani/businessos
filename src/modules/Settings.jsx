import React, { useState } from 'react';
import { Settings, Save, AlertTriangle, Trash2, Upload, X, Globe, Clock } from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import Modal from '../components/Modal';

export default function SettingsModule() {
  const { data, saveSettings, resetData } = useBusiness();
  const [form, setForm] = useState({ ...data.settings });
  const [saved, setSaved] = useState(false);
  const [resetModal, setResetModal] = useState(false);
  const [logoPreview, setLogoPreview] = useState(form.logoUrl || '');

  const handleSave = (e) => {
    e.preventDefault();
    saveSettings({ ...form, logoUrl: logoPreview });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 500 * 1024) { alert('Logo must be under 500KB. Please resize it.'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setLogoPreview(ev.target.result);
      setForm(f => ({ ...f, logoUrl: ev.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => { setLogoPreview(''); setForm(f => ({ ...f, logoUrl: '' })); };

  return (
    <div className="page-body anim-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <div className="page-subtitle">Configure your business profile and preferences</div>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Logo Upload */}
        <div className="glass" style={{ padding: 28 }}>
          <h3 style={{ marginBottom: 20, fontSize: '1rem', color: 'var(--cyan)' }}>Shop Logo</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            {/* Preview */}
            <div style={{ width: 100, height: 100, borderRadius: 'var(--r-lg)', border: `2px dashed ${logoPreview ? 'var(--cyan)' : 'var(--border2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: logoPreview ? '#fff' : 'var(--bg-input)', flexShrink: 0 }}>
              {logoPreview
                ? <img src={logoPreview} alt="Shop Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                : <Upload size={28} color="var(--txt3)" />
              }
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Shop Logo</div>
              <p style={{ fontSize: '0.8rem', color: 'var(--txt3)', marginBottom: 14 }}>
                Upload your shop logo (PNG, JPG — max 500KB). It will appear on all printed receipts.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <label className="btn btn-ghost" style={{ cursor: 'pointer' }}>
                  <Upload size={15} /> Upload Logo
                  <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                </label>
                {logoPreview && (
                  <button type="button" className="btn btn-sm" style={{ background: 'var(--rose-s)', border: '1px solid var(--rose-g)', color: 'var(--rose)' }} onClick={removeLogo}>
                    <X size={13} /> Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Business Info */}
        <div className="glass" style={{ padding: 28 }}>
          <h3 style={{ marginBottom: 20, fontSize: '1rem', color: 'var(--emerald)' }}>Business Information</h3>
          <div className="form-grid">
            <div className="input-wrap" style={{ gridColumn: '1/-1' }}>
              <label className="input-label">Business Name *</label>
              <input className="input" required value={form.businessName} onChange={e => setForm({ ...form, businessName: e.target.value })} placeholder="e.g. Ahmad Electronics" />
            </div>
            <div className="input-wrap">
              <label className="input-label">Phone Number</label>
              <input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="03XXXXXXXXX" />
            </div>
            <div className="input-wrap">
              <label className="input-label">Email</label>
              <input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="business@email.com" />
            </div>
            <div className="input-wrap" style={{ gridColumn: '1/-1' }}>
              <label className="input-label">Full Address</label>
              <textarea className="textarea-input" rows={2} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Shop #, Street, City" />
            </div>
            <div className="input-wrap">
              <label className="input-label"><Globe size={12} style={{ display: 'inline', marginRight: 4 }} />Website</label>
              <input className="input" value={form.website || ''} onChange={e => setForm({ ...form, website: e.target.value })} placeholder="www.yourbusiness.com" />
            </div>
            <div className="input-wrap">
              <label className="input-label"><Clock size={12} style={{ display: 'inline', marginRight: 4 }} />Business Hours</label>
              <input className="input" value={form.businessHours || ''} onChange={e => setForm({ ...form, businessHours: e.target.value })} placeholder="Mon–Sat 9am–9pm" />
            </div>
          </div>
        </div>

        {/* Financial Settings */}
        <div className="glass" style={{ padding: 28 }}>
          <h3 style={{ marginBottom: 20, fontSize: '1rem', color: 'var(--amber)' }}>Financial Settings</h3>
          <div className="form-grid">
            <div className="input-wrap">
              <label className="input-label">Currency Symbol</label>
              <input className="input" value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} placeholder="Rs. / $ / £ / ₹" />
            </div>
            <div className="input-wrap">
              <label className="input-label">Tax Rate (%)</label>
              <input className="input" type="number" min="0" max="100" step="0.1" value={form.taxRate} onChange={e => setForm({ ...form, taxRate: Number(e.target.value) })} placeholder="0" />
            </div>
          </div>
        </div>

        {/* Receipt Customization */}
        <div className="glass" style={{ padding: 28 }}>
          <h3 style={{ marginBottom: 20, fontSize: '1rem', color: 'var(--violet)' }}>Receipt Customization</h3>
          <div className="input-wrap" style={{ marginBottom: 16 }}>
            <label className="input-label">Receipt Footer Message</label>
            <textarea className="textarea-input" rows={2} value={form.receiptFooter} onChange={e => setForm({ ...form, receiptFooter: e.target.value })} placeholder="Thank you for shopping with us!" />
          </div>

          {/* Receipt Preview */}
          <div style={{ background: '#fff', color: '#1a1a1a', padding: 20, borderRadius: 8, fontFamily: 'Courier New, monospace', maxWidth: 300, fontSize: '0.8rem' }}>
            {logoPreview && <img src={logoPreview} alt="logo" style={{ width: 70, height: 70, objectFit: 'contain', display: 'block', margin: '0 auto 10px' }} />}
            <div style={{ fontWeight: 700, textAlign: 'center', fontSize: '1rem' }}>{form.businessName || 'Business Name'}</div>
            <div style={{ textAlign: 'center', color: '#555', fontSize: '0.72rem' }}>{form.address || 'Address'}</div>
            <div style={{ textAlign: 'center', color: '#555', fontSize: '0.72rem' }}>{form.phone}</div>
            <div style={{ borderTop: '1px dashed #ccc', margin: '8px 0', paddingTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Sample Item × 1</span><span>{form.currency} 100</span></div>
              {form.taxRate > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Tax ({form.taxRate}%)</span><span>{form.currency} {Math.round(100 * form.taxRate / 100)}</span></div>}
            </div>
            <div style={{ borderTop: '2px dashed #ccc', paddingTop: 8, fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
              <span>TOTAL</span><span>{form.currency} {100 + Math.round(100 * form.taxRate / 100)}</span>
            </div>
            <div style={{ textAlign: 'center', color: '#777', marginTop: 10, fontSize: '0.7rem', borderTop: '1px solid #eee', paddingTop: 8 }}>
              {form.receiptFooter || 'Thank you!'}
              {form.website && <div>{form.website}</div>}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button type="button" className="btn btn-sm" style={{ background: 'var(--rose-s)', border: '1px solid var(--rose-g)', color: 'var(--rose)' }} onClick={() => setResetModal(true)}>
            <Trash2 size={14} /> Reset All Data
          </button>
          <button type="submit" className="btn btn-primary btn-lg">
            <Save size={16} /> {saved ? '✓ Saved!' : 'Save Settings'}
          </button>
        </div>
      </form>

      <div style={{ marginTop: 32, padding: 20, background: 'rgba(0,200,240,0.03)', border: '1px solid rgba(0,200,240,0.1)', borderRadius: 'var(--r-lg)', textAlign: 'center' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--txt3)' }}>
          BusinessOS Enterprise Suite — Developed by <strong style={{ color: 'var(--cyan)' }}>Nazeer Ahmad</strong>
        </div>
      </div>

      <Modal isOpen={resetModal} onClose={() => setResetModal(false)} title="Reset All Data">
        <div className="modal-body" style={{ textAlign: 'center' }}>
          <AlertTriangle size={48} color="var(--rose)" style={{ marginBottom: 16 }} />
          <h3 style={{ marginBottom: 8 }}>This will delete everything!</h3>
          <p style={{ color: 'var(--txt3)', fontSize: '0.9rem' }}>All products, customers, transactions and expenses will be permanently deleted.</p>
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={() => setResetModal(false)}>Cancel</button>
          <button className="btn btn-danger" onClick={() => { resetData(); setResetModal(false); }}>Yes, Reset Everything</button>
        </div>
      </Modal>
    </div>
  );
}

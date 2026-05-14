import React, { useState } from 'react';
import { Package, Plus, Edit2, Trash2, AlertTriangle, Download, Clock, FileText } from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import Modal from '../components/Modal';

const emptyForm = {
  name: '', sku: '', category: 'General',
  price: '', costPrice: '', stock: '', minStock: 5,
  unit: 'Pcs', supplier: '', description: '',
  expiryDate: '', batchNumber: '',
};

export default function Inventory({ searchQuery }) {
  const { data, stats, saveProduct, deleteProduct, adjustStock } = useBusiness();
  const { products, categories, settings } = data;
  const cur = settings.currency;

  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [catFilter, setCatFilter] = useState('All');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isAdjModalOpen, setIsAdjModalOpen] = useState(false);
  const [adjProd, setAdjProd] = useState(null);
  const [adjForm, setAdjForm] = useState({ qty: '', reason: 'Restock' });

  const today = new Date();
  const in30days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  const getExpiryStatus = (expiryDate) => {
    if (!expiryDate) return null;
    const exp = new Date(expiryDate);
    const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { label: 'Expired', color: 'var(--rose)', bg: 'var(--rose-s)' };
    if (diffDays <= 7) return { label: `Exp. in ${diffDays}d`, color: 'var(--rose)', bg: 'var(--rose-s)' };
    if (diffDays <= 30) return { label: `Exp. in ${diffDays}d`, color: 'var(--amber)', bg: 'rgba(245,158,11,0.1)' };
    return null;
  };

  const filtered = products.filter(p => {
    const q = (searchQuery || '').toLowerCase();
    const matchQ = p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q);
    const matchC = catFilter === 'All' || p.category === catFilter;
    return matchQ && matchC;
  });

  const openAdd = () => { setForm(emptyForm); setModal(true); };
  const openEdit = (p) => { setForm({ ...p }); setModal(true); };
  const openAdjust = (p) => { setAdjProd(p); setAdjForm({ qty: '', reason: 'Restock' }); setIsAdjModalOpen(true); };

  const handleSave = (e) => {
    e.preventDefault();
    saveProduct({
      ...form,
      price: Number(form.price),
      costPrice: Number(form.costPrice) || 0,
      stock: Number(form.stock),
      minStock: Number(form.minStock) || 5,
    });
    setModal(false);
  };

  const handleAdjust = (e) => {
    e.preventDefault();
    adjustStock(adjProd.id, Number(adjForm.qty), adjForm.reason);
    setIsAdjModalOpen(false);
  };

  const confirmDelete = (id) => { deleteProduct(id); setDeleteConfirm(null); };

  // ── CSV Export ──────────────────────────────────────────────────────────────
  const exportCSV = () => {
    const headers = ['Name', 'SKU', 'Category', 'Cost Price', 'Selling Price', 'Stock', 'Min Stock', 'Unit', 'Expiry Date', 'Batch'];
    const rows = products.map(p => [
      p.name, p.sku || '', p.category,
      p.costPrice || '', p.price, p.stock, p.minStock || 5,
      p.unit || 'Pcs', p.expiryDate || '', p.batchNumber || ''
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page-body anim-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory</h1>
          <div className="page-subtitle">
            {products.length} products · {stats.lowStockCount || 0} low stock
            {stats.expiringSoon > 0 && <span style={{ color: 'var(--amber)', marginLeft: 8 }}>· {stats.expiringSoon} expiring soon</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={exportCSV} title="Export as CSV"><Download size={16} /> CSV</button>
          <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Product</button>
        </div>
      </div>

      {/* Category Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {['All', ...categories].map(c => (
          <button key={c} className={`btn btn-sm ${catFilter === c ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setCatFilter(c)}>{c}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="glass empty-state" style={{ padding: 60 }}>
          <Package size={48} />
          <p>No products found. Click "Add Product" to begin.</p>
        </div>
      ) : (
        <div className="glass tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Product</th><th>SKU</th><th>Category</th>
                <th>Cost</th><th>Price</th><th>Margin</th>
                <th>Stock</th><th>Status</th><th>Expiry</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const margin = p.costPrice > 0 ? Math.round((p.price - p.costPrice) / p.price * 100) : null;
                const expiryStatus = getExpiryStatus(p.expiryDate);
                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      {p.batchNumber && <div style={{ fontSize: '0.68rem', color: 'var(--txt3)' }}>Batch: {p.batchNumber}</div>}
                    </td>
                    <td style={{ color: 'var(--txt3)', fontSize: '0.8rem' }}>{p.sku || '—'}</td>
                    <td><span className="badge badge-neutral">{p.category}</span></td>
                    <td style={{ color: 'var(--txt2)' }}>{p.costPrice ? `${cur} ${Number(p.costPrice).toLocaleString()}` : '—'}</td>
                    <td style={{ color: 'var(--cyan)', fontWeight: 700 }}>{cur} {p.price?.toLocaleString()}</td>
                    <td style={{ color: margin > 20 ? 'var(--emerald)' : 'var(--amber)' }}>{margin !== null ? `${margin}%` : '—'}</td>
                    <td style={{ fontWeight: 600 }}>{p.stock} <span style={{ fontSize: '0.68rem', color: 'var(--txt3)' }}>{p.unit}</span></td>
                    <td>
                      <span className={`badge ${p.stock === 0 ? 'badge-danger' : p.stock <= (p.minStock || 5) ? 'badge-warning' : 'badge-success'}`}>
                        {p.stock === 0 ? 'Out' : p.stock <= (p.minStock || 5) ? 'Low' : 'OK'}
                      </span>
                    </td>
                    <td>
                      {expiryStatus ? (
                        <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: 4, background: expiryStatus.bg, color: expiryStatus.color, fontWeight: 700 }}>
                          <Clock size={9} style={{ display: 'inline', marginRight: 2 }} />
                          {expiryStatus.label}
                        </span>
                      ) : p.expiryDate ? (
                        <span style={{ fontSize: '0.68rem', color: 'var(--txt3)' }}>{p.expiryDate}</span>
                      ) : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openAdjust(p)} style={{ color: 'var(--amber)', fontSize: '0.72rem' }}>Adjust</button>
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(p)}><Edit2 size={13} /></button>
                        <button className="btn btn-sm btn-icon" style={{ background: 'var(--rose-s)', border: '1px solid var(--rose-g)', color: 'var(--rose)' }} onClick={() => setDeleteConfirm(p.id)}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title={form.id ? 'Edit Product' : 'Add Product'} wide>
        <form onSubmit={handleSave}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="input-wrap" style={{ gridColumn: '1/-1' }}>
                <label className="input-label">Product Name *</label>
                <input className="input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Basmati Rice 5kg" />
              </div>
              <div className="input-wrap">
                <label className="input-label">SKU / Barcode</label>
                <input className="input" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="e.g. SKU-001" />
              </div>
              <div className="input-wrap">
                <label className="input-label">Category</label>
                <select className="select-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {categories.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="input-wrap">
                <label className="input-label">Selling Price ({cur}) *</label>
                <input className="input" type="number" required min="0" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
              </div>
              <div className="input-wrap">
                <label className="input-label">Cost Price ({cur})</label>
                <input className="input" type="number" min="0" step="0.01" value={form.costPrice} onChange={e => setForm({ ...form, costPrice: e.target.value })} />
              </div>
              <div className="input-wrap">
                <label className="input-label">Current Stock *</label>
                <input className="input" type="number" required min="0" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} />
              </div>
              <div className="input-wrap">
                <label className="input-label">Low Stock Alert</label>
                <input className="input" type="number" min="0" value={form.minStock} onChange={e => setForm({ ...form, minStock: e.target.value })} />
              </div>
              <div className="input-wrap">
                <label className="input-label">Unit</label>
                <select className="select-input" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                  {['Pcs', 'Kg', 'Gm', 'Litre', 'Ml', 'Box', 'Pack', 'Dozen', 'Metre'].map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
              <div className="input-wrap">
                <label className="input-label">Expiry Date</label>
                <input className="input" type="date" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })} />
              </div>
              <div className="input-wrap">
                <label className="input-label">Batch Number</label>
                <input className="input" value={form.batchNumber || ''} onChange={e => setForm({ ...form, batchNumber: e.target.value })} placeholder="e.g. BT-2025-01" />
              </div>
              <div className="input-wrap" style={{ gridColumn: '1/-1' }}>
                <label className="input-label">Description</label>
                <textarea className="textarea-input" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional notes" />
              </div>
            </div>
          </div>
          <div className="modal-foot">
            <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">{form.id ? 'Update Product' : 'Add Product'}</button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Product">
        <div className="modal-body" style={{ textAlign: 'center' }}>
          <AlertTriangle size={40} color="var(--rose)" style={{ marginBottom: 12 }} />
          <p>Are you sure? This cannot be undone.</p>
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={() => confirmDelete(deleteConfirm)}>Delete</button>
        </div>
      </Modal>

      {/* Adjustment Modal */}
      <Modal isOpen={isAdjModalOpen} onClose={() => setIsAdjModalOpen(false)} title="Adjust Stock">
        <form onSubmit={handleAdjust}>
          <div className="modal-body">
            <div style={{ marginBottom: 16, padding: 12, background: 'rgba(0,200,240,0.05)', borderRadius: 8, fontSize: '0.85rem' }}>
              <strong>Adjusting:</strong> {adjProd?.name}<br />
              <strong>Current Stock:</strong> {adjProd?.stock} {adjProd?.unit}
            </div>
            <div className="input-wrap">
              <label className="input-label">Quantity Change (+/-)</label>
              <input className="input" type="number" required placeholder="e.g. +10 or -5"
                value={adjForm.qty} onChange={e => setAdjForm({ ...adjForm, qty: e.target.value })} />
            </div>
            <div className="input-wrap" style={{ marginTop: 12 }}>
              <label className="input-label">Reason</label>
              <select className="select-input" value={adjForm.reason} onChange={e => setAdjForm({ ...adjForm, reason: e.target.value })}>
                <option value="Restock">Restock / New Purchase</option>
                <option value="Damage">Damage / Expired</option>
                <option value="Return">Customer Return</option>
                <option value="Correction">Data Correction</option>
              </select>
            </div>
          </div>
          <div className="modal-foot">
            <button type="button" className="btn btn-ghost" onClick={() => setIsAdjModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Confirm</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

import React, { useState } from 'react';
import { Package, Plus, Edit2, Trash2, Search, AlertTriangle } from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import Modal from '../components/Modal';

const emptyForm = { name: '', sku: '', category: 'General', price: '', costPrice: '', stock: '', minStock: 5, supplier: '', description: '' };

export default function Inventory({ searchQuery }) {
  const { data, stats, saveProduct, deleteProduct } = useBusiness();
  const { products, categories, settings } = data;
  const cur = settings.currency;
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [catFilter, setCatFilter] = useState('All');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const filtered = products.filter(p => {
    const q = (searchQuery || '').toLowerCase();
    const matchQ = p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q);
    const matchC = catFilter === 'All' || p.category === catFilter;
    return matchQ && matchC;
  });

  const openAdd = () => { setForm(emptyForm); setModal(true); };
  const openEdit = (p) => { setForm({ ...p }); setModal(true); };

  const handleSave = (e) => {
    e.preventDefault();
    saveProduct({ ...form, price: Number(form.price), costPrice: Number(form.costPrice), stock: Number(form.stock), minStock: Number(form.minStock) });
    setModal(false);
  };

  const confirmDelete = (id) => { deleteProduct(id); setDeleteConfirm(null); };

  return (
    <div className="page-body anim-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory</h1>
          <div className="page-subtitle">{products.length} products · {stats.lowStockCount || 0} low stock</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Product</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
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
                <th>Stock</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const margin = p.costPrice > 0 ? Math.round((p.price - p.costPrice) / p.price * 100) : null;
                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      {p.supplier && <div style={{ fontSize: '0.72rem', color: 'var(--txt3)' }}>{p.supplier}</div>}
                    </td>
                    <td style={{ color: 'var(--txt3)', fontSize: '0.8rem' }}>{p.sku || '—'}</td>
                    <td><span className="badge badge-neutral">{p.category}</span></td>
                    <td style={{ color: 'var(--txt2)' }}>{p.costPrice ? `${cur} ${p.costPrice.toLocaleString()}` : '—'}</td>
                    <td style={{ color: 'var(--cyan)', fontWeight: 700 }}>{cur} {p.price?.toLocaleString()}</td>
                    <td style={{ color: 'var(--emerald)' }}>{margin !== null ? `${margin}%` : '—'}</td>
                    <td style={{ fontWeight: 600 }}>{p.stock}</td>
                    <td>
                      <span className={`badge ${p.stock === 0 ? 'badge-danger' : p.stock <= p.minStock ? 'badge-warning' : 'badge-success'}`}>
                        {p.stock === 0 ? 'Out of Stock' : p.stock <= p.minStock ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(p)}><Edit2 size={14} /></button>
                        <button className="btn btn-sm btn-icon" style={{ background: 'var(--rose-s)', border: '1px solid var(--rose-g)', color: 'var(--rose)' }} onClick={() => setDeleteConfirm(p.id)}><Trash2 size={14} /></button>
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
                <input className="input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Samsung Galaxy S25" />
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
                <input className="input" type="number" required min="0" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
              </div>
              <div className="input-wrap">
                <label className="input-label">Cost Price ({cur})</label>
                <input className="input" type="number" min="0" value={form.costPrice} onChange={e => setForm({ ...form, costPrice: e.target.value })} />
              </div>
              <div className="input-wrap">
                <label className="input-label">Current Stock *</label>
                <input className="input" type="number" required min="0" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} />
              </div>
              <div className="input-wrap">
                <label className="input-label">Low Stock Alert (Min)</label>
                <input className="input" type="number" min="0" value={form.minStock} onChange={e => setForm({ ...form, minStock: e.target.value })} />
              </div>
              <div className="input-wrap" style={{ gridColumn: '1/-1' }}>
                <label className="input-label">Supplier</label>
                <input className="input" value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} placeholder="Supplier name" />
              </div>
              <div className="input-wrap" style={{ gridColumn: '1/-1' }}>
                <label className="input-label">Description</label>
                <textarea className="textarea-input" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional notes about this product" />
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
          <p>Are you sure you want to delete this product? This action cannot be undone.</p>
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={() => confirmDelete(deleteConfirm)}>Delete</button>
        </div>
      </Modal>
    </div>
  );
}

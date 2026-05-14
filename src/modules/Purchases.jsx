import React, { useState } from 'react';
import { ShoppingBag, Plus, Trash2, Search, Package } from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import Modal from '../components/Modal';

export default function Purchases() {
  const { data, addPurchase } = useBusiness();
  const { suppliers, products, purchases = [], settings } = data;
  const cur = settings.currency;

  const [modal, setModal] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ supplierId: '', date: new Date().toISOString().split('T')[0], note: '' });
  const [items, setItems] = useState([{ productId: '', qty: 1, costPrice: '' }]);

  const filteredPurchases = purchases.filter(p => {
    const sup = suppliers.find(s => s.id === p.supplierId);
    return sup?.name?.toLowerCase().includes(search.toLowerCase()) ||
           sup?.company?.toLowerCase().includes(search.toLowerCase()) ||
           p.date?.includes(search);
  });

  const addItem = () => setItems(prev => [...prev, { productId: '', qty: 1, costPrice: '' }]);
  const updateItem = (idx, field, val) => setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: val } : it));
  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));

  const getProduct = (id) => products.find(p => p.id === Number(id));

  const purchaseTotal = items.reduce((a, it) => a + (Number(it.qty || 0) * Number(it.costPrice || 0)), 0);

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.supplierId) { alert('Please select a supplier.'); return; }
    const validItems = items.filter(it => it.productId && it.qty > 0);
    if (!validItems.length) { alert('Add at least one product.'); return; }

    addPurchase({
      supplierId: Number(form.supplierId),
      date: form.date,
      note: form.note,
      total: purchaseTotal,
      items: validItems.map(it => ({
        productId: Number(it.productId),
        qty: Number(it.qty),
        costPrice: Number(it.costPrice),
      })),
    });

    setModal(false);
    setForm({ supplierId: '', date: new Date().toISOString().split('T')[0], note: '' });
    setItems([{ productId: '', qty: 1, costPrice: '' }]);
  };

  return (
    <div className="page-body anim-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Purchase Management</h1>
          <div className="page-subtitle">Record stock purchases from suppliers</div>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>
          <Plus size={18} /> New Purchase
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--txt3)', marginBottom: 6 }}>Total Purchases</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{purchases.length}</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--rose)', marginBottom: 6 }}>Amount Spent</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--rose)' }}>
            {cur} {purchases.reduce((a, p) => a + (p.total || 0), 0).toLocaleString()}
          </div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--txt3)', marginBottom: 6 }}>Active Suppliers</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{suppliers.length}</div>
        </div>
      </div>

      {/* Search */}
      <div className="glass" style={{ padding: 12, marginBottom: 16 }}>
        <div className="search-box">
          <Search size={16} color="var(--txt3)" />
          <input className="search-input" placeholder="Search by supplier or date..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Purchases Table */}
      {filteredPurchases.length === 0 ? (
        <div className="empty-state glass" style={{ padding: 60 }}>
          <ShoppingBag size={48} />
          <p>No purchases yet. Record your first stock purchase.</p>
        </div>
      ) : (
        <div className="glass" style={{ borderRadius: 'var(--r-xl)', overflow: 'hidden' }}>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Supplier</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {filteredPurchases.map(p => {
                  const sup = suppliers.find(s => s.id === p.supplierId);
                  return (
                    <tr key={p.id}>
                      <td style={{ color: 'var(--txt3)', fontSize: '0.8rem' }}>{p.date}</td>
                      <td style={{ fontWeight: 600 }}>{sup?.company || sup?.name || 'Unknown'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {p.items?.slice(0, 3).map((it, i) => {
                            const prod = products.find(pr => pr.id === it.productId);
                            return (
                              <span key={i} className="badge badge-primary" style={{ fontSize: '0.62rem' }}>
                                {prod?.name || 'Unknown'} ×{it.qty}
                              </span>
                            );
                          })}
                          {p.items?.length > 3 && <span className="badge" style={{ fontSize: '0.62rem' }}>+{p.items.length - 3} more</span>}
                        </div>
                      </td>
                      <td style={{ fontWeight: 800, color: 'var(--rose)' }}>{cur} {p.total?.toLocaleString()}</td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--txt3)' }}>{p.note || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Purchase Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Record New Purchase" wide>
        <form onSubmit={handleSave}>
          <div className="modal-body">
            <div className="grid-2">
              <div className="input-wrap">
                <label className="input-label">Supplier *</label>
                <select className="select-input" required value={form.supplierId} onChange={e => setForm({ ...form, supplierId: e.target.value })}>
                  <option value="">-- Select Supplier --</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.company || s.name}</option>)}
                </select>
              </div>
              <div className="input-wrap">
                <label className="input-label">Purchase Date</label>
                <input className="input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
            </div>

            {/* Product rows */}
            <div style={{ marginTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <label className="input-label" style={{ margin: 0 }}>Products Purchased</label>
                <button type="button" className="btn btn-ghost btn-sm" onClick={addItem}><Plus size={13} /> Add Product</button>
              </div>

              {items.map((it, idx) => {
                const selectedProd = getProduct(it.productId);
                return (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                    <select
                      className="select-input"
                      value={it.productId}
                      onChange={e => {
                        const prod = getProduct(e.target.value);
                        updateItem(idx, 'productId', e.target.value);
                        if (prod?.cost) updateItem(idx, 'costPrice', prod.cost);
                      }}
                    >
                      <option value="">-- Select Product --</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <input
                      className="input"
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={it.qty}
                      onChange={e => updateItem(idx, 'qty', e.target.value)}
                    />
                    <input
                      className="input"
                      type="number"
                      min="0"
                      placeholder={`Cost (${cur})`}
                      value={it.costPrice}
                      onChange={e => updateItem(idx, 'costPrice', e.target.value)}
                    />
                    <button type="button" style={{ background: 'none', border: 'none', color: 'var(--rose)', cursor: 'pointer' }} onClick={() => removeItem(idx)} disabled={items.length === 1}><Trash2 size={14} /></button>
                  </div>
                );
              })}

              <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(0,200,240,0.05)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Purchase Total</span>
                <span style={{ fontWeight: 900, color: 'var(--rose)', fontSize: '1.1rem' }}>{cur} {purchaseTotal.toLocaleString()}</span>
              </div>
            </div>

            <div className="input-wrap" style={{ marginTop: 16 }}>
              <label className="input-label">Note / Invoice Number</label>
              <input className="input" placeholder="e.g. Invoice #INV-001" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
            </div>
          </div>
          <div className="modal-foot">
            <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              <Package size={15} /> Save Purchase
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

import React, { useState } from 'react';
import { RefreshCw, ShoppingBag, CheckCircle, Download, Plus, Minus, AlertTriangle, Truck, Send } from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import Modal from '../components/Modal';

export default function Reorder() {
  const { data, addPurchase, saveProduct } = useBusiness();
  const { products, suppliers, settings } = data;
  const cur = settings.currency;

  const [threshold, setThreshold] = useState(10);
  const [quantities, setQuantities] = useState({});
  const [selectedSupplier, setSelectedSupplier] = useState({});
  const [poModal, setPoModal] = useState(false);
  const [poSent, setPoSent] = useState(false);
  const [customItems, setCustomItems] = useState([]);

  // Low stock products
  const lowStock = products.filter(p => p.stock <= (p.minStock || threshold));
  const outOfStock = products.filter(p => p.stock === 0);

  const getReorderQty = (p) => quantities[p.id] ?? Math.max((p.minStock || 5) * 3, 20);

  const totalPOValue = [...lowStock, ...customItems].reduce((a, p) => {
    const qty = getReorderQty(p);
    return a + qty * (p.costPrice || p.price * 0.6 || 0);
  }, 0);

  const handleGeneratePO = () => {
    setPoSent(false);
    setPoModal(true);
  };

  const handleSendPO = () => {
    // Record as a purchase in the system
    const items = lowStock.map(p => ({
      productId: p.id,
      qty: getReorderQty(p),
      costPrice: p.costPrice || Math.round(p.price * 0.6),
    }));
    const total = items.reduce((a, i) => a + i.qty * i.costPrice, 0);
    addPurchase({ items, total, note: 'Auto-generated reorder PO', supplierId: null });
    setPoSent(true);
    setTimeout(() => { setPoModal(false); setPoSent(false); }, 2000);
  };

  const exportPO = () => {
    const date = new Date().toISOString().split('T')[0];
    const rows = [['Product', 'SKU', 'Current Stock', 'Reorder Qty', 'Cost Price', 'Total']];
    lowStock.forEach(p => {
      const qty = getReorderQty(p);
      const cost = p.costPrice || Math.round(p.price * 0.6);
      rows.push([p.name, p.sku || '', p.stock, qty, cost, qty * cost]);
    });
    rows.push(['', '', '', '', 'GRAND TOTAL', totalPOValue]);
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `purchase-order-${date}.csv`;
    a.click();
  };

  return (
    <div className="page-body anim-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Stock Reorder</h1>
          <div className="page-subtitle">Auto-detect low stock and generate purchase orders</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={exportPO} disabled={!lowStock.length}><Download size={15} /> Export PO</button>
          <button className="btn btn-primary" onClick={handleGeneratePO} disabled={!lowStock.length}>
            <ShoppingBag size={15} /> Generate Purchase Order
          </button>
        </div>
      </div>

      {/* Config bar */}
      <div className="glass" style={{ padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--txt2)' }}>Reorder threshold:</span>
          <input type="number" className="input" value={threshold} onChange={e => setThreshold(Number(e.target.value))} style={{ width: 70 }} min="1" />
          <span style={{ fontSize: '0.75rem', color: 'var(--txt3)' }}>units or less</span>
        </div>
        <div style={{ display: 'flex', gap: 16, marginLeft: 'auto' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--rose)' }}>{outOfStock.length}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--txt3)' }}>OUT OF STOCK</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--amber)' }}>{lowStock.length}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--txt3)' }}>NEED REORDER</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--cyan)' }}>{cur} {totalPOValue.toLocaleString()}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--txt3)' }}>ESTIMATED COST</div>
          </div>
        </div>
      </div>

      {/* Low stock list */}
      {lowStock.length === 0 ? (
        <div className="glass empty-state" style={{ padding: 60 }}>
          <CheckCircle size={48} color="var(--emerald)" style={{ opacity: 0.5 }} />
          <p style={{ color: 'var(--emerald)' }}>✅ All products are well-stocked! Nothing needs reordering.</p>
        </div>
      ) : (
        <div className="glass" style={{ borderRadius: 'var(--r-xl)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={16} color="var(--amber)" />
            <span style={{ fontWeight: 700 }}>Products Requiring Reorder ({lowStock.length})</span>
          </div>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Product</th><th>SKU</th><th>Current Stock</th><th>Min Stock</th>
                  <th>Status</th><th>Supplier</th><th>Cost Price</th><th>Reorder Qty</th><th>Total Cost</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map(p => {
                  const qty = getReorderQty(p);
                  const cost = p.costPrice || Math.round(p.price * 0.6);
                  const isOut = p.stock === 0;
                  const sup = suppliers.find(s => s.id === p.supplierId || s.name === p.supplier || s.company === p.supplier);
                  return (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 700 }}>{p.name}</td>
                      <td style={{ color: 'var(--txt3)', fontFamily: 'monospace' }}>{p.sku || '—'}</td>
                      <td>
                        <span style={{ fontWeight: 800, color: isOut ? 'var(--rose)' : 'var(--amber)', fontSize: '1rem' }}>{p.stock}</span>
                        <span style={{ color: 'var(--txt3)', fontSize: '0.72rem' }}> {p.unit || 'pcs'}</span>
                      </td>
                      <td style={{ color: 'var(--txt3)' }}>{p.minStock || 5}</td>
                      <td>
                        <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: '0.68rem', fontWeight: 700, background: isOut ? 'var(--rose-s)' : 'var(--amber-s)', color: isOut ? 'var(--rose)' : 'var(--amber)' }}>
                          {isOut ? '🔴 Out of Stock' : '🟡 Low Stock'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.78rem', color: sup ? 'var(--cyan)' : 'var(--txt3)' }}>
                        {sup?.company || sup?.name || p.supplier || '—'}
                      </td>
                      <td style={{ color: 'var(--txt2)' }}>{cur} {cost}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setQuantities(q => ({ ...q, [p.id]: Math.max(1, (q[p.id] ?? qty) - 5) }))}><Minus size={11} /></button>
                          <input type="number" className="input" value={quantities[p.id] ?? qty} min="1"
                            onChange={e => setQuantities(q => ({ ...q, [p.id]: Number(e.target.value) }))}
                            style={{ width: 64, textAlign: 'center', padding: '4px 6px' }}
                          />
                          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setQuantities(q => ({ ...q, [p.id]: (q[p.id] ?? qty) + 5 }))}><Plus size={11} /></button>
                        </div>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--emerald)' }}>{cur} {((quantities[p.id] ?? qty) * cost).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: 'var(--bg-input)' }}>
                  <td colSpan={8} style={{ textAlign: 'right', fontWeight: 800, padding: '12px 16px' }}>GRAND TOTAL:</td>
                  <td style={{ fontWeight: 900, color: 'var(--cyan)', fontSize: '1.05rem', padding: '12px 16px' }}>{cur} {totalPOValue.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Purchase Order Preview Modal */}
      <Modal isOpen={poModal} onClose={() => setPoModal(false)} title="📋 Purchase Order Preview" wide>
        <div className="modal-body">
          {poSent ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <CheckCircle size={56} color="var(--emerald)" style={{ marginBottom: 16 }} />
              <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--emerald)' }}>Purchase Order Sent!</div>
              <div style={{ color: 'var(--txt3)', marginTop: 8 }}>Stock levels have been updated in the system.</div>
            </div>
          ) : (
            <>
              <div style={{ padding: '12px 16px', marginBottom: 16, background: 'var(--bg-input)', borderRadius: 10, display: 'flex', justifyContent: 'space-between' }}>
                <div><div style={{ fontSize: '0.7rem', color: 'var(--txt3)' }}>PO DATE</div><div style={{ fontWeight: 700 }}>{new Date().toLocaleDateString()}</div></div>
                <div><div style={{ fontSize: '0.7rem', color: 'var(--txt3)' }}>ITEMS</div><div style={{ fontWeight: 700 }}>{lowStock.length}</div></div>
                <div><div style={{ fontSize: '0.7rem', color: 'var(--txt3)' }}>TOTAL VALUE</div><div style={{ fontWeight: 700, color: 'var(--cyan)' }}>{cur} {totalPOValue.toLocaleString()}</div></div>
                <div><div style={{ fontSize: '0.7rem', color: 'var(--txt3)' }}>PO #</div><div style={{ fontWeight: 700 }}>PO-{Date.now().toString().slice(-6)}</div></div>
              </div>
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead><tr><th>#</th><th>Product</th><th>Qty</th><th>Unit Cost</th><th>Total</th></tr></thead>
                  <tbody>
                    {lowStock.map((p, i) => {
                      const qty = quantities[p.id] ?? getReorderQty(p);
                      const cost = p.costPrice || Math.round(p.price * 0.6);
                      return (
                        <tr key={p.id}>
                          <td style={{ color: 'var(--txt3)' }}>{i + 1}</td>
                          <td style={{ fontWeight: 600 }}>{p.name}</td>
                          <td>{qty} {p.unit || 'pcs'}</td>
                          <td>{cur} {cost}</td>
                          <td style={{ fontWeight: 700, color: 'var(--emerald)' }}>{cur} {(qty * cost).toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr><td colSpan={4} style={{ textAlign: 'right', fontWeight: 800 }}>TOTAL</td><td style={{ fontWeight: 900, color: 'var(--cyan)' }}>{cur} {totalPOValue.toLocaleString()}</td></tr>
                  </tfoot>
                </table>
              </div>
              <div style={{ marginTop: 14, padding: '10px 16px', borderRadius: 10, background: 'var(--amber-s)', border: '1px solid var(--amber-g)', fontSize: '0.78rem', color: 'var(--txt2)' }}>
                ⚠️ Confirming will record this as a purchase and update stock levels automatically.
              </div>
            </>
          )}
        </div>
        {!poSent && (
          <div className="modal-foot">
            <button className="btn btn-ghost" onClick={exportPO}><Download size={14} /> Export CSV</button>
            <button className="btn btn-ghost" onClick={() => setPoModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSendPO}><Send size={14} /> Confirm & Update Stock</button>
          </div>
        )}
      </Modal>
    </div>
  );
}

import React, { useState } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, Search, CheckCircle, Printer } from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import Modal from '../components/Modal';

function Receipt({ txn, settings, onClose }) {
  return (
    <div className="modal-body">
      <div className="receipt">
        <div className="receipt-meta">
          {settings.logoUrl && (
            <img src={settings.logoUrl} alt="logo" style={{ width: 72, height: 72, objectFit: 'contain', display: 'block', margin: '0 auto 10px' }} />
          )}
          <h2>{settings.businessName}</h2>
          {settings.address && <div>{settings.address}</div>}
          {settings.phone && <div>{settings.phone}</div>}
          {settings.website && <div>{settings.website}</div>}
          {settings.businessHours && <div>{settings.businessHours}</div>}
          <div style={{ marginTop: 6, fontSize: '0.7rem' }}>{new Date().toLocaleString()}</div>
        </div>
        {txn.items.map((item, i) => (
          <div key={i} className="receipt-row">
            <span>{item.name} x{item.qty}</span>
            <span>{settings.currency} {(item.price * item.qty).toLocaleString()}</span>
          </div>
        ))}
        {txn.discount > 0 && <div className="receipt-row"><span>Discount</span><span>- {settings.currency} {txn.discount}</span></div>}
        {txn.tax > 0 && <div className="receipt-row"><span>Tax ({txn.taxRate}%)</span><span>{settings.currency} {txn.tax}</span></div>}
        <div className="receipt-total-row">
          <span>TOTAL</span>
          <span>{settings.currency} {txn.total?.toLocaleString()}</span>
        </div>
        <div className="receipt-row" style={{ marginTop: 8 }}><span>Payment</span><span>{txn.paymentMethod}</span></div>
        <div className="receipt-footer">{settings.receiptFooter}<br /><strong>Developed by Nazeer Ahmad</strong></div>
      </div>
      <div className="modal-foot">
        <button className="btn btn-ghost" onClick={onClose}>Close</button>
        <button className="btn btn-primary" onClick={() => window.print()}>
          <Printer size={15} /> Print Receipt
        </button>
      </div>
    </div>
  );
}

export default function POS({ searchQuery }) {
  const { data, addTransaction } = useBusiness();
  const { products, settings } = data;
  const cur = settings.currency;
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('%');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [catFilter, setCatFilter] = useState('All');
  const [receipt, setReceipt] = useState(null);
  const [note, setNote] = useState('');

  const categories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];
  const filtered = products.filter(p => {
    const matchQ = p.name?.toLowerCase().includes(searchQuery?.toLowerCase() || '');
    const matchC = catFilter === 'All' || p.category === catFilter;
    return matchQ && matchC;
  });

  const addToCart = (p) => {
    if (p.stock === 0) return;
    setCart(prev => {
      const ex = prev.find(i => i.id === p.id);
      if (ex) {
        if (ex.qty >= p.stock) return prev;
        return prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...p, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i));
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));

  const subtotal = cart.reduce((a, i) => a + i.price * i.qty, 0);
  const discountAmt = discountType === '%' ? Math.round(subtotal * discount / 100) : Number(discount);
  const taxAmt = Math.round((subtotal - discountAmt) * settings.taxRate / 100);
  const total = subtotal - discountAmt + taxAmt;

  const checkout = () => {
    if (!cart.length) return;
    const txn = { items: cart, subtotal, discount: discountAmt, taxRate: settings.taxRate, tax: taxAmt, total, paymentMethod, note };
    addTransaction(txn);
    setReceipt(txn);
    setCart([]); setDiscount(0); setNote('');
  };

  return (
    <div className="page-body anim-fade" style={{ paddingBottom: 0 }}>
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div>
          <h1 className="page-title">Point of Sale</h1>
          <div className="page-subtitle">Select products and complete the transaction</div>
        </div>
      </div>

      <div className="pos-layout">
        {/* Products */}
        <div className="glass" style={{ padding: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {categories.map(c => (
              <button key={c} className={`btn btn-sm ${catFilter === c ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setCatFilter(c)}>{c}</button>
            ))}
          </div>
          {filtered.length === 0 ? (
            <div className="empty-state"><ShoppingCart size={40} /><p>No products found. Add products in Inventory.</p></div>
          ) : (
            <div className="pos-products" style={{ flex: 1 }}>
              {filtered.map(p => (
                <div key={p.id} className={`card pos-product-card ${p.stock === 0 ? 'out-of-stock' : ''}`} onClick={() => addToCart(p)}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>{p.name}</div>
                  <div style={{ color: 'var(--cyan)', fontSize: '1.15rem', fontWeight: 800, marginBottom: 6 }}>{cur} {p.price?.toLocaleString()}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className={`badge ${p.stock === 0 ? 'badge-danger' : p.stock <= p.minStock ? 'badge-warning' : 'badge-success'}`}>
                      {p.stock === 0 ? 'Out of Stock' : `${p.stock} in stock`}
                    </span>
                    {p.stock > 0 && <Plus size={16} color="var(--cyan)" />}
                  </div>
                  {p.category && <div style={{ marginTop: 6, fontSize: '0.7rem', color: 'var(--txt3)' }}>{p.category}{p.sku ? ` · ${p.sku}` : ''}</div>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart */}
        <div className="glass pos-cart" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><ShoppingCart size={16} /> Cart</h3>
            {cart.length > 0 && <button className="btn btn-sm" style={{ color: 'var(--rose)', background: 'none', border: 'none' }} onClick={() => setCart([])}>Clear All</button>}
          </div>

          <div className="pos-cart-items">
            {cart.length === 0 ? (
              <div className="empty-state" style={{ paddingTop: 40 }}><ShoppingCart size={40} /><p>Tap a product to add</p></div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="pos-cart-item">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--txt3)' }}>{cur} {item.price?.toLocaleString()} each</div>
                  </div>
                  <div className="qty-ctrl">
                    <button className="qty-btn" onClick={() => updateQty(item.id, -1)}><Minus size={12} /></button>
                    <span style={{ fontWeight: 700, minWidth: 22, textAlign: 'center' }}>{item.qty}</span>
                    <button className="qty-btn" onClick={() => updateQty(item.id, 1)}><Plus size={12} /></button>
                  </div>
                  <div style={{ textAlign: 'right', minWidth: 70 }}>
                    <div style={{ fontWeight: 700, color: 'var(--cyan)', fontSize: '0.9rem' }}>{cur} {(item.price * item.qty).toLocaleString()}</div>
                    <button onClick={() => removeFromCart(item.id)} style={{ background: 'none', border: 'none', color: 'var(--rose)', cursor: 'pointer', marginTop: 2, display: 'flex' }}><Trash2 size={13} /></button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pos-checkout">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              <div className="input-wrap">
                <label className="input-label">Discount</label>
                <div style={{ display: 'flex', gap: 4 }}>
                  <input className="input" type="number" min="0" value={discount} onChange={e => setDiscount(e.target.value)} style={{ flex: 1 }} />
                  <select className="select-input" style={{ width: 55 }} value={discountType} onChange={e => setDiscountType(e.target.value)}>
                    <option value="%">%</option><option value="flat">Flat</option>
                  </select>
                </div>
              </div>
              <div className="input-wrap">
                <label className="input-label">Payment</label>
                <select className="select-input" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                  <option>Cash</option><option>Card</option><option>Online</option><option>Cheque</option>
                </select>
              </div>
            </div>

            <div className="checkout-line"><span>Subtotal</span><span>{cur} {subtotal.toLocaleString()}</span></div>
            {discountAmt > 0 && <div className="checkout-line" style={{ color: 'var(--emerald)' }}><span>Discount</span><span>- {cur} {discountAmt.toLocaleString()}</span></div>}
            {taxAmt > 0 && <div className="checkout-line"><span>Tax ({settings.taxRate}%)</span><span>{cur} {taxAmt.toLocaleString()}</span></div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <span style={{ fontWeight: 700 }}>TOTAL</span>
              <span className="checkout-total">{cur} {total.toLocaleString()}</span>
            </div>

            <button className="btn btn-success w-full btn-lg" style={{ marginTop: 14 }} disabled={!cart.length} onClick={checkout}>
              <CheckCircle size={18} /> Complete Sale
            </button>
          </div>
        </div>
      </div>

      <Modal isOpen={!!receipt} onClose={() => setReceipt(null)} title="Transaction Complete">
        {receipt && <Receipt txn={receipt} settings={settings} onClose={() => setReceipt(null)} />}
      </Modal>
    </div>
  );
}

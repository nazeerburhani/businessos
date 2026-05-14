import React, { useState } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, Search, CheckCircle, Printer, X, Package } from 'lucide-react';
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
        <div className="receipt-row" style={{ marginTop: 8 }}><span>Payment</span><span style={{ textTransform: 'capitalize' }}>{txn.paymentMethod}</span></div>
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
  const { products, settings, khata } = data;
  const cur = settings.currency;
  
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('%');
  const [paymentMethod, setPaymentMethod] = useState('cash'); // cash, bank, khata
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [receipt, setReceipt] = useState(null);

  const categories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];
  const filtered = products.filter(p => {
    const s = searchQuery?.toLowerCase() || '';
    const matchQ = p.name?.toLowerCase().includes(s) || p.sku?.toLowerCase().includes(s);
    const matchC = catFilter === 'All' || p.category === catFilter;
    return matchQ && matchC;
  });

  const addToCart = (p) => {
    if (p.stock <= 0) return;
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
    setCart(prev => prev.map(i => {
      if (i.id !== id) return i;
      const p = products.find(prod => prod.id === id);
      const newQty = Math.max(1, i.qty + delta);
      return newQty <= (p?.stock || 0) ? { ...i, qty: newQty } : i;
    }));
  };

  const subtotal = cart.reduce((a, i) => a + i.price * i.qty, 0);
  const discountAmt = discountType === '%' ? Math.round(subtotal * Number(discount || 0) / 100) : Number(discount || 0);
  const taxAmt = Math.round((subtotal - discountAmt) * settings.taxRate / 100);
  const total = subtotal - discountAmt + taxAmt;

  const checkout = () => {
    if (!cart.length) return;
    if (paymentMethod === 'khata' && !selectedCustomer) {
      alert('Please select a customer for Khata sale.');
      return;
    }

    const txn = { 
      items: cart, 
      subtotal, 
      discount: discountAmt, 
      taxRate: settings.taxRate, 
      tax: taxAmt, 
      total, 
      paymentMethod,
      customerId: paymentMethod === 'khata' ? Number(selectedCustomer) : null
    };
    
    addTransaction(txn);
    setReceipt(txn);
    setCart([]);
    setDiscount(0);
    setSelectedCustomer('');
  };

  return (
    <div className="page-body anim-fade">
      <div className="pos-layout">
        {/* Products Grid */}
        <div className="glass" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {categories.map(c => (
              <button key={c} className={`btn btn-sm ${catFilter === c ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setCatFilter(c)}>{c}</button>
            ))}
          </div>
          <div className="pos-products" style={{ flex: 1 }}>
            {filtered.length === 0 ? (
              <div className="empty-state" style={{ gridColumn: '1/-1' }}><ShoppingCart size={40} /><p>No products found</p></div>
            ) : filtered.map(p => (
              <div key={p.id} className={`card pos-product-card ${p.stock <= 0 ? 'out-of-stock' : ''}`} onClick={() => addToCart(p)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>{p.category}</span>
                  <span className={`badge ${p.stock <= p.minStock ? 'badge-warning' : 'badge-success'}`}>{p.stock} left</span>
                </div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: 4 }}>{p.name}</div>
                <div style={{ color: 'var(--cyan)', fontWeight: 900 }}>{cur} {p.price?.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Cart Panel */}
        <div className="glass pos-cart">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Current Cart</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => setCart([])}>Clear</button>
          </div>

          <div className="pos-cart-items">
            {cart.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 0' }}><ShoppingCart size={32} /><p>Cart is empty</p></div>
            ) : cart.map(item => (
              <div key={item.id} className="pos-cart-item">
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{item.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--cyan)' }}>{cur} {item.price.toLocaleString()}</div>
                </div>
                <div className="qty-ctrl">
                  <button className="qty-btn" onClick={() => updateQty(item.id, -1)}>-</button>
                  <span style={{ minWidth: 20, textAlign: 'center', fontWeight: 800 }}>{item.qty}</span>
                  <button className="qty-btn" onClick={() => updateQty(item.id, 1)}>+</button>
                </div>
                <button className="btn btn-icon" style={{ color: 'var(--rose)', padding: 4 }} onClick={() => setCart(cart.filter(i => i.id !== item.id))}><Trash2 size={14} /></button>
              </div>
            ))}
          </div>

          <div className="pos-checkout">
            {/* Payment Method Selector */}
            <div style={{ padding: '0 20px 12px' }}>
              <div className="input-label" style={{ marginBottom: 6 }}>Payment Account</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {['cash', 'bank', 'khata'].map(m => (
                  <button 
                    key={m} 
                    className={`btn btn-sm ${paymentMethod === m ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ flex: 1, textTransform: 'capitalize' }}
                    onClick={() => setPaymentMethod(m)}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {paymentMethod === 'khata' && (
              <div style={{ padding: '0 20px 12px' }}>
                <select className="select-input" value={selectedCustomer} onChange={e => setSelectedCustomer(e.target.value)} style={{ width: '100%' }}>
                  <option value="">-- Select Customer --</option>
                  {khata.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}

            <div style={{ padding: '0 20px 20px' }}>
              <div className="checkout-line">
                <span>Discount</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <input type="number" className="input" style={{ width: 60, height: 28, padding: '2px 8px' }} value={discount} onChange={e => setDiscount(e.target.value)} />
                  <select className="select-input" style={{ width: 45, height: 28 }} value={discountType} onChange={e => setDiscountType(e.target.value)}>
                    <option>%</option><option>flat</option>
                  </select>
                </div>
              </div>
              <div className="checkout-line"><span>Subtotal</span><span>{cur} {subtotal.toLocaleString()}</span></div>
              {taxAmt > 0 && <div className="checkout-line"><span>Tax ({settings.taxRate}%)</span><span>{cur} {taxAmt.toLocaleString()}</span></div>}
              <div className="checkout-line checkout-total" style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border2)' }}>
                <span>Total</span><span>{cur} {total.toLocaleString()}</span>
              </div>
              <button className="btn btn-primary w-full btn-lg" style={{ marginTop: 14 }} onClick={checkout} disabled={!cart.length}>
                <CheckCircle size={18} /> Complete Sale
              </button>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={!!receipt} onClose={() => setReceipt(null)} title="Print Receipt">
        <Receipt txn={receipt} settings={settings} onClose={() => setReceipt(null)} />
      </Modal>
    </div>
  );
}

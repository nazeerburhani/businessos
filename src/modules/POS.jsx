import React, { useState } from 'react';
import { ShoppingCart, Plus, Trash2, CheckCircle, Printer, Pause, Play, X, MessageCircle, AlertTriangle, CreditCard, Banknote, BookOpen, Camera, FileDown } from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import Modal from '../components/Modal';
import BarcodeScanner from '../components/BarcodeScanner';
import { generateInvoicePDF } from '../utils/invoicePDF';

// ─── RECEIPT COMPONENT ────────────────────────────────────────────────────────
function Receipt({ txn, settings, onClose }) {
  if (!txn) return null;
  const payLabel = txn.payments?.map(p => `${p.method} (${settings.currency}${p.amount})`).join(' + ') || txn.paymentMethod;

  const whatsappText = encodeURIComponent(
    `*${settings.businessName}*\n` +
    `📍 ${settings.address || ''}\n` +
    `📞 ${settings.phone || ''}\n` +
    `────────────────\n` +
    txn.items.map(i => `• ${i.name} × ${i.qty} = ${settings.currency} ${(i.price * i.qty).toLocaleString()}`).join('\n') +
    `\n────────────────\n` +
    `*Total: ${settings.currency} ${txn.total?.toLocaleString()}*\n` +
    `Payment: ${payLabel}\n` +
    `${settings.receiptFooter}`
  );

  return (
    <div className="modal-body">
      <div className="receipt">
        {settings.logoUrl && (
          <img src={settings.logoUrl} alt="logo" style={{ width: 72, height: 72, objectFit: 'contain', display: 'block', margin: '0 auto 10px' }} />
        )}
        <div className="receipt-meta">
          <h2>{settings.businessName}</h2>
          {settings.address && <div>{settings.address}</div>}
          {settings.phone && <div>{settings.phone}</div>}
          {settings.website && <div>{settings.website}</div>}
          <div style={{ marginTop: 6, fontSize: '0.7rem' }}>{new Date().toLocaleString()}</div>
        </div>
        {txn.items.map((item, i) => (
          <div key={i} className="receipt-row">
            <span>{item.name} × {item.qty}</span>
            <span>{settings.currency} {(item.price * item.qty).toLocaleString()}</span>
          </div>
        ))}
        {txn.discount > 0 && <div className="receipt-row"><span>Discount</span><span>- {settings.currency} {txn.discount}</span></div>}
        {txn.tax > 0 && <div className="receipt-row"><span>Tax ({txn.taxRate}%)</span><span>{settings.currency} {txn.tax}</span></div>}
        <div className="receipt-total-row">
          <span>TOTAL</span>
          <span>{settings.currency} {txn.total?.toLocaleString()}</span>
        </div>
        <div className="receipt-row" style={{ marginTop: 8 }}>
          <span>Payment</span>
          <span style={{ textTransform: 'capitalize', fontSize: '0.75rem' }}>{payLabel}</span>
        </div>
        <div className="receipt-footer">{settings.receiptFooter}<br /><strong>Developed by Nazeer Ahmad</strong></div>
      </div>
      <div className="modal-foot">
        <button className="btn btn-ghost" onClick={onClose}>Close</button>
        <button className="btn btn-ghost" style={{ color: 'var(--violet)', border: '1px solid var(--violet-g)', background: 'var(--violet-s)' }} onClick={() => generateInvoicePDF(txn, settings)}>
          <FileDown size={15} /> PDF Invoice
        </button>
        <a
          className="btn btn-ghost"
          href={`https://wa.me/?text=${whatsappText}`}
          target="_blank"
          rel="noreferrer"
          style={{ color: '#25D366', border: '1px solid #25D36655', background: 'rgba(37,211,102,0.08)', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <MessageCircle size={15} /> WhatsApp
        </a>
        <button className="btn btn-primary" onClick={() => window.print()}>
          <Printer size={15} /> Print
        </button>
      </div>
    </div>
  );
}

// ─── PAYMENT ROW ─────────────────────────────────────────────────────────────
const PAYMENT_METHODS = [
  { id: 'cash',  label: 'Cash',  icon: Banknote,   color: 'var(--emerald)' },
  { id: 'bank',  label: 'Bank',  icon: CreditCard, color: 'var(--cyan)'    },
  { id: 'khata', label: 'Khata', icon: BookOpen,   color: 'var(--amber)'   },
];

// ─── MAIN POS ─────────────────────────────────────────────────────────────────
export default function POS({ searchQuery }) {
  const { data, addTransaction, holdBill, resumeBill, deleteHeldBill } = useBusiness();
  const { products, settings, khata, heldBills } = data;
  const cur = settings.currency;

  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('%');
  const [catFilter, setCatFilter] = useState('All');
  const [receipt, setReceipt] = useState(null);
  const [heldModal, setHeldModal] = useState(false);
  const [holdNote, setHoldNote] = useState('');
  const [creditAlert, setCreditAlert] = useState(null);
  const [scannerOpen, setScannerOpen] = useState(false);

  // Multi-payment state
  const [payments, setPayments] = useState([{ method: 'cash', amount: '', customerId: '' }]);

  const handleBarcodeScan = (code) => {
    setScannerOpen(false);
    // Match against SKU field in products
    const matched = products.find(p => p.sku === code || p.sku?.toLowerCase() === code.toLowerCase());
    if (matched) {
      addToCart(matched);
    } else {
      alert(`No product found with SKU: ${code}\nPlease add the SKU in Inventory.`);
    }
  };

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
      const newQty = i.qty + delta;
      if (newQty < 1) return i;
      if (newQty > (p?.stock || 0)) return i;
      return { ...i, qty: newQty };
    }));
  };

  const subtotal = cart.reduce((a, i) => a + i.price * i.qty, 0);
  const discountAmt = discountType === '%' ? Math.round(subtotal * Number(discount || 0) / 100) : Number(discount || 0);
  const taxAmt = Math.round((subtotal - discountAmt) * settings.taxRate / 100);
  const total = subtotal - discountAmt + taxAmt;

  // Auto-fill first payment amount when total changes
  const updatePaymentAmount = (idx, field, val) => {
    setPayments(prev => prev.map((p, i) => i === idx ? { ...p, [field]: val } : p));
  };

  const addPaymentRow = () => setPayments(prev => [...prev, { method: 'cash', amount: '', customerId: '' }]);
  const removePaymentRow = (idx) => setPayments(prev => prev.filter((_, i) => i !== idx));

  const paymentsTotal = payments.reduce((a, p) => a + Number(p.amount || 0), 0);
  const remaining = total - paymentsTotal;

  const checkout = () => {
    if (!cart.length) return;

    // Validate payments cover the total
    if (Math.abs(remaining) > 0.5) {
      alert(`Payment amount (${cur} ${paymentsTotal}) doesn't match total (${cur} ${total}). Remaining: ${cur} ${remaining.toFixed(0)}`);
      return;
    }

    // Credit limit check for khata payments
    for (const pay of payments) {
      if (pay.method === 'khata') {
        if (!pay.customerId) { alert('Please select a customer for Khata payment.'); return; }
        const customer = khata.find(k => k.id === Number(pay.customerId));
        if (customer?.creditLimit > 0 && (customer.balance + Number(pay.amount)) > customer.creditLimit) {
          setCreditAlert({ customer, amount: Number(pay.amount) });
          return;
        }
      }
    }

    const txn = {
      items: cart,
      subtotal,
      discount: discountAmt,
      taxRate: settings.taxRate,
      tax: taxAmt,
      total,
      payments: payments.map(p => ({ ...p, amount: Number(p.amount), customerId: Number(p.customerId) || null })),
    };

    addTransaction(txn);
    setReceipt(txn);
    setCart([]);
    setDiscount(0);
    setPayments([{ method: 'cash', amount: '', customerId: '' }]);
  };

  const doHold = () => {
    if (!cart.length) return;
    holdBill(cart, holdNote);
    setCart([]);
    setDiscount(0);
    setHoldNote('');
    setPayments([{ method: 'cash', amount: '', customerId: '' }]);
  };

  const doResume = (id) => {
    const bill = resumeBill(id);
    if (bill) {
      setCart(bill.cart);
      setHeldModal(false);
    }
  };

  return (
    <div className="page-body anim-fade">
      <div className="pos-layout">

        {/* ── Left: Products ── */}
        <div className="glass" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}>
          {/* Category filter + scanner button */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0, alignItems: 'center' }}>
            {categories.map(c => (
              <button key={c} className={`btn btn-sm ${catFilter === c ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setCatFilter(c)}>{c}</button>
            ))}
            <button
              className="btn btn-ghost btn-sm btn-icon"
              style={{ marginLeft: 'auto', color: 'var(--cyan)', border: '1px solid var(--cyan-g)', flexShrink: 0 }}
              onClick={() => setScannerOpen(true)}
              title="Scan Barcode"
            >
              <Camera size={15} />
            </button>
          </div>

          {/* Products grid */}
          <div className="pos-products" style={{ flex: 1 }}>
            {filtered.length === 0 ? (
              <div className="empty-state" style={{ gridColumn: '1/-1' }}><ShoppingCart size={40} /><p>No products. Add in Inventory.</p></div>
            ) : filtered.map(p => (
              <div key={p.id} className={`card pos-product-card ${p.stock <= 0 ? 'out-of-stock' : ''}`} onClick={() => addToCart(p)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span className="badge badge-primary" style={{ fontSize: '0.6rem' }}>{p.category}</span>
                  <span className={`badge ${p.stock <= 0 ? 'badge-danger' : p.stock <= (p.minStock || 5) ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: '0.6rem' }}>
                    {p.stock <= 0 ? 'OUT' : `${p.stock}`}
                  </span>
                </div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: 4, lineHeight: 1.2 }}>{p.name}</div>
                <div style={{ color: 'var(--cyan)', fontWeight: 900, fontSize: '1rem' }}>{cur} {p.price?.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: Cart ── */}
        <div className="glass pos-cart">
          {/* Cart header */}
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShoppingCart size={16} color="var(--cyan)" /> Cart
              {cart.length > 0 && <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>{cart.length}</span>}
            </h3>
            <div style={{ display: 'flex', gap: 6 }}>
              {heldBills?.length > 0 && (
                <button className="btn btn-ghost btn-sm" onClick={() => setHeldModal(true)} style={{ color: 'var(--amber)', position: 'relative' }}>
                  <Play size={13} /> Held
                  <span style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, background: 'var(--amber)', borderRadius: '50%', fontSize: '0.55rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 700 }}>
                    {heldBills.length}
                  </span>
                </button>
              )}
              <button className="btn btn-ghost btn-sm" onClick={() => setCart([])} disabled={!cart.length}>Clear</button>
            </div>
          </div>

          {/* Cart items */}
          <div className="pos-cart-items">
            {cart.length === 0 ? (
              <div className="empty-state" style={{ padding: '30px 0' }}><ShoppingCart size={28} /><p>Tap a product to add</p></div>
            ) : cart.map(item => (
              <div key={item.id} className="pos-cart-item">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--cyan)' }}>{cur} {(item.price * item.qty).toLocaleString()}</div>
                </div>
                <div className="qty-ctrl">
                  <button className="qty-btn" onClick={() => updateQty(item.id, -1)}>-</button>
                  <span style={{ minWidth: 22, textAlign: 'center', fontWeight: 800, fontSize: '0.9rem' }}>{item.qty}</span>
                  <button className="qty-btn" onClick={() => updateQty(item.id, 1)}>+</button>
                </div>
                <button style={{ background: 'none', border: 'none', color: 'var(--rose)', cursor: 'pointer', padding: 4 }} onClick={() => setCart(cart.filter(i => i.id !== item.id))}><Trash2 size={13} /></button>
              </div>
            ))}
          </div>

          {/* Checkout panel */}
          <div className="pos-checkout" style={{ flexShrink: 0 }}>
            {/* Discount */}
            <div style={{ padding: '0 16px 10px', display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--txt2)', flex: 1 }}>Discount</span>
              <input type="number" className="input" style={{ width: 70, height: 30, padding: '2px 8px', fontSize: '0.85rem' }} value={discount} onChange={e => setDiscount(e.target.value)} min="0" />
              <select className="select-input" style={{ width: 55, height: 30, fontSize: '0.8rem' }} value={discountType} onChange={e => setDiscountType(e.target.value)}>
                <option value="%">%</option>
                <option value="flat">Flat</option>
              </select>
            </div>

            {/* Totals */}
            <div style={{ padding: '0 16px', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
              <div className="checkout-line"><span>Subtotal</span><span>{cur} {subtotal.toLocaleString()}</span></div>
              {discountAmt > 0 && <div className="checkout-line" style={{ color: 'var(--emerald)' }}><span>Discount</span><span>- {cur} {discountAmt.toLocaleString()}</span></div>}
              {taxAmt > 0 && <div className="checkout-line"><span>Tax ({settings.taxRate}%)</span><span>{cur} {taxAmt.toLocaleString()}</span></div>}
              <div className="checkout-line checkout-total" style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--border2)' }}>
                <span>TOTAL</span><span>{cur} {total.toLocaleString()}</span>
              </div>
            </div>

            {/* Payment rows */}
            <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border)', marginTop: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--txt3)', fontWeight: 600 }}>PAYMENT</span>
                <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.7rem', padding: '2px 8px' }} onClick={addPaymentRow}>+ Split</button>
              </div>
              {payments.map((pay, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 5, marginBottom: 5, alignItems: 'center' }}>
                  <select
                    className="select-input"
                    style={{ flex: 1, height: 32, fontSize: '0.8rem' }}
                    value={pay.method}
                    onChange={e => updatePaymentAmount(idx, 'method', e.target.value)}
                  >
                    {PAYMENT_METHODS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                  </select>
                  {pay.method === 'khata' && (
                    <select
                      className="select-input"
                      style={{ flex: 1.5, height: 32, fontSize: '0.75rem' }}
                      value={pay.customerId}
                      onChange={e => updatePaymentAmount(idx, 'customerId', e.target.value)}
                    >
                      <option value="">-- Customer --</option>
                      {khata.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  )}
                  <input
                    type="number"
                    className="input"
                    placeholder={idx === 0 ? total.toString() : '0'}
                    style={{ width: 80, height: 32, padding: '2px 8px', fontSize: '0.85rem' }}
                    value={pay.amount}
                    onChange={e => updatePaymentAmount(idx, 'amount', e.target.value)}
                  />
                  {payments.length > 1 && (
                    <button style={{ background: 'none', border: 'none', color: 'var(--rose)', cursor: 'pointer' }} onClick={() => removePaymentRow(idx)}><X size={13} /></button>
                  )}
                </div>
              ))}
              {remaining !== 0 && payments[0].amount !== '' && (
                <div style={{ fontSize: '0.7rem', color: remaining > 0 ? 'var(--rose)' : 'var(--emerald)', marginTop: 2 }}>
                  {remaining > 0 ? `Remaining: ${cur} ${remaining.toFixed(0)}` : `Change: ${cur} ${Math.abs(remaining).toFixed(0)}`}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ padding: '8px 16px 16px', display: 'flex', gap: 8 }}>
              <button
                className="btn btn-ghost"
                style={{ flex: 0 }}
                onClick={doHold}
                disabled={!cart.length}
                title="Hold Bill"
              >
                <Pause size={15} />
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={checkout}
                disabled={!cart.length}
              >
                <CheckCircle size={16} /> Complete Sale
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Receipt Modal ── */}
      <Modal isOpen={!!receipt} onClose={() => setReceipt(null)} title="Sale Complete ✓">
        <Receipt txn={receipt} settings={settings} onClose={() => setReceipt(null)} />
      </Modal>

      {/* ── Held Bills Modal ── */}
      <Modal isOpen={heldModal} onClose={() => setHeldModal(false)} title="Held Bills">
        <div className="modal-body">
          {heldBills?.length === 0 ? (
            <div className="empty-state"><Pause size={32} /><p>No held bills</p></div>
          ) : heldBills.map(b => (
            <div key={b.id} className="card" style={{ padding: '12px 16px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700 }}>{b.note || 'Unnamed Bill'}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--txt3)' }}>{b.cart.length} items · Saved at {b.savedAt}</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-primary btn-sm" onClick={() => doResume(b.id)}><Play size={12} /> Resume</button>
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--rose)' }} onClick={() => deleteHeldBill(b.id)}><Trash2 size={12} /></button>
              </div>
            </div>
          ))}
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={() => setHeldModal(false)}>Close</button>
        </div>
      </Modal>

      {/* ── Credit Limit Warning ── */}
      <Modal isOpen={!!creditAlert} onClose={() => setCreditAlert(null)} title="Credit Limit Exceeded">
        <div className="modal-body" style={{ textAlign: 'center' }}>
          <AlertTriangle size={48} color="var(--amber)" style={{ marginBottom: 16 }} />
          <h3>{creditAlert?.customer?.name}</h3>
          <p style={{ color: 'var(--txt2)', margin: '8px 0' }}>
            Current balance: <strong>{cur} {creditAlert?.customer?.balance?.toLocaleString()}</strong><br/>
            New charge: <strong>{cur} {creditAlert?.amount?.toLocaleString()}</strong><br/>
            Credit limit: <strong>{cur} {creditAlert?.customer?.creditLimit?.toLocaleString()}</strong>
          </p>
          <p style={{ color: 'var(--rose)', fontSize: '0.85rem' }}>This sale will exceed the credit limit by <strong>{cur} {((creditAlert?.customer?.balance || 0) + (creditAlert?.amount || 0) - (creditAlert?.customer?.creditLimit || 0)).toLocaleString()}</strong></p>
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={() => setCreditAlert(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={() => {
            setCreditAlert(null);
            // Force checkout bypassing limit
            const txn = {
              items: cart,
              subtotal,
              discount: discountAmt,
              taxRate: settings.taxRate,
              tax: taxAmt,
              total,
              payments: payments.map(p => ({ ...p, amount: Number(p.amount), customerId: Number(p.customerId) || null })),
            };
            addTransaction(txn);
            setReceipt(txn);
            setCart([]);
            setDiscount(0);
            setPayments([{ method: 'cash', amount: '', customerId: '' }]);
          }}>Override & Complete Sale</button>
        </div>
      </Modal>

      {/* ── Barcode Scanner Modal ── */}
      <Modal isOpen={scannerOpen} onClose={() => setScannerOpen(false)} title="Scan Barcode">
        <BarcodeScanner
          onScan={handleBarcodeScan}
          onClose={() => setScannerOpen(false)}
        />
      </Modal>
    </div>
  );
}

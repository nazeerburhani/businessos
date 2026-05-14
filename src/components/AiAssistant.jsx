import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Send, Zap, TrendingUp, Package, AlertTriangle, RefreshCw } from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';

// ─── Smart Insights Engine ─────────────────────────────────────────────────
function generateInsights(data, stats) {
  const insights = [];
  const cur = data.settings.currency;

  // 1. Smart Reorder Predictions — estimate days until stockout
  const productSalesRate = {};
  const now = new Date();
  data.transactions.forEach(t => {
    const daysAgo = (now - new Date(t.date)) / 86400000;
    if (daysAgo <= 30) {
      t.items?.forEach(item => {
        productSalesRate[item.id] = (productSalesRate[item.id] || 0) + (item.qty || 0);
      });
    }
  });

  data.products.forEach(p => {
    const salesPerDay = (productSalesRate[p.id] || 0) / 30;
    if (salesPerDay > 0 && p.stock > 0) {
      const daysLeft = Math.floor(p.stock / salesPerDay);
      if (daysLeft <= 7) {
        insights.push({
          type: 'reorder',
          icon: '🔴',
          title: `Reorder ${p.name}`,
          text: `At current sales pace, "${p.name}" will run out in ~${daysLeft} day${daysLeft !== 1 ? 's' : ''}. You sell ~${salesPerDay.toFixed(1)} units/day. Stock: ${p.stock}`,
          action: 'Order Now',
        });
      } else if (daysLeft <= 14) {
        insights.push({
          type: 'reorder',
          icon: '🟡',
          title: `Low Soon: ${p.name}`,
          text: `"${p.name}" may run out in ~${daysLeft} days based on recent sales. Consider restocking.`,
          action: 'Review Stock',
        });
      }
    }
  });

  // 2. Expense Insight — compare this month vs last month
  const thisMonth = now.toISOString().slice(0, 7);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7);
  const thisExp = data.expenses.filter(e => e.date?.startsWith(thisMonth)).reduce((a, e) => a + e.amount, 0);
  const lastExp = data.expenses.filter(e => e.date?.startsWith(lastMonth)).reduce((a, e) => a + e.amount, 0);
  if (lastExp > 0 && thisExp > 0) {
    const pct = Math.round(((thisExp - lastExp) / lastExp) * 100);
    if (Math.abs(pct) >= 10) {
      insights.push({
        type: 'expense',
        icon: pct > 0 ? '📈' : '📉',
        title: `Expenses ${pct > 0 ? 'Up' : 'Down'} ${Math.abs(pct)}%`,
        text: `This month's expenses are ${cur} ${thisExp.toLocaleString()} vs last month's ${cur} ${lastExp.toLocaleString()} — a ${Math.abs(pct)}% ${pct > 0 ? 'increase' : 'decrease'}.`,
        action: 'View Expenses',
      });
    }
  }

  // 3. Combo Product Suggestions — find products frequently sold together
  const combos = {};
  data.transactions.filter(t => t.items?.length >= 2).forEach(t => {
    const ids = t.items.map(i => i.id).sort();
    for (let a = 0; a < ids.length; a++) {
      for (let b = a + 1; b < ids.length; b++) {
        const key = `${ids[a]}_${ids[b]}`;
        combos[key] = (combos[key] || 0) + 1;
      }
    }
  });
  const topCombo = Object.entries(combos).sort((a, b) => b[1] - a[1])[0];
  if (topCombo && topCombo[1] >= 2) {
    const [id1, id2] = topCombo[0].split('_');
    const p1 = data.products.find(p => p.id === Number(id1));
    const p2 = data.products.find(p => p.id === Number(id2));
    if (p1 && p2) {
      insights.push({
        type: 'combo',
        icon: '🤝',
        title: 'Combo Opportunity',
        text: `"${p1.name}" and "${p2.name}" are bought together ${topCombo[1]} times! Consider offering a bundle discount to increase average bill value.`,
        action: 'Create Offer',
      });
    }
  }

  // 4. Revenue Today vs yesterday
  const today = now.toISOString().split('T')[0];
  const yesterday = new Date(now.getTime() - 86400000).toISOString().split('T')[0];
  const todayRev = data.transactions.filter(t => t.date === today).reduce((a, t) => a + t.total, 0);
  const yestRev = data.transactions.filter(t => t.date === yesterday).reduce((a, t) => a + t.total, 0);
  if (todayRev > 0 && yestRev > 0) {
    const diff = Math.round(((todayRev - yestRev) / yestRev) * 100);
    insights.push({
      type: 'revenue',
      icon: diff >= 0 ? '🚀' : '📊',
      title: `Today vs Yesterday`,
      text: `Today's sales: ${cur} ${todayRev.toLocaleString()}. Yesterday: ${cur} ${yestRev.toLocaleString()}. ${diff >= 0 ? `Up ${diff}% 🎉` : `Down ${Math.abs(diff)}%`}`,
    });
  }

  // 5. Khata overdue
  const overdueCustomers = data.khata.filter(k => k.balance > 0 && k.history?.some(h => {
    const daysAgo = (now - new Date(h.date)) / 86400000;
    return h.type === 'debt' && daysAgo > 15;
  }));
  if (overdueCustomers.length > 0) {
    const totalOverdue = overdueCustomers.reduce((a, k) => a + k.balance, 0);
    insights.push({
      type: 'khata',
      icon: '⚠️',
      title: `${overdueCustomers.length} Overdue Customers`,
      text: `${overdueCustomers.length} customers have balances overdue 15+ days. Total outstanding: ${cur} ${totalOverdue.toLocaleString()}. Send WhatsApp reminders from Khata module.`,
      action: 'Go to Khata',
    });
  }

  return insights.slice(0, 5); // max 5 insights
}

// ─── Chat Response Engine ──────────────────────────────────────────────────
function getResponse(q, data, stats) {
  const cur = data?.settings?.currency || 'Rs.';

  // Reorder prediction
  if (q.includes('reorder') || q.includes('run out') || q.includes('stockout')) {
    const now = new Date();
    const productSalesRate = {};
    data.transactions.forEach(t => {
      const daysAgo = (now - new Date(t.date)) / 86400000;
      if (daysAgo <= 30) {
        t.items?.forEach(item => { productSalesRate[item.id] = (productSalesRate[item.id] || 0) + (item.qty || 0); });
      }
    });
    const critical = data.products.filter(p => {
      const rate = (productSalesRate[p.id] || 0) / 30;
      return rate > 0 && (p.stock / rate) <= 7;
    });
    if (critical.length === 0) return 'Great news! All products have sufficient stock for the next 7+ days based on current sales rates.';
    return `🔴 ${critical.length} product(s) will run out within 7 days:\n${critical.map(p => {
      const rate = (productSalesRate[p.id] || 0) / 30;
      const days = Math.floor(p.stock / rate);
      return `• ${p.name}: ~${days} days left (stock: ${p.stock})`;
    }).join('\n')}`;
  }

  if (q.includes('profit') || q.includes('net')) return `Net profit: ${cur} ${stats?.netProfit?.toLocaleString() || 0}. Revenue: ${cur} ${stats?.totalRevenue?.toLocaleString()} | Expenses: ${cur} ${stats?.totalExpenses?.toLocaleString()}.`;
  if (q.includes('today')) {
    const today = new Date().toISOString().split('T')[0];
    const todaySales = data.transactions.filter(t => t.date === today);
    const todayRev = todaySales.reduce((a, t) => a + t.total, 0);
    return `Today: ${todaySales.length} sales, ${cur} ${todayRev.toLocaleString()} revenue. Cash: ${cur} ${stats?.cashBalance?.toLocaleString()} | Bank: ${cur} ${stats?.bankBalance?.toLocaleString()}.`;
  }
  if (q.includes('stock') || q.includes('inventory')) return `Inventory: ${stats?.lowStockCount || 0} low stock, ${stats?.outOfStockCount || 0} out of stock${stats?.expiringSoon > 0 ? `, ${stats.expiringSoon} expiring soon` : ''}. Total products: ${data.products.length}.`;
  if (q.includes('sale') || q.includes('revenue')) return `Total revenue: ${cur} ${stats?.totalRevenue?.toLocaleString() || 0} across ${data?.transactions?.length || 0} transactions.`;
  if (q.includes('expense') || q.includes('cost')) return `Total expenses: ${cur} ${stats?.totalExpenses?.toLocaleString() || 0} in ${data?.expenses?.length || 0} entries.`;
  if (q.includes('customer') || q.includes('khata') || q.includes('debt')) return `Khata outstanding: ${cur} ${stats?.pendingKhata?.toLocaleString() || 0} from ${data?.khata?.length || 0} customers.`;
  if (q.includes('employee') || q.includes('staff')) return `${data?.employees?.length || 0} staff. Monthly payroll: ${cur} ${data?.employees?.reduce((a, e) => a + (e.salary || 0), 0)?.toLocaleString() || 0}.`;
  if (q.includes('top product') || q.includes('best sell')) {
    const smap = {};
    data.transactions.forEach(t => t.items?.forEach(i => { smap[i.name] = (smap[i.name] || 0) + i.qty; }));
    const top = Object.entries(smap).sort((a, b) => b[1] - a[1])[0];
    return top ? `Best seller: "${top[0]}" with ${top[1]} units sold.` : 'No sales data yet.';
  }
  if (q.includes('hello') || q.includes('hi') || q.includes('help')) return `Hello! 👋 I can help with:\n• "today sales"\n• "profit this month"\n• "which products will run out?"\n• "top selling products"\n• "khata outstanding"\n• "expense this month"`;
  if (q.includes('supplier')) return `You have ${data?.suppliers?.length || 0} suppliers. Record purchases in the Purchases module to automatically update stock.`;
  if (q.includes('cash') || q.includes('bank')) return `Cash in hand: ${cur} ${stats?.cashBalance?.toLocaleString() || 0}. Bank balance: ${cur} ${stats?.bankBalance?.toLocaleString() || 0}. Total liquid: ${cur} ${((stats?.cashBalance || 0) + (stats?.bankBalance || 0)).toLocaleString()}.`;

  return `I didn't understand that. Try asking:\n• "today sales"\n• "which products will run out?"\n• "top selling product"\n• "profit" or "expenses"`;
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function AiAssistant() {
  const { stats, data } = useBusiness();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('chat'); // 'chat' | 'insights'
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'bot', text: '👋 Hello! I\'m your BusinessOS AI. Ask me about sales, stock, profits, or type "help" for suggestions.' }
  ]);
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open]);

  const insights = generateInsights(data, stats);

  const send = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const q = input.toLowerCase();
    setMessages(prev => [...prev, { role: 'user', text: input }]);
    setInput('');
    setTimeout(() => {
      const r = getResponse(q, data, stats);
      setMessages(prev => [...prev, { role: 'bot', text: r }]);
    }, 600);
  };

  const quickAsk = (text) => {
    setTab('chat');
    setMessages(prev => [...prev, { role: 'user', text }]);
    setTimeout(() => {
      const r = getResponse(text.toLowerCase(), data, stats);
      setMessages(prev => [...prev, { role: 'bot', text: r }]);
    }, 600);
  };

  return (
    <>
      {open && (
        <div className="ai-panel glass">
          {/* Header */}
          <div style={{ padding: '14px 16px', background: 'linear-gradient(135deg,var(--violet),var(--cyan))', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bot size={18} color="#fff" />
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>AI Business Assistant</span>
              {insights.length > 0 && (
                <span style={{ background: 'rgba(255,255,255,0.3)', borderRadius: 10, padding: '1px 6px', fontSize: '0.65rem', color: '#fff', fontWeight: 700 }}>{insights.length}</span>
              )}
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex' }}><X size={16} /></button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <button onClick={() => setTab('chat')} style={{ flex: 1, padding: '8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, color: tab === 'chat' ? 'var(--cyan)' : 'var(--txt3)', borderBottom: tab === 'chat' ? '2px solid var(--cyan)' : '2px solid transparent' }}>
              💬 Chat
            </button>
            <button onClick={() => setTab('insights')} style={{ flex: 1, padding: '8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, color: tab === 'insights' ? 'var(--amber)' : 'var(--txt3)', borderBottom: tab === 'insights' ? '2px solid var(--amber)' : '2px solid transparent' }}>
              ⚡ Smart Insights {insights.length > 0 && `(${insights.length})`}
            </button>
          </div>

          {/* Chat Tab */}
          {tab === 'chat' && (
            <>
              <div className="ai-messages" ref={listRef}>
                {messages.map((m, i) => (
                  <div key={i} className={`ai-msg ${m.role}`} style={{ whiteSpace: 'pre-line' }}>{m.text}</div>
                ))}
              </div>
              {/* Quick asks */}
              <div style={{ padding: '6px 10px', display: 'flex', gap: 5, flexWrap: 'wrap', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
                {["Today's sales", "Run out soon?", "Top product", "Cash & Bank"].map(q => (
                  <button key={q} onClick={() => quickAsk(q)} className="btn btn-ghost btn-sm" style={{ fontSize: '0.68rem', padding: '3px 8px' }}>{q}</button>
                ))}
              </div>
              <form className="ai-input-row" onSubmit={send} style={{ flexShrink: 0 }}>
                <input className="input" placeholder="Ask anything…" value={input} onChange={e => setInput(e.target.value)} autoFocus />
                <button type="submit" className="btn btn-primary btn-icon"><Send size={15} /></button>
              </form>
            </>
          )}

          {/* Insights Tab */}
          {tab === 'insights' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {insights.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--txt3)' }}>
                  <Zap size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
                  <p style={{ fontSize: '0.82rem' }}>Make some sales to unlock AI insights!</p>
                </div>
              ) : insights.map((ins, i) => (
                <div key={i} style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', fontSize: '0.82rem' }}>
                  <div style={{ fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{ins.icon}</span> {ins.title}
                  </div>
                  <div style={{ color: 'var(--txt2)', lineHeight: 1.5, whiteSpace: 'pre-line' }}>{ins.text}</div>
                  {ins.action && (
                    <button className="btn btn-ghost btn-sm" style={{ marginTop: 8, fontSize: '0.7rem' }} onClick={() => quickAsk(ins.text)}>{ins.action} →</button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div style={{ textAlign: 'center', padding: '4px', fontSize: '0.6rem', color: 'var(--txt3)', flexShrink: 0 }}>Developed By Nazeer Ahmad</div>
        </div>
      )}
      <button className="ai-fab" onClick={() => setOpen(!open)} title="AI Assistant">
        <Bot size={22} color="#fff" />
        {insights.length > 0 && !open && (
          <span style={{ position: 'absolute', top: -4, right: -4, width: 18, height: 18, background: 'var(--amber)', borderRadius: '50%', fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 800 }}>{insights.length}</span>
        )}
      </button>
    </>
  );
}

import React, { useState } from 'react';
import { Bot, X, Send } from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';

export default function AiAssistant() {
  const { stats, data } = useBusiness();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hello! I am your BusinessOS AI assistant. Ask me about sales, stock, expenses, or profits. Developed by Nazeer Ahmad.' }
  ]);

  React.useEffect(() => {
    const list = document.getElementById('ai-messages-list');
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages, open]);

  const send = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const q = input.toLowerCase();
    setMessages(prev => [...prev, { role: 'user', text: input }]);
    setInput('');
    setTimeout(() => {
      let r = "I'm analyzing your business data…";
      if (q.includes('profit') || q.includes('net')) r = `Your net profit is ${data?.settings?.currency || 'Rs.'} ${stats?.netProfit?.toLocaleString() || 0}. Revenue: ${stats?.totalRevenue?.toLocaleString()} | Expenses: ${stats?.totalExpenses?.toLocaleString()}.`;
      else if (q.includes('stock') || q.includes('inventory')) r = `Inventory alert: ${stats?.lowStockCount || 0} items low, ${stats?.outOfStockCount || 0} out of stock. Check inventory module.`;
      else if (q.includes('sale') || q.includes('revenue')) r = `Total revenue is ${data?.settings?.currency || 'Rs.'} ${stats?.totalRevenue?.toLocaleString() || 0} across ${data?.transactions?.length || 0} transactions.`;
      else if (q.includes('expense') || q.includes('cost')) r = `Total expenses: ${data?.settings?.currency || 'Rs.'} ${stats?.totalExpenses?.toLocaleString() || 0}. You have ${data?.expenses?.length || 0} expense entries.`;
      else if (q.includes('customer') || q.includes('khata') || q.includes('debt')) r = `Outstanding Khata balance: ${data?.settings?.currency || 'Rs.'} ${stats?.pendingKhata?.toLocaleString() || 0} from ${data?.khata?.length || 0} customers.`;
      else if (q.includes('employee') || q.includes('staff')) r = `You have ${data?.employees?.length || 0} staff members. Total payroll: ${data?.settings?.currency || 'Rs.'} ${data?.employees?.reduce((a, e) => a + (e.salary || 0), 0)?.toLocaleString() || 0}/month.`;
      else if (q.includes('hello') || q.includes('hi')) r = 'Hello! BusinessOS is running smoothly. How can I help optimize your business today?';
      else if (q.includes('top product') || q.includes('best selling')) {
        const top = [...(data?.products || [])].sort((a, b) => b.price - a.price)[0];
        r = top ? `Your highest value product is "${top.name}" at ${data?.settings?.currency || 'Rs.'} ${top.price?.toLocaleString()}.` : 'No products found.';
      }
      setMessages(prev => [...prev, { role: 'bot', text: r }]);
    }, 800);
  };

  return (
    <>
      {open && (
        <div className="ai-panel glass">
          <div style={{ padding: '14px 16px', background: 'linear-gradient(135deg,var(--violet),var(--cyan))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bot size={18} color="#fff" />
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>AI Assistant</span>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex' }}><X size={16} /></button>
          </div>
          <div className="ai-messages" id="ai-messages-list">
            {messages.map((m, i) => (
              <div key={i} className={`ai-msg ${m.role}`}>{m.text}</div>
            ))}
          </div>
          <form className="ai-input-row" onSubmit={send}>
            <input 
              className="input" 
              placeholder="Ask anything…" 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              autoFocus
            />
            <button type="submit" className="btn btn-primary btn-icon">
              <Send size={15} />
            </button>
          </form>
          <div style={{ textAlign: 'center', padding: '4px', fontSize: '0.6rem', color: 'var(--txt3)' }}>Developed By Nazeer Ahmad</div>
        </div>
      )}
      <button className="ai-fab" onClick={() => setOpen(!open)}>
        <Bot size={22} color="#fff" />
      </button>
    </>
  );
}

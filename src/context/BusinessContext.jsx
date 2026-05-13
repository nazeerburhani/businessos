import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

const BusinessContext = createContext(null);
const STORAGE_KEY = 'businessos_v4';

const initialData = {
  settings: {
    businessName: 'My Business',
    address: '', phone: '', email: '',
    taxRate: 0, currency: 'Rs.',
    receiptFooter: 'Thank you for your business!',
    logoUrl: '', // base64 or URL
    businessHours: '', website: '',
  },
  products: [], khata: [], employees: [],
  expenses: [], transactions: [],
  categories: ['General', 'Electronics', 'Clothing', 'Food & Beverage', 'Services', 'Other'],
};

export function BusinessProvider({ children }) {
  const [data, setData] = useState(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s) {
        const parsed = JSON.parse(s);
        // Merge new settings fields into existing data
        parsed.settings = { ...initialData.settings, ...(parsed.settings || {}) };
        return parsed;
      }
      return initialData;
    } catch { return initialData; }
  });

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }, [data]);

  const stats = useMemo(() => {
    const totalRevenue = data.transactions.reduce((a, t) => a + (t.total || 0), 0);
    const totalExpenses = data.expenses.reduce((a, e) => a + (e.amount || 0), 0);
    const pendingKhata = data.khata.reduce((a, k) => a + (k.balance > 0 ? k.balance : 0), 0);
    const lowStockCount = data.products.filter(p => p.stock > 0 && p.stock <= (p.minStock || 5)).length;
    const outOfStockCount = data.products.filter(p => p.stock === 0).length;
    const netProfit = totalRevenue - totalExpenses;
    return { totalRevenue, totalExpenses, pendingKhata, lowStockCount, outOfStockCount, netProfit };
  }, [data]);

  const saveProduct = (product) => setData(prev => ({
    ...prev,
    products: product.id
      ? prev.products.map(p => p.id === product.id ? product : p)
      : [...prev.products, { ...product, id: Date.now() }]
  }));

  const deleteProduct = (id) => setData(prev => ({ ...prev, products: prev.products.filter(p => p.id !== id) }));

  const addTransaction = (txn) => {
    setData(prev => ({
      ...prev,
      transactions: [{ ...txn, id: Date.now(), date: new Date().toISOString().split('T')[0] }, ...prev.transactions],
      products: prev.products.map(p => {
        const item = txn.items?.find(ci => ci.id === p.id);
        return item ? { ...p, stock: Math.max(0, p.stock - item.qty) } : p;
      }),
    }));
  };

  const saveKhataCustomer = (c) => setData(prev => ({
    ...prev,
    khata: c.id
      ? prev.khata.map(k => k.id === c.id ? c : k)
      : [{ ...c, id: Date.now(), balance: 0, history: [] }, ...prev.khata]
  }));

  const deleteKhataCustomer = (id) => setData(prev => ({ ...prev, khata: prev.khata.filter(k => k.id !== id) }));

  const addKhataEntry = (customerId, amount, type, desc) => {
    const amt = Number(amount);
    if (!amt || isNaN(amt) || amt <= 0) return;
    setData(prev => ({
      ...prev,
      khata: prev.khata.map(k => {
        if (k.id !== customerId) return k;
        const entry = { id: Date.now(), date: new Date().toISOString().split('T')[0], amount: amt, type, desc: desc || (type === 'debt' ? 'Credit Given' : 'Payment Received') };
        return { ...k, balance: type === 'debt' ? k.balance + amt : k.balance - amt, history: [entry, ...(k.history || [])] };
      })
    }));
  };

  const saveEmployee = (emp) => setData(prev => ({
    ...prev,
    employees: emp.id
      ? prev.employees.map(e => e.id === emp.id ? emp : e)
      : [...prev.employees, { ...emp, id: Date.now(), attendance: [], payrollHistory: [] }]
  }));

  const deleteEmployee = (id) => setData(prev => ({ ...prev, employees: prev.employees.filter(e => e.id !== id) }));

  const markAttendance = (empId, status) => {
    const today = new Date().toISOString().split('T')[0];
    setData(prev => ({
      ...prev,
      employees: prev.employees.map(e => {
        if (e.id !== empId) return e;
        const att = e.attendance?.find(a => a.date === today)
          ? e.attendance.map(a => a.date === today ? { ...a, status } : a)
          : [...(e.attendance || []), { date: today, status }];
        return { ...e, attendance: att };
      })
    }));
  };

  const processPayroll = (empId) => {
    const emp = data.employees.find(e => e.id === empId);
    if (!emp) return;
    const month = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    const entry = { id: Date.now(), date: new Date().toISOString().split('T')[0], amount: emp.salary, desc: `Salary - ${month}` };
    setData(prev => ({
      ...prev,
      employees: prev.employees.map(e => e.id === empId ? { ...e, payrollHistory: [entry, ...(e.payrollHistory || [])] } : e),
      expenses: [{ id: Date.now(), amount: emp.salary, category: 'Payroll', desc: `Salary: ${emp.name}`, date: new Date().toISOString().split('T')[0] }, ...prev.expenses],
    }));
  };

  const saveExpense = (exp) => setData(prev => ({
    ...prev,
    expenses: exp.id
      ? prev.expenses.map(e => e.id === exp.id ? exp : e)
      : [{ ...exp, id: Date.now(), date: exp.date || new Date().toISOString().split('T')[0] }, ...prev.expenses]
  }));

  const deleteExpense = (id) => setData(prev => ({ ...prev, expenses: prev.expenses.filter(e => e.id !== id) }));
  const saveSettings = (s) => setData(prev => ({ ...prev, settings: { ...prev.settings, ...s } }));
  const resetData = () => setData(initialData);

  return (
    <BusinessContext.Provider value={{
      data, stats,
      saveProduct, deleteProduct, addTransaction,
      saveKhataCustomer, deleteKhataCustomer, addKhataEntry,
      saveEmployee, deleteEmployee, markAttendance, processPayroll,
      saveExpense, deleteExpense,
      saveSettings, resetData,
    }}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const ctx = useContext(BusinessContext);
  if (!ctx) throw new Error('useBusiness must be within BusinessProvider');
  return ctx;
}

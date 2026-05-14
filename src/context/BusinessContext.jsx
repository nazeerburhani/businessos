import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

const BusinessContext = createContext(null);
const STORAGE_KEY = 'businessos_v4';

const initialData = {
  settings: {
    businessName: 'My Business',
    address: '', phone: '', email: '',
    taxRate: 0, currency: 'Rs.',
    receiptFooter: 'Thank you for your business!',
    logoUrl: '',
    businessHours: '', website: '',
    bankDetails: { name: '', account: '', branch: '' }
  },
  accounts: {
    cash: 0,
    bank: 0,
  },
  products: [], 
  khata: [], 
  suppliers: [],
  employees: [],
  expenses: [], 
  transactions: [],
  stockHistory: [],
  categories: ['General', 'Electronics', 'Clothing', 'Food & Beverage', 'Services', 'Other'],
};

export function BusinessProvider({ children }) {
  const [data, setData] = useState(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s) {
        const parsed = JSON.parse(s);
        parsed.settings = { ...initialData.settings, ...(parsed.settings || {}) };
        parsed.accounts = { ...initialData.accounts, ...(parsed.accounts || {}) };
        parsed.suppliers = parsed.suppliers || [];
        parsed.stockHistory = parsed.stockHistory || [];
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
    
    // Account balances
    const cashBalance = data.accounts.cash;
    const bankBalance = data.accounts.bank;
    const netProfit = totalRevenue - totalExpenses;
    
    return { 
      totalRevenue, totalExpenses, pendingKhata, 
      lowStockCount, outOfStockCount, netProfit,
      cashBalance, bankBalance 
    };
  }, [data]);

  const saveProduct = (product) => setData(prev => ({
    ...prev,
    products: product.id
      ? prev.products.map(p => p.id === product.id ? product : p)
      : [...prev.products, { ...product, id: Date.now() }]
  }));

  const adjustStock = (productId, qty, reason) => {
    setData(prev => ({
      ...prev,
      products: prev.products.map(p => p.id === productId ? { ...p, stock: p.stock + qty } : p),
      stockHistory: [{ id: Date.now(), productId, qty, reason, date: new Date().toISOString() }, ...prev.stockHistory]
    }));
  };

  const deleteProduct = (id) => setData(prev => ({ ...prev, products: prev.products.filter(p => p.id !== id) }));

  const addTransaction = (txn) => {
    // txn: { items, subtotal, tax, discount, total, paymentMethod, customerId }
    setData(prev => {
      const newAccounts = { ...prev.accounts };
      const newKhata = [...prev.khata];
      
      if (txn.paymentMethod === 'cash') newAccounts.cash += txn.total;
      else if (txn.paymentMethod === 'bank') newAccounts.bank += txn.total;
      else if (txn.paymentMethod === 'khata' && txn.customerId) {
        const idx = newKhata.findIndex(k => k.id === txn.customerId);
        if (idx > -1) {
          newKhata[idx] = { 
            ...newKhata[idx], 
            balance: newKhata[idx].balance + txn.total,
            history: [{ id: Date.now(), date: new Date().toISOString().split('T')[0], amount: txn.total, type: 'debt', desc: 'POS Sale' }, ...(newKhata[idx].history || [])]
          };
        }
      }

      return {
        ...prev,
        transactions: [{ ...txn, id: Date.now(), date: new Date().toISOString().split('T')[0] }, ...prev.transactions],
        accounts: newAccounts,
        khata: newKhata,
        products: prev.products.map(p => {
          const item = txn.items?.find(ci => ci.id === p.id);
          return item ? { ...p, stock: Math.max(0, p.stock - item.qty) } : p;
        }),
      };
    });
  };

  const saveSupplier = (sup) => setData(prev => ({
    ...prev,
    suppliers: sup.id ? prev.suppliers.map(s => s.id === sup.id ? sup : s) : [...prev.suppliers, { ...sup, id: Date.now(), balance: 0 }]
  }));

  const deleteSupplier = (id) => setData(prev => ({ ...prev, suppliers: prev.suppliers.filter(s => s.id !== id) }));

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
      saveProduct, deleteProduct, adjustStock, addTransaction,
      saveKhataCustomer, deleteKhataCustomer, addKhataEntry,
      saveSupplier, deleteSupplier,
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

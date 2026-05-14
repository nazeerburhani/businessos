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
    bankDetails: { name: '', account: '', branch: '' },
    roundOff: 'none',
    // Loyalty
    loyaltyEnabled: false,
    loyaltyPointsPerRs: 1,     // 1 point per Rs. spent
    loyaltyRedeemValue: 1,     // 1 point = Rs. 1 discount
    loyaltyMinRedeem: 100,     // minimum points to redeem
    // User roles / PINs
    users: [
      { id: 1, name: 'Owner', pin: '0000', role: 'owner' },
    ],
  },
  accounts: { cash: 0, bank: 0 },
  products: [],
  khata: [],
  suppliers: [],
  employees: [],
  expenses: [],
  transactions: [],
  purchases: [],
  heldBills: [],
  stockHistory: [],
  categories: ['General', 'Electronics', 'Clothing', 'Food & Beverage', 'Services', 'Other'],
};

export function BusinessProvider({ children }) {
  const [data, setData] = useState(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s) {
        const parsed = JSON.parse(s);
        parsed.settings    = { ...initialData.settings,  ...(parsed.settings  || {}) };
        parsed.accounts    = { ...initialData.accounts,  ...(parsed.accounts  || {}) };
        parsed.suppliers   = parsed.suppliers   || [];
        parsed.stockHistory= parsed.stockHistory|| [];
        parsed.purchases   = parsed.purchases   || [];
        parsed.heldBills   = parsed.heldBills   || [];
        return parsed;
      }
      return initialData;
    } catch { return initialData; }
  });

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }, [data]);

  // ─── AUTO DAILY BACKUP ───────────────────────────────────────────────────────
  useEffect(() => {
    const BACKUP_KEY = 'businessos_last_backup';
    const last = localStorage.getItem(BACKUP_KEY);
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    if (!last || now - Number(last) > oneDay) {
      // Silently save a JSON string to a separate key (not download — avoid annoying users)
      localStorage.setItem('businessos_auto_backup', JSON.stringify(data));
      localStorage.setItem(BACKUP_KEY, String(now));
    }
  }, []);  // run once on mount

  // ─── STATS ───────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalRevenue    = data.transactions.reduce((a, t) => a + (t.total || 0), 0);
    const totalExpenses   = data.expenses.reduce((a, e) => a + (e.amount || 0), 0);
    const pendingKhata    = data.khata.reduce((a, k) => a + (k.balance > 0 ? k.balance : 0), 0);
    const lowStockCount   = data.products.filter(p => p.stock > 0 && p.stock <= (p.minStock || 5)).length;
    const outOfStockCount = data.products.filter(p => p.stock === 0).length;
    const cashBalance     = data.accounts.cash;
    const bankBalance     = data.accounts.bank;
    const netProfit       = totalRevenue - totalExpenses;
    const todayStr        = new Date().toISOString().split('T')[0];
    const todayRevenue    = data.transactions.filter(t => t.date === todayStr).reduce((a, t) => a + (t.total || 0), 0);
    const todaySales      = data.transactions.filter(t => t.date === todayStr).length;

    // Expiring soon (within 30 days)
    const today = new Date();
    const expiringSoon = data.products.filter(p => {
      if (!p.expiryDate) return false;
      const exp = new Date(p.expiryDate);
      const diff = (exp - today) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 30;
    }).length;

    return {
      totalRevenue, totalExpenses, pendingKhata,
      lowStockCount, outOfStockCount, netProfit,
      cashBalance, bankBalance,
      todayRevenue, todaySales, expiringSoon,
    };
  }, [data]);

  // ─── PRODUCTS ────────────────────────────────────────────────────────────────
  const saveProduct = (product) => setData(prev => ({
    ...prev,
    products: product.id
      ? prev.products.map(p => p.id === product.id ? product : p)
      : [...prev.products, { ...product, id: Date.now() }]
  }));

  const deleteProduct = (id) => setData(prev => ({ ...prev, products: prev.products.filter(p => p.id !== id) }));

  const adjustStock = (productId, qty, reason) => {
    setData(prev => ({
      ...prev,
      products: prev.products.map(p => p.id === productId ? { ...p, stock: p.stock + qty } : p),
      stockHistory: [{ id: Date.now(), productId, qty, reason, date: new Date().toISOString() }, ...prev.stockHistory]
    }));
  };

  // ─── TRANSACTIONS ─────────────────────────────────────────────────────────────
  const addTransaction = (txn) => {
    // txn.payments = [{ method: 'cash'|'bank'|'khata', amount, customerId }]
    setData(prev => {
      const newAccounts = { ...prev.accounts };
      let newKhata = [...prev.khata];

      const payments = txn.payments || [{ method: txn.paymentMethod, amount: txn.total, customerId: txn.customerId }];

      // Loyalty points — award based on total spent
      const loyaltyEnabled = prev.settings.loyaltyEnabled;
      const pointsPerRs = prev.settings.loyaltyPointsPerRs || 1;

      payments.forEach(pay => {
        if (pay.method === 'cash')  newAccounts.cash += pay.amount;
        else if (pay.method === 'bank') newAccounts.bank += pay.amount;
        else if (pay.method === 'khata' && pay.customerId) {
          const idx = newKhata.findIndex(k => k.id === Number(pay.customerId));
          if (idx > -1) {
            newKhata[idx] = {
              ...newKhata[idx],
              balance: newKhata[idx].balance + pay.amount,
              history: [{
                id: Date.now(), date: new Date().toISOString().split('T')[0],
                amount: pay.amount, type: 'debt', desc: 'POS Sale'
              }, ...(newKhata[idx].history || [])]
            };
          }
        }
        // Award loyalty points to identified khata customer
        if (loyaltyEnabled && pay.customerId) {
          const idx = newKhata.findIndex(k => k.id === Number(pay.customerId));
          if (idx > -1) {
            const earned = Math.floor(pay.amount * pointsPerRs);
            newKhata[idx] = { ...newKhata[idx], loyaltyPoints: (newKhata[idx].loyaltyPoints || 0) + earned };
          }
        }
      });

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

  // ─── LOYALTY POINTS ───────────────────────────────────────────────────────────
  const redeemLoyaltyPoints = (customerId, points) => {
    setData(prev => ({
      ...prev,
      khata: prev.khata.map(k => {
        if (k.id !== customerId) return k;
        const redeemed = Math.min(points, k.loyaltyPoints || 0);
        return { ...k, loyaltyPoints: (k.loyaltyPoints || 0) - redeemed };
      })
    }));
  };

  // ─── PIN USERS ────────────────────────────────────────────────────────────────
  const saveUser = (user) => setData(prev => ({
    ...prev,
    settings: {
      ...prev.settings,
      users: user.id
        ? (prev.settings.users || []).map(u => u.id === user.id ? user : u)
        : [...(prev.settings.users || []), { ...user, id: Date.now() }]
    }
  }));

  const deleteUser = (id) => setData(prev => ({
    ...prev,
    settings: { ...prev.settings, users: (prev.settings.users || []).filter(u => u.id !== id) }
  }));

  const verifyPIN = (pin) => {
    const users = data.settings.users || [];
    return users.find(u => u.pin === String(pin)) || null;
  };

  const restoreAutoBackup = () => {
    const raw = localStorage.getItem('businessos_auto_backup');
    if (!raw) return false;
    try {
      const parsed = JSON.parse(raw);
      setData(prev => ({ ...initialData, ...parsed, settings: { ...initialData.settings, ...(parsed.settings || {}) } }));
      return true;
    } catch { return false; }
  };

  // ─── HELD BILLS ──────────────────────────────────────────────────────────────
  const holdBill = (cart, note = '') => {
    setData(prev => ({
      ...prev,
      heldBills: [...prev.heldBills, {
        id: Date.now(),
        cart,
        note,
        savedAt: new Date().toLocaleTimeString()
      }]
    }));
  };

  const resumeBill = (id) => {
    const bill = data.heldBills.find(b => b.id === id);
    setData(prev => ({ ...prev, heldBills: prev.heldBills.filter(b => b.id !== id) }));
    return bill;
  };

  const deleteHeldBill = (id) => setData(prev => ({ ...prev, heldBills: prev.heldBills.filter(b => b.id !== id) }));

  // ─── PURCHASES ───────────────────────────────────────────────────────────────
  const addPurchase = (purchase) => {
    // purchase: { supplierId, items: [{productId, qty, costPrice}], total, date }
    setData(prev => {
      const newProducts = prev.products.map(p => {
        const item = purchase.items?.find(i => i.productId === p.id);
        if (!item) return p;
        return { ...p, stock: p.stock + item.qty, cost: item.costPrice || p.cost };
      });
      const newStockHistory = purchase.items?.map(i => ({
        id: Date.now() + Math.random(),
        productId: i.productId,
        qty: i.qty,
        reason: 'Purchase',
        date: new Date().toISOString()
      })) || [];
      return {
        ...prev,
        purchases: [{ ...purchase, id: Date.now(), date: purchase.date || new Date().toISOString().split('T')[0] }, ...prev.purchases],
        products: newProducts,
        stockHistory: [...newStockHistory, ...prev.stockHistory],
        accounts: { ...prev.accounts, cash: prev.accounts.cash - purchase.total }, // deduct from cash
      };
    });
  };

  // ─── KHATA ───────────────────────────────────────────────────────────────────
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

  // ─── SUPPLIERS ───────────────────────────────────────────────────────────────
  const saveSupplier = (sup) => setData(prev => ({
    ...prev,
    suppliers: sup.id ? prev.suppliers.map(s => s.id === sup.id ? sup : s) : [...prev.suppliers, { ...sup, id: Date.now(), balance: 0 }]
  }));

  const deleteSupplier = (id) => setData(prev => ({ ...prev, suppliers: prev.suppliers.filter(s => s.id !== id) }));

  // ─── EMPLOYEES ───────────────────────────────────────────────────────────────
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

  // ─── EXPENSES ────────────────────────────────────────────────────────────────
  const saveExpense = (exp) => setData(prev => ({
    ...prev,
    expenses: exp.id
      ? prev.expenses.map(e => e.id === exp.id ? exp : e)
      : [{ ...exp, id: Date.now(), date: exp.date || new Date().toISOString().split('T')[0] }, ...prev.expenses]
  }));

  const deleteExpense = (id) => setData(prev => ({ ...prev, expenses: prev.expenses.filter(e => e.id !== id) }));

  // ─── SETTINGS ────────────────────────────────────────────────────────────────
  const saveSettings = (s) => setData(prev => ({ ...prev, settings: { ...prev.settings, ...s } }));
  const resetData = () => setData(initialData);

  // ─── BACKUP / RESTORE ────────────────────────────────────────────────────────
  const backupData = () => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `businessos-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const restoreData = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target.result);
          setData(prev => ({
            ...initialData,
            ...parsed,
            settings: { ...initialData.settings, ...(parsed.settings || {}) },
          }));
          resolve(true);
        } catch { reject(new Error('Invalid backup file')); }
      };
      reader.readAsText(file);
    });
  };

  return (
    <BusinessContext.Provider value={{
      data, stats,
      saveProduct, deleteProduct, adjustStock,
      addTransaction,
      redeemLoyaltyPoints,
      holdBill, resumeBill, deleteHeldBill,
      addPurchase,
      saveKhataCustomer, deleteKhataCustomer, addKhataEntry,
      saveSupplier, deleteSupplier,
      saveEmployee, deleteEmployee, markAttendance, processPayroll,
      saveExpense, deleteExpense,
      saveSettings, resetData,
      backupData, restoreData, restoreAutoBackup,
      saveUser, deleteUser, verifyPIN,
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

// Lightweight i18n hook — English & Urdu support
// Usage: const { t, lang, toggleLang } = useTranslation();

import { useState, useEffect } from 'react';

const translations = {
  en: {
    dashboard: 'Dashboard',
    pos: 'Point of Sale',
    inventory: 'Inventory',
    purchases: 'Purchases',
    khata: 'Khata Ledger',
    suppliers: 'Suppliers',
    employees: 'Staff',
    expenses: 'Expenses',
    analytics: 'Analytics',
    reports: 'Reports',
    settings: 'Settings',
    // Dashboard
    netProfit: 'Net Profit',
    totalRevenue: 'Total Revenue',
    cashInHand: 'Cash in Hand',
    bankBalance: 'Bank Balance',
    pendingKhata: 'Pending Khata',
    gettingStarted: 'Getting Started',
    todaySales: "Today's Sales",
    // POS
    addToCart: 'Add to Cart',
    checkout: 'Checkout',
    clearCart: 'Clear Cart',
    holdBill: 'Hold Bill',
    completeSale: 'Complete Sale',
    total: 'Total',
    subtotal: 'Subtotal',
    discount: 'Discount',
    tax: 'Tax',
    cash: 'Cash',
    bank: 'Bank Transfer',
    khataCredit: 'Khata (Credit)',
    noProducts: 'No products found',
    searchProducts: 'Search products…',
    // Inventory
    addProduct: 'Add Product',
    editProduct: 'Edit Product',
    productName: 'Product Name',
    price: 'Price',
    costPrice: 'Cost Price',
    stock: 'Stock',
    category: 'Category',
    inStock: 'In Stock',
    lowStock: 'Low Stock',
    outOfStock: 'Out of Stock',
    // Khata
    addCustomer: 'Add Customer',
    balance: 'Balance',
    overdue: 'Overdue',
    recordPayment: 'Record Payment',
    // General
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    search: 'Search',
    export: 'Export',
    import: 'Import',
    loading: 'Loading…',
    noData: 'No data found',
    businessName: 'Business Name',
    currency: 'Currency',
    taxRate: 'Tax Rate',
    developedBy: 'Developed By Nazeer Ahmad',
    // Reports
    dailySales: 'Daily Sales',
    topProducts: 'Top Products',
    gstReport: 'GST Report',
    plStatement: 'P&L Statement',
    dateFrom: 'From',
    dateTo: 'To',
    // Staff
    addEmployee: 'Add Employee',
    salary: 'Salary',
    attendance: 'Attendance',
    present: 'Present',
    absent: 'Absent',
    leave: 'Leave',
    payroll: 'Payroll',
  },
  ur: {
    dashboard: 'ڈیش بورڈ',
    pos: 'فروخت',
    inventory: 'اسٹاک',
    purchases: 'خریداری',
    khata: 'کھاتہ',
    suppliers: 'سپلائرز',
    employees: 'عملہ',
    expenses: 'اخراجات',
    analytics: 'تجزیہ',
    reports: 'رپورٹس',
    settings: 'ترتیبات',
    // Dashboard
    netProfit: 'خالص منافع',
    totalRevenue: 'کل آمدنی',
    cashInHand: 'نقد رقم',
    bankBalance: 'بینک بیلنس',
    pendingKhata: 'باقی کھاتہ',
    gettingStarted: 'شروعات',
    todaySales: 'آج کی فروخت',
    // POS
    addToCart: 'کارٹ میں شامل',
    checkout: 'ادائیگی',
    clearCart: 'کارٹ خالی',
    holdBill: 'بل روکیں',
    completeSale: 'فروخت مکمل',
    total: 'کل',
    subtotal: 'ذیلی کل',
    discount: 'رعایت',
    tax: 'ٹیکس',
    cash: 'نقد',
    bank: 'بینک ٹرانسفر',
    khataCredit: 'ادھار (کھاتہ)',
    noProducts: 'کوئی پروڈکٹ نہیں',
    searchProducts: 'پروڈکٹ تلاش کریں…',
    // Inventory
    addProduct: 'پروڈکٹ شامل',
    editProduct: 'پروڈکٹ تبدیل',
    productName: 'پروڈکٹ کا نام',
    price: 'قیمت',
    costPrice: 'لاگت',
    stock: 'اسٹاک',
    category: 'زمرہ',
    inStock: 'موجود',
    lowStock: 'کم اسٹاک',
    outOfStock: 'ختم',
    // Khata
    addCustomer: 'کسٹمر شامل',
    balance: 'بقایا',
    overdue: 'باقی',
    recordPayment: 'ادائیگی درج',
    // General
    save: 'محفوظ',
    cancel: 'منسوخ',
    delete: 'حذف',
    edit: 'ترمیم',
    add: 'شامل',
    search: 'تلاش',
    export: 'ایکسپورٹ',
    import: 'امپورٹ',
    loading: 'لوڈ ہو رہا ہے…',
    noData: 'ڈیٹا نہیں ملا',
    businessName: 'کاروبار کا نام',
    currency: 'کرنسی',
    taxRate: 'ٹیکس شرح',
    developedBy: 'تیار کردہ نظیر احمد',
    // Reports
    dailySales: 'روزانہ فروخت',
    topProducts: 'بہترین پروڈکٹس',
    gstReport: 'جی ایس ٹی رپورٹ',
    plStatement: 'نفع نقصان',
    dateFrom: 'سے',
    dateTo: 'تک',
    // Staff
    addEmployee: 'ملازم شامل',
    salary: 'تنخواہ',
    attendance: 'حاضری',
    present: 'حاضر',
    absent: 'غیر حاضر',
    leave: 'چھٹی',
    payroll: 'تنخواہ',
  },
};

const LANG_KEY = 'businessos_lang';

export function useTranslation() {
  const [lang, setLang] = useState(() => localStorage.getItem(LANG_KEY) || 'en');

  useEffect(() => {
    localStorage.setItem(LANG_KEY, lang);
    // Set dir attribute for RTL support
    document.documentElement.setAttribute('dir', lang === 'ur' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lang);
  }, [lang]);

  const toggleLang = () => setLang(prev => prev === 'en' ? 'ur' : 'en');

  const t = (key) => translations[lang]?.[key] || translations.en?.[key] || key;

  return { t, lang, toggleLang, isUrdu: lang === 'ur' };
}

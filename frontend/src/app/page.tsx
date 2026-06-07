"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { 
  Wallet, LayoutDashboard, Receipt, Plus, ArrowUpDown, ArrowDownLeft, ArrowUpRight, 
  Activity, PieChart, BarChart3, Inbox, Trash2, Edit3, X, CheckCircle2, Save, LogOut, 
  Sun, Moon, Download, Settings, ChevronRight, Layers, Calendar, ShoppingBag, IndianRupee, Globe,
  Target, AlertTriangle, Hash, Sparkles, PlusCircle, CheckSquare, Square, CalendarDays, Menu
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend,
  PieChart as RePieChart, Pie, Cell,
  BarChart, Bar
} from 'recharts';

// --- Category Metadata Constants ---
const categoriesInfo: Record<string, { label: string; color: string; bgClass: string; icon: any }> = {
  Food: { label: 'Food', color: '#f59e0b', bgClass: 'badge-Food', icon: ShoppingBag },
  Transport: { label: 'Transport', color: '#6366f1', bgClass: 'badge-Transport', icon: Wallet },
  Shopping: { label: 'Shopping', color: '#a78bfa', bgClass: 'badge-Shopping', icon: ShoppingBag },
  Entertainment: { label: 'Entertainment', color: '#ec4899', bgClass: 'badge-Entertainment', icon: Activity },
  Bills: { label: 'Bills', color: '#f43f5e', bgClass: 'badge-Bills', icon: Receipt },
  Education: { label: 'Education', color: '#3b82f6', bgClass: 'badge-Education', icon: Layers },
  Other: { label: 'Other', color: '#9ca3af', bgClass: 'badge-Other', icon: Layers }
};

const defaultGoals: Record<string, number> = {
  Food: 5000,
  Transport: 2000,
  Shopping: 5000,
  Entertainment: 3000,
  Bills: 4000,
  Education: 10000,
  Other: 2000
};

// Static Exchange Rates relative to INR
const exchangeRates: Record<string, { rate: number; symbol: string; locale: string }> = {
  INR: { rate: 1.0, symbol: '₹', locale: 'en-IN' },
  USD: { rate: 83.33, symbol: '$', locale: 'en-US' },
  EUR: { rate: 90.91, symbol: '€', locale: 'de-DE' },
  GBP: { rate: 104.17, symbol: '£', locale: 'en-GB' }
};

export default function ExpenseFlowApp() {
  // --- Auth Session States ---
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: number; name: string; email: string } | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  
  // Auth Form Inputs
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // --- Theme, Currency & Navigation States ---
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [currency, setCurrency] = useState<'INR' | 'USD' | 'EUR' | 'GBP'>('INR');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ledger'>('dashboard');
  const [ledgerSubView, setLedgerSubView] = useState<'list' | 'calendar'>('list');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // --- Data States ---
  const [transactions, setTransactions] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<Record<string, number>>({});
  const [recurringExpenses, setRecurringExpenses] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<any[]>([]);
  const [billReminders, setBillReminders] = useState<any[]>([]);
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // --- Ledger Filtering States ---
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerCategory, setLedgerCategory] = useState('all');
  const [ledgerSort, setLedgerSort] = useState('date-desc');
  const [ledgerTagFilter, setLedgerTagFilter] = useState('all');

  // --- Modal & Drawer Visibility States ---
  const [isTxDrawerOpen, setIsTxDrawerOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<any | null>(null);
  
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [selectedGoalCategory, setSelectedGoalCategory] = useState('Food');
  const [goalAmountInput, setGoalAmountInput] = useState('');
  
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsName, setSettingsName] = useState('');

  const [isNewGoalModalOpen, setIsNewGoalModalOpen] = useState(false);
  const [isNewReminderModalOpen, setIsNewReminderModalOpen] = useState(false);

  // --- Transaction Drawer Form Inputs ---
  const [txType, setTxType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [txTitle, setTxTitle] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState('Food');
  const [txDate, setTxDate] = useState('');
  const [txAccountId, setTxAccountId] = useState<string>('');
  const [txTagsString, setTxTagsString] = useState('');

  // --- Recurring Expense Form Inputs ---
  const [recTitle, setRecTitle] = useState('');
  const [recAmount, setRecAmount] = useState('');
  const [recCategory, setRecCategory] = useState('Food');
  const [recInterval, setRecInterval] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [recAccountId, setRecAccountId] = useState<string>('');
  const [recNextDate, setRecNextDate] = useState('');

  // --- Savings Goals Form Inputs ---
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalSaved, setGoalSaved] = useState('');
  const [goalAllocationInput, setGoalAllocationInput] = useState<Record<number, string>>({});

  // --- Bill Reminders Form Inputs ---
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderAmount, setReminderAmount] = useState('');
  const [reminderDate, setReminderDate] = useState('');

  // --- Calendar Active Month State ---
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());

  // --- Toast Notification State ---
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' | 'warning' | 'info' }[]>([]);

  // Show dynamic notification helper
  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // --- Bootstrapping Auth & Config ---
  useEffect(() => {
    const savedToken = localStorage.getItem('expenseflow_token');
    const savedTheme = localStorage.getItem('expenseflow_theme') as 'dark' | 'light' | null;
    const savedCurrency = localStorage.getItem('expenseflow_currency') as 'INR' | 'USD' | 'EUR' | 'GBP' | null;

    if (savedToken) {
      try {
        const payload = JSON.parse(atob(savedToken.split('.')[1] || '{}'));
        setToken(savedToken);
        setUser({ id: payload.id, name: payload.name || payload.email.split('@')[0], email: payload.email });
        setSettingsName(payload.name || payload.email.split('@')[0]);
      } catch (e) {
        localStorage.removeItem('expenseflow_token');
      }
    }

    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        document.documentElement.classList.add('dark');
      }
    }

    if (savedCurrency) {
      setCurrency(savedCurrency);
    }
  }, []);

  // --- Fetch Core Scoped Data ---
  const loadData = async () => {
    if (!token) return;
    setLoadingData(true);
    try {
      // Fetch all core scoped data in parallel to avoid sequential network waterfalls
      const [txs, rawBudgets, recurrings, accs, goals, reminders, insights] = await Promise.all([
        trpc.transaction.getTransactions.query(),
        trpc.budget.getBudgets.query(),
        trpc.recurring.getRecurringExpenses.query(),
        trpc.account.getAccounts.query(),
        trpc.goals.getSavingsGoals.query(),
        trpc.reminders.getBillReminders.query(),
        trpc.insights.getAIInsights.query()
      ]);

      setTransactions(txs);

      const budgetMap: Record<string, number> = {};
      rawBudgets.forEach((b: { category: string; limit: number }) => {
        budgetMap[b.category] = b.limit;
      });
      setBudgets(budgetMap);

      setRecurringExpenses(recurrings);

      setAccounts(accs);
      if (accs[0]) {
        setTxAccountId(accs[0].id.toString());
        setRecAccountId(accs[0].id.toString());
      }

      setSavingsGoals(goals);
      setBillReminders(reminders);
      setAiInsights(insights);

    } catch (err: any) {
      showToast(err.message || 'Failed to sync with PostgreSQL database', 'error');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  // --- Currency Formatting Utility ---
  const formatVal = (amountInINR: number) => {
    const config = exchangeRates[currency] || exchangeRates.INR;
    const displayAmt = amountInINR / config.rate;
    
    // Safeguard to handle Credit Card balances which are displayed as outflow liabilities
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0
    }).format(displayAmt);
  };

  // --- Auth Handlers ---
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      if (authMode === 'signup') {
        if (!authName || !authEmail || !authPassword) {
          throw new Error('All fields are mandatory');
        }
        await trpc.auth.signUp.mutate({ name: authName, email: authEmail, password: authPassword });
        showToast('Account registered with default seed accounts! Please sign in.', 'success');
        setAuthMode('login');
        setAuthPassword('');
      } else {
        if (!authEmail || !authPassword) {
          throw new Error('Please enter credentials');
        }
        const res = await trpc.auth.login.mutate({ email: authEmail, password: authPassword });
        localStorage.setItem('expenseflow_token', res.token);
        setToken(res.token);
        setUser({ id: res.user.id, name: res.user.name, email: res.user.email });
        setSettingsName(res.user.name);
        showToast(`Welcome back, ${res.user.name}!`, 'success');
        setAuthEmail('');
        setAuthPassword('');
        setAuthName('');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
      showToast(err.message || 'Authentication failed', 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('expenseflow_token');
    setToken(null);
    setUser(null);
    setTransactions([]);
    setRecurringExpenses([]);
    setAccounts([]);
    setSavingsGoals([]);
    setBillReminders([]);
    setAiInsights([]);
    showToast('Signed out successfully.', 'info');
  };

  // --- Theme Toggle ---
  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('expenseflow_theme', nextTheme);
    if (nextTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
    showToast(`Theme switched to ${nextTheme === 'light' ? 'Light mode' : 'Dark Mode'}.`, 'info');
  };

  // --- Currency Toggle ---
  const handleCurrencyChange = (newCurrency: 'INR' | 'USD' | 'EUR' | 'GBP') => {
    setCurrency(newCurrency);
    localStorage.setItem('expenseflow_currency', newCurrency);
    showToast(`Display currency changed to ${newCurrency}.`, 'info');
  };

  // --- CRUD Transactions Handlers ---
  const openTransactionDrawer = (tx: any = null) => {
    if (tx) {
      setEditingTx(tx);
      setTxType(tx.type);
      setTxTitle(tx.title);
      setTxAmount(tx.amount.toString());
      setTxCategory(tx.category);
      setTxDate(new Date(tx.createdAt).toISOString().split('T')[0] || '');
      setTxAccountId(tx.accountId.toString());
      setTxTagsString(tx.tags ? tx.tags.join(', ') : '');
    } else {
      setEditingTx(null);
      setTxType('EXPENSE');
      setTxTitle('');
      setTxAmount('');
      setTxCategory('Food');
      setTxDate(new Date().toISOString().split('T')[0]);
      if (accounts[0]) setTxAccountId(accounts[0].id.toString());
      setTxTagsString('');
    }
    setIsTxDrawerOpen(true);
  };

  const handleTxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txTitle.trim() || !txAmount || isNaN(parseFloat(txAmount)) || parseFloat(txAmount) <= 0 || !txAccountId) {
      showToast('Please fill out all fields with valid information', 'error');
      return;
    }

    // Process hashtags: extract unique non-empty trimmed strings
    const tags = txTagsString
      .split(/[\s,]+/)
      .map(tag => tag.trim().replace(/^#/, '').toLowerCase())
      .filter(tag => tag.length > 0);

    try {
      const payload = {
        title: txTitle.trim(),
        amount: parseFloat(txAmount),
        category: txCategory,
        type: txType,
        accountId: parseInt(txAccountId),
        tags: tags,
        createdAt: txDate ? new Date(txDate).toISOString() : undefined
      };

      if (editingTx) {
        await trpc.transaction.updateTransaction.mutate({ id: editingTx.id, ...payload });
        showToast('Transaction modified successfully', 'success');
      } else {
        await trpc.transaction.addTransaction.mutate(payload);
        showToast('New transaction recorded successfully', 'success');
      }
      setIsTxDrawerOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Transaction submission failed', 'error');
    }
  };

  const handleTxDelete = async (id: number) => {
    if (!confirm('Are you sure you want to permanently delete this transaction?')) return;
    try {
      await trpc.transaction.deleteTransaction.mutate({ id });
      showToast('Transaction permanently removed', 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete transaction', 'error');
    }
  };

  // --- Savings Goals Handlers ---
  const handleNewGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetVal = parseFloat(goalTarget);
    const savedVal = parseFloat(goalSaved || '0');
    if (!goalName.trim() || isNaN(targetVal) || targetVal <= 0) {
      showToast('Please specify a valid savings target', 'error');
      return;
    }

    try {
      await trpc.goals.addSavingsGoal.mutate({
        name: goalName.trim(),
        target: targetVal,
        saved: savedVal
      });
      showToast(`Savings target added: ${goalName}`, 'success');
      setIsNewGoalModalOpen(false);
      setGoalName('');
      setGoalTarget('');
      setGoalSaved('');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save goal', 'error');
    }
  };

  const handleAllocateGoal = async (id: number) => {
    const inputAmt = parseFloat(goalAllocationInput[id] || '0');
    if (isNaN(inputAmt) || inputAmt === 0) {
      showToast('Please enter a valid savings allocation amount', 'warning');
      return;
    }

    try {
      await trpc.goals.allocateToGoal.mutate({ id, amount: inputAmt });
      showToast(inputAmt > 0 ? 'Savings allocated successfully!' : 'Savings withdrawn successfully', 'success');
      setGoalAllocationInput(prev => ({ ...prev, [id]: '' }));
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Allocation failed', 'error');
    }
  };

  const handleGoalDelete = async (id: number) => {
    if (!confirm('Remove this savings goal?')) return;
    try {
      await trpc.goals.deleteSavingsGoal.mutate({ id });
      showToast('Savings goal deleted successfully', 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete goal', 'error');
    }
  };

  // --- Bill Reminders Handlers ---
  const handleNewReminderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(reminderAmount);
    if (!reminderTitle.trim() || isNaN(amountVal) || amountVal <= 0 || !reminderDate) {
      showToast('Please specify complete bill parameters', 'error');
      return;
    }

    try {
      await trpc.reminders.addBillReminder.mutate({
        title: reminderTitle.trim(),
        amount: amountVal,
        dueDate: new Date(reminderDate).toISOString()
      });
      showToast(`Bill reminder set: ${reminderTitle}`, 'success');
      setIsNewReminderModalOpen(false);
      setReminderTitle('');
      setReminderAmount('');
      setReminderDate('');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save reminder', 'error');
    }
  };

  const handleToggleReminderPaid = async (id: number) => {
    try {
      await trpc.reminders.toggleBillPaid.mutate({ id });
      showToast('Bill reminder status toggled', 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle status', 'error');
    }
  };

  const handleReminderDelete = async (id: number) => {
    if (!confirm('Cancel this bill reminder?')) return;
    try {
      await trpc.reminders.deleteBillReminder.mutate({ id });
      showToast('Bill reminder removed', 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to remove reminder', 'error');
    }
  };

  // --- Category Budget Limit Editor ---
  const openGoalEditor = (cat: string) => {
    setSelectedGoalCategory(cat);
    setGoalAmountInput((budgets[cat] || defaultGoals[cat] || 0).toString());
    setIsGoalModalOpen(true);
  };

  const handleGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newLimit = parseFloat(goalAmountInput);
    if (isNaN(newLimit) || newLimit <= 0) {
      showToast('Please specify a positive budget limit', 'error');
      return;
    }

    try {
      await trpc.budget.setBudget.mutate({ category: selectedGoalCategory, limit: newLimit });
      setBudgets(prev => ({ ...prev, [selectedGoalCategory]: newLimit }));
      setIsGoalModalOpen(false);
      showToast(`${categoriesInfo[selectedGoalCategory]?.label} goal updated successfully`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update goal', 'error');
    }
  };

  // --- Settings Form Submission ---
  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsName.trim()) {
      showToast('Profile name is required', 'error');
      return;
    }
    setUser(prev => prev ? { ...prev, name: settingsName.trim() } : null);
    showToast('Profile settings updated successfully', 'success');
  };

  // --- Add Recurring Subscriptions ---
  const handleRecSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recTitle.trim() || !recAmount || isNaN(parseFloat(recAmount)) || parseFloat(recAmount) <= 0 || !recNextDate || !recAccountId) {
      showToast('Please specify all subscription template inputs', 'error');
      return;
    }

    try {
      await trpc.recurring.addRecurringExpense.mutate({
        title: recTitle.trim(),
        amount: parseFloat(recAmount),
        category: recCategory,
        type: 'EXPENSE',
        interval: recInterval,
        accountId: parseInt(recAccountId),
        nextDueDate: new Date(recNextDate).toISOString()
      });
      showToast(`Subscription set: ${recTitle}`, 'success');
      
      setRecTitle('');
      setRecAmount('');
      setRecCategory('Food');
      setRecInterval('monthly');
      setRecNextDate('');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to set template', 'error');
    }
  };

  const handleRecDelete = async (id: number) => {
    if (!confirm('Cancel this active recurring subscription?')) return;
    try {
      await trpc.recurring.deleteRecurringExpense.mutate({ id });
      showToast('Subscription template canceled successfully', 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel subscription', 'error');
    }
  };

  // --- Exporters ---
  const handleExportCSV = () => {
    if (transactions.length === 0) {
      showToast('No ledger entries available to export', 'warning');
      return;
    }
    const headers = 'ID,Title,Amount (INR),Category,Type,Tags,Recorded Date\n';
    const rows = transactions.map(t => 
      `${t.id},"${t.title.replace(/"/g, '""')}",${t.amount},${t.category},${t.type},"${t.tags ? t.tags.join(';') : ''}",${new Date(t.createdAt).toLocaleDateString()}`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `ExpenseFlow_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Ledger successfully exported as CSV!', 'success');
  };

  const handleExportExcel = () => {
    if (transactions.length === 0) {
      showToast('No ledger entries available to export', 'warning');
      return;
    }

    let excelContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Ledger</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>
      <body>
        <table border="1">
          <tr style="background-color: #6366f1; color: white; font-weight: bold;">
            <th>ID</th>
            <th>Title</th>
            <th>Amount (INR)</th>
            <th>Category</th>
            <th>Type</th>
            <th>Tags</th>
            <th>Date</th>
          </tr>
    `;

    transactions.forEach(t => {
      excelContent += `
        <tr>
          <td>${t.id}</td>
          <td>${t.title}</td>
          <td>${t.amount}</td>
          <td>${t.category}</td>
          <td style="color: ${t.type === 'INCOME' ? '#10b981' : '#f43f5e'}">${t.type}</td>
          <td>${t.tags ? t.tags.map((tg: string) => '#' + tg).join(' ') : ''}</td>
          <td>${new Date(t.createdAt).toLocaleDateString()}</td>
        </tr>
      `;
    });

    excelContent += '</table></body></html>';

    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `ExpenseFlow_Ledger_${new Date().toISOString().split('T')[0]}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Ledger successfully exported as Excel workbook!', 'success');
  };

  // --- Dynamic Calculations & Analytics Models ---
  const metrics = useMemo(() => {
    let incomeTotal = 0;
    let incomeCount = 0;
    let expenseTotal = 0;
    let expenseCount = 0;

    transactions.forEach(t => {
      if (t.type === 'INCOME') {
        incomeTotal += t.amount;
        incomeCount++;
      } else {
        expenseTotal += t.amount;
        expenseCount++;
      }
    });

    const balance = incomeTotal - expenseTotal;
    // Calculate dynamic savings rate percentage
    const savingsRate = incomeTotal > 0 ? Math.round(((incomeTotal - expenseTotal) / incomeTotal) * 100) : 0;

    return {
      balance,
      incomeTotal,
      incomeCount,
      expenseTotal,
      expenseCount,
      savingsRate
    };
  }, [transactions]);

  // Aggregate Category Spends
  const categorySpends = useMemo(() => {
    const spends: Record<string, number> = { Food: 0, Transport: 0, Shopping: 0, Entertainment: 0, Bills: 0, Education: 0, Other: 0 };
    transactions.forEach(t => {
      if (t.type === 'EXPENSE') {
        if (spends[t.category] !== undefined) {
          spends[t.category] += t.amount;
        } else {
          spends.Other += t.amount;
        }
      }
    });
    return spends;
  }, [transactions]);

  const topSpendingCategoryInfo = useMemo(() => {
    let topCat = 'None';
    let topAmt = 0;
    Object.keys(categorySpends).forEach(cat => {
      const amt = categorySpends[cat] || 0;
      if (amt > topAmt) {
        topAmt = amt;
        topCat = cat;
      }
    });
    return { category: topCat, amount: topAmt };
  }, [categorySpends]);

  const totalBudgetsLimit = useMemo<number>(() => {
    const keys = Object.keys(budgets);
    if (keys.length === 0) return Object.values(defaultGoals).reduce((a: number, b: number) => a + b, 0);
    return Object.values(budgets).reduce((a: number, b: number) => a + b, 0);
  }, [budgets]);

  const outflowGaugePercent = useMemo(() => {
    if (totalBudgetsLimit <= 0) return 0;
    return Math.min(Math.round((metrics.expenseTotal / totalBudgetsLimit) * 100), 100);
  }, [metrics.expenseTotal, totalBudgetsLimit]);

  // Extract unique Hashtags listed inside transactions
  const uniqueHashtags = useMemo(() => {
    const tagsSet = new Set<string>();
    transactions.forEach(t => {
      if (t.tags) {
        t.tags.forEach((tag: string) => tagsSet.add(tag));
      }
    });
    return Array.from(tagsSet);
  }, [transactions]);

  // Filter & Sort Ledger
  const filteredTransactions = useMemo(() => {
    let list = [...transactions];

    if (ledgerSearch.trim()) {
      const q = ledgerSearch.toLowerCase();
      list = list.filter(t => t.title.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));
    }

    if (ledgerCategory !== 'all') {
      list = list.filter(t => t.category === ledgerCategory);
    }

    if (ledgerTagFilter !== 'all') {
      list = list.filter(t => t.tags && t.tags.includes(ledgerTagFilter));
    }

    list.sort((a, b) => {
      if (ledgerSort === 'date-desc') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (ledgerSort === 'date-asc') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (ledgerSort === 'amount-desc') return b.amount - a.amount;
      if (ledgerSort === 'amount-asc') return a.amount - b.amount;
      return 0;
    });

    return list;
  }, [transactions, ledgerSearch, ledgerCategory, ledgerSort, ledgerTagFilter]);

  // Recharts Data Models
  const dailyFlowChartData = useMemo(() => {
    const resultMap: Record<string, { label: string; income: number; expense: number }> = {};
    const days = [];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0] || '';
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      days.push({ key, label });
      resultMap[key] = { label, income: 0, expense: 0 };
    }

    transactions.forEach(t => {
      const dateKey = new Date(t.createdAt).toISOString().split('T')[0] || '';
      if (resultMap[dateKey]) {
        if (t.type === 'INCOME') {
          resultMap[dateKey]!.income += t.amount;
        } else {
          resultMap[dateKey]!.expense += t.amount;
        }
      }
    });

    const rate = exchangeRates[currency]?.rate || 1.0;
    return days.map(d => ({
      name: d.label,
      Income: Math.round((resultMap[d.key]?.income || 0) / rate),
      Expense: Math.round((resultMap[d.key]?.expense || 0) / rate)
    }));
  }, [transactions, currency]);

  const categoricalDoughnutData = useMemo(() => {
    const rate = exchangeRates[currency]?.rate || 1.0;
    return Object.keys(categorySpends)
      .map(cat => ({
        name: categoriesInfo[cat]?.label || cat,
        value: Math.round((categorySpends[cat] || 0) / rate),
        color: categoriesInfo[cat]?.color || '#9ca3af'
      }))
      .filter(item => item.value > 0);
  }, [categorySpends, currency]);

  const monthlyFlowChartData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const incomes = Array(12).fill(0);
    const expenses = Array(12).fill(0);

    transactions.forEach(t => {
      const d = new Date(t.createdAt);
      if (d.getFullYear() === currentYear) {
        const m = d.getMonth();
        if (t.type === 'INCOME') {
          incomes[m] += t.amount;
        } else {
          expenses[m] += t.amount;
        }
      }
    });

    const rate = exchangeRates[currency]?.rate || 1.0;
    return months.map((label, index) => ({
      name: label,
      Income: Math.round((incomes[index] || 0) / rate),
      Expense: Math.round((expenses[index] || 0) / rate)
    }));
  }, [transactions, currency]);

  // --- Financial Calendar Helper Operations ---
  const calendarDays = useMemo(() => {
    const start = new Date(calendarYear, calendarMonth, 1);
    const end = new Date(calendarYear, calendarMonth + 1, 0);
    
    const daysArr = [];
    const prevMonthEnd = new Date(calendarYear, calendarMonth, 0).getDate();
    
    // Prefix padding days from previous month
    const startDayOfWeek = start.getDay();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      daysArr.push({
        day: prevMonthEnd - i,
        month: calendarMonth === 0 ? 11 : calendarMonth - 1,
        year: calendarMonth === 0 ? calendarYear - 1 : calendarYear,
        isPadding: true
      });
    }

    // Actual calendar month days
    for (let i = 1; i <= end.getDate(); i++) {
      daysArr.push({
        day: i,
        month: calendarMonth,
        year: calendarYear,
        isPadding: false
      });
    }

    // Suffix padding days from next month
    const totalSlots = 42; // standard 6-row calendar
    const suffixCount = totalSlots - daysArr.length;
    for (let i = 1; i <= suffixCount; i++) {
      daysArr.push({
        day: i,
        month: calendarMonth === 11 ? 0 : calendarMonth + 1,
        year: calendarMonth === 11 ? calendarYear + 1 : calendarYear,
        isPadding: true
      });
    }

    // Map user transactions to correct day slots
    return daysArr.map(d => {
      const dayTxs = transactions.filter(t => {
        const date = new Date(t.createdAt);
        return date.getDate() === d.day && date.getMonth() === d.month && date.getFullYear() === d.year;
      });

      let dayIncome = 0;
      let dayExpense = 0;
      dayTxs.forEach(t => {
        if (t.type === 'INCOME') dayIncome += t.amount;
        else dayExpense += t.amount;
      });

      return {
        ...d,
        transactions: dayTxs,
        income: dayIncome,
        expense: dayExpense
      };
    });

  }, [transactions, calendarYear, calendarMonth]);

  const changeCalendarMonth = (offset: number) => {
    let nextMonth = calendarMonth + offset;
    let nextYear = calendarYear;
    if (nextMonth < 0) {
      nextMonth = 11;
      nextYear--;
    } else if (nextMonth > 11) {
      nextMonth = 0;
      nextYear++;
    }
    setCalendarMonth(nextMonth);
    setCalendarYear(nextYear);
  };

  // Render Portal if no active token exists
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative antialiased transition-colors duration-300">
        <div className="absolute top-4 right-4 z-50">
          <button onClick={toggleTheme} className="p-3 rounded-full border border-border/80 bg-card backdrop-blur-md shadow-lg text-foreground hover:scale-105 transition-all cursor-pointer">
            {theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-slate-700" />}
          </button>
        </div>

        <div className="w-full max-w-md glass-panel p-8 relative overflow-hidden flex flex-col items-center">
          <div className="brand flex items-center gap-3 mb-8">
            <div className="brand-logo bg-gradient-to-br from-indigo-500 to-pink-500 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg glow-indigo">
              <Wallet className="text-white" size={24} />
            </div>
            <div className="brand-info">
              <h1 className="font-heading font-extrabold text-2xl tracking-tight bg-gradient-to-r from-foreground to-indigo-400 bg-clip-text text-transparent">ExpenseFlow</h1>
              <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Smart Wealth Ledger</span>
            </div>
          </div>

          <div className="flex w-full border-b border-border/50 mb-6 relative">
            <button 
              onClick={() => { setAuthMode('login'); setAuthError(''); }}
              className={`flex-1 py-3 text-sm font-semibold tracking-wide border-b-2 transition-all ${authMode === 'login' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
              Sign In
            </button>
            <button 
              onClick={() => { setAuthMode('signup'); setAuthError(''); }}
              className={`flex-1 py-3 text-sm font-semibold tracking-wide border-b-2 transition-all ${authMode === 'signup' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
              Create Account
            </button>
          </div>

          {authError && (
            <div className="w-full p-3 mb-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold text-center">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="w-full flex flex-col gap-4">
            {authMode === 'signup' && (
              <div className="form-group flex flex-col gap-1.5 w-full">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <input 
                    type="text" 
                    required 
                    placeholder="Enter your name" 
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-border/80 bg-background/50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-foreground"
                  />
                </div>
              </div>
            )}

            <div className="form-group flex flex-col gap-1.5 w-full">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input 
                  type="email" 
                  required 
                  placeholder="name@example.com" 
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-border/80 bg-background/50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-foreground"
                />
              </div>
            </div>

            <div className="form-group flex flex-col gap-1.5 w-full">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Password</label>
              <div className="relative">
                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input 
                  type="password" 
                  required 
                  placeholder={authMode === 'signup' ? 'Min. 6 characters' : 'Enter your password'} 
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-border/80 bg-background/50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-foreground"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={authLoading}
              className="w-full bg-gradient-to-r from-indigo-500 to-pink-500 hover:brightness-110 text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-indigo-500/20 hover:-translate-y-0.5 active:translate-y-0 duration-200 mt-4 flex items-center justify-center gap-2 cursor-pointer"
            >
              {authLoading ? 'Verifying Identity...' : authMode === 'signup' ? 'Create Account' : 'Secure Sign In'}
            </button>
          </form>
        </div>

        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
          {toasts.map(t => (
            <div key={t.id} className={`flex items-center gap-3 p-4 rounded-xl border backdrop-blur-md shadow-lg duration-300 transform translate-y-0 animate-in fade-in slide-in-from-bottom-2 ${t.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : t.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
              <CheckCircle2 size={18} />
              <div className="text-xs font-semibold">{t.message}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex w-full relative transition-colors duration-300">
      
      {/* Mobile Drawer Overlay Backdrop */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)} 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
        ></div>
      )}

      {/* Side Navigation */}
      <aside className={`w-[280px] bg-card border-r border-border backdrop-blur-xl p-8 flex flex-col fixed top-0 bottom-0 left-0 z-40 transition-transform duration-300 lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="brand flex items-center gap-3 mb-8">
          <div className="brand-logo bg-gradient-to-br from-indigo-500 to-pink-500 w-11 h-11 rounded-xl flex items-center justify-center shadow-lg glow-indigo">
            <Wallet className="text-white" size={20} />
          </div>
          <div className="brand-info">
            <h1 className="font-heading font-extrabold text-lg tracking-tight bg-gradient-to-r from-foreground to-indigo-400 bg-clip-text text-transparent">ExpenseFlow</h1>
            <span className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground">Smart Wealth Ledger</span>
          </div>
        </div>

        <nav className="flex flex-col gap-1.5 flex-grow">
          <button 
            onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-xs tracking-wide transition-all cursor-pointer ${activeTab === 'dashboard' ? 'bg-indigo-500/15 border-l-3 border-indigo-500 text-foreground' : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground'}`}
          >
            <LayoutDashboard size={16} className={activeTab === 'dashboard' ? 'text-indigo-500' : ''} />
            <span>Dashboard</span>
          </button>

          <button 
            onClick={() => { setActiveTab('ledger'); setIsMobileMenuOpen(false); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-xs tracking-wide transition-all cursor-pointer ${activeTab === 'ledger' ? 'bg-indigo-500/15 border-l-3 border-indigo-500 text-foreground' : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground'}`}
          >
            <Receipt size={16} className={activeTab === 'ledger' ? 'text-indigo-500' : ''} />
            <span>Ledger Vault</span>
          </button>
        </nav>

        {/* Sidebar outflow gauge comparison */}
        <div className="bg-background/40 border border-border/80 rounded-2xl p-4 mb-6 shadow-inner">
          <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
            <span>Outflow Gauge</span>
            <span className="text-indigo-500">{outflowGaugePercent}%</span>
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-2">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 transition-all duration-500" style={{ width: `${outflowGaugePercent}%` }}></div>
          </div>
          <p className="text-[9px] leading-relaxed text-muted-foreground">Keep expenditures within aggregated category targets!</p>
        </div>

        {/* User Card footer */}
        <div className="flex items-center justify-between border-t border-border pt-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="avatar bg-gradient-to-br from-indigo-500 to-purple-600 w-9 h-9 rounded-full flex items-center justify-center font-bold text-white border border-white/10 shrink-0">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-xs font-bold text-foreground truncate">{user?.name}</h4>
              <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">Premium Tier</span>
            </div>
          </div>
          <button onClick={handleSignOut} className="p-2 text-muted-foreground hover:text-rose-500 transition-all rounded-lg hover:bg-rose-500/10 cursor-pointer" title="Secure Logout">
            <LogOut size={15} />
          </button>
        </div>
      </aside>

      {/* Main Workspace content */}
      <main className="flex-grow pl-0 lg:pl-[280px] p-4 sm:p-8 flex flex-col min-h-screen bg-transparent">
        
        {/* Top Header bar */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger menu toggle button */}
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2.5 rounded-xl border border-border/80 bg-card text-foreground hover:scale-105 transition-all lg:hidden cursor-pointer"
              title="Open Navigation"
            >
              <Menu size={16} />
            </button>
            <div className="greeting-container">
              <h2 className="font-heading font-extrabold text-xl sm:text-2xl tracking-tight text-foreground bg-gradient-to-r from-foreground to-indigo-400 bg-clip-text text-transparent">Hello, {user?.name}</h2>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Premium Finance Engine &bull; {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 justify-start md:justify-end w-full md:w-auto">
            {/* Display currency selection dropdown */}
            <div className="relative">
              <select 
                value={currency} 
                onChange={(e) => handleCurrencyChange(e.target.value as any)}
                className="pl-8 pr-6 py-2 text-xs font-semibold rounded-xl border border-border/80 bg-card text-foreground focus:outline-none hover:border-indigo-500 transition-all appearance-none cursor-pointer"
              >
                <option value="INR">₹ INR</option>
                <option value="USD">$ USD</option>
                <option value="EUR">€ EUR</option>
                <option value="GBP">£ GBP</option>
              </select>
              <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={13} />
            </div>

            {/* Dark light toggler */}
            <button onClick={toggleTheme} className="p-2.5 rounded-xl border border-border/80 bg-card text-foreground hover:scale-105 transition-all cursor-pointer">
              {theme === 'dark' ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-slate-700" />}
            </button>

            {/* Config panel Settings modal trigger */}
            <button onClick={() => { setIsSettingsModalOpen(true); }} className="p-2.5 rounded-xl border border-border/80 bg-card text-foreground hover:scale-105 transition-all cursor-pointer" title="Settings Panel">
              <Settings size={15} className="text-muted-foreground hover:text-foreground" />
            </button>

            {/* Advanced transaction drawer trigger */}
            <button onClick={() => openTransactionDrawer()} className="bg-gradient-to-r from-indigo-500 to-pink-500 hover:brightness-110 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg hover:shadow-indigo-500/20 hover:-translate-y-0.5 active:translate-y-0 duration-200 flex items-center gap-1.5 cursor-pointer flex-grow sm:flex-grow-0 justify-center">
              <Plus size={15} />
              <span>Record Flow</span>
            </button>
          </div>
        </header>

        {loadingData ? (
          <div className="flex-grow flex items-center justify-center flex-col gap-3">
            <div className="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Fetching PostgreSQL Ledger...</p>
          </div>
        ) : activeTab === 'dashboard' ? (
          /* Dynamic Dashboard Panel */
          <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            
            {/* Multi-Account Deck displaying cash balances separately */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1">
                <Hash size={14} className="text-indigo-500" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Multi-Account balances</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {accounts.map(acc => {
                  let glowClass = 'glow-indigo';
                  let iconColor = 'text-indigo-500';
                  if (acc.type === 'CASH') { glowClass = 'glow-amber'; iconColor = 'text-amber-500'; }
                  else if (acc.type === 'BANK') { glowClass = 'glow-blue'; iconColor = 'text-blue-500'; }
                  else if (acc.type === 'UPI') { glowClass = 'glow-emerald'; iconColor = 'text-emerald-500'; }
                  else if (acc.type === 'CREDIT_CARD') { glowClass = 'glow-rose'; iconColor = 'text-rose-500'; }
                  
                  return (
                    <div key={acc.id} className={`glass-panel p-4 flex items-center gap-3 relative overflow-hidden ${glowClass}`}>
                      <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center shrink-0">
                        <Wallet size={16} className={iconColor} />
                      </div>
                      <div className="overflow-hidden">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-0.5">{acc.name}</span>
                        <h4 className="text-sm font-bold text-foreground truncate">{formatVal(acc.balance)}</h4>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Smart AI Insights container */}
            <div className="glass-panel p-5 border border-indigo-500/20 bg-indigo-500/5 relative overflow-hidden flex flex-col gap-3">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full filter blur-xl translate-x-8 -translate-y-8"></div>
              <div className="flex items-center gap-2 shrink-0">
                <Sparkles size={16} className="text-indigo-500 animate-pulse" />
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">ExpenseFlow AI Insights Desk</h4>
              </div>
              <div className="flex flex-col gap-1.5">
                {aiInsights.map((insight, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-muted-foreground leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5"></span>
                    <span>{insight}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Dashboard widgets KPI metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Balance card */}
              <div className="glass-panel p-5 relative overflow-hidden flex items-center gap-4 glow-indigo">
                <div className="w-11 h-11 bg-indigo-500/10 rounded-xl border border-indigo-500/20 flex items-center justify-center text-indigo-500 shrink-0">
                  <Wallet size={20} />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-0.5">Net Wealth</span>
                  <h3 className="font-heading font-extrabold text-xl tracking-tight text-foreground">{formatVal(metrics.balance)}</h3>
                </div>
              </div>

              {/* Income card */}
              <div className="glass-panel p-5 relative overflow-hidden flex items-center gap-4 glow-emerald">
                <div className="w-11 h-11 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                  <ArrowDownLeft size={20} />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-0.5">Deposits</span>
                  <h3 className="font-heading font-extrabold text-xl tracking-tight text-foreground">{formatVal(metrics.incomeTotal)}</h3>
                </div>
              </div>

              {/* Savings Rate card */}
              <div className="glass-panel p-5 relative overflow-hidden flex items-center gap-4 glow-blue">
                <div className="w-11 h-11 bg-blue-500/10 rounded-xl border border-blue-500/20 flex items-center justify-center text-blue-500 shrink-0">
                  <Activity size={20} />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-0.5">Savings Rate</span>
                  <h3 className="font-heading font-extrabold text-xl tracking-tight text-foreground">{metrics.savingsRate}%</h3>
                </div>
              </div>

              {/* Top spending card */}
              <div className="glass-panel p-5 relative overflow-hidden flex items-center gap-4 glow-rose">
                <div className="w-11 h-11 bg-rose-500/10 rounded-xl border border-rose-500/20 flex items-center justify-center text-rose-500 shrink-0">
                  <ArrowUpRight size={20} />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-0.5">Top Category</span>
                  <h3 className="font-heading font-extrabold text-xl tracking-tight text-foreground truncate max-w-[120px]">
                    {topSpendingCategoryInfo.category !== 'None' ? `${topSpendingCategoryInfo.category}` : 'None'}
                  </h3>
                </div>
              </div>
            </div>

            {/* Dynamic Charts grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Daily Line velocity */}
              <div className="glass-panel p-5 lg:col-span-2 min-h-[340px] flex flex-col">
                <div className="flex justify-between items-center mb-5 shrink-0">
                  <div>
                    <h3 className="font-heading font-extrabold text-sm tracking-tight text-foreground">7-Day Flow Velocity</h3>
                    <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Dynamic tracking of income vs expenses</p>
                  </div>
                  <Activity size={16} className="text-indigo-500" />
                </div>
                <div className="flex-grow w-full min-h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyFlowChartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <XAxis dataKey="name" stroke="#6b7280" fontSize={9} tickLine={false} axisLine={false} />
                      <YAxis stroke="#6b7280" fontSize={9} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ background: '#0e1225', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px' }} labelStyle={{ color: '#fff', fontSize: '10px', fontWeight: 'bold' }} itemStyle={{ fontSize: '10px' }} />
                      <Legend verticalAlign="top" height={36} iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                      <Line type="monotone" dataKey="Income" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="Expense" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Categorical spending doughnut */}
              <div className="glass-panel p-5 min-h-[340px] flex flex-col">
                <div className="flex justify-between items-center mb-5 shrink-0">
                  <div>
                    <h3 className="font-heading font-extrabold text-sm tracking-tight text-foreground">Expense Domains</h3>
                    <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Categorical outflow weight</p>
                  </div>
                  <PieChart size={16} className="text-pink-500" />
                </div>
                <div className="flex-grow w-full min-h-[200px] relative flex items-center justify-center">
                  {categoricalDoughnutData.length === 0 ? (
                    <div className="text-center text-xs text-muted-foreground font-semibold">No expense records logged.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie
                          data={categoricalDoughnutData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={78}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {categoricalDoughnutData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${exchangeRates[currency]?.symbol || '₹'}${value}`} contentStyle={{ background: '#0e1225', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px' }} itemStyle={{ fontSize: '10px', color: '#fff' }} />
                      </RePieChart>
                    </ResponsiveContainer>
                  )}
                  {categoricalDoughnutData.length > 0 && (
                    <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Outflow</span>
                      <span className="font-heading font-extrabold text-base tracking-tight text-foreground truncate max-w-[100px]">{formatVal(metrics.expenseTotal)}</span>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Savings Goals & Reminders dashboard section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Savings Goals tracking card */}
              <div className="glass-panel p-5 flex flex-col min-h-[300px]">
                <div className="flex justify-between items-center mb-5 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <Target size={16} className="text-indigo-500" />
                    <h3 className="font-heading font-extrabold text-sm tracking-tight text-foreground">Savings Goals</h3>
                  </div>
                  <button onClick={() => setIsNewGoalModalOpen(true)} className="p-1.5 text-indigo-500 hover:text-pink-500 transition-colors flex items-center gap-1 cursor-pointer" title="Create Savings Goal">
                    <PlusCircle size={15} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">New Goal</span>
                  </button>
                </div>

                <div className="flex-grow flex flex-col gap-4 overflow-y-auto max-h-[250px] pr-1">
                  {savingsGoals.length === 0 ? (
                    <div className="flex-grow flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                      <Inbox size={28} className="mb-2 text-muted-foreground/30" />
                      <p className="text-[10px] font-semibold">No active savings targets set. Set some to begin!</p>
                    </div>
                  ) : (
                    savingsGoals.map(goal => {
                      const percent = Math.min(Math.round((goal.saved / goal.target) * 100), 100);
                      return (
                        <div key={goal.id} className="flex flex-col gap-1.5 p-3 rounded-xl bg-background/30 border border-border/50 hover:bg-muted/10 transition-colors relative">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                              <Target size={13} className="text-indigo-500 animate-pulse" />
                              <span>{goal.name}</span>
                            </span>
                            <button onClick={() => handleGoalDelete(goal.id)} className="p-1 rounded text-muted-foreground hover:text-rose-500 transition-colors" title="Delete Goal">
                              <Trash2 size={13} />
                            </button>
                          </div>

                          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden my-1">
                            <div className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 transition-all duration-500" style={{ width: `${percent}%` }}></div>
                          </div>

                          <div className="flex justify-between items-center text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                            <span>Goal: {formatVal(goal.target)} | Saved: {formatVal(goal.saved)}</span>
                            <span className="text-indigo-500">{percent}% Progress</span>
                          </div>

                          {/* Allocation input loader */}
                          <div className="flex items-center gap-2 mt-2 border-t border-border/30 pt-2 shrink-0">
                            <input 
                              type="number"
                              placeholder="₹ Allocation amount"
                              value={goalAllocationInput[goal.id] || ''}
                              onChange={(e) => setGoalAllocationInput(prev => ({ ...prev, [goal.id]: e.target.value }))}
                              className="px-2 py-1 text-[10px] rounded-lg border border-border bg-background/50 text-foreground focus:outline-none flex-grow"
                            />
                            <button onClick={() => handleAllocateGoal(goal.id)} className="px-3 py-1 bg-secondary hover:brightness-105 text-foreground text-[9px] font-bold rounded-lg transition-all shrink-0 cursor-pointer">
                              Allocate
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Bill Reminders checklist panel */}
              <div className="glass-panel p-5 flex flex-col min-h-[300px]">
                <div className="flex justify-between items-center mb-5 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <CalendarDays size={16} className="text-pink-500" />
                    <h3 className="font-heading font-extrabold text-sm tracking-tight text-foreground">Upcoming Bills</h3>
                  </div>
                  <button onClick={() => setIsNewReminderModalOpen(true)} className="p-1.5 text-pink-500 hover:text-indigo-500 transition-colors flex items-center gap-1 cursor-pointer" title="Add Bill Reminder">
                    <PlusCircle size={15} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">New Bill</span>
                  </button>
                </div>

                <div className="flex-grow flex flex-col gap-3 overflow-y-auto max-h-[250px] pr-1">
                  {billReminders.length === 0 ? (
                    <div className="flex-grow flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                      <Inbox size={28} className="mb-2 text-muted-foreground/30" />
                      <p className="text-[10px] font-semibold">No bill reminders configured. Configure some to track alerts!</p>
                    </div>
                  ) : (
                    billReminders.map(bill => {
                      const now = new Date();
                      const due = new Date(bill.dueDate);
                      const diffTime = due.getTime() - now.getTime();
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      
                      let alertColor = 'text-indigo-500';
                      let alertBg = 'bg-indigo-500/10 border-indigo-500/20';
                      let alertLabel = `Due in ${diffDays} day${diffDays === 1 ? '' : 's'}`;

                      if (diffDays <= 0) {
                        alertColor = 'text-rose-500 font-extrabold animate-pulse';
                        alertBg = 'bg-rose-500/10 border-rose-500/20';
                        alertLabel = 'Overdue';
                      } else if (diffDays === 1) {
                        alertColor = 'text-rose-500 font-extrabold';
                        alertBg = 'bg-rose-500/10 border-rose-500/20';
                        alertLabel = 'Due tomorrow';
                      } else if (diffDays <= 3) {
                        alertColor = 'text-amber-500';
                        alertBg = 'bg-amber-500/10 border-amber-500/20';
                      }

                      return (
                        <div key={bill.id} className={`flex items-center justify-between p-3.5 rounded-xl border bg-background/20 relative ${bill.isPaid ? 'opacity-55' : ''}`}>
                          <div className="flex items-center gap-3 overflow-hidden">
                            <button onClick={() => handleToggleReminderPaid(bill.id)} className="p-1 rounded text-muted-foreground hover:text-indigo-500 transition-colors shrink-0 cursor-pointer">
                              {bill.isPaid ? <CheckSquare size={16} className="text-indigo-500" /> : <Square size={16} />}
                            </button>
                            <div className="overflow-hidden">
                              <span className={`text-xs font-bold text-foreground block ${bill.isPaid ? 'line-through' : ''}`}>{bill.title}</span>
                              <span className="text-[10px] text-muted-foreground font-semibold">{formatVal(bill.amount)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2.5 shrink-0">
                            {!bill.isPaid && (
                              <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest ${alertBg} ${alertColor}`}>
                                {alertLabel}
                              </span>
                            )}
                            {bill.isPaid && (
                              <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                                Paid
                              </span>
                            )}
                            <button onClick={() => handleReminderDelete(bill.id)} className="p-1 rounded text-muted-foreground hover:text-rose-500 transition-all cursor-pointer">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>

          </div>
        ) : (
          /* Ledger tab visual panel */
          <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            
            {/* Control header toggling list vs calendar */}
            <div className="glass-panel p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              <div className="flex flex-grow flex-wrap items-center gap-3">
                <div className="flex p-1 border border-border/80 bg-background/50 rounded-xl">
                  <button 
                    onClick={() => setLedgerSubView('list')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${ledgerSubView === 'list' ? 'bg-primary text-white shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <Receipt size={13} />
                    <span>Vault List</span>
                  </button>
                  <button 
                    onClick={() => setLedgerSubView('calendar')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${ledgerSubView === 'calendar' ? 'bg-primary text-white shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <CalendarDays size={13} />
                    <span>Visual Calendar</span>
                  </button>
                </div>

                {ledgerSubView === 'list' && (
                  <>
                    {/* Search description */}
                    <div className="relative w-full md:max-w-xs">
                      <input 
                        type="text" 
                        placeholder="Search ledger vault..." 
                        value={ledgerSearch}
                        onChange={(e) => setLedgerSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 text-xs font-medium rounded-xl border border-border/80 bg-background/50 focus:outline-none text-foreground"
                      />
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={13} />
                    </div>

                    {/* Sorting criteria */}
                    <div className="relative w-[48%] md:w-auto flex-grow md:flex-grow-0">
                      <select 
                        value={ledgerSort} 
                        onChange={(e) => setLedgerSort(e.target.value)}
                        className="w-full pl-9 pr-6 py-2.5 text-xs font-semibold rounded-xl border border-border/80 bg-background/50 text-foreground focus:outline-none cursor-pointer appearance-none"
                      >
                        <option value="date-desc">Newest First</option>
                        <option value="date-asc">Oldest First</option>
                        <option value="amount-desc">Highest Amount</option>
                        <option value="amount-asc">Lowest Amount</option>
                      </select>
                      <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={13} />
                    </div>

                    {/* Hashtag tag selectors */}
                    <div className="relative w-[48%] md:w-auto flex-grow md:flex-grow-0">
                      <select 
                        value={ledgerTagFilter} 
                        onChange={(e) => setLedgerTagFilter(e.target.value)}
                        className="w-full pl-9 pr-6 py-2.5 text-xs font-semibold rounded-xl border border-border/80 bg-background/50 text-foreground focus:outline-none cursor-pointer appearance-none"
                      >
                        <option value="all">All Hashtags</option>
                        {uniqueHashtags.map(tg => (
                          <option key={tg} value={tg}>#{tg}</option>
                        ))}
                      </select>
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={13} />
                    </div>

                    {/* Exports */}
                    <div className="flex gap-2 w-full md:w-auto">
                      <button onClick={handleExportCSV} className="flex-1 md:flex-initial border border-border/80 bg-card hover:bg-muted/10 text-foreground font-semibold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer">
                        <Download size={13} className="text-indigo-500" />
                        <span>CSV</span>
                      </button>
                      
                      <button onClick={handleExportExcel} className="flex-1 md:flex-initial border border-border/80 bg-card hover:bg-muted/10 text-foreground font-semibold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer">
                        <Download size={13} className="text-emerald-500" />
                        <span>Excel</span>
                      </button>
                    </div>
                  </>
                )}
              </div>

              {ledgerSubView === 'list' && (
                <div className="flex overflow-x-auto gap-1 max-w-full pb-1 shrink-0">
                  <button 
                    onClick={() => setLedgerCategory('all')}
                    className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${ledgerCategory === 'all' ? 'bg-primary text-white shadow-md' : 'bg-card border border-border text-muted-foreground hover:text-foreground'}`}
                  >
                    All Domains
                  </button>
                  {Object.keys(categoriesInfo).map(cat => (
                    <button 
                      key={cat}
                      onClick={() => setLedgerCategory(cat)}
                      className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${ledgerCategory === cat ? 'bg-primary text-white shadow-md animate-pulse' : 'bg-card border border-border text-muted-foreground hover:text-foreground'}`}
                    >
                      {categoriesInfo[cat]?.label}
                    </button>
                  ))}
                </div>
              )}

            </div>

            {ledgerSubView === 'list' ? (
              /* Ledger list layout */
              <div className="glass-panel p-6 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="font-heading font-extrabold text-lg tracking-tight text-foreground">Transaction Vault</h3>
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Filtered ledger records: {filteredTransactions.length}</p>
                  </div>
                </div>

                <div className="overflow-x-auto min-h-[300px]">
                  {filteredTransactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
                      <Inbox size={48} className="mb-3 text-muted-foreground/30" />
                      <p className="text-sm font-semibold">No transactions match your filtering constraints.</p>
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse min-w-[650px]">
                      <thead>
                        <tr className="border-b border-border/50 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          <th className="py-3 px-4">Transaction Title</th>
                          <th className="py-3 px-4">Category Domain</th>
                          <th className="py-3 px-4">Hashtags</th>
                          <th className="py-3 px-4">Recorded Date</th>
                          <th className="py-3 px-4 text-right">Amount</th>
                          <th className="py-3 px-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTransactions.map(t => {
                          const catMeta = categoriesInfo[t.category] || categoriesInfo.Other;
                          const CatIcon = catMeta.icon;
                          return (
                            <tr key={t.id} className="border-b border-border/30 hover:bg-muted/10 text-xs font-medium transition-colors">
                              <td className="py-3.5 px-4 text-foreground font-semibold flex items-center gap-3">
                                <div className={`w-8.5 h-8.5 rounded-lg flex items-center justify-center text-white shrink-0 ${catMeta.bgClass}`}>
                                  <CatIcon size={15} />
                                </div>
                                <span className="truncate max-w-[150px]">{t.title}</span>
                              </td>
                              <td className="py-3.5 px-4">
                                <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider badge-${t.category}`}>
                                  {catMeta.label}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 max-w-[140px] truncate text-indigo-500 font-bold">
                                {t.tags && t.tags.length > 0 ? t.tags.map((tg: string) => `#${tg}`).join(' ') : '-'}
                              </td>
                              <td className="py-3.5 px-4 text-muted-foreground font-bold">
                                {new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </td>
                              <td className={`py-3.5 px-4 text-right font-extrabold ${t.type === 'INCOME' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {t.type === 'INCOME' ? '+' : '-'}{formatVal(t.amount)}
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button onClick={() => openTransactionDrawer(t)} className="p-2 text-muted-foreground hover:text-indigo-500 hover:bg-indigo-500/10 rounded-lg transition-all cursor-pointer" title="Edit Transaction">
                                    <Edit3 size={14} />
                                  </button>
                                  <button onClick={() => handleTxDelete(t.id)} className="p-2 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer" title="Delete Transaction">
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            ) : (
              /* Financial Calendar View Layout */
              <div className="glass-panel p-6 flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
                  <div>
                    <h3 className="font-heading font-extrabold text-lg tracking-tight text-foreground">Financial Calendar</h3>
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Chronological cash flow tracking grid</p>
                  </div>
                  
                  {/* Calendar controller */}
                  <div className="flex items-center gap-3">
                    <button onClick={() => changeCalendarMonth(-1)} className="px-3 py-1.5 bg-secondary text-foreground text-xs font-bold rounded-xl transition-all cursor-pointer">
                      Prev
                    </button>
                    <span className="text-xs font-bold text-foreground min-w-[90px] text-center uppercase tracking-wider">
                      {new Date(calendarYear, calendarMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                    <button onClick={() => changeCalendarMonth(1)} className="px-3 py-1.5 bg-secondary text-foreground text-xs font-bold rounded-xl transition-all cursor-pointer">
                      Next
                    </button>
                  </div>
                </div>

                {/* Calendar Day slots */}
                <div className="grid grid-cols-7 gap-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(dName => (
                    <div key={dName} className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest py-1 border-b border-border mb-1">{dName}</div>
                  ))}

                  {calendarDays.map((slot, sIdx) => (
                    <div 
                      key={sIdx} 
                      className={`min-h-[55px] sm:min-h-[90px] rounded-xl border p-1 sm:p-2.5 flex flex-col justify-between transition-all hover:bg-muted/10 relative overflow-hidden ${slot.isPadding ? 'border-border/30 opacity-40' : 'border-border bg-background/10'}`}
                    >
                      <span className="text-[8px] sm:text-[10px] font-bold text-muted-foreground self-end">{slot.day}</span>
                      
                      {/* Flow calculations */}
                      <div className="flex flex-col gap-0.5 overflow-hidden">
                        {slot.income > 0 && (
                          <div className="text-[7px] sm:text-[9px] font-extrabold text-emerald-500 truncate" title={`Income: ${formatVal(slot.income)}`}>
                            +{formatVal(slot.income)}
                          </div>
                        )}
                        {slot.expense > 0 && (
                          <div className="text-[7px] sm:text-[9px] font-extrabold text-rose-500 truncate" title={`Expense: ${formatVal(slot.expense)}`}>
                            -{formatVal(slot.expense)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* Global Toasts container */}
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
          {toasts.map(t => (
            <div key={t.id} className={`flex items-center gap-3 p-4 rounded-xl border backdrop-blur-md shadow-lg duration-300 transform translate-y-0 animate-in fade-in slide-in-from-bottom-2 ${t.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : t.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
              <CheckCircle2 size={18} />
              <div className="text-xs font-semibold">{t.message}</div>
            </div>
          ))}
        </div>

      </main>

      {/* --- Advanced Transaction drawer --- */}
      {isTxDrawerOpen && (
        <>
          <div onClick={() => setIsTxDrawerOpen(false)} className="drawer-overlay fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200"></div>
          <div className="drawer fixed top-0 bottom-0 right-0 w-full sm:w-[420px] max-w-full bg-card border-l border-border backdrop-blur-2xl p-6 sm:p-8 z-50 shadow-2xl flex flex-col gap-6 animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center border-b border-border pb-4">
              <h3 className="font-heading font-extrabold text-xl tracking-tight text-foreground">{editingTx ? 'Modify Transaction' : 'Record Transaction'}</h3>
              <button onClick={() => setIsTxDrawerOpen(false)} className="p-2 text-muted-foreground hover:text-foreground transition-all rounded-lg hover:bg-muted/40 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleTxSubmit} className="flex-grow flex flex-col gap-5 overflow-y-auto pr-1">
              <div className="form-group flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Transaction Flow Type</label>
                <div className="grid grid-cols-2 gap-2 p-1 border border-border/80 bg-background/50 rounded-xl">
                  <button 
                    type="button"
                    onClick={() => setTxType('EXPENSE')}
                    className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${txType === 'EXPENSE' ? 'bg-rose-500 text-white shadow-md glow-rose' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <ArrowUpRight size={14} />
                    <span>Expense</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setTxType('INCOME')}
                    className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${txType === 'INCOME' ? 'bg-emerald-500 text-white shadow-md glow-emerald' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <ArrowDownLeft size={14} />
                    <span>Income</span>
                  </button>
                </div>
              </div>

              <div className="form-group flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Description / Merchant</label>
                <div className="relative">
                  <ShoppingBag className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Amazon, Salary, Gym..." 
                    value={txTitle}
                    onChange={(e) => setTxTitle(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 text-xs font-medium rounded-xl border border-border/80 bg-background/50 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Amount (INR)</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <input 
                      type="number" 
                      required 
                      step="0.01"
                      min="0.01"
                      placeholder="0.00" 
                      value={txAmount}
                      onChange={(e) => setTxAmount(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 text-xs font-medium rounded-xl border border-border/80 bg-background/50 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                    />
                  </div>
                </div>

                <div className="form-group flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <input 
                      type="date" 
                      required 
                      value={txDate}
                      onChange={(e) => setTxDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 text-xs font-medium rounded-xl border border-border/80 bg-background/50 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                    />
                  </div>
                </div>
              </div>

              <div className="form-group flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Domain Category</label>
                <div className="relative">
                  <Layers className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <select 
                    value={txCategory} 
                    onChange={(e) => setTxCategory(e.target.value)}
                    className="w-full pl-10 pr-6 py-3 text-xs font-medium rounded-xl border border-border/80 bg-background/50 text-foreground focus:outline-none cursor-pointer appearance-none"
                  >
                    {Object.keys(categoriesInfo).map(cat => (
                      <option key={cat} value={cat}>{categoriesInfo[cat]?.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Account mapping */}
              <div className="form-group flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Target Account</label>
                <div className="relative">
                  <Wallet className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <select 
                    value={txAccountId} 
                    onChange={(e) => setTxAccountId(e.target.value)}
                    className="w-full pl-10 pr-6 py-3 text-xs font-medium rounded-xl border border-border/80 bg-background/50 text-foreground focus:outline-none cursor-pointer appearance-none"
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name} ({formatVal(acc.balance)})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Hashtag input */}
              <div className="form-group flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Hashtag Tags</label>
                <div className="relative">
                  <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <input 
                    type="text" 
                    placeholder="e.g. college, trip, family" 
                    value={txTagsString}
                    onChange={(e) => setTxTagsString(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 text-xs font-medium rounded-xl border border-border/80 bg-background/50 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                  />
                </div>
                <p className="text-[9px] text-muted-foreground leading-relaxed">Enter tags separated by commas or spaces. Indexing is automatic!</p>
              </div>

              <button 
                type="submit" 
                className="w-full bg-gradient-to-r from-indigo-500 to-pink-500 hover:brightness-110 text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-indigo-500/20 hover:-translate-y-0.5 active:translate-y-0 duration-200 mt-4 flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 size={16} />
                <span>{editingTx ? 'Apply Changes' : 'Record Transaction'}</span>
              </button>
            </form>
          </div>
        </>
      )}

      {/* --- Category target budget Goal Editor Modal --- */}
      {isGoalModalOpen && (
        <>
          <div onClick={() => setIsGoalModalOpen(false)} className="modal-overlay fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200"></div>
          <div className="modal fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[380px] sm:w-[380px] bg-card border border-border/80 backdrop-blur-2xl p-5 sm:p-6 rounded-2xl z-50 shadow-2xl flex flex-col gap-5 animate-in zoom-in-95 duration-250">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-heading font-extrabold text-base tracking-tight text-foreground">Update Category Goal</h3>
              <button onClick={() => setIsGoalModalOpen(false)} className="p-1.5 text-muted-foreground hover:text-foreground transition-all rounded-lg cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleGoalSubmit} className="flex flex-col gap-4">
              <div className="text-center font-heading font-extrabold text-md text-foreground py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl glow-indigo">
                Category: {categoriesInfo[selectedGoalCategory]?.label}
              </div>

              <div className="form-group flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Monthly Budget Limit (INR)</label>
                <div className="relative">
                  <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <input 
                    type="number" 
                    required 
                    min="1"
                    placeholder="e.g. 5000" 
                    value={goalAmountInput}
                    onChange={(e) => setGoalAmountInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 text-xs font-medium rounded-xl border border-border/80 bg-background/50 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full bg-gradient-to-r from-indigo-500 to-pink-500 hover:brightness-110 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-indigo-500/20 hover:-translate-y-0.5 active:translate-y-0 duration-200 mt-2 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Save size={15} />
                <span>Save Target Goal</span>
              </button>
            </form>
          </div>
        </>
      )}

      {/* --- New Savings Goal creator Modal --- */}
      {isNewGoalModalOpen && (
        <>
          <div onClick={() => setIsNewGoalModalOpen(false)} className="modal-overlay fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200"></div>
          <div className="modal fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[380px] sm:w-[380px] bg-card border border-border/80 backdrop-blur-2xl p-5 sm:p-6 rounded-2xl z-50 shadow-2xl flex flex-col gap-5 animate-in zoom-in-95 duration-250">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-heading font-extrabold text-base tracking-tight text-foreground flex items-center gap-1.5">
                <Target size={16} className="text-indigo-500" />
                <span>Add Savings Goal</span>
              </h3>
              <button onClick={() => setIsNewGoalModalOpen(false)} className="p-1.5 text-muted-foreground hover:text-foreground transition-all rounded-lg cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleNewGoalSubmit} className="flex flex-col gap-4">
              <div className="form-group flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Goal Name / Target Asset</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. New Laptop, Vacation..." 
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-border/80 bg-background/50 focus:outline-none text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Target Amount</label>
                  <input 
                    type="number" 
                    required 
                    min="1"
                    placeholder="₹ Target limit" 
                    value={goalTarget}
                    onChange={(e) => setGoalTarget(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-border/80 bg-background/50 focus:outline-none text-foreground"
                  />
                </div>

                <div className="form-group flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Saved Offset</label>
                  <input 
                    type="number" 
                    min="0"
                    placeholder="₹ Already saved" 
                    value={goalSaved}
                    onChange={(e) => setGoalSaved(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-border/80 bg-background/50 focus:outline-none text-foreground"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full bg-gradient-to-r from-indigo-500 to-pink-500 hover:brightness-110 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Save size={15} />
                <span>Save Goal</span>
              </button>
            </form>
          </div>
        </>
      )}

      {/* --- New Bill Reminder creator Modal --- */}
      {isNewReminderModalOpen && (
        <>
          <div onClick={() => setIsNewReminderModalOpen(false)} className="modal-overlay fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200"></div>
          <div className="modal fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[380px] sm:w-[380px] bg-card border border-border/80 backdrop-blur-2xl p-5 sm:p-6 rounded-2xl z-50 shadow-2xl flex flex-col gap-5 animate-in zoom-in-95 duration-250">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-heading font-extrabold text-base tracking-tight text-foreground flex items-center gap-1.5">
                <CalendarDays size={16} className="text-pink-500" />
                <span>Add Bill Reminder</span>
              </h3>
              <button onClick={() => setIsNewReminderModalOpen(false)} className="p-1.5 text-muted-foreground hover:text-foreground transition-all rounded-lg cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleNewReminderSubmit} className="flex flex-col gap-4">
              <div className="form-group flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Bill Title / Service</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Electricity, Water, Internet..." 
                  value={reminderTitle}
                  onChange={(e) => setReminderTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-border/80 bg-background/50 focus:outline-none text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Bill Cost (INR)</label>
                  <input 
                    type="number" 
                    required 
                    min="1"
                    placeholder="₹ Due cost" 
                    value={reminderAmount}
                    onChange={(e) => setReminderAmount(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-border/80 bg-background/50 focus:outline-none text-foreground"
                  />
                </div>

                <div className="form-group flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Due Date</label>
                  <input 
                    type="date" 
                    required 
                    value={reminderDate}
                    onChange={(e) => setReminderDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-border/80 bg-background/50 focus:outline-none text-foreground"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full bg-gradient-to-r from-indigo-500 to-pink-500 hover:brightness-110 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Save size={15} />
                <span>Save Reminder</span>
              </button>
            </form>
          </div>
        </>
      )}

      {/* --- Settings Panel & Subscriptions Modal --- */}
      {isSettingsModalOpen && (
        <>
          <div onClick={() => setIsSettingsModalOpen(false)} className="modal-overlay fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200"></div>
          <div className="modal fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] sm:w-[540px] max-w-[540px] max-h-[85vh] bg-card border border-border/80 backdrop-blur-2xl p-5 sm:p-7 rounded-2xl z-50 shadow-2xl flex flex-col gap-5 animate-in zoom-in-95 duration-250 overflow-hidden">
            
            <div className="flex justify-between items-center border-b border-border pb-3 shrink-0">
              <h3 className="font-heading font-extrabold text-lg tracking-tight text-foreground flex items-center gap-2">
                <Settings size={18} className="text-indigo-500" />
                <span>Workspace Settings</span>
              </h3>
              <button onClick={() => setIsSettingsModalOpen(false)} className="p-1.5 text-muted-foreground hover:text-foreground transition-all rounded-lg cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto flex flex-col gap-6 pr-1">
              
              {/* Profile card editing */}
              <form onSubmit={handleSettingsSubmit} className="flex flex-col gap-3 p-4 rounded-xl border border-border bg-background/20 relative">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-1">User Profile Card</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group flex flex-col gap-1.5">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Display Name</label>
                    <input 
                      type="text" 
                      required 
                      value={settingsName}
                      onChange={(e) => setSettingsName(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-border/80 bg-background/50 focus:outline-none text-foreground"
                    />
                  </div>
                  <div className="form-group flex flex-col gap-1.5">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Email Address</label>
                    <input 
                      type="email" 
                      disabled
                      value={user?.email || ''}
                      className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-border/80 bg-muted/20 text-muted-foreground cursor-not-allowed"
                    />
                  </div>
                </div>
                <button type="submit" className="self-end px-4 py-2 bg-secondary text-foreground text-xs font-bold rounded-xl hover:brightness-105 active:translate-y-0.5 transition-all cursor-pointer">
                  Update Profile
                </button>
              </form>

              {/* Recurring subscription template billing additions */}
              <div className="flex flex-col gap-4 p-4 rounded-xl border border-border bg-background/20">
                <div>
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Recurring Subscriptions</h4>
                  <p className="text-[10px] text-muted-foreground font-semibold leading-relaxed">Schedule monthly recurring templates to auto-insert transactions on their next due date.</p>
                </div>

                <form onSubmit={handleRecSubmit} className="grid grid-cols-1 md:grid-cols-6 gap-3 border-b border-border/50 pb-4">
                  <div className="form-group flex flex-col gap-1 md:col-span-2">
                    <label className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">Subscription Title</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Netflix, Gym..."
                      value={recTitle}
                      onChange={(e) => setRecTitle(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs font-medium rounded-lg border border-border bg-background/50 text-foreground focus:outline-none"
                    />
                  </div>
                  
                  <div className="form-group flex flex-col gap-1">
                    <label className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">Cost (₹)</label>
                    <input 
                      type="number" 
                      required
                      min="0.01"
                      placeholder="e.g. 199"
                      value={recAmount}
                      onChange={(e) => setRecAmount(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs font-medium rounded-lg border border-border bg-background/50 text-foreground focus:outline-none"
                    />
                  </div>

                  <div className="form-group flex flex-col gap-1">
                    <label className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">Category</label>
                    <select 
                      value={recCategory}
                      onChange={(e) => setRecCategory(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs font-medium rounded-lg border border-border bg-background/50 text-foreground focus:outline-none cursor-pointer"
                    >
                      {Object.keys(categoriesInfo).map(cat => (
                        <option key={cat} value={cat}>{categoriesInfo[cat]?.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group flex flex-col gap-1">
                    <label className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">Account</label>
                    <select 
                      value={recAccountId}
                      onChange={(e) => setRecAccountId(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs font-medium rounded-lg border border-border bg-background/50 text-foreground focus:outline-none cursor-pointer"
                    >
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group flex flex-col gap-1">
                    <label className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">Next Due</label>
                    <input 
                      type="date" 
                      required
                      value={recNextDate}
                      onChange={(e) => setRecNextDate(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs font-medium rounded-lg border border-border bg-background/50 text-foreground focus:outline-none"
                    />
                  </div>

                  <button type="submit" className="md:col-span-6 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs py-2 rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer">
                    <Plus size={14} />
                    <span>Create Recurring Charge</span>
                  </button>
                </form>

                <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Scheduled Subscriptions ({recurringExpenses.length})</span>
                  {recurringExpenses.length === 0 ? (
                    <div className="text-center py-4 text-[10px] font-semibold text-muted-foreground">No recurring subscription templates mapped yet.</div>
                  ) : (
                    recurringExpenses.map(item => (
                      <div key={item.id} className="flex justify-between items-center p-2.5 rounded-lg border border-border bg-card text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider badge-${item.category}`}>{item.category}</span>
                          <span className="font-semibold text-foreground">{item.title}</span>
                          <span className="text-[10px] text-muted-foreground">({formatVal(item.amount)} / {item.interval})</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[9px] text-muted-foreground font-semibold">Next: {new Date(item.nextDueDate).toLocaleDateString()}</span>
                          <button onClick={() => handleRecDelete(item.id)} className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 p-1.5 rounded cursor-pointer" title="Delete Template">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </div>

            </div>
          </div>
        </>
      )}

    </div>
  );
}


import { useMemo } from "react";
import { format, subMonths } from "date-fns";

/**
 * CRITICAL: Centralized Financial Calculations
 * 
 * This module provides a single source of truth for ALL financial calculations
 * across the entire application. All dashboards, reports, and KPIs MUST use
 * these functions to ensure consistency and real-time synchronization.
 * 
 * Calculations are based on POSTED journal entries only, using correct
 * debit/credit accounting rules.
 */

/**
 * Calculate account balances from journal entries
 * This is the CORE calculation used throughout the app
 */
export function calculateAccountBalances(accounts, journalEntries) {
  const accountBalances = {};
  
  // Initialize all accounts with 0 balance
  accounts.forEach(acc => {
    accountBalances[acc.id] = {
      ...acc,
      calculatedBalance: 0
    };
  });

  // Calculate balance from journal entries - RESPECTING DEBIT/CREDIT RULES
  journalEntries.forEach(entry => {
    if (entry.status === 'posted' && entry.line_items) {
      entry.line_items.forEach(line => {
        if (accountBalances[line.account_id]) {
          const account = accountBalances[line.account_id];
          const debit = parseFloat(line.debit) || 0;
          const credit = parseFloat(line.credit) || 0;
          
          // CRITICAL: Apply correct debit/credit rules based on account type
          // Assets & Expenses have natural debit balance
          // Liabilities, Equity, and Revenue have natural credit balance
          const isDebitAccount = ['asset', 'expense', 'cost_of_goods_sold'].includes(account.account_type);
          
          if (isDebitAccount) {
            account.calculatedBalance += debit - credit;
          } else {
            account.calculatedBalance += credit - debit;
          }
        }
      });
    }
  });

  return accountBalances;
}

/**
 * Revenue and expenses (including COGS) per calendar month, from posted journal
 * entries, oldest month first. Months with no activity come back as zero.
 */
export function getMonthlyRevenueAndExpenses(accounts, journalEntries, monthCount = 6, today = new Date()) {
  const months = Array.from({ length: monthCount }, (_, i) => {
    const date = subMonths(today, monthCount - 1 - i);
    return { key: format(date, 'yyyy-MM'), month: format(date, 'MMM yy'), Revenue: 0, Expenses: 0 };
  });
  const byKey = new Map(months.map(m => [m.key, m]));
  const accountTypes = new Map(accounts.map(a => [a.id, a.account_type]));

  journalEntries.forEach(entry => {
    const bucket = byKey.get((entry.entry_date || '').slice(0, 7));
    if (entry.status !== 'posted' || !bucket) return;
    (entry.line_items || []).forEach(line => {
      const type = accountTypes.get(line.account_id);
      const debit = parseFloat(line.debit) || 0;
      const credit = parseFloat(line.credit) || 0;
      if (type === 'revenue') bucket.Revenue += credit - debit;
      if (type === 'expense' || type === 'cost_of_goods_sold') bucket.Expenses += debit - credit;
    });
  });

  return months.map(m => ({ ...m, Revenue: Math.round(m.Revenue * 100) / 100, Expenses: Math.round(m.Expenses * 100) / 100 }));
}

/**
 * Hook: Use Financial Metrics
 * Provides all financial calculations in one place
 */
export function useFinancialMetrics(accounts = [], journalEntries = []) {
  return useMemo(() => {
    // Calculate balances from journal entries
    const accountBalances = calculateAccountBalances(accounts, journalEntries);
    const accountsArray = Object.values(accountBalances);

    // ASSETS
    const assetAccounts = accountsArray.filter(acc => acc.account_type === 'asset');
    const totalAssets = assetAccounts.reduce((sum, acc) => sum + acc.calculatedBalance, 0);

    // LIABILITIES
    const liabilityAccounts = accountsArray.filter(acc => acc.account_type === 'liability');
    const totalLiabilities = liabilityAccounts.reduce((sum, acc) => sum + acc.calculatedBalance, 0);

    // EQUITY
    const equityAccounts = accountsArray.filter(acc => acc.account_type === 'equity');
    const equityBeforeNetIncome = equityAccounts.reduce((sum, acc) => sum + acc.calculatedBalance, 0);

    // REVENUE
    const revenueAccounts = accountsArray.filter(acc => acc.account_type === 'revenue');
    const totalRevenue = revenueAccounts.reduce((sum, acc) => sum + acc.calculatedBalance, 0);

    // EXPENSES (including COGS)
    const expenseAccounts = accountsArray.filter(acc => 
      acc.account_type === 'expense' || acc.account_type === 'cost_of_goods_sold'
    );
    const totalExpenses = expenseAccounts.reduce((sum, acc) => sum + acc.calculatedBalance, 0);

    // NET INCOME
    const netIncome = totalRevenue - totalExpenses;

    // TOTAL EQUITY (including current period net income)
    const totalEquity = equityBeforeNetIncome + netIncome;

    // CRITICAL FIX: ACCOUNTS RECEIVABLE - Must have "receivable" in name
    const arAccounts = assetAccounts.filter(acc => 
      acc.account_name?.toLowerCase().includes('receivable')
    );
    const totalAccountsReceivable = arAccounts.reduce((sum, acc) => sum + acc.calculatedBalance, 0);

    // ACCOUNTS PAYABLE (A/P accounts are liability accounts)
    const apAccounts = liabilityAccounts.filter(acc => 
      acc.account_name?.toLowerCase().includes('payable') && 
      !acc.account_name?.toLowerCase().includes('tax')
    );
    const totalAccountsPayable = apAccounts.reduce((sum, acc) => sum + acc.calculatedBalance, 0);

    // CASH & BANK (Cash accounts are asset accounts)
    const cashAccounts = assetAccounts.filter(acc => 
      acc.account_name?.toLowerCase().includes('cash') || 
      acc.account_name?.toLowerCase().includes('bank') ||
      acc.account_code?.startsWith('1000')
    );
    const totalCash = cashAccounts.reduce((sum, acc) => sum + acc.calculatedBalance, 0);

    // INVENTORY (Inventory accounts are asset accounts)
    const inventoryAccounts = assetAccounts.filter(acc => 
      acc.account_name?.toLowerCase().includes('inventory') ||
      acc.account_code?.startsWith('1300')
    );
    const totalInventory = inventoryAccounts.reduce((sum, acc) => sum + acc.calculatedBalance, 0);

    // COST OF GOODS SOLD
    const cogsAccounts = accountsArray.filter(acc => acc.account_type === 'cost_of_goods_sold');
    const totalCOGS = cogsAccounts.reduce((sum, acc) => sum + acc.calculatedBalance, 0);

    // GROSS PROFIT
    const grossProfit = totalRevenue - totalCOGS;

    // OPERATING EXPENSES (expenses excluding COGS)
    const operatingExpenseAccounts = accountsArray.filter(acc => acc.account_type === 'expense');
    const totalOperatingExpenses = operatingExpenseAccounts.reduce((sum, acc) => sum + acc.calculatedBalance, 0);

    // Return all metrics
    return {
      // Account arrays (for drill-down)
      assetAccounts,
      liabilityAccounts,
      equityAccounts,
      revenueAccounts,
      expenseAccounts,
      cogsAccounts,
      operatingExpenseAccounts,
      arAccounts,
      apAccounts,
      cashAccounts,
      inventoryAccounts,
      
      // Totals
      totalAssets,
      totalLiabilities,
      totalEquity,
      totalRevenue,
      totalExpenses,
      netIncome,
      totalAccountsReceivable,
      totalAccountsPayable,
      totalCash,
      totalInventory,
      totalCOGS,
      grossProfit,
      totalOperatingExpenses,
      
      // All account balances (for detailed views)
      accountBalances,
      
      // Profit margins
      grossProfitMargin: totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0,
      netProfitMargin: totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0,
      
      // Balance sheet check (should always be zero)
      balanceSheetCheck: totalAssets - (totalLiabilities + totalEquity)
    };
  }, [accounts, journalEntries]);
}

/**
 * Currency symbol helper
 */
export function getCurrencySymbol(currencyCode) {
  const symbols = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'NGN': '₦',
    'ZAR': 'R',
    'KES': 'KSh',
    'GHS': '₵',
    'CAD': 'C$',
    'AUD': 'A$',
    'INR': '₹',
    'JPY': '¥',
    'CNY': '¥'
  };
  return symbols[currencyCode] || currencyCode;
}

/**
 * Format currency
 */
export function formatCurrency(amount, currencyCode = 'USD') {
  const symbol = getCurrencySymbol(currencyCode);
  const value = Number(amount) || 0;
  return `${value < 0 ? '-' : ''}${symbol}${Math.abs(value).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
}

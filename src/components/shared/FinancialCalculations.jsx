
import { useMemo } from "react";

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
  return `${symbol}${Math.abs(amount).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
}

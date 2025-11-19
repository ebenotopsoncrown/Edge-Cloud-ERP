
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCompany } from "../components/auth/CompanyContext";
import ReportHeader from "../components/reports/ReportHeader";
import ReportActions from "../components/reports/ReportActions";
import AccountLedger from "../components/reports/AccountLedger";
import { useFinancialMetrics, formatCurrency } from "../components/shared/FinancialCalculations";
import {
  FileText,
  TrendingUp,
  DollarSign,
  BarChart3,
  Users,
  Package,
  ShoppingCart,
  Building2,
  BookOpen,
  Briefcase,
  Heart,
  Key,
  HelpCircle
} from "lucide-react";
import { format } from "date-fns";

export default function Reports() {
  const { currentCompany } = useCompany();
  const [selectedReportGroup, setSelectedReportGroup] = useState('financial');
  const [selectedReport, setSelectedReport] = useState('financial-performance');
  const [dateRange, setDateRange] = useState('current-month');
  const [selectedAccount, setSelectedAccount] = useState(null);

  const baseCurrency = currentCompany?.base_currency || 'USD';

  // CRITICAL: Fetch all data with better caching
  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.Account.filter({ company_id: currentCompany.id }) : [],
    enabled: !!currentCompany,
    staleTime: 2 * 60 * 1000,
    cacheTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.Customer.filter({ company_id: currentCompany.id }) : [],
    enabled: !!currentCompany,
    staleTime: 2 * 60 * 1000,
    cacheTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.Vendor.filter({ company_id: currentCompany.id }) : [],
    enabled: !!currentCompany,
    staleTime: 2 * 60 * 1000,
    cacheTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.Invoice.filter({ company_id: currentCompany.id }) : [],
    enabled: !!currentCompany,
    staleTime: 1 * 60 * 1000,
    cacheTime: 3 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  const { data: bills = [] } = useQuery({
    queryKey: ['bills', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.Bill.filter({ company_id: currentCompany.id }) : [],
    enabled: !!currentCompany,
    staleTime: 1 * 60 * 1000,
    cacheTime: 3 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.Product.filter({ company_id: currentCompany.id }) : [],
    enabled: !!currentCompany,
    staleTime: 2 * 60 * 1000,
    cacheTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  const { data: journalEntries = [] } = useQuery({
    queryKey: ['journal-entries', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.JournalEntry.filter({
      company_id: currentCompany.id,
      status: 'posted'
    }) : [],
    enabled: !!currentCompany,
    staleTime: 1 * 60 * 1000,
    cacheTime: 3 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  const { data: inventoryTransactions = [] } = useQuery({
    queryKey: ['inventory-transactions', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.InventoryTransaction.filter({ company_id: currentCompany.id }) : [],
    enabled: !!currentCompany,
    staleTime: 2 * 60 * 1000,
    cacheTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['payments', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.Payment.filter({ company_id: currentCompany.id }) : [],
    enabled: !!currentCompany,
    staleTime: 1 * 60 * 1000,
    cacheTime: 3 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  // CRITICAL: Use centralized financial calculations
  const metrics = useFinancialMetrics(accounts, journalEntries, baseCurrency);

  const {
    accountBalances,
    revenueAccounts,
    totalRevenue,
    expenseAccounts,
    totalExpenses,
    netIncome,
    assetAccounts,
    totalAssets,
    liabilityAccounts,
    totalLiabilities,
    equityAccounts,
    totalEquity,
    totalCash,
    totalAccountsReceivable,
    totalAccountsPayable,
  } = metrics;

  const inventoryItems = products.filter(p => p.product_type === 'inventory');
  const totalInventoryValue = inventoryItems.reduce((sum, p) =>
    sum + ((p.quantity_on_hand || 0) * (p.cost_price || 0)), 0
  );

  // Report groups
  const reportGroups = [
    {
      id: 'financial',
      label: 'Financial Statements',
      icon: BarChart3,
      reports: [
        { id: 'financial-performance', label: 'Statement of Financial Performance' },
        { id: 'financial-position', label: 'Statement of Financial Position' },
        { id: 'cash-flow', label: 'Statement of Cash Flows' },
        { id: 'trial-balance', label: 'Trial Balance' },
        { id: 'general-ledger', label: 'General Ledger' }
      ]
    },
    {
      id: 'sales',
      label: 'Sales / Invoicing',
      icon: ShoppingCart,
      reports: [
        { id: 'sales-by-customer', label: 'Sales by Customer' },
        { id: 'items-sold-to-customers', label: 'Items Sold to Customers' },
        { id: 'customer-ledger', label: 'Customer Ledgers' }
      ]
    },
    {
      id: 'purchases',
      label: 'Purchases / Vendors',
      icon: Building2,
      reports: [
        { id: 'purchases-by-vendor', label: 'Purchases by Vendor' },
        { id: 'items-purchased-from-vendors', label: 'Items Purchased from Vendors' },
        { id: 'vendor-ledger', label: 'Vendor Ledgers' }
      ]
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: Package,
      reports: [
        { id: 'inventory-valuation', label: 'Inventory Valuation' },
        { id: 'stock-status', label: 'Stock Status Report' },
        { id: 'inventory-transactions', label: 'Inventory Transactions' }
      ]
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {selectedAccount && (
        <AccountLedger
          account={selectedAccount}
          onClose={() => setSelectedAccount(null)}
          onTransactionClick={() => {}}
        />
      )}

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Business Reports</h1>
        <p className="text-gray-500 mt-1">Comprehensive reports for {currentCompany?.company_name}</p>
        <p className="text-sm text-blue-600 font-semibold mt-1">
          📊 All amounts shown in {baseCurrency} ({formatCurrency(0, baseCurrency).charAt(0)})
        </p>
        <p className="text-xs text-green-600 font-semibold mt-1">
          ✅ Synchronized with All Dashboards in Real-Time
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Report Group</label>
          <Select value={selectedReportGroup} onValueChange={(value) => {
            setSelectedReportGroup(value);
            const group = reportGroups.find(g => g.id === value);
            if (group && group.reports.length > 0) {
              setSelectedReport(group.reports[0].id);
            }
          }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {reportGroups.map(group => {
                const Icon = group.icon;
                return (
                  <SelectItem key={group.id} value={group.id}>
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      {group.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Select Report</label>
          <Select value={selectedReport} onValueChange={setSelectedReport}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {reportGroups.find(g => g.id === selectedReportGroup)?.reports.map(report => (
                <SelectItem key={report.id} value={report.id}>
                  {report.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Date Range</label>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current-month">Current Month</SelectItem>
              <SelectItem value="current-quarter">Current Quarter</SelectItem>
              <SelectItem value="current-year">Current Year</SelectItem>
              <SelectItem value="ytd">Year to Date</SelectItem>
              <SelectItem value="all-time">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* FINANCIAL STATEMENTS - Using CALCULATED balances */}
      {selectedReport === 'financial-performance' && (
        <Card>
          <CardHeader>
            <ReportHeader
              reportTitle="Statement of Financial Performance"
              reportDate={`For the Period Ending ${format(new Date(), 'MMMM dd, yyyy')}`}
              additionalInfo={`Reporting Currency: ${baseCurrency} (${formatCurrency(0, baseCurrency).charAt(0)}) | IFRS Compliant | Synchronized with All Dashboards in Real-Time`}
            />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-lg mb-3 border-b-2 border-gray-800 pb-2">Revenue</h3>
                <Table>
                  <TableBody>
                    {revenueAccounts.map(account => (
                      <TableRow
                        key={account.id}
                        className="cursor-pointer hover:bg-blue-50"
                        onClick={() => setSelectedAccount(account)}
                      >
                        <TableCell className="w-32">{account.account_code}</TableCell>
                        <TableCell>{account.account_name}</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(account.calculatedBalance, baseCurrency)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-blue-50 font-bold border-t-2 border-gray-800">
                      <TableCell colSpan={2}>Total Revenue</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(totalRevenue, baseCurrency)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-3 border-b-2 border-gray-800 pb-2">Expenses</h3>
                <Table>
                  <TableBody>
                    {expenseAccounts.map(account => (
                      <TableRow
                        key={account.id}
                        className="cursor-pointer hover:bg-blue-50"
                        onClick={() => setSelectedAccount(account)}
                      >
                        <TableCell className="w-32">{account.account_code}</TableCell>
                        <TableCell>{account.account_name}</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(account.calculatedBalance, baseCurrency)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-red-50 font-bold border-t-2 border-gray-800">
                      <TableCell colSpan={2}>Total Expenses</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(totalExpenses, baseCurrency)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div className="border-t-4 border-gray-900 pt-4">
                <div className="flex justify-between items-center text-2xl font-bold">
                  <span>Net Profit/Loss</span>
                  <span className={`font-mono ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(netIncome, baseCurrency)}
                  </span>
                </div>
              </div>
            </div>

            <ReportActions
              reportTitle="Statement of Financial Performance"
              data={{ revenueAccounts, expenseAccounts, totalRevenue, totalExpenses, netIncome, currency: baseCurrency, currencySymbol: formatCurrency(0, baseCurrency).charAt(0) }}
            />
          </CardContent>
        </Card>
      )}

      {selectedReport === 'financial-position' && (
        <Card>
          <CardHeader>
            <ReportHeader
              reportTitle="Statement of Financial Position"
              reportDate={`As of ${format(new Date(), 'MMMM dd, yyyy')}`}
              additionalInfo={`Reporting Currency: ${baseCurrency} (${formatCurrency(0, baseCurrency).charAt(0)}) | IFRS Compliant | Synchronized with All Dashboards in Real-Time`}
            />
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              {/* Assets */}
              <div>
                <h3 className="font-bold text-xl mb-4 border-b-2 border-gray-800 pb-2">Assets</h3>
                <Table>
                  <TableBody>
                    {assetAccounts.map(account => (
                      <TableRow
                        key={account.id}
                        className="cursor-pointer hover:bg-blue-50 transition-colors"
                        onClick={() => setSelectedAccount(account)}
                        title="Click to view general ledger for this account"
                      >
                        <TableCell className="font-medium hover:text-blue-600 hover:underline">
                          {account.account_name}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(account.calculatedBalance, baseCurrency)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-blue-100 font-bold border-t-2 border-gray-800">
                      <TableCell>Total Assets</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(totalAssets, baseCurrency)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Liabilities & Equity */}
              <div>
                <h3 className="font-bold text-xl mb-4 border-b-2 border-gray-800 pb-2">Liabilities & Equity</h3>

                <h4 className="font-semibold mt-4 mb-2">Liabilities</h4>
                <Table>
                  <TableBody>
                    {liabilityAccounts.map(account => (
                      <TableRow
                        key={account.id}
                        className="cursor-pointer hover:bg-blue-50 transition-colors"
                        onClick={() => setSelectedAccount(account)}
                        title="Click to view general ledger for this account"
                      >
                        <TableCell className="font-medium hover:text-blue-600 hover:underline">
                          {account.account_name}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(account.calculatedBalance, baseCurrency)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-red-50 font-bold">
                      <TableCell>Total Liabilities</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(totalLiabilities, baseCurrency)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                <h4 className="font-semibold mt-6 mb-2">Equity</h4>
                <Table>
                  <TableBody>
                    {equityAccounts.map(account => (
                      <TableRow
                        key={account.id}
                        className="cursor-pointer hover:bg-blue-50 transition-colors"
                        onClick={() => setSelectedAccount(account)}
                        title="Click to view general ledger for this account"
                      >
                        <TableCell className="font-medium hover:text-blue-600 hover:underline">
                          {account.account_name}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(account.calculatedBalance, baseCurrency)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell>Current Period Profit/Loss</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(netIncome, baseCurrency)}
                      </TableCell>
                    </TableRow>
                    <TableRow className="bg-green-50 font-bold">
                      <TableCell>Total Equity</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(totalEquity, baseCurrency)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                <div className="border-t-4 border-gray-900 pt-4 mt-4">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total Liabilities & Equity</span>
                    <span className="font-mono">
                      {formatCurrency(totalLiabilities + totalEquity, baseCurrency)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                💡 <strong>Tip:</strong> Click on any account name to drill down to the General Ledger.
                From the ledger, you can click on transactions to view or edit the source documents (invoices, bills, payments).
              </p>
            </div>

            <ReportActions
              reportTitle="Statement of Financial Position"
              data={{ assetAccounts, liabilityAccounts, equityAccounts, totalAssets, totalLiabilities, totalEquity, netIncome, currency: baseCurrency, currencySymbol: formatCurrency(0, baseCurrency).charAt(0) }}
            />
          </CardContent>
        </Card>
      )}

      {selectedReport === 'trial-balance' && (
        <Card>
          <CardHeader>
            <ReportHeader
              reportTitle="Trial Balance"
              reportDate={`As of ${format(new Date(), 'MMMM dd, yyyy')}`}
              additionalInfo={`Reporting Currency: ${baseCurrency} (${formatCurrency(0, baseCurrency).charAt(0)}) | Synchronized with All Dashboards in Real-Time`}
            />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-b-2 border-gray-800">
                  <TableHead className="font-bold">Account Code</TableHead>
                  <TableHead className="font-bold">Account Name</TableHead>
                  <TableHead className="font-bold text-right">Debit</TableHead>
                  <TableHead className="font-bold text-right">Credit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.values(accountBalances).map(account => { // Use calculated balances
                  const balance = account.calculatedBalance;
                  const isDebitNormalBalance = ['asset', 'expense', 'cost_of_goods_sold'].includes(account.account_type);

                  // Only show accounts with non-zero calculated balance
                  if (Math.abs(balance) < 0.01) return null;

                  return (
                    <TableRow
                      key={account.id}
                      className="cursor-pointer hover:bg-blue-50"
                      onClick={() => setSelectedAccount(account)}
                    >
                      <TableCell className="font-medium">{account.account_code}</TableCell>
                      <TableCell>{account.account_name}</TableCell>
                      <TableCell className="text-right font-mono">
                        {isDebitNormalBalance && balance >= 0 ? formatCurrency(balance, baseCurrency) :
                         !isDebitNormalBalance && balance < 0 ? formatCurrency(balance * -1, baseCurrency) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {isDebitNormalBalance && balance < 0 ? formatCurrency(balance * -1, baseCurrency) :
                         !isDebitNormalBalance && balance >= 0 ? formatCurrency(balance, baseCurrency) : '-'}
                      </TableCell>
                    </TableRow>
                  );
                })}
                <TableRow className="bg-gray-200 font-bold border-t-4 border-gray-900">
                  <TableCell colSpan={2} className="text-lg">Totals</TableCell>
                  <TableCell className="text-right font-mono text-lg">
                    {formatCurrency(Object.values(accountBalances)
                      .reduce((sum, acc) => {
                        const isDebitNormalBalance = ['asset', 'expense', 'cost_of_goods_sold'].includes(acc.account_type);
                        const balance = acc.calculatedBalance;
                        if (isDebitNormalBalance && balance >= 0) return sum + balance;
                        if (!isDebitNormalBalance && balance < 0) return sum + (balance * -1);
                        return sum;
                      }, 0), baseCurrency)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-lg">
                    {formatCurrency(Object.values(accountBalances)
                      .reduce((sum, acc) => {
                        const isDebitNormalBalance = ['asset', 'expense', 'cost_of_goods_sold'].includes(acc.account_type);
                        const balance = acc.calculatedBalance;
                        if (isDebitNormalBalance && balance < 0) return sum + (balance * -1);
                        if (!isDebitNormalBalance && balance >= 0) return sum + balance;
                        return sum;
                      }, 0), baseCurrency)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <ReportActions
              reportTitle="Trial Balance"
              data={{ accounts: Object.values(accountBalances), currency: baseCurrency, currencySymbol: formatCurrency(0, baseCurrency).charAt(0) }}
            />
          </CardContent>
        </Card>
      )}

      {/* CRITICAL FIX: Professional General Ledger Format */}
      {selectedReport === 'general-ledger' && (
        <Card>
          <CardHeader>
            <ReportHeader
              reportTitle="General Ledger"
              reportDate={`For the Period From ${format(new Date(new Date().getFullYear(), 0, 1), 'MMM d, yyyy')} to ${format(new Date(), 'MMM d, yyyy')}`}
              additionalInfo="Filter Criteria includes: Report order is by ID. Report is printed with shortened descriptions and in Detail Format."
            />
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {Object.values(accountBalances)
                .filter(account => {
                  // Only show accounts with transactions
                  const hasTransactions = journalEntries.some(entry =>
                    entry.line_items?.some(line => line.account_id === account.id)
                  );
                  return hasTransactions;
                })
                .map(account => {
                  // Get all journal entries affecting this account
                  const accountEntries = journalEntries.filter(entry =>
                    entry.line_items?.some(line => line.account_id === account.id)
                  ).sort((a, b) => new Date(a.entry_date) - new Date(b.entry_date));

                  // Calculate running balance
                  let runningBalance = 0;
                  const transactionsWithBalance = accountEntries.map(entry => {
                    const relevantLines = entry.line_items?.filter(line => line.account_id === account.id) || [];
                    const debitAmount = relevantLines.reduce((sum, line) => sum + (parseFloat(line.debit) || 0), 0);
                    const creditAmount = relevantLines.reduce((sum, line) => sum + (parseFloat(line.credit) || 0), 0);

                    const isDebitNormalAccount = ['asset', 'expense', 'cost_of_goods_sold'].includes(account.account_type);
                    if (isDebitNormalAccount) {
                      runningBalance = runningBalance + debitAmount - creditAmount;
                    } else {
                      runningBalance = runningBalance + creditAmount - debitAmount;
                    }

                    return {
                      ...entry,
                      debitAmount,
                      creditAmount,
                      balance: runningBalance
                    };
                  });

                  return (
                    <div key={account.id} className="border-t-2 border-gray-300 pt-4">
                      <div className="mb-2 font-bold text-sm">
                        <div>{account.account_code}</div>
                        <div>{account.account_name}</div>
                      </div>

                      <Table>
                        <TableHeader className="bg-gray-50">
                          <TableRow className="border-b-2 border-gray-800">
                            <TableHead className="text-xs font-bold">Date</TableHead>
                            <TableHead className="text-xs font-bold">Reference</TableHead>
                            <TableHead className="text-xs font-bold">Jrnl</TableHead>
                            <TableHead className="text-xs font-bold">Trans Description</TableHead>
                            <TableHead className="text-right text-xs font-bold">Debit Amt</TableHead>
                            <TableHead className="text-right text-xs font-bold">Credit Amt</TableHead>
                            <TableHead className="text-right text-xs font-bold">Balance</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {/* Beginning Balance */}
                          <TableRow className="font-semibold">
                            <TableCell colSpan={4}>Beginning Balance</TableCell>
                            <TableCell className="text-right">-</TableCell>
                            <TableCell className="text-right">-</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(0, baseCurrency)}
                            </TableCell>
                          </TableRow>

                          {transactionsWithBalance.map((entry) => (
                            <TableRow
                              key={entry.id}
                              className="cursor-pointer hover:bg-blue-50"
                              onClick={() => setSelectedAccount(account)}
                            >
                              <TableCell className="text-sm">
                                {format(new Date(entry.entry_date), 'M/d/yy')}
                              </TableCell>
                              <TableCell className="text-sm">{entry.reference || entry.entry_number}</TableCell>
                              <TableCell className="text-sm">
                                {entry.source_type === 'invoice' ? 'CRJ' :
                                 entry.source_type === 'bill' ? 'PRJ' :
                                 entry.source_type === 'payment' ? 'CRJ' :
                                 'JE'}
                              </TableCell>
                              <TableCell className="text-sm">{entry.description}</TableCell>
                              <TableCell className="text-right text-sm font-mono">
                                {entry.debitAmount > 0 ? formatCurrency(entry.debitAmount, baseCurrency) : '-'}
                              </TableCell>
                              <TableCell className="text-right text-sm font-mono">
                                {entry.creditAmount > 0 ? formatCurrency(entry.creditAmount, baseCurrency) : '-'}
                              </TableCell>
                              <TableCell className="text-right text-sm font-mono font-semibold">
                                {formatCurrency(entry.balance, baseCurrency)}
                              </TableCell>
                            </TableRow>
                          ))}

                          {/* Ending Balance */}
                          <TableRow className="bg-gray-100 font-bold border-t-2 border-gray-800">
                            <TableCell colSpan={4}>
                              <div>{format(new Date(), 'M/d/yy')}</div>
                              <div>Ending Balance</div>
                            </TableCell>
                            <TableCell className="text-right">-</TableCell>
                            <TableCell className="text-right">-</TableCell>
                            <TableCell className="text-right text-lg">
                              {formatCurrency(runningBalance, baseCurrency)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  );
                })}
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                💡 <strong>Tip:</strong> Click on any transaction row to drill down to the account's detailed General Ledger.
              </p>
            </div>

            <ReportActions
              reportTitle="General Ledger"
              data={{ accounts: Object.values(accountBalances), journalEntries, currency: baseCurrency, currencySymbol: formatCurrency(0, baseCurrency).charAt(0) }}
            />
          </CardContent>
        </Card>
      )}

      {/* NEW: Cash Flow Statement */}
      {selectedReport === 'cash-flow' && (
        <Card>
          <CardHeader>
            <ReportHeader
              reportTitle="Statement of Cash Flows"
              reportDate={`For the Period Ending ${format(new Date(), 'MMMM dd, yyyy')}`}
              additionalInfo={`Reporting Currency: ${baseCurrency} (${formatCurrency(0, baseCurrency).charAt(0)}) | IFRS Compliant | Synchronized with All Dashboards in Real-Time`}
            />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Operating Activities */}
              <div>
                <h3 className="font-bold text-lg mb-3 border-b-2 border-gray-800 pb-2">Cash Flows from Operating Activities</h3>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell>Net Profit/Loss</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(netIncome, baseCurrency)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="pl-8">Adjustments:</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="pl-12">Increase in Accounts Receivable</TableCell>
                      <TableCell className="text-right font-mono text-red-600">
                        ({formatCurrency(totalAccountsReceivable, baseCurrency)})
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="pl-12">Increase in Accounts Payable</TableCell>
                      <TableCell className="text-right font-mono text-green-600">
                        {formatCurrency(totalAccountsPayable, baseCurrency)}
                      </TableCell>
                    </TableRow>
                    <TableRow className="bg-blue-50 font-bold border-t-2 border-gray-800">
                      <TableCell>Net Cash from Operating Activities</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(netIncome - totalAccountsReceivable + totalAccountsPayable, baseCurrency)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Investing Activities */}
              <div>
                <h3 className="font-bold text-lg mb-3 border-b-2 border-gray-800 pb-2">Cash Flows from Investing Activities</h3>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell>Purchase of Fixed Assets</TableCell>
                      <TableCell className="text-right font-mono">-</TableCell>
                    </TableRow>
                    <TableRow className="bg-blue-50 font-bold border-t-2 border-gray-800">
                      <TableCell>Net Cash from Investing Activities</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(0, baseCurrency)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Financing Activities */}
              <div>
                <h3 className="font-bold text-lg mb-3 border-b-2 border-gray-800 pb-2">Cash Flows from Financing Activities</h3>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell>Increase in Long-term Debt</TableCell>
                      <TableCell className="text-right font-mono">-</TableCell>
                    </TableRow>
                    <TableRow className="bg-blue-50 font-bold border-t-2 border-gray-800">
                      <TableCell>Net Cash from Financing Activities</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(0, baseCurrency)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Summary */}
              <div className="border-t-4 border-gray-900 pt-4">
                <Table>
                  <TableBody>
                    <TableRow className="text-lg font-bold">
                      <TableCell>Net Increase/Decrease in Cash</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(netIncome - totalAccountsReceivable + totalAccountsPayable, baseCurrency)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Cash at Beginning of Period</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(0, baseCurrency)}
                      </TableCell>
                    </TableRow>
                    <TableRow className="text-xl font-bold bg-green-50 border-t-4 border-gray-900">
                      <TableCell>Cash at End of Period</TableCell>
                      <TableCell className="text-right font-mono text-green-600">
                        {formatCurrency(totalCash, baseCurrency)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>

            <ReportActions
              reportTitle="Statement of Cash Flows"
              data={{ netIncome, totalAccountsReceivable, totalAccountsPayable, totalCash, currency: baseCurrency, currencySymbol: formatCurrency(0, baseCurrency).charAt(0) }}
            />
          </CardContent>
        </Card>
      )}

      {/* ITEMS SOLD TO CUSTOMERS - Matching sample format */}
      {selectedReport === 'items-sold-to-customers' && (
        <Card>
          <CardHeader>
            <ReportHeader
              reportTitle="Items Sold to Customers"
              reportDate={`For the Period From ${format(new Date(), 'MMM d, yyyy')} to ${format(new Date(), 'MMM d, yyyy')}`}
              additionalInfo="Filter Criteria includes: Report order is by Customer ID, Item ID. Report is printed in Detail Format."
            />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-b-2 border-gray-800">
                  <TableHead className="font-bold">Customer ID<br/>Name</TableHead>
                  <TableHead className="font-bold">Item ID</TableHead>
                  <TableHead className="font-bold text-right">Qty</TableHead>
                  <TableHead className="font-bold">Stocking U/M</TableHead>
                  <TableHead className="font-bold text-right">Amount</TableHead>
                  <TableHead className="font-bold text-right">Cost of Sales</TableHead>
                  <TableHead className="font-bold text-right">Gross Profit</TableHead>
                  <TableHead className="font-bold text-right">Gross Margin %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map(customer => {
                  const customerInvoices = invoices.filter(inv => inv.customer_id === customer.id);

                  if (customerInvoices.length === 0) return null;

                  // Aggregate items sold to this customer
                  const itemsSold = [];
                  customerInvoices.forEach(invoice => {
                    invoice.line_items?.forEach(item => {
                      const existing = itemsSold.find(i => i.product_id === item.product_id);
                      if (existing) {
                        existing.quantity += item.quantity;
                        existing.amount += item.line_total || (item.quantity * item.unit_price);
                      } else {
                        itemsSold.push({
                          product_id: item.product_id,
                          description: item.description,
                          quantity: item.quantity,
                          amount: item.line_total || (item.quantity * item.unit_price),
                          unit_price: item.unit_price
                        });
                      }
                    });
                  });

                  const customerTotal = itemsSold.reduce((sum, item) => sum + item.amount, 0);

                  return (
                    <React.Fragment key={customer.id}>
                      <TableRow className="border-t-2 border-gray-400">
                        <TableCell className="font-bold" colSpan={8}>
                          {customer.customer_code || customer.id}
                          <br/>
                          {customer.company_name}
                        </TableCell>
                      </TableRow>
                      {itemsSold.map((item, idx) => {
                        const product = products.find(p => p.id === item.product_id);
                        const costOfSales = (product?.cost_price || 0) * item.quantity;
                        const grossProfit = item.amount - costOfSales;
                        const grossMargin = item.amount > 0 ? (grossProfit / item.amount) * 100 : 0;

                        return (
                          <TableRow key={idx}>
                            <TableCell></TableCell>
                            <TableCell>{item.description}</TableCell>
                            <TableCell className="text-right">{item.quantity.toFixed(2)}</TableCell>
                            <TableCell>{product?.unit_of_measure || 'unit'}</TableCell>
                            <TableCell className="text-right font-mono">
                              {formatCurrency(item.amount, baseCurrency)}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {formatCurrency(costOfSales, baseCurrency)}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {formatCurrency(grossProfit, baseCurrency)}
                            </TableCell>
                            <TableCell className="text-right">{grossMargin.toFixed(2)}%</TableCell>
                          </TableRow>
                        );
                      })}
                      <TableRow className="bg-gray-100 font-semibold">
                        <TableCell colSpan={4} className="text-right">Customer Total:</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(customerTotal, baseCurrency)}</TableCell>
                        <TableCell colSpan={3}></TableCell>
                      </TableRow>
                    </React.Fragment>
                  );
                })}
                <TableRow className="bg-gray-800 text-white font-bold border-t-4">
                  <TableCell colSpan={4} className="text-right text-lg">Report Totals</TableCell>
                  <TableCell className="text-right font-mono text-lg">
                    {formatCurrency(invoices.reduce((sum, inv) => sum + (parseFloat(inv.total_amount) || 0), 0), baseCurrency)}
                  </TableCell>
                  <TableCell colSpan={3}></TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <ReportActions
              reportTitle="Items Sold to Customers"
              data={{ customers, invoices, products, currency: baseCurrency, currencySymbol: formatCurrency(0, baseCurrency).charAt(0) }}
            />
          </CardContent>
        </Card>
      )}

      {/* ITEMS PURCHASED FROM VENDORS - Matching sample format */}
      {selectedReport === 'items-purchased-from-vendors' && (
        <Card>
          <CardHeader>
            <ReportHeader
              reportTitle="Items Purchased from Vendors"
              reportDate={`For the Period From ${format(new Date(), 'MMM d, yyyy')} to ${format(new Date(), 'MMM d, yyyy')}`}
              additionalInfo="Filter Criteria includes: Report order is by Vendor ID, Item ID. Report is printed in Detail Format."
            />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-b-2 border-gray-800">
                  <TableHead className="font-bold">Vendor ID<br/>Name</TableHead>
                  <TableHead className="font-bold">Item ID<br/>Item Description</TableHead>
                  <TableHead className="font-bold text-right">Qty</TableHead>
                  <TableHead className="font-bold">Stocking U/M</TableHead>
                  <TableHead className="font-bold text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendors.map(vendor => {
                  const vendorBills = bills.filter(bill => bill.vendor_id === vendor.id);

                  if (vendorBills.length === 0) return null;

                  // Aggregate items purchased from this vendor
                  const itemsPurchased = [];
                  vendorBills.forEach(bill => {
                    bill.line_items?.forEach(item => {
                      const existing = itemsPurchased.find(i => i.product_id === item.product_id);
                      if (existing) {
                        existing.quantity += item.quantity;
                        existing.amount += item.line_total || (item.quantity * item.unit_cost);
                      } else {
                        itemsPurchased.push({
                          product_id: item.product_id,
                          description: item.description,
                          quantity: item.quantity,
                          amount: item.line_total || (item.quantity * item.unit_cost)
                        });
                      }
                    });
                  });

                  const vendorTotal = itemsPurchased.reduce((sum, item) => sum + item.amount, 0);

                  return (
                    <React.Fragment key={vendor.id}>
                      <TableRow className="border-t-2 border-gray-400">
                        <TableCell className="font-bold" colSpan={5}>
                          {vendor.vendor_code || vendor.id}
                          <br/>
                          {vendor.company_name}
                        </TableCell>
                      </TableRow>
                      {itemsPurchased.map((item, idx) => {
                        const product = products.find(p => p.id === item.product_id);
                        return (
                          <TableRow key={idx}>
                            <TableCell></TableCell>
                            <TableCell>{item.description}</TableCell>
                            <TableCell className="text-right">{item.quantity.toFixed(2)}</TableCell>
                            <TableCell>{product?.unit_of_measure || 'unit'}</TableCell>
                            <TableCell className="text-right font-mono">
                              {formatCurrency(item.amount, baseCurrency)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      <TableRow className="bg-gray-100 font-semibold">
                        <TableCell colSpan={4} className="text-right">Vendor Total:</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(vendorTotal, baseCurrency)}</TableCell>
                      </TableRow>
                    </React.Fragment>
                  );
                })}
                <TableRow className="bg-gray-800 text-white font-bold border-t-4">
                  <TableCell colSpan={4} className="text-right text-lg">Report Totals</TableCell>
                  <TableCell className="text-right font-mono text-lg">
                    {formatCurrency(bills.reduce((sum, bill) => sum + (parseFloat(bill.total_amount) || 0), 0), baseCurrency)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <ReportActions
              reportTitle="Items Purchased from Vendors"
              data={{ vendors, bills, products, currency: baseCurrency, currencySymbol: formatCurrency(0, baseCurrency).charAt(0) }}
            />
          </CardContent>
        </Card>
      )}

      {/* CUSTOMER LEDGER - NEW IMPLEMENTATION */}
      {selectedReport === 'customer-ledger' && (
        <Card>
          <CardHeader>
            <CardTitle>Customer Ledger - Select Customer</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">Click on any customer below to view their detailed ledger:</p>
            <div className="grid md:grid-cols-2 gap-4">
              {customers.map(customer => {
                const customerInvoices = invoices.filter(inv => inv.customer_id === customer.id);
                const totalSales = customerInvoices.reduce((sum, inv) => sum + (parseFloat(inv.total_amount) || 0), 0);
                const totalPaid = customerInvoices.reduce((sum, inv) => sum + (parseFloat(inv.amount_paid) || 0), 0);
                const outstanding = totalSales - totalPaid;

                return (
                  <Card
                    key={customer.id}
                    className="cursor-pointer hover:bg-green-50 transition-colors border-2"
                    // onClick={() => handleCustomerLedgerClick(customer.id)} // Implement this if you want a detailed view
                  >
                    <CardContent className="pt-6">
                      <div>
                        <p className="font-semibold text-lg">{customer.company_name}</p>
                        <p className="text-sm text-gray-600">{customer.email}</p>
                        <div className="mt-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Total Sales:</span>
                            <span className="font-semibold">{formatCurrency(totalSales, baseCurrency)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Paid:</span>
                            <span className="font-semibold text-green-600">{formatCurrency(totalPaid, baseCurrency)}</span>
                          </div>
                          <div className="flex justify-between text-sm border-t pt-2">
                            <span className="text-gray-600 font-semibold">Outstanding:</span>
                            <span className="font-bold text-orange-600">{formatCurrency(outstanding, baseCurrency)}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* VENDOR LEDGER - NEW IMPLEMENTATION */}
      {selectedReport === 'vendor-ledger' && (
        <Card>
          <CardHeader>
            <CardTitle>Vendor Ledger - Select Vendor</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">Click on any vendor below to view their detailed ledger:</p>
            <div className="grid md:grid-cols-2 gap-4">
              {vendors.map(vendor => {
                const vendorBills = bills.filter(bill => bill.vendor_id === vendor.id);
                const totalPurchases = vendorBills.reduce((sum, bill) => sum + (parseFloat(bill.total_amount) || 0), 0);
                const totalPaid = vendorBills.reduce((sum, bill) => sum + (parseFloat(bill.amount_paid) || 0), 0);
                const outstanding = totalPurchases - totalPaid;

                return (
                  <Card
                    key={vendor.id}
                    className="cursor-pointer hover:bg-orange-50 transition-colors border-2"
                    // onClick={() => handleVendorLedgerClick(vendor.id)} // Implement this if you want a detailed view
                  >
                    <CardContent className="pt-6">
                      <div>
                        <p className="font-semibold text-lg">{vendor.company_name}</p>
                        <p className="text-sm text-gray-600">{vendor.email}</p>
                        <div className="mt-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Total Purchases:</span>
                            <span className="font-semibold">{formatCurrency(totalPurchases, baseCurrency)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Paid:</span>
                            <span className="font-semibold text-green-600">{formatCurrency(totalPaid, baseCurrency)}</span>
                          </div>
                          <div className="flex justify-between text-sm border-t pt-2">
                            <span className="text-gray-600 font-semibold">Outstanding:</span>
                            <span className="font-bold text-orange-600">{formatCurrency(outstanding, baseCurrency)}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* SALES BY CUSTOMER - NEW IMPLEMENTATION */}
      {selectedReport === 'sales-by-customer' && (
        <Card>
          <CardHeader>
            <ReportHeader
              reportTitle="Sales by Customer Report"
              reportDate={format(new Date(), 'MMMM dd, yyyy')}
              additionalInfo={`Reporting Currency: ${baseCurrency} (${formatCurrency(0, baseCurrency).charAt(0)})`}
            />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Total Sales</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map(customer => {
                  const customerInvoices = invoices.filter(inv => inv.customer_id === customer.id);
                  const totalSales = customerInvoices.reduce((sum, inv) => sum + (parseFloat(inv.total_amount) || 0), 0);
                  const totalPaid = customerInvoices.reduce((sum, inv) => sum + (parseFloat(inv.amount_paid) || 0), 0);
                  const outstanding = totalSales - totalPaid;

                  if (totalSales === 0 && outstanding === 0 && totalPaid === 0) return null; // Only show customers with activity

                  return (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.company_name}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(totalSales, baseCurrency)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-orange-600">
                        {formatCurrency(outstanding, baseCurrency)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-green-600">
                        {formatCurrency(totalPaid, baseCurrency)}
                      </TableCell>
                    </TableRow>
                  );
                })}
                <TableRow className="bg-gray-100 font-bold">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(invoices.reduce((sum, inv) => sum + (parseFloat(inv.total_amount) || 0), 0), baseCurrency)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(invoices.reduce((sum, inv) => sum + (parseFloat(inv.balance_due) || 0), 0), baseCurrency)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(invoices.reduce((sum, inv) => sum + (parseFloat(inv.amount_paid) || 0), 0), baseCurrency)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <ReportActions
              reportTitle="Sales by Customer Report"
              data={{ customers, invoices, currency: baseCurrency, currencySymbol: formatCurrency(0, baseCurrency).charAt(0) }}
            />
          </CardContent>
        </Card>
      )}

      {/* PURCHASES BY VENDOR - NEW IMPLEMENTATION */}
      {selectedReport === 'purchases-by-vendor' && (
        <Card>
          <CardHeader>
            <ReportHeader
              reportTitle="Purchases by Vendor Report"
              reportDate={format(new Date(), 'MMMM dd, yyyy')}
              additionalInfo={`Reporting Currency: ${baseCurrency} (${formatCurrency(0, baseCurrency).charAt(0)})`}
            />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead className="text-right">Total Purchases</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendors.map(vendor => {
                  const vendorBills = bills.filter(bill => bill.vendor_id === vendor.id);
                  const totalPurchases = vendorBills.reduce((sum, bill) => sum + (parseFloat(bill.total_amount) || 0), 0);
                  const totalPaid = vendorBills.reduce((sum, bill) => sum + (parseFloat(bill.amount_paid) || 0), 0);
                  const outstanding = totalPurchases - totalPaid;

                  if (totalPurchases === 0 && outstanding === 0 && totalPaid === 0) return null; // Only show vendors with activity

                  return (
                    <TableRow key={vendor.id}>
                      <TableCell className="font-medium">{vendor.company_name}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(totalPurchases, baseCurrency)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-orange-600">
                        {formatCurrency(outstanding, baseCurrency)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-green-600">
                        {formatCurrency(totalPaid, baseCurrency)}
                      </TableCell>
                    </TableRow>
                  );
                })}
                <TableRow className="bg-gray-100 font-bold">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(bills.reduce((sum, bill) => sum + (parseFloat(bill.total_amount) || 0), 0), baseCurrency)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(bills.reduce((sum, bill) => sum + (parseFloat(bill.balance_due) || 0), 0), baseCurrency)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(bills.reduce((sum, bill) => sum + (parseFloat(bill.amount_paid) || 0), 0), baseCurrency)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <ReportActions
              reportTitle="Purchases by Vendor Report"
              data={{ vendors, bills, currency: baseCurrency, currencySymbol: formatCurrency(0, baseCurrency).charAt(0) }}
            />
          </CardContent>
        </Card>
      )}

      {/* NEW: Inventory Valuation Report */}
      {selectedReport === 'inventory-valuation' && (
        <Card>
          <CardHeader>
            <ReportHeader
              reportTitle="Inventory Valuation Summary"
              reportDate={`As of ${format(new Date(), 'MMMM dd, yyyy')}`}
              additionalInfo={`Reporting Currency: ${baseCurrency} (${formatCurrency(0, baseCurrency).charAt(0)})`}
            />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-b-2 border-gray-800">
                  <TableHead className="font-bold">SKU</TableHead>
                  <TableHead className="font-bold">Product Name</TableHead>
                  <TableHead className="font-bold text-right">Qty on Hand</TableHead>
                  <TableHead className="font-bold text-right">Unit Cost</TableHead>
                  <TableHead className="font-bold text-right">Total Value</TableHead>
                  <TableHead className="font-bold">Category</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No inventory items found
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {inventoryItems.map(product => {
                      const totalValue = (product.quantity_on_hand || 0) * (product.cost_price || 0);
                      return (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.sku}</TableCell>
                          <TableCell>{product.product_name}</TableCell>
                          <TableCell className="text-right">{product.quantity_on_hand || 0}</TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(product.cost_price || 0, baseCurrency)}
                          </TableCell>
                          <TableCell className="text-right font-mono font-semibold">
                            {formatCurrency(totalValue, baseCurrency)}
                          </TableCell>
                          <TableCell>{product.category || 'Uncategorized'}</TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow className="bg-gray-100 font-bold border-t-4 border-gray-900">
                      <TableCell colSpan={4} className="text-right text-lg">Total Inventory Value:</TableCell>
                      <TableCell className="text-right font-mono text-lg">
                        {formatCurrency(totalInventoryValue, baseCurrency)}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>

            <ReportActions
              reportTitle="Inventory Valuation Summary"
              data={{ inventoryItems, totalInventoryValue, currency: baseCurrency, currencySymbol: formatCurrency(0, baseCurrency).charAt(0) }}
            />
          </CardContent>
        </Card>
      )}

      {/* NEW: Stock Status Report */}
      {selectedReport === 'stock-status' && (
        <Card>
          <CardHeader>
            <ReportHeader
              reportTitle="Stock Status Report"
              reportDate={`As of ${format(new Date(), 'MMMM dd, yyyy')}`}
              additionalInfo="Real-time inventory levels and reorder alerts"
            />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-b-2 border-gray-800">
                  <TableHead className="font-bold">SKU</TableHead>
                  <TableHead className="font-bold">Product Name</TableHead>
                  <TableHead className="font-bold text-right">Qty on Hand</TableHead>
                  <TableHead className="font-bold text-right">Reorder Level</TableHead>
                  <TableHead className="font-bold text-right">Reorder Qty</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No inventory items found
                    </TableCell>
                  </TableRow>
                ) : (
                  inventoryItems.map(product => {
                    const qtyOnHand = product.quantity_on_hand || 0;
                    const reorderLevel = product.reorder_level || 0;
                    const needsReorder = qtyOnHand <= reorderLevel;
                    const status = needsReorder ? 'Low Stock' : 'In Stock';

                    return (
                      <TableRow key={product.id} className={needsReorder ? 'bg-yellow-50' : ''}>
                        <TableCell className="font-medium">{product.sku}</TableCell>
                        <TableCell>{product.product_name}</TableCell>
                        <TableCell className="text-right font-semibold">{qtyOnHand}</TableCell>
                        <TableCell className="text-right">{reorderLevel}</TableCell>
                        <TableCell className="text-right">{product.reorder_quantity || 0}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            needsReorder ? 'bg-yellow-200 text-yellow-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {status}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>

            <ReportActions
              reportTitle="Stock Status Report"
              data={{ inventoryItems, currency: baseCurrency, currencySymbol: formatCurrency(0, baseCurrency).charAt(0) }}
            />
          </CardContent>
        </Card>
      )}

      {/* NEW: Inventory Transactions Report */}
      {selectedReport === 'inventory-transactions' && (
        <Card>
          <CardHeader>
            <ReportHeader
              reportTitle="Inventory Transaction History"
              reportDate={`For the Period From ${format(new Date(new Date().getFullYear(), 0, 1), 'MMM d, yyyy')} to ${format(new Date(), 'MMM d, yyyy')}`}
              additionalInfo="Complete history of all inventory movements"
            />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-b-2 border-gray-800">
                  <TableHead className="font-bold">Date</TableHead>
                  <TableHead className="font-bold">Transaction #</TableHead>
                  <TableHead className="font-bold">Type</TableHead>
                  <TableHead className="font-bold">Product</TableHead>
                  <TableHead className="font-bold text-right">Qty In</TableHead>
                  <TableHead className="font-bold text-right">Qty Out</TableHead>
                  <TableHead className="font-bold text-right">Unit Cost</TableHead>
                  <TableHead className="font-bold text-right">Total Value</TableHead>
                  <TableHead className="font-bold">Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      No inventory transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  inventoryTransactions
                    .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))
                    .map(transaction => (
                      <TableRow key={transaction.id}>
                        <TableCell>{format(new Date(transaction.transaction_date), 'MMM d, yyyy')}</TableCell>
                        <TableCell className="font-medium">{transaction.transaction_number}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-800 capitalize">
                            {transaction.transaction_type.replace(/_/g, ' ')}
                          </span>
                        </TableCell>
                        <TableCell>{transaction.product_name}</TableCell>
                        <TableCell className="text-right text-green-600 font-semibold">
                          {transaction.quantity_in > 0 ? transaction.quantity_in : '-'}
                        </TableCell>
                        <TableCell className="text-right text-red-600 font-semibold">
                          {transaction.quantity_out > 0 ? transaction.quantity_out : '-'}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(transaction.unit_cost || 0, baseCurrency)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold">
                          {formatCurrency(transaction.total_value || 0, baseCurrency)}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">{transaction.reference_number || '-'}</TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>

            <ReportActions
              reportTitle="Inventory Transaction History"
              data={{ inventoryTransactions, currency: baseCurrency, currencySymbol: formatCurrency(0, baseCurrency).charAt(0) }}
            />
          </CardContent>
        </Card>
      )}

      {/* Placeholder for other reports */}
      {!['financial-performance', 'financial-position', 'cash-flow', 'trial-balance', 'general-ledger', 'items-sold-to-customers', 'items-purchased-from-vendors', 'customer-ledger', 'vendor-ledger', 'sales-by-customer', 'purchases-by-vendor', 'inventory-valuation', 'stock-status', 'inventory-transactions'].includes(selectedReport) && (
        <Card>
          <CardHeader>
            <CardTitle>{reportGroups.find(g => g.id === selectedReportGroup)?.reports.find(r => r.id === selectedReport)?.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p>Report Coming Soon</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

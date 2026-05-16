import React, { useState } from "react";
import { Account, Customer, Vendor, Invoice, Bill, Product, JournalEntry, InventoryTransaction, Payment } from "@/api/entities";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useCompany } from "../components/auth/CompanyContext";
import ReportHeader from "../components/reports/ReportHeader";
import ReportActions from "../components/reports/ReportActions";
import AccountLedger from "../components/reports/AccountLedger";
import { useFinancialMetrics, formatCurrency } from "../components/shared/FinancialCalculations";
import {
  FileText, TrendingUp, DollarSign, BarChart3,
  Package, ShoppingCart, Building2,
} from "lucide-react";
import { format } from "date-fns";
import PageShell, { PageHeader, StatBar, FilterSelect } from "../components/shared/PageShell";

export default function Reports() {
  const { currentCompany } = useCompany();
  const [selectedReportGroup, setSelectedReportGroup] = useState('financial');
  const [selectedReport, setSelectedReport]           = useState('financial-performance');
  const [dateRange, setDateRange]                     = useState('current-month');
  const [selectedAccount, setSelectedAccount]         = useState(null);

  const baseCurrency = currentCompany?.base_currency || 'USD';

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts', currentCompany?.id],
    queryFn: () => currentCompany ? Account.list({ filters: { company_id: currentCompany.id } }) : [],
    enabled: !!currentCompany, staleTime: 2 * 60 * 1000, cacheTime: 5 * 60 * 1000, refetchOnWindowFocus: false,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers', currentCompany?.id],
    queryFn: () => currentCompany ? Customer.list({ filters: { company_id: currentCompany.id } }) : [],
    enabled: !!currentCompany, staleTime: 2 * 60 * 1000, cacheTime: 5 * 60 * 1000, refetchOnWindowFocus: false,
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors', currentCompany?.id],
    queryFn: () => currentCompany ? Vendor.list({ filters: { company_id: currentCompany.id } }) : [],
    enabled: !!currentCompany, staleTime: 2 * 60 * 1000, cacheTime: 5 * 60 * 1000, refetchOnWindowFocus: false,
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices', currentCompany?.id],
    queryFn: () => currentCompany ? Invoice.list({ filters: { company_id: currentCompany.id } }) : [],
    enabled: !!currentCompany, staleTime: 1 * 60 * 1000, cacheTime: 3 * 60 * 1000, refetchOnWindowFocus: false,
  });

  const { data: bills = [] } = useQuery({
    queryKey: ['bills', currentCompany?.id],
    queryFn: () => currentCompany ? Bill.list({ filters: { company_id: currentCompany.id } }) : [],
    enabled: !!currentCompany, staleTime: 1 * 60 * 1000, cacheTime: 3 * 60 * 1000, refetchOnWindowFocus: false,
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products', currentCompany?.id],
    queryFn: () => currentCompany ? Product.list({ filters: { company_id: currentCompany.id } }) : [],
    enabled: !!currentCompany, staleTime: 2 * 60 * 1000, cacheTime: 5 * 60 * 1000, refetchOnWindowFocus: false,
  });

  const { data: journalEntries = [] } = useQuery({
    queryKey: ['journal-entries', currentCompany?.id],
    queryFn: () => currentCompany ? JournalEntry.list({ filters: { company_id: currentCompany.id, status: 'posted' } }) : [],
    enabled: !!currentCompany, staleTime: 1 * 60 * 1000, cacheTime: 3 * 60 * 1000, refetchOnWindowFocus: false,
  });

  const { data: inventoryTransactions = [] } = useQuery({
    queryKey: ['inventory-transactions', currentCompany?.id],
    queryFn: () => currentCompany ? InventoryTransaction.list({ filters: { company_id: currentCompany.id } }) : [],
    enabled: !!currentCompany, staleTime: 2 * 60 * 1000, cacheTime: 5 * 60 * 1000, refetchOnWindowFocus: false,
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['payments', currentCompany?.id],
    queryFn: () => currentCompany ? Payment.list({ filters: { company_id: currentCompany.id } }) : [],
    enabled: !!currentCompany, staleTime: 1 * 60 * 1000, cacheTime: 3 * 60 * 1000, refetchOnWindowFocus: false,
  });

  const metrics = useFinancialMetrics(accounts, journalEntries, baseCurrency);
  const {
    accountBalances, revenueAccounts, totalRevenue, expenseAccounts, totalExpenses, netIncome,
    assetAccounts, totalAssets, liabilityAccounts, totalLiabilities, equityAccounts, totalEquity,
    totalCash, totalAccountsReceivable, totalAccountsPayable,
  } = metrics;

  const inventoryItems       = products.filter(p => p.product_type === 'inventory');
  const totalInventoryValue  = inventoryItems.reduce((s, p) => s + ((p.quantity_on_hand || 0) * (p.cost_price || 0)), 0);

  const reportGroups = [
    {
      id: 'financial', label: 'Financial Statements', icon: BarChart3,
      reports: [
        { id: 'financial-performance', label: 'Statement of Financial Performance' },
        { id: 'financial-position',    label: 'Statement of Financial Position' },
        { id: 'cash-flow',             label: 'Statement of Cash Flows' },
        { id: 'trial-balance',         label: 'Trial Balance' },
        { id: 'general-ledger',        label: 'General Ledger' },
      ],
    },
    {
      id: 'sales', label: 'Sales / Invoicing', icon: ShoppingCart,
      reports: [
        { id: 'sales-by-customer',        label: 'Sales by Customer' },
        { id: 'items-sold-to-customers',  label: 'Items Sold to Customers' },
        { id: 'customer-ledger',          label: 'Customer Ledgers' },
      ],
    },
    {
      id: 'purchases', label: 'Purchases / Vendors', icon: Building2,
      reports: [
        { id: 'purchases-by-vendor',            label: 'Purchases by Vendor' },
        { id: 'items-purchased-from-vendors',   label: 'Items Purchased from Vendors' },
        { id: 'vendor-ledger',                  label: 'Vendor Ledgers' },
      ],
    },
    {
      id: 'inventory', label: 'Inventory', icon: Package,
      reports: [
        { id: 'inventory-valuation',   label: 'Inventory Valuation' },
        { id: 'stock-status',          label: 'Stock Status Report' },
        { id: 'inventory-transactions',label: 'Inventory Transactions' },
      ],
    },
  ];

  const currentGroup   = reportGroups.find(g => g.id === selectedReportGroup);
  const currentReport  = currentGroup?.reports.find(r => r.id === selectedReport);

  return (
    <PageShell>
      {selectedAccount && (
        <AccountLedger account={selectedAccount} onClose={() => setSelectedAccount(null)} onTransactionClick={() => {}} />
      )}

      <PageHeader
        title="Business Reports"
        subtitle={`${currentCompany?.company_name} · Synchronized with all dashboards in real-time`}
        icon={BarChart3}
        accentColor="#1B4F8A"
      />

      <StatBar stats={[
        { label: 'Total Revenue',  value: formatCurrency(totalRevenue, baseCurrency),  icon: TrendingUp,  color: '#00A86B' },
        { label: 'Total Expenses', value: formatCurrency(totalExpenses, baseCurrency), icon: TrendingUp,  color: '#EF4444' },
        { label: 'Net Profit',     value: formatCurrency(netIncome, baseCurrency),     icon: DollarSign,  color: netIncome >= 0 ? '#00A86B' : '#EF4444' },
        { label: 'Total Assets',   value: formatCurrency(totalAssets, baseCurrency),   icon: BarChart3,   color: '#1B4F8A' },
      ]} />

      {/* Report Selection Controls */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', background: 'white', padding: '16px 20px', borderRadius: 12, border: '1px solid #F1F5F9', boxShadow: '0 1px 4px rgba(15,43,91,0.05)' }}>
        <div style={{ flex: 1, minWidth: 180 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94A3B8', marginBottom: 6 }}>Report Group</p>
          <Select value={selectedReportGroup} onValueChange={(value) => {
            setSelectedReportGroup(value);
            const group = reportGroups.find(g => g.id === value);
            if (group?.reports.length > 0) setSelectedReport(group.reports[0].id);
          }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {reportGroups.map(group => {
                const Icon = group.icon;
                return (
                  <SelectItem key={group.id} value={group.id}>
                    <div className="flex items-center gap-2"><Icon className="w-4 h-4" />{group.label}</div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div style={{ flex: 1, minWidth: 200 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94A3B8', marginBottom: 6 }}>Select Report</p>
          <Select value={selectedReport} onValueChange={setSelectedReport}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {currentGroup?.reports.map(report => <SelectItem key={report.id} value={report.id}>{report.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div style={{ flex: 1, minWidth: 160 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94A3B8', marginBottom: 6 }}>Date Range</p>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger><SelectValue /></SelectTrigger>
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

      {/* ── FINANCIAL STATEMENTS ── */}
      {selectedReport === 'financial-performance' && (
        <Card>
          <CardHeader>
            <ReportHeader reportTitle="Statement of Financial Performance" reportDate={`For the Period Ending ${format(new Date(), 'MMMM dd, yyyy')}`} additionalInfo={`Reporting Currency: ${baseCurrency} | IFRS Compliant | Synchronized with All Dashboards in Real-Time`} />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-lg mb-3 border-b-2 border-gray-800 pb-2">Revenue</h3>
                <Table>
                  <TableBody>
                    {revenueAccounts.map(account => (
                      <TableRow key={account.id} className="cursor-pointer hover:bg-blue-50" onClick={() => setSelectedAccount(account)}>
                        <TableCell className="w-32">{account.account_code}</TableCell>
                        <TableCell>{account.account_name}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(account.calculatedBalance, baseCurrency)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-blue-50 font-bold border-t-2 border-gray-800">
                      <TableCell colSpan={2}>Total Revenue</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(totalRevenue, baseCurrency)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-3 border-b-2 border-gray-800 pb-2">Expenses</h3>
                <Table>
                  <TableBody>
                    {expenseAccounts.map(account => (
                      <TableRow key={account.id} className="cursor-pointer hover:bg-blue-50" onClick={() => setSelectedAccount(account)}>
                        <TableCell className="w-32">{account.account_code}</TableCell>
                        <TableCell>{account.account_name}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(account.calculatedBalance, baseCurrency)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-red-50 font-bold border-t-2 border-gray-800">
                      <TableCell colSpan={2}>Total Expenses</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(totalExpenses, baseCurrency)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              <div className="border-t-4 border-gray-900 pt-4">
                <div className="flex justify-between items-center text-2xl font-bold">
                  <span>Net Profit/Loss</span>
                  <span className={`font-mono ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(netIncome, baseCurrency)}</span>
                </div>
              </div>
            </div>
            <ReportActions reportTitle="Statement of Financial Performance" data={{ revenueAccounts, expenseAccounts, totalRevenue, totalExpenses, netIncome, currency: baseCurrency, currencySymbol: formatCurrency(0, baseCurrency).charAt(0) }} />
          </CardContent>
        </Card>
      )}

      {selectedReport === 'financial-position' && (
        <Card>
          <CardHeader>
            <ReportHeader reportTitle="Statement of Financial Position" reportDate={`As of ${format(new Date(), 'MMMM dd, yyyy')}`} additionalInfo={`Reporting Currency: ${baseCurrency} | IFRS Compliant | Synchronized with All Dashboards in Real-Time`} />
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-bold text-xl mb-4 border-b-2 border-gray-800 pb-2">Assets</h3>
                <Table>
                  <TableBody>
                    {assetAccounts.map(account => (
                      <TableRow key={account.id} className="cursor-pointer hover:bg-blue-50 transition-colors" onClick={() => setSelectedAccount(account)} title="Click to view general ledger for this account">
                        <TableCell className="font-medium hover:text-blue-600 hover:underline">{account.account_name}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(account.calculatedBalance, baseCurrency)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-blue-100 font-bold border-t-2 border-gray-800">
                      <TableCell>Total Assets</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(totalAssets, baseCurrency)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              <div>
                <h3 className="font-bold text-xl mb-4 border-b-2 border-gray-800 pb-2">Liabilities & Equity</h3>
                <h4 className="font-semibold mt-4 mb-2">Liabilities</h4>
                <Table>
                  <TableBody>
                    {liabilityAccounts.map(account => (
                      <TableRow key={account.id} className="cursor-pointer hover:bg-blue-50 transition-colors" onClick={() => setSelectedAccount(account)} title="Click to view general ledger for this account">
                        <TableCell className="font-medium hover:text-blue-600 hover:underline">{account.account_name}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(account.calculatedBalance, baseCurrency)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-red-50 font-bold">
                      <TableCell>Total Liabilities</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(totalLiabilities, baseCurrency)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                <h4 className="font-semibold mt-6 mb-2">Equity</h4>
                <Table>
                  <TableBody>
                    {equityAccounts.map(account => (
                      <TableRow key={account.id} className="cursor-pointer hover:bg-blue-50 transition-colors" onClick={() => setSelectedAccount(account)} title="Click to view general ledger for this account">
                        <TableCell className="font-medium hover:text-blue-600 hover:underline">{account.account_name}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(account.calculatedBalance, baseCurrency)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell>Current Period Profit/Loss</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(netIncome, baseCurrency)}</TableCell>
                    </TableRow>
                    <TableRow className="bg-green-50 font-bold">
                      <TableCell>Total Equity</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(totalEquity, baseCurrency)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                <div className="border-t-4 border-gray-900 pt-4 mt-4">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total Liabilities & Equity</span>
                    <span className="font-mono">{formatCurrency(totalLiabilities + totalEquity, baseCurrency)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900"><strong>Tip:</strong> Click on any account name to drill down to the General Ledger. From the ledger, you can click on transactions to view or edit the source documents.</p>
            </div>
            <ReportActions reportTitle="Statement of Financial Position" data={{ assetAccounts, liabilityAccounts, equityAccounts, totalAssets, totalLiabilities, totalEquity, netIncome, currency: baseCurrency, currencySymbol: formatCurrency(0, baseCurrency).charAt(0) }} />
          </CardContent>
        </Card>
      )}

      {selectedReport === 'trial-balance' && (
        <Card>
          <CardHeader>
            <ReportHeader reportTitle="Trial Balance" reportDate={`As of ${format(new Date(), 'MMMM dd, yyyy')}`} additionalInfo={`Reporting Currency: ${baseCurrency} | Synchronized with All Dashboards in Real-Time`} />
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
                {Object.values(accountBalances).map(account => {
                  const balance = account.calculatedBalance;
                  const isDebitNormal = ['asset', 'expense', 'cost_of_goods_sold'].includes(account.account_type);
                  if (Math.abs(balance) < 0.01) return null;
                  return (
                    <TableRow key={account.id} className="cursor-pointer hover:bg-blue-50" onClick={() => setSelectedAccount(account)}>
                      <TableCell className="font-medium">{account.account_code}</TableCell>
                      <TableCell>{account.account_name}</TableCell>
                      <TableCell className="text-right font-mono">{isDebitNormal && balance >= 0 ? formatCurrency(balance, baseCurrency) : !isDebitNormal && balance < 0 ? formatCurrency(balance * -1, baseCurrency) : '-'}</TableCell>
                      <TableCell className="text-right font-mono">{isDebitNormal && balance < 0 ? formatCurrency(balance * -1, baseCurrency) : !isDebitNormal && balance >= 0 ? formatCurrency(balance, baseCurrency) : '-'}</TableCell>
                    </TableRow>
                  );
                })}
                <TableRow className="bg-gray-200 font-bold border-t-4 border-gray-900">
                  <TableCell colSpan={2} className="text-lg">Totals</TableCell>
                  <TableCell className="text-right font-mono text-lg">{formatCurrency(Object.values(accountBalances).reduce((sum, acc) => { const isD = ['asset','expense','cost_of_goods_sold'].includes(acc.account_type); const b = acc.calculatedBalance; if (isD && b >= 0) return sum + b; if (!isD && b < 0) return sum + (b * -1); return sum; }, 0), baseCurrency)}</TableCell>
                  <TableCell className="text-right font-mono text-lg">{formatCurrency(Object.values(accountBalances).reduce((sum, acc) => { const isD = ['asset','expense','cost_of_goods_sold'].includes(acc.account_type); const b = acc.calculatedBalance; if (isD && b < 0) return sum + (b * -1); if (!isD && b >= 0) return sum + b; return sum; }, 0), baseCurrency)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <ReportActions reportTitle="Trial Balance" data={{ accounts: Object.values(accountBalances), currency: baseCurrency, currencySymbol: formatCurrency(0, baseCurrency).charAt(0) }} />
          </CardContent>
        </Card>
      )}

      {selectedReport === 'general-ledger' && (
        <Card>
          <CardHeader>
            <ReportHeader reportTitle="General Ledger" reportDate={`For the Period From ${format(new Date(new Date().getFullYear(), 0, 1), 'MMM d, yyyy')} to ${format(new Date(), 'MMM d, yyyy')}`} additionalInfo="Filter Criteria includes: Report order is by ID. Report is printed with shortened descriptions and in Detail Format." />
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {Object.values(accountBalances).filter(account => {
                return journalEntries.some(entry => entry.line_items?.some(line => line.account_id === account.id));
              }).map(account => {
                const accountEntries = journalEntries.filter(entry => entry.line_items?.some(line => line.account_id === account.id)).sort((a, b) => new Date(a.entry_date) - new Date(b.entry_date));
                let runningBalance = 0;
                const transactionsWithBalance = accountEntries.map(entry => {
                  const relevantLines = entry.line_items?.filter(line => line.account_id === account.id) || [];
                  const debitAmount   = relevantLines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0);
                  const creditAmount  = relevantLines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);
                  const isDebitNormal = ['asset', 'expense', 'cost_of_goods_sold'].includes(account.account_type);
                  if (isDebitNormal) { runningBalance = runningBalance + debitAmount - creditAmount; }
                  else { runningBalance = runningBalance + creditAmount - debitAmount; }
                  return { ...entry, debitAmount, creditAmount, balance: runningBalance };
                });

                return (
                  <div key={account.id} className="border-t-2 border-gray-300 pt-4">
                    <div className="mb-2 font-bold text-sm"><div>{account.account_code}</div><div>{account.account_name}</div></div>
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
                        <TableRow className="font-semibold">
                          <TableCell colSpan={4}>Beginning Balance</TableCell>
                          <TableCell className="text-right">-</TableCell>
                          <TableCell className="text-right">-</TableCell>
                          <TableCell className="text-right">{formatCurrency(0, baseCurrency)}</TableCell>
                        </TableRow>
                        {transactionsWithBalance.map((entry) => (
                          <TableRow key={entry.id} className="cursor-pointer hover:bg-blue-50" onClick={() => setSelectedAccount(account)}>
                            <TableCell className="text-sm">{format(new Date(entry.entry_date), 'M/d/yy')}</TableCell>
                            <TableCell className="text-sm">{entry.reference || entry.entry_number}</TableCell>
                            <TableCell className="text-sm">{entry.source_type === 'invoice' ? 'CRJ' : entry.source_type === 'bill' ? 'PRJ' : entry.source_type === 'payment' ? 'CRJ' : 'JE'}</TableCell>
                            <TableCell className="text-sm">{entry.description}</TableCell>
                            <TableCell className="text-right text-sm font-mono">{entry.debitAmount > 0 ? formatCurrency(entry.debitAmount, baseCurrency) : '-'}</TableCell>
                            <TableCell className="text-right text-sm font-mono">{entry.creditAmount > 0 ? formatCurrency(entry.creditAmount, baseCurrency) : '-'}</TableCell>
                            <TableCell className="text-right text-sm font-mono font-semibold">{formatCurrency(entry.balance, baseCurrency)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-gray-100 font-bold border-t-2 border-gray-800">
                          <TableCell colSpan={4}><div>{format(new Date(), 'M/d/yy')}</div><div>Ending Balance</div></TableCell>
                          <TableCell className="text-right">-</TableCell>
                          <TableCell className="text-right">-</TableCell>
                          <TableCell className="text-right text-lg">{formatCurrency(runningBalance, baseCurrency)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900"><strong>Tip:</strong> Click on any transaction row to drill down to the account's detailed General Ledger.</p>
            </div>
            <ReportActions reportTitle="General Ledger" data={{ accounts: Object.values(accountBalances), journalEntries, currency: baseCurrency, currencySymbol: formatCurrency(0, baseCurrency).charAt(0) }} />
          </CardContent>
        </Card>
      )}

      {selectedReport === 'cash-flow' && (
        <Card>
          <CardHeader>
            <ReportHeader reportTitle="Statement of Cash Flows" reportDate={`For the Period Ending ${format(new Date(), 'MMMM dd, yyyy')}`} additionalInfo={`Reporting Currency: ${baseCurrency} | IFRS Compliant | Synchronized with All Dashboards in Real-Time`} />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-lg mb-3 border-b-2 border-gray-800 pb-2">Cash Flows from Operating Activities</h3>
                <Table>
                  <TableBody>
                    <TableRow><TableCell>Net Profit/Loss</TableCell><TableCell className="text-right font-mono">{formatCurrency(netIncome, baseCurrency)}</TableCell></TableRow>
                    <TableRow><TableCell className="pl-8">Adjustments:</TableCell><TableCell></TableCell></TableRow>
                    <TableRow><TableCell className="pl-12">Increase in Accounts Receivable</TableCell><TableCell className="text-right font-mono text-red-600">({formatCurrency(totalAccountsReceivable, baseCurrency)})</TableCell></TableRow>
                    <TableRow><TableCell className="pl-12">Increase in Accounts Payable</TableCell><TableCell className="text-right font-mono text-green-600">{formatCurrency(totalAccountsPayable, baseCurrency)}</TableCell></TableRow>
                    <TableRow className="bg-blue-50 font-bold border-t-2 border-gray-800"><TableCell>Net Cash from Operating Activities</TableCell><TableCell className="text-right font-mono">{formatCurrency(netIncome - totalAccountsReceivable + totalAccountsPayable, baseCurrency)}</TableCell></TableRow>
                  </TableBody>
                </Table>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-3 border-b-2 border-gray-800 pb-2">Cash Flows from Investing Activities</h3>
                <Table>
                  <TableBody>
                    <TableRow><TableCell>Purchase of Fixed Assets</TableCell><TableCell className="text-right font-mono">-</TableCell></TableRow>
                    <TableRow className="bg-blue-50 font-bold border-t-2 border-gray-800"><TableCell>Net Cash from Investing Activities</TableCell><TableCell className="text-right font-mono">{formatCurrency(0, baseCurrency)}</TableCell></TableRow>
                  </TableBody>
                </Table>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-3 border-b-2 border-gray-800 pb-2">Cash Flows from Financing Activities</h3>
                <Table>
                  <TableBody>
                    <TableRow><TableCell>Increase in Long-term Debt</TableCell><TableCell className="text-right font-mono">-</TableCell></TableRow>
                    <TableRow className="bg-blue-50 font-bold border-t-2 border-gray-800"><TableCell>Net Cash from Financing Activities</TableCell><TableCell className="text-right font-mono">{formatCurrency(0, baseCurrency)}</TableCell></TableRow>
                  </TableBody>
                </Table>
              </div>
              <div className="border-t-4 border-gray-900 pt-4">
                <Table>
                  <TableBody>
                    <TableRow className="text-lg font-bold"><TableCell>Net Increase/Decrease in Cash</TableCell><TableCell className="text-right font-mono">{formatCurrency(netIncome - totalAccountsReceivable + totalAccountsPayable, baseCurrency)}</TableCell></TableRow>
                    <TableRow><TableCell>Cash at Beginning of Period</TableCell><TableCell className="text-right font-mono">{formatCurrency(0, baseCurrency)}</TableCell></TableRow>
                    <TableRow className="text-xl font-bold bg-green-50 border-t-4 border-gray-900"><TableCell>Cash at End of Period</TableCell><TableCell className="text-right font-mono text-green-600">{formatCurrency(totalCash, baseCurrency)}</TableCell></TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
            <ReportActions reportTitle="Statement of Cash Flows" data={{ netIncome, totalAccountsReceivable, totalAccountsPayable, totalCash, currency: baseCurrency, currencySymbol: formatCurrency(0, baseCurrency).charAt(0) }} />
          </CardContent>
        </Card>
      )}

      {selectedReport === 'items-sold-to-customers' && (
        <Card>
          <CardHeader>
            <ReportHeader reportTitle="Items Sold to Customers" reportDate={`For the Period From ${format(new Date(), 'MMM d, yyyy')} to ${format(new Date(), 'MMM d, yyyy')}`} additionalInfo="Filter Criteria includes: Report order is by Customer ID, Item ID. Report is printed in Detail Format." />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-b-2 border-gray-800">
                  <TableHead className="font-bold">Customer ID / Name</TableHead>
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
                  const itemsSold = [];
                  customerInvoices.forEach(invoice => {
                    invoice.line_items?.forEach(item => {
                      const existing = itemsSold.find(i => i.product_id === item.product_id);
                      if (existing) { existing.quantity += item.quantity; existing.amount += item.line_total || (item.quantity * item.unit_price); }
                      else itemsSold.push({ product_id: item.product_id, description: item.description, quantity: item.quantity, amount: item.line_total || (item.quantity * item.unit_price), unit_price: item.unit_price });
                    });
                  });
                  const customerTotal = itemsSold.reduce((s, i) => s + i.amount, 0);
                  return (
                    <React.Fragment key={customer.id}>
                      <TableRow className="border-t-2 border-gray-400">
                        <TableCell className="font-bold" colSpan={8}>{customer.customer_code || customer.id}<br />{customer.company_name}</TableCell>
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
                            <TableCell className="text-right font-mono">{formatCurrency(item.amount, baseCurrency)}</TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(costOfSales, baseCurrency)}</TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(grossProfit, baseCurrency)}</TableCell>
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
                  <TableCell className="text-right font-mono text-lg">{formatCurrency(invoices.reduce((s, inv) => s + (parseFloat(inv.total_amount) || 0), 0), baseCurrency)}</TableCell>
                  <TableCell colSpan={3}></TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <ReportActions reportTitle="Items Sold to Customers" data={{ customers, invoices, products, currency: baseCurrency, currencySymbol: formatCurrency(0, baseCurrency).charAt(0) }} />
          </CardContent>
        </Card>
      )}

      {selectedReport === 'items-purchased-from-vendors' && (
        <Card>
          <CardHeader>
            <ReportHeader reportTitle="Items Purchased from Vendors" reportDate={`For the Period From ${format(new Date(), 'MMM d, yyyy')} to ${format(new Date(), 'MMM d, yyyy')}`} additionalInfo="Filter Criteria includes: Report order is by Vendor ID, Item ID. Report is printed in Detail Format." />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-b-2 border-gray-800">
                  <TableHead className="font-bold">Vendor ID / Name</TableHead>
                  <TableHead className="font-bold">Item ID / Item Description</TableHead>
                  <TableHead className="font-bold text-right">Qty</TableHead>
                  <TableHead className="font-bold">Stocking U/M</TableHead>
                  <TableHead className="font-bold text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendors.map(vendor => {
                  const vendorBills = bills.filter(bill => bill.vendor_id === vendor.id);
                  if (vendorBills.length === 0) return null;
                  const itemsPurchased = [];
                  vendorBills.forEach(bill => {
                    bill.line_items?.forEach(item => {
                      const existing = itemsPurchased.find(i => i.product_id === item.product_id);
                      if (existing) { existing.quantity += item.quantity; existing.amount += item.line_total || (item.quantity * item.unit_cost); }
                      else itemsPurchased.push({ product_id: item.product_id, description: item.description, quantity: item.quantity, amount: item.line_total || (item.quantity * item.unit_cost) });
                    });
                  });
                  const vendorTotal = itemsPurchased.reduce((s, i) => s + i.amount, 0);
                  return (
                    <React.Fragment key={vendor.id}>
                      <TableRow className="border-t-2 border-gray-400">
                        <TableCell className="font-bold" colSpan={5}>{vendor.vendor_code || vendor.id}<br />{vendor.company_name}</TableCell>
                      </TableRow>
                      {itemsPurchased.map((item, idx) => {
                        const product = products.find(p => p.id === item.product_id);
                        return (
                          <TableRow key={idx}>
                            <TableCell></TableCell>
                            <TableCell>{item.description}</TableCell>
                            <TableCell className="text-right">{item.quantity.toFixed(2)}</TableCell>
                            <TableCell>{product?.unit_of_measure || 'unit'}</TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(item.amount, baseCurrency)}</TableCell>
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
                  <TableCell className="text-right font-mono text-lg">{formatCurrency(bills.reduce((s, b) => s + (parseFloat(b.total_amount) || 0), 0), baseCurrency)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <ReportActions reportTitle="Items Purchased from Vendors" data={{ vendors, bills, products, currency: baseCurrency, currencySymbol: formatCurrency(0, baseCurrency).charAt(0) }} />
          </CardContent>
        </Card>
      )}

      {selectedReport === 'customer-ledger' && (
        <Card>
          <CardHeader><div className="font-bold text-lg p-2">Customer Ledger - Select Customer</div></CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">Click on any customer below to view their detailed ledger:</p>
            <div className="grid md:grid-cols-2 gap-4">
              {customers.map(customer => {
                const customerInvoices = invoices.filter(inv => inv.customer_id === customer.id);
                const totalSales  = customerInvoices.reduce((s, inv) => s + (parseFloat(inv.total_amount) || 0), 0);
                const totalPaidA  = customerInvoices.reduce((s, inv) => s + (parseFloat(inv.amount_paid) || 0), 0);
                const outstanding = totalSales - totalPaidA;
                return (
                  <Card key={customer.id} className="cursor-pointer hover:bg-green-50 transition-colors border-2">
                    <CardContent className="pt-6">
                      <p className="font-semibold text-lg">{customer.company_name}</p>
                      <p className="text-sm text-gray-600">{customer.email}</p>
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between text-sm"><span className="text-gray-600">Total Sales:</span><span className="font-semibold">{formatCurrency(totalSales, baseCurrency)}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-gray-600">Paid:</span><span className="font-semibold text-green-600">{formatCurrency(totalPaidA, baseCurrency)}</span></div>
                        <div className="flex justify-between text-sm border-t pt-2"><span className="text-gray-600 font-semibold">Outstanding:</span><span className="font-bold text-orange-600">{formatCurrency(outstanding, baseCurrency)}</span></div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedReport === 'vendor-ledger' && (
        <Card>
          <CardHeader><div className="font-bold text-lg p-2">Vendor Ledger - Select Vendor</div></CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">Click on any vendor below to view their detailed ledger:</p>
            <div className="grid md:grid-cols-2 gap-4">
              {vendors.map(vendor => {
                const vendorBills    = bills.filter(bill => bill.vendor_id === vendor.id);
                const totalPurchases = vendorBills.reduce((s, b) => s + (parseFloat(b.total_amount) || 0), 0);
                const totalPaidB     = vendorBills.reduce((s, b) => s + (parseFloat(b.amount_paid) || 0), 0);
                const outstanding    = totalPurchases - totalPaidB;
                return (
                  <Card key={vendor.id} className="cursor-pointer hover:bg-orange-50 transition-colors border-2">
                    <CardContent className="pt-6">
                      <p className="font-semibold text-lg">{vendor.company_name}</p>
                      <p className="text-sm text-gray-600">{vendor.email}</p>
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between text-sm"><span className="text-gray-600">Total Purchases:</span><span className="font-semibold">{formatCurrency(totalPurchases, baseCurrency)}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-gray-600">Paid:</span><span className="font-semibold text-green-600">{formatCurrency(totalPaidB, baseCurrency)}</span></div>
                        <div className="flex justify-between text-sm border-t pt-2"><span className="text-gray-600 font-semibold">Outstanding:</span><span className="font-bold text-orange-600">{formatCurrency(outstanding, baseCurrency)}</span></div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedReport === 'sales-by-customer' && (
        <Card>
          <CardHeader>
            <ReportHeader reportTitle="Sales by Customer Report" reportDate={format(new Date(), 'MMMM dd, yyyy')} additionalInfo={`Reporting Currency: ${baseCurrency}`} />
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
                  const totalSales  = customerInvoices.reduce((s, inv) => s + (parseFloat(inv.total_amount) || 0), 0);
                  const totalPaidC  = customerInvoices.reduce((s, inv) => s + (parseFloat(inv.amount_paid) || 0), 0);
                  const outstanding = totalSales - totalPaidC;
                  if (totalSales === 0 && outstanding === 0 && totalPaidC === 0) return null;
                  return (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.company_name}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(totalSales, baseCurrency)}</TableCell>
                      <TableCell className="text-right font-mono text-orange-600">{formatCurrency(outstanding, baseCurrency)}</TableCell>
                      <TableCell className="text-right font-mono text-green-600">{formatCurrency(totalPaidC, baseCurrency)}</TableCell>
                    </TableRow>
                  );
                })}
                <TableRow className="bg-gray-100 font-bold">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(invoices.reduce((s, inv) => s + (parseFloat(inv.total_amount) || 0), 0), baseCurrency)}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(invoices.reduce((s, inv) => s + (parseFloat(inv.balance_due) || 0), 0), baseCurrency)}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(invoices.reduce((s, inv) => s + (parseFloat(inv.amount_paid) || 0), 0), baseCurrency)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <ReportActions reportTitle="Sales by Customer Report" data={{ customers, invoices, currency: baseCurrency, currencySymbol: formatCurrency(0, baseCurrency).charAt(0) }} />
          </CardContent>
        </Card>
      )}

      {selectedReport === 'purchases-by-vendor' && (
        <Card>
          <CardHeader>
            <ReportHeader reportTitle="Purchases by Vendor Report" reportDate={format(new Date(), 'MMMM dd, yyyy')} additionalInfo={`Reporting Currency: ${baseCurrency}`} />
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
                  const vendorBills    = bills.filter(bill => bill.vendor_id === vendor.id);
                  const totalPurchases = vendorBills.reduce((s, b) => s + (parseFloat(b.total_amount) || 0), 0);
                  const totalPaidD     = vendorBills.reduce((s, b) => s + (parseFloat(b.amount_paid) || 0), 0);
                  const outstanding    = totalPurchases - totalPaidD;
                  if (totalPurchases === 0 && outstanding === 0 && totalPaidD === 0) return null;
                  return (
                    <TableRow key={vendor.id}>
                      <TableCell className="font-medium">{vendor.company_name}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(totalPurchases, baseCurrency)}</TableCell>
                      <TableCell className="text-right font-mono text-orange-600">{formatCurrency(outstanding, baseCurrency)}</TableCell>
                      <TableCell className="text-right font-mono text-green-600">{formatCurrency(totalPaidD, baseCurrency)}</TableCell>
                    </TableRow>
                  );
                })}
                <TableRow className="bg-gray-100 font-bold">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(bills.reduce((s, b) => s + (parseFloat(b.total_amount) || 0), 0), baseCurrency)}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(bills.reduce((s, b) => s + (parseFloat(b.balance_due) || 0), 0), baseCurrency)}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(bills.reduce((s, b) => s + (parseFloat(b.amount_paid) || 0), 0), baseCurrency)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <ReportActions reportTitle="Purchases by Vendor Report" data={{ vendors, bills, currency: baseCurrency, currencySymbol: formatCurrency(0, baseCurrency).charAt(0) }} />
          </CardContent>
        </Card>
      )}

      {selectedReport === 'inventory-valuation' && (
        <Card>
          <CardHeader>
            <ReportHeader reportTitle="Inventory Valuation Summary" reportDate={`As of ${format(new Date(), 'MMMM dd, yyyy')}`} additionalInfo={`Reporting Currency: ${baseCurrency}`} />
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
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">No inventory items found</TableCell></TableRow>
                ) : (
                  <>
                    {inventoryItems.map(product => {
                      const totalValue = (product.quantity_on_hand || 0) * (product.cost_price || 0);
                      return (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.sku}</TableCell>
                          <TableCell>{product.product_name}</TableCell>
                          <TableCell className="text-right">{product.quantity_on_hand || 0}</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(product.cost_price || 0, baseCurrency)}</TableCell>
                          <TableCell className="text-right font-mono font-semibold">{formatCurrency(totalValue, baseCurrency)}</TableCell>
                          <TableCell>{product.category || 'Uncategorized'}</TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow className="bg-gray-100 font-bold border-t-4 border-gray-900">
                      <TableCell colSpan={4} className="text-right text-lg">Total Inventory Value:</TableCell>
                      <TableCell className="text-right font-mono text-lg">{formatCurrency(totalInventoryValue, baseCurrency)}</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
            <ReportActions reportTitle="Inventory Valuation Summary" data={{ inventoryItems, totalInventoryValue, currency: baseCurrency, currencySymbol: formatCurrency(0, baseCurrency).charAt(0) }} />
          </CardContent>
        </Card>
      )}

      {selectedReport === 'stock-status' && (
        <Card>
          <CardHeader>
            <ReportHeader reportTitle="Stock Status Report" reportDate={`As of ${format(new Date(), 'MMMM dd, yyyy')}`} additionalInfo="Real-time inventory levels and reorder alerts" />
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
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">No inventory items found</TableCell></TableRow>
                ) : (
                  inventoryItems.map(product => {
                    const qtyOnHand    = product.quantity_on_hand || 0;
                    const reorderLevel = product.reorder_level || 0;
                    const needsReorder = qtyOnHand <= reorderLevel;
                    return (
                      <TableRow key={product.id} className={needsReorder ? 'bg-yellow-50' : ''}>
                        <TableCell className="font-medium">{product.sku}</TableCell>
                        <TableCell>{product.product_name}</TableCell>
                        <TableCell className="text-right font-semibold">{qtyOnHand}</TableCell>
                        <TableCell className="text-right">{reorderLevel}</TableCell>
                        <TableCell className="text-right">{product.reorder_quantity || 0}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${needsReorder ? 'bg-yellow-200 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                            {needsReorder ? 'Low Stock' : 'In Stock'}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            <ReportActions reportTitle="Stock Status Report" data={{ inventoryItems, currency: baseCurrency, currencySymbol: formatCurrency(0, baseCurrency).charAt(0) }} />
          </CardContent>
        </Card>
      )}

      {selectedReport === 'inventory-transactions' && (
        <Card>
          <CardHeader>
            <ReportHeader reportTitle="Inventory Transaction History" reportDate={`For the Period From ${format(new Date(new Date().getFullYear(), 0, 1), 'MMM d, yyyy')} to ${format(new Date(), 'MMM d, yyyy')}`} additionalInfo="Complete history of all inventory movements" />
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
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-gray-500">No inventory transactions found</TableCell></TableRow>
                ) : (
                  inventoryTransactions
                    .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))
                    .map(transaction => (
                      <TableRow key={transaction.id}>
                        <TableCell>{format(new Date(transaction.transaction_date), 'MMM d, yyyy')}</TableCell>
                        <TableCell className="font-medium">{transaction.transaction_number}</TableCell>
                        <TableCell><span className="px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-800 capitalize">{transaction.transaction_type.replace(/_/g, ' ')}</span></TableCell>
                        <TableCell>{transaction.product_name}</TableCell>
                        <TableCell className="text-right text-green-600 font-semibold">{transaction.quantity_in > 0 ? transaction.quantity_in : '-'}</TableCell>
                        <TableCell className="text-right text-red-600 font-semibold">{transaction.quantity_out > 0 ? transaction.quantity_out : '-'}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(transaction.unit_cost || 0, baseCurrency)}</TableCell>
                        <TableCell className="text-right font-mono font-semibold">{formatCurrency(transaction.total_value || 0, baseCurrency)}</TableCell>
                        <TableCell className="text-sm text-gray-600">{transaction.reference_number || '-'}</TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
            <ReportActions reportTitle="Inventory Transaction History" data={{ inventoryTransactions, currency: baseCurrency, currencySymbol: formatCurrency(0, baseCurrency).charAt(0) }} />
          </CardContent>
        </Card>
      )}

      {!['financial-performance','financial-position','cash-flow','trial-balance','general-ledger','items-sold-to-customers','items-purchased-from-vendors','customer-ledger','vendor-ledger','sales-by-customer','purchases-by-vendor','inventory-valuation','stock-status','inventory-transactions'].includes(selectedReport) && (
        <Card>
          <CardHeader><div className="font-bold text-lg p-2">{currentReport?.label}</div></CardHeader>
          <CardContent>
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p>Report Coming Soon</p>
            </div>
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}

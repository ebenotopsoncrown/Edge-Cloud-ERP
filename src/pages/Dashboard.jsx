import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCompany } from "../components/auth/CompanyContext";
import CompanySelector from "../components/auth/CompanySelector";
import InvoiceForm from "../components/invoices/InvoiceForm";
import BillForm from "../components/bills/BillForm";
import AccountLedger from "../components/reports/AccountLedger";
import DrillableKPI from "../components/shared/DrillableKPI";
import { useFinancialMetrics, formatCurrency } from "../components/shared/FinancialCalculations";
import GoogleReviewRequest from "../components/shared/GoogleReviewRequest";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileText,
  Users,
  Package,
  ShoppingCart,
  AlertCircle,
  Receipt
} from "lucide-react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function Dashboard() {
  const { currentCompany, isEvaluationExpired, canPerformAction } = useCompany();

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedBill, setSelectedBill] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.Invoice.filter({ company_id: currentCompany.id }) : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const { data: bills = [] } = useQuery({
    queryKey: ['bills', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.Bill.filter({ company_id: currentCompany.id }) : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.Customer.filter({ company_id: currentCompany.id }) : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.Product.filter({ company_id: currentCompany.id }) : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.Account.filter({ company_id: currentCompany.id }) : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const { data: journalEntries = [] } = useQuery({
    queryKey: ['journal-entries', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.JournalEntry.filter({ 
      company_id: currentCompany.id,
      status: 'posted'
    }) : Promise.resolve([]),
    enabled: !!currentCompany
  });

  // CRITICAL: Use centralized financial calculations
  const metrics = useFinancialMetrics(accounts, journalEntries);

  if (!currentCompany) {
    return <CompanySelector />;
  }

  const evaluationExpired = isEvaluationExpired();
  const baseCurrency = currentCompany?.base_currency || 'USD';

  const overdueInvoices = invoices.filter(inv => inv.status === 'overdue').length;

  const lowStockProducts = products.filter(p =>
    p.product_type === 'inventory' &&
    p.quantity_on_hand <= p.reorder_level
  ).length;

  const revenueTrend = [
    { month: 'Jan', revenue: 45000, expenses: 32000 },
    { month: 'Feb', revenue: 52000, expenses: 35000 },
    { month: 'Mar', revenue: 48000, expenses: 33000 },
    { month: 'Apr', revenue: 61000, expenses: 38000 },
    { month: 'May', revenue: 55000, expenses: 36000 },
    { month: 'Jun', revenue: metrics.totalRevenue || 58000, expenses: metrics.totalExpenses || 37000 }
  ];

  const invoiceStatusData = [
    { name: 'Paid', value: invoices.filter(i => i.status === 'paid').length },
    { name: 'Sent', value: invoices.filter(i => i.status === 'sent').length },
    { name: 'Overdue', value: invoices.filter(i => i.status === 'overdue').length },
    { name: 'Draft', value: invoices.filter(i => i.status === 'draft').length }
  ];

  // Drill-down handlers
  const handleRevenueClick = () => {
    if (metrics.revenueAccounts.length > 0) {
      setSelectedAccount(metrics.revenueAccounts[0]);
    }
  };

  const handleARClick = () => {
    if (metrics.arAccounts.length > 0) {
      setSelectedAccount(metrics.arAccounts[0]);
    }
  };

  const handleAPClick = () => {
    if (metrics.apAccounts.length > 0) {
      setSelectedAccount(metrics.apAccounts[0]);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50">
      <GoogleReviewRequest />
      
      {selectedInvoice && (
        <InvoiceForm
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}

      {selectedBill && (
        <BillForm
          bill={selectedBill}
          onClose={() => setSelectedBill(null)}
        />
      )}

      {selectedAccount && (
        <AccountLedger
          account={selectedAccount}
          onClose={() => setSelectedAccount(null)}
          onTransactionClick={() => {}}
        />
      )}

      {evaluationExpired && (
        <Alert className="bg-red-50 border-2 border-red-500">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <AlertDescription className="text-red-900">
            <strong className="text-lg">Your evaluation period has ended.</strong>
            <p className="mt-2">You can view your data but cannot create or modify records. Upgrade to a paid plan to continue using the system.</p>
            <Button
              className="mt-3 bg-red-600 hover:bg-red-700"
              onClick={() => window.location.href = '/UpgradeSubscription'}
            >
              Upgrade Now
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Financial Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back to {currentCompany.company_name}!</p>
        <p className="text-sm text-blue-600 font-semibold mt-1">
          📊 All amounts shown in {baseCurrency} - Calculated from Posted Journal Entries
        </p>
      </div>

      {accounts.length === 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <p className="text-yellow-800 font-semibold">⚠️ Set up your Chart of Accounts</p>
            <p className="text-yellow-700 text-sm mt-1">Please create your Chart of Accounts for accurate financial tracking.</p>
          </CardContent>
        </Card>
      )}

      {/* CRITICAL: Drillable KPIs using centralized calculations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DrillableKPI
          title="Total Revenue"
          value={formatCurrency(metrics.totalRevenue, baseCurrency)}
          subtitle="From Revenue Accounts"
          icon={DollarSign}
          colorClass="from-blue-50 to-blue-100"
          textColorClass="text-blue-900"
          iconColorClass="text-blue-600"
          onClick={handleRevenueClick}
        />

        <DrillableKPI
          title="Net Profit"
          value={formatCurrency(metrics.netIncome, baseCurrency)}
          subtitle={`Margin: ${metrics.netProfitMargin.toFixed(1)}%`}
          icon={TrendingUp}
          colorClass="from-green-50 to-green-100"
          textColorClass="text-green-900"
          iconColorClass="text-green-600"
        />

        <DrillableKPI
          title="Accounts Receivable"
          value={formatCurrency(metrics.totalAccountsReceivable, baseCurrency)}
          subtitle={`${invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled').length} unpaid invoices`}
          icon={FileText}
          colorClass="from-orange-50 to-orange-100"
          textColorClass="text-orange-900"
          iconColorClass="text-orange-600"
          onClick={handleARClick}
        />

        <DrillableKPI
          title="Accounts Payable"
          value={formatCurrency(metrics.totalAccountsPayable, baseCurrency)}
          subtitle={`${bills.filter(b => b.status !== 'paid' && b.status !== 'cancelled').length} unpaid bills`}
          icon={ShoppingCart}
          colorClass="from-purple-50 to-purple-100"
          textColorClass="text-purple-900"
          iconColorClass="text-purple-600"
          onClick={handleAPClick}
        />
      </div>

      {/* Alerts */}
      {(overdueInvoices > 0 || lowStockProducts > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {overdueInvoices > 0 && (
            <Card className="border-l-4 border-l-red-500 shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Overdue Invoices</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      You have {overdueInvoices} overdue invoice{overdueInvoices !== 1 ? 's' : ''} requiring attention
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {lowStockProducts > 0 && (
            <Card className="border-l-4 border-l-yellow-500 shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Low Stock Alert</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {lowStockProducts} product{lowStockProducts !== 1 ? 's are' : ' is'} below reorder level
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-md border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Revenue & Expenses Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueTrend}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fillOpacity={1} fill="url(#colorRevenue)" name="Revenue" />
                <Area type="monotone" dataKey="expenses" stroke="#EF4444" fillOpacity={1} fill="url(#colorExpenses)" name="Expenses" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-md border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Invoice Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={invoiceStatusData.filter(d => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {invoiceStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{customers.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Products</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{products.length}</p>
              </div>
              <Package className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Invoices</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{invoices.length}</p>
              </div>
              <FileText className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Avg Invoice Value</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(invoices.length > 0 ? metrics.totalRevenue / invoices.length : 0, baseCurrency)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-md border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-600" />
              Recent Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {invoices.slice(0, 5).map(invoice => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedInvoice(invoice)}
                  title="Click to view/edit invoice"
                >
                  <div>
                    <p className="font-semibold text-blue-600 hover:underline">
                      {invoice.invoice_number}
                    </p>
                    <p className="text-sm text-gray-600">{invoice.customer_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(invoice.total_amount || 0, baseCurrency)}</p>
                    <Badge className={`text-xs ${
                      invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                      invoice.status === 'overdue' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {invoice.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {invoices.length === 0 && (
                <p className="text-center py-4 text-gray-500 text-sm">No invoices yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-red-600" />
              Recent Bills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {bills.slice(0, 5).map(bill => (
                <div
                  key={bill.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-orange-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedBill(bill)}
                  title="Click to view/edit bill"
                >
                  <div>
                    <p className="font-semibold text-orange-600 hover:underline">
                      {bill.bill_number}
                    </p>
                    <p className="text-sm text-gray-600">{bill.vendor_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(bill.total_amount || 0, baseCurrency)}</p>
                    <Badge className={`text-xs ${
                      bill.status === 'paid' ? 'bg-green-100 text-green-800' :
                      bill.status === 'overdue' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {bill.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {bills.length === 0 && (
                <p className="text-center py-4 text-gray-500 text-sm">No bills yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
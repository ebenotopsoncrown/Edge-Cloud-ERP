
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useCompany } from "../components/auth/CompanyContext";
import AccountLedger from "../components/reports/AccountLedger";
import DrillableKPI from "../components/shared/DrillableKPI";
import { useFinancialMetrics, formatCurrency } from "../components/shared/FinancialCalculations";
import AgedReceivables from "../components/reports/AgedReceivables";
import {
  DollarSign,
  TrendingUp,
  Users,
  FileText,
  Plus,
  Upload,
  ShoppingCart,
  CreditCard,
  RefreshCcw
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function SalesDashboard() {
  const { currentCompany } = useCompany();
  const [selectedAccount, setSelectedAccount] = useState(null);

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.Invoice.filter({ company_id: currentCompany.id }) : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.Customer.filter({ company_id: currentCompany.id }) : Promise.resolve([]),
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

  const baseCurrency = currentCompany?.base_currency || 'USD';

  const pendingInvoices = invoices.filter(inv => 
    ['sent', 'viewed', 'partial'].includes(inv.status)
  ).length;

  const overdueInvoices = invoices.filter(inv => inv.status === 'overdue').length;

  // CRITICAL FIX: Enhanced drill-down handlers with debugging
  const handleRevenueClick = () => {
    console.log('🔍 Revenue Click - Revenue Accounts:', metrics.revenueAccounts);
    if (metrics.revenueAccounts && metrics.revenueAccounts.length > 0) {
      console.log('✅ Opening Revenue Account:', metrics.revenueAccounts[0]);
      setSelectedAccount(metrics.revenueAccounts[0]);
    } else {
      console.warn('❌ No revenue accounts found');
      alert('No revenue accounts found. Please set up your Chart of Accounts.');
    }
  };

  const handleARClick = () => {
    console.log('🔍 AR Click - AR Accounts:', metrics.arAccounts);
    console.log('🔍 All Asset Accounts:', metrics.assetAccounts);
    
    if (metrics.arAccounts && metrics.arAccounts.length > 0) {
      console.log('✅ Opening AR Account:', metrics.arAccounts[0]);
      setSelectedAccount(metrics.arAccounts[0]);
    } else {
      console.warn('❌ No AR accounts found');
      
      // CRITICAL: Try to find ANY account with "receivable" in the name
      const anyARAccount = accounts.find(acc => 
        acc.account_type === 'asset' && 
        acc.account_name?.toLowerCase().includes('receivable')
      );
      
      if (anyARAccount) {
        console.log('✅ Found AR account directly:', anyARAccount);
        setSelectedAccount(anyARAccount);
      } else {
        console.error('❌ No Accounts Receivable account exists in the system');
        alert('No Accounts Receivable account found. Please create an "Accounts Receivable" account in your Chart of Accounts.');
      }
    }
  };

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
        <h1 className="text-3xl font-bold text-gray-900">Sales & Invoicing</h1>
        <p className="text-gray-500 mt-1">Manage your sales operations for {currentCompany?.company_name}</p>
        <p className="text-sm text-blue-600 font-semibold mt-1">
          📊 All amounts shown in {baseCurrency} - Calculated from Posted Journal Entries
        </p>
        <p className="text-xs text-green-600 font-semibold mt-1">
          ✅ Synchronized with Financial Statements in Real-Time
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-2 border-blue-100">
          <CardHeader>
            <CardTitle className="text-lg">Transactions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <Link to={createPageUrl("Invoices")}>
                <FileText className="w-4 h-4 mr-2" />
                New Invoice
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={createPageUrl("SalesReturns")}>
                <RefreshCcw className="w-4 h-4 mr-2" />
                Sales Return
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={createPageUrl("Payments")}>
                <CreditCard className="w-4 h-4 mr-2" />
                Receive Payment
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={createPageUrl("Invoices")}>
                <ShoppingCart className="w-4 h-4 mr-2" />
                Sales Order
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-100">
          <CardHeader>
            <CardTitle className="text-lg">Master Data</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Button asChild className="bg-green-600 hover:bg-green-700">
              <Link to={createPageUrl("Customers")}>
                <Plus className="w-4 h-4 mr-2" />
                New Customer
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={createPageUrl("ImportData")}>
                <Upload className="w-4 h-4 mr-2" />
                Import Customers
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={createPageUrl("Products")}>
                <Plus className="w-4 h-4 mr-2" />
                New Product
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={createPageUrl("ImportData")}>
                <Upload className="w-4 h-4 mr-2" />
                Import Products
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* CRITICAL: Drillable KPIs synchronized with Financial Statements */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <DrillableKPI
          title="Total Sales"
          value={formatCurrency(metrics.totalRevenue, baseCurrency)}
          subtitle="From Revenue Accounts"
          icon={DollarSign}
          colorClass="from-blue-50 to-blue-100"
          textColorClass="text-blue-900"
          iconColorClass="text-blue-600"
          onClick={handleRevenueClick}
        />

        <DrillableKPI
          title="Total Customers"
          value={customers.length}
          subtitle="Active customers"
          icon={Users}
          colorClass="from-green-50 to-green-100"
          textColorClass="text-green-900"
          iconColorClass="text-green-600"
        />

        <DrillableKPI
          title="Accounts Receivable"
          value={formatCurrency(metrics.totalAccountsReceivable, baseCurrency)}
          subtitle={`${pendingInvoices} unpaid invoices`}
          icon={FileText}
          colorClass="from-yellow-50 to-yellow-100"
          textColorClass="text-yellow-900"
          iconColorClass="text-yellow-600"
          onClick={handleARClick}
        />

        <DrillableKPI
          title="Overdue"
          value={overdueInvoices}
          subtitle="Need attention"
          icon={TrendingUp}
          colorClass="from-red-50 to-red-100"
          textColorClass="text-red-900"
          iconColorClass="text-red-600"
        />
      </div>

      {/* Aged Receivables Report */}
      <AgedReceivables invoices={invoices} baseCurrency={baseCurrency} />

      {/* Recent Invoices */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Invoices</CardTitle>
          <Button asChild variant="outline" size="sm">
            <Link to={createPageUrl("Invoices")}>View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p>No invoices yet</p>
              <Button asChild variant="outline" size="sm" className="mt-3">
                <Link to={createPageUrl("Invoices")}>Create First Invoice</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {invoices.slice(0, 5).map(invoice => {
                return (
                  <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-semibold">{invoice.invoice_number}</p>
                      <p className="text-sm text-gray-600">{invoice.customer_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(invoice.total_amount || 0, baseCurrency)}</p>
                      <p className="text-xs text-gray-600">{invoice.status}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

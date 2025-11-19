
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
import AgedPayables from "../components/reports/AgedPayables";
import BillPaymentForm from "../components/purchases/BillPaymentForm";
import {
  DollarSign,
  TrendingDown,
  Building2,
  Receipt,
  Plus,
  Upload,
  ShoppingCart,
  CreditCard,
  Package
} from "lucide-react";

export default function PurchaseDashboard() {
  const { currentCompany } = useCompany();
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showBillPaymentForm, setShowBillPaymentForm] = useState(false);

  const { data: bills = [] } = useQuery({
    queryKey: ['bills', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.Bill.filter({ company_id: currentCompany.id }) : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.Vendor.filter({ company_id: currentCompany.id }) : Promise.resolve([]),
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

  const pendingBills = bills.filter(bill => ['pending', 'partial'].includes(bill.status)).length;
  const overdueBills = bills.filter(bill => bill.status === 'overdue').length;

  // CRITICAL FIX: Drill-down handlers with fallback logic
  const handleExpensesClick = () => {
    console.log('🔍 Expenses Click - Expense Accounts:', metrics.expenseAccounts);
    console.log('🔍 COGS Accounts:', metrics.cogsAccounts);
    
    if (metrics.expenseAccounts && metrics.expenseAccounts.length > 0) {
      console.log('✅ Opening Expense Account:', metrics.expenseAccounts[0]);
      setSelectedAccount(metrics.expenseAccounts[0]);
    } else if (metrics.cogsAccounts && metrics.cogsAccounts.length > 0) {
      console.log('✅ Opening COGS Account:', metrics.cogsAccounts[0]);
      setSelectedAccount(metrics.cogsAccounts[0]);
    } else {
      console.warn('❌ No expense or COGS accounts found');
      
      // CRITICAL: Try to find ANY expense account directly
      const anyExpenseAccount = accounts.find(acc => 
        acc.account_type === 'expense' || acc.account_type === 'cost_of_goods_sold'
      );
      
      if (anyExpenseAccount) {
        console.log('✅ Found expense account directly:', anyExpenseAccount);
        setSelectedAccount(anyExpenseAccount);
      } else {
        console.error('❌ No expense accounts exist in the system');
        alert('No expense accounts found. Please create expense accounts in your Chart of Accounts.');
      }
    }
  };

  const handleAPClick = () => {
    console.log('🔍 AP Click - AP Accounts:', metrics.apAccounts);
    console.log('🔍 All Liability Accounts:', metrics.liabilityAccounts);
    
    if (metrics.apAccounts && metrics.apAccounts.length > 0) {
      console.log('✅ Opening AP Account:', metrics.apAccounts[0]);
      setSelectedAccount(metrics.apAccounts[0]);
    } else {
      console.warn('❌ No AP accounts found');
      
      // CRITICAL: Try to find ANY account with "payable" in the name
      const anyAPAccount = accounts.find(acc => 
        acc.account_type === 'liability' && 
        acc.account_name?.toLowerCase().includes('payable')
      );
      
      if (anyAPAccount) {
        console.log('✅ Found AP account directly:', anyAPAccount);
        setSelectedAccount(anyAPAccount);
      } else {
        console.error('❌ No Accounts Payable account exists in the system');
        alert('No Accounts Payable account found. Please create an "Accounts Payable" account in your Chart of Accounts.');
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

      {showBillPaymentForm && (
        <BillPaymentForm onClose={() => setShowBillPaymentForm(false)} />
      )}

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Purchases & Vendors</h1>
        <p className="text-gray-500 mt-1">Manage your purchasing operations for {currentCompany?.company_name}</p>
        <p className="text-sm text-blue-600 font-semibold mt-1">
          📊 All amounts shown in {baseCurrency} - Calculated from Posted Journal Entries
        </p>
        <p className="text-xs text-green-600 font-semibold mt-1">
          ✅ Synchronized with Financial Statements in Real-Time
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-2 border-orange-100">
          <CardHeader>
            <CardTitle className="text-lg">Transactions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Button asChild className="bg-orange-600 hover:bg-orange-700">
              <Link to={createPageUrl("PurchaseOrders")}>
                <ShoppingCart className="w-4 h-4 mr-2" />
                New PO
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={createPageUrl("ReceiveInventory")}>
                <Package className="w-4 h-4 mr-2" />
                Receive Goods
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={createPageUrl("Bills")}>
                <Receipt className="w-4 h-4 mr-2" />
                New Bill
              </Link>
            </Button>
            <Button 
              variant="outline"
              onClick={() => setShowBillPaymentForm(true)}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Pay Bills
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-100">
          <CardHeader>
            <CardTitle className="text-lg">Master Data</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Button asChild className="bg-purple-600 hover:bg-purple-700">
              <Link to={createPageUrl("Vendors")}>
                <Plus className="w-4 h-4 mr-2" />
                New Vendor
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={createPageUrl("ImportData")}>
                <Upload className="w-4 h-4 mr-2" />
                Import Vendors
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
          title="Total Purchases"
          value={formatCurrency(metrics.totalCOGS + metrics.totalOperatingExpenses, baseCurrency)}
          subtitle="From Expense Accounts"
          icon={DollarSign}
          colorClass="from-orange-50 to-orange-100"
          textColorClass="text-orange-900"
          iconColorClass="text-orange-600"
          onClick={handleExpensesClick}
        />

        <DrillableKPI
          title="Total Vendors"
          value={vendors.length}
          subtitle="Active vendors"
          icon={Building2}
          colorClass="from-purple-50 to-purple-100"
          textColorClass="text-purple-900"
          iconColorClass="text-purple-600"
        />

        <DrillableKPI
          title="Accounts Payable"
          value={formatCurrency(metrics.totalAccountsPayable, baseCurrency)}
          subtitle={`${pendingBills} unpaid bills`}
          icon={Receipt}
          colorClass="from-yellow-50 to-yellow-100"
          textColorClass="text-yellow-900"
          iconColorClass="text-yellow-600"
          onClick={handleAPClick}
        />

        <DrillableKPI
          title="Overdue"
          value={overdueBills}
          subtitle="Need attention"
          icon={TrendingDown}
          colorClass="from-red-50 to-red-100"
          textColorClass="text-red-900"
          iconColorClass="text-red-600"
        />
      </div>

      {/* Aged Payables Report */}
      <AgedPayables bills={bills} baseCurrency={baseCurrency} />

      {/* Recent Bills */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Bills</CardTitle>
          <Button asChild variant="outline" size="sm">
            <Link to={createPageUrl("Bills")}>View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {bills.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Receipt className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p>No bills yet</p>
              <Button asChild variant="outline" size="sm" className="mt-3">
                <Link to={createPageUrl("Bills")}>Create First Bill</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {bills.slice(0, 5).map(bill => (
                <div key={bill.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold">{bill.bill_number}</p>
                    <p className="text-sm text-gray-600">{bill.vendor_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(bill.total_amount || 0, baseCurrency)}</p>
                    <p className="text-xs text-gray-600">{bill.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

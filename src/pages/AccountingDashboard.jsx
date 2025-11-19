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
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  BookOpen,
  FileText,
  Plus,
  Upload,
  CreditCard,
  BarChart3
} from "lucide-react";

export default function AccountingDashboard() {
  const { currentCompany } = useCompany();
  const [selectedAccount, setSelectedAccount] = useState(null);

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

  // Drill-down handlers
  const handleAssetsClick = () => {
    if (metrics.assetAccounts.length > 0) {
      setSelectedAccount(metrics.assetAccounts[0]);
    }
  };

  const handleLiabilitiesClick = () => {
    if (metrics.liabilityAccounts.length > 0) {
      setSelectedAccount(metrics.liabilityAccounts[0]);
    }
  };

  const handleEquityClick = () => {
    if (metrics.equityAccounts.length > 0) {
      setSelectedAccount(metrics.equityAccounts[0]);
    }
  };

  const handleRevenueClick = () => {
    if (metrics.revenueAccounts.length > 0) {
      setSelectedAccount(metrics.revenueAccounts[0]);
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
        <h1 className="text-3xl font-bold text-gray-900">Accounting & General Ledger</h1>
        <p className="text-gray-500 mt-1">Manage your accounting operations for {currentCompany?.company_name}</p>
        <p className="text-sm text-blue-600 font-semibold mt-1">
          📊 All amounts shown in {baseCurrency} - Calculated from Posted Journal Entries
        </p>
        <p className="text-xs text-green-600 font-semibold mt-1">
          ✅ Synchronized with Financial Statements in Real-Time
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-2 border-green-100">
          <CardHeader>
            <CardTitle className="text-lg">Transactions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Button asChild className="bg-green-600 hover:bg-green-700">
              <Link to={createPageUrl("JournalEntries")}>
                <Plus className="w-4 h-4 mr-2" />
                New Journal Entry
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={createPageUrl("Banking")}>
                <CreditCard className="w-4 h-4 mr-2" />
                Bank Transaction
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={createPageUrl("JournalEntries")}>
                <FileText className="w-4 h-4 mr-2" />
                Adjusting Entry
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={createPageUrl("Reports")}>
                <BarChart3 className="w-4 h-4 mr-2" />
                Financial Reports
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-100">
          <CardHeader>
            <CardTitle className="text-lg">Master Data</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <Link to={createPageUrl("ChartOfAccounts")}>
                <Plus className="w-4 h-4 mr-2" />
                New Account
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={createPageUrl("ImportData")}>
                <Upload className="w-4 h-4 mr-2" />
                Import COA
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={createPageUrl("ChartOfAccounts")}>
                <BookOpen className="w-4 h-4 mr-2" />
                Chart of Accounts
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={createPageUrl("AuditTrail")}>
                <FileText className="w-4 h-4 mr-2" />
                Audit Trail
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* CRITICAL: Drillable KPIs synchronized with Financial Statements */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <DrillableKPI
          title="Total Assets"
          value={formatCurrency(metrics.totalAssets, baseCurrency)}
          subtitle={`${metrics.assetAccounts.length} accounts`}
          icon={TrendingUp}
          colorClass="from-blue-50 to-blue-100"
          textColorClass="text-blue-900"
          iconColorClass="text-blue-600"
          onClick={handleAssetsClick}
        />

        <DrillableKPI
          title="Total Liabilities"
          value={formatCurrency(metrics.totalLiabilities, baseCurrency)}
          subtitle={`${metrics.liabilityAccounts.length} accounts`}
          icon={TrendingDown}
          colorClass="from-red-50 to-red-100"
          textColorClass="text-red-900"
          iconColorClass="text-red-600"
          onClick={handleLiabilitiesClick}
        />

        <DrillableKPI
          title="Total Equity"
          value={formatCurrency(metrics.totalEquity, baseCurrency)}
          subtitle={`Includes net income: ${formatCurrency(metrics.netIncome, baseCurrency)}`}
          icon={DollarSign}
          colorClass="from-purple-50 to-purple-100"
          textColorClass="text-purple-900"
          iconColorClass="text-purple-600"
          onClick={handleEquityClick}
        />

        <DrillableKPI
          title="Total Revenue"
          value={formatCurrency(metrics.totalRevenue, baseCurrency)}
          subtitle={`Net Profit: ${formatCurrency(metrics.netIncome, baseCurrency)}`}
          icon={DollarSign}
          colorClass="from-green-50 to-green-100"
          textColorClass="text-green-900"
          iconColorClass="text-green-600"
          onClick={handleRevenueClick}
        />
      </div>

      {/* Balance Sheet Verification */}
      {Math.abs(metrics.balanceSheetCheck) > 0.01 && (
        <Card className="border-2 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-800 font-semibold">⚠️ Balance Sheet Out of Balance</p>
            <p className="text-red-700 text-sm mt-1">
              Difference: {formatCurrency(Math.abs(metrics.balanceSheetCheck), baseCurrency)}
            </p>
            <p className="text-red-600 text-xs mt-2">
              Assets ({formatCurrency(metrics.totalAssets, baseCurrency)}) should equal 
              Liabilities ({formatCurrency(metrics.totalLiabilities, baseCurrency)}) + 
              Equity ({formatCurrency(metrics.totalEquity, baseCurrency)})
            </p>
          </CardContent>
        </Card>
      )}

      {/* Recent Journal Entries */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Journal Entries</CardTitle>
          <Button asChild variant="outline" size="sm">
            <Link to={createPageUrl("JournalEntries")}>View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {journalEntries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p>No journal entries yet</p>
              <Button asChild variant="outline" size="sm" className="mt-3">
                <Link to={createPageUrl("JournalEntries")}>Create First Entry</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {journalEntries.slice(0, 5).map(entry => (
                <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold">{entry.entry_number}</p>
                    <p className="text-sm text-gray-600">{entry.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(entry.total_debits || 0, baseCurrency)}</p>
                    <p className="text-xs text-gray-600">{new Date(entry.entry_date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Summary by Type */}
      <Card>
        <CardHeader>
          <CardTitle>Account Summary by Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Assets</h3>
              <div className="space-y-2">
                {metrics.assetAccounts.slice(0, 5).map(acc => (
                  <div 
                    key={acc.id}
                    className="flex justify-between text-sm cursor-pointer hover:bg-blue-50 p-2 rounded transition-colors"
                    onClick={() => setSelectedAccount(acc)}
                  >
                    <span className="text-gray-600">{acc.account_name}</span>
                    <span className="font-semibold">{formatCurrency(acc.calculatedBalance, baseCurrency)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Liabilities</h3>
              <div className="space-y-2">
                {metrics.liabilityAccounts.slice(0, 5).map(acc => (
                  <div 
                    key={acc.id}
                    className="flex justify-between text-sm cursor-pointer hover:bg-red-50 p-2 rounded transition-colors"
                    onClick={() => setSelectedAccount(acc)}
                  >
                    <span className="text-gray-600">{acc.account_name}</span>
                    <span className="font-semibold">{formatCurrency(acc.calculatedBalance, baseCurrency)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Revenue</h3>
              <div className="space-y-2">
                {metrics.revenueAccounts.slice(0, 5).map(acc => (
                  <div 
                    key={acc.id}
                    className="flex justify-between text-sm cursor-pointer hover:bg-green-50 p-2 rounded transition-colors"
                    onClick={() => setSelectedAccount(acc)}
                  >
                    <span className="text-gray-600">{acc.account_name}</span>
                    <span className="font-semibold">{formatCurrency(acc.calculatedBalance, baseCurrency)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
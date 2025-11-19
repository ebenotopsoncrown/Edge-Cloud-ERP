import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useCompany } from "../components/auth/CompanyContext";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  ArrowRightLeft,
  Plus,
  Receipt,
  Wallet,
  Building2
} from "lucide-react";

// CRITICAL FIX: Currency symbol function
const getCurrencySymbol = (currencyCode) => {
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
};

export default function Banking() {
  const { currentCompany } = useCompany();

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.Account.filter({ company_id: currentCompany.id }) : [],
    enabled: !!currentCompany
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['payments', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.Payment.filter({ company_id: currentCompany.id }) : [],
    enabled: !!currentCompany
  });

  const baseCurrency = currentCompany?.base_currency || 'USD';
  const currencySymbol = getCurrencySymbol(baseCurrency);

  const bankAccounts = accounts.filter(acc => 
    acc.account_type === 'asset' && 
    (acc.account_name?.toLowerCase().includes('cash') || 
     acc.account_name?.toLowerCase().includes('bank'))
  );

  const totalCash = bankAccounts.reduce((sum, acc) => sum + (parseFloat(acc.balance) || 0), 0);

  const receivedPayments = payments.filter(p => p.payment_type === 'received');
  const madePayments = payments.filter(p => p.payment_type === 'made');

  const totalReceived = receivedPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const totalPaid = madePayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Banking & Cash Management</h1>
        <p className="text-gray-500 mt-1">Manage bank accounts, payments, and cash flow</p>
        <p className="text-sm text-blue-600 font-semibold mt-1">
          💰 All amounts shown in {baseCurrency} ({currencySymbol})
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-2 border-green-100">
          <CardHeader>
            <CardTitle className="text-lg">Receipts & Payments</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Button asChild className="bg-green-600 hover:bg-green-700">
              <Link to={createPageUrl("Payments")}>
                <TrendingUp className="w-4 h-4 mr-2" />
                Receive Payment
              </Link>
            </Button>
            <Button asChild className="bg-red-600 hover:bg-red-700">
              <Link to={createPageUrl("Payments")}>
                <TrendingDown className="w-4 h-4 mr-2" />
                Make Payment
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-100">
          <CardHeader>
            <CardTitle className="text-lg">Bank Operations</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Button asChild variant="outline">
              <Link to={createPageUrl("ChartOfAccounts")}>
                <Plus className="w-4 h-4 mr-2" />
                Add Bank Account
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={createPageUrl("Banking")}>
                <ArrowRightLeft className="w-4 h-4 mr-2" />
                Bank Transfer
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={createPageUrl("Banking")}>
                <CreditCard className="w-4 h-4 mr-2" />
                Reconciliation
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={createPageUrl("JournalEntries")}>
                <Receipt className="w-4 h-4 mr-2" />
                Bank Charges
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">Total Cash & Bank</CardTitle>
            <Wallet className="w-8 h-8 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">
              {currencySymbol}{totalCash.toLocaleString(undefined, {minimumFractionDigits: 2})}
            </div>
            <p className="text-xs text-blue-700 mt-2">{bankAccounts.length} accounts</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-900">Money In</CardTitle>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">
              {currencySymbol}{totalReceived.toLocaleString(undefined, {minimumFractionDigits: 2})}
            </div>
            <p className="text-xs text-green-700 mt-2">{receivedPayments.length} receipts</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-red-900">Money Out</CardTitle>
            <TrendingDown className="w-8 h-8 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-900">
              {currencySymbol}{totalPaid.toLocaleString(undefined, {minimumFractionDigits: 2})}
            </div>
            <p className="text-xs text-red-700 mt-2">{madePayments.length} payments</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-purple-900">Net Cash Flow</CardTitle>
            <DollarSign className="w-8 h-8 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900">
              {currencySymbol}{(totalReceived - totalPaid).toLocaleString(undefined, {minimumFractionDigits: 2})}
            </div>
            <p className="text-xs text-purple-700 mt-2">This period</p>
          </CardContent>
        </Card>
      </div>

      {/* Bank Accounts List */}
      <Card>
        <CardHeader>
          <CardTitle>Bank & Cash Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          {bankAccounts.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 mb-4">No bank accounts found</p>
              <Button asChild variant="outline">
                <Link to={createPageUrl("ChartOfAccounts")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Bank Account
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {bankAccounts.map(account => (
                <Card key={account.id} className="bg-gradient-to-br from-gray-50 to-gray-100">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{account.account_name}</h3>
                        <p className="text-sm text-gray-600">{account.account_code}</p>
                      </div>
                      <Building2 className="w-8 h-8 text-gray-400" />
                    </div>
                    <div className="mt-4">
                      <p className="text-sm text-gray-600">Current Balance</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {currencySymbol}{(parseFloat(account.balance) || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import React, { useState } from "react";
import { Bill, Vendor, Account, JournalEntry } from "@/api/entities";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useCompany } from "../components/auth/CompanyContext";
import AccountLedger from "../components/reports/AccountLedger";
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
  Package,
  AlertCircle
} from "lucide-react";

const BILL_STATUS_COLORS = {
  paid:    { bg: '#DCFCE7', color: '#166534' },
  pending: { bg: '#DBEAFE', color: '#1E40AF' },
  partial: { bg: '#FEF9C3', color: '#854D0E' },
  overdue: { bg: '#FEE2E2', color: '#991B1B' },
  draft:   { bg: '#F1F5F9', color: '#475569' },
};

function KpiCard({ title, value, subtitle, icon: Icon, accentColor, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff',
        borderRadius: 14,
        boxShadow: '0 2px 8px rgba(15,43,91,0.06)',
        border: '1px solid #F1F5F9',
        padding: '22px 24px',
        borderTop: `3px solid ${accentColor}`,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 0.15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            {title}
          </p>
          <p style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>
            {value}
          </p>
          {subtitle && (
            <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 6 }}>{subtitle}</p>
          )}
        </div>
        <div style={{
          width: 44, height: 44, borderRadius: 10,
          background: `${accentColor}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
          <Icon size={20} style={{ color: accentColor }} />
        </div>
      </div>
      {onClick && (
        <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 10 }}>Click to view ledger</p>
      )}
    </div>
  );
}

function ActionCard({ title, accentColor, children }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 14,
      boxShadow: '0 2px 8px rgba(15,43,91,0.06)',
      border: '1px solid #F1F5F9',
      borderTop: `3px solid ${accentColor}`,
      padding: '20px 24px',
    }}>
      <p style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 14 }}>{title}</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {children}
      </div>
    </div>
  );
}

function ActionBtn({ to, onClick, primary, color, children }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
    cursor: 'pointer', textDecoration: 'none', border: 'none',
    transition: 'opacity 0.15s',
  };
  const style = primary
    ? { ...base, background: color, color: '#fff' }
    : { ...base, background: '#F8FAFC', color: '#374151', border: '1px solid #E2E8F0' };

  if (onClick) {
    return <button onClick={onClick} style={style}>{children}</button>;
  }
  return <Link to={to} style={style}>{children}</Link>;
}

export default function PurchaseDashboard() {
  const { currentCompany } = useCompany();
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showBillPaymentForm, setShowBillPaymentForm] = useState(false);

  const { data: bills = [] } = useQuery({
    queryKey: ['bills', currentCompany?.id],
    queryFn: () => currentCompany ? Bill.list({ filters: { company_id: currentCompany.id } }) : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors', currentCompany?.id],
    queryFn: () => currentCompany ? Vendor.list({ filters: { company_id: currentCompany.id } }) : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts', currentCompany?.id],
    queryFn: () => currentCompany ? Account.list({ filters: { company_id: currentCompany.id } }) : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const { data: journalEntries = [] } = useQuery({
    queryKey: ['journal-entries', currentCompany?.id],
    queryFn: () => currentCompany ? JournalEntry.list({ filters: {
      company_id: currentCompany.id,
      status: 'posted'
    } }) : Promise.resolve([]),
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
    <div style={{ padding: '28px 32px', background: '#F5F7FA', minHeight: '100%' }}>
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

      {/* Page Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.025em', margin: 0 }}>
          Purchases &amp; Vendors
        </h1>
        <p style={{ fontSize: 14, color: '#64748B', marginTop: 4 }}>
          Manage your purchasing operations for <strong>{currentCompany?.company_name}</strong>
        </p>
        <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 12, fontWeight: 600, color: '#1B4F8A',
            background: '#EFF6FF', padding: '4px 10px', borderRadius: 6
          }}>
            All amounts in {baseCurrency} — from posted journal entries
          </span>
          <span style={{
            fontSize: 12, fontWeight: 600, color: '#00A86B',
            background: '#F0FDF4', padding: '4px 10px', borderRadius: 6
          }}>
            Synced with financial statements in real-time
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 24 }}>
        <KpiCard
          title="Total Purchases"
          value={formatCurrency(metrics.totalCOGS + metrics.totalOperatingExpenses, baseCurrency)}
          subtitle="From expense accounts"
          icon={DollarSign}
          accentColor="#F97316"
          onClick={handleExpensesClick}
        />
        <KpiCard
          title="Total Vendors"
          value={vendors.length}
          subtitle="Active vendors"
          icon={Building2}
          accentColor="#8B5CF6"
        />
        <KpiCard
          title="Accounts Payable"
          value={formatCurrency(metrics.totalAccountsPayable, baseCurrency)}
          subtitle={`${pendingBills} unpaid bills`}
          icon={Receipt}
          accentColor="#F59E0B"
          onClick={handleAPClick}
        />
        <KpiCard
          title="Overdue Bills"
          value={overdueBills}
          subtitle="Need immediate attention"
          icon={AlertCircle}
          accentColor="#EF4444"
        />
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <ActionCard title="Transactions" accentColor="#F97316">
          <ActionBtn to={createPageUrl("PurchaseOrders")} primary color="#F97316">
            <ShoppingCart size={14} /> New PO
          </ActionBtn>
          <ActionBtn to={createPageUrl("ReceiveInventory")}>
            <Package size={14} /> Receive Goods
          </ActionBtn>
          <ActionBtn to={createPageUrl("Bills")}>
            <Receipt size={14} /> New Bill
          </ActionBtn>
          <ActionBtn onClick={() => setShowBillPaymentForm(true)}>
            <CreditCard size={14} /> Pay Bills
          </ActionBtn>
        </ActionCard>

        <ActionCard title="Master Data" accentColor="#8B5CF6">
          <ActionBtn to={createPageUrl("Vendors")} primary color="#8B5CF6">
            <Plus size={14} /> New Vendor
          </ActionBtn>
          <ActionBtn to={createPageUrl("ImportData")}>
            <Upload size={14} /> Import Vendors
          </ActionBtn>
          <ActionBtn to={createPageUrl("Products")}>
            <Plus size={14} /> New Product
          </ActionBtn>
          <ActionBtn to={createPageUrl("ImportData")}>
            <Upload size={14} /> Import Products
          </ActionBtn>
        </ActionCard>
      </div>

      {/* Aged Payables */}
      <div style={{ marginBottom: 24 }}>
        <AgedPayables bills={bills} baseCurrency={baseCurrency} />
      </div>

      {/* Recent Bills */}
      <div style={{
        background: '#fff',
        borderRadius: 14,
        boxShadow: '0 2px 8px rgba(15,43,91,0.06)',
        border: '1px solid #F1F5F9',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid #F1F5F9',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#FAFBFC'
        }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Recent Bills</p>
          <Link
            to={createPageUrl("Bills")}
            style={{
              fontSize: 13, fontWeight: 600, color: '#1B4F8A',
              textDecoration: 'none', padding: '6px 14px',
              border: '1px solid #E2E8F0', borderRadius: 8, background: '#F8FAFC'
            }}
          >
            View All
          </Link>
        </div>

        {bills.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: '#94A3B8' }}>
            <Receipt size={40} style={{ margin: '0 auto 12px', color: '#CBD5E1' }} />
            <p style={{ fontWeight: 600, color: '#64748B' }}>No bills yet</p>
            <Link
              to={createPageUrl("Bills")}
              style={{
                display: 'inline-block', marginTop: 12, fontSize: 13, fontWeight: 600,
                color: '#1B4F8A', textDecoration: 'none', padding: '8px 16px',
                border: '1px solid #1B4F8A', borderRadius: 8
              }}
            >
              Create First Bill
            </Link>
          </div>
        ) : (
          <div style={{ padding: '12px 24px 16px' }}>
            {bills.slice(0, 5).map((bill, i) => {
              const sc = BILL_STATUS_COLORS[bill.status] || BILL_STATUS_COLORS.draft;
              return (
                <div
                  key={bill.id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 0',
                    borderBottom: i < Math.min(bills.length, 5) - 1 ? '1px solid #F1F5F9' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 8,
                      background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Receipt size={16} style={{ color: '#F97316' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{bill.bill_number}</p>
                      <p style={{ fontSize: 13, color: '#64748B' }}>{bill.vendor_name}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{
                      display: 'inline-flex', padding: '3px 10px', borderRadius: 999,
                      fontSize: 12, fontWeight: 600,
                      background: sc.bg, color: sc.color,
                    }}>
                      {bill.status}
                    </span>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', minWidth: 80, textAlign: 'right' }}>
                      {formatCurrency(bill.total_amount || 0, baseCurrency)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

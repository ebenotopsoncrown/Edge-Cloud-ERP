
import React, { useState } from "react";
import { Invoice, Customer, Account, JournalEntry } from "@/api/entities";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import PageShell, { PageHeader } from "../components/shared/PageShell";
import { createPageUrl } from "@/utils";
import { useCompany } from "../components/auth/CompanyContext";
import AccountLedger from "../components/reports/AccountLedger";
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
  RefreshCcw,
  AlertCircle
} from "lucide-react";

const STATUS_COLORS = {
  paid:    { bg: '#DCFCE7', color: '#166534' },
  sent:    { bg: '#DBEAFE', color: '#1E40AF' },
  viewed:  { bg: '#EDE9FE', color: '#5B21B6' },
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
        position: 'relative',
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

export default function SalesDashboard() {
  const { currentCompany } = useCompany();
  const [selectedAccount, setSelectedAccount] = useState(null);

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices', currentCompany?.id],
    queryFn: () => currentCompany ? Invoice.list({ filters: { company_id: currentCompany.id } }) : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers', currentCompany?.id],
    queryFn: () => currentCompany ? Customer.list({ filters: { company_id: currentCompany.id } }) : Promise.resolve([]),
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
    <PageShell>
      {selectedAccount && (
        <AccountLedger
          account={selectedAccount}
          onClose={() => setSelectedAccount(null)}
          onTransactionClick={() => {}}
        />
      )}

      <PageHeader
        title="Sales & Invoicing"
        subtitle={`${currentCompany?.company_name} · ${baseCurrency} · real-time from posted journal entries`}
        icon={FileText}
        accentColor="#1B4F8A"
      />

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 24 }}>
        <KpiCard
          title="Total Sales"
          value={formatCurrency(metrics.totalRevenue, baseCurrency)}
          subtitle="From revenue accounts"
          icon={DollarSign}
          accentColor="#1B4F8A"
          onClick={handleRevenueClick}
        />
        <KpiCard
          title="Total Customers"
          value={customers.length}
          subtitle="Active customers"
          icon={Users}
          accentColor="#00A86B"
        />
        <KpiCard
          title="Accounts Receivable"
          value={formatCurrency(metrics.totalAccountsReceivable, baseCurrency)}
          subtitle={`${pendingInvoices} unpaid invoices`}
          icon={FileText}
          accentColor="#F59E0B"
          onClick={handleARClick}
        />
        <KpiCard
          title="Overdue Invoices"
          value={overdueInvoices}
          subtitle="Need immediate attention"
          icon={AlertCircle}
          accentColor="#EF4444"
        />
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <ActionCard title="Transactions" accentColor="#1B4F8A">
          <ActionBtn to={createPageUrl("Invoices")} primary color="#1B4F8A">
            <FileText size={14} /> New Invoice
          </ActionBtn>
          <ActionBtn to={createPageUrl("SalesReturns")}>
            <RefreshCcw size={14} /> Sales Return
          </ActionBtn>
          <ActionBtn to={createPageUrl("Payments")}>
            <CreditCard size={14} /> Receive Payment
          </ActionBtn>
          <ActionBtn to={createPageUrl("Invoices")}>
            <ShoppingCart size={14} /> Sales Order
          </ActionBtn>
        </ActionCard>

        <ActionCard title="Master Data" accentColor="#00A86B">
          <ActionBtn to={createPageUrl("Customers")} primary color="#00A86B">
            <Plus size={14} /> New Customer
          </ActionBtn>
          <ActionBtn to={createPageUrl("ImportData")}>
            <Upload size={14} /> Import Customers
          </ActionBtn>
          <ActionBtn to={createPageUrl("Products")}>
            <Plus size={14} /> New Product
          </ActionBtn>
          <ActionBtn to={createPageUrl("ImportData")}>
            <Upload size={14} /> Import Products
          </ActionBtn>
        </ActionCard>
      </div>

      {/* Aged Receivables */}
      <div style={{ marginBottom: 24 }}>
        <AgedReceivables invoices={invoices} baseCurrency={baseCurrency} />
      </div>

      {/* Recent Invoices */}
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
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Recent Invoices</p>
          <Link
            to={createPageUrl("Invoices")}
            style={{
              fontSize: 13, fontWeight: 600, color: '#1B4F8A',
              textDecoration: 'none', padding: '6px 14px',
              border: '1px solid #E2E8F0', borderRadius: 8,
              background: '#F8FAFC'
            }}
          >
            View All
          </Link>
        </div>

        {invoices.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: '#94A3B8' }}>
            <FileText size={40} style={{ margin: '0 auto 12px', color: '#CBD5E1' }} />
            <p style={{ fontWeight: 600, color: '#64748B' }}>No invoices yet</p>
            <Link
              to={createPageUrl("Invoices")}
              style={{
                display: 'inline-block', marginTop: 12, fontSize: 13, fontWeight: 600,
                color: '#1B4F8A', textDecoration: 'none', padding: '8px 16px',
                border: '1px solid #1B4F8A', borderRadius: 8
              }}
            >
              Create First Invoice
            </Link>
          </div>
        ) : (
          <div style={{ padding: '12px 24px 16px' }}>
            {invoices.slice(0, 5).map((invoice, i) => {
              const sc = STATUS_COLORS[invoice.status] || STATUS_COLORS.draft;
              return (
                <div
                  key={invoice.id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 0',
                    borderBottom: i < Math.min(invoices.length, 5) - 1 ? '1px solid #F1F5F9' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 8,
                      background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <FileText size={16} style={{ color: '#1B4F8A' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{invoice.invoice_number}</p>
                      <p style={{ fontSize: 13, color: '#64748B' }}>{invoice.customer_name}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{
                      display: 'inline-flex', padding: '3px 10px', borderRadius: 999,
                      fontSize: 12, fontWeight: 600,
                      background: sc.bg, color: sc.color,
                    }}>
                      {invoice.status}
                    </span>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', minWidth: 80, textAlign: 'right' }}>
                      {formatCurrency(invoice.total_amount || 0, baseCurrency)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
}

import React, { useState } from "react";
import { Account, JournalEntry } from "@/api/entities";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useCompany } from "../components/auth/CompanyContext";
import PageShell, { PageHeader } from "../components/shared/PageShell";
import AccountLedger from "../components/reports/AccountLedger";
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
  BarChart3,
  AlertTriangle
} from "lucide-react";

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
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            {title}
          </p>
          <p style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>
            {value}
          </p>
          {subtitle && (
            <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 6 }}>{subtitle}</p>
          )}
        </div>
        <div style={{
          width: 44, height: 44, borderRadius: 10,
          background: `${accentColor}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 12
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

function ActionBtn({ to, primary, color, children }) {
  const style = primary
    ? {
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
        cursor: 'pointer', textDecoration: 'none', background: color, color: '#fff', border: 'none'
      }
    : {
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
        cursor: 'pointer', textDecoration: 'none', background: '#F8FAFC',
        color: '#374151', border: '1px solid #E2E8F0'
      };
  return <Link to={to} style={style}>{children}</Link>;
}

export default function AccountingDashboard() {
  const { currentCompany } = useCompany();
  const [selectedAccount, setSelectedAccount] = useState(null);

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

  const netIncomePositive = metrics.netIncome >= 0;

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
        title="Accounting & General Ledger"
        subtitle={`${currentCompany?.company_name} · ${baseCurrency} · real-time from posted journal entries`}
        icon={BookOpen}
        accentColor="#1B4F8A"
      />

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 24 }}>
        <KpiCard
          title="Total Assets"
          value={formatCurrency(metrics.totalAssets, baseCurrency)}
          subtitle={`${metrics.assetAccounts.length} accounts`}
          icon={TrendingUp}
          accentColor="#1B4F8A"
          onClick={handleAssetsClick}
        />
        <KpiCard
          title="Total Liabilities"
          value={formatCurrency(metrics.totalLiabilities, baseCurrency)}
          subtitle={`${metrics.liabilityAccounts.length} accounts`}
          icon={TrendingDown}
          accentColor="#EF4444"
          onClick={handleLiabilitiesClick}
        />
        <KpiCard
          title="Total Equity"
          value={formatCurrency(metrics.totalEquity, baseCurrency)}
          subtitle={`Net income: ${formatCurrency(metrics.netIncome, baseCurrency)}`}
          icon={DollarSign}
          accentColor="#8B5CF6"
          onClick={handleEquityClick}
        />
        <KpiCard
          title="Total Revenue"
          value={formatCurrency(metrics.totalRevenue, baseCurrency)}
          subtitle={`Net profit: ${formatCurrency(metrics.netIncome, baseCurrency)}`}
          icon={BarChart3}
          accentColor="#00A86B"
          onClick={handleRevenueClick}
        />
      </div>

      {/* Balance Sheet Alert */}
      {Math.abs(metrics.balanceSheetCheck) > 0.01 && (
        <div style={{
          background: '#FEF2F2', borderRadius: 12, border: '1px solid #FECACA',
          borderLeft: '4px solid #EF4444', padding: '16px 20px', marginBottom: 24,
          display: 'flex', gap: 12, alignItems: 'flex-start'
        }}>
          <AlertTriangle size={20} style={{ color: '#EF4444', flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#991B1B' }}>Balance Sheet Out of Balance</p>
            <p style={{ fontSize: 13, color: '#B91C1C', marginTop: 4 }}>
              Difference: {formatCurrency(Math.abs(metrics.balanceSheetCheck), baseCurrency)}
            </p>
            <p style={{ fontSize: 12, color: '#DC2626', marginTop: 4 }}>
              Assets ({formatCurrency(metrics.totalAssets, baseCurrency)}) should equal
              Liabilities ({formatCurrency(metrics.totalLiabilities, baseCurrency)}) +
              Equity ({formatCurrency(metrics.totalEquity, baseCurrency)})
            </p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <ActionCard title="Transactions" accentColor="#00A86B">
          <ActionBtn to={createPageUrl("JournalEntries")} primary color="#00A86B">
            <Plus size={14} /> New Journal Entry
          </ActionBtn>
          <ActionBtn to={createPageUrl("Banking")}>
            <CreditCard size={14} /> Bank Transaction
          </ActionBtn>
          <ActionBtn to={createPageUrl("JournalEntries")}>
            <FileText size={14} /> Adjusting Entry
          </ActionBtn>
          <ActionBtn to={createPageUrl("Reports")}>
            <BarChart3 size={14} /> Financial Reports
          </ActionBtn>
        </ActionCard>

        <ActionCard title="Master Data" accentColor="#1B4F8A">
          <ActionBtn to={createPageUrl("ChartOfAccounts")} primary color="#1B4F8A">
            <Plus size={14} /> New Account
          </ActionBtn>
          <ActionBtn to={createPageUrl("ImportData")}>
            <Upload size={14} /> Import COA
          </ActionBtn>
          <ActionBtn to={createPageUrl("ChartOfAccounts")}>
            <BookOpen size={14} /> Chart of Accounts
          </ActionBtn>
          <ActionBtn to={createPageUrl("AuditTrail")}>
            <FileText size={14} /> Audit Trail
          </ActionBtn>
        </ActionCard>
      </div>

      {/* Recent Journal Entries */}
      <div style={{
        background: '#fff', borderRadius: 14,
        boxShadow: '0 2px 8px rgba(15,43,91,0.06)',
        border: '1px solid #F1F5F9', overflow: 'hidden', marginBottom: 24
      }}>
        <div style={{
          padding: '18px 24px', borderBottom: '1px solid #F1F5F9',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Recent Journal Entries</p>
          <Link
            to={createPageUrl("JournalEntries")}
            style={{
              fontSize: 13, fontWeight: 600, color: '#1B4F8A',
              textDecoration: 'none', padding: '6px 14px',
              border: '1px solid #E2E8F0', borderRadius: 8, background: '#F8FAFC'
            }}
          >
            View All
          </Link>
        </div>

        {journalEntries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: '#94A3B8' }}>
            <BookOpen size={40} style={{ margin: '0 auto 12px', color: '#CBD5E1' }} />
            <p style={{ fontWeight: 600, color: '#64748B' }}>No journal entries yet</p>
            <Link
              to={createPageUrl("JournalEntries")}
              style={{
                display: 'inline-block', marginTop: 12, fontSize: 13, fontWeight: 600,
                color: '#1B4F8A', textDecoration: 'none', padding: '8px 16px',
                border: '1px solid #1B4F8A', borderRadius: 8
              }}
            >
              Create First Entry
            </Link>
          </div>
        ) : (
          <div style={{ padding: '12px 24px 16px' }}>
            {journalEntries.slice(0, 5).map((entry, i) => (
              <div
                key={entry.id}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 0',
                  borderBottom: i < Math.min(journalEntries.length, 5) - 1 ? '1px solid #F1F5F9' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <BookOpen size={16} style={{ color: '#00A86B' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{entry.entry_number}</p>
                    <p style={{ fontSize: 13, color: '#64748B' }}>{entry.description}</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                    {formatCurrency(entry.total_debits || 0, baseCurrency)}
                  </p>
                  <p style={{ fontSize: 12, color: '#94A3B8' }}>
                    {new Date(entry.entry_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Account Summary by Type */}
      <div style={{
        background: '#fff', borderRadius: 14,
        boxShadow: '0 2px 8px rgba(15,43,91,0.06)',
        border: '1px solid #F1F5F9', overflow: 'hidden'
      }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #F1F5F9' }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Account Summary by Type</p>
        </div>
        <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>

          {/* Assets */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#1B4F8A' }} />
              <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assets</p>
            </div>
            {metrics.assetAccounts.slice(0, 5).map(acc => (
              <div
                key={acc.id}
                onClick={() => setSelectedAccount(acc)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '9px 10px', borderRadius: 8, cursor: 'pointer', marginBottom: 2,
                  transition: 'background 0.12s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#EFF6FF'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontSize: 13, color: '#374151' }}>{acc.account_name}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1B4F8A' }}>
                  {formatCurrency(acc.calculatedBalance, baseCurrency)}
                </span>
              </div>
            ))}
          </div>

          {/* Liabilities */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444' }} />
              <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Liabilities</p>
            </div>
            {metrics.liabilityAccounts.slice(0, 5).map(acc => (
              <div
                key={acc.id}
                onClick={() => setSelectedAccount(acc)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '9px 10px', borderRadius: 8, cursor: 'pointer', marginBottom: 2,
                  transition: 'background 0.12s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontSize: 13, color: '#374151' }}>{acc.account_name}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#EF4444' }}>
                  {formatCurrency(acc.calculatedBalance, baseCurrency)}
                </span>
              </div>
            ))}
          </div>

          {/* Revenue */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#00A86B' }} />
              <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Revenue</p>
            </div>
            {metrics.revenueAccounts.slice(0, 5).map(acc => (
              <div
                key={acc.id}
                onClick={() => setSelectedAccount(acc)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '9px 10px', borderRadius: 8, cursor: 'pointer', marginBottom: 2,
                  transition: 'background 0.12s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#F0FDF4'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontSize: 13, color: '#374151' }}>{acc.account_name}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#00A86B' }}>
                  {formatCurrency(acc.calculatedBalance, baseCurrency)}
                </span>
              </div>
            ))}
          </div>

        </div>
      </div>
    </PageShell>
  );
}

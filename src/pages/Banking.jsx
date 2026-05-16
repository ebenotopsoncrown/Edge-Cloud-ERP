import React from "react";
import { Account, Payment } from "@/api/entities";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useCompany } from "../components/auth/CompanyContext";
import {
  DollarSign, TrendingUp, TrendingDown, CreditCard,
  ArrowRightLeft, Plus, Receipt, Wallet, Building2,
} from "lucide-react";
import PageShell, { PageHeader, StatBar, ERPTable, ERPTableRow, ERPTableCell, ActionBtn } from "../components/shared/PageShell";

const getCurrencySymbol = (code) =>
  ({ USD:'$',EUR:'€',GBP:'£',NGN:'₦',ZAR:'R',KES:'KSh',GHS:'₵',CAD:'C$',AUD:'A$',INR:'₹',JPY:'¥',CNY:'¥' }[code] || code);

const fmt = (n, sym) => `${sym}${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Banking() {
  const { currentCompany } = useCompany();

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts', currentCompany?.id],
    queryFn: () => currentCompany ? Account.list({ filters: { company_id: currentCompany.id } }) : [],
    enabled: !!currentCompany,
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['payments', currentCompany?.id],
    queryFn: () => currentCompany ? Payment.list({ filters: { company_id: currentCompany.id } }) : [],
    enabled: !!currentCompany,
  });

  const baseCurrency   = currentCompany?.base_currency || 'USD';
  const currencySymbol = getCurrencySymbol(baseCurrency);

  const bankAccounts     = accounts.filter(acc => acc.account_type === 'asset' && (acc.account_name?.toLowerCase().includes('cash') || acc.account_name?.toLowerCase().includes('bank')));
  const totalCash        = bankAccounts.reduce((s, a) => s + (parseFloat(a.balance) || 0), 0);
  const receivedPayments = payments.filter(p => p.payment_type === 'received');
  const madePayments     = payments.filter(p => p.payment_type === 'made');
  const totalReceived    = receivedPayments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
  const totalPaid        = madePayments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);

  const quickActions = [
    { label: 'Receive Payment', icon: TrendingUp,      href: createPageUrl('Payments'),      color: '#00A86B' },
    { label: 'Make Payment',    icon: TrendingDown,     href: createPageUrl('Payments'),      color: '#EF4444' },
    { label: 'Add Bank Account',icon: Plus,             href: createPageUrl('ChartOfAccounts'), color: '#1B4F8A' },
    { label: 'Bank Transfer',   icon: ArrowRightLeft,   href: createPageUrl('Banking'),       color: '#8B5CF6' },
    { label: 'Reconciliation',  icon: CreditCard,       href: createPageUrl('Banking'),       color: '#F59E0B' },
    { label: 'Bank Charges',    icon: Receipt,          href: createPageUrl('JournalEntries'),color: '#64748B' },
  ];

  const ACCT_HEADERS = [
    { label: 'Account Code' }, { label: 'Account Name' }, { label: `Balance (${baseCurrency})`, right: true },
  ];

  return (
    <PageShell>
      <PageHeader
        title="Banking & Cash Management"
        subtitle={`${baseCurrency} · ${bankAccounts.length} bank / cash accounts`}
        icon={DollarSign}
        accentColor="#1B4F8A"
      />

      <StatBar stats={[
        { label: 'Total Cash & Bank', value: fmt(totalCash, currencySymbol),                  icon: Wallet,      color: '#1B4F8A' },
        { label: 'Money In',          value: fmt(totalReceived, currencySymbol),               icon: TrendingUp,  color: '#00A86B' },
        { label: 'Money Out',         value: fmt(totalPaid, currencySymbol),                   icon: TrendingDown,color: '#EF4444' },
        { label: 'Net Cash Flow',     value: fmt(totalReceived - totalPaid, currencySymbol),   icon: DollarSign,  color: '#8B5CF6' },
        { label: 'Accounts',          value: bankAccounts.length,                              icon: Building2,   color: '#64748B' },
      ]} />

      {/* Quick Actions */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94A3B8', marginBottom: 10 }}>Quick Actions</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {quickActions.map((qa, i) => (
            <Link key={i} to={qa.href} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px',
                background: 'white', border: '1.5px solid #E2E8F0', borderRadius: 9,
                fontSize: 13.5, fontWeight: 600, color: qa.color, cursor: 'pointer',
                transition: 'border-color 150ms, box-shadow 150ms',
                boxShadow: '0 1px 3px rgba(15,43,91,0.05)',
              }}>
                <qa.icon style={{ width: 15, height: 15 }} />
                {qa.label}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Bank Accounts Table */}
      <div style={{ marginBottom: 8 }}>
        <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94A3B8', marginBottom: 10 }}>Bank & Cash Accounts</p>
      </div>

      <ERPTable headers={ACCT_HEADERS} emptyIcon={Building2} emptyTitle="No bank accounts found" emptyDesc="Add a bank account via Chart of Accounts.">
        {bankAccounts.map(account => (
          <ERPTableRow key={account.id}>
            <ERPTableCell muted style={{ fontFamily: 'monospace' }}>{account.account_code}</ERPTableCell>
            <ERPTableCell bold>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: '#EBF4FB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 style={{ width: 14, height: 14, color: '#1B4F8A' }} />
                </div>
                {account.account_name}
              </div>
            </ERPTableCell>
            <ERPTableCell right bold style={{ color: parseFloat(account.balance) < 0 ? '#EF4444' : '#0F172A', fontSize: 15 }}>
              {fmt(parseFloat(account.balance) || 0, currencySymbol)}
            </ERPTableCell>
          </ERPTableRow>
        ))}
      </ERPTable>

      {/* Total Row */}
      {bankAccounts.length > 0 && (
        <div style={{ background: '#1B4F8A', borderRadius: 10, padding: '14px 20px', marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>Total Cash &amp; Bank Position</span>
          <span style={{ color: 'white', fontWeight: 800, fontSize: 20, fontFamily: 'monospace' }}>{fmt(totalCash, currencySymbol)}</span>
        </div>
      )}
    </PageShell>
  );
}

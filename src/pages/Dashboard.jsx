import React, { useState } from "react";
import { Invoice, Bill, Customer, Product, Account, JournalEntry } from "@/api/entities";
import { useQuery } from "@tanstack/react-query";
import { useCompany } from "../components/auth/CompanyContext";
import CompanySelector from "../components/auth/CompanySelector";
import InvoiceForm from "../components/invoices/InvoiceForm";
import BillForm from "../components/bills/BillForm";
import AccountLedger from "../components/reports/AccountLedger";
import DrillableKPI from "../components/shared/DrillableKPI";
import { useFinancialMetrics, formatCurrency } from "../components/shared/FinancialCalculations";
import GoogleReviewRequest from "../components/shared/GoogleReviewRequest";
import {
  DollarSign, TrendingUp, TrendingDown, FileText, Users, Package,
  ShoppingCart, AlertCircle, Receipt, ArrowUpRight, ArrowDownRight,
  MoreHorizontal, RefreshCw, ChevronRight, Clock, CheckCircle2,
  XCircle, Zap,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import PageShell, { PageHeader } from "../components/shared/PageShell";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

// ── Brand colors ────────────────────────────────────────────
const PRIMARY   = '#2E7DE8';
const ACCENT    = '#00A86B';
const COLORS    = [PRIMARY, ACCENT, '#F59E0B', '#EF4444', '#8B5CF6'];

// ── Custom tooltip for charts ────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'white', border: '1px solid #E2E8F0', borderRadius: 10,
      padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
      fontSize: 13,
    }}>
      <p style={{ color: '#64748B', fontWeight: 600, marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
          <span style={{ color: '#475569', fontWeight: 500 }}>{p.name}:</span>
          <span style={{ color: '#0F172A', fontWeight: 700 }}>
            {typeof p.value === 'number' ? `$${p.value.toLocaleString()}` : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── KPI Card ────────────────────────────────────────────────
function KPICard({ title, value, subtitle, icon: Icon, accentColor = PRIMARY, trend, trendLabel, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'white', borderRadius: 14, padding: '22px 24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        border: '1px solid #E8EDF5', cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 200ms, box-shadow 200ms', position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => { if (onClick) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; }}}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; }}
    >
      {/* Top accent bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: accentColor }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <p style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94A3B8' }}>
          {title}
        </p>
        <div style={{
          width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `${accentColor}14`,
        }}>
          <Icon style={{ width: 18, height: 18, color: accentColor }} />
        </div>
      </div>

      <p style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.025em', lineHeight: 1.1, marginBottom: 8 }}>
        {value}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: 12.5, color: '#64748B' }}>{subtitle}</p>
        {trend !== undefined && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            fontSize: 11.5, fontWeight: 700, padding: '3px 8px', borderRadius: 99,
            background: trend >= 0 ? '#E6F9F2' : '#FEF2F2',
            color: trend >= 0 ? '#00875A' : '#DC2626',
          }}>
            {trend >= 0
              ? <ArrowUpRight style={{ width: 12, height: 12 }} />
              : <ArrowDownRight style={{ width: 12, height: 12 }} />}
            {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}

// ── Status badge ─────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = {
    paid:      { bg: '#E6F9F2', color: '#00875A', label: 'Paid' },
    sent:      { bg: '#DBEAFE', color: '#2563EB', label: 'Sent' },
    overdue:   { bg: '#FEF2F2', color: '#DC2626', label: 'Overdue' },
    draft:     { bg: '#F8FAFC', color: '#64748B', label: 'Draft' },
    partial:   { bg: '#FEF3C7', color: '#B45309', label: 'Partial' },
    cancelled: { bg: '#F1F5F9', color: '#94A3B8', label: 'Cancelled' },
  }[status] || { bg: '#F1F5F9', color: '#64748B', label: status };

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 9px', borderRadius: 99, fontSize: 11.5, fontWeight: 600,
      background: cfg.bg, color: cfg.color,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.color }} />
      {cfg.label}
    </span>
  );
}

// ── Section header ────────────────────────────────────────────
function SectionHeader({ title, icon: Icon, action, actionUrl }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 28, height: 28, background: '#EFF6FF', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon style={{ width: 14, height: 14, color: PRIMARY }} />
        </div>
        <h2 style={{ fontSize: 14.5, fontWeight: 700, color: '#0F172A' }}>{title}</h2>
      </div>
      {action && (
        <Link
          to={actionUrl}
          style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12.5, color: PRIMARY, fontWeight: 600, textDecoration: 'none' }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          {action} <ChevronRight style={{ width: 13, height: 13 }} />
        </Link>
      )}
    </div>
  );
}

// ── Card wrapper ──────────────────────────────────────────────
function Card({ children, style = {} }) {
  return (
    <div style={{
      background: 'white', borderRadius: 12, padding: 24,
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      border: '1px solid #E8EDF5', ...style,
    }}>
      {children}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────
export default function Dashboard() {
  const { currentCompany, isEvaluationExpired, canPerformAction } = useCompany();
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedBill, setSelectedBill]       = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);

  const { data: invoices       = [] } = useQuery({ queryKey: ['invoices',        currentCompany?.id], queryFn: () => currentCompany ? Invoice.list({ filters: { company_id: currentCompany.id } }) : [], enabled: !!currentCompany });
  const { data: bills          = [] } = useQuery({ queryKey: ['bills',           currentCompany?.id], queryFn: () => currentCompany ? Bill.list({ filters: { company_id: currentCompany.id } }) : [], enabled: !!currentCompany });
  const { data: customers      = [] } = useQuery({ queryKey: ['customers',       currentCompany?.id], queryFn: () => currentCompany ? Customer.list({ filters: { company_id: currentCompany.id } }) : [], enabled: !!currentCompany });
  const { data: products       = [] } = useQuery({ queryKey: ['products',        currentCompany?.id], queryFn: () => currentCompany ? Product.list({ filters: { company_id: currentCompany.id } }) : [], enabled: !!currentCompany });
  const { data: accounts       = [] } = useQuery({ queryKey: ['accounts',        currentCompany?.id], queryFn: () => currentCompany ? Account.list({ filters: { company_id: currentCompany.id } }) : [], enabled: !!currentCompany });
  const { data: journalEntries = [] } = useQuery({ queryKey: ['journal-entries', currentCompany?.id], queryFn: () => currentCompany ? JournalEntry.list({ filters: { company_id: currentCompany.id, status: 'posted' } }) : [], enabled: !!currentCompany });

  const metrics = useFinancialMetrics(accounts, journalEntries);

  if (!currentCompany) return <CompanySelector />;

  const baseCurrency = currentCompany?.base_currency || 'USD';
  const evaluationExpired = isEvaluationExpired();
  const overdueInvoices   = invoices.filter(i => i.status === 'overdue').length;
  const lowStockProducts  = products.filter(p => p.product_type === 'inventory' && p.quantity_on_hand <= p.reorder_level).length;
  const paidInvoices      = invoices.filter(i => i.status === 'paid').length;

  const revenueTrend = [
    { month: 'Jan', Revenue: 45000, Expenses: 32000 },
    { month: 'Feb', Revenue: 52000, Expenses: 35000 },
    { month: 'Mar', Revenue: 48000, Expenses: 33000 },
    { month: 'Apr', Revenue: 61000, Expenses: 38000 },
    { month: 'May', Revenue: 55000, Expenses: 36000 },
    { month: 'Jun', Revenue: Math.max(metrics.totalRevenue, 58000), Expenses: Math.max(metrics.totalExpenses, 37000) },
  ];

  const invoiceStatusData = [
    { name: 'Paid',    value: paidInvoices },
    { name: 'Sent',    value: invoices.filter(i => i.status === 'sent').length },
    { name: 'Overdue', value: overdueInvoices },
    { name: 'Draft',   value: invoices.filter(i => i.status === 'draft').length },
  ].filter(d => d.value > 0);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <PageShell>
      <GoogleReviewRequest />

      {/* Modals */}
      {selectedInvoice && <InvoiceForm invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />}
      {selectedBill    && <BillForm    bill={selectedBill}       onClose={() => setSelectedBill(null)} />}
      {selectedAccount && <AccountLedger account={selectedAccount} onClose={() => setSelectedAccount(null)} onTransactionClick={() => {}} />}

      <PageHeader
        title="Financial Dashboard"
        subtitle={`Welcome back · ${currentCompany.company_name} · ${today}`}
        icon={DollarSign}
        accentColor="#2E7DE8"
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link to={createPageUrl("Invoices")}>
              <button style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: '#EFF6FF', color: PRIMARY, border: '1px solid #BFDBFE', borderRadius: 8, fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>
                <FileText style={{ width: 15, height: 15 }} /> New Invoice
              </button>
            </Link>
            <Link to={createPageUrl("Bills")}>
              <button style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: PRIMARY, color: 'white', border: 'none', borderRadius: 9, fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>
                <Receipt style={{ width: 15, height: 15 }} /> New Bill
              </button>
            </Link>
          </div>
        }
      />

      {/* ── Evaluation expired banner ── */}
      {evaluationExpired && (
        <div style={{ background: '#FEF2F2', border: '1.5px solid #FCA5A5', borderRadius: 12, padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{ width: 36, height: 36, background: '#FEE2E2', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertCircle style={{ width: 18, height: 18, color: '#EF4444' }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14.5, fontWeight: 700, color: '#991B1B', marginBottom: 4 }}>Evaluation Period Ended</p>
            <p style={{ fontSize: 13, color: '#B91C1C', lineHeight: 1.5 }}>You can view your data but cannot create or modify records. Upgrade to continue using the system.</p>
          </div>
          <Link to={createPageUrl("UpgradeSubscription")}>
            <button style={{ padding: '8px 18px', background: '#EF4444', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Upgrade Now
            </button>
          </Link>
        </div>
      )}

      {/* ── Chart of Accounts warning ── */}
      {accounts.length === 0 && (
        <div style={{ background: '#FEF3C7', border: '1.5px solid #FCD34D', borderRadius: 12, padding: '14px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
          <AlertCircle style={{ width: 18, height: 18, color: '#B45309', flexShrink: 0 }} />
          <div>
            <span style={{ fontWeight: 700, color: '#92400E', fontSize: 13.5 }}>Set up your Chart of Accounts — </span>
            <span style={{ color: '#B45309', fontSize: 13 }}>Create accounts for accurate financial tracking.</span>
          </div>
          <Link to={createPageUrl("ChartOfAccounts")} style={{ marginLeft: 'auto' }}>
            <button style={{ padding: '6px 14px', background: '#F59E0B', color: 'white', border: 'none', borderRadius: 7, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Set Up Now
            </button>
          </Link>
        </div>
      )}

      {/* ── KPI Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 24 }}>
        <KPICard
          title="Total Revenue"
          value={formatCurrency(metrics.totalRevenue, baseCurrency)}
          subtitle="From revenue accounts"
          icon={DollarSign}
          accentColor={PRIMARY}
          trend={8.2}
          onClick={() => metrics.revenueAccounts.length > 0 && setSelectedAccount(metrics.revenueAccounts[0])}
        />
        <KPICard
          title="Net Profit"
          value={formatCurrency(metrics.netIncome, baseCurrency)}
          subtitle={`Margin: ${metrics.netProfitMargin.toFixed(1)}%`}
          icon={TrendingUp}
          accentColor={ACCENT}
          trend={metrics.netProfitMargin}
        />
        <KPICard
          title="Accounts Receivable"
          value={formatCurrency(metrics.totalAccountsReceivable, baseCurrency)}
          subtitle={`${invoices.filter(i => !['paid','cancelled'].includes(i.status)).length} unpaid invoices`}
          icon={FileText}
          accentColor="#F59E0B"
          onClick={() => metrics.arAccounts.length > 0 && setSelectedAccount(metrics.arAccounts[0])}
        />
        <KPICard
          title="Accounts Payable"
          value={formatCurrency(metrics.totalAccountsPayable, baseCurrency)}
          subtitle={`${bills.filter(b => !['paid','cancelled'].includes(b.status)).length} unpaid bills`}
          icon={Receipt}
          accentColor="#8B5CF6"
          onClick={() => metrics.apAccounts.length > 0 && setSelectedAccount(metrics.apAccounts[0])}
        />
      </div>

      {/* ── Alerts row ── */}
      {(overdueInvoices > 0 || lowStockProducts > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 24 }}>
          {overdueInvoices > 0 && (
            <div style={{ background: '#FEF2F2', border: '1.5px solid #FCA5A5', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, background: 'white', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                <AlertCircle style={{ width: 18, height: 18, color: '#EF4444' }} />
              </div>
              <div>
                <p style={{ fontSize: 13.5, fontWeight: 700, color: '#991B1B' }}>Overdue Invoices</p>
                <p style={{ fontSize: 12.5, color: '#B91C1C', marginTop: 2 }}>
                  {overdueInvoices} invoice{overdueInvoices !== 1 ? 's' : ''} need{overdueInvoices === 1 ? 's' : ''} attention
                </p>
              </div>
              <Link to={createPageUrl("Invoices")} style={{ marginLeft: 'auto' }}>
                <button style={{ padding: '5px 12px', background: 'white', color: '#EF4444', border: '1.5px solid #FCA5A5', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  View
                </button>
              </Link>
            </div>
          )}
          {lowStockProducts > 0 && (
            <div style={{ background: '#FEF3C7', border: '1.5px solid #FCD34D', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, background: 'white', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                <Package style={{ width: 18, height: 18, color: '#F59E0B' }} />
              </div>
              <div>
                <p style={{ fontSize: 13.5, fontWeight: 700, color: '#92400E' }}>Low Stock Alert</p>
                <p style={{ fontSize: 12.5, color: '#B45309', marginTop: 2 }}>
                  {lowStockProducts} product{lowStockProducts !== 1 ? 's are' : ' is'} below reorder level
                </p>
              </div>
              <Link to={createPageUrl("Products")} style={{ marginLeft: 'auto' }}>
                <button style={{ padding: '5px 12px', background: 'white', color: '#B45309', border: '1.5px solid #FCD34D', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  View
                </button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ── Charts row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Revenue & Expenses trend */}
        <Card>
          <SectionHeader title="Revenue & Expenses Trend" icon={TrendingUp} action="View Reports" actionUrl={createPageUrl("Reports")} />
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenueTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={PRIMARY} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={PRIMARY} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#EF4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="month" stroke="#CBD5E1" tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#CBD5E1" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#64748B', paddingTop: 8 }} />
              <Area type="monotone" dataKey="Revenue" stroke={PRIMARY} strokeWidth={2.5} fillOpacity={1} fill="url(#gRevenue)" dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
              <Area type="monotone" dataKey="Expenses" stroke="#EF4444" strokeWidth={2.5} fillOpacity={1} fill="url(#gExpenses)" dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Invoice Status donut */}
        <Card>
          <SectionHeader title="Invoice Status" icon={FileText} action="View All" actionUrl={createPageUrl("Invoices")} />
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={invoiceStatusData}
                cx="50%" cy="50%"
                innerRadius={55} outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {invoiceStatusData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', marginTop: 8, justifyContent: 'center' }}>
            {invoiceStatusData.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: COLORS[i % COLORS.length] }} />
                <span style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Summary stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Customers', value: customers.length, icon: Users,    color: PRIMARY },
          { label: 'Total Products',  value: products.length,  icon: Package,  color: ACCENT },
          { label: 'Total Invoices',  value: invoices.length,  icon: FileText, color: '#F59E0B' },
          {
            label: 'Avg Invoice Value',
            value: formatCurrency(invoices.length > 0 ? metrics.totalRevenue / invoices.length : 0, baseCurrency),
            icon: DollarSign,
            color: '#8B5CF6',
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} style={{ background: 'white', borderRadius: 12, padding: '18px 20px', border: '1px solid #E8EDF5', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', marginTop: 4, letterSpacing: '-0.02em' }}>{value}</p>
            </div>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: `${color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon style={{ width: 20, height: 20, color }} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Recent transactions ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
        {/* Recent Invoices */}
        <Card>
          <SectionHeader title="Recent Invoices" icon={FileText} action="View All" actionUrl={createPageUrl("Invoices")} />
          <div>
            {invoices.slice(0, 5).map((invoice, idx) => (
              <div
                key={invoice.id}
                onClick={() => setSelectedInvoice(invoice)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '11px 14px', marginBottom: 4, borderRadius: 10, cursor: 'pointer',
                  background: idx % 2 === 0 ? '#F8FAFC' : 'white',
                  border: '1px solid #E8EDF5', transition: 'all 150ms',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#EFF6FF'; e.currentTarget.style.borderColor = '#BFDBFE'; }}
                onMouseLeave={e => { e.currentTarget.style.background = idx % 2 === 0 ? '#F8FAFC' : 'white'; e.currentTarget.style.borderColor = '#E8EDF5'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, background: '#EFF6FF', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FileText style={{ width: 14, height: 14, color: PRIMARY }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 13.5, fontWeight: 700, color: PRIMARY }}>{invoice.invoice_number}</p>
                    <p style={{ fontSize: 12, color: '#64748B', marginTop: 1 }}>{invoice.customer_name}</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A' }}>{formatCurrency(invoice.total_amount || 0, baseCurrency)}</p>
                  <StatusBadge status={invoice.status} />
                </div>
              </div>
            ))}
            {invoices.length === 0 && (
              <div style={{ textAlign: 'center', padding: '28px 0', color: '#94A3B8' }}>
                <FileText style={{ width: 32, height: 32, margin: '0 auto 8px', opacity: 0.4 }} />
                <p style={{ fontSize: 13.5, fontWeight: 500 }}>No invoices yet</p>
              </div>
            )}
          </div>
        </Card>

        {/* Recent Bills */}
        <Card>
          <SectionHeader title="Recent Bills" icon={Receipt} action="View All" actionUrl={createPageUrl("Bills")} />
          <div>
            {bills.slice(0, 5).map((bill, idx) => (
              <div
                key={bill.id}
                onClick={() => setSelectedBill(bill)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '11px 14px', marginBottom: 4, borderRadius: 10, cursor: 'pointer',
                  background: idx % 2 === 0 ? '#F8FAFC' : 'white',
                  border: '1px solid #E8EDF5', transition: 'all 150ms',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#FFFBEB'; e.currentTarget.style.borderColor = '#FDE68A'; }}
                onMouseLeave={e => { e.currentTarget.style.background = idx % 2 === 0 ? '#F8FAFC' : 'white'; e.currentTarget.style.borderColor = '#E8EDF5'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, background: '#FEF3C7', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Receipt style={{ width: 14, height: 14, color: '#B45309' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 13.5, fontWeight: 700, color: '#B45309' }}>{bill.bill_number}</p>
                    <p style={{ fontSize: 12, color: '#64748B', marginTop: 1 }}>{bill.vendor_name}</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A' }}>{formatCurrency(bill.total_amount || 0, baseCurrency)}</p>
                  <StatusBadge status={bill.status} />
                </div>
              </div>
            ))}
            {bills.length === 0 && (
              <div style={{ textAlign: 'center', padding: '28px 0', color: '#94A3B8' }}>
                <Receipt style={{ width: 32, height: 32, margin: '0 auto 8px', opacity: 0.4 }} />
                <p style={{ fontSize: 13.5, fontWeight: 500 }}>No bills yet</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </PageShell>
  );
}

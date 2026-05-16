import React from "react";
import { Job, JobCost } from "@/api/entities";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useCompany } from "../components/auth/CompanyContext";
import { Briefcase, Plus, Upload, Clock, DollarSign, TrendingUp, FileText } from "lucide-react";
import PageShell, { PageHeader, StatBar, ERPTable, ERPTableRow, ERPTableCell, StatusBadge, ActionBtn } from "../components/shared/PageShell";

const CURRENCY_SYMBOLS = { USD:'$',EUR:'€',GBP:'£',NGN:'₦',ZAR:'R',KES:'KSh',GHS:'₵',CAD:'C$',AUD:'A$',INR:'₹',JPY:'¥',CNY:'¥' };
const getCurrencySymbol = (code) => CURRENCY_SYMBOLS[code] || code;
const fmt = (n, sym = '$') => `${sym}${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const ACCENT = '#7C3AED';

export default function JobCostingDashboard() {
  const { currentCompany } = useCompany();
  const sym = getCurrencySymbol(currentCompany?.base_currency || 'USD');

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs', currentCompany?.id],
    queryFn: () => currentCompany ? Job.list({ filters: { company_id: currentCompany.id } }) : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const { data: jobCosts = [] } = useQuery({
    queryKey: ['job-costs', currentCompany?.id],
    queryFn: () => currentCompany ? JobCost.list({ filters: { company_id: currentCompany.id } }) : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const activeJobs      = jobs.filter(j => j.status === 'in_progress').length;
  const completedJobs   = jobs.filter(j => j.status === 'completed').length;
  const totalContractValue = jobs.filter(j => j.status !== 'cancelled').reduce((s, j) => s + (parseFloat(j.contract_amount) || 0), 0);
  const totalCosts      = jobs.reduce((s, j) => s + (parseFloat(j.actual_cost) || 0), 0);
  const totalProfit     = totalContractValue - totalCosts;
  const profitMargin    = totalContractValue ? ((totalProfit / totalContractValue) * 100).toFixed(1) : '0.0';

  const quickActions = [
    { label: 'Record Job Cost', icon: Plus,      color: ACCENT },
    { label: 'Time Sheet',      icon: Clock,     color: '#1B4F8A' },
    { label: 'Job Invoice',     icon: FileText,  color: '#00A86B' },
    { label: 'Job Report',      icon: TrendingUp,color: '#F59E0B' },
    { label: 'New Job',         icon: Plus,      color: ACCENT },
    { label: 'Import Jobs',     icon: Upload,    color: '#64748B' },
    { label: 'Cost Codes',      icon: DollarSign,color: '#EF4444' },
    { label: 'Phases',          icon: Briefcase, color: '#8B5CF6' },
  ];

  const HEADERS = [{ label: 'Job #' }, { label: 'Job Name' }, { label: 'Customer' }, { label: 'Contract', right: true }, { label: 'Actual Cost', right: true }, { label: 'Profit', right: true }, { label: 'Complete' }, { label: 'Status' }];
  const activeJobsList = jobs.filter(j => j.status === 'in_progress');

  return (
    <PageShell>
      <PageHeader
        title="Job Costing"
        subtitle={`Track project costs & profitability · ${currentCompany?.base_currency || 'USD'} (${sym})`}
        icon={Briefcase}
        accentColor={ACCENT}
        actions={
          <Link to={createPageUrl('JobCosting')} style={{ textDecoration: 'none' }}>
            <button style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', border: 'none', borderRadius: 8, background: ACCENT, color: 'white', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              <Plus style={{ width: 15, height: 15 }} />
              New Job
            </button>
          </Link>
        }
      />

      <StatBar stats={[
        { label: 'Active Jobs',      value: activeJobs,              icon: Briefcase,  color: ACCENT },
        { label: 'Completed',        value: completedJobs,           color: '#00A86B' },
        { label: 'Contract Value',   value: fmt(totalContractValue, sym), icon: DollarSign, color: '#1B4F8A' },
        { label: 'Total Costs',      value: fmt(totalCosts, sym),    icon: TrendingUp, color: '#EF4444' },
        { label: totalProfit >= 0 ? 'Total Profit' : 'Total Loss',
          value: fmt(Math.abs(totalProfit), sym),
          color: totalProfit >= 0 ? '#00A86B' : '#EF4444' },
        { label: 'Margin',           value: `${profitMargin}%`,      color: '#F59E0B' },
      ]} />

      {/* Quick Actions */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94A3B8', marginBottom: 10 }}>Quick Actions</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {quickActions.map((qa, i) => (
            <Link key={i} to={createPageUrl('JobCosting')} style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', background: 'white', border: '1.5px solid #E2E8F0', borderRadius: 9, fontSize: 13.5, fontWeight: 600, color: qa.color, boxShadow: '0 1px 3px rgba(15,43,91,0.05)' }}>
                <qa.icon style={{ width: 15, height: 15 }} />
                {qa.label}
              </div>
            </Link>
          ))}
        </div>
      </div>

      <ERPTable headers={HEADERS} emptyIcon={Briefcase} emptyTitle="No active jobs" emptyDesc="Create your first job to start tracking costs.">
        {activeJobsList.map(job => {
          const profit = (parseFloat(job.contract_amount) || 0) - (parseFloat(job.actual_cost) || 0);
          return (
            <ERPTableRow key={job.id}>
              <ERPTableCell style={{ fontFamily: 'monospace', fontSize: 12.5, color: ACCENT, fontWeight: 700 }}>{job.job_number}</ERPTableCell>
              <ERPTableCell bold>{job.job_name}</ERPTableCell>
              <ERPTableCell muted>{job.customer_name || '—'}</ERPTableCell>
              <ERPTableCell right bold>{fmt(job.contract_amount, sym)}</ERPTableCell>
              <ERPTableCell right muted>{fmt(job.actual_cost, sym)}</ERPTableCell>
              <ERPTableCell right bold style={{ color: profit >= 0 ? '#00A86B' : '#EF4444' }}>
                {profit >= 0 ? '' : '-'}{fmt(Math.abs(profit), sym)}
              </ERPTableCell>
              <ERPTableCell>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ flex: 1, height: 6, background: '#F1F5F9', borderRadius: 3, overflow: 'hidden', minWidth: 50 }}>
                    <div style={{ width: `${job.percent_complete || 0}%`, height: '100%', background: ACCENT, borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600, flexShrink: 0 }}>{job.percent_complete || 0}%</span>
                </div>
              </ERPTableCell>
              <ERPTableCell><StatusBadge status={job.status || 'in_progress'} /></ERPTableCell>
            </ERPTableRow>
          );
        })}
      </ERPTable>
    </PageShell>
  );
}

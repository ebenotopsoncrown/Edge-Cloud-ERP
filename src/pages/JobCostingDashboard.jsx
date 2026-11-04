import React from "react";
import { useMoney } from "@/components/shared/useMoney";
import { getCurrencySymbol } from "@/components/shared/FinancialCalculations";
import { Job, JobCost } from "@/api/entities";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useCompany } from "../components/auth/CompanyContext";
import { Briefcase, Plus, Upload, Clock, Banknote, TrendingUp, FileText } from "lucide-react";
import PageShell, { PageHeader, StatBar, ERPTable, ERPTableRow, ERPTableCell, StatusBadge, ActionBtn } from "../components/shared/PageShell";

const ACCENT = '#7C3AED';

export default function JobCostingDashboard() {
  const money = useMoney();
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
              Jobs & Costs
            </button>
          </Link>
        }
      />

      <StatBar stats={[
        { label: 'Active Jobs',      value: activeJobs,              icon: Briefcase,  color: ACCENT },
        { label: 'Completed',        value: completedJobs,           color: '#00A86B' },
        { label: 'Contract Value',   value: money(totalContractValue), icon: Banknote, color: '#1B4F8A' },
        { label: 'Total Costs',      value: money(totalCosts),    icon: TrendingUp, color: '#EF4444' },
        { label: totalProfit >= 0 ? 'Total Profit' : 'Total Loss',
          value: money(Math.abs(totalProfit)),
          color: totalProfit >= 0 ? '#00A86B' : '#EF4444' },
        { label: 'Margin',           value: `${profitMargin}%`,      color: '#F59E0B' },
      ]} />

      <ERPTable headers={HEADERS} emptyIcon={Briefcase} emptyTitle="No active jobs" emptyDesc="Create your first job to start tracking costs.">
        {activeJobsList.map(job => {
          const profit = (parseFloat(job.contract_amount) || 0) - (parseFloat(job.actual_cost) || 0);
          return (
            <ERPTableRow key={job.id}>
              <ERPTableCell style={{ fontFamily: 'monospace', fontSize: 12.5, color: ACCENT, fontWeight: 700 }}>{job.job_number}</ERPTableCell>
              <ERPTableCell bold>{job.job_name}</ERPTableCell>
              <ERPTableCell muted>{job.customer_name || '—'}</ERPTableCell>
              <ERPTableCell right bold>{money(job.contract_amount)}</ERPTableCell>
              <ERPTableCell right muted>{money(job.actual_cost)}</ERPTableCell>
              <ERPTableCell right bold style={{ color: profit >= 0 ? '#00A86B' : '#EF4444' }}>
                {profit >= 0 ? '' : '-'}{money(Math.abs(profit))}
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

import React from "react";
import { Employee, PayrollRun } from "@/api/entities";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useCompany } from "../components/auth/CompanyContext";
import { Users, DollarSign, Calendar, Plus, Upload, FileText } from "lucide-react";
import PageShell, { PageHeader, StatBar, ERPTable, ERPTableRow, ERPTableCell, StatusBadge, NewBtn, ActionBtn } from "../components/shared/PageShell";
import { format } from "date-fns";

const fmt = (n, sym = '$') => `${sym}${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function PayrollDashboard() {
  const { currentCompany } = useCompany();

  const { data: employees = [] } = useQuery({
    queryKey: ['employees', currentCompany?.id],
    queryFn: () => currentCompany ? Employee.list({ filters: { company_id: currentCompany.id } }) : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const { data: payrollRuns = [] } = useQuery({
    queryKey: ['payroll-runs', currentCompany?.id],
    queryFn: () => currentCompany ? PayrollRun.list({ filters: { company_id: currentCompany.id }, orderBy: 'pay_date', ascending: false }) : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const activeEmployees  = employees.filter(e => e.is_active).length;
  const totalPayroll     = payrollRuns.filter(pr => pr.status === 'paid').reduce((s, pr) => s + (parseFloat(pr.total_net) || 0), 0);
  const pendingRuns      = payrollRuns.filter(pr => pr.status === 'draft' || pr.status === 'processing').length;
  const totalGross       = payrollRuns.reduce((s, pr) => s + (parseFloat(pr.total_gross) || 0), 0);

  const quickActions = [
    { label: 'Run Payroll',      icon: Calendar, href: createPageUrl('Payroll'), color: '#8B5CF6' },
    { label: 'New Employee',     icon: Plus,     href: createPageUrl('Payroll'), color: '#00A86B' },
    { label: 'Import Employees', icon: Upload,   href: createPageUrl('Payroll'), color: '#1B4F8A' },
    { label: 'Payroll Reports',  icon: FileText, href: createPageUrl('Payroll'), color: '#F59E0B' },
  ];

  const HEADERS = [{ label: 'Payroll #' }, { label: 'Pay Period' }, { label: 'Pay Date' }, { label: 'Employees' }, { label: 'Gross Pay', right: true }, { label: 'Net Pay', right: true }, { label: 'Status' }];

  return (
    <PageShell>
      <PageHeader
        title="Payroll Dashboard"
        subtitle={`${activeEmployees} active employees · ${payrollRuns.length} payroll runs`}
        icon={Users}
        accentColor="#8B5CF6"
        actions={
          <Link to={createPageUrl('Payroll')} style={{ textDecoration: 'none' }}>
            <NewBtn label="Manage Payroll" />
          </Link>
        }
      />

      <StatBar stats={[
        { label: 'Active Employees', value: activeEmployees,         icon: Users,      color: '#8B5CF6' },
        { label: 'Total Payroll Paid', value: fmt(totalPayroll),    icon: DollarSign, color: '#00A86B' },
        { label: 'Total Gross',      value: fmt(totalGross),        icon: DollarSign, color: '#F59E0B' },
        { label: 'Payroll Runs',     value: payrollRuns.length,     icon: Calendar,   color: '#1B4F8A' },
        { label: 'Pending Runs',     value: pendingRuns,            color: '#F59E0B' },
      ]} />

      {/* Quick Actions */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94A3B8', marginBottom: 10 }}>Quick Actions</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {quickActions.map((qa, i) => (
            <Link key={i} to={qa.href} style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', background: 'white', border: '1.5px solid #E2E8F0', borderRadius: 9, fontSize: 13.5, fontWeight: 600, color: qa.color, cursor: 'pointer', boxShadow: '0 1px 3px rgba(15,43,91,0.05)' }}>
                <qa.icon style={{ width: 15, height: 15 }} />
                {qa.label}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Payroll Runs */}
      <div style={{ marginBottom: 8 }}>
        <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94A3B8', marginBottom: 10 }}>Recent Payroll Runs</p>
      </div>

      <ERPTable headers={HEADERS} emptyIcon={Calendar} emptyTitle="No payroll runs yet" emptyDesc="Create your first payroll run from the Payroll module.">
        {payrollRuns.slice(0, 10).map(run => (
          <ERPTableRow key={run.id}>
            <ERPTableCell bold style={{ color: '#8B5CF6', fontFamily: 'monospace' }}>{run.payroll_number}</ERPTableCell>
            <ERPTableCell muted style={{ fontSize: 12.5 }}>{run.pay_period_start} → {run.pay_period_end}</ERPTableCell>
            <ERPTableCell muted>{run.pay_date ? format(new Date(run.pay_date), 'MMM d, yyyy') : '—'}</ERPTableCell>
            <ERPTableCell>{run.employee_payments?.length || 0}</ERPTableCell>
            <ERPTableCell right bold>{fmt(run.total_gross)}</ERPTableCell>
            <ERPTableCell right bold style={{ color: '#00875A' }}>{fmt(run.total_net)}</ERPTableCell>
            <ERPTableCell><StatusBadge status={run.status} /></ERPTableCell>
          </ERPTableRow>
        ))}
      </ERPTable>
    </PageShell>
  );
}

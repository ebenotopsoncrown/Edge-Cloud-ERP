import React from "react";
import { useMoney } from "@/components/shared/useMoney";
import { pluralize } from "@/lib/utils";
import { Employee, PayrollRun } from "@/api/entities";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useCompany } from "../components/auth/CompanyContext";
import { Users, Banknote, Calendar, Plus, Upload, FileText } from "lucide-react";
import PageShell, { PageHeader, StatBar, ERPTable, ERPTableRow, ERPTableCell, StatusBadge, NewBtn, ActionBtn } from "../components/shared/PageShell";
import { format } from "date-fns";


export default function PayrollDashboard() {
  const money = useMoney();
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

  const HEADERS = [{ label: 'Payroll #' }, { label: 'Pay Period' }, { label: 'Pay Date' }, { label: 'Employees' }, { label: 'Gross Pay', right: true }, { label: 'Net Pay', right: true }, { label: 'Status' }];

  return (
    <PageShell>
      <PageHeader
        title="Payroll Dashboard"
        subtitle={`${pluralize(activeEmployees, 'active employee')} · ${pluralize(payrollRuns.length, 'payroll run')}`}
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
        { label: 'Total Payroll Paid', value: money(totalPayroll),    icon: Banknote, color: '#00A86B' },
        { label: 'Total Gross',      value: money(totalGross),        icon: Banknote, color: '#F59E0B' },
        { label: 'Payroll Runs',     value: payrollRuns.length,     icon: Calendar,   color: '#1B4F8A' },
        { label: 'Pending Runs',     value: pendingRuns,            color: '#F59E0B' },
      ]} />

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
            <ERPTableCell right bold>{money(run.total_gross)}</ERPTableCell>
            <ERPTableCell right bold style={{ color: '#00875A' }}>{money(run.total_net)}</ERPTableCell>
            <ERPTableCell><StatusBadge status={run.status} /></ERPTableCell>
          </ERPTableRow>
        ))}
      </ERPTable>
    </PageShell>
  );
}

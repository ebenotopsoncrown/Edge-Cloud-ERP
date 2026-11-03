import React from "react";
import { Donation, Donor, Program, Grant } from "@/api/entities";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useCompany } from "../components/auth/CompanyContext";
import { Heart, Users, Target, DollarSign, Plus, Receipt, CreditCard, FileText, TrendingUp, Briefcase } from "lucide-react";
import { format } from "date-fns";
import PageShell, { PageHeader, StatBar, ERPTable, ERPTableRow, ERPTableCell, StatusBadge, ActionBtn } from "../components/shared/PageShell";

const fmt = (n) => `$${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const ACCENT = '#EC4899';

export default function NonProfitDashboard() {
  const { currentCompany } = useCompany();

  const { data: donations = [] } = useQuery({
    queryKey: ['donations', currentCompany?.id],
    queryFn: () => currentCompany ? Donation.list({ filters: { company_id: currentCompany.id } }) : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const { data: donors = [] } = useQuery({
    queryKey: ['donors', currentCompany?.id],
    queryFn: () => currentCompany ? Donor.list({ filters: { company_id: currentCompany.id } }) : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const { data: programs = [] } = useQuery({
    queryKey: ['programs', currentCompany?.id],
    queryFn: () => currentCompany ? Program.list({ filters: { company_id: currentCompany.id } }) : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const { data: grants = [] } = useQuery({
    queryKey: ['grants', currentCompany?.id],
    queryFn: () => currentCompany ? Grant.list({ filters: { company_id: currentCompany.id } }) : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const totalDonations = donations.filter(d => d.status === 'received').reduce((s, d) => s + (parseFloat(d.amount) || 0), 0);
  const totalGrants    = grants.filter(g => g.status === 'active').reduce((s, g) => s + (parseFloat(g.grant_amount) || 0), 0);
  const activePrograms = programs.filter(p => p.status === 'active').length;

  const HEADERS = [{ label: 'Donor' }, { label: 'Program' }, { label: 'Date' }, { label: 'Amount', right: true }, { label: 'Status' }];

  return (
    <PageShell>
      <PageHeader
        title="Non-Profit Management"
        subtitle={`Donations, grants & programs · ${currentCompany?.company_name || ''}`}
        icon={Heart}
        accentColor={ACCENT}
      />

      <StatBar stats={[
        { label: 'Total Donations',  value: fmt(totalDonations), icon: Heart,       color: ACCENT },
        { label: 'Active Grants',    value: fmt(totalGrants),    icon: DollarSign,  color: '#8B5CF6' },
        { label: 'Total Donors',     value: donors.length,       icon: Users,       color: '#1B4F8A' },
        { label: 'Active Programs',  value: activePrograms,      icon: Target,      color: '#00A86B' },
        { label: 'Total Programs',   value: programs.length,     color: '#64748B' },
      ]} />

      {/* Program Summary */}
      {programs.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94A3B8', marginBottom: 10 }}>Programs</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
            {programs.slice(0, 8).map(prog => (
              <div key={prog.id} style={{ background: 'white', borderRadius: 12, border: '1px solid #F1F5F9', padding: '16px 18px', boxShadow: '0 2px 8px rgba(15,43,91,0.06)' }}>
                <p style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', color: '#94A3B8', marginBottom: 4, letterSpacing: '0.06em' }}>
                  {(prog.status || 'active').toUpperCase()}
                </p>
                <p style={{ fontSize: 14, fontWeight: 800, color: ACCENT, marginBottom: 2 }}>{prog.program_name || prog.name}</p>
                <p style={{ fontSize: 11.5, color: '#64748B' }}>{prog.status === 'active' ? 'Active' : 'Inactive'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Donations */}
      <ERPTable headers={HEADERS} emptyIcon={Heart} emptyTitle="No donations yet" emptyDesc="Record your first donation to get started.">
        {donations.slice(0, 10).map(donation => (
          <ERPTableRow key={donation.id}>
            <ERPTableCell bold>{donation.donor_name || '—'}</ERPTableCell>
            <ERPTableCell>
              {donation.program_name ? (
                <span style={{ padding: '3px 9px', background: '#FCE7F3', color: '#BE185D', borderRadius: 99, fontSize: 11.5, fontWeight: 600 }}>
                  {donation.program_name}
                </span>
              ) : (
                <span style={{ color: '#94A3B8', fontSize: 13 }}>General</span>
              )}
            </ERPTableCell>
            <ERPTableCell muted>
              {donation.donation_date ? format(new Date(donation.donation_date), 'MMM d, yyyy') : '—'}
            </ERPTableCell>
            <ERPTableCell right bold style={{ color: '#00A86B' }}>{fmt(donation.amount)}</ERPTableCell>
            <ERPTableCell><StatusBadge status={donation.status || 'received'} /></ERPTableCell>
          </ERPTableRow>
        ))}
      </ERPTable>
    </PageShell>
  );
}

import React from "react";
import { WorkOrder, BillOfMaterials } from "@/api/entities";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useCompany } from "../components/auth/CompanyContext";
import { Factory, FileText, Plus, Upload, Play, Package, TrendingUp } from "lucide-react";
import PageShell, { PageHeader, StatBar, ERPTable, ERPTableRow, ERPTableCell, StatusBadge } from "../components/shared/PageShell";

const ACCENT = '#1B4F8A';

const STATUS_COLORS = {
  draft:       { bg: '#F1F5F9', color: '#64748B' },
  planned:     { bg: '#EBF4FB', color: '#1B4F8A' },
  released:    { bg: '#FEF9C3', color: '#854D0E' },
  in_progress: { bg: '#D1FAE5', color: '#065F46' },
  completed:   { bg: '#DCFCE7', color: '#14532D' },
  cancelled:   { bg: '#FEE2E2', color: '#991B1B' },
};

export default function ManufacturingDashboard() {
  const { currentCompany } = useCompany();

  const { data: workOrders = [] } = useQuery({
    queryKey: ['work-orders', currentCompany?.id],
    queryFn: () => currentCompany ? WorkOrder.list({ filters: { company_id: currentCompany.id } }) : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const { data: boms = [] } = useQuery({
    queryKey: ['boms', currentCompany?.id],
    queryFn: () => currentCompany ? BillOfMaterials.list({ filters: { company_id: currentCompany.id } }) : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const activeWOs    = workOrders.filter(wo => ['released','in_progress'].includes(wo.status)).length;
  const completedWOs = workOrders.filter(wo => wo.status === 'completed').length;
  const totalProduction = workOrders.filter(wo => wo.status === 'completed').reduce((s, wo) => s + (wo.quantity_produced || 0), 0);
  const activeBOMs   = boms.filter(b => b.is_active).length;

  const quickActions = [
    { label: 'New Work Order',    icon: Plus,       color: ACCENT },
    { label: 'Start Production',  icon: Play,       color: '#00A86B' },
    { label: 'Material Issue',    icon: Package,    color: '#F59E0B' },
    { label: 'Production Report', icon: TrendingUp, color: '#8B5CF6' },
    { label: 'New BOM',           icon: Plus,       color: '#00A86B' },
    { label: 'Import BOMs',       icon: Upload,     color: '#64748B' },
    { label: 'Work Centers',      icon: Factory,    color: '#EF4444' },
    { label: 'Routings',          icon: FileText,   color: '#F59E0B' },
  ];

  const HEADERS = [
    { label: 'WO #' }, { label: 'Product' }, { label: 'Qty to Produce', right: true },
    { label: 'Produced', right: true }, { label: 'Progress' }, { label: 'Status' }
  ];

  return (
    <PageShell>
      <PageHeader
        title="Manufacturing"
        subtitle={`Production & bill of materials · ${currentCompany?.company_name || ''}`}
        icon={Factory}
        accentColor={ACCENT}
        actions={
          <Link to={createPageUrl('Manufacturing')} style={{ textDecoration: 'none' }}>
            <button style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', border: 'none', borderRadius: 8, background: ACCENT, color: 'white', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              <Plus style={{ width: 15, height: 15 }} />
              New Work Order
            </button>
          </Link>
        }
      />

      <StatBar stats={[
        { label: 'Active Work Orders', value: activeWOs,        icon: Factory,   color: ACCENT },
        { label: 'Completed',          value: completedWOs,     icon: TrendingUp,color: '#00A86B' },
        { label: 'Total Production',   value: totalProduction,  icon: Package,   color: '#8B5CF6' },
        { label: 'Active BOMs',        value: activeBOMs,       icon: FileText,  color: '#F59E0B' },
        { label: 'Total BOMs',         value: boms.length,      color: '#64748B' },
      ]} />

      {/* Quick Actions */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94A3B8', marginBottom: 10 }}>Quick Actions</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {quickActions.map((qa, i) => (
            <Link key={i} to={createPageUrl('Manufacturing')} style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', background: 'white', border: '1.5px solid #E2E8F0', borderRadius: 9, fontSize: 13.5, fontWeight: 600, color: qa.color, boxShadow: '0 1px 3px rgba(15,43,91,0.05)' }}>
                <qa.icon style={{ width: 15, height: 15 }} />
                {qa.label}
              </div>
            </Link>
          ))}
        </div>
      </div>

      <ERPTable headers={HEADERS} emptyIcon={Factory} emptyTitle="No work orders yet" emptyDesc="Create your first work order to begin production.">
        {workOrders.slice(0, 15).map(wo => {
          const pct = wo.quantity_to_produce ? Math.min(100, Math.round(((wo.quantity_produced || 0) / wo.quantity_to_produce) * 100)) : 0;
          const sc = STATUS_COLORS[wo.status] || STATUS_COLORS.draft;
          return (
            <ERPTableRow key={wo.id}>
              <ERPTableCell style={{ fontFamily: 'monospace', fontSize: 12.5, color: ACCENT, fontWeight: 700 }}>{wo.work_order_number}</ERPTableCell>
              <ERPTableCell bold>{wo.product_name}</ERPTableCell>
              <ERPTableCell right muted>{wo.quantity_to_produce}</ERPTableCell>
              <ERPTableCell right bold>{wo.quantity_produced || 0}</ERPTableCell>
              <ERPTableCell>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ flex: 1, height: 6, background: '#F1F5F9', borderRadius: 3, overflow: 'hidden', minWidth: 60 }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? '#00A86B' : ACCENT, borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600, flexShrink: 0 }}>{pct}%</span>
                </div>
              </ERPTableCell>
              <ERPTableCell>
                <span style={{ padding: '3px 9px', background: sc.bg, color: sc.color, borderRadius: 99, fontSize: 11.5, fontWeight: 600, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
                  {(wo.status || '').replace(/_/g, ' ')}
                </span>
              </ERPTableCell>
            </ERPTableRow>
          );
        })}
      </ERPTable>
    </PageShell>
  );
}

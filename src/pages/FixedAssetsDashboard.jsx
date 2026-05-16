import React from "react";
import { FixedAsset } from "@/api/entities";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useCompany } from "../components/auth/CompanyContext";
import { Package, Plus, TrendingDown, DollarSign, Play } from "lucide-react";
import { format, differenceInMonths } from "date-fns";
import PageShell, { PageHeader, StatBar, ERPTable, ERPTableRow, ERPTableCell, StatusBadge, NewBtn } from "../components/shared/PageShell";

const fmt = (n, sym = '$') => `${sym}${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const currencySymbol = code => ({ USD:'$',EUR:'€',GBP:'£',NGN:'₦',ZAR:'R',KES:'KSh',GHS:'₵',CAD:'C$',AUD:'A$',INR:'₹',JPY:'¥',CNY:'¥' }[code] || code);

function calcBookValue(asset) {
  const months   = differenceInMonths(new Date(), new Date(asset.acquisition_date));
  const cost     = asset.acquisition_cost || 0;
  const salvage  = asset.salvage_value || 0;
  const lifeM    = (asset.useful_life_years || 10) * 12;
  const monthly  = (cost - salvage) / lifeM;
  const accum    = Math.min(months * monthly, cost - salvage);
  return cost - accum;
}

export default function FixedAssetsDashboard() {
  const { currentCompany } = useCompany();
  const sym = currencySymbol(currentCompany?.base_currency || 'USD');

  const { data: assets = [] } = useQuery({
    queryKey: ['fixed-assets', currentCompany?.id],
    queryFn: () => currentCompany ? FixedAsset.list({ filters: { company_id: currentCompany.id } }) : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const activeAssets    = assets.filter(a => a.is_active);
  const totalCost       = activeAssets.reduce((s, a) => s + (parseFloat(a.acquisition_cost) || 0), 0);
  const totalDepreciation = activeAssets.reduce((s, a) => s + (parseFloat(a.accumulated_depreciation) || 0), 0);
  const totalBookValue  = totalCost - totalDepreciation;
  const categories      = [...new Set(assets.map(a => a.category).filter(Boolean))];

  const quickActions = [
    { label: 'New Asset',        icon: Plus,        href: createPageUrl('FixedAssets'), color: '#8B5CF6' },
    { label: 'Run Depreciation', icon: Play,        href: createPageUrl('FixedAssets'), color: '#1B4F8A' },
    { label: 'Asset Register',   icon: Package,     href: createPageUrl('FixedAssets'), color: '#00A86B' },
  ];

  const HEADERS = [{ label: 'Code' }, { label: 'Asset Name' }, { label: 'Category' }, { label: 'Cost', right: true }, { label: 'Book Value', right: true }, { label: 'Status' }];

  return (
    <PageShell>
      <PageHeader
        title="Fixed Assets Dashboard"
        subtitle={`${assets.length} assets · ${categories.length} categories`}
        icon={Package}
        accentColor="#8B5CF6"
        actions={
          <Link to={createPageUrl('FixedAssets')} style={{ textDecoration: 'none' }}>
            <NewBtn label="Manage Assets" />
          </Link>
        }
      />

      <StatBar stats={[
        { label: 'Total Assets',   value: assets.length,           icon: Package,     color: '#8B5CF6' },
        { label: 'Active Assets',  value: activeAssets.length,     color: '#00A86B' },
        { label: 'Total Cost',     value: fmt(totalCost, sym),     icon: DollarSign,  color: '#F59E0B' },
        { label: 'Accumulated Dep',value: fmt(totalDepreciation, sym), icon: TrendingDown, color: '#EF4444' },
        { label: 'Net Book Value', value: fmt(totalBookValue, sym), icon: DollarSign, color: '#8B5CF6' },
      ]} />

      {/* Quick Actions */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94A3B8', marginBottom: 10 }}>Quick Actions</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {quickActions.map((qa, i) => (
            <Link key={i} to={qa.href} style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', background: 'white', border: '1.5px solid #E2E8F0', borderRadius: 9, fontSize: 13.5, fontWeight: 600, color: qa.color, boxShadow: '0 1px 3px rgba(15,43,91,0.05)' }}>
                <qa.icon style={{ width: 15, height: 15 }} />
                {qa.label}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Category Summary */}
      {categories.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
          {categories.map(cat => {
            const catAssets = assets.filter(a => a.category === cat);
            const catCost   = catAssets.reduce((s, a) => s + (parseFloat(a.acquisition_cost) || 0), 0);
            return (
              <div key={cat} style={{ background: 'white', borderRadius: 12, border: '1px solid #F1F5F9', padding: '16px 18px', boxShadow: '0 2px 8px rgba(15,43,91,0.06)' }}>
                <p style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', color: '#94A3B8', marginBottom: 4, letterSpacing: '0.06em' }}>
                  {cat.replace(/_/g, ' ').replace(/\b\w/g, x => x.toUpperCase())}
                </p>
                <p style={{ fontSize: 20, fontWeight: 800, color: '#8B5CF6' }}>{catAssets.length}</p>
                <p style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{fmt(catCost, sym)}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Asset Table */}
      <ERPTable headers={HEADERS} emptyIcon={Package} emptyTitle="No fixed assets yet" emptyDesc="Add your first asset to track depreciation.">
        {assets.slice(0, 15).map(a => {
          const bv = a.book_value ?? calcBookValue(a);
          return (
            <ERPTableRow key={a.id}>
              <ERPTableCell style={{ fontFamily: 'monospace', fontSize: 12.5, color: '#8B5CF6', fontWeight: 700 }}>{a.asset_code}</ERPTableCell>
              <ERPTableCell bold>{a.asset_name}</ERPTableCell>
              <ERPTableCell>
                <span style={{ padding: '3px 9px', background: '#F3E8FF', color: '#7C3AED', borderRadius: 99, fontSize: 11.5, fontWeight: 600 }}>
                  {(a.category || '').replace(/_/g, ' ').replace(/\b\w/g, x => x.toUpperCase())}
                </span>
              </ERPTableCell>
              <ERPTableCell right bold>{fmt(a.acquisition_cost, sym)}</ERPTableCell>
              <ERPTableCell right bold style={{ color: bv < (a.acquisition_cost || 0) * 0.2 ? '#EF4444' : '#0F172A' }}>{fmt(bv, sym)}</ERPTableCell>
              <ERPTableCell><StatusBadge status={a.is_active ? 'active' : 'inactive'} /></ERPTableCell>
            </ERPTableRow>
          );
        })}
      </ERPTable>
    </PageShell>
  );
}

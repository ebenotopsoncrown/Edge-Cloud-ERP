import React from "react";
import { useMoney } from "@/components/shared/useMoney";
import { pluralize } from "@/lib/utils";
import { FixedAsset } from "@/api/entities";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useCompany } from "../components/auth/CompanyContext";
import { Package, Plus, TrendingDown, Banknote, Play } from "lucide-react";
import { format, differenceInMonths } from "date-fns";
import PageShell, { PageHeader, StatBar, ERPTable, ERPTableRow, ERPTableCell, StatusBadge, NewBtn } from "../components/shared/PageShell";


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
  const money = useMoney();
  const { currentCompany } = useCompany();

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

  const HEADERS = [{ label: 'Code' }, { label: 'Asset Name' }, { label: 'Category' }, { label: 'Cost', right: true }, { label: 'Book Value', right: true }, { label: 'Status' }];

  return (
    <PageShell>
      <PageHeader
        title="Fixed Assets Dashboard"
        subtitle={`${pluralize(assets.length, 'asset')} · ${pluralize(categories.length, 'category', 'categories')}`}
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
        { label: 'Total Cost',     value: money(totalCost),     icon: Banknote,  color: '#F59E0B' },
        { label: 'Accumulated Dep',value: money(totalDepreciation), icon: TrendingDown, color: '#EF4444' },
        { label: 'Net Book Value', value: money(totalBookValue), icon: Banknote, color: '#8B5CF6' },
      ]} />

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
                <p style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{money(catCost)}</p>
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
              <ERPTableCell right bold>{money(a.acquisition_cost)}</ERPTableCell>
              <ERPTableCell right bold style={{ color: bv < (a.acquisition_cost || 0) * 0.2 ? '#EF4444' : '#0F172A' }}>{money(bv)}</ERPTableCell>
              <ERPTableCell><StatusBadge status={a.is_active ? 'active' : 'inactive'} /></ERPTableCell>
            </ERPTableRow>
          );
        })}
      </ERPTable>
    </PageShell>
  );
}

import React, { useState } from "react";
import { FixedAsset, Account, JournalEntry } from "@/api/entities";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Package, Pencil, TrendingDown, AlertCircle, Play, DollarSign } from "lucide-react";
import { format, differenceInMonths } from "date-fns";
import FixedAssetForm from "../components/fixedAssets/FixedAssetForm";
import { useCompany } from "../components/auth/CompanyContext";
import PageShell, { PageHeader, SearchBar, StatBar, ERPTable, ERPTableRow, ERPTableCell, StatusBadge, NewBtn, ActionBtn, FilterSelect } from "../components/shared/PageShell";

const fmt = (n, sym = '$') => `${sym}${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = d => { try { return format(new Date(d), 'MMM d, yyyy'); } catch { return '—'; } };
const currencySymbol = code => ({ USD:'$',EUR:'€',GBP:'£',NGN:'₦',ZAR:'R',KES:'KSh',GHS:'₵',CAD:'C$',AUD:'A$',INR:'₹',JPY:'¥',CNY:'¥' }[code] || code);

function calculateDepreciation(asset) {
  const today = new Date();
  const months = differenceInMonths(today, new Date(asset.acquisition_date));
  const cost = asset.acquisition_cost || 0;
  const salvage = asset.salvage_value || 0;
  const lifeMonths = (asset.useful_life_years || 10) * 12;
  const monthly = asset.depreciation_method === 'straight_line'
    ? (cost - salvage) / lifeMonths
    : 0;
  const accumulated = Math.min(months * monthly, cost - salvage);
  return { accumulated, bookValue: cost - accumulated };
}

export default function FixedAssets() {
  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState(null);
  const [search, setSearch]       = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const { currentCompany } = useCompany();
  const queryClient = useQueryClient();
  const sym = currencySymbol(currentCompany?.base_currency || 'USD');

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['fixed-assets', currentCompany?.id],
    queryFn: () => currentCompany ? FixedAsset.list({ filters: { company_id: currentCompany.id }, orderBy: 'acquisition_date', ascending: false }) : [],
    enabled: !!currentCompany,
  });
  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts', currentCompany?.id],
    queryFn: () => currentCompany ? Account.list({ filters: { company_id: currentCompany.id } }) : [],
    enabled: !!currentCompany,
  });

  const runDepreciationMutation = useMutation({
    mutationFn: async () => {
      const today = new Date();
      for (const asset of assets) {
        if (!asset.is_active || !asset.depreciation_account_id || !asset.accumulated_depreciation_account_id) continue;
        const { accumulated, bookValue } = calculateDepreciation(asset);
        const monthsSinceAcquisition = differenceInMonths(today, new Date(asset.acquisition_date));
        const monthlyDep = asset.depreciation_method === 'straight_line'
          ? ((asset.acquisition_cost - (asset.salvage_value || 0)) / ((asset.useful_life_years || 10) * 12))
          : 0;
        if (monthlyDep > 0 && monthsSinceAcquisition > 0) {
          const depAcc  = accounts.find(a => a.id === asset.depreciation_account_id);
          const accumAcc = accounts.find(a => a.id === asset.accumulated_depreciation_account_id);
          if (depAcc && accumAcc) {
            await JournalEntry.create({
              company_id: currentCompany.id,
              entry_number: `DEP-${asset.asset_code}-${format(today, 'yyyyMM')}`,
              entry_date: format(today, 'yyyy-MM-dd'),
              reference: `Depreciation - ${asset.asset_name}`,
              source_type: 'manual', status: 'posted',
              description: `Monthly depreciation for ${asset.asset_name}`,
              total_debits: monthlyDep, total_credits: monthlyDep,
              line_items: [
                { account_id: asset.depreciation_account_id, account_name: depAcc.account_name, debit: monthlyDep, credit: 0, description: `Depreciation expense - ${asset.asset_name}` },
                { account_id: asset.accumulated_depreciation_account_id, account_name: accumAcc.account_name, debit: 0, credit: monthlyDep, description: `Accumulated depreciation - ${asset.asset_name}` },
              ],
            });
            await FixedAsset.update(asset.id, {
              accumulated_depreciation: (asset.accumulated_depreciation || 0) + monthlyDep,
              book_value: bookValue,
              last_depreciation_date: format(today, 'yyyy-MM-dd'),
            });
          }
        }
      }
    },
    onSuccess: () => { queryClient.invalidateQueries(['fixed-assets']); queryClient.invalidateQueries(['journal-entries']); alert('Depreciation posted for all active assets.'); },
    onError: err => alert(`Error: ${err.message}`),
  });

  const filtered = assets.filter(a => {
    const matchSearch = !search || a.asset_name?.toLowerCase().includes(search.toLowerCase()) || a.asset_code?.toLowerCase().includes(search.toLowerCase());
    const matchCat    = catFilter === 'all' || a.category === catFilter;
    return matchSearch && matchCat;
  });

  const totalCost   = assets.reduce((s, a) => s + (a.acquisition_cost || 0), 0);
  const totalBook   = assets.reduce((s, a) => s + (a.book_value || calculateDepreciation(a).bookValue), 0);
  const activeCount = assets.filter(a => a.is_active).length;

  const TABLE_HEADERS = [
    { label: 'Code' }, { label: 'Asset Name' }, { label: 'Category' },
    { label: 'Acquired' }, { label: 'Cost', right: true },
    { label: 'Book Value', right: true }, { label: 'Status' }, { label: 'Actions' },
  ];

  const cats = [...new Set(assets.map(a => a.category).filter(Boolean))];

  return (
    <PageShell>
      {showForm && <FixedAssetForm asset={editing} onClose={() => { setShowForm(false); setEditing(null); }} companyId={currentCompany?.id} />}

      <PageHeader
        title="Fixed Assets"
        subtitle={`${assets.length} assets · depreciation management`}
        icon={Package}
        accentColor="#8B5CF6"
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <ActionBtn
              onClick={() => { if (window.confirm('Run monthly depreciation for all active assets?')) runDepreciationMutation.mutate(); }}
              icon={Play} label="Run Depreciation" variant="outline"
            />
            <NewBtn onClick={() => { setEditing(null); setShowForm(true); }} label="New Asset" />
          </div>
        }
      />

      <StatBar stats={[
        { label: 'Total Assets',   value: assets.length, icon: Package,      color: '#1B4F8A' },
        { label: 'Active',         value: activeCount,   color: '#00A86B' },
        { label: 'Total Cost',     value: fmt(totalCost, sym),  icon: DollarSign, color: '#F59E0B' },
        { label: 'Net Book Value', value: fmt(totalBook, sym), icon: TrendingDown, color: '#8B5CF6' },
      ]} />

      <SearchBar value={search} onChange={setSearch} placeholder="Search by asset name or code…">
        <FilterSelect
          value={catFilter}
          onChange={setCatFilter}
          options={[{ value: 'all', label: 'All Categories' }, ...cats.map(c => ({ value: c, label: c.replace(/_/g, ' ').replace(/\b\w/g, x => x.toUpperCase()) }))]}
        />
      </SearchBar>

      <ERPTable headers={TABLE_HEADERS} emptyIcon={Package} emptyTitle="No fixed assets yet" emptyDesc="Add your first asset to track depreciation.">
        {filtered.map(a => {
          const { bookValue } = calculateDepreciation(a);
          const bv = a.book_value ?? bookValue;
          return (
            <ERPTableRow key={a.id}>
              <ERPTableCell style={{ fontFamily: 'monospace', fontSize: 12.5, color: '#8B5CF6', fontWeight: 700 }}>{a.asset_code}</ERPTableCell>
              <ERPTableCell bold>{a.asset_name}</ERPTableCell>
              <ERPTableCell>
                <span style={{ padding: '3px 9px', background: '#F3E8FF', color: '#7C3AED', borderRadius: 99, fontSize: 11.5, fontWeight: 600 }}>
                  {(a.category || '').replace(/_/g, ' ').replace(/\b\w/g, x => x.toUpperCase())}
                </span>
              </ERPTableCell>
              <ERPTableCell muted>{fmtDate(a.acquisition_date)}</ERPTableCell>
              <ERPTableCell right bold>{fmt(a.acquisition_cost, sym)}</ERPTableCell>
              <ERPTableCell right style={{ color: bv < a.acquisition_cost * 0.2 ? '#EF4444' : '#0F172A', fontWeight: 700 }}>{fmt(bv, sym)}</ERPTableCell>
              <ERPTableCell><StatusBadge status={a.is_active ? 'active' : 'inactive'} /></ERPTableCell>
              <ERPTableCell>
                <ActionBtn onClick={() => { setEditing(a); setShowForm(true); }} icon={Pencil} variant="outline" />
              </ERPTableCell>
            </ERPTableRow>
          );
        })}
      </ERPTable>
    </PageShell>
  );
}

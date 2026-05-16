import React, { useState } from "react";
import { Product } from "@/api/entities";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Package, Pencil, Trash2, AlertTriangle, DollarSign, Boxes } from "lucide-react";
import ProductForm from "../components/products/ProductForm";
import { useCompany } from "../components/auth/CompanyContext";
import PageShell, { PageHeader, SearchBar, StatBar, ERPTable, ERPTableRow, ERPTableCell, StatusBadge, NewBtn, ActionBtn, FilterSelect } from "../components/shared/PageShell";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const fmt = (n, sym = '$') => `${sym}${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const currencySymbol = code => ({ USD:'$',EUR:'€',GBP:'£',NGN:'₦',ZAR:'R',KES:'KSh',GHS:'₵',CAD:'C$',AUD:'A$',INR:'₹',JPY:'¥',CNY:'¥' }[code] || code);

export default function Products() {
  const [showForm, setShowForm]     = useState(false);
  const [editing, setEditing]       = useState(null);
  const [search, setSearch]         = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toDelete, setToDelete]     = useState(null);
  const queryClient = useQueryClient();
  const { currentCompany } = useCompany();
  const sym = currencySymbol(currentCompany?.base_currency || 'USD');

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', currentCompany?.id],
    queryFn: () => currentCompany ? Product.list({ filters: { company_id: currentCompany.id }, orderBy: 'created_date', ascending: false }) : [],
    enabled: !!currentCompany,
  });

  const deleteMutation = useMutation({
    mutationFn: id => Product.delete(id),
    onSuccess: () => { queryClient.invalidateQueries(['products']); setDeleteOpen(false); setToDelete(null); },
  });

  const filtered = products.filter(p => {
    const matchSearch = !search || p.product_name?.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || p.product_type === typeFilter;
    return matchSearch && matchType;
  });

  const inventoryProducts = products.filter(p => p.product_type === 'inventory');
  const lowStock          = inventoryProducts.filter(p => p.quantity_on_hand <= p.reorder_level).length;
  const totalValue        = inventoryProducts.reduce((s, p) => s + (p.quantity_on_hand || 0) * (p.cost_price || 0), 0);

  const TABLE_HEADERS = [
    { label: 'SKU' }, { label: 'Product Name' }, { label: 'Type' },
    { label: `Unit Price (${currentCompany?.base_currency || 'USD'})`, right: true },
    { label: `Cost Price`, right: true }, { label: 'Stock' }, { label: 'Status' }, { label: 'Actions' },
  ];

  const typeLabel = t => (t || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <PageShell>
      {showForm && <ProductForm product={editing} onClose={() => { setShowForm(false); setEditing(null); }} />}

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete <strong>{toDelete?.product_name}</strong>. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(toDelete?.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PageHeader
        title="Products & Inventory"
        subtitle={`${products.length} products · ${inventoryProducts.length} inventory items`}
        icon={Package}
        accentColor="#00A86B"
        actions={<NewBtn onClick={() => { setEditing(null); setShowForm(true); }} label="New Product" />}
      />

      <StatBar stats={[
        { label: 'Total Products', value: products.length,        icon: Package,       color: '#1B4F8A' },
        { label: 'Inventory Items',value: inventoryProducts.length, icon: Boxes,        color: '#00A86B' },
        { label: 'Low Stock',      value: lowStock,               icon: AlertTriangle, color: '#EF4444' },
        { label: 'Inventory Value',value: fmt(totalValue, sym),   icon: DollarSign,    color: '#F59E0B' },
      ]} />

      <SearchBar value={search} onChange={setSearch} placeholder="Search by name or SKU…">
        <FilterSelect
          value={typeFilter}
          onChange={setTypeFilter}
          options={[
            { value: 'all', label: 'All Types' },
            { value: 'inventory', label: 'Inventory' },
            { value: 'service', label: 'Service' },
            { value: 'non_inventory', label: 'Non-Inventory' },
          ]}
        />
      </SearchBar>

      <ERPTable headers={TABLE_HEADERS} emptyIcon={Package} emptyTitle="No products yet" emptyDesc="Add your first product to start managing inventory.">
        {filtered.map(p => {
          const isLow = p.product_type === 'inventory' && p.quantity_on_hand <= p.reorder_level;
          return (
            <ERPTableRow key={p.id} highlight={isLow}>
              <ERPTableCell muted style={{ fontFamily: 'monospace', fontSize: 12.5 }}>{p.sku}</ERPTableCell>
              <ERPTableCell bold>{p.product_name}</ERPTableCell>
              <ERPTableCell>
                <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 99, fontSize: 11.5, fontWeight: 600, background: '#EBF4FB', color: '#1B4F8A' }}>
                  {typeLabel(p.product_type)}
                </span>
              </ERPTableCell>
              <ERPTableCell right style={{ color: '#00875A', fontWeight: 700 }}>{fmt(p.unit_price, sym)}</ERPTableCell>
              <ERPTableCell right>{fmt(p.cost_price, sym)}</ERPTableCell>
              <ERPTableCell>
                {p.product_type === 'inventory' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 700, color: isLow ? '#EF4444' : '#0F172A' }}>{p.quantity_on_hand}</span>
                    {isLow && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 7px', background: '#FEF2F2', color: '#DC2626', borderRadius: 99, fontSize: 10.5, fontWeight: 700 }}>
                        <AlertTriangle style={{ width: 10, height: 10 }} /> Low
                      </span>
                    )}
                  </div>
                ) : <span style={{ color: '#CBD5E1' }}>N/A</span>}
              </ERPTableCell>
              <ERPTableCell><StatusBadge status={p.is_active ? 'active' : 'inactive'} /></ERPTableCell>
              <ERPTableCell>
                <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                  <ActionBtn onClick={() => { setEditing(p); setShowForm(true); }} icon={Pencil} variant="outline" />
                  <ActionBtn onClick={() => { setToDelete(p); setDeleteOpen(true); }} icon={Trash2} danger />
                </div>
              </ERPTableCell>
            </ERPTableRow>
          );
        })}
      </ERPTable>
    </PageShell>
  );
}

import React, { useState } from "react";
import { PurchaseOrder, Bill } from "@/api/entities";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShoppingCart, Pencil, Trash2, FileText, DollarSign, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import PurchaseOrderForm from "../components/purchaseOrders/PurchaseOrderForm";
import { useCompany } from "../components/auth/CompanyContext";
import PageShell, { PageHeader, SearchBar, StatBar, ERPTable, ERPTableRow, ERPTableCell, StatusBadge, NewBtn, ActionBtn, FilterSelect } from "../components/shared/PageShell";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const fmt = (n, sym = '$') => `${sym}${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = d => { try { return format(new Date(d), 'MMM d, yyyy'); } catch { return '—'; } };
const currencySymbol = code => ({ USD:'$',EUR:'€',GBP:'£',NGN:'₦',ZAR:'R',KES:'KSh',GHS:'₵',CAD:'C$',AUD:'A$',INR:'₹',JPY:'¥',CNY:'¥' }[code] || code);

export default function PurchaseOrders() {
  const [showForm, setShowForm]     = useState(false);
  const [editing, setEditing]       = useState(null);
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatus]   = useState("all");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toDelete, setToDelete]     = useState(null);
  const queryClient = useQueryClient();
  const { currentCompany } = useCompany();
  const sym = currencySymbol(currentCompany?.base_currency || 'USD');

  const { data: purchaseOrders = [], isLoading } = useQuery({
    queryKey: ['purchase-orders', currentCompany?.id],
    queryFn: () => currentCompany ? PurchaseOrder.list({ filters: { company_id: currentCompany.id }, orderBy: 'po_date', ascending: false }) : [],
    enabled: !!currentCompany,
  });

  const deleteMutation = useMutation({
    mutationFn: id => PurchaseOrder.delete(id),
    onSuccess: () => { queryClient.invalidateQueries(['purchase-orders']); setDeleteOpen(false); setToDelete(null); },
  });

  const convertToBillMutation = useMutation({
    mutationFn: async (po) => {
      const bill = {
        company_id: currentCompany.id,
        bill_number: `BILL-${po.po_number}`,
        vendor_id: po.vendor_id, vendor_name: po.vendor_name,
        bill_date: format(new Date(), 'yyyy-MM-dd'),
        due_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        status: 'pending',
        line_items: po.line_items?.map(i => ({ product_id: i.product_id, description: i.description, quantity: i.quantity_ordered, unit_cost: i.unit_cost, tax_rate: i.tax_rate, tax_amount: i.tax_amount, line_total: i.line_total })),
        subtotal: po.subtotal, tax_total: po.tax_total, total_amount: po.total_amount,
        amount_paid: 0, balance_due: po.total_amount, reference: po.po_number,
        notes: `Converted from PO ${po.po_number}`,
      };
      const createdBill = await Bill.create(bill);
      await PurchaseOrder.update(po.id, { converted_to_bill: true, bill_id: createdBill.id, status: 'fully_received' });
      return createdBill;
    },
    onSuccess: () => { queryClient.invalidateQueries(['purchase-orders']); queryClient.invalidateQueries(['bills']); },
  });

  const filtered = purchaseOrders.filter(po => {
    const matchSearch = !search || po.vendor_name?.toLowerCase().includes(search.toLowerCase()) || po.po_number?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || po.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalAmt   = purchaseOrders.reduce((s, p) => s + (p.total_amount || 0), 0);
  const openPOs    = purchaseOrders.filter(p => !['fully_received','cancelled'].includes(p.status)).length;
  const received   = purchaseOrders.filter(p => p.status === 'fully_received').length;
  const converted  = purchaseOrders.filter(p => p.converted_to_bill).length;

  const TABLE_HEADERS = [
    { label: 'PO #' }, { label: 'Vendor' }, { label: 'Date' },
    { label: 'Expected Delivery' }, { label: `Amount`, right: true },
    { label: 'Status' }, { label: 'Actions' },
  ];

  return (
    <PageShell>
      {showForm && <PurchaseOrderForm purchaseOrder={editing} onClose={() => { setShowForm(false); setEditing(null); }} currentCompany={currentCompany} />}

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Purchase Order?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete PO <strong>{toDelete?.po_number}</strong>. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(toDelete?.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PageHeader
        title="Purchase Orders"
        subtitle={`${purchaseOrders.length} orders · vendor procurement`}
        icon={ShoppingCart}
        accentColor="#F59E0B"
        actions={<NewBtn onClick={() => { setEditing(null); setShowForm(true); }} label="New Purchase Order" />}
      />

      <StatBar stats={[
        { label: 'Total Orders',   value: purchaseOrders.length, icon: ShoppingCart, color: '#1B4F8A' },
        { label: 'Open',           value: openPOs,               color: '#F59E0B' },
        { label: 'Received',       value: received,              icon: CheckCircle,  color: '#00A86B' },
        { label: 'Total Value',    value: fmt(totalAmt, sym),    icon: DollarSign,   color: '#8B5CF6' },
      ]} />

      <SearchBar value={search} onChange={setSearch} placeholder="Search PO number or vendor…">
        <FilterSelect
          value={statusFilter}
          onChange={setStatus}
          options={[
            { value: 'all', label: 'All Statuses' },
            { value: 'draft', label: 'Draft' },
            { value: 'sent', label: 'Sent' },
            { value: 'acknowledged', label: 'Acknowledged' },
            { value: 'partially_received', label: 'Partially Received' },
            { value: 'fully_received', label: 'Fully Received' },
            { value: 'cancelled', label: 'Cancelled' },
          ]}
        />
      </SearchBar>

      <ERPTable headers={TABLE_HEADERS} emptyIcon={ShoppingCart} emptyTitle="No purchase orders yet" emptyDesc="Create your first purchase order to start procurement.">
        {filtered.map(po => (
          <ERPTableRow key={po.id}>
            <ERPTableCell bold style={{ color: '#B45309', fontFamily: 'monospace' }}>{po.po_number}</ERPTableCell>
            <ERPTableCell bold>{po.vendor_name}</ERPTableCell>
            <ERPTableCell muted>{fmtDate(po.po_date)}</ERPTableCell>
            <ERPTableCell muted>{po.expected_delivery_date ? fmtDate(po.expected_delivery_date) : '—'}</ERPTableCell>
            <ERPTableCell right bold>{fmt(po.total_amount, sym)}</ERPTableCell>
            <ERPTableCell><StatusBadge status={po.status} /></ERPTableCell>
            <ERPTableCell>
              <div style={{ display: 'flex', gap: 6 }}>
                {!po.converted_to_bill && po.status !== 'cancelled' && (
                  <ActionBtn
                    onClick={() => { if (window.confirm(`Convert PO ${po.po_number} to a bill?`)) convertToBillMutation.mutate(po); }}
                    icon={FileText} label="To Bill" variant="outline"
                  />
                )}
                {po.converted_to_bill && (
                  <span style={{ padding: '4px 10px', background: '#E6F9F2', color: '#00875A', borderRadius: 99, fontSize: 11.5, fontWeight: 600 }}>Billed</span>
                )}
                <ActionBtn onClick={() => { setEditing(po); setShowForm(true); }} icon={Pencil} variant="outline" />
                <ActionBtn onClick={() => { setToDelete(po); setDeleteOpen(true); }} icon={Trash2} danger />
              </div>
            </ERPTableCell>
          </ERPTableRow>
        ))}
      </ERPTable>
    </PageShell>
  );
}

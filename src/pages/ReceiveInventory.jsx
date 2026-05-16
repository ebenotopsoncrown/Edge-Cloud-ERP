import React, { useState } from "react";
import { InventoryReceipt, PurchaseOrder } from "@/api/entities";
import { useQuery } from "@tanstack/react-query";
import { Package, Truck, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { useCompany } from "../components/auth/CompanyContext";
import ReceiveInventoryForm from "../components/inventory/ReceiveInventoryForm";
import PageShell, { PageHeader, SearchBar, StatBar, ERPTable, ERPTableRow, ERPTableCell, StatusBadge, NewBtn } from "../components/shared/PageShell";

const fmtDate = d => { try { return format(new Date(d), 'MMM d, yyyy'); } catch { return '—'; } };

export default function ReceiveInventory() {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch]     = useState("");
  const { currentCompany } = useCompany();

  const { data: receipts = [], isLoading } = useQuery({
    queryKey: ['inventory-receipts', currentCompany?.id],
    queryFn: () => currentCompany ? InventoryReceipt.list({ filters: { company_id: currentCompany.id }, orderBy: 'receipt_date', ascending: false }) : [],
    enabled: !!currentCompany,
  });

  const { data: pendingPOs = [] } = useQuery({
    queryKey: ['pending-pos', currentCompany?.id],
    queryFn: () => currentCompany ? PurchaseOrder.list({ filters: { company_id: currentCompany.id, status: 'sent' } }) : [],
    enabled: !!currentCompany,
  });

  const filtered = receipts.filter(r =>
    !search ||
    r.receipt_number?.toLowerCase().includes(search.toLowerCase()) ||
    r.vendor_name?.toLowerCase().includes(search.toLowerCase())
  );

  const received  = receipts.filter(r => r.status === 'received').length;
  const draft     = receipts.filter(r => r.status === 'draft').length;

  const TABLE_HEADERS = [
    { label: 'Receipt #' }, { label: 'Vendor' }, { label: 'Date' },
    { label: 'PO Reference' }, { label: 'Total Items' }, { label: 'Status' },
  ];

  return (
    <PageShell>
      {showForm && <ReceiveInventoryForm onClose={() => setShowForm(false)} pendingPOs={pendingPOs} />}

      <PageHeader
        title="Receive Inventory"
        subtitle={`${receipts.length} receipts · goods receiving`}
        icon={Truck}
        accentColor="#00A86B"
        actions={<NewBtn onClick={() => setShowForm(true)} label="Receive Goods" />}
      />

      <StatBar stats={[
        { label: 'Total Receipts', value: receipts.length, icon: Package,      color: '#1B4F8A' },
        { label: 'Received',       value: received,         icon: CheckCircle,  color: '#00A86B' },
        { label: 'Draft',          value: draft,            icon: Clock,        color: '#F59E0B' },
        { label: 'Pending POs',    value: pendingPOs.length, icon: Truck,       color: '#8B5CF6' },
      ]} />

      <SearchBar value={search} onChange={setSearch} placeholder="Search receipt number or vendor…" />

      <ERPTable headers={TABLE_HEADERS} emptyIcon={Package} emptyTitle="No inventory receipts yet" emptyDesc="Record goods received from vendors.">
        {filtered.map(r => (
          <ERPTableRow key={r.id}>
            <ERPTableCell bold style={{ color: '#00875A', fontFamily: 'monospace' }}>{r.receipt_number}</ERPTableCell>
            <ERPTableCell bold>{r.vendor_name}</ERPTableCell>
            <ERPTableCell muted>{fmtDate(r.receipt_date)}</ERPTableCell>
            <ERPTableCell muted>{r.po_number || '—'}</ERPTableCell>
            <ERPTableCell>{r.line_items?.length || 0} items</ERPTableCell>
            <ERPTableCell><StatusBadge status={r.status} /></ERPTableCell>
          </ERPTableRow>
        ))}
      </ERPTable>
    </PageShell>
  );
}

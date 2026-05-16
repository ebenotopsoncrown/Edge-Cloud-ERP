import React, { useState } from "react";
import { Vendor } from "@/api/entities";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, Pencil, Trash2, DollarSign, Globe } from "lucide-react";
import VendorForm from "../components/vendors/VendorForm";
import { useCompany } from "../components/auth/CompanyContext";
import PageShell, { PageHeader, SearchBar, StatBar, ERPTable, ERPTableRow, ERPTableCell, StatusBadge, NewBtn, ActionBtn } from "../components/shared/PageShell";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Vendors() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [search, setSearch]     = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const queryClient = useQueryClient();
  const { currentCompany } = useCompany();

  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ['vendors', currentCompany?.id],
    queryFn: () => currentCompany ? Vendor.list({ filters: { company_id: currentCompany.id }, orderBy: 'created_date', ascending: false }) : [],
    enabled: !!currentCompany,
  });

  const deleteMutation = useMutation({
    mutationFn: id => Vendor.delete(id),
    onSuccess: () => { queryClient.invalidateQueries(['vendors']); setDeleteOpen(false); setToDelete(null); },
  });

  const filtered = vendors.filter(v =>
    !search ||
    v.company_name?.toLowerCase().includes(search.toLowerCase()) ||
    v.email?.toLowerCase().includes(search.toLowerCase()) ||
    v.contact_person?.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = vendors.filter(v => v.is_active !== false).length;
  const withCredit  = vendors.filter(v => v.credit_limit > 0).length;

  const TABLE_HEADERS = [
    { label: 'Vendor' }, { label: 'Contact' }, { label: 'Email' },
    { label: 'Phone' }, { label: 'Payment Terms' }, { label: 'Status' }, { label: 'Actions' },
  ];

  return (
    <PageShell>
      {showForm && <VendorForm vendor={editing} onClose={() => { setShowForm(false); setEditing(null); }} companyId={currentCompany?.id} />}

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vendor?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete <strong>{toDelete?.company_name}</strong>. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(toDelete?.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PageHeader
        title="Vendors"
        subtitle={`${vendors.length} vendors · supplier management`}
        icon={Building2}
        accentColor="#8B5CF6"
        actions={<NewBtn onClick={() => { setEditing(null); setShowForm(true); }} label="New Vendor" />}
      />

      <StatBar stats={[
        { label: 'Total Vendors',  value: vendors.length, icon: Building2, color: '#1B4F8A' },
        { label: 'Active',         value: activeCount,    icon: Globe,     color: '#00A86B' },
        { label: 'With Credit',    value: withCredit,     icon: DollarSign, color: '#8B5CF6' },
      ]} />

      <SearchBar value={search} onChange={setSearch} placeholder="Search by vendor name, contact or email…" />

      <ERPTable headers={TABLE_HEADERS} emptyIcon={Building2} emptyTitle="No vendors yet" emptyDesc="Add your first vendor to start managing purchases.">
        {filtered.map(v => (
          <ERPTableRow key={v.id}>
            <ERPTableCell bold>{v.company_name}</ERPTableCell>
            <ERPTableCell>{v.contact_person}</ERPTableCell>
            <ERPTableCell muted>{v.email}</ERPTableCell>
            <ERPTableCell muted>{v.phone}</ERPTableCell>
            <ERPTableCell>{v.payment_terms || '—'}</ERPTableCell>
            <ERPTableCell><StatusBadge status={v.is_active !== false ? 'active' : 'inactive'} /></ERPTableCell>
            <ERPTableCell>
              <div style={{ display: 'flex', gap: 6 }}>
                <ActionBtn onClick={() => { setEditing(v); setShowForm(true); }} icon={Pencil} variant="outline" />
                <ActionBtn onClick={() => { setToDelete(v); setDeleteOpen(true); }} icon={Trash2} danger />
              </div>
            </ERPTableCell>
          </ERPTableRow>
        ))}
      </ERPTable>
    </PageShell>
  );
}

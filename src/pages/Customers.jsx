import React, { useState } from "react";
import { Customer, Invoice } from "@/api/entities";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Pencil, Trash2, DollarSign, UserCheck, UserX } from "lucide-react";
import CustomerForm from "../components/customers/CustomerForm";
import { useCompany } from "../components/auth/CompanyContext";
import PageShell, { PageHeader, SearchBar, StatBar, ERPTable, ERPTableRow, ERPTableCell, StatusBadge, NewBtn, ActionBtn } from "../components/shared/PageShell";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const fmt = (n, sym = '$') => `${sym}${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const currencySymbol = code => ({ USD:'$',EUR:'€',GBP:'£',NGN:'₦',ZAR:'R',KES:'KSh',GHS:'₵',CAD:'C$',AUD:'A$',INR:'₹',JPY:'¥',CNY:'¥' }[code] || code);

export default function Customers() {
  const [showForm, setShowForm]       = useState(false);
  const [editing, setEditing]         = useState(null);
  const [search, setSearch]           = useState("");
  const [deleteOpen, setDeleteOpen]   = useState(false);
  const [toDelete, setToDelete]       = useState(null);
  const queryClient = useQueryClient();
  const { currentCompany } = useCompany();
  const sym = currencySymbol(currentCompany?.base_currency || 'USD');

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers', currentCompany?.id],
    queryFn: () => currentCompany ? Customer.list({ filters: { company_id: currentCompany.id }, orderBy: 'created_date', ascending: false }) : [],
    enabled: !!currentCompany,
  });
  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices', currentCompany?.id],
    queryFn: () => currentCompany ? Invoice.list({ filters: { company_id: currentCompany.id } }) : [],
    enabled: !!currentCompany,
  });

  const deleteMutation = useMutation({
    mutationFn: id => Customer.delete(id),
    onSuccess: () => { queryClient.invalidateQueries(['customers']); setDeleteOpen(false); setToDelete(null); },
  });

  const enriched = customers.map(c => {
    const outstanding = invoices
      .filter(i => i.customer_id === c.id && ['sent','viewed','partial','overdue'].includes(i.status))
      .reduce((s, i) => s + (i.balance_due || 0), 0);
    return { ...c, outstanding };
  });

  const filtered = enriched.filter(c =>
    !search || c.company_name?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount   = customers.filter(c => c.is_active).length;
  const totalCredit   = customers.reduce((s, c) => s + (c.credit_limit || 0), 0);
  const totalOutstand = enriched.reduce((s, c) => s + c.outstanding, 0);

  const TABLE_HEADERS = [
    { label: 'Customer' }, { label: 'Contact' }, { label: 'Email' }, { label: 'Phone' },
    { label: 'Credit Limit', right: true }, { label: 'Outstanding', right: true },
    { label: 'Status' }, { label: 'Actions' },
  ];

  return (
    <PageShell>
      {showForm && <CustomerForm customer={editing} onClose={() => { setShowForm(false); setEditing(null); }} companyId={currentCompany?.id} />}

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete <strong>{toDelete?.company_name}</strong>. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(toDelete?.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PageHeader
        title="Customers"
        subtitle={`${customers.length} customers · ${activeCount} active`}
        icon={Users}
        actions={<NewBtn onClick={() => { setEditing(null); setShowForm(true); }} label="New Customer" />}
      />

      <StatBar stats={[
        { label: 'Total Customers', value: customers.length, icon: Users,     color: '#1B4F8A' },
        { label: 'Active',          value: activeCount,       icon: UserCheck, color: '#00A86B' },
        { label: 'Credit Extended', value: fmt(totalCredit, sym), icon: DollarSign, color: '#F59E0B' },
        { label: 'AR Outstanding',  value: fmt(totalOutstand, sym), icon: DollarSign, color: '#EF4444' },
      ]} />

      <SearchBar value={search} onChange={setSearch} placeholder="Search by name or email…" />

      <ERPTable headers={TABLE_HEADERS} emptyIcon={Users} emptyTitle="No customers yet" emptyDesc="Add your first customer to get started.">
        {filtered.map(c => (
          <ERPTableRow key={c.id}>
            <ERPTableCell bold>{c.company_name}</ERPTableCell>
            <ERPTableCell>{c.contact_person}</ERPTableCell>
            <ERPTableCell muted>{c.email}</ERPTableCell>
            <ERPTableCell muted>{c.phone}</ERPTableCell>
            <ERPTableCell right>{fmt(c.credit_limit, sym)}</ERPTableCell>
            <ERPTableCell right style={{ color: c.outstanding > 0 ? '#EF4444' : '#00875A', fontWeight: 700 }}>
              {fmt(c.outstanding, sym)}
            </ERPTableCell>
            <ERPTableCell><StatusBadge status={c.is_active ? 'active' : 'inactive'} /></ERPTableCell>
            <ERPTableCell>
              <div style={{ display: 'flex', gap: 6 }}>
                <ActionBtn onClick={() => { setEditing(c); setShowForm(true); }} icon={Pencil} variant="outline" />
                <ActionBtn onClick={() => { setToDelete(c); setDeleteOpen(true); }} icon={Trash2} danger />
              </div>
            </ERPTableCell>
          </ERPTableRow>
        ))}
      </ERPTable>
    </PageShell>
  );
}

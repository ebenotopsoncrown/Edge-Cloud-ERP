import React, { useState } from "react";
import { Account } from "@/api/entities";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Book, Pencil, Trash2 } from "lucide-react";
import AccountForm from "../components/accounts/AccountForm";
import { useCompany } from "../components/auth/CompanyContext";
import PageShell, { PageHeader, SearchBar, StatBar, ERPTable, ERPTableRow, ERPTableCell, StatusBadge, NewBtn, ActionBtn } from "../components/shared/PageShell";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const TYPE_COLORS = {
  Asset:     { bg: '#EBF4FB', color: '#1B4F8A' },
  Liability: { bg: '#FEF2F2', color: '#DC2626' },
  Equity:    { bg: '#F3E8FF', color: '#7C3AED' },
  Revenue:   { bg: '#E6F9F2', color: '#00875A' },
  Expense:   { bg: '#FEF3C7', color: '#B45309' },
};

function AccountTypeBadge({ type }) {
  const group = /asset/i.test(type) ? 'Asset' : /liab/i.test(type) ? 'Liability' : /equity/i.test(type) ? 'Equity' : /revenue/i.test(type) ? 'Revenue' : 'Expense';
  const cfg = TYPE_COLORS[group] || { bg: '#F1F5F9', color: '#64748B' };
  const label = (type || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return (
    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 99, fontSize: 11.5, fontWeight: 600, background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap' }}>
      {label}
    </span>
  );
}

export default function ChartOfAccounts() {
  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState(null);
  const [search, setSearch]       = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toDelete, setToDelete]   = useState(null);
  const queryClient = useQueryClient();
  const { currentCompany } = useCompany();

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['accounts', currentCompany?.id],
    queryFn: () => currentCompany ? Account.list({ filters: { company_id: currentCompany.id }, orderBy: 'account_code', ascending: true }) : [],
    enabled: !!currentCompany,
  });

  const deleteMutation = useMutation({
    mutationFn: id => Account.delete(id),
    onSuccess: () => { queryClient.invalidateQueries(['accounts']); setDeleteOpen(false); setToDelete(null); },
  });

  const filtered = accounts.filter(a =>
    !search ||
    a.account_name?.toLowerCase().includes(search.toLowerCase()) ||
    a.account_code?.toLowerCase().includes(search.toLowerCase())
  );

  const assetCount   = accounts.filter(a => /asset/i.test(a.account_type)).length;
  const liabCount    = accounts.filter(a => /liab/i.test(a.account_type)).length;
  const revenueCount = accounts.filter(a => /revenue/i.test(a.account_type)).length;
  const expenseCount = accounts.filter(a => /expense/i.test(a.account_type)).length;

  const TABLE_HEADERS = [
    { label: 'Code' }, { label: 'Account Name' }, { label: 'Type' },
    { label: 'Category' }, { label: 'Description' }, { label: 'Actions' },
  ];

  return (
    <PageShell>
      {showForm && <AccountForm account={editing} onClose={() => { setShowForm(false); setEditing(null); }} companyId={currentCompany?.id} />}

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete <strong>{toDelete?.account_name}</strong>. This action cannot be undone and may affect existing transactions.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(toDelete?.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PageHeader
        title="Chart of Accounts"
        subtitle={`${accounts.length} accounts · double-entry bookkeeping`}
        icon={Book}
        actions={<NewBtn onClick={() => { setEditing(null); setShowForm(true); }} label="New Account" />}
      />

      <StatBar stats={[
        { label: 'Total Accounts', value: accounts.length, icon: Book, color: '#1B4F8A' },
        { label: 'Assets',         value: assetCount,   color: '#1B4F8A' },
        { label: 'Liabilities',    value: liabCount,    color: '#EF4444' },
        { label: 'Revenue',        value: revenueCount, color: '#00A86B' },
        { label: 'Expenses',       value: expenseCount, color: '#F59E0B' },
      ]} />

      <SearchBar value={search} onChange={setSearch} placeholder="Search by account code or name…" />

      <ERPTable headers={TABLE_HEADERS} emptyIcon={Book} emptyTitle="No accounts yet" emptyDesc="Start by creating your chart of accounts.">
        {filtered.map(a => (
          <ERPTableRow key={a.id}>
            <ERPTableCell style={{ fontFamily: 'monospace', fontSize: 12.5, fontWeight: 700, color: '#1B4F8A' }}>{a.account_code}</ERPTableCell>
            <ERPTableCell bold>{a.account_name}</ERPTableCell>
            <ERPTableCell><AccountTypeBadge type={a.account_type} /></ERPTableCell>
            <ERPTableCell muted style={{ fontSize: 12.5 }}>
              {(a.account_category || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </ERPTableCell>
            <ERPTableCell muted style={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {a.description}
            </ERPTableCell>
            <ERPTableCell>
              <div style={{ display: 'flex', gap: 6 }}>
                <ActionBtn onClick={() => { setEditing(a); setShowForm(true); }} icon={Pencil} variant="outline" />
                <ActionBtn onClick={() => { setToDelete(a); setDeleteOpen(true); }} icon={Trash2} danger />
              </div>
            </ERPTableCell>
          </ERPTableRow>
        ))}
      </ERPTable>
    </PageShell>
  );
}

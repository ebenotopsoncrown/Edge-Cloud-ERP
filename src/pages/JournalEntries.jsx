import React, { useState } from "react";
import { useMoney } from "@/components/shared/useMoney";
import { JournalEntry, Account } from "@/api/entities";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Eye, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useCompany } from "../components/auth/CompanyContext";
import { getCurrencySymbol } from "../components/shared/FinancialCalculations";
import TransactionDetails from "../components/reports/TransactionDetails";
import ManualJournalEntryForm from "../components/journalEntries/ManualJournalEntryForm";
import PageShell, { PageHeader, SearchBar, StatBar, ERPTable, ERPTableRow, ERPTableCell, StatusBadge, ActionBtn, NewBtn } from "../components/shared/PageShell";

const fmtDate = d => { try { return format(new Date(d), 'MMM d, yyyy'); } catch { return '—'; } };

export default function JournalEntries() {
  const money = useMoney();
  const [selectedEntryId, setSelectedEntryId] = useState(null);
  const [search, setSearch]                   = useState("");
  const [showNewEntry, setShowNewEntry]       = useState(false);
  const { currentCompany } = useCompany();
  const queryClient = useQueryClient();

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['journal-entries', currentCompany?.id],
    queryFn: () => currentCompany
      ? JournalEntry.list({ filters: { company_id: currentCompany.id }, orderBy: 'entry_date', ascending: false })
      : [],
    enabled: !!currentCompany,
  });

  const deleteJournalEntryMutation = useMutation({
    mutationFn: async (entry) => {
      if (!window.confirm(`Delete journal entry ${entry.entry_number}? This will reverse all account balances. This cannot be undone.`)) {
        throw new Error('Cancelled');
      }
      if (entry.line_items?.length > 0) {
        for (const line of entry.line_items) {
          try {
            const account = await Account.get(line.account_id);
            if (account) {
              const debit = parseFloat(line.debit) || 0;
              const credit = parseFloat(line.credit) || 0;
              const isDebitNormal = ['asset', 'expense', 'cost_of_goods_sold'].includes(account.account_type);
              const newBalance = (parseFloat(account.balance) || 0) + (isDebitNormal ? credit - debit : debit - credit);
              await Account.update(account.id, { balance: newBalance, company_id: account.company_id });
            }
          } catch {}
        }
      }
      await JournalEntry.delete(entry.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['journal-entries']);
      queryClient.invalidateQueries(['accounts']);
    },
    onError: err => { if (err.message !== 'Cancelled') alert(`Error: ${err.message}`); },
  });

  const filtered = entries.filter(e =>
    !search ||
    e.entry_number?.toLowerCase().includes(search.toLowerCase()) ||
    e.description?.toLowerCase().includes(search.toLowerCase()) ||
    e.reference?.toLowerCase().includes(search.toLowerCase())
  );

  const posted = entries.filter(e => e.status === 'posted').length;
  const totalDebits  = entries.filter(e => e.status === 'posted').reduce((s, e) => s + (e.total_debits || 0), 0);

  const TABLE_HEADERS = [
    { label: 'Entry #' }, { label: 'Date' }, { label: 'Description' }, { label: 'Reference' },
    { label: 'Debits', right: true }, { label: 'Credits', right: true }, { label: 'Status' }, { label: 'Source' }, { label: 'Actions', right: true },
  ];

  return (
    <PageShell>
      {selectedEntryId && <TransactionDetails entryId={selectedEntryId} onClose={() => setSelectedEntryId(null)} />}
      {showNewEntry && <ManualJournalEntryForm onClose={() => setShowNewEntry(false)} />}

      <PageHeader
        title="Journal Entries"
        subtitle="Manual and system-generated accounting transactions"
        icon={FileText}
        accentColor="#8B5CF6"
        actions={<NewBtn onClick={() => setShowNewEntry(true)} label="New Journal Entry" />}
      />

      <StatBar stats={[
        { label: 'Total Entries', value: entries.length, icon: FileText, color: '#1B4F8A' },
        { label: 'Posted',        value: posted,          color: '#00A86B' },
        { label: 'Draft',         value: entries.filter(e => e.status === 'draft').length, color: '#F59E0B' },
        { label: 'Total Posted Debits', value: money(totalDebits), color: '#8B5CF6' },
      ]} />

      <SearchBar value={search} onChange={setSearch} placeholder="Search entry number, description or reference…" />

      <ERPTable headers={TABLE_HEADERS} emptyIcon={FileText} emptyTitle="No journal entries" emptyDesc="Journal entries are auto-created when posting invoices, bills, and payments.">
        {filtered.map(entry => (
          <ERPTableRow key={entry.id} onClick={() => setSelectedEntryId(entry.id)}>
            <ERPTableCell bold style={{ color: '#1B4F8A', fontFamily: 'monospace' }}>{entry.entry_number}</ERPTableCell>
            <ERPTableCell muted>{fmtDate(entry.entry_date)}</ERPTableCell>
            <ERPTableCell bold>{entry.description}</ERPTableCell>
            <ERPTableCell muted style={{ fontSize: 12 }}>{entry.reference}</ERPTableCell>
            <ERPTableCell right style={{ color: '#00875A', fontWeight: 700 }}>{money(entry.total_debits)}</ERPTableCell>
            <ERPTableCell right style={{ color: '#1B4F8A', fontWeight: 700 }}>{money(entry.total_credits)}</ERPTableCell>
            <ERPTableCell><StatusBadge status={entry.status} /></ERPTableCell>
            <ERPTableCell>
              {entry.source_type && (
                <span style={{ padding: '2px 8px', background: '#F1F5F9', borderRadius: 99, fontSize: 11, fontWeight: 600, color: '#64748B' }}>
                  {entry.source_type.replace(/_/g, ' ')}
                </span>
              )}
            </ERPTableCell>
            <ERPTableCell right>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }} onClick={e => e.stopPropagation()}>
                <ActionBtn onClick={() => setSelectedEntryId(entry.id)} icon={Eye} variant="outline" />
                <ActionBtn onClick={() => deleteJournalEntryMutation.mutate(entry)} icon={Trash2} danger />
              </div>
            </ERPTableCell>
          </ERPTableRow>
        ))}
      </ERPTable>
    </PageShell>
  );
}

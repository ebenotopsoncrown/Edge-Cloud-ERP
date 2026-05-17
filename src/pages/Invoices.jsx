import React, { useState } from "react";
import { Invoice } from "@/api/entities";
import { useQuery } from "@tanstack/react-query";
import { FileText, Plus, Pencil, DollarSign, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import InvoiceForm from "../components/invoices/InvoiceForm";
import { useCompany } from "../components/auth/CompanyContext";
import PageShell, { PageHeader, SearchBar, StatBar, ERPTable, ERPTableRow, ERPTableCell, StatusBadge, NewBtn, ActionBtn, FilterSelect } from "../components/shared/PageShell";

const fmt = (n, sym = '$') => `${sym}${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = d => { try { return format(new Date(d), 'MMM d, yyyy'); } catch { return '—'; } };

const currencySymbol = code => ({ USD:'$',EUR:'€',GBP:'£',NGN:'₦',ZAR:'R',KES:'KSh',GHS:'₵',CAD:'C$',AUD:'A$',INR:'₹',JPY:'¥',CNY:'¥' }[code] || code);

export default function Invoices() {
  const [showForm, setShowForm]     = useState(false);
  const [editing, setEditing]       = useState(null);
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatus]   = useState("all");
  const { currentCompany }          = useCompany();
  const sym = currencySymbol(currentCompany?.base_currency || 'USD');

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices', currentCompany?.id],
    queryFn: () => currentCompany
      ? Invoice.list({ filters: { company_id: currentCompany.id }, orderBy: 'invoice_date', ascending: false })
      : [],
    enabled: !!currentCompany,
  });

  const filtered = invoices.filter(inv => {
    const matchSearch = !search ||
      inv.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      inv.invoice_number?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const open    = inv => { setEditing(inv); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditing(null); };

  const totalAmt  = invoices.reduce((s, i) => s + (i.total_amount || 0), 0);
  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total_amount || 0), 0);
  const overdue   = invoices.filter(i => i.status === 'overdue').length;
  const totalAR   = invoices.filter(i => !['paid','cancelled'].includes(i.status)).reduce((s, i) => s + (i.balance_due || 0), 0);

  const TABLE_HEADERS = [
    { label: 'Invoice #' }, { label: 'Customer' }, { label: 'Date' },
    { label: 'Due Date' }, { label: `Amount (${currentCompany?.base_currency || 'USD'})`, right: true },
    { label: 'Balance Due', right: true }, { label: 'Status' }, { label: 'Actions' },
  ];

  return (
    <PageShell>
      {showForm && <InvoiceForm invoice={editing} onClose={closeForm} />}

      <PageHeader
        title="Sales Invoices"
        subtitle={`${invoices.length} total invoices · ${currentCompany?.base_currency || 'USD'}`}
        icon={FileText}
        actions={<NewBtn onClick={() => { setEditing(null); setShowForm(true); }} label="New Invoice" />}
      />

      <StatBar stats={[
        { label: 'Total Invoiced', value: fmt(totalAmt, sym), icon: DollarSign, color: '#2E7DE8' },
        { label: 'Collected',      value: fmt(totalPaid, sym), icon: CheckCircle, color: '#00A86B' },
        { label: 'AR Balance',     value: fmt(totalAR, sym), icon: Clock, color: '#F59E0B' },
        { label: 'Overdue',        value: overdue, icon: AlertCircle, color: '#EF4444' },
      ]} />

      <SearchBar value={search} onChange={setSearch} placeholder="Search invoice # or customer…">
        <FilterSelect
          value={statusFilter}
          onChange={setStatus}
          options={[
            { value: 'all', label: 'All Statuses' },
            { value: 'draft', label: 'Draft' },
            { value: 'sent', label: 'Sent' },
            { value: 'viewed', label: 'Viewed' },
            { value: 'partial', label: 'Partial' },
            { value: 'paid', label: 'Paid' },
            { value: 'overdue', label: 'Overdue' },
            { value: 'cancelled', label: 'Cancelled' },
          ]}
        />
      </SearchBar>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#94A3B8' }}>
          <div style={{ width: 36, height: 36, border: '3px solid #E2E8F0', borderTopColor: '#2E7DE8', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 12px' }} />
          Loading invoices…
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <ERPTable headers={TABLE_HEADERS} emptyIcon={FileText} emptyTitle="No invoices yet" emptyDesc="Click 'New Invoice' to create your first invoice.">
          {filtered.map(inv => (
            <ERPTableRow key={inv.id} onClick={() => open(inv)}>
              <ERPTableCell bold style={{ color: '#2E7DE8' }}>{inv.invoice_number}</ERPTableCell>
              <ERPTableCell bold>{inv.customer_name}</ERPTableCell>
              <ERPTableCell muted>{fmtDate(inv.invoice_date)}</ERPTableCell>
              <ERPTableCell muted>{fmtDate(inv.due_date)}</ERPTableCell>
              <ERPTableCell right bold>{fmt(inv.total_amount, sym)}</ERPTableCell>
              <ERPTableCell right style={{ color: inv.balance_due > 0 ? '#EF4444' : '#00875A', fontWeight: 700 }}>
                {fmt(inv.balance_due, sym)}
              </ERPTableCell>
              <ERPTableCell><StatusBadge status={inv.status} /></ERPTableCell>
              <ERPTableCell>
                <div onClick={e => e.stopPropagation()}>
                  <ActionBtn onClick={() => open(inv)} icon={Pencil} label="Edit" variant="outline" />
                </div>
              </ERPTableCell>
            </ERPTableRow>
          ))}
        </ERPTable>
      )}
    </PageShell>
  );
}

import React, { useState } from "react";
import { Bill } from "@/api/entities";
import { useQuery } from "@tanstack/react-query";
import { Receipt, DollarSign, Clock, AlertCircle, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import BillForm from "../components/bills/BillForm";
import { useCompany } from "../components/auth/CompanyContext";
import PageShell, { PageHeader, SearchBar, StatBar, ERPTable, ERPTableRow, ERPTableCell, StatusBadge, NewBtn, FilterSelect } from "../components/shared/PageShell";

const fmt = (n, sym = '$') => `${sym}${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = d => { try { return format(new Date(d), 'MMM d, yyyy'); } catch { return '—'; } };
const currencySymbol = code => ({ USD:'$',EUR:'€',GBP:'£',NGN:'₦',ZAR:'R',KES:'KSh',GHS:'₵',CAD:'C$',AUD:'A$',INR:'₹',JPY:'¥',CNY:'¥' }[code] || code);

export default function Bills() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [search, setSearch]     = useState("");
  const [statusFilter, setStatus] = useState("all");
  const { currentCompany }      = useCompany();
  const sym = currencySymbol(currentCompany?.base_currency || 'USD');

  const { data: bills = [], isLoading } = useQuery({
    queryKey: ['bills', currentCompany?.id],
    queryFn: () => currentCompany
      ? Bill.list({ filters: { company_id: currentCompany.id }, orderBy: 'bill_date', ascending: false })
      : [],
    enabled: !!currentCompany,
  });

  const filtered = bills.filter(b => {
    const matchSearch = !search ||
      b.vendor_name?.toLowerCase().includes(search.toLowerCase()) ||
      b.bill_number?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalAmt  = bills.reduce((s, b) => s + (b.total_amount || 0), 0);
  const paid      = bills.filter(b => b.status === 'paid').reduce((s, b) => s + (b.total_amount || 0), 0);
  const ap        = bills.filter(b => !['paid','cancelled'].includes(b.status)).reduce((s, b) => s + (b.balance_due || b.total_amount || 0), 0);
  const overdueN  = bills.filter(b => b.status === 'overdue').length;

  const TABLE_HEADERS = [
    { label: 'Bill #' }, { label: 'Vendor' }, { label: 'Date' },
    { label: 'Due Date' }, { label: `Amount (${currentCompany?.base_currency || 'USD'})`, right: true },
    { label: 'Balance Due', right: true }, { label: 'Status' },
  ];

  return (
    <PageShell>
      {showForm && <BillForm bill={editing} onClose={() => { setShowForm(false); setEditing(null); }} />}

      <PageHeader
        title="Purchase Bills"
        subtitle={`${bills.length} bills · accounts payable`}
        icon={Receipt}
        accentColor="#F59E0B"
        actions={<NewBtn onClick={() => { setEditing(null); setShowForm(true); }} label="New Bill" />}
      />

      <StatBar stats={[
        { label: 'Total Bills',  value: fmt(totalAmt, sym), icon: DollarSign,  color: '#1B4F8A' },
        { label: 'Paid',         value: fmt(paid, sym),     icon: CheckCircle, color: '#00A86B' },
        { label: 'AP Balance',   value: fmt(ap, sym),       icon: Clock,       color: '#F59E0B' },
        { label: 'Overdue',      value: overdueN,           icon: AlertCircle, color: '#EF4444' },
      ]} />

      <SearchBar value={search} onChange={setSearch} placeholder="Search bill # or vendor…">
        <FilterSelect
          value={statusFilter}
          onChange={setStatus}
          options={[
            { value: 'all', label: 'All Statuses' },
            { value: 'draft', label: 'Draft' },
            { value: 'pending', label: 'Pending' },
            { value: 'partial', label: 'Partial' },
            { value: 'paid', label: 'Paid' },
            { value: 'overdue', label: 'Overdue' },
            { value: 'cancelled', label: 'Cancelled' },
          ]}
        />
      </SearchBar>

      <ERPTable headers={TABLE_HEADERS} emptyIcon={Receipt} emptyTitle="No bills yet" emptyDesc="Click 'New Bill' to record your first vendor bill.">
        {filtered.map(bill => (
          <ERPTableRow key={bill.id} onClick={() => { setEditing(bill); setShowForm(true); }}>
            <ERPTableCell bold style={{ color: '#B45309' }}>{bill.bill_number}</ERPTableCell>
            <ERPTableCell bold>{bill.vendor_name}</ERPTableCell>
            <ERPTableCell muted>{fmtDate(bill.bill_date)}</ERPTableCell>
            <ERPTableCell muted>{fmtDate(bill.due_date)}</ERPTableCell>
            <ERPTableCell right bold>{fmt(bill.total_amount, sym)}</ERPTableCell>
            <ERPTableCell right style={{ color: (bill.balance_due || bill.total_amount) > 0 ? '#EF4444' : '#00875A', fontWeight: 700 }}>
              {fmt(bill.balance_due ?? bill.total_amount, sym)}
            </ERPTableCell>
            <ERPTableCell><StatusBadge status={bill.status} /></ERPTableCell>
          </ERPTableRow>
        ))}
      </ERPTable>
    </PageShell>
  );
}

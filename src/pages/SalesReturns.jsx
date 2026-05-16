import React, { useState } from "react";
import { SalesReturn } from "@/api/entities";
import { useQuery } from "@tanstack/react-query";
import { Receipt, RefreshCcw } from "lucide-react";
import { format } from "date-fns";
import SalesReturnForm from "../components/sales/SalesReturnForm";
import { useCompany } from "../components/auth/CompanyContext";
import PageShell, {
  PageHeader,
  StatBar,
  ERPTable,
  ERPTableRow,
  ERPTableCell,
  StatusBadge,
  NewBtn,
} from "../components/shared/PageShell";

const ACCENT = "#EF4444";

export default function SalesReturns() {
  const [showForm, setShowForm] = useState(false);
  const { currentCompany } = useCompany();

  const { data: returns = [], isLoading } = useQuery({
    queryKey: ['sales-returns', currentCompany?.id],
    queryFn: () =>
      currentCompany
        ? SalesReturn.list({
            filters: { company_id: currentCompany.id },
            orderBy: 'return_date',
            ascending: false,
          })
        : [],
    enabled: !!currentCompany,
  });

  const baseCurrency = currentCompany?.base_currency || 'USD';

  const totalAmount = returns.reduce((s, r) => s + (r.total_amount || 0), 0);
  const completedCount = returns.filter(r => r.status === 'completed').length;
  const draftCount = returns.filter(r => r.status === 'draft').length;

  const TABLE_HEADERS = [
    { label: 'Credit Memo #' },
    { label: 'Customer' },
    { label: 'Invoice #' },
    { label: 'Return Date' },
    { label: `Amount (${baseCurrency})`, right: true },
    { label: 'Status' },
  ];

  return (
    <PageShell>
      <PageHeader
        title="Sales Returns / Credit Memos"
        subtitle="Process customer returns and credit memos"
        icon={Receipt}
        accentColor={ACCENT}
        actions={<NewBtn onClick={() => setShowForm(true)} label="New Credit Memo" />}
      />

      <StatBar
        stats={[
          { label: 'Total Returns', value: returns.length, color: ACCENT },
          {
            label: `Total Amount (${baseCurrency})`,
            value: totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            color: ACCENT,
          },
          { label: 'Completed', value: completedCount, color: '#00A86B' },
          { label: 'Draft', value: draftCount, color: '#94A3B8' },
        ]}
      />

      {showForm && <SalesReturnForm onClose={() => setShowForm(false)} />}

      <ERPTable
        headers={TABLE_HEADERS}
        isLoading={isLoading}
        emptyIcon={RefreshCcw}
        emptyTitle="No sales returns yet"
        emptyDesc="Create your first credit memo to process a customer return."
        emptyAction={<NewBtn onClick={() => setShowForm(true)} label="Create First Credit Memo" />}
      >
        {returns.map((ret) => (
          <ERPTableRow key={ret.id}>
            <ERPTableCell bold style={{ color: '#1B4F8A' }}>
              {ret.return_number}
            </ERPTableCell>
            <ERPTableCell>{ret.customer_name}</ERPTableCell>
            <ERPTableCell muted>{ret.invoice_number}</ERPTableCell>
            <ERPTableCell muted>
              {ret.return_date ? format(new Date(ret.return_date), 'MMM d, yyyy') : '—'}
            </ERPTableCell>
            <ERPTableCell right bold style={{ color: ACCENT }}>
              -{ret.total_amount?.toFixed(2)}
            </ERPTableCell>
            <ERPTableCell>
              <StatusBadge status={ret.status} />
            </ERPTableCell>
          </ERPTableRow>
        ))}
      </ERPTable>
    </PageShell>
  );
}

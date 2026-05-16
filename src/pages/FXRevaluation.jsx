import React, { useState } from "react";
import { ExchangeRate, Account, Invoice, Bill, JournalEntry } from "@/api/entities";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, RefreshCw, Save, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { useCompany } from "../components/auth/CompanyContext";
import PageShell, { PageHeader, StatBar, ERPTable, ERPTableRow, ERPTableCell, ActionBtn } from "../components/shared/PageShell";

const PRIMARY = '#1B4F8A';
const ACCENT  = '#00A86B';

const inputStyle = {
  width: '100%', padding: '9px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8,
  fontSize: 13.5, color: '#0F172A', background: 'white', outline: 'none', fontFamily: 'inherit',
};

export default function FXRevaluation() {
  const { currentCompany, user } = useCompany();
  const queryClient = useQueryClient();
  const [revaluationDate, setRevaluationDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [revaluationResults, setRevaluationResults] = useState(null);

  const { data: exchangeRates = [] } = useQuery({
    queryKey: ['exchange-rates', currentCompany?.id],
    queryFn: () => currentCompany ? ExchangeRate.list({ filters: { company_id: currentCompany.id }, orderBy: 'effective_date', ascending: false }) : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts', currentCompany?.id],
    queryFn: () => currentCompany ? Account.list({ filters: { company_id: currentCompany.id } }) : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices', currentCompany?.id],
    queryFn: () => currentCompany ? Invoice.list({ filters: { company_id: currentCompany.id } }) : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const { data: bills = [] } = useQuery({
    queryKey: ['bills', currentCompany?.id],
    queryFn: () => currentCompany ? Bill.list({ filters: { company_id: currentCompany.id } }) : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const baseCurrency = currentCompany?.base_currency || 'USD';

  const calculateRevaluation = () => {
    const results = [];

    const foreignInvoices = invoices.filter(inv => inv.currency !== baseCurrency && inv.balance_due > 0);
    const foreignBills    = bills.filter(b => b.currency !== baseCurrency && b.balance_due > 0);

    foreignInvoices.forEach(invoice => {
      const latestRate = exchangeRates.filter(r => r.from_currency === baseCurrency && r.to_currency === invoice.currency && new Date(r.effective_date) <= new Date(revaluationDate)).sort((a, b) => new Date(b.effective_date) - new Date(a.effective_date))[0];
      if (latestRate) {
        const currentValueBase  = invoice.balance_due / latestRate.exchange_rate;
        const originalValueBase = invoice.balance_due_base_currency || (invoice.balance_due / invoice.exchange_rate);
        const fxGainLoss = currentValueBase - originalValueBase;
        if (Math.abs(fxGainLoss) > 0.01) {
          results.push({ type: 'Invoice', document_number: invoice.invoice_number, customer_vendor: invoice.customer_name, currency: invoice.currency, balance_foreign: invoice.balance_due, original_rate: invoice.exchange_rate, current_rate: latestRate.exchange_rate, original_value_base: originalValueBase, current_value_base: currentValueBase, fx_gain_loss: fxGainLoss, is_gain: fxGainLoss > 0 });
        }
      }
    });

    foreignBills.forEach(bill => {
      const latestRate = exchangeRates.filter(r => r.from_currency === baseCurrency && r.to_currency === bill.currency && new Date(r.effective_date) <= new Date(revaluationDate)).sort((a, b) => new Date(b.effective_date) - new Date(a.effective_date))[0];
      if (latestRate) {
        const currentValueBase  = bill.balance_due / latestRate.exchange_rate;
        const originalValueBase = bill.balance_due_base_currency || (bill.balance_due / bill.exchange_rate);
        const fxGainLoss = originalValueBase - currentValueBase;
        if (Math.abs(fxGainLoss) > 0.01) {
          results.push({ type: 'Bill', document_number: bill.bill_number, customer_vendor: bill.vendor_name, currency: bill.currency, balance_foreign: bill.balance_due, original_rate: bill.exchange_rate, current_rate: latestRate.exchange_rate, original_value_base: originalValueBase, current_value_base: currentValueBase, fx_gain_loss: fxGainLoss, is_gain: fxGainLoss > 0 });
        }
      }
    });

    setRevaluationResults({
      items: results,
      total_gain: results.filter(r => r.is_gain).reduce((s, r) => s + r.fx_gain_loss, 0),
      total_loss: results.filter(r => !r.is_gain).reduce((s, r) => s + Math.abs(r.fx_gain_loss), 0),
      net_fx:     results.reduce((s, r) => s + r.fx_gain_loss, 0)
    });
  };

  const postRevaluationMutation = useMutation({
    mutationFn: async () => {
      if (!revaluationResults || revaluationResults.items.length === 0) throw new Error('No revaluation adjustments to post');
      let fxAccount = accounts.find(a => a.account_name?.toLowerCase().includes('foreign exchange') || a.account_name?.toLowerCase().includes('fx gain') || a.account_name?.toLowerCase().includes('fx loss'));
      if (!fxAccount) {
        fxAccount = await Account.create({ company_id: currentCompany.id, account_code: '7000', account_name: 'Foreign Exchange Gain/Loss', account_type: 'expense', account_category: 'other_expense', description: 'Unrealized FX gains and losses', balance: 0, is_active: true });
      }
      const arAccount = accounts.find(a => a.account_type === 'asset' && a.account_name?.toLowerCase().includes('receivable'));
      const apAccount = accounts.find(a => a.account_type === 'liability' && a.account_name?.toLowerCase().includes('payable'));
      const journalLineItems = [];
      const arAdj = revaluationResults.items.filter(r => r.type === 'Invoice').reduce((s, r) => s + r.fx_gain_loss, 0);
      const apAdj = revaluationResults.items.filter(r => r.type === 'Bill').reduce((s, r) => s + r.fx_gain_loss, 0);
      if (arAdj !== 0 && arAccount) {
        if (arAdj > 0) {
          journalLineItems.push({ account_id: arAccount.id, account_name: arAccount.account_name, account_code: arAccount.account_code, description: 'FX revaluation adjustment - AR', debit: arAdj, credit: 0 });
          journalLineItems.push({ account_id: fxAccount.id, account_name: fxAccount.account_name, account_code: fxAccount.account_code, description: 'Unrealized FX gain on receivables', debit: 0, credit: arAdj });
        } else {
          journalLineItems.push({ account_id: fxAccount.id, account_name: fxAccount.account_name, account_code: fxAccount.account_code, description: 'Unrealized FX loss on receivables', debit: Math.abs(arAdj), credit: 0 });
          journalLineItems.push({ account_id: arAccount.id, account_name: arAccount.account_name, account_code: arAccount.account_code, description: 'FX revaluation adjustment - AR', debit: 0, credit: Math.abs(arAdj) });
        }
      }
      if (apAdj !== 0 && apAccount) {
        if (apAdj > 0) {
          journalLineItems.push({ account_id: apAccount.id, account_name: apAccount.account_name, account_code: apAccount.account_code, description: 'FX revaluation adjustment - AP', debit: apAdj, credit: 0 });
          journalLineItems.push({ account_id: fxAccount.id, account_name: fxAccount.account_name, account_code: fxAccount.account_code, description: 'Unrealized FX gain on payables', debit: 0, credit: apAdj });
        } else {
          journalLineItems.push({ account_id: fxAccount.id, account_name: fxAccount.account_name, account_code: fxAccount.account_code, description: 'Unrealized FX loss on payables', debit: Math.abs(apAdj), credit: 0 });
          journalLineItems.push({ account_id: apAccount.id, account_name: apAccount.account_name, account_code: apAccount.account_code, description: 'FX revaluation adjustment - AP', debit: 0, credit: Math.abs(apAdj) });
        }
      }
      const totalDebits  = journalLineItems.reduce((s, l) => s + l.debit, 0);
      const totalCredits = journalLineItems.reduce((s, l) => s + l.credit, 0);
      await JournalEntry.create({ company_id: currentCompany.id, entry_number: `JE-FX-${Date.now()}`, entry_date: revaluationDate, reference: 'FX Revaluation', source_type: 'manual', description: `FX Revaluation as of ${format(new Date(revaluationDate), 'MMM d, yyyy')}`, status: 'posted', line_items: journalLineItems, total_debits: totalDebits, total_credits: totalCredits, posted_by: user?.email || 'system', posted_date: new Date().toISOString() });
      for (const line of journalLineItems) {
        const account = accounts.find(a => a.id === line.account_id);
        if (account) {
          let newBalance = parseFloat(account.balance) || 0;
          if (['asset', 'expense'].includes(account.account_type)) { newBalance += (line.debit - line.credit); }
          else { newBalance += (line.credit - line.debit); }
          await Account.update(account.id, { balance: newBalance });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['accounts']);
      queryClient.invalidateQueries(['journal-entries']);
      alert('FX Revaluation posted successfully!');
      setRevaluationResults(null);
    }
  });

  const RESULT_HEADERS = [{ label: 'Type' }, { label: 'Document' }, { label: 'Customer/Vendor' }, { label: 'Currency' }, { label: 'Balance (Foreign)', right: true }, { label: 'Original Rate', right: true }, { label: 'Current Rate', right: true }, { label: 'FX Gain/Loss', right: true }];

  return (
    <PageShell>
      <PageHeader
        title="FX Revaluation"
        subtitle={`Revalue foreign currency balances for ${currentCompany?.company_name} · Base: ${baseCurrency}`}
        icon={TrendingUp}
        accentColor="#8B5CF6"
      />

      <StatBar stats={[
        { label: 'Exchange Rates',     value: exchangeRates.length, icon: TrendingUp, color: ACCENT },
        { label: 'Foreign Invoices',   value: invoices.filter(inv => inv.currency !== baseCurrency && (inv.balance_due || 0) > 0).length, color: PRIMARY },
        { label: 'Foreign Bills',      value: bills.filter(b => b.currency !== baseCurrency && (b.balance_due || 0) > 0).length, color: '#EF4444' },
        ...(revaluationResults ? [
          { label: 'Net FX Adj.', value: `${revaluationResults.net_fx >= 0 ? '+' : ''}${revaluationResults.net_fx.toFixed(2)}`, color: revaluationResults.net_fx >= 0 ? ACCENT : '#EF4444' },
        ] : []),
      ]} />

      {/* Info Banner */}
      <div style={{ background: '#EBF4FB', border: '1.5px solid #AED6F1', borderRadius: 12, padding: '14px 20px', marginBottom: 20, display: 'flex', gap: 12 }}>
        <TrendingUp style={{ width: 18, height: 18, color: PRIMARY, flexShrink: 0, marginTop: 1 }} />
        <div>
          <p style={{ fontWeight: 700, color: PRIMARY, fontSize: 13.5 }}>FX Revaluation</p>
          <p style={{ color: '#2E86C1', fontSize: 13, marginTop: 2 }}>This process calculates unrealized foreign exchange gains or losses on outstanding receivables and payables. These are non-cash adjustments reflecting exchange rate movements.</p>
        </div>
      </div>

      {/* Calculate section */}
      <div style={{ background: 'white', borderRadius: 14, border: '1px solid #F1F5F9', boxShadow: '0 2px 8px rgba(15,43,91,0.06)', padding: 24, marginBottom: 24 }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 16 }}>Calculate Revaluation</p>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#64748B', display: 'block', marginBottom: 6 }}>Revaluation Date</label>
            <input type="date" style={inputStyle} value={revaluationDate} onChange={e => setRevaluationDate(e.target.value)} />
          </div>
          <button
            onClick={calculateRevaluation}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: PRIMARY, color: 'white', border: 'none', borderRadius: 9, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <RefreshCw style={{ width: 15, height: 15 }} />
            Calculate FX Adjustments
          </button>
        </div>
        <div style={{ marginTop: 16, padding: '12px 16px', background: '#F8FAFC', borderRadius: 8, fontSize: 13, color: '#64748B' }}>
          <strong>Base Currency:</strong> {baseCurrency} · The system compares current rates with transaction rates.
        </div>
      </div>

      {/* Results */}
      {revaluationResults && (
        <>
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
            {[
              { label: 'Total Gains',    value: revaluationResults.total_gain,  color: ACCENT,    bg: '#F0FDF4', border: '#BBF7D0' },
              { label: 'Total Losses',   value: revaluationResults.total_loss,  color: '#EF4444', bg: '#FEF2F2', border: '#FECACA' },
              { label: 'Net FX Adjust.', value: revaluationResults.net_fx,      color: revaluationResults.net_fx >= 0 ? ACCENT : '#EF4444', bg: revaluationResults.net_fx >= 0 ? '#F0FDF4' : '#FEF2F2', border: revaluationResults.net_fx >= 0 ? '#BBF7D0' : '#FECACA' },
            ].map(({ label, value, color, bg, border }) => (
              <div key={label} style={{ background: bg, border: `1.5px solid ${border}`, borderRadius: 12, padding: '18px 22px' }}>
                <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color, marginBottom: 6 }}>{label}</p>
                <p style={{ fontSize: 24, fontWeight: 800, color, fontFamily: 'monospace' }}>{baseCurrency} {Math.abs(value).toFixed(2)}</p>
              </div>
            ))}
          </div>

          {/* Detail table */}
          <ERPTable headers={RESULT_HEADERS} emptyIcon={TrendingUp} emptyTitle="No FX adjustments" emptyDesc="No open foreign currency transactions found for this date.">
            {revaluationResults.items.map((item, idx) => (
              <ERPTableRow key={idx}>
                <ERPTableCell>
                  <span style={{ padding: '3px 9px', background: item.type === 'Invoice' ? '#EBF4FB' : '#FEF3C7', color: item.type === 'Invoice' ? PRIMARY : '#92400E', borderRadius: 99, fontSize: 11.5, fontWeight: 600 }}>{item.type}</span>
                </ERPTableCell>
                <ERPTableCell bold style={{ fontFamily: 'monospace', fontSize: 12.5 }}>{item.document_number}</ERPTableCell>
                <ERPTableCell>{item.customer_vendor}</ERPTableCell>
                <ERPTableCell muted>{item.currency}</ERPTableCell>
                <ERPTableCell right style={{ fontFamily: 'monospace' }}>{item.currency} {item.balance_foreign.toFixed(2)}</ERPTableCell>
                <ERPTableCell right muted style={{ fontFamily: 'monospace' }}>{item.original_rate?.toFixed(4) || '—'}</ERPTableCell>
                <ERPTableCell right muted style={{ fontFamily: 'monospace' }}>{item.current_rate.toFixed(4)}</ERPTableCell>
                <ERPTableCell right>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 5, color: item.is_gain ? ACCENT : '#EF4444', fontWeight: 700, fontFamily: 'monospace' }}>
                    {item.is_gain ? <TrendingUp style={{ width: 13, height: 13 }} /> : <TrendingDown style={{ width: 13, height: 13 }} />}
                    {baseCurrency} {Math.abs(item.fx_gain_loss).toFixed(2)}
                  </div>
                </ERPTableCell>
              </ERPTableRow>
            ))}
          </ERPTable>

          {/* Warning and Post button */}
          <div style={{ background: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: 12, padding: '14px 20px', marginTop: 20, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <AlertCircle style={{ width: 18, height: 18, color: '#F59E0B', flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 13, color: '#92400E' }}><strong>Important:</strong> Posting will create a journal entry to adjust AR/AP balances and record unrealized FX gains/losses. Review carefully before posting.</p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <button
              onClick={() => postRevaluationMutation.mutate()}
              disabled={postRevaluationMutation.isPending}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px', background: postRevaluationMutation.isPending ? '#94A3B8' : PRIMARY, color: 'white', border: 'none', borderRadius: 9, fontSize: 13.5, fontWeight: 700, cursor: postRevaluationMutation.isPending ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
            >
              <Save style={{ width: 15, height: 15 }} />
              {postRevaluationMutation.isPending ? 'Posting…' : 'Post Revaluation to GL'}
            </button>
          </div>
        </>
      )}
    </PageShell>
  );
}

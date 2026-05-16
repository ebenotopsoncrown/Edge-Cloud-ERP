import React, { useState } from "react";
import { Payment, Customer, Vendor, Invoice, Bill, Account, JournalEntry } from "@/api/entities";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CreditCard, TrendingDown, TrendingUp, Save, Pencil, DollarSign, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { format } from "date-fns";
import { useCompany } from "../components/auth/CompanyContext";
import PageShell, {
  PageHeader,
  StatBar,
  ERPTable,
  ERPTableRow,
  ERPTableCell,
  StatusBadge,
  ActionBtn,
  NewBtn,
} from "../components/shared/PageShell";

const getCurrencySymbol = (code) =>
  ({ USD:'$',EUR:'€',GBP:'£',NGN:'₦',ZAR:'R',KES:'KSh',GHS:'₵',CAD:'C$',AUD:'A$',INR:'₹',JPY:'¥',CNY:'¥' }[code] || code);

const fmt = (n, sym) => `${sym}${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = d => { try { return format(new Date(d), 'MMM d, yyyy'); } catch { return '—'; } };

export default function Payments() {
  const { currentCompany, canPerformAction } = useCompany();
  const queryClient = useQueryClient();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentType, setPaymentType] = useState('received');
  const [isLoading, setIsLoading] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [activeTab, setActiveTab] = useState('received');

  const baseCurrency = currentCompany?.base_currency || 'USD';
  const currencySymbol = getCurrencySymbol(baseCurrency);

  const initialPaymentFormState = {
    company_id: currentCompany?.id || '',
    payment_type: 'received',
    contact_id: '',
    contact_name: '',
    payment_date: format(new Date(), 'yyyy-MM-dd'),
    amount: 0,
    currency: currentCompany?.base_currency || 'USD',
    payment_method: 'bank_transfer',
    reference: '',
    bank_account_id: '',
    ar_ap_account_id: '',
    invoice_id: '',
    bill_id: '',
    notes: '',
  };

  const [paymentForm, setPaymentForm] = useState(initialPaymentFormState);

  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['payments', currentCompany?.id],
    queryFn: () => currentCompany ? Payment.list({ filters: { company_id: currentCompany.id }, orderBy: 'payment_date', ascending: false }) : Promise.resolve([]),
    enabled: !!currentCompany,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers', currentCompany?.id],
    queryFn: () => currentCompany ? Customer.list({ filters: { company_id: currentCompany.id } }) : Promise.resolve([]),
    enabled: !!currentCompany,
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors', currentCompany?.id],
    queryFn: () => currentCompany ? Vendor.list({ filters: { company_id: currentCompany.id } }) : Promise.resolve([]),
    enabled: !!currentCompany,
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices', currentCompany?.id],
    queryFn: () => currentCompany ? Invoice.list({ filters: { company_id: currentCompany.id, status: ['sent', 'viewed', 'partial', 'overdue'] } }) : Promise.resolve([]),
    enabled: !!currentCompany && paymentForm.payment_type === 'received',
  });

  const { data: bills = [] } = useQuery({
    queryKey: ['bills', currentCompany?.id],
    queryFn: () => currentCompany ? Bill.list({ filters: { company_id: currentCompany.id, status: ['pending', 'approved', 'partial', 'overdue'] } }) : Promise.resolve([]),
    enabled: !!currentCompany && paymentForm.payment_type === 'made',
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts', currentCompany?.id],
    queryFn: () => currentCompany ? Account.list({ filters: { company_id: currentCompany.id } }) : [],
    enabled: !!currentCompany,
  });

  const bankAccounts = accounts.filter(acc => acc.account_type === 'asset' && (acc.account_name?.toLowerCase().includes('cash') || acc.account_name?.toLowerCase().includes('bank')));
  const arAccounts   = accounts.filter(acc => acc.account_type === 'asset' && acc.account_name?.toLowerCase().includes('receivable'));
  const apAccounts   = accounts.filter(acc => acc.account_type === 'liability' && acc.account_name?.toLowerCase().includes('payable'));

  React.useEffect(() => {
    if (!editingPayment) {
      if (paymentType === 'received' && arAccounts.length > 0) {
        setPaymentForm(prev => ({ ...prev, payment_type: 'received', ar_ap_account_id: arAccounts[0].id }));
      } else if (paymentType === 'made' && apAccounts.length > 0) {
        setPaymentForm(prev => ({ ...prev, payment_type: 'made', ar_ap_account_id: apAccounts[0].id }));
      }
      if (bankAccounts.length > 0 && !paymentForm.bank_account_id) {
        setPaymentForm(prev => ({ ...prev, bank_account_id: bankAccounts[0].id }));
      }
    }
  }, [paymentType, arAccounts, apAccounts, bankAccounts, editingPayment]);

  const handleContactChange = (contactId) => {
    if (paymentForm.payment_type === 'received') {
      const customer = customers.find(c => c.id === contactId);
      setPaymentForm(prev => ({ ...prev, contact_id: contactId, contact_name: customer?.company_name || '', invoice_id: '' }));
    } else {
      const vendor = vendors.find(v => v.id === contactId);
      setPaymentForm(prev => ({ ...prev, contact_id: contactId, contact_name: vendor?.company_name || '', bill_id: '' }));
    }
  };

  const handleAddPayment = (type) => {
    setEditingPayment(null);
    setPaymentType(type);
    setPaymentForm({
      ...initialPaymentFormState,
      company_id: currentCompany?.id || '',
      payment_type: type,
      payment_date: format(new Date(), 'yyyy-MM-dd'),
      currency: currentCompany?.base_currency || 'USD',
      bank_account_id: bankAccounts[0]?.id || '',
      ar_ap_account_id: type === 'received' ? arAccounts[0]?.id || '' : apAccounts[0]?.id || '',
    });
    setShowPaymentDialog(true);
  };

  const handleEditPayment = (payment) => {
    setEditingPayment(payment);
    setPaymentType(payment.payment_type);
    setPaymentForm({
      company_id: payment.company_id,
      payment_type: payment.payment_type,
      contact_id: payment.contact_id,
      contact_name: payment.contact_name,
      payment_date: format(new Date(payment.payment_date), 'yyyy-MM-dd'),
      amount: parseFloat(payment.amount) || 0,
      currency: payment.currency,
      payment_method: payment.payment_method,
      reference: payment.reference || '',
      bank_account_id: payment.bank_account_id,
      ar_ap_account_id: payment.ar_ap_account_id,
      invoice_id: payment.invoice_id || '',
      bill_id: payment.bill_id || '',
      notes: payment.notes || '',
    });
    setShowPaymentDialog(true);
  };

  const savePaymentMutation = useMutation({
    mutationFn: async (data) => {
      setIsLoading(true);
      let savedPayment;
      let isEditing = !!editingPayment;
      let oldPayment = null;

      const paymentToSave = { ...data, amount_base_currency: data.amount, exchange_rate: 1, status: 'completed' };

      if (isEditing && editingPayment?.id) {
        oldPayment = await Payment.get(editingPayment.id);
        savedPayment = await Payment.update(editingPayment.id, paymentToSave);
        console.log("Updating Payment:", savedPayment);
      } else {
        savedPayment = await Payment.create(paymentToSave);
        console.log("Creating Payment:", savedPayment);
      }

      if (savedPayment.status === 'completed') {
        const bankAccount = accounts.find(a => a.id === savedPayment.bank_account_id);
        const arApAccount = accounts.find(a => a.id === savedPayment.ar_ap_account_id);
        const amountToPost = savedPayment.amount_base_currency;

        if (isEditing && oldPayment) {
          console.log('EDITING PAYMENT - Reversing old journal entry and posting new one');
          const oldBankAccount = accounts.find(a => a.id === oldPayment.bank_account_id);
          const oldArApAccount = accounts.find(a => a.id === oldPayment.ar_ap_account_id);

          if (oldPayment.payment_type === 'received') {
            if (oldBankAccount) await Account.update(oldBankAccount.id, { balance: (parseFloat(oldBankAccount.balance) || 0) - oldPayment.amount_base_currency, company_id: oldBankAccount.company_id });
            if (oldArApAccount) await Account.update(oldArApAccount.id, { balance: (parseFloat(oldArApAccount.balance) || 0) + oldPayment.amount_base_currency, company_id: oldArApAccount.company_id });
          } else {
            if (oldArApAccount) await Account.update(oldArApAccount.id, { balance: (parseFloat(oldArApAccount.balance) || 0) + oldPayment.amount_base_currency, company_id: oldArApAccount.company_id });
            if (oldBankAccount) await Account.update(oldBankAccount.id, { balance: (parseFloat(oldBankAccount.balance) || 0) + oldPayment.amount_base_currency, company_id: oldBankAccount.company_id });
          }

          if (oldPayment.journal_entry_id) {
            try { await JournalEntry.delete(oldPayment.journal_entry_id); } catch (error) { console.warn('Could not delete old journal entry:', error); }
          }
        }

        let journalLines = [];
        if (savedPayment.payment_type === 'received') {
          if (bankAccount) journalLines.push({ account_id: bankAccount.id, account_name: bankAccount.account_name, account_code: bankAccount.account_code, description: `Payment received from ${savedPayment.contact_name}`, debit: amountToPost, credit: 0 });
          if (arApAccount) journalLines.push({ account_id: arApAccount.id, account_name: arApAccount.account_name, account_code: arApAccount.account_code, description: `Payment received from ${savedPayment.contact_name}`, debit: 0, credit: amountToPost });
        } else {
          if (arApAccount) journalLines.push({ account_id: arApAccount.id, account_name: arApAccount.account_name, account_code: arApAccount.account_code, description: `Payment made to ${savedPayment.contact_name}`, debit: amountToPost, credit: 0 });
          if (bankAccount) journalLines.push({ account_id: bankAccount.id, account_name: bankAccount.account_name, account_code: bankAccount.account_code, description: `Payment made to ${savedPayment.contact_name}`, debit: 0, credit: amountToPost });
        }

        const journalEntry = {
          company_id: savedPayment.company_id,
          entry_number: `JE-PMT-${savedPayment.id}`,
          entry_date: savedPayment.payment_date,
          reference: savedPayment.reference || savedPayment.payment_number,
          source_type: 'payment',
          source_id: savedPayment.id,
          description: `${savedPayment.payment_type === 'received' ? 'Payment Received' : 'Payment Made'} - ${savedPayment.contact_name}`,
          status: 'posted',
          line_items: journalLines,
          total_debits: amountToPost,
          total_credits: amountToPost,
          posted_by: 'system',
          posted_date: new Date().toISOString(),
        };

        const je = await JournalEntry.create(journalEntry);

        if (savedPayment.payment_type === 'received') {
          if (bankAccount) await Account.update(bankAccount.id, { balance: (parseFloat(bankAccount.balance) || 0) + amountToPost, company_id: bankAccount.company_id });
          if (arApAccount) await Account.update(arApAccount.id, { balance: (parseFloat(arApAccount.balance) || 0) - amountToPost, company_id: arApAccount.company_id });

          if (savedPayment.invoice_id) {
            const currentInvoice = await Invoice.get(savedPayment.invoice_id);
            let newPaid = parseFloat(currentInvoice.amount_paid) || 0;
            if (isEditing && oldPayment) {
              if (oldPayment.invoice_id === savedPayment.invoice_id) { newPaid = newPaid - oldPayment.amount_base_currency + savedPayment.amount_base_currency; }
              else {
                newPaid = newPaid + savedPayment.amount_base_currency;
                if (oldPayment.invoice_id) {
                  const oi = await Invoice.get(oldPayment.invoice_id);
                  const op = (parseFloat(oi.amount_paid) || 0) - oldPayment.amount_base_currency;
                  await Invoice.update(oldPayment.invoice_id, { amount_paid: op, balance_due: oi.total_amount - op, status: oi.total_amount - op <= 0 ? 'paid' : op > 0 ? 'partial' : 'sent' });
                }
              }
            } else { newPaid = newPaid + savedPayment.amount_base_currency; }
            const bd = currentInvoice.total_amount - newPaid;
            await Invoice.update(savedPayment.invoice_id, { amount_paid: newPaid, balance_due: bd, status: bd <= 0 ? 'paid' : newPaid > 0 ? 'partial' : 'sent' });
          } else if (isEditing && oldPayment && oldPayment.invoice_id) {
            const oi = await Invoice.get(oldPayment.invoice_id);
            const op = (parseFloat(oi.amount_paid) || 0) - oldPayment.amount_base_currency;
            await Invoice.update(oldPayment.invoice_id, { amount_paid: op, balance_due: oi.total_amount - op, status: oi.total_amount - op <= 0 ? 'paid' : op > 0 ? 'partial' : 'sent' });
          }
        } else {
          if (arApAccount) await Account.update(arApAccount.id, { balance: (parseFloat(arApAccount.balance) || 0) - amountToPost, company_id: arApAccount.company_id });
          if (bankAccount) await Account.update(bankAccount.id, { balance: (parseFloat(bankAccount.balance) || 0) - amountToPost, company_id: bankAccount.company_id });

          if (savedPayment.bill_id) {
            const currentBill = await Bill.get(savedPayment.bill_id);
            let newPaid = parseFloat(currentBill.amount_paid) || 0;
            if (isEditing && oldPayment) {
              if (oldPayment.bill_id === savedPayment.bill_id) { newPaid = newPaid - oldPayment.amount_base_currency + savedPayment.amount_base_currency; }
              else {
                newPaid = newPaid + savedPayment.amount_base_currency;
                if (oldPayment.bill_id) {
                  const ob = await Bill.get(oldPayment.bill_id);
                  const op = (parseFloat(ob.amount_paid) || 0) - oldPayment.amount_base_currency;
                  await Bill.update(oldPayment.bill_id, { amount_paid: op, balance_due: ob.total_amount - op, status: ob.total_amount - op <= 0 ? 'paid' : op > 0 ? 'partial' : 'pending' });
                }
              }
            } else { newPaid = newPaid + savedPayment.amount_base_currency; }
            const bd = currentBill.total_amount - newPaid;
            await Bill.update(savedPayment.bill_id, { amount_paid: newPaid, balance_due: bd, status: bd <= 0 ? 'paid' : newPaid > 0 ? 'partial' : 'pending' });
          } else if (isEditing && oldPayment && oldPayment.bill_id) {
            const ob = await Bill.get(oldPayment.bill_id);
            const op = (parseFloat(ob.amount_paid) || 0) - oldPayment.amount_base_currency;
            await Bill.update(oldPayment.bill_id, { amount_paid: op, balance_due: ob.total_amount - op, status: ob.total_amount - op <= 0 ? 'paid' : op > 0 ? 'partial' : 'pending' });
          }
        }

        await Payment.update(savedPayment.id, { journal_entry_id: je.id });
        console.log('Journal entry posted successfully');
      }

      return savedPayment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['payments']);
      queryClient.invalidateQueries(['accounts']);
      queryClient.invalidateQueries(['journal-entries']);
      queryClient.invalidateQueries(['invoices']);
      queryClient.invalidateQueries(['bills']);
      setIsLoading(false);
      setShowPaymentDialog(false);
      setEditingPayment(null);
    },
    onError: (error) => {
      console.error('Error saving payment:', error);
      alert('Error saving payment: ' + error.message);
      setIsLoading(false);
    },
  });

  const handleSubmit = () => {
    if (!canPerformAction('write')) { alert('Your evaluation period has expired. Please upgrade to continue.'); return; }
    if (!paymentForm.contact_id) { alert(`Please select a ${paymentForm.payment_type === 'received' ? 'customer' : 'vendor'}`); return; }
    if (!paymentForm.bank_account_id) { alert('Please select a bank/cash account'); return; }
    if (!paymentForm.ar_ap_account_id) { alert(`Please select an ${paymentForm.payment_type === 'received' ? 'A/R' : 'A/P'} account`); return; }
    if (paymentForm.amount <= 0) { alert('Please enter a payment amount'); return; }
    savePaymentMutation.mutate(paymentForm);
  };

  const receivedPayments = payments.filter(p => p.payment_type === 'received');
  const madePayments     = payments.filter(p => p.payment_type === 'made');
  const totalReceived    = receivedPayments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
  const totalMade        = madePayments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);

  if (!currentCompany) return <PageShell><p style={{ color: '#94A3B8' }}>Please select a company first.</p></PageShell>;

  const RECV_HEADERS = [
    { label: 'Date' }, { label: 'Customer' }, { label: `Amount (${baseCurrency})`, right: true },
    { label: 'Method' }, { label: 'Reference' }, { label: 'Status' }, { label: '' },
  ];
  const MADE_HEADERS = [
    { label: 'Date' }, { label: 'Vendor' }, { label: `Amount (${baseCurrency})`, right: true },
    { label: 'Method' }, { label: 'Reference' }, { label: 'Status' }, { label: '' },
  ];

  const tabStyle = (active) => ({
    padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600,
    fontSize: 13.5, fontFamily: 'inherit', transition: 'all 150ms',
    background: active ? '#1B4F8A' : 'transparent',
    color: active ? 'white' : '#64748B',
  });

  return (
    <PageShell>
      <PageHeader
        title="Payments"
        subtitle={`${baseCurrency} · ${payments.length} total transactions`}
        icon={CreditCard}
        accentColor="#1B4F8A"
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <ActionBtn onClick={() => handleAddPayment('received')} icon={ArrowDownCircle} label="Receive Payment" variant="outline" />
            <NewBtn onClick={() => handleAddPayment('made')} label="Make Payment" icon={ArrowUpCircle} />
          </div>
        }
      />

      <StatBar stats={[
        { label: 'Total Received', value: fmt(totalReceived, currencySymbol), icon: TrendingUp,   color: '#00A86B' },
        { label: 'Total Made',     value: fmt(totalMade, currencySymbol),     icon: TrendingDown,  color: '#EF4444' },
        { label: 'Net',            value: fmt(totalReceived - totalMade, currencySymbol), icon: DollarSign, color: '#1B4F8A' },
        { label: 'Received Count', value: receivedPayments.length,             color: '#00A86B' },
        { label: 'Made Count',     value: madePayments.length,                 color: '#EF4444' },
      ]} />

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: '#F1F5F9', padding: 4, borderRadius: 10, width: 'fit-content' }}>
        <button style={tabStyle(activeTab === 'received')} onClick={() => setActiveTab('received')}>Payments Received</button>
        <button style={tabStyle(activeTab === 'made')} onClick={() => setActiveTab('made')}>Payments Made</button>
      </div>

      {activeTab === 'received' && (
        <ERPTable headers={RECV_HEADERS} emptyIcon={CreditCard} emptyTitle="No payments received yet" emptyDesc="Record your first customer payment.">
          {receivedPayments.map(p => (
            <ERPTableRow key={p.id}>
              <ERPTableCell muted>{fmtDate(p.payment_date)}</ERPTableCell>
              <ERPTableCell bold>{p.contact_name}</ERPTableCell>
              <ERPTableCell right bold style={{ color: '#00875A' }}>{fmt(p.amount, currencySymbol)}</ERPTableCell>
              <ERPTableCell muted style={{ textTransform: 'capitalize' }}>{p.payment_method?.replace(/_/g, ' ')}</ERPTableCell>
              <ERPTableCell muted>{p.reference || '—'}</ERPTableCell>
              <ERPTableCell><StatusBadge status={p.status} /></ERPTableCell>
              <ERPTableCell><ActionBtn onClick={() => handleEditPayment(p)} icon={Pencil} variant="ghost" /></ERPTableCell>
            </ERPTableRow>
          ))}
        </ERPTable>
      )}

      {activeTab === 'made' && (
        <ERPTable headers={MADE_HEADERS} emptyIcon={CreditCard} emptyTitle="No payments made yet" emptyDesc="Record your first vendor payment.">
          {madePayments.map(p => (
            <ERPTableRow key={p.id}>
              <ERPTableCell muted>{fmtDate(p.payment_date)}</ERPTableCell>
              <ERPTableCell bold>{p.contact_name}</ERPTableCell>
              <ERPTableCell right bold style={{ color: '#EF4444' }}>{fmt(p.amount, currencySymbol)}</ERPTableCell>
              <ERPTableCell muted style={{ textTransform: 'capitalize' }}>{p.payment_method?.replace(/_/g, ' ')}</ERPTableCell>
              <ERPTableCell muted>{p.reference || '—'}</ERPTableCell>
              <ERPTableCell><StatusBadge status={p.status} /></ERPTableCell>
              <ERPTableCell><ActionBtn onClick={() => handleEditPayment(p)} icon={Pencil} variant="ghost" /></ERPTableCell>
            </ERPTableRow>
          ))}
        </ERPTable>
      )}

      {/* Payment Dialog — all business logic preserved */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPayment
                ? (paymentForm.payment_type === 'received' ? 'Edit Received Payment' : 'Edit Made Payment')
                : (paymentForm.payment_type === 'received' ? 'Receive Payment' : 'Make Payment')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{paymentForm.payment_type === 'received' ? 'Customer' : 'Vendor'} *</Label>
              <Select value={paymentForm.contact_id} onValueChange={handleContactChange}>
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${paymentForm.payment_type === 'received' ? 'customer' : 'vendor'}`} />
                </SelectTrigger>
                <SelectContent>
                  {(paymentForm.payment_type === 'received' ? customers : vendors).map(contact => (
                    <SelectItem key={contact.id} value={contact.id}>{contact.company_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-3">General Ledger Accounts</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bank/Cash Account *</Label>
                  <Select value={paymentForm.bank_account_id} onValueChange={(v) => setPaymentForm(prev => ({ ...prev, bank_account_id: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {bankAccounts.map(a => <SelectItem key={a.id} value={a.id}>{a.account_code} - {a.account_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{paymentForm.payment_type === 'received' ? 'A/R Account' : 'A/P Account'} *</Label>
                  <Select value={paymentForm.ar_ap_account_id} onValueChange={(v) => setPaymentForm(prev => ({ ...prev, ar_ap_account_id: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(paymentForm.payment_type === 'received' ? arAccounts : apAccounts).map(a => <SelectItem key={a.id} value={a.id}>{a.account_code} - {a.account_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Payment Date *</Label>
                <Input type="date" value={paymentForm.payment_date} onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_date: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Amount ({baseCurrency}) *</Label>
                <Input type="number" step="0.01" value={paymentForm.amount} onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={paymentForm.payment_method} onValueChange={(v) => setPaymentForm(prev => ({ ...prev, payment_method: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="mobile_payment">Mobile Payment</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Reference/Check #</Label>
                <Input value={paymentForm.reference} onChange={(e) => setPaymentForm(prev => ({ ...prev, reference: e.target.value }))} />
              </div>
            </div>

            {paymentForm.payment_type === 'received' && invoices.length > 0 && (
              <div className="space-y-2">
                <Label>Link to Invoice (Optional)</Label>
                <Select value={paymentForm.invoice_id} onValueChange={(v) => setPaymentForm(prev => ({ ...prev, invoice_id: v }))} onOpenChange={(open) => { if (!open && !paymentForm.invoice_id) setPaymentForm(prev => ({ ...prev, invoice_id: '' })); }}>
                  <SelectTrigger><SelectValue placeholder="Select invoice" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>-- No Invoice --</SelectItem>
                    {invoices.filter(inv => inv.customer_id === paymentForm.contact_id).map(inv => (
                      <SelectItem key={inv.id} value={inv.id}>{inv.invoice_number} - {currencySymbol}{inv.balance_due?.toFixed(2)} due</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {paymentForm.payment_type === 'made' && bills.length > 0 && (
              <div className="space-y-2">
                <Label>Link to Bill (Optional)</Label>
                <Select value={paymentForm.bill_id} onValueChange={(v) => setPaymentForm(prev => ({ ...prev, bill_id: v }))} onOpenChange={(open) => { if (!open && !paymentForm.bill_id) setPaymentForm(prev => ({ ...prev, bill_id: '' })); }}>
                  <SelectTrigger><SelectValue placeholder="Select bill" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>-- No Bill --</SelectItem>
                    {bills.filter(b => b.vendor_id === paymentForm.contact_id).map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.bill_number} - {currencySymbol}{b.balance_due?.toFixed(2)} due</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={paymentForm.notes} onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))} rows={3} />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={isLoading}>
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? 'Saving…' : 'Save Payment'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

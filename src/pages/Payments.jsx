
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, DollarSign, TrendingDown, TrendingUp, X, Save, Receipt, Pencil } from "lucide-react"; // Added Pencil icon
import { format } from "date-fns";
import { useCompany } from "../components/auth/CompanyContext";

// CRITICAL FIX: Currency symbol function
const getCurrencySymbol = (currencyCode) => {
  const symbols = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'NGN': '₦',
    'ZAR': 'R',
    'KES': 'KSh',
    'GHS': '₵',
    'CAD': 'C$',
    'AUD': 'A$',
    'INR': '₹',
    'JPY': '¥',
    'CNY': '¥'
  };
  return symbols[currencyCode] || currencyCode;
};

export default function Payments() {
  const { currentCompany, canPerformAction } = useCompany();
  const queryClient = useQueryClient();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentType, setPaymentType] = useState('received');
  const [isLoading, setIsLoading] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null); // New state for editing

  // Initial form state definition for easy reset
  const initialPaymentFormState = {
    company_id: currentCompany?.id || '',
    payment_type: 'received', // Default, will be set by handleAddPayment
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
    notes: ''
  };

  const [paymentForm, setPaymentForm] = useState(initialPaymentFormState);

  const baseCurrency = currentCompany?.base_currency || 'USD';
  const currencySymbol = getCurrencySymbol(baseCurrency);

  // Fetch payments
  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['payments', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.Payment.filter({ company_id: currentCompany.id }, '-payment_date') : Promise.resolve([]),
    enabled: !!currentCompany
  });

  // Fetch customers
  const { data: customers = [] } = useQuery({
    queryKey: ['customers', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.Customer.filter({ company_id: currentCompany.id }) : Promise.resolve([]),
    enabled: !!currentCompany
  });

  // Fetch vendors
  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.Vendor.filter({ company_id: currentCompany.id }) : Promise.resolve([]),
    enabled: !!currentCompany
  });

  // Fetch invoices
  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.Invoice.filter({ 
      company_id: currentCompany.id,
      status: ['sent', 'viewed', 'partial', 'overdue']
    }) : Promise.resolve([]),
    enabled: !!currentCompany && paymentForm.payment_type === 'received' // Ensure this is reactive to form type
  });

  // Fetch bills
  const { data: bills = [] } = useQuery({
    queryKey: ['bills', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.Bill.filter({ 
      company_id: currentCompany.id,
      status: ['pending', 'approved', 'partial', 'overdue']
    }) : Promise.resolve([]),
    enabled: !!currentCompany && paymentForm.payment_type === 'made' // Ensure this is reactive to form type
  });

  // Fetch GL Accounts
  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.Account.filter({ company_id: currentCompany.id }) : [],
    enabled: !!currentCompany
  });

  const bankAccounts = accounts.filter(acc => 
    acc.account_type === 'asset' && 
    (acc.account_name?.toLowerCase().includes('cash') || 
     acc.account_name?.toLowerCase().includes('bank'))
  );
  
  const arAccounts = accounts.filter(acc => 
    acc.account_type === 'asset' && 
    acc.account_name?.toLowerCase().includes('receivable')
  );
  
  const apAccounts = accounts.filter(acc => 
    acc.account_type === 'liability' && 
    acc.account_name?.toLowerCase().includes('payable')
  );

  // Effect to set initial default bank/AR/AP accounts when component loads or paymentType changes
  // and when not in editing mode or if the accounts in the form are not valid anymore.
  React.useEffect(() => {
    if (!editingPayment) { // Only set defaults if not editing
      if (paymentType === 'received' && arAccounts.length > 0) {
        setPaymentForm(prev => ({
          ...prev,
          payment_type: 'received',
          ar_ap_account_id: arAccounts[0].id
        }));
      } else if (paymentType === 'made' && apAccounts.length > 0) {
        setPaymentForm(prev => ({
          ...prev,
          payment_type: 'made',
          ar_ap_account_id: apAccounts[0].id
        }));
      }

      if (bankAccounts.length > 0 && !paymentForm.bank_account_id) {
        setPaymentForm(prev => ({ ...prev, bank_account_id: bankAccounts[0].id }));
      }
    }
  }, [paymentType, arAccounts, apAccounts, bankAccounts, editingPayment]);

  const handleContactChange = (contactId) => {
    if (paymentForm.payment_type === 'received') {
      const customer = customers.find(c => c.id === contactId);
      setPaymentForm(prev => ({
        ...prev,
        contact_id: contactId,
        contact_name: customer?.company_name || '',
        invoice_id: '' // Clear invoice selection when contact changes
      }));
    } else {
      const vendor = vendors.find(v => v.id === contactId);
      setPaymentForm(prev => ({
        ...prev,
        contact_id: contactId,
        contact_name: vendor?.company_name || '',
        bill_id: '' // Clear bill selection when contact changes
      }));
    }
  };

  // Function to prepare form for adding a new payment
  const handleAddPayment = (type) => {
    setEditingPayment(null); // Clear any editing state
    setPaymentType(type);
    setPaymentForm({
      ...initialPaymentFormState,
      company_id: currentCompany?.id || '',
      payment_type: type,
      payment_date: format(new Date(), 'yyyy-MM-dd'),
      currency: currentCompany?.base_currency || 'USD',
      bank_account_id: bankAccounts[0]?.id || '', // Set default if available
      ar_ap_account_id: type === 'received' ? arAccounts[0]?.id || '' : apAccounts[0]?.id || '' // Set default
    });
    setShowPaymentDialog(true);
  };

  // Function to prepare form for editing an existing payment
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
      notes: payment.notes || ''
    });
    setShowPaymentDialog(true);
  };

  const savePaymentMutation = useMutation({
    mutationFn: async (data) => {
      setIsLoading(true);

      let savedPayment;
      let isEditing = !!editingPayment; // Check if editingPayment is not null
      let oldPayment = null;

      const paymentToSave = {
        ...data,
        amount_base_currency: data.amount, // Assuming data.amount is the base currency amount from the form
        exchange_rate: 1, // For simplicity, assuming base currency
        status: 'completed' // Payments are always completed in this UI
      };

      if (isEditing && editingPayment?.id) {
        // CRITICAL: Get old payment data before updating to reverse old entries
        oldPayment = await base44.entities.Payment.get(editingPayment.id);
        savedPayment = await base44.entities.Payment.update(editingPayment.id, paymentToSave);
        console.log("Updating Payment:", savedPayment);
      } else {
        savedPayment = await base44.entities.Payment.create(paymentToSave);
        console.log("Creating Payment:", savedPayment);
      }

      // CRITICAL: Post journal entry with proper edit handling
      if (savedPayment.status === 'completed') { // Ensure only completed payments affect GL
        const bankAccount = accounts.find(a => a.id === savedPayment.bank_account_id);
        const arApAccount = accounts.find(a => a.id === savedPayment.ar_ap_account_id);
        const amountToPost = savedPayment.amount_base_currency;

        if (isEditing && oldPayment) {
          // EDITING LOGIC - Reverse old entries, post new entries
          console.log('🔄 EDITING PAYMENT - Reversing old journal entry and posting new one');

          const oldBankAccount = accounts.find(a => a.id === oldPayment.bank_account_id);
          const oldArApAccount = accounts.find(a => a.id === oldPayment.ar_ap_account_id);

          // Step 1: Reverse the old journal entry's effect on account balances
          console.log('📊 Step 1: Reversing old journal entry effect on account balances');

          if (oldPayment.payment_type === 'received') {
            // Reverse: DR Bank (old), CR A/R (old)
            if (oldBankAccount) {
              const currentBalance = parseFloat(oldBankAccount.balance) || 0;
              const newBalance = currentBalance - oldPayment.amount_base_currency; // Reverse debit: subtract
              // CRITICAL FIX: Include company_id
              await base44.entities.Account.update(oldBankAccount.id, { 
                balance: newBalance,
                company_id: oldBankAccount.company_id 
              });
              console.log(`   Reversed ${oldBankAccount.account_name} (Bank): ${currentBalance} → ${newBalance}`);
            }
            if (oldArApAccount) {
              const currentBalance = parseFloat(oldArApAccount.balance) || 0;
              const newBalance = currentBalance + oldPayment.amount_base_currency; // Reverse credit: add back
              // CRITICAL FIX: Include company_id
              await base44.entities.Account.update(oldArApAccount.id, { 
                balance: newBalance,
                company_id: oldArApAccount.company_id 
              });
              console.log(`   Reversed ${oldArApAccount.account_name} (A/R): ${currentBalance} → ${newBalance}`);
            }
          } else { // oldPayment.payment_type === 'made'
            // Reverse: DR A/P (old), CR Bank (old)
            if (oldArApAccount) {
              const currentBalance = parseFloat(oldArApAccount.balance) || 0;
              const newBalance = currentBalance + oldPayment.amount_base_currency; // Reverse debit: add back
              // CRITICAL FIX: Include company_id
              await base44.entities.Account.update(oldArApAccount.id, { 
                balance: newBalance,
                company_id: oldArApAccount.company_id 
              });
              console.log(`   Reversed ${oldArApAccount.account_name} (A/P): ${currentBalance} → ${newBalance}`);
            }
            if (oldBankAccount) {
              const currentBalance = parseFloat(oldBankAccount.balance) || 0;
              const newBalance = currentBalance + oldPayment.amount_base_currency; // Reverse credit: add back
              // CRITICAL FIX: Include company_id
              await base44.entities.Account.update(oldBankAccount.id, { 
                balance: newBalance,
                company_id: oldBankAccount.company_id 
              });
              console.log(`   Reversed ${oldBankAccount.account_name} (Bank): ${currentBalance} → ${newBalance}`);
            }
          }

          // Step 2: Delete old journal entry
          if (oldPayment.journal_entry_id) {
            try {
              await base44.entities.JournalEntry.delete(oldPayment.journal_entry_id);
              console.log('   ✅ Old journal entry deleted:', oldPayment.journal_entry_id);
            } catch (error) {
              console.warn('   ⚠️ Could not delete old journal entry:', oldPayment.journal_entry_id, error);
            }
          }

          console.log('📊 Step 2: Posting new journal entry with updated accounts and amounts');
        }

        // Post new journal entry (whether creating or editing)
        let journalLines = [];

        if (savedPayment.payment_type === 'received') {
          // Payment received from customer
          // DR: Bank/Cash Account
          if (bankAccount) {
            journalLines.push({
              account_id: bankAccount.id,
              account_name: bankAccount.account_name,
              account_code: bankAccount.account_code,
              description: `Payment received from ${savedPayment.contact_name}`,
              debit: amountToPost,
              credit: 0
            });
          }

          // CR: Accounts Receivable
          if (arApAccount) {
            journalLines.push({
              account_id: arApAccount.id,
              account_name: arApAccount.account_name,
              account_code: arApAccount.account_code,
              description: `Payment received from ${savedPayment.contact_name}`,
              debit: 0,
              credit: amountToPost
            });
          }
        } else { // savedPayment.payment_type === 'made'
          // Payment made to vendor
          // DR: Accounts Payable
          if (arApAccount) {
            journalLines.push({
              account_id: arApAccount.id,
              account_name: arApAccount.account_name,
              account_code: arApAccount.account_code,
              description: `Payment made to ${savedPayment.contact_name}`,
              debit: amountToPost,
              credit: 0
            });
          }

          // CR: Bank/Cash Account
          if (bankAccount) {
            journalLines.push({
              account_id: bankAccount.id,
              account_name: bankAccount.account_name,
              account_code: bankAccount.account_code,
              description: `Payment made to ${savedPayment.contact_name}`,
              debit: 0,
              credit: amountToPost
            });
          }
        }

        const journalEntry = {
          company_id: savedPayment.company_id,
          entry_number: `JE-PMT-${savedPayment.id}`,
          entry_date: savedPayment.payment_date,
          reference: savedPayment.reference || savedPayment.payment_number, // Use payment number as fallback
          source_type: 'payment',
          source_id: savedPayment.id,
          description: `${savedPayment.payment_type === 'received' ? 'Payment Received' : 'Payment Made'} - ${savedPayment.contact_name}`,
          status: 'posted',
          line_items: journalLines,
          total_debits: amountToPost,
          total_credits: amountToPost,
          posted_by: 'system',
          posted_date: new Date().toISOString()
        };

        const je = await base44.entities.JournalEntry.create(journalEntry);

        // Update account balances with NEW amounts - CRITICAL FIX: Include company_id
        if (savedPayment.payment_type === 'received') {
          if (bankAccount) {
            const currentBalance = parseFloat(bankAccount.balance) || 0;
            await base44.entities.Account.update(bankAccount.id, {
              balance: currentBalance + amountToPost,
              company_id: bankAccount.company_id
            });
            console.log(`   Posted to ${bankAccount.account_name} (Bank): +${amountToPost}`);
          }
          if (arApAccount) {
            const currentBalance = parseFloat(arApAccount.balance) || 0;
            await base44.entities.Account.update(arApAccount.id, {
              balance: currentBalance - amountToPost,
              company_id: arApAccount.company_id
            });
            console.log(`   Posted to ${arApAccount.account_name} (A/R): -${amountToPost}`);
          }

          // Handle Invoice updates
          if (savedPayment.invoice_id) {
              const currentInvoice = await base44.entities.Invoice.get(savedPayment.invoice_id);
              let newInvoiceAmountPaid = (parseFloat(currentInvoice.amount_paid) || 0);

              if (isEditing && oldPayment) {
                  if (oldPayment.invoice_id === savedPayment.invoice_id) {
                      // Same invoice: adjust by the difference
                      newInvoiceAmountPaid = newInvoiceAmountPaid - oldPayment.amount_base_currency + savedPayment.amount_base_currency;
                  } else {
                      // New invoice is different from old one (or old was null): Add new payment amount
                      newInvoiceAmountPaid = newInvoiceAmountPaid + savedPayment.amount_base_currency;

                      // If old payment was linked to an invoice, reverse its effect on the old invoice
                      if (oldPayment.invoice_id) {
                          const oldLinkedInvoice = await base44.entities.Invoice.get(oldPayment.invoice_id);
                          const oldLinkedInvoiceNewAmountPaid = (parseFloat(oldLinkedInvoice.amount_paid) || 0) - oldPayment.amount_base_currency;
                          const oldLinkedInvoiceNewBalanceDue = oldLinkedInvoice.total_amount - oldLinkedInvoiceNewAmountPaid;
                          await base44.entities.Invoice.update(oldPayment.invoice_id, {
                              amount_paid: oldLinkedInvoiceNewAmountPaid,
                              balance_due: oldLinkedInvoiceNewBalanceDue,
                              status: oldLinkedInvoiceNewBalanceDue <= 0 ? 'paid' : (oldLinkedInvoiceNewAmountPaid > 0 ? 'partial' : 'sent')
                          });
                      }
                  }
              } else {
                  // Not editing, simply add the new payment amount
                  newInvoiceAmountPaid = newInvoiceAmountPaid + savedPayment.amount_base_currency;
              }

              const newInvoiceBalanceDue = currentInvoice.total_amount - newInvoiceAmountPaid;
              await base44.entities.Invoice.update(savedPayment.invoice_id, {
                  amount_paid: newInvoiceAmountPaid,
                  balance_due: newInvoiceBalanceDue,
                  status: newInvoiceBalanceDue <= 0 ? 'paid' : (newInvoiceAmountPaid > 0 ? 'partial' : 'sent')
              });
          } else if (isEditing && oldPayment && oldPayment.invoice_id) {
              // Payment was previously linked to an invoice but is no longer linked (or linked to null)
              // Reverse the effect on the old invoice
              const oldLinkedInvoice = await base44.entities.Invoice.get(oldPayment.invoice_id);
              const oldLinkedInvoiceNewAmountPaid = (parseFloat(oldLinkedInvoice.amount_paid) || 0) - oldPayment.amount_base_currency;
              const oldLinkedInvoiceNewBalanceDue = oldLinkedInvoice.total_amount - oldLinkedInvoiceNewAmountPaid;
              await base44.entities.Invoice.update(oldPayment.invoice_id, {
                  amount_paid: oldLinkedInvoiceNewAmountPaid,
                  balance_due: oldLinkedInvoiceNewBalanceDue,
                  status: oldLinkedInvoiceNewBalanceDue <= 0 ? 'paid' : (oldLinkedInvoiceNewAmountPaid > 0 ? 'partial' : 'sent')
              });
          }

        } else { // savedPayment.payment_type === 'made'
          if (arApAccount) {
            const currentBalance = parseFloat(arApAccount.balance) || 0;
            await base44.entities.Account.update(arApAccount.id, {
              balance: currentBalance - amountToPost,
              company_id: arApAccount.company_id
            });
            console.log(`   Posted to ${arApAccount.account_name} (A/P): -${amountToPost}`);
          }
          if (bankAccount) {
            const currentBalance = parseFloat(bankAccount.balance) || 0;
            await base44.entities.Account.update(bankAccount.id, {
              balance: currentBalance - amountToPost,
              company_id: bankAccount.company_id
            });
            console.log(`   Posted to ${bankAccount.account_name} (Bank): -${amountToPost}`);
          }

          // Handle Bill updates
          if (savedPayment.bill_id) {
              const currentBill = await base44.entities.Bill.get(savedPayment.bill_id);
              let newBillAmountPaid = (parseFloat(currentBill.amount_paid) || 0);

              if (isEditing && oldPayment) {
                  if (oldPayment.bill_id === savedPayment.bill_id) {
                      newBillAmountPaid = newBillAmountPaid - oldPayment.amount_base_currency + savedPayment.amount_base_currency;
                  } else {
                      newBillAmountPaid = newBillAmountPaid + savedPayment.amount_base_currency;
                      if (oldPayment.bill_id) {
                          const oldLinkedBill = await base44.entities.Bill.get(oldPayment.bill_id);
                          const oldLinkedBillNewAmountPaid = (parseFloat(oldLinkedBill.amount_paid) || 0) - oldPayment.amount_base_currency;
                          const oldLinkedBillNewBalanceDue = oldLinkedBill.total_amount - oldLinkedBillNewAmountPaid;
                          await base44.entities.Bill.update(oldPayment.bill_id, {
                              amount_paid: oldLinkedBillNewAmountPaid,
                              balance_due: oldLinkedBillNewBalanceDue,
                              status: oldLinkedBillNewBalanceDue <= 0 ? 'paid' : (oldLinkedBillNewAmountPaid > 0 ? 'partial' : 'pending')
                          });
                      }
                  }
              } else {
                  newBillAmountPaid = newBillAmountPaid + savedPayment.amount_base_currency;
              }

              const newBillBalanceDue = currentBill.total_amount - newBillAmountPaid;
              await base44.entities.Bill.update(savedPayment.bill_id, {
                  amount_paid: newBillAmountPaid,
                  balance_due: newBillBalanceDue,
                  status: newBillBalanceDue <= 0 ? 'paid' : (newBillAmountPaid > 0 ? 'partial' : 'pending')
              });
          } else if (isEditing && oldPayment && oldPayment.bill_id) {
              // Payment was previously linked to a bill but is no longer linked
              const oldLinkedBill = await base44.entities.Bill.get(oldPayment.bill_id);
              const oldLinkedBillNewAmountPaid = (parseFloat(oldLinkedBill.amount_paid) || 0) - oldPayment.amount_base_currency;
              const oldLinkedBillNewBalanceDue = oldLinkedBill.total_amount - oldLinkedBillNewAmountPaid;
              await base44.entities.Bill.update(oldPayment.bill_id, {
                  amount_paid: oldLinkedBillNewAmountPaid,
                  balance_due: oldLinkedBillNewBalanceDue,
                  status: oldLinkedBillNewBalanceDue <= 0 ? 'paid' : (oldLinkedBillNewAmountPaid > 0 ? 'partial' : 'pending')
              });
          }
        }

        // Update payment with journal entry reference
        await base44.entities.Payment.update(savedPayment.id, {
          journal_entry_id: je.id
        });

        console.log('✅ Journal entry posted successfully');
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
      setShowPaymentDialog(false); // Close dialog
      setEditingPayment(null);     // Clear editing state
      // Form will be reset by handleAddPayment when opening for a new payment
    },
    onError: (error) => {
      console.error('Error saving payment:', error);
      alert('Error saving payment: ' + error.message);
      setIsLoading(false);
    }
  });

  const handleSubmit = () => {
    if (!canPerformAction('write')) {
      alert('Your evaluation period has expired. Please upgrade to continue.');
      return;
    }

    if (!paymentForm.contact_id) {
      alert(`Please select a ${paymentForm.payment_type === 'received' ? 'customer' : 'vendor'}`);
      return;
    }

    if (!paymentForm.bank_account_id) {
      alert('Please select a bank/cash account');
      return;
    }

    if (!paymentForm.ar_ap_account_id) {
      alert(`Please select an ${paymentForm.payment_type === 'received' ? 'A/R' : 'A/P'} account`);
      return;
    }

    if (paymentForm.amount <= 0) {
      alert('Please enter a payment amount');
      return;
    }

    savePaymentMutation.mutate(paymentForm);
  };

  const receivedPayments = payments.filter(p => p.payment_type === 'received');
  const madePayments = payments.filter(p => p.payment_type === 'made');

  if (!currentCompany) {
    return (
      <div className="p-6">
        <p>Please select a company first</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
        <p className="text-gray-500 mt-1">Manage payments received and made</p>
        <p className="text-sm text-blue-600 font-semibold mt-1">
          💰 All amounts shown in {baseCurrency} ({currencySymbol})
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Payments Received
              </span>
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => handleAddPayment('received')} // Updated onClick
              >
                <Plus className="w-4 h-4 mr-2" />
                Receive Payment
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {currencySymbol}{receivedPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
            </div>
            <p className="text-sm text-gray-600 mt-1">{receivedPayments.length} payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-600" />
                Payments Made
              </span>
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700"
                onClick={() => handleAddPayment('made')} // Updated onClick
              >
                <Plus className="w-4 h-4 mr-2" />
                Make Payment
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {currencySymbol}{madePayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
            </div>
            <p className="text-sm text-gray-600 mt-1">{madePayments.length} payments</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="received">
        <TabsList>
          <TabsTrigger value="received">Payments Received</TabsTrigger>
          <TabsTrigger value="made">Payments Made</TabsTrigger>
        </TabsList>

        <TabsContent value="received">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount ({baseCurrency})</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead> {/* New column for edit */}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receivedPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No payments received yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    receivedPayments.map(payment => (
                      <TableRow key={payment.id}>
                        <TableCell>{format(new Date(payment.payment_date), 'MMM d, yyyy')}</TableCell>
                        <TableCell>{payment.contact_name}</TableCell>
                        <TableCell className="font-semibold text-green-600">
                          {currencySymbol}{payment.amount?.toFixed(2)}
                        </TableCell>
                        <TableCell className="capitalize">{payment.payment_method?.replace(/_/g, ' ')}</TableCell>
                        <TableCell>{payment.reference || '-'}</TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-800">
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => handleEditPayment(payment)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="made">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Amount ({baseCurrency})</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead> {/* New column for edit */}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {madePayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No payments made yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    madePayments.map(payment => (
                      <TableRow key={payment.id}>
                        <TableCell>{format(new Date(payment.payment_date), 'MMM d, yyyy')}</TableCell>
                        <TableCell>{payment.contact_name}</TableCell>
                        <TableCell className="font-semibold text-red-600">
                          {currencySymbol}{payment.amount?.toFixed(2)}
                        </TableCell>
                        <TableCell className="capitalize">{payment.payment_method?.replace(/_/g, ' ')}</TableCell>
                        <TableCell>{payment.reference || '-'}</TableCell>
                        <TableCell>
                          <Badge className="bg-red-100 text-red-800">
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => handleEditPayment(payment)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPayment ? (paymentForm.payment_type === 'received' ? 'Edit Received Payment' : 'Edit Made Payment') :
                (paymentForm.payment_type === 'received' ? 'Receive Payment' : 'Make Payment')}
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
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-3">📊 General Ledger Accounts</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bank/Cash Account *</Label>
                  <Select value={paymentForm.bank_account_id} onValueChange={(value) => setPaymentForm(prev => ({ ...prev, bank_account_id: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {bankAccounts.map(account => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.account_code} - {account.account_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{paymentForm.payment_type === 'received' ? 'A/R Account' : 'A/P Account'} *</Label>
                  <Select value={paymentForm.ar_ap_account_id} onValueChange={(value) => setPaymentForm(prev => ({ ...prev, ar_ap_account_id: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(paymentForm.payment_type === 'received' ? arAccounts : apAccounts).map(account => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.account_code} - {account.account_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Payment Date *</Label>
                <Input
                  type="date"
                  value={paymentForm.payment_date}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_date: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Amount ({baseCurrency}) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={paymentForm.payment_method} onValueChange={(value) => setPaymentForm(prev => ({ ...prev, payment_method: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
                <Input
                  value={paymentForm.reference}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, reference: e.target.value }))}
                />
              </div>
            </div>

            {paymentForm.payment_type === 'received' && invoices.length > 0 && (
              <div className="space-y-2">
                <Label>Link to Invoice (Optional)</Label>
                <Select
                  value={paymentForm.invoice_id}
                  onValueChange={(value) => setPaymentForm(prev => ({ ...prev, invoice_id: value }))}
                  // Allow clearing selection by setting value to empty string
                  onOpenChange={(open) => {
                    if (!open && !paymentForm.invoice_id) { // If closing and no value selected, ensure it's empty
                      setPaymentForm(prev => ({ ...prev, invoice_id: '' }));
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select invoice" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>-- No Invoice --</SelectItem> {/* Option to clear selection */}
                    {invoices.filter(inv => inv.customer_id === paymentForm.contact_id).map(invoice => (
                      <SelectItem key={invoice.id} value={invoice.id}>
                        {invoice.invoice_number} - {currencySymbol}{invoice.balance_due?.toFixed(2)} due
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {paymentForm.payment_type === 'made' && bills.length > 0 && (
              <div className="space-y-2">
                <Label>Link to Bill (Optional)</Label>
                <Select
                  value={paymentForm.bill_id}
                  onValueChange={(value) => setPaymentForm(prev => ({ ...prev, bill_id: value }))}
                  onOpenChange={(open) => {
                    if (!open && !paymentForm.bill_id) { // If closing and no value selected, ensure it's empty
                      setPaymentForm(prev => ({ ...prev, bill_id: '' }));
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select bill" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>-- No Bill --</SelectItem> {/* Option to clear selection */}
                    {bills.filter(bill => bill.vendor_id === paymentForm.contact_id).map(bill => (
                      <SelectItem key={bill.id} value={bill.id}>
                        {bill.bill_number} - {currencySymbol}{bill.balance_due?.toFixed(2)} due
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isLoading}>
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? 'Saving...' : 'Save Payment'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

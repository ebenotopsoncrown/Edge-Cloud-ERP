
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X, Plus, Trash2, Save, FileText } from "lucide-react";
import { format } from "date-fns";
import { useCompany } from "../auth/CompanyContext";

export default function InvoiceForm({ invoice, invoiceId, onClose }) {
  const { currentCompany, canPerformAction } = useCompany();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    company_id: currentCompany?.id || '',
    invoice_number: '',
    customer_id: '',
    customer_name: '',
    job_id: '', // CRITICAL: Added job field
    job_name: '', // CRITICAL: Added job name
    invoice_date: format(new Date(), 'yyyy-MM-dd'),
    due_date: format(new Date(), 'yyyy-MM-dd'),
    status: 'draft',
    currency: currentCompany?.base_currency || 'USD',
    ar_account_id: '',
    revenue_account_id: '',
    tax_account_id: '',
    line_items: [
      {
        product_id: '',
        description: '',
        quantity: 1,
        unit_price: 0,
        tax_rate: 0,
        tax_amount: 0,
        line_total: 0,
        // gl_account_id was removed from here
      }
    ],
    subtotal: 0,
    tax_total: 0,
    total_amount: 0,
    notes: '',
    // Added new fields for print template and customer details
    billing_address: { street: '', city: '', state: '', postal_code: '', country: '' },
    shipping_address: { street: '', city: '', state: '', postal_code: '', country: '' },
    payment_terms: 'Due on Receipt', // Default value
    amount_paid: 0, // Initialized for balance_due calculation
    balance_due: 0 // CRITICAL FIX: Add balance_due to initial state
  });

  // Fetch existing invoice if editing
  const { data: existingInvoice } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: () => invoiceId ? base44.entities.Invoice.get(invoiceId) : null,
    enabled: !!invoiceId
  });

  // Fetch customers
  const { data: customers = [] } = useQuery({
    queryKey: ['customers', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.Customer.filter({ company_id: currentCompany.id }) : [],
    enabled: !!currentCompany
  });

  // Fetch products
  const { data: products = [] } = useQuery({
    queryKey: ['products', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.Product.filter({ company_id: currentCompany.id }) : [],
    enabled: !!currentCompany
  });

  // CRITICAL: Fetch GL Accounts
  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.Account.filter({ company_id: currentCompany.id }) : [],
    enabled: !!currentCompany
  });

  // CRITICAL: Fetch jobs for dropdown
  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.Job.filter({ company_id: currentCompany.id }) : [],
    enabled: !!currentCompany
  });

  // Get relevant account types
  const arAccounts = accounts.filter(acc =>
    acc.account_type === 'asset' &&
    acc.account_name?.toLowerCase().includes('receivable')
  );

  const revenueAccounts = accounts.filter(acc => acc.account_type === 'revenue');

  const taxAccounts = accounts.filter(acc =>
    acc.account_type === 'liability' &&
    (acc.account_name?.toLowerCase().includes('tax') || acc.account_name?.toLowerCase().includes('vat'))
  );

  // Load existing invoice data
  useEffect(() => {
    if (existingInvoice || invoice) {
      const invoiceData = existingInvoice || invoice;
      setFormData({
        ...invoiceData,
        ar_account_id: invoiceData.ar_account_id || '',
        revenue_account_id: invoiceData.revenue_account_id || '',
        tax_account_id: invoiceData.tax_account_id || '',
        job_id: invoiceData.job_id || '', // Load existing job_id
        job_name: invoiceData.job_name || '', // Load existing job_name
        // Ensure billing/shipping address and payment terms are present with defaults
        billing_address: invoiceData.billing_address || { street: '', city: '', state: '', postal_code: '', country: '' },
        shipping_address: invoiceData.shipping_address || { street: '', city: '', state: '', postal_code: '', country: '' },
        payment_terms: invoiceData.payment_terms || 'Due on Receipt',
        amount_paid: invoiceData.amount_paid || 0,
        balance_due: invoiceData.balance_due || 0, // Ensure balance_due is loaded
        // Filter out gl_account_id from line_items if it existed in old data
        line_items: invoiceData.line_items ? invoiceData.line_items.map(({ gl_account_id, ...rest }) => rest) : []
      });
    }
  }, [existingInvoice, invoice]);

  // Auto-select default accounts
  useEffect(() => {
    if (arAccounts.length > 0 && !formData.ar_account_id) {
      setFormData(prev => ({ ...prev, ar_account_id: arAccounts[0].id }));
    }
    if (revenueAccounts.length > 0 && !formData.revenue_account_id) {
      setFormData(prev => ({ ...prev, revenue_account_id: revenueAccounts[0].id }));
    }
    if (taxAccounts.length > 0 && !formData.tax_account_id) {
      setFormData(prev => ({ ...prev, tax_account_id: taxAccounts[0].id }));
    }
  }, [arAccounts, revenueAccounts, taxAccounts, formData.ar_account_id, formData.revenue_account_id, formData.tax_account_id]);

  const calculateTotals = () => {
    const subtotal = formData.line_items.reduce((sum, item) => {
      return sum + (item.quantity * item.unit_price);
    }, 0);

    const tax_total = formData.line_items.reduce((sum, item) => {
      const lineSubtotal = item.quantity * item.unit_price;
      const taxAmount = (lineSubtotal * (item.tax_rate || 0)) / 100;
      return sum + taxAmount;
    }, 0);

    const total_amount = subtotal + tax_total;

    setFormData(prev => ({
      ...prev,
      subtotal,
      tax_total,
      total_amount,
      balance_due: total_amount - (prev.amount_paid || 0)
    }));
  };

  useEffect(() => {
    calculateTotals();
  }, [formData.line_items]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCustomerChange = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    setFormData(prev => ({
      ...prev,
      customer_id: customerId,
      customer_name: customer?.company_name || '',
      // Populate billing/shipping address and payment terms from customer
      billing_address: customer?.billing_address || { street: '', city: '', state: '', postal_code: '', country: '' },
      shipping_address: customer?.shipping_address || { street: '', city: '', state: '', postal_code: '', country: '' },
      payment_terms: customer?.payment_terms || 'Due on Receipt',
    }));
  };

  const handleProductChange = (index, productId) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      const newLineItems = [...formData.line_items];
      newLineItems[index] = {
        ...newLineItems[index],
        product_id: productId,
        description: product.product_name,
        unit_price: product.unit_price || 0,
        tax_rate: product.tax_rate || 0,
        // gl_account_id: product.sales_account_id || formData.revenue_account_id // Removed
      };
      setFormData(prev => ({ ...prev, line_items: newLineItems }));
    }
  };

  const addLineItem = () => {
    setFormData(prev => ({
      ...prev,
      line_items: [
        ...prev.line_items,
        {
          product_id: '',
          description: '',
          quantity: 1,
          unit_price: 0,
          tax_rate: 0,
          tax_amount: 0,
          line_total: 0,
          // gl_account_id: formData.revenue_account_id // Removed
        }
      ]
    }));
  };

  const removeLineItem = (index) => {
    setFormData(prev => ({
      ...prev,
      line_items: prev.line_items.filter((_, i) => i !== index)
    }));
  };

  const updateLineItem = (index, field, value) => {
    const newLineItems = [...formData.line_items];
    newLineItems[index] = { ...newLineItems[index], [field]: value };
    setFormData(prev => ({ ...prev, line_items: newLineItems }));
  };

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      setIsLoading(true);

      // Calculate line item totals
      const updatedLineItems = data.line_items.map(item => {
        const lineSubtotal = item.quantity * item.unit_price;
        const taxAmount = (lineSubtotal * (item.tax_rate || 0)) / 100;
        return {
          ...item,
          tax_amount: taxAmount,
          line_total: lineSubtotal + taxAmount
        };
      });

      const invoiceData = {
        ...data,
        line_items: updatedLineItems,
        balance_due: data.total_amount - (data.amount_paid || 0)
      };

      let savedInvoice;
      let isEditing = false;
      let oldInvoice = null;

      if (invoiceId || invoice?.id) {
        isEditing = true;
        // CRITICAL: Get old invoice data before updating
        oldInvoice = await base44.entities.Invoice.get(invoiceId || invoice.id);
        savedInvoice = await base44.entities.Invoice.update(invoiceId || invoice.id, invoiceData);
      } else {
        savedInvoice = await base44.entities.Invoice.create(invoiceData);
      }

      // CRITICAL: Post journal entries when invoice is sent or paid
      if (data.status === 'sent' || data.status === 'paid') {
        console.log('📊 POSTING SALES INVOICE JOURNAL ENTRIES');
        console.log('Invoice:', savedInvoice.invoice_number);
        console.log('Total Sale Amount:', data.total_amount);
        console.log('Subtotal (before tax):', data.subtotal);
        console.log('Tax:', data.tax_total);

        const arAccount = accounts.find(a => a.id === data.ar_account_id);
        const revenueAccount = accounts.find(a => a.id === data.revenue_account_id);
        const taxAccount = accounts.find(a => a.id === data.tax_account_id);

        if (!arAccount || !revenueAccount) {
          alert('ERROR: Required GL accounts not found. Please select valid Accounts Receivable and Revenue accounts.');
          setIsLoading(false);
          return;
        }

        if (isEditing && oldInvoice) {
          console.log('🔄 EDITING MODE - Reversing old journal entries first...');

          // Reverse old journal entries by finding ALL related entries
          const allJournalEntries = await base44.entities.JournalEntry.list();
          const relatedEntries = allJournalEntries.filter(je =>
            je.source_id === oldInvoice.id && je.source_type === 'invoice'
          );

          console.log(`Found ${relatedEntries.length} journal entries to reverse`);

          for (const je of relatedEntries) {
            if (je.line_items) {
              for (const line of je.line_items) {
                try {
                  const account = await base44.entities.Account.get(line.account_id);
                  if (account) {
                    const currentBalance = parseFloat(account.balance) || 0;
                    const lineDebit = parseFloat(line.debit) || 0;
                    const lineCredit = parseFloat(line.credit) || 0;

                    let newBalance;
                    if (['asset', 'expense', 'cost_of_goods_sold'].includes(account.account_type)) {
                      newBalance = currentBalance - lineDebit + lineCredit;
                    } else {
                      newBalance = currentBalance + lineDebit - lineCredit;
                    }

                    await base44.entities.Account.update(account.id, {
                      balance: newBalance,
                      company_id: account.company_id
                    });

                    console.log(`   Reversed ${account.account_name}: ${currentBalance.toFixed(2)} → ${newBalance.toFixed(2)}`);
                  }
                } catch (error) {
                  console.warn(`Could not reverse account ${line.account_id}:`, error);
                }
              }
            }

            await base44.entities.JournalEntry.delete(je.id);
            console.log(`   Deleted journal entry: ${je.entry_number}`);
          }

          // Restore inventory quantities
          if (oldInvoice.line_items) {
            for (const item of oldInvoice.line_items) {
              if (item.product_id) {
                try {
                  const product = await base44.entities.Product.get(item.product_id);
                  if (product && product.product_type === 'inventory') {
                    const restoredQty = (product.quantity_on_hand || 0) + item.quantity;
                    await base44.entities.Product.update(product.id, {
                      quantity_on_hand: restoredQty
                    });
                    console.log(`   Restored inventory for ${product.product_name}: +${item.quantity}`);
                  }
                } catch (error) {
                  console.warn(`Could not restore inventory:`, error);
                }
              }
            }
          }
        }

        // ============================================
        // JOURNAL ENTRY 1: RECORD THE SALE
        // DR: Accounts Receivable (Total including tax)
        // CR: Sales Revenue (Subtotal before tax)
        // CR: Sales Tax Payable (Tax amount)
        // ============================================
        console.log('\n📝 JOURNAL ENTRY 1: Recording the Sale');

        const journalLines1 = [];

        // DR: Accounts Receivable for TOTAL amount (including tax)
        journalLines1.push({
          account_id: arAccount.id,
          account_name: arAccount.account_name,
          account_code: arAccount.account_code,
          description: `Invoice ${savedInvoice.invoice_number} - ${data.customer_name}`,
          debit: data.total_amount,  // TOTAL including tax
          credit: 0
        });
        console.log(`   DR: Accounts Receivable ₦${data.total_amount.toLocaleString()}`);

        // CR: Sales Revenue for SUBTOTAL (before tax)
        journalLines1.push({
          account_id: revenueAccount.id,
          account_name: revenueAccount.account_name,
          account_code: revenueAccount.account_code,
          description: `Revenue from Invoice ${savedInvoice.invoice_number}`,
          debit: 0,
          credit: data.subtotal  // SUBTOTAL before tax
        });
        console.log(`   CR: Sales Revenue ₦${data.subtotal.toLocaleString()}`);

        // CR: Sales Tax Payable (if applicable)
        if (data.tax_total > 0 && taxAccount) {
          journalLines1.push({
            account_id: taxAccount.id,
            account_name: taxAccount.account_name,
            account_code: taxAccount.account_code,
            description: `Sales Tax on Invoice ${savedInvoice.invoice_number}`,
            debit: 0,
            credit: data.tax_total
          });
          console.log(`   CR: Sales Tax Payable ₦${data.tax_total.toLocaleString()}`);
        } else if (data.tax_total > 0 && !taxAccount) {
          console.warn('WARNING: Sales Tax Payable account not found. Tax amount will not be posted to a specific tax liability account.');
        }


        const journalEntry1 = {
          company_id: data.company_id,
          entry_number: `JE-INV-${savedInvoice.id}`,
          entry_date: data.invoice_date,
          reference: savedInvoice.invoice_number,
          source_type: 'invoice',
          source_id: savedInvoice.id,
          description: `Sales Invoice ${savedInvoice.invoice_number} - ${data.customer_name}`,
          status: 'posted',
          line_items: journalLines1,
          total_debits: data.total_amount,
          total_credits: data.subtotal + data.tax_total,
          posted_by: 'system',
          posted_date: new Date().toISOString()
        };

        const je1 = await base44.entities.JournalEntry.create(journalEntry1);
        console.log(`✅ Journal Entry 1 posted: ${je1.entry_number}`);

        // Update account balances for JE1
        const arCurrentBalance = parseFloat(arAccount.balance) || 0;
        await base44.entities.Account.update(arAccount.id, {
          balance: arCurrentBalance + data.total_amount,
          company_id: arAccount.company_id
        });
        console.log(`   Updated ${arAccount.account_name}: +₦${data.total_amount.toLocaleString()}`);

        const revenueCurrentBalance = parseFloat(revenueAccount.balance) || 0;
        await base44.entities.Account.update(revenueAccount.id, {
          balance: revenueCurrentBalance + data.subtotal,
          company_id: revenueAccount.company_id
        });
        console.log(`   Updated ${revenueAccount.account_name}: +₦${data.subtotal.toLocaleString()}`);

        if (taxAccount && data.tax_total > 0) {
          const taxCurrentBalance = parseFloat(taxAccount.balance) || 0;
          await base44.entities.Account.update(taxAccount.id, {
            balance: taxCurrentBalance + data.tax_total,
            company_id: taxAccount.company_id
          });
          console.log(`   Updated ${taxAccount.account_name}: +₦${data.tax_total.toLocaleString()}`);
        }

        // Update invoice with journal entry reference
        await base44.entities.Invoice.update(savedInvoice.id, {
          journal_entry_id: je1.id
        });

        // ============================================
        // JOURNAL ENTRY 2: RECORD COST OF GOODS SOLD
        // DR: Cost of Sales (Qty × Cost Price)
        // CR: Inventory (Qty × Cost Price)
        // ============================================
        console.log('\n📝 JOURNAL ENTRY 2: Recording Cost of Goods Sold');

        const inventoryAccount = accounts.find(a =>
          a.account_type === 'asset' && a.account_name?.toLowerCase().includes('inventory')
        );
        const cogsAccount = accounts.find(a => a.account_type === 'cost_of_goods_sold');

        let totalCOGS = 0;
        // const cogsBreakdown = []; // This variable was declared but not used in the existing code.

        // Calculate COGS and update inventory for each line item
        for (const item of updatedLineItems) {
          if (item.product_id) {
            try {
              const product = await base44.entities.Product.get(item.product_id);

              if (product && product.product_type === 'inventory') {
                // CRITICAL: COGS = Quantity × Cost Price (NOT Selling Price!)
                const itemCOGS = item.quantity * (product.cost_price || 0);
                totalCOGS += itemCOGS;

                // cogsBreakdown.push({ // This push was in the original, but the variable is unused.
                //   product: product.product_name,
                //   quantity: item.quantity,
                //   costPrice: product.cost_price,
                //   cogs: itemCOGS
                // });

                // Reduce inventory quantity
                const newQty = (product.quantity_on_hand || 0) - item.quantity;
                await base44.entities.Product.update(product.id, {
                  quantity_on_hand: newQty
                });

                console.log(`   ${product.product_name}: Sold ${item.quantity} units @ ₦${(product.cost_price || 0).toLocaleString()} = COGS ₦${itemCOGS.toLocaleString()}`);
                console.log(`   Inventory reduced: ${product.quantity_on_hand} → ${newQty}`);

                // Create inventory transaction
                const inventoryTransaction = {
                  company_id: data.company_id,
                  transaction_number: `INV-${savedInvoice.invoice_number}-${item.product_id}`,
                  transaction_date: data.invoice_date,
                  transaction_type: 'sale',
                  product_id: product.id,
                  product_name: product.product_name,
                  sku: product.sku,
                  location_id: product.location_id,
                  quantity_in: 0,
                  quantity_out: item.quantity,
                  unit_cost: product.cost_price,
                  total_value: itemCOGS,
                  reference_type: 'invoice',
                  reference_id: savedInvoice.id,
                  reference_number: savedInvoice.invoice_number,
                  notes: `Sold via Invoice ${savedInvoice.invoice_number}`
                };

                await base44.entities.InventoryTransaction.create(inventoryTransaction);
              }
            } catch (error) {
              console.warn(`Could not process COGS for product ${item.product_id}:`, error);
            }
          }
        }

        // Post COGS journal entry if there are inventory items
        if (totalCOGS > 0 && cogsAccount && inventoryAccount) {
          console.log(`\n   Total COGS: ₦${totalCOGS.toLocaleString()}`);

          const journalLines2 = [
            {
              account_id: cogsAccount.id,
              account_name: cogsAccount.account_name,
              account_code: cogsAccount.account_code,
              description: `COGS for Invoice ${savedInvoice.invoice_number}`,
              debit: totalCOGS,
              credit: 0
            },
            {
              account_id: inventoryAccount.id,
              account_name: inventoryAccount.account_name,
              account_code: inventoryAccount.account_code,
              description: `Inventory sold via Invoice ${savedInvoice.invoice_number}`,
              debit: 0,
              credit: totalCOGS
            }
          ];

          const journalEntry2 = {
            company_id: data.company_id,
            entry_number: `JE-COGS-${savedInvoice.id}`,
            entry_date: data.invoice_date,
            reference: savedInvoice.invoice_number,
            source_type: 'invoice',
            source_id: savedInvoice.id,
            description: `Cost of Goods Sold for Invoice ${savedInvoice.invoice_number}`,
            status: 'posted',
            line_items: journalLines2,
            total_debits: totalCOGS,
            total_credits: totalCOGS,
            posted_by: 'system',
            posted_date: new Date().toISOString()
          };

          const je2 = await base44.entities.JournalEntry.create(journalEntry2);
          console.log(`✅ Journal Entry 2 posted: ${je2.entry_number}`);

          // Update COGS account balance
          const cogsCurrentBalance = parseFloat(cogsAccount.balance) || 0;
          await base44.entities.Account.update(cogsAccount.id, {
            balance: cogsCurrentBalance + totalCOGS,
            company_id: cogsAccount.company_id
          });
          console.log(`   Updated ${cogsAccount.account_name}: +₦${totalCOGS.toLocaleString()}`);

          // Update Inventory account balance
          const invCurrentBalance = parseFloat(inventoryAccount.balance) || 0;
          await base44.entities.Account.update(inventoryAccount.id, {
            balance: invCurrentBalance - totalCOGS,
            company_id: inventoryAccount.company_id
          });
          console.log(`   Updated ${inventoryAccount.account_name}: -₦${totalCOGS.toLocaleString()}`);

          // Calculate and display gross profit
          const grossProfit = data.subtotal - totalCOGS;
          console.log(`\n💰 GROSS PROFIT: ₦${grossProfit.toLocaleString()} (Revenue ₦${data.subtotal.toLocaleString()} - COGS ₦${totalCOGS.toLocaleString()})`);
        } else if (totalCOGS > 0) {
          if (!cogsAccount) {
            console.warn('⚠️ COGS account not found. COGS journal entry skipped.');
          }
          if (!inventoryAccount) {
            console.warn('⚠️ Inventory account not found. COGS journal entry skipped.');
          }
        }

        console.log('\n✅ ALL JOURNAL ENTRIES POSTED SUCCESSFULLY');
      }

      return savedInvoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['invoices']);
      queryClient.invalidateQueries(['accounts']);
      queryClient.invalidateQueries(['journal-entries']);
      queryClient.invalidateQueries(['products']);
      queryClient.invalidateQueries(['inventory-transactions']);
      queryClient.invalidateQueries(['jobs']); // Invalidate jobs just in case
      setIsLoading(false);
      onClose();
    },
    onError: (error) => {
      console.error('Error saving invoice:', error);
      alert('Error saving invoice: ' + error.message);
      setIsLoading(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!window.confirm('⚠️ DELETE INVOICE?\n\nThis will:\n- Remove the invoice permanently\n- Delete all journal entries\n- Restore inventory quantities\n- Update all financial reports\n\nAre you absolutely sure?')) {
        throw new Error('Cancelled');
      }

      setIsLoading(true);
      const invoiceToDelete = invoice || invoiceId;

      console.log('🔴🔴🔴 STARTING COMPLETE INVOICE DELETION 🔴🔴🔴');
      console.log('Invoice ID:', invoiceToDelete.id || invoiceToDelete);

      // Get full invoice data
      const fullInvoice = await base44.entities.Invoice.get(invoiceToDelete.id || invoiceToDelete);
      console.log('📄 Invoice data:', fullInvoice);

      if (!fullInvoice) {
        throw new Error('Invoice not found');
      }

      // STEP 1: Find ALL journal entries - use multiple search methods
      console.log('🔍 Searching for ALL journal entries...');

      const allJournalEntries = await base44.entities.JournalEntry.list();
      console.log(`📊 Total journal entries in system: ${allJournalEntries.length}`);

      // Filter for this invoice's entries
      const relatedEntries = allJournalEntries.filter(je => {
        const matchesSourceId = je.source_id === fullInvoice.id;
        const matchesReference = je.reference && (
          je.reference.includes(fullInvoice.invoice_number) ||
          je.reference === fullInvoice.invoice_number
        );
        const matchesJEId = je.id === fullInvoice.journal_entry_id;
        const matchesEntryNumber = je.entry_number && je.entry_number.includes(fullInvoice.id);

        return matchesSourceId || matchesReference || matchesJEId || matchesEntryNumber;
      });

      console.log(`🎯 Found ${relatedEntries.length} journal entries to DELETE:`, relatedEntries.map(je => ({
        id: je.id,
        entry_number: je.entry_number,
        reference: je.reference,
        source_id: je.source_id
      })));

      if (relatedEntries.length === 0) {
        console.warn('⚠️ No journal entries found - invoice may not have been posted');
      }

      // STEP 2: Delete each journal entry and reverse balances
      for (const journalEntry of relatedEntries) {
        console.log(`\n🔄 Processing Journal Entry: ${journalEntry.entry_number}`);
        console.log('Entry ID:', journalEntry.id);
        console.log('Line items:', journalEntry.line_items);

        if (journalEntry.line_items && journalEntry.line_items.length > 0) {
          // Reverse account balances first
          for (const line of journalEntry.line_items) {
            try {
              console.log(`\n💰 Processing line item for account: ${line.account_name || line.account_id}`);

              const account = await base44.entities.Account.get(line.account_id);
              if (!account) {
                console.error(`❌ Account not found: ${line.account_id}`);
                continue;
              }

              const currentBalance = parseFloat(account.balance) || 0;
              const lineDebit = parseFloat(line.debit) || 0;
              const lineCredit = parseFloat(line.credit) || 0;

              // CRITICAL: Reverse by subtracting what was added
              // A Debit increases a Debit balance and decreases a Credit balance
              // A Credit decreases a Debit balance and increases a Credit balance
              let newBalance = currentBalance;
              if (account.account_type === 'asset' || account.account_type === 'expense' || account.account_type === 'cost_of_goods_sold') { // Debit-normal accounts
                newBalance = currentBalance - lineDebit + lineCredit;
              } else { // Credit-normal accounts (liability, equity, revenue)
                newBalance = currentBalance + lineDebit - lineCredit;
              }

              console.log(`📊 Reversing ${account.account_name} (${account.account_type}):`);
              console.log(`   Current: ${currentBalance.toFixed(2)}`);
              console.log(`   Debit: ${lineDebit.toFixed(2)}`);
              console.log(`   Credit: ${lineCredit.toFixed(2)}`);
              console.log(`   New: ${newBalance.toFixed(2)}`);
              console.log(`   Change: ${(newBalance - currentBalance).toFixed(2)}`);

              await base44.entities.Account.update(account.id, {
                balance: newBalance,
                company_id: account.company_id // CRITICAL FIX: Include company_id
              });

              console.log(`✅ Account reversed: ${currentBalance.toFixed(2)} → ${newBalance.toFixed(2)}`);
            } catch (accountError) {
              console.error(`❌ Error updating account:`, accountError);
              throw accountError;
            }
          }
        }

        // STEP 3: DELETE the journal entry
        try {
          console.log(`🗑️ Deleting journal entry: ${journalEntry.entry_number} (ID: ${journalEntry.id})`);
          await base44.entities.JournalEntry.delete(journalEntry.id);
          console.log(`✅✅✅ Journal entry DELETED: ${journalEntry.entry_number}`);
        } catch (deleteError) {
          console.error(`❌❌❌ FAILED to delete journal entry ${journalEntry.id}:`, deleteError);
          throw new Error(`Failed to delete journal entry: ${deleteError.message}`);
        }
      }

      // STEP 4: Restore inventory and delete inventory transactions
      if (fullInvoice.line_items && fullInvoice.line_items.length > 0) {
        console.log('\n📦 Restoring inventory and deleting inventory transactions...');

        for (const item of fullInvoice.line_items) {
          if (item.product_id) {
            try {
              const product = await base44.entities.Product.get(item.product_id);
              if (product && product.product_type === 'inventory') {
                const currentQty = parseFloat(product.quantity_on_hand) || 0;
                const soldQty = parseFloat(item.quantity) || 0;
                const restoredQty = currentQty + soldQty;

                await base44.entities.Product.update(item.product_id, {
                  quantity_on_hand: restoredQty
                });

                console.log(`📦 ${product.product_name}: ${currentQty} + ${soldQty} = ${restoredQty}`);
              }

              // Delete related InventoryTransactions for this product item
              const relatedInvTransactions = await base44.entities.InventoryTransaction.filter({
                reference_id: fullInvoice.id,
                product_id: item.product_id,
                transaction_type: 'sale'
              });
              for (const trans of relatedInvTransactions) {
                await base44.entities.InventoryTransaction.delete(trans.id);
                console.log(`   Deleted Inventory Transaction: ${trans.transaction_number}`);
              }
            } catch (productError) {
              console.error(`❌ Error restoring product or deleting inventory transaction:`, productError);
            }
          }
        }
      }

      // STEP 5: DELETE the invoice
      try {
        console.log('\n🗑️ Deleting invoice record...');
        await base44.entities.Invoice.delete(fullInvoice.id);
        console.log('✅ Invoice deleted');
      } catch (invoiceDeleteError) {
        console.error('❌ Error deleting invoice:', invoiceDeleteError);
        throw new Error(`Failed to delete invoice: ${invoiceDeleteError.message}`);
      }

      console.log('\n✅✅✅ DELETION COMPLETE ✅✅✅');
      console.log('All journal entries deleted');
      console.log('All accounts reversed');
      console.log('Inventory restored');
      console.log('Inventory transactions deleted');
      console.log('Invoice removed');

      return true;
    },
    onSuccess: () => {
      console.log('\n🔄 Invalidating ALL caches...');

      // Invalidate EVERYTHING
      queryClient.invalidateQueries();

      // Force refresh specific queries
      queryClient.refetchQueries(['invoices']);
      queryClient.refetchQueries(['accounts']);
      queryClient.refetchQueries(['journal-entries']);
      queryClient.refetchQueries(['products']);
      queryClient.refetchQueries(['inventory-transactions']);
      queryClient.refetchQueries(['ledger-entries']);
      queryClient.refetchQueries(['jobs']); // Invalidate jobs just in case

      setIsLoading(false);
      alert('✅ Invoice deleted successfully!\n\nAll journal entries removed.\nAll accounts updated.\nPlease refresh the page to see updates.');

      // Force page reload to clear all caches
      window.location.reload();
    },
    onError: (error) => {
      if (error.message !== 'Cancelled') {
        console.error('\n❌❌❌ DELETION FAILED ❌❌❌');
        console.error('Error:', error);
        alert(`❌ Error deleting invoice:\n\n${error.message}\n\nPlease check the console for details.`);
      }
      setIsLoading(false);
    }
  });

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSubmit = () => {
    if (!canPerformAction('write')) {
      alert('Your evaluation period has expired. Please upgrade to continue.');
      return;
    }

    if (!formData.customer_id) {
      alert('Please select a customer');
      return;
    }

    if (!formData.ar_account_id) {
      alert('Please select an Accounts Receivable account');
      return;
    }

    if (!formData.revenue_account_id) {
      alert('Please select a Revenue account');
      return;
    }

    if (formData.tax_total > 0 && !formData.tax_account_id) {
      alert('Please select a Sales Tax Payable account');
      return;
    }

    if (formData.line_items.length === 0) {
      alert('Please add at least one line item');
      return;
    }

    saveMutation.mutate(formData);
  };

  // Helper function to safely format numbers
  const safeToFixed = (value, decimals = 2) => {
    const num = parseFloat(value);
    return isNaN(num) ? '0.00' : num.toFixed(decimals);
  };

  return (
    <>
      {/* CRITICAL FIX: Clean print template - remove ALL unnecessary elements */}
      <div className="hidden print:block print:p-0">
        <style>{`
          @media print {
            @page {
              size: A4 portrait;
              margin: 0;
            }
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
              margin: 0;
              padding: 0;
            }
            .no-print, header, nav, footer, .sidebar {
              display: none !important;
            }
          }
        `}</style>

        <div className="p-8 bg-white" style={{maxWidth: '210mm', margin: '0 auto'}}>
          {/* Header */}
          <div className="flex justify-between items-start mb-6 pb-4 border-b-2 border-gray-900">
            <div className="flex-1">
              {currentCompany?.logo_url && (
                <img src={currentCompany.logo_url} alt="Logo" className="h-12 mb-2" />
              )}
              <h1 className="text-xl font-bold text-gray-900">{currentCompany?.company_name}</h1>
              <p className="text-xs text-gray-700 mt-1">{currentCompany?.address?.street}</p>
              <p className="text-xs text-gray-700">
                {currentCompany?.address?.city}, {currentCompany?.address?.state} {currentCompany?.address?.postal_code}
              </p>
              <p className="text-xs text-gray-700">Phone: {currentCompany?.contact_phone}</p>
            </div>
            
            <div className="text-right">
              <h2 className="text-3xl font-bold text-gray-900">INVOICE</h2>
              <div className="mt-2 text-xs">
                <p><span className="font-semibold">Invoice #:</span> {formData.invoice_number}</p>
                <p><span className="font-semibold">Date:</span> {format(new Date(formData.invoice_date), 'MMM d, yyyy')}</p>
                <p><span className="font-semibold">Due:</span> {format(new Date(formData.due_date), 'MMM d, yyyy')}</p>
                {formData.job_name && ( // Display job name if available
                  <p><span className="font-semibold">Job:</span> {formData.job_name}</p>
                )}
              </div>
            </div>
          </div>

          {/* Bill To / Ship To */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="border border-gray-900 p-3">
              <p className="font-bold text-xs mb-1">Bill To:</p>
              <p className="font-semibold text-sm">{formData.customer_name}</p>
              {formData.billing_address && (
                <>
                  <p className="text-xs">{formData.billing_address.street}</p>
                  <p className="text-xs">
                    {formData.billing_address.city}, {formData.billing_address.state} {formData.billing_address.postal_code}
                  </p>
                </>
              )}
            </div>
            <div className="border border-gray-900 p-3">
              <p className="font-bold text-xs mb-1">Ship To:</p>
              <p className="font-semibold text-sm">{formData.customer_name}</p>
              {formData.shipping_address && (
                <>
                  <p className="text-xs">{formData.shipping_address.street}</p>
                  <p className="text-xs">
                    {formData.shipping_address.city}, {formData.shipping_address.state} {formData.shipping_address.postal_code}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Line Items - Compact */}
          <table className="w-full border-collapse border border-gray-900 mb-3" style={{fontSize: '10px'}}>
            <thead>
              <tr className="border-b border-gray-900 bg-gray-50">
                <th className="border-r border-gray-900 p-1 text-left">Qty</th>
                <th className="border-r border-gray-900 p-1 text-left">Description</th>
                <th className="border-r border-gray-900 p-1 text-right">Unit Price</th>
                <th className="p-1 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {formData.line_items.map((item, index) => (
                <tr key={index} className="border-b border-gray-900">
                  <td className="border-r border-gray-900 p-1 text-center">{safeToFixed(item.quantity, 0)}</td>
                  <td className="border-r border-gray-900 p-1">{item.description}</td>
                  <td className="border-r border-gray-900 p-1 text-right">{safeToFixed(item.unit_price)}</td>
                  <td className="p-1 text-right font-semibold">{safeToFixed(item.quantity * item.unit_price)}</td>
                </tr>
              ))}
              {/* Fill remaining rows */}
              {Array.from({ length: Math.max(0, 8 - formData.line_items.length) }).map((_, i) => (
                <tr key={`empty-${i}`} className="border-b border-gray-900">
                  <td className="border-r border-gray-900 p-1">&nbsp;</td>
                  <td className="border-r border-gray-900 p-1">&nbsp;</td>
                  <td className="border-r border-gray-900 p-1">&nbsp;</td>
                  <td className="p-1">&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals - Right aligned, compact */}
          <div className="flex justify-end mb-3">
            <div className="w-48">
              <table className="w-full border border-gray-900 text-xs">
                <tbody>
                  <tr className="border-b border-gray-900">
                    <td className="p-1 text-right font-semibold">Subtotal</td>
                    <td className="p-1 text-right">{safeToFixed(formData.subtotal)}</td>
                  </tr>
                  <tr className="border-b border-gray-900">
                    <td className="p-1 text-right font-semibold">Tax</td>
                    <td className="p-1 text-right">{safeToFixed(formData.tax_total)}</td>
                  </tr>
                  <tr className="bg-gray-900 text-white font-bold">
                    <td className="p-1 text-right">TOTAL</td>
                    <td className="p-1 text-right">{safeToFixed(formData.total_amount)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer - Compact */}
          {formData.notes && (
            <div className="mb-3 text-xs">
              <span className="font-semibold">Notes:</span> {formData.notes}
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-gray-400 flex justify-between items-end text-xs">
            <div>
              <p className="font-semibold mb-6">Authorized Signature:</p>
              <div className="border-t border-gray-900 w-32 pt-1"></div>
            </div>
            <div className="text-right">
              <p>Thank you for your business!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Screen View */}
      <Card className="fixed inset-4 z-50 overflow-auto bg-white shadow-2xl print:hidden">
        <CardHeader className="border-b sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">
              {invoice || invoiceId ? 'Edit Invoice' : 'New Invoice'}
            </CardTitle>
            <div className="flex gap-2">
              {(invoice || invoiceId) && (
                <>
                  <Button
                    variant="outline"
                    onClick={handlePrint}
                    disabled={isLoading}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Print
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isLoading}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Invoice
                  </Button>
                </>
              )}
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Invoice Header */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Customer *</Label>
              <Select value={formData.customer_id} onValueChange={handleCustomerChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(customer => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* CRITICAL: Added Job/Project field */}
            <div className="space-y-2">
              <Label>Job/Project (Optional)</Label>
              <Select value={formData.job_id || ''} onValueChange={(value) => {
                const selectedJob = jobs.find(j => j.id === value);
                setFormData(prev => ({ 
                  ...prev, 
                  job_id: value,
                  job_name: selectedJob?.job_name || ''
                }));
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select job (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>No Job</SelectItem> {/* Use empty string for "No Job" */}
                  {jobs.map(job => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.job_number} - {job.job_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Invoice Number</Label>
              <Input
                value={formData.invoice_number}
                onChange={(e) => setFormData(prev => ({ ...prev, invoice_number: e.target.value }))}
                placeholder="INV-001"
              />
            </div>

            <div className="space-y-2">
              <Label>Invoice Date</Label>
              <Input
                type="date"
                value={formData.invoice_date}
                onChange={(e) => setFormData(prev => ({ ...prev, invoice_date: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="viewed">Viewed</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* CRITICAL: GL Account Selectors */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3">📊 General Ledger Accounts</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>A/R Account *</Label>
                <Select value={formData.ar_account_id} onValueChange={(value) => setFormData(prev => ({ ...prev, ar_account_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select A/R account" />
                  </SelectTrigger>
                  <SelectContent>
                    {arAccounts.map(account => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.account_code} - {account.account_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Revenue Account *</Label>
                <Select value={formData.revenue_account_id} onValueChange={(value) => setFormData(prev => ({ ...prev, revenue_account_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select revenue account" />
                  </SelectTrigger>
                  <SelectContent>
                    {revenueAccounts.map(account => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.account_code} - {account.account_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Sales Tax Payable</Label>
                <Select value={formData.tax_account_id} onValueChange={(value) => setFormData(prev => ({ ...prev, tax_account_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tax account" />
                  </SelectTrigger>
                  <SelectContent>
                    {taxAccounts.map(account => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.account_code} - {account.account_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs text-blue-700 mt-2">
              ℹ️ These accounts will be used for journal entry posting
            </p>
          </div>

          {/* Line Items - REMOVED GL Account field per line */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <Label className="text-lg">Line Items</Label>
              <Button type="button" size="sm" onClick={addLineItem}>
                <Plus className="w-4 h-4 mr-2" />
                Add Line
              </Button>
            </div>

            <div className="space-y-4">
              {formData.line_items.map((item, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="space-y-2">
                      <Label>Product</Label>
                      <Select
                        value={item.product_id}
                        onValueChange={(value) => handleProductChange(index, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map(product => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.product_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Unit Price</Label>
                      <Input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Tax %</Label>
                      <Input
                        type="number"
                        value={item.tax_rate}
                        onChange={(e) => updateLineItem(index, 'tax_rate', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    {/* The GL Account Select component was here and has been removed */}
                    <div className="text-right flex-1">
                      <span className="text-sm text-gray-600">Line Total: </span>
                      <span className="font-semibold">
                        {safeToFixed(item.quantity * item.unit_price * (1 + (item.tax_rate || 0) / 100))}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLineItem(index)}
                      className="ml-4"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="border-t pt-4">
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-semibold">{safeToFixed(formData.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span className="font-semibold">{safeToFixed(formData.tax_total)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>{safeToFixed(formData.total_amount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Invoice'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}


import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X, Plus, Trash2, Save } from "lucide-react";
import { format } from "date-fns";
import { useCompany } from "../auth/CompanyContext";

export default function BillForm({ bill, billId, onClose }) {
  const { currentCompany, canPerformAction } = useCompany();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    company_id: currentCompany?.id || '',
    bill_number: '',
    vendor_id: '',
    vendor_name: '',
    job_id: '', // CRITICAL: Added job field
    job_name: '', // CRITICAL: Added job name
    bill_date: format(new Date(), 'yyyy-MM-dd'),
    due_date: format(new Date(), 'yyyy-MM-dd'),
    status: 'draft',
    currency: currentCompany?.base_currency || 'USD',
    ap_account_id: '', // CRITICAL: A/P Account selector
    expense_account_id: '', // CRITICAL: Expense/COGS Account selector
    tax_account_id: '', // CRITICAL: Purchase Tax Account selector
    line_items: [
      {
        product_id: '',
        description: '',
        quantity: 1,
        unit_cost: 0,
        tax_rate: 0,
        tax_amount: 0,
        line_total: 0,
        gl_account_id: '' // CRITICAL: GL account per line item
      }
    ],
    subtotal: 0,
    tax_total: 0,
    total_amount: 0,
    notes: ''
  });

  // Fetch existing bill if editing
  const { data: existingBill } = useQuery({
    queryKey: ['bill', billId],
    queryFn: () => billId ? base44.entities.Bill.get(billId) : null,
    enabled: !!billId
  });

  // Fetch vendors
  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.Vendor.filter({ company_id: currentCompany.id }) : [],
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
  const apAccounts = accounts.filter(acc =>
    acc.account_type === 'liability' &&
    acc.account_name?.toLowerCase().includes('payable')
  );

  const expenseAccounts = accounts.filter(acc =>
    acc.account_type === 'expense' ||
    acc.account_type === 'cost_of_goods_sold'
  );

  const taxAccounts = accounts.filter(acc =>
    acc.account_type === 'asset' &&
    (acc.account_name?.toLowerCase().includes('tax') ||
     acc.account_name?.toLowerCase().includes('vat') ||
     acc.account_name?.toLowerCase().includes('input'))
  );

  // Load existing bill data
  useEffect(() => {
    if (existingBill || bill) {
      const billData = existingBill || bill;
      setFormData({
        ...billData,
        ap_account_id: billData.ap_account_id || '',
        expense_account_id: billData.expense_account_id || '',
        tax_account_id: billData.tax_account_id || '',
        job_id: billData.job_id || '', // Ensure job_id is initialized
        job_name: billData.job_name || '', // Ensure job_name is initialized
      });
    }
  }, [existingBill, bill]);

  // Auto-select default accounts
  useEffect(() => {
    if (apAccounts.length > 0 && !formData.ap_account_id) {
      setFormData(prev => ({ ...prev, ap_account_id: apAccounts[0].id }));
    }
    if (expenseAccounts.length > 0 && !formData.expense_account_id) {
      setFormData(prev => ({ ...prev, expense_account_id: expenseAccounts[0].id }));
    }
    if (taxAccounts.length > 0 && !formData.tax_account_id) {
      setFormData(prev => ({ ...prev, tax_account_id: taxAccounts[0].id }));
    }
  }, [apAccounts, expenseAccounts, taxAccounts]);

  const calculateTotals = () => {
    const subtotal = formData.line_items.reduce((sum, item) => {
      return sum + (item.quantity * item.unit_cost);
    }, 0);
    
    const taxTotal = formData.line_items.reduce((sum, item) => {
      const lineSubtotal = item.quantity * item.unit_cost;
      return sum + (lineSubtotal * (item.tax_rate || 0) / 100);
    }, 0);
    
    const total = subtotal + taxTotal;
    
    setFormData(prev => ({
      ...prev,
      subtotal: subtotal,
      tax_total: taxTotal,
      total_amount: total,
      balance_due: total - (prev.amount_paid || 0)
    }));
  };

  useEffect(() => {
    calculateTotals();
  }, [formData.line_items]);

  const handleVendorChange = (vendorId) => {
    const vendor = vendors.find(v => v.id === vendorId);
    setFormData(prev => ({
      ...prev,
      vendor_id: vendorId,
      vendor_name: vendor?.company_name || ''
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
        unit_cost: product.cost_price || 0,
        tax_rate: product.tax_rate || 0,
        gl_account_id: product.purchase_account_id || formData.expense_account_id
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
          unit_cost: 0,
          tax_rate: 0,
          tax_amount: 0,
          line_total: 0,
          gl_account_id: formData.expense_account_id
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

  // New helper mutation to delete a single Journal Entry and reverse its effects
  const deleteJournalEntryMutation = useMutation({
    mutationFn: async (journalEntryId) => {
      console.log('🔄 Processing Journal Entry:', journalEntryId);
      
      if (!journalEntryId) {
        console.log('⚠️ No journal entry to process');
        return;
      }

      try {
        const je = await base44.entities.JournalEntry.get(journalEntryId);
        console.log('Entry ID:', je.id);
        console.log('Line items:', je.line_items);

        if (je && je.line_items) {
          for (const line of je.line_items) {
            console.log(`\n💰 Processing line item for account: ${line.account_name}`);
            
            try {
              const account = await base44.entities.Account.get(line.account_id);
              console.log(`📊 Reversing ${account.account_name}:`);
              console.log(`   Current: ${account.balance}`);
              console.log(`   Debit: ${line.debit}`);
              console.log(`   Credit: ${line.credit}`);

              const currentBalance = parseFloat(account.balance) || 0;
              const lineDebit = parseFloat(line.debit) || 0;
              const lineCredit = parseFloat(line.credit) || 0;

              const isDebitAccount = ['asset', 'expense', 'cost_of_goods_sold'].includes(account.account_type);
              let newBalance;

              // Correct reversal logic for debit and credit accounts
              if (isDebitAccount) {
                newBalance = currentBalance - lineDebit + lineCredit; // Reverse debit by subtracting, reverse credit by adding
              } else { // Credit accounts (Liability, Equity, Revenue)
                newBalance = currentBalance - lineCredit + lineDebit; // Reverse credit by subtracting, reverse debit by adding
              }

              console.log(`   New: ${newBalance}`);
              console.log(`   Change: ${newBalance - currentBalance}`);

              await base44.entities.Account.update(account.id, {
                balance: newBalance,
                company_id: account.company_id // CRITICAL FIX: Include company_id when updating
              });
              
              console.log(`   ✅ ${account.account_name} updated successfully`);
            } catch (error) {
              console.error(`   ❌ Error updating account:`, error);
              throw error;
            }
          }
        }

        await base44.entities.JournalEntry.delete(je.id);
        console.log('✅ Journal entry deleted successfully');
      } catch (error) {
        console.error('\n❌❌❌ Journal Entry Deletion Failed ❌❌❌');
        console.error('Error:', error);
        throw error;
      }
    }
  });


  const saveMutation = useMutation({
    mutationFn: async (data) => {
      setIsLoading(true);

      // Calculate line item totals
      const updatedLineItems = data.line_items.map(item => {
        const lineSubtotal = item.quantity * item.unit_cost;
        const taxAmount = (lineSubtotal * (item.tax_rate || 0)) / 100;
        return {
          ...item,
          tax_amount: taxAmount,
          line_total: lineSubtotal + taxAmount
        };
      });

      const billData = {
        ...data,
        line_items: updatedLineItems,
        balance_due: data.total_amount - (data.amount_paid || 0)
      };

      let savedBill;
      let isEditing = false;
      let oldBill = null;

      if (billId || bill?.id) {
        isEditing = true;
        oldBill = await base44.entities.Bill.get(billId || bill.id);
        savedBill = await base44.entities.Bill.update(billId || bill.id, billData);
      } else {
        savedBill = await base44.entities.Bill.create(billData);
      }

      // CRITICAL: Post journal entry with proper edit handling
      if (data.status === 'pending' || data.status === 'approved') { // Should be 'pending' or 'approved'
        // CRITICAL FIX: Determine if this is an inventory purchase or expense
        let isInventoryPurchase = false;
        
        for (const item of data.line_items) {
          if (item.product_id) {
            try {
              const product = await base44.entities.Product.get(item.product_id);
              if (product && product.product_type === 'inventory') {
                isInventoryPurchase = true;
                break;
              }
            } catch (error) {
              console.warn('Could not fetch product:', error);
            }
          }
        }

        console.log(`📦 Bill Type: ${isInventoryPurchase ? 'INVENTORY PURCHASE' : 'EXPENSE'}`);

        // Find appropriate accounts
        let debitAccount;
        if (isInventoryPurchase) {
          // For inventory purchases: DR Inventory
          debitAccount = accounts.find(a => 
            a.account_type === 'asset' && 
            (a.account_name?.toLowerCase().includes('inventory') || a.account_code?.startsWith('13'))
          );
        } else {
          // For expenses: DR Expense account
          debitAccount = accounts.find(a => a.id === data.expense_account_id) || 
                        accounts.find(a => 
                           a.account_type === 'expense' || a.account_type === 'cost_of_goods_sold'
                        );
        }

        const apAccount = accounts.find(a => a.id === data.ap_account_id) || 
                         accounts.find(a => 
                           a.account_type === 'liability' && 
                           a.account_name?.toLowerCase().includes('payable')
                         );
        const taxAccount = accounts.find(a => a.id === data.tax_account_id) ||
                            accounts.find(a => 
                              a.account_name?.toLowerCase().includes('input tax') ||
                              a.account_name?.toLowerCase().includes('vat input')
                            );

        if (isEditing && oldBill) {
          console.log('🔄 EDITING BILL - Reversing old journal entry and posting new one');

          // Reverse old entries
          if (oldBill.journal_entry_id) {
            try {
              const oldJE = await base44.entities.JournalEntry.get(oldBill.journal_entry_id);
              
              if (oldJE && oldJE.line_items) {
                for (const line of oldJE.line_items) {
                  try {
                    const account = await base44.entities.Account.get(line.account_id);
                    if (account) {
                      const currentBalance = parseFloat(account.balance) || 0;
                      const lineDebit = parseFloat(line.debit) || 0;
                      const lineCredit = parseFloat(line.credit) || 0;
                      
                      const isAccDebitType = ['asset', 'expense', 'cost_of_goods_sold'].includes(account.account_type);
                      let newBalance;
                      
                      if (isAccDebitType) {
                        newBalance = currentBalance - lineDebit + lineCredit; // Reverse debit by subtracting, reverse credit by adding
                      } else { // Credit accounts (Liability, Equity, Revenue)
                        newBalance = currentBalance - lineCredit + lineDebit; // Reverse credit by subtracting, reverse debit by adding
                      }
                      
                      await base44.entities.Account.update(account.id, {
                        balance: newBalance,
                        company_id: account.company_id
                      });
                      
                      console.log(`   Reversed ${account.account_name}: ${currentBalance} → ${newBalance}`);
                    }
                  } catch (error) {
                    console.warn(`Could not reverse account ${line.account_id}:`, error);
                  }
                }
              }

              await base44.entities.JournalEntry.delete(oldBill.journal_entry_id);
              console.log('   ✅ Old journal entry deleted');
            } catch (error) {
              console.warn('   ⚠️ Could not delete old journal entry:', error);
            }
          }

          // Reverse inventory quantities if it was an inventory purchase
          if (oldBill.line_items) {
            for (const item of oldBill.line_items) {
              if (item.product_id) {
                try {
                  const product = await base44.entities.Product.get(item.product_id);
                  if (product && product.product_type === 'inventory') {
                    const newQty = (product.quantity_on_hand || 0) - item.quantity;
                    await base44.entities.Product.update(product.id, {
                      quantity_on_hand: newQty
                    });
                    console.log(`   Reversed inventory for ${product.product_name}: -${item.quantity}`);
                  }
                } catch (error) {
                  console.warn(`Could not reverse inventory for product ${item.product_id}:`, error);
                }
              }
            }
          }

          console.log('📊 Step 2: Posting new journal entry with updated accounts');
        }

        // Post new journal entry (whether creating or editing)
        const journalLines = [];

        // DR: Expense/COGS Account (Subtotal before tax)
        if (debitAccount) {
          journalLines.push({
            account_id: debitAccount.id,
            account_name: debitAccount.account_name,
            account_code: debitAccount.account_code,
            description: `Bill ${savedBill.bill_number} - ${data.vendor_name}`,
            debit: data.subtotal,
            credit: 0
          });
        }

        // DR: Input Tax/VAT Receivable (Tax amount)
        if (taxAccount && data.tax_total > 0) {
          journalLines.push({
            account_id: taxAccount.id,
            account_name: taxAccount.account_name,
            account_code: taxAccount.account_code,
            description: `Input Tax on Bill ${savedBill.bill_number}`,
            debit: data.tax_total,
            credit: 0
          });
        }

        // CR: Accounts Payable (Total including tax)
        if (apAccount) {
          journalLines.push({
            account_id: apAccount.id,
            account_name: apAccount.account_name,
            account_code: apAccount.account_code,
            description: `Bill ${savedBill.bill_number} - ${data.vendor_name}`,
            debit: 0,
            credit: data.total_amount
          });
        }
        
        // Ensure total debits and credits balance (for validation)
        const totalDebits = journalLines.reduce((sum, line) => sum + line.debit, 0);
        const totalCredits = journalLines.reduce((sum, line) => sum + line.credit, 0);

        if (Math.abs(totalDebits - totalCredits) > 0.01) { // Allow for floating point inaccuracies
          throw new Error(`Journal entry does not balance. Debits: ${totalDebits}, Credits: ${totalCredits}`);
        }

        const journalEntry = {
          company_id: data.company_id,
          entry_number: `JE-BILL-${savedBill.id}`,
          entry_date: data.bill_date,
          reference: savedBill.bill_number,
          source_type: 'bill',
          source_id: savedBill.id,
          description: `Bill ${savedBill.bill_number} - ${data.vendor_name}`,
          status: 'posted',
          line_items: journalLines,
          total_debits: totalDebits,
          total_credits: totalCredits,
          posted_by: 'system',
          posted_date: new Date().toISOString()
        };

        const je = await base44.entities.JournalEntry.create(journalEntry);

        // Update account balances with NEW amounts
        // Note: The debit account balance is updated by its DR, and AP by its CR.
        // Tax is already debited from taxAccount. So DR is sum of debitAccount and taxAccount.
        if (debitAccount) {
          const currentBalance = parseFloat(debitAccount.balance) || 0;
          await base44.entities.Account.update(debitAccount.id, {
            balance: currentBalance + data.subtotal, // Debit for subtotal
            company_id: debitAccount.company_id
          });
          console.log(`   Posted to ${debitAccount.account_name}: +${data.subtotal}`);
        }

        if (taxAccount && data.tax_total > 0) {
          const currentBalance = parseFloat(taxAccount.balance) || 0;
          await base44.entities.Account.update(taxAccount.id, {
            balance: currentBalance + data.tax_total, // Debit for tax
            company_id: taxAccount.company_id
          });
          console.log(`   Posted to ${taxAccount.account_name}: +${data.tax_total}`);
        }

        if (apAccount) {
          const currentBalance = parseFloat(apAccount.balance) || 0;
          await base44.entities.Account.update(apAccount.id, {
            balance: currentBalance + data.total_amount, // Credit for total amount
            company_id: apAccount.company_id
          });
          console.log(`   Posted to ${apAccount.account_name}: +${data.total_amount}`);
        }

        // Update bill with journal entry reference
        await base44.entities.Bill.update(savedBill.id, {
          journal_entry_id: je.id
        });

        // CRITICAL: Update inventory quantities for inventory purchases
        if (isInventoryPurchase) {
          console.log('📦 Updating inventory quantities...');
          
          for (const item of data.line_items) {
            if (item.product_id) {
              try {
                const product = await base44.entities.Product.get(item.product_id);
                
                if (product && product.product_type === 'inventory') {
                  const newQty = (product.quantity_on_hand || 0) + item.quantity;
                  await base44.entities.Product.update(product.id, {
                    quantity_on_hand: newQty
                  });
                  
                  console.log(`   Updated ${product.product_name} inventory: ${product.quantity_on_hand} → ${newQty}`);
                }
              } catch (error) {
                console.warn(`   Could not update inventory for product ${item.product_id}:`, error);
              }
            }
          }
        }

        console.log('✅ All journal entries posted successfully');
      }

      return savedBill;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['bills']);
      queryClient.invalidateQueries(['accounts']);
      queryClient.invalidateQueries(['journal-entries']);
      queryClient.invalidateQueries(['products']);
      queryClient.invalidateQueries(['jobs']); // Invalidate jobs in case something related changed
      setIsLoading(false);
      onClose();
    },
    onError: (error) => {
      console.error('Error saving bill:', error);
      alert('Error saving bill: ' + error.message);
      setIsLoading(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!window.confirm('⚠️ DELETE BILL?\n\nThis will:\n- Remove the bill permanently\n- Reverse all journal entries\n- Restore inventory quantities\n- Update all financial reports\n\nAre you absolutely sure?')) {
        throw new Error('Cancelled');
      }

      setIsLoading(true);
      const billToDelete = bill || billId;
      
      console.log('🔴 STARTING BILL DELETION:', billToDelete);

      // CRITICAL: Get full bill data
      const fullBill = await base44.entities.Bill.get(billToDelete.id || billToDelete);
      console.log('📄 Full bill data:', fullBill);

      if (!fullBill) {
        throw new Error('Bill not found');
      }

      // STEP 1: Find and reverse ALL journal entries for this bill
      console.log('🔍 Searching for journal entries...');
      
      const allJournalEntries = await base44.entities.JournalEntry.filter({
        company_id: fullBill.company_id,
        status: 'posted'
      });

      const relatedEntries = allJournalEntries.filter(je => 
        je.source_id === fullBill.id || 
        je.reference?.includes(fullBill.bill_number) ||
        je.id === fullBill.journal_entry_id
      );

      console.log(`📊 Found ${relatedEntries.length} journal entries to reverse:`, relatedEntries.map(je => je.entry_number));

      // STEP 2: Reverse each journal entry's account balances and delete the JE using the helper
      for (const journalEntry of relatedEntries) {
        console.log(`🔄 Processing journal entry: ${journalEntry.entry_number}`);
        try {
          await deleteJournalEntryMutation.mutateAsync(journalEntry.id);
          console.log(`✅ Journal entry ${journalEntry.entry_number} reversed and deleted via helper.`);
        } catch (jeError) {
          console.error(`❌ Error reversing/deleting journal entry ${journalEntry.id} via helper:`, jeError);
          throw new Error(`Failed to reverse/delete journal entry: ${jeError.message}`);
        }
      }

      // STEP 3: Restore inventory quantities (reverse of purchase)
      if (fullBill.line_items && fullBill.line_items.length > 0) {
        console.log('📦 Reversing inventory quantities...');
        
        for (const item of fullBill.line_items) {
          if (item.product_id) {
            try {
              const product = await base44.entities.Product.get(item.product_id);
              if (product && product.product_type === 'inventory') {
                const currentQty = parseFloat(product.quantity_on_hand) || 0;
                const purchasedQty = parseFloat(item.quantity) || 0;
                const restoredQty = currentQty - purchasedQty; // Subtract because we're reversing a purchase

                await base44.entities.Product.update(item.product_id, {
                  quantity_on_hand: restoredQty
                });

                console.log(`📦 ${product.product_name}: ${currentQty} - ${purchasedQty} = ${restoredQty}`);
              }
            } catch (productError) {
              console.error(`❌ Error reversing product ${item.product_id}:`, productError);
            }
          }
        }
      }

      // STEP 4: Delete the bill record
      try {
        await base44.entities.Bill.delete(fullBill.id);
        console.log('🗑️ Bill record deleted');
      } catch (billDeleteError) {
        console.error('❌ Error deleting bill:', billDeleteError);
        throw new Error(`Failed to delete bill: ${billDeleteError.message}`);
      }

      console.log('✅✅✅ DELETION COMPLETE - ALL ACCOUNTS REVERSED ✅✅✅');
      return true;
    },
    onSuccess: () => {
      console.log('🔄 Invalidating queries to refresh all data...');
      queryClient.invalidateQueries(['bills']);
      queryClient.invalidateQueries(['accounts']);
      queryClient.invalidateQueries(['journal-entries']);
      queryClient.invalidateQueries(['products']);
      queryClient.invalidateQueries(['ledger-entries']);
      queryClient.invalidateQueries(['jobs']); // Invalidate jobs
      setIsLoading(false);
      alert('✅ Bill deleted successfully. All accounts have been reversed and reports updated.');
      onClose();
    },
    onError: (error) => {
      if (error.message !== 'Cancelled') {
        console.error('❌❌❌ DELETION FAILED:', error);
        alert(`❌ Error deleting bill: ${error.message}\n\nPlease contact support if this persists.`);
      }
      setIsLoading(false);
    }
  });

  const handleDelete = () => {
    if (!canPerformAction('delete')) { // Assuming delete action requires 'delete' permission
      alert('Your evaluation period has expired. Please upgrade to continue.');
      return;
    }
    deleteMutation.mutate();
  };

  const handleSubmit = () => {
    if (!canPerformAction('write')) {
      alert('Your evaluation period has expired. Please upgrade to continue.');
      return;
    }

    if (!formData.vendor_id) {
      alert('Please select a vendor');
      return;
    }

    if (!formData.ap_account_id) {
      alert('Please select an Accounts Payable account');
      return;
    }

    if (!formData.expense_account_id) {
      alert('Please select an Expense/COGS account');
      return;
    }

    if (formData.tax_total > 0 && !formData.tax_account_id) {
      alert('Please select a Tax Receivable/Input VAT account');
      return;
    }

    if (formData.line_items.length === 0) {
      alert('Please add at least one line item');
      return;
    }

    saveMutation.mutate(formData);
  };

  return (
    <Card className="fixed inset-4 z-50 overflow-auto bg-white shadow-2xl">
      <CardHeader className="border-b sticky top-0 bg-white z-10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">
            {billId || bill ? 'Edit Bill' : 'New Bill'}
          </CardTitle>
          <div className="flex gap-2">
            {(bill || billId) && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isLoading || deleteMutation.isLoading}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Bill
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Bill Header */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Vendor *</Label>
            <Select value={formData.vendor_id} onValueChange={handleVendorChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select vendor" />
              </SelectTrigger>
              <SelectContent>
                {vendors.map(vendor => (
                  <SelectItem key={vendor.id} value={vendor.id}>
                    {vendor.company_name}
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
                <SelectItem value={null}>No Job</SelectItem> {/* Changed null to "" for consistency with form data initial state */}
                {jobs.map(job => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.job_number} - {job.job_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Bill Number</Label>
            <Input
              value={formData.bill_number}
              onChange={(e) => setFormData(prev => ({ ...prev, bill_number: e.target.value }))}
              placeholder="BILL-001"
            />
          </div>

          <div className="space-y-2">
            <Label>Bill Date</Label>
            <Input
              type="date"
              value={formData.bill_date}
              onChange={(e) => setFormData(prev => ({ ...prev, bill_date: e.target.value }))}
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
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
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
              <Label>A/P Account *</Label>
              <Select value={formData.ap_account_id} onValueChange={(value) => setFormData(prev => ({ ...prev, ap_account_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select A/P account" />
                </SelectTrigger>
                <SelectContent>
                  {apAccounts.map(account => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.account_code} - {account.account_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Expense/COGS Account *</Label>
              <Select value={formData.expense_account_id} onValueChange={(value) => setFormData(prev => ({ ...prev, expense_account_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select expense account" />
                </SelectTrigger>
                <SelectContent>
                  {expenseAccounts.map(account => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.account_code} - {account.account_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Input Tax/VAT Receivable</Label>
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

        {/* Line Items */}
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
                    <Label>Unit Cost</Label>
                    <Input
                      type="number"
                      value={item.unit_cost}
                      onChange={(e) => updateLineItem(index, 'unit_cost', parseFloat(e.target.value) || 0)}
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
                  <div className="space-y-2 flex-1">
                    <Label>GL Account</Label>
                    <Select
                      value={item.gl_account_id}
                      onValueChange={(value) => updateLineItem(index, 'gl_account_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        {expenseAccounts.map(account => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.account_code} - {account.account_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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

                <div className="text-right">
                  <span className="text-sm text-gray-600">Line Total: </span>
                  <span className="font-semibold">
                    {(item.quantity * item.unit_cost * (1 + (item.tax_rate || 0) / 100)).toFixed(2)}
                  </span>
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
                <span className="font-semibold">{formData.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span className="font-semibold">{formData.tax_total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span>{formData.total_amount.toFixed(2)}</span>
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
          <Button onClick={handleSubmit} disabled={isLoading || saveMutation.isLoading}>
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Bill'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

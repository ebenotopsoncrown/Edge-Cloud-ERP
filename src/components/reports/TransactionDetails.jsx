
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { X, Save, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useCompany } from "../auth/CompanyContext";

export default function TransactionDetails({ entryId, onClose }) {
  const { currentCompany } = useCompany();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    entry_date: '',
    reference: '',
    description: '',
    line_items: []
  });

  const { data: entry, isLoading } = useQuery({
    queryKey: ['journal-entry', entryId],
    queryFn: () => base44.entities.JournalEntry.get(entryId),
    enabled: !!entryId
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.Account.filter({ company_id: currentCompany.id }) : [],
    enabled: !!currentCompany
  });

  useEffect(() => {
    if (entry) {
      setFormData({
        entry_date: entry.entry_date,
        reference: entry.reference || '',
        description: entry.description || '',
        line_items: entry.line_items || []
      });
    }
  }, [entry]);

  const saveJournalEntryMutation = useMutation({
    mutationFn: async (data) => {
      let oldEntry = null;

      if (entry) {
        // CRITICAL: Get old entry data before updating
        oldEntry = await base44.entities.JournalEntry.get(entryId);

        // Step 1: Reverse the old journal entry
        console.log('🔄 EDITING JOURNAL ENTRY - Reversing old entry and posting new one');
        console.log('📊 Step 1: Reversing old journal entry');

        if (oldEntry.line_items) {
          for (const line of oldEntry.line_items) {
            try {
              const account = await base44.entities.Account.get(line.account_id);
              if (account) {
                const currentBalance = parseFloat(account.balance) || 0;
                const lineDebit = parseFloat(line.debit) || 0;
                const lineCredit = parseFloat(line.credit) || 0;
                
                // Reverse using correct debit/credit rules
                const isDebitAccount = ['asset', 'expense', 'cost_of_goods_sold'].includes(account.account_type);
                let newBalance;
                
                if (isDebitAccount) {
                  newBalance = currentBalance - lineDebit + lineCredit;
                } else {
                  newBalance = currentBalance - lineCredit + lineDebit;
                }
                
                // CRITICAL FIX: Include company_id
                await base44.entities.Account.update(account.id, {
                  balance: newBalance,
                  company_id: account.company_id
                });
                
                console.log(`   Reversed ${account.account_name}: ${currentBalance} → ${newBalance}`);
              }
            } catch (error) {
              console.warn(`   ⚠️ Could not reverse account ${line.account_id}:`, error);
            }
          }
        }

        console.log('📊 Step 2: Posting new journal entry with updated accounts');
      }

      // Calculate totals
      const totalDebits = data.line_items.reduce((sum, line) => sum + (parseFloat(line.debit) || 0), 0);
      const totalCredits = data.line_items.reduce((sum, line) => sum + (parseFloat(line.credit) || 0), 0);

      // Validate balanced entry
      if (Math.abs(totalDebits - totalCredits) > 0.01) {
        throw new Error(`Journal entry must be balanced. Debits: ${totalDebits.toFixed(2)}, Credits: ${totalCredits.toFixed(2)}`);
      }

      // Update journal entry
      const updatedEntry = await base44.entities.JournalEntry.update(entryId, {
        ...data,
        total_debits: totalDebits,
        total_credits: totalCredits,
        status: 'posted'
      });

      // Post new amounts to accounts
      if (data.line_items) {
        for (const line of data.line_items) {
          try {
            const account = await base44.entities.Account.get(line.account_id);
            if (account) {
              const currentBalance = parseFloat(account.balance) || 0;
              const lineDebit = parseFloat(line.debit) || 0;
              const lineCredit = parseFloat(line.credit) || 0;
              
              // Apply correct debit/credit rules
              const isDebitAccount = ['asset', 'expense', 'cost_of_goods_sold'].includes(account.account_type);
              let newBalance;
              
              if (isDebitAccount) {
                newBalance = currentBalance + lineDebit - lineCredit;
              } else {
                newBalance = currentBalance + lineCredit - lineDebit;
              }
              
              // CRITICAL FIX: Include company_id
              await base44.entities.Account.update(account.id, {
                balance: newBalance,
                company_id: account.company_id
              });
              
              console.log(`   Posted to ${account.account_name}: ${currentBalance} → ${newBalance}`);
            }
          } catch (error) {
            console.warn(`   ⚠️ Could not update account ${line.account_id}:`, error);
          }
        }
      }

      console.log('✅ Journal entry updated successfully');
      return updatedEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['journal-entries']);
      queryClient.invalidateQueries(['journal-entry', entryId]);
      queryClient.invalidateQueries(['accounts']);
      queryClient.invalidateQueries(['ledger-entries']);
      setIsEditing(false);
    },
    onError: (error) => {
      console.error('Error saving journal entry:', error);
      alert('Error saving journal entry: ' + error.message);
    }
  });

  const handleLineItemChange = (index, field, value) => {
    const newLineItems = [...formData.line_items];
    newLineItems[index] = {
      ...newLineItems[index],
      [field]: value
    };

    // If account changed, update account name and code
    if (field === 'account_id') {
      const account = accounts.find(a => a.id === value);
      if (account) {
        newLineItems[index].account_name = account.account_name;
        newLineItems[index].account_code = account.account_code;
      }
    }

    setFormData({ ...formData, line_items: newLineItems });
  };

  const addLineItem = () => {
    setFormData({
      ...formData,
      line_items: [
        ...formData.line_items,
        { account_id: '', account_name: '', account_code: '', description: '', debit: 0, credit: 0 }
      ]
    });
  };

  const removeLineItem = (index) => {
    const newLineItems = formData.line_items.filter((_, i) => i !== index);
    setFormData({ ...formData, line_items: newLineItems });
  };

  const handleSave = () => {
    saveJournalEntryMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-full max-w-4xl">
          <CardContent className="p-12 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading transaction details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!entry) return null;

  const totalDebits = formData.line_items.reduce((sum, line) => sum + (parseFloat(line.debit) || 0), 0);
  const totalCredits = formData.line_items.reduce((sum, line) => sum + (parseFloat(line.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

  const canEdit = entry.source_type === 'manual' && entry.status !== 'void';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-5xl max-h-[90vh] overflow-auto">
        <CardHeader className="border-b sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Journal Entry Details</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Entry #{entry.entry_number} | {format(new Date(entry.entry_date), 'MMM d, yyyy')}
              </p>
            </div>
            <div className="flex gap-2">
              {canEdit && !isEditing && (
                <Button onClick={() => setIsEditing(true)} variant="outline">
                  Edit
                </Button>
              )}
              {isEditing && (
                <>
                  <Button 
                    onClick={handleSave} 
                    disabled={!isBalanced || saveJournalEntryMutation.isLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saveJournalEntryMutation.isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      entry_date: entry.entry_date,
                      reference: entry.reference || '',
                      description: entry.description || '',
                      line_items: entry.line_items || []
                    });
                  }} variant="outline">
                    Cancel
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
          {!canEdit && (
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <p className="text-sm text-yellow-800">
                ℹ️ This journal entry was auto-generated from a {entry.source_type} transaction and cannot be edited directly.
                To modify this entry, edit the source transaction.
              </p>
            </div>
          )}

          {isEditing ? (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={formData.entry_date}
                    onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Reference</Label>
                  <Input
                    value={formData.reference}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                    placeholder="Reference number"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Entry description"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Line Items</h3>
                  <Button size="sm" onClick={addLineItem} variant="outline">
                    Add Line
                  </Button>
                </div>

                {formData.line_items.map((line, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-start">
                    <div className="col-span-4">
                      <Select
                        value={line.account_id}
                        onValueChange={(value) => handleLineItemChange(index, 'account_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.map(account => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.account_code} - {account.account_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3">
                      <Input
                        placeholder="Description"
                        value={line.description}
                        onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        placeholder="Debit"
                        value={line.debit || ''}
                        onChange={(e) => handleLineItemChange(index, 'debit', parseFloat(e.target.value) || 0)}
                        className="text-right"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        placeholder="Credit"
                        value={line.credit || ''}
                        onChange={(e) => handleLineItemChange(index, 'credit', parseFloat(e.target.value) || 0)}
                        className="text-right"
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeLineItem(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                <div className="border-t pt-4">
                  <div className="flex justify-end gap-8 text-sm font-semibold">
                    <div>
                      Total Debits: <span className="text-green-600">${totalDebits.toFixed(2)}</span>
                    </div>
                    <div>
                      Total Credits: <span className="text-blue-600">${totalCredits.toFixed(2)}</span>
                    </div>
                    <div>
                      Difference: <span className={isBalanced ? 'text-green-600' : 'text-red-600'}>
                        ${Math.abs(totalDebits - totalCredits).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  {!isBalanced && (
                    <p className="text-red-600 text-sm text-right mt-2">
                      ⚠️ Entry must be balanced (Debits = Credits)
                    </p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-semibold">{format(new Date(entry.entry_date), 'MMM d, yyyy')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Reference</p>
                  <p className="font-semibold">{entry.reference || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${
                    entry.status === 'posted' ? 'bg-green-100 text-green-800' : 
                    entry.status === 'void' ? 'bg-red-100 text-red-800' : 
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {entry.status}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600">Description</p>
                <p className="font-semibold">{entry.description}</p>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Line Items</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account Code</TableHead>
                      <TableHead>Account Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entry.line_items?.map((line, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{line.account_code}</TableCell>
                        <TableCell>{line.account_name}</TableCell>
                        <TableCell>{line.description}</TableCell>
                        <TableCell className="text-right text-green-600 font-semibold">
                          {line.debit > 0 ? `$${line.debit.toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell className="text-right text-blue-600 font-semibold">
                          {line.credit > 0 ? `$${line.credit.toFixed(2)}` : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-gray-50 font-bold">
                      <TableCell colSpan={3}>Totals</TableCell>
                      <TableCell className="text-right text-green-600">
                        ${entry.total_debits?.toFixed(2) || '0.00'}
                      </TableCell>
                      <TableCell className="text-right text-blue-600">
                        ${entry.total_credits?.toFixed(2) || '0.00'}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

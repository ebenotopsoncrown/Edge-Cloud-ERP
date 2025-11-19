import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, FileText, Pencil, Eye, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useCompany } from "../components/auth/CompanyContext";
import TransactionDetails from "../components/reports/TransactionDetails";

const statusColors = {
  draft: "bg-gray-100 text-gray-800",
  posted: "bg-green-100 text-green-800",
  void: "bg-red-100 text-red-800"
};

export default function JournalEntries() {
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [selectedEntryId, setSelectedEntryId] = useState(null);
  const { currentCompany } = useCompany();
  const queryClient = useQueryClient();

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['journal-entries', currentCompany?.id],
    queryFn: () => currentCompany 
      ? base44.entities.JournalEntry.filter({ company_id: currentCompany.id }, '-entry_date')
      : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const deleteJournalEntryMutation = useMutation({
    mutationFn: async (entry) => {
      if (!window.confirm(
        `⚠️ DELETE JOURNAL ENTRY?\n\n` +
        `Entry: ${entry.entry_number}\n` +
        `Date: ${format(new Date(entry.entry_date), 'MMM d, yyyy')}\n` +
        `Reference: ${entry.reference || 'N/A'}\n\n` +
        `This will:\n` +
        `- Delete the journal entry permanently\n` +
        `- Reverse all account balances\n` +
        `- Update financial reports\n\n` +
        `Are you sure?`
      )) {
        throw new Error('Cancelled');
      }

      console.log('🗑️ Deleting journal entry:', entry.id);

      // Reverse account balances
      if (entry.line_items && entry.line_items.length > 0) {
        for (const line of entry.line_items) {
          try {
            const account = await base44.entities.Account.get(line.account_id);
            if (account) {
              const currentBalance = parseFloat(account.balance) || 0;
              const lineDebit = parseFloat(line.debit) || 0;
              const lineCredit = parseFloat(line.credit) || 0;
              
              // Reverse the posting
              const newBalance = currentBalance - lineDebit - lineCredit;
              
              await base44.entities.Account.update(account.id, {
                balance: newBalance
              });
              
              console.log(`✅ Reversed ${account.account_name}: ${currentBalance.toFixed(2)} → ${newBalance.toFixed(2)}`);
            }
          } catch (accError) {
            console.error('Error reversing account:', accError);
          }
        }
      }

      // Delete the journal entry
      await base44.entities.JournalEntry.delete(entry.id);
      console.log('✅ Journal entry deleted');
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['journal-entries']);
      queryClient.invalidateQueries(['accounts']);
      queryClient.invalidateQueries(['ledger-entries']);
      alert('✅ Journal entry deleted successfully!');
    },
    onError: (error) => {
      if (error.message !== 'Cancelled') {
        console.error('Error deleting journal entry:', error);
        alert(`❌ Error deleting journal entry: ${error.message}`);
      }
    }
  });

  const handleViewDetails = (entry) => {
    setSelectedEntryId(entry.id);
  };

  const handleDelete = (entry, event) => {
    event.stopPropagation(); // Prevent row click from opening details
    deleteJournalEntryMutation.mutate(entry);
  };

  return (
    <div className="p-6 space-y-6">
      {selectedEntryId && (
        <TransactionDetails
          entryId={selectedEntryId}
          onClose={() => setSelectedEntryId(null)}
        />
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Journal Entries</h1>
          <p className="text-gray-500 mt-1">Record manual accounting transactions</p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Entry
        </Button>
      </div>

      <Card className="p-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entry #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Total Debits</TableHead>
                <TableHead className="text-right">Total Credits</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    Loading entries...
                  </TableCell>
                </TableRow>
              ) : entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No journal entries found for {currentCompany?.company_name}</p>
                    <p className="text-sm text-gray-400 mt-2">Journal entries are automatically created when you post invoices, bills, and payments</p>
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => (
                  <TableRow 
                    key={entry.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleViewDetails(entry)}
                  >
                    <TableCell className="font-medium">{entry.entry_number}</TableCell>
                    <TableCell>{format(new Date(entry.entry_date), 'MMM d, yyyy')}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{entry.description}</p>
                        {entry.reference && (
                          <p className="text-xs text-gray-500">Ref: {entry.reference}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-green-600">
                      ${entry.total_debits?.toFixed(2) || '0.00'}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-blue-600">
                      ${entry.total_credits?.toFixed(2) || '0.00'}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[entry.status]}>
                        {entry.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {entry.source_type && (
                        <Badge variant="outline" className="text-xs capitalize">
                          {entry.source_type.replace(/_/g, ' ')}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(entry);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={(e) => handleDelete(entry, e)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
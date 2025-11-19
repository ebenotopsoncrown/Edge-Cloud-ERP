
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { X, Printer, Calendar, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { useCompany } from "../auth/CompanyContext";
import TransactionDetails from "./TransactionDetails";
import InvoiceForm from "../invoices/InvoiceForm";
import BillForm from "../bills/BillForm";

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

export default function AccountLedger({ account, onClose, onTransactionClick }) {
  const { currentCompany } = useCompany();
  const [selectedEntryId, setSelectedEntryId] = useState(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [selectedBillId, setSelectedBillId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dateFilter, setDateFilter] = useState({
    from: '',
    to: ''
  });
  
  // CRITICAL: Get base currency
  const baseCurrency = currentCompany?.base_currency || 'USD';
  const currencySymbol = getCurrencySymbol(baseCurrency);

  const { data: journalEntries = [], isLoading, refetch } = useQuery({
    queryKey: ['ledger-entries', account?.id, currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany || !account) return [];
      
      console.log(`🔍 Fetching ledger entries for account: ${account.account_name} (${account.account_code})`);
      
      // Fetch ALL posted journal entries for this company
      const allEntries = await base44.entities.JournalEntry.filter({
        company_id: currentCompany.id,
        status: 'posted'
      }, '-entry_date');

      console.log(`📊 Total posted entries in system: ${allEntries.length}`);

      // Filter to only entries that affect this account
      const relevantEntries = allEntries.filter(entry => {
        return entry.line_items?.some(line => line.account_id === account.id);
      });

      console.log(`🎯 Entries affecting ${account.account_name}: ${relevantEntries.length}`);
      
      return relevantEntries;
    },
    enabled: !!currentCompany && !!account,
    // CRITICAL: Better caching to avoid rate limits
    staleTime: 30 * 1000, // 30 seconds - fresh enough for ledger
    cacheTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
    // Only refetch when explicitly requested
    refetchOnMount: false
  });

  // Force refresh when account changes
  useEffect(() => {
    if (account) {
      console.log(`🔄 Account changed to: ${account.account_name}, refreshing ledger...`);
      refetch();
    }
  }, [account?.id, refetch]);

  // Filter by date if set
  const filteredEntries = journalEntries.filter(entry => {
    if (dateFilter.from && entry.entry_date < dateFilter.from) return false;
    if (dateFilter.to && entry.entry_date > dateFilter.to) return false;
    return true;
  });

  // CRITICAL FIX: Calculate running balance CORRECTLY
  let runningBalance = 0; // Start from 0 (beginning balance)
  const transactionsWithBalance = filteredEntries.map(entry => {
    const relevantLines = entry.line_items?.filter(line => line.account_id === account.id) || [];
    
    const debitAmount = relevantLines.reduce((sum, line) => sum + (parseFloat(line.debit) || 0), 0);
    const creditAmount = relevantLines.reduce((sum, line) => sum + (parseFloat(line.credit) || 0), 0);

    // CRITICAL: Apply correct debit/credit rules
    const isDebitAccount = ['asset', 'expense', 'cost_of_goods_sold'].includes(account.account_type);
    
    if (isDebitAccount) {
      // Assets & Expenses: Debit increases, Credit decreases
      runningBalance = runningBalance + debitAmount - creditAmount;
    } else {
      // Liabilities, Equity, Revenue: Credit increases, Debit decreases
      runningBalance = runningBalance + creditAmount - debitAmount;
    }

    console.log(`Transaction ${entry.entry_number}: DR=${debitAmount}, CR=${creditAmount}, Balance=${runningBalance}`);

    return {
      ...entry,
      debitAmount,
      creditAmount,
      balance: runningBalance
    };
  });

  const handleTransactionClick = async (entry) => {
    if (isProcessing) return; // Prevent double-clicks
    
    setIsProcessing(true);
    console.log('🔵 Transaction clicked:', entry);
    console.log('Source type:', entry.source_type);
    console.log('Source ID:', entry.source_id);
    console.log('Entry ID:', entry.id);
    
    try {
      // CRITICAL: Drill-down to source transaction
      if (entry.source_type === 'invoice' && entry.source_id) {
        console.log('Attempting to open invoice:', entry.source_id);
        
        try {
          const invoice = await base44.entities.Invoice.get(entry.source_id);
          console.log('✅ Invoice found:', invoice);
          setSelectedInvoiceId(entry.source_id);
        } catch (error) {
          console.error('❌ Invoice not found:', error);
          const shouldDelete = await handleOrphanedEntry(entry, 'invoice');
          if (shouldDelete) {
            refetch();
          }
        }
      } else if (entry.source_type === 'bill' && entry.source_id) {
        console.log('Attempting to open bill:', entry.source_id);
        
        try {
          const bill = await base44.entities.Bill.get(entry.source_id);
          console.log('✅ Bill found:', bill);
          setSelectedBillId(entry.source_id);
        } catch (error) {
          console.error('❌ Bill not found:', error);
          const shouldDelete = await handleOrphanedEntry(entry, 'bill');
          if (shouldDelete) {
            refetch();
          }
        }
      } else if (entry.source_type === 'payment' && entry.source_id) {
        alert('💡 Payment drill-down coming soon!\n\nYou can view payment details on the Payments page.');
      } else {
        console.log('Opening journal entry details:', entry.id);
        setSelectedEntryId(entry.id);
      }
    } catch (error) {
      console.error('❌ Error handling transaction click:', error);
      alert(`Error opening transaction: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOrphanedEntry = async (entry, sourceType) => {
    return new Promise((resolve) => {
      const confirmDelete = window.confirm(
        `⚠️ ORPHANED JOURNAL ENTRY DETECTED\n\n` +
        `This journal entry references a ${sourceType} that has been deleted.\n\n` +
        `Journal Entry: ${entry.entry_number}\n` +
        `Reference: ${entry.reference}\n` +
        `Date: ${format(new Date(entry.entry_date), 'MMM d, yyyy')}\n\n` +
        `Would you like to delete this orphaned journal entry?\n\n` +
        `Click OK to delete, or Cancel to keep it.`
      );

      if (confirmDelete) {
        (async () => {
          try {
            console.log('🗑️ Deleting orphaned journal entry:', entry.id);
            
            // Reverse the journal entry's effect on accounts
            if (entry.line_items && entry.line_items.length > 0) {
              for (const line of entry.line_items) {
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
                    
                    await base44.entities.Account.update(account.id, {
                      balance: newBalance
                    });
                    
                    console.log(`✅ Reversed ${account.account_name}: ${currentBalance} → ${newBalance}`);
                  }
                } catch (accError) {
                  console.error('Error reversing account:', accError);
                }
              }
            }
            
            // Delete the journal entry
            await base44.entities.JournalEntry.delete(entry.id);
            console.log('✅ Orphaned journal entry deleted');
            
            alert('✅ Orphaned journal entry deleted successfully!\n\nThe ledger will now refresh.');
            resolve(true);
          } catch (deleteError) {
            console.error('Error deleting orphaned entry:', deleteError);
            alert(`❌ Error deleting journal entry: ${deleteError.message}`);
            resolve(false);
          }
        })();
      } else {
        alert('ℹ️ Journal entry kept.\n\nTo manually delete it later, go to:\nAccounting → Journal Entries → Find the entry → Delete');
        resolve(false);
      }
    });
  };

  // The handlePrint function is removed as window.print() is called directly in JSX

  return (
    <>
      {selectedEntryId && (
        <TransactionDetails
          entryId={selectedEntryId}
          onClose={() => {
            setSelectedEntryId(null);
            refetch();
          }}
        />
      )}

      {selectedInvoiceId && (
        <InvoiceForm
          invoiceId={selectedInvoiceId}
          onClose={() => {
            console.log('Invoice form closed, refreshing...');
            setSelectedInvoiceId(null);
            refetch();
            // Force reload to ensure all data is fresh
            setTimeout(() => {
              window.location.reload();
            }, 500);
          }}
        />
      )}

      {selectedBillId && (
        <BillForm
          billId={selectedBillId}
          onClose={() => {
            console.log('Bill form closed, refreshing...');
            setSelectedBillId(null);
            refetch();
            // Force reload to ensure all data is fresh
            setTimeout(() => {
              window.location.reload();
            }, 500);
          }}
        />
      )}

      <Card className="fixed inset-4 z-50 overflow-auto bg-white shadow-2xl print:fixed print:inset-0 print:shadow-none">
        <CardHeader className="border-b print:border-b-2 print:border-black sticky top-0 bg-white z-10 print:static">
          <div className="flex items-center justify-between print:block">
            <div>
              <CardTitle className="text-2xl print:text-xl">{currentCompany?.company_name}</CardTitle>
              <h3 className="text-lg font-semibold text-gray-700 mt-1">
                General Ledger - {account?.account_name}
              </h3>
              <p className="text-sm text-gray-600">
                For the Period From {format(new Date(new Date().getFullYear(), 0, 1), 'MMM d, yyyy')} to {format(new Date(), 'MMM d, yyyy')}
              </p>
              <p className="text-xs text-blue-600 font-semibold mt-1">
                Account: {account?.account_code} - {account?.account_name} ({account?.account_type?.toUpperCase()})
              </p>
              <p className="text-xs text-green-600 font-semibold mt-1">
                ✅ Showing {filteredEntries.length} transaction(s) | Ending Balance: {currencySymbol}{Math.abs(runningBalance).toLocaleString(undefined, {minimumFractionDigits: 2})}
              </p>
            </div>
            <div className="flex gap-2 print:hidden">
              <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
                🔄 {isLoading ? 'Loading...' : 'Refresh'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Date Filter */}
          <div className="grid grid-cols-2 gap-4 mt-4 print:hidden">
            <div className="space-y-2">
              <Label>From Date</Label>
              <Input
                type="date"
                value={dateFilter.from}
                onChange={(e) => setDateFilter(prev => ({ ...prev, from: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>To Date</Label>
              <Input
                type="date"
                value={dateFilter.to}
                onChange={(e) => setDateFilter(prev => ({ ...prev, to: e.target.value }))}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-gray-500">
              <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              Loading transactions...
            </div>
          ) : transactionsWithBalance.length === 0 ? (
            <div className="p-12 text-center text-gray-500 print:hidden">
              <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="font-semibold">No transactions found for this account</p>
              <p className="text-sm mt-2">Transactions will appear here once you post invoices, bills, or journal entries</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="print:border-b-2 print:border-black">
                  <TableHead className="text-xs font-bold uppercase print:text-[10px] print:py-1">Date</TableHead>
                  <TableHead className="text-xs font-bold uppercase print:text-[10px] print:py-1">Reference</TableHead>
                  <TableHead className="text-xs font-bold uppercase print:text-[10px] print:py-1 print:hidden">Source</TableHead>
                  <TableHead className="text-xs font-bold uppercase print:text-[10px] print:py-1">Description</TableHead>
                  <TableHead className="text-right text-xs font-bold uppercase print:text-[10px] print:py-1">Debit</TableHead>
                  <TableHead className="text-right text-xs font-bold uppercase print:text-[10px] print:py-1">Credit</TableHead>
                  <TableHead className="text-right text-xs font-bold uppercase print:text-[10px] print:py-1">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Beginning Balance */}
                <TableRow className="bg-gray-50 font-semibold print:bg-transparent">
                  <TableCell colSpan={4} className="print:text-[10px]">Beginning Balance</TableCell>
                  <TableCell className="text-right print:text-[10px]">-</TableCell>
                  <TableCell className="text-right print:text-[10px]">-</TableCell>
                  <TableCell className="text-right print:text-[10px]">0.00</TableCell>
                </TableRow>

                {transactionsWithBalance.map((entry) => (
                  <TableRow 
                    key={entry.id} 
                    className="cursor-pointer hover:bg-blue-50 transition-colors print:cursor-default print:hover:bg-transparent print:break-inside-avoid"
                    onClick={() => !isProcessing && handleTransactionClick(entry)}
                    title="Click to view/edit source transaction"
                  >
                    <TableCell className="text-sm whitespace-nowrap print:text-[10px] print:py-1">
                      {format(new Date(entry.entry_date), 'MM/dd/yy')}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline print:text-[10px] print:text-black print:no-underline print:py-1">
                      {entry.entry_number || entry.reference}
                    </TableCell>
                    <TableCell className="text-sm print:hidden print:py-1">
                      {entry.source_type && (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800 uppercase">
                          {entry.source_type === 'invoice' ? 'INV' : 
                           entry.source_type === 'bill' ? 'BILL' : 
                           entry.source_type === 'payment' ? 'PMT' : 
                           'JE'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm print:text-[10px] print:py-1">
                      <div>
                        <p className="font-medium text-gray-900">{entry.description}</p>
                        {entry.reference && entry.reference !== entry.entry_number && (
                          <p className="text-xs text-gray-500">({entry.reference})</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-right font-mono font-semibold text-green-600 print:text-[10px] print:text-black print:py-1">
                      {entry.debitAmount > 0 ? `${currencySymbol}${entry.debitAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}` : '-'}
                    </TableCell>
                    <TableCell className="text-sm text-right font-mono font-semibold text-blue-600 print:text-[10px] print:text-black print:py-1">
                      {entry.creditAmount > 0 ? `${currencySymbol}${entry.creditAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}` : '-'}
                    </TableCell>
                    <TableCell className="text-sm text-right font-mono font-semibold text-gray-900 print:text-[10px] print:py-1">
                      {currencySymbol}{Math.abs(entry.balance).toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </TableCell>
                  </TableRow>
                ))}

                {/* Ending Balance */}
                <TableRow className="bg-gray-100 font-bold border-t-2 border-gray-300 print:border-t-2 print:border-black print:bg-transparent">
                  <TableCell colSpan={4} className="print:text-[10px]">Ending Balance</TableCell>
                  <TableCell className="text-right print:text-[10px]">-</TableCell>
                  <TableCell className="text-right print:text-[10px]">-</TableCell>
                  <TableCell className="text-right text-lg print:text-[10px]">
                    {currencySymbol}{Math.abs(runningBalance).toLocaleString(undefined, {minimumFractionDigits: 2})}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}

          <div className="p-4 border-t bg-gray-50 print:hidden">
            <div className="flex items-start gap-2 text-blue-600 mb-2">
              <AlertCircle className="w-4 h-4 mt-0.5" />
              <p className="text-xs font-semibold">
                💡 Click on any transaction row to view or edit the source document (invoice, bill, or journal entry)
              </p>
            </div>
            <p className="text-xs text-gray-600 italic">
              * Filter Criteria: {dateFilter.from || 'all dates'} to {dateFilter.to || 'today'}. 
              Report printed in Detail Format.
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

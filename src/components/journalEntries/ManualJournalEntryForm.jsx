import React, { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Plus, Save, Trash2 } from "lucide-react";
import { Account, JournalEntry } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCompany } from "../auth/CompanyContext";
import { getCurrencySymbol } from "../shared/FinancialCalculations";
import { buildManualJournalEntry, getBalanceChanges, getTotals, validateManualJournal } from "./manualJournal";

export default function ManualJournalEntryForm({ onClose }) {
  const { currentCompany, canPerformAction, user } = useCompany();
  const queryClient = useQueryClient();
  const nextLineId = useRef(3);
  const emptyLine = (id) => ({ id, account_id: '', description: '', debit: '', credit: '' });

  const [entryDate, setEntryDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [reference, setReference] = useState('');
  const [memo, setMemo] = useState('');
  const [lines, setLines] = useState([emptyLine(1), emptyLine(2)]);
  const [errors, setErrors] = useState([]);

  const symbol = getCurrencySymbol(currentCompany?.base_currency || 'USD');

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts', currentCompany?.id],
    queryFn: () => Account.list({ filters: { company_id: currentCompany.id } }),
    enabled: !!currentCompany,
  });

  const activeAccounts = useMemo(
    () => accounts
      .filter((account) => account.is_active !== false)
      .sort((a, b) => String(a.account_code).localeCompare(String(b.account_code))),
    [accounts],
  );

  const updateLine = (id, changes) =>
    setLines((current) => current.map((line) => (line.id === id ? { ...line, ...changes } : line)));

  const addLine = () => setLines((current) => [...current, emptyLine(nextLineId.current++)]);

  const removeLine = (id) => setLines((current) => current.filter((line) => line.id !== id));

  const saveMutation = useMutation({
    mutationFn: async () => {
      const entry = buildManualJournalEntry({
        companyId: currentCompany.id,
        entry_date: entryDate,
        reference,
        description: memo,
        lines,
        accounts,
        postedBy: user?.email,
      });

      const saved = await JournalEntry.create(entry);

      // Reports read the journal itself, so from here the entry is already posted.
      // A failure below must not invite a resubmit, which would post it twice.
      let balancesUpdated = true;
      for (const [accountId, change] of getBalanceChanges(entry.line_items, accounts)) {
        try {
          const account = await Account.get(accountId);
          await Account.update(accountId, {
            balance: (parseFloat(account.balance) || 0) + change,
            company_id: account.company_id,
          });
        } catch (error) {
          console.error(`Could not update balance for account ${accountId}:`, error);
          balancesUpdated = false;
        }
      }
      return { saved, balancesUpdated };
    },
    onSuccess: ({ saved, balancesUpdated }) => {
      queryClient.invalidateQueries();
      if (!balancesUpdated) {
        alert(`Journal ${saved.entry_number} was posted and is in your reports, but the stored balance on one or more accounts could not be updated. Do not enter it again.`);
      }
      onClose();
    },
    onError: (error) => setErrors([`The journal was not saved: ${error.message}`]),
  });

  const handleSubmit = () => {
    if (!canPerformAction('write')) {
      setErrors(['Your evaluation period has expired. Please upgrade to continue.']);
      return;
    }
    const problems = validateManualJournal({ entry_date: entryDate, description: memo, lines });
    setErrors(problems);
    if (problems.length === 0) saveMutation.mutate();
  };

  const totals = getTotals(lines);
  const difference = Math.abs(totals.debit - totals.credit);
  const money = (cents) => `${symbol}${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !saveMutation.isPending) onClose(); }}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Journal Entry</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mje-date">Date *</Label>
              <Input id="mje-date" type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mje-reference">Reference</Label>
              <Input id="mje-reference" value={reference} onChange={(e) => setReference(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mje-memo">Memo *</Label>
              <Input id="mje-memo" value={memo} onChange={(e) => setMemo(e.target.value)} />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: 720 }}>
              <thead>
                <tr className="text-left text-gray-600 border-b">
                  <th className="py-2 pr-2 font-semibold" style={{ width: '32%' }}>Account</th>
                  <th className="py-2 pr-2 font-semibold">Description</th>
                  <th className="py-2 pr-2 font-semibold text-right" style={{ width: 130 }}>Debit</th>
                  <th className="py-2 pr-2 font-semibold text-right" style={{ width: 130 }}>Credit</th>
                  <th style={{ width: 40 }} />
                </tr>
              </thead>
              <tbody>
                {lines.map((line, index) => (
                  <tr key={line.id} className="border-b">
                    <td className="py-2 pr-2">
                      <Select value={line.account_id} onValueChange={(value) => updateLine(line.id, { account_id: value })}>
                        <SelectTrigger aria-label={`Line ${index + 1} account`}>
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                        <SelectContent>
                          {activeAccounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.account_code} - {account.account_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-2 pr-2">
                      <Input
                        aria-label={`Line ${index + 1} description`}
                        value={line.description}
                        onChange={(e) => updateLine(line.id, { description: e.target.value })}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <Input
                        aria-label={`Line ${index + 1} debit`}
                        type="number"
                        min="0"
                        step="0.01"
                        className="text-right"
                        value={line.debit}
                        onChange={(e) => updateLine(line.id, { debit: e.target.value, credit: e.target.value ? '' : line.credit })}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <Input
                        aria-label={`Line ${index + 1} credit`}
                        type="number"
                        min="0"
                        step="0.01"
                        className="text-right"
                        value={line.credit}
                        onChange={(e) => updateLine(line.id, { credit: e.target.value, debit: e.target.value ? '' : line.debit })}
                      />
                    </td>
                    <td className="py-2 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove line ${index + 1}`}
                        disabled={lines.length <= 2}
                        onClick={() => removeLine(line.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-semibold">
                  <td className="py-3 pr-2" colSpan={2}>
                    <Button type="button" variant="outline" size="sm" onClick={addLine}>
                      <Plus className="w-4 h-4 mr-1" />
                      Add line
                    </Button>
                  </td>
                  <td className="py-3 pr-2 text-right font-mono" data-testid="total-debits">{money(totals.debit)}</td>
                  <td className="py-3 pr-2 text-right font-mono" data-testid="total-credits">{money(totals.credit)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>

          {difference > 0 && (
            <p className="text-sm text-right text-red-600">Out of balance by {money(difference)}</p>
          )}

          {errors.length > 0 && (
            <div role="alert" className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-900">
              <ul className="list-disc ml-5 space-y-1">
                {errors.map((error) => <li key={error}>{error}</li>)}
              </ul>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={saveMutation.isPending}>Cancel</Button>
            <Button type="button" onClick={handleSubmit} disabled={saveMutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {saveMutation.isPending ? 'Posting…' : 'Post Journal'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

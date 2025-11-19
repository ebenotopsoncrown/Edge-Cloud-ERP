import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, TrendingDown, RefreshCw, Save, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { useCompany } from "../components/auth/CompanyContext";

export default function FXRevaluation() {
  const { currentCompany, user } = useCompany();
  const queryClient = useQueryClient();
  const [revaluationDate, setRevaluationDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [revaluationResults, setRevaluationResults] = useState(null);

  const { data: exchangeRates = [] } = useQuery({
    queryKey: ['exchange-rates', currentCompany?.id],
    queryFn: () => currentCompany 
      ? base44.entities.ExchangeRate.filter({ company_id: currentCompany.id }, '-effective_date') 
      : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts', currentCompany?.id],
    queryFn: () => currentCompany 
      ? base44.entities.Account.filter({ company_id: currentCompany.id }) 
      : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices', currentCompany?.id],
    queryFn: () => currentCompany 
      ? base44.entities.Invoice.filter({ company_id: currentCompany.id }) 
      : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const { data: bills = [] } = useQuery({
    queryKey: ['bills', currentCompany?.id],
    queryFn: () => currentCompany 
      ? base44.entities.Bill.filter({ company_id: currentCompany.id }) 
      : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const calculateRevaluation = () => {
    const baseCurrency = currentCompany?.base_currency || 'USD';
    const results = [];

    // Get foreign currency invoices that are not fully paid
    const foreignInvoices = invoices.filter(inv => 
      inv.currency !== baseCurrency && 
      inv.balance_due > 0
    );

    // Get foreign currency bills that are not fully paid
    const foreignBills = bills.filter(bill => 
      bill.currency !== baseCurrency && 
      bill.balance_due > 0
    );

    // Calculate FX gain/loss for invoices
    foreignInvoices.forEach(invoice => {
      const latestRate = exchangeRates
        .filter(r => 
          r.from_currency === baseCurrency &&
          r.to_currency === invoice.currency &&
          new Date(r.effective_date) <= new Date(revaluationDate)
        )
        .sort((a, b) => new Date(b.effective_date) - new Date(a.effective_date))[0];

      if (latestRate) {
        const currentValueBase = invoice.balance_due / latestRate.exchange_rate;
        const originalValueBase = invoice.balance_due_base_currency || (invoice.balance_due / invoice.exchange_rate);
        const fxGainLoss = currentValueBase - originalValueBase;

        if (Math.abs(fxGainLoss) > 0.01) {
          results.push({
            type: 'Invoice',
            document_number: invoice.invoice_number,
            customer_vendor: invoice.customer_name,
            currency: invoice.currency,
            balance_foreign: invoice.balance_due,
            original_rate: invoice.exchange_rate,
            current_rate: latestRate.exchange_rate,
            original_value_base: originalValueBase,
            current_value_base: currentValueBase,
            fx_gain_loss: fxGainLoss,
            is_gain: fxGainLoss > 0
          });
        }
      }
    });

    // Calculate FX gain/loss for bills
    foreignBills.forEach(bill => {
      const latestRate = exchangeRates
        .filter(r => 
          r.from_currency === baseCurrency &&
          r.to_currency === bill.currency &&
          new Date(r.effective_date) <= new Date(revaluationDate)
        )
        .sort((a, b) => new Date(b.effective_date) - new Date(a.effective_date))[0];

      if (latestRate) {
        const currentValueBase = bill.balance_due / latestRate.exchange_rate;
        const originalValueBase = bill.balance_due_base_currency || (bill.balance_due / bill.exchange_rate);
        const fxGainLoss = originalValueBase - currentValueBase; // Reversed for bills

        if (Math.abs(fxGainLoss) > 0.01) {
          results.push({
            type: 'Bill',
            document_number: bill.bill_number,
            customer_vendor: bill.vendor_name,
            currency: bill.currency,
            balance_foreign: bill.balance_due,
            original_rate: bill.exchange_rate,
            current_rate: latestRate.exchange_rate,
            original_value_base: originalValueBase,
            current_value_base: currentValueBase,
            fx_gain_loss: fxGainLoss,
            is_gain: fxGainLoss > 0
          });
        }
      }
    });

    setRevaluationResults({
      items: results,
      total_gain: results.filter(r => r.is_gain).reduce((sum, r) => sum + r.fx_gain_loss, 0),
      total_loss: results.filter(r => !r.is_gain).reduce((sum, r) => sum + Math.abs(r.fx_gain_loss), 0),
      net_fx: results.reduce((sum, r) => sum + r.fx_gain_loss, 0)
    });
  };

  const postRevaluationMutation = useMutation({
    mutationFn: async () => {
      if (!revaluationResults || revaluationResults.items.length === 0) {
        throw new Error('No revaluation adjustments to post');
      }

      // Find or create FX Gain/Loss account
      let fxAccount = accounts.find(a => 
        a.account_name?.toLowerCase().includes('foreign exchange') ||
        a.account_name?.toLowerCase().includes('fx gain') ||
        a.account_name?.toLowerCase().includes('fx loss')
      );

      if (!fxAccount) {
        fxAccount = await base44.entities.Account.create({
          company_id: currentCompany.id,
          account_code: '7000',
          account_name: 'Foreign Exchange Gain/Loss',
          account_type: 'expense',
          account_category: 'other_expense',
          description: 'Unrealized FX gains and losses',
          balance: 0,
          is_active: true
        });
      }

      // Find AR and AP accounts
      const arAccount = accounts.find(a => 
        a.account_type === 'asset' && 
        a.account_name?.toLowerCase().includes('receivable')
      );

      const apAccount = accounts.find(a => 
        a.account_type === 'liability' && 
        a.account_name?.toLowerCase().includes('payable')
      );

      const journalLineItems = [];

      // Group by AR and AP
      const arAdjustment = revaluationResults.items
        .filter(r => r.type === 'Invoice')
        .reduce((sum, r) => sum + r.fx_gain_loss, 0);

      const apAdjustment = revaluationResults.items
        .filter(r => r.type === 'Bill')
        .reduce((sum, r) => sum + r.fx_gain_loss, 0);

      if (arAdjustment !== 0 && arAccount) {
        if (arAdjustment > 0) {
          // AR increases (debit AR, credit FX Gain)
          journalLineItems.push({
            account_id: arAccount.id,
            account_name: arAccount.account_name,
            account_code: arAccount.account_code,
            description: 'FX revaluation adjustment - AR',
            debit: arAdjustment,
            credit: 0
          });
          journalLineItems.push({
            account_id: fxAccount.id,
            account_name: fxAccount.account_name,
            account_code: fxAccount.account_code,
            description: 'Unrealized FX gain on receivables',
            debit: 0,
            credit: arAdjustment
          });
        } else {
          // AR decreases (credit AR, debit FX Loss)
          journalLineItems.push({
            account_id: fxAccount.id,
            account_name: fxAccount.account_name,
            account_code: fxAccount.account_code,
            description: 'Unrealized FX loss on receivables',
            debit: Math.abs(arAdjustment),
            credit: 0
          });
          journalLineItems.push({
            account_id: arAccount.id,
            account_name: arAccount.account_name,
            account_code: arAccount.account_code,
            description: 'FX revaluation adjustment - AR',
            debit: 0,
            credit: Math.abs(arAdjustment)
          });
        }
      }

      if (apAdjustment !== 0 && apAccount) {
        if (apAdjustment > 0) {
          // AP decreases (debit AP, credit FX Gain)
          journalLineItems.push({
            account_id: apAccount.id,
            account_name: apAccount.account_name,
            account_code: apAccount.account_code,
            description: 'FX revaluation adjustment - AP',
            debit: apAdjustment,
            credit: 0
          });
          journalLineItems.push({
            account_id: fxAccount.id,
            account_name: fxAccount.account_name,
            account_code: fxAccount.account_code,
            description: 'Unrealized FX gain on payables',
            debit: 0,
            credit: apAdjustment
          });
        } else {
          // AP increases (credit AP, debit FX Loss)
          journalLineItems.push({
            account_id: fxAccount.id,
            account_name: fxAccount.account_name,
            account_code: fxAccount.account_code,
            description: 'Unrealized FX loss on payables',
            debit: Math.abs(apAdjustment),
            credit: 0
          });
          journalLineItems.push({
            account_id: apAccount.id,
            account_name: apAccount.account_name,
            account_code: apAccount.account_code,
            description: 'FX revaluation adjustment - AP',
            debit: 0,
            credit: Math.abs(apAdjustment)
          });
        }
      }

      const totalDebits = journalLineItems.reduce((sum, l) => sum + l.debit, 0);
      const totalCredits = journalLineItems.reduce((sum, l) => sum + l.credit, 0);

      const journalEntry = await base44.entities.JournalEntry.create({
        company_id: currentCompany.id,
        entry_number: `JE-FX-${Date.now()}`,
        entry_date: revaluationDate,
        reference: 'FX Revaluation',
        source_type: 'manual',
        description: `FX Revaluation as of ${format(new Date(revaluationDate), 'MMM d, yyyy')}`,
        status: 'posted',
        line_items: journalLineItems,
        total_debits: totalDebits,
        total_credits: totalCredits,
        posted_by: user?.email || 'system',
        posted_date: new Date().toISOString()
      });

      // Update account balances
      for (const line of journalLineItems) {
        const account = accounts.find(a => a.id === line.account_id);
        if (account) {
          let newBalance = parseFloat(account.balance) || 0;
          if (['asset', 'expense'].includes(account.account_type)) {
            newBalance += (line.debit - line.credit);
          } else {
            newBalance += (line.credit - line.debit);
          }
          await base44.entities.Account.update(account.id, { balance: newBalance });
        }
      }

      return journalEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['accounts']);
      queryClient.invalidateQueries(['journal-entries']);
      alert('FX Revaluation posted successfully!');
      setRevaluationResults(null);
    }
  });

  const baseCurrency = currentCompany?.base_currency || 'USD';

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">FX Revaluation</h1>
        <p className="text-gray-500 mt-1">
          Revalue foreign currency balances to reflect unrealized gains/losses
        </p>
      </div>

      <Alert className="bg-blue-50 border-blue-200">
        <TrendingUp className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900">
          <strong>FX Revaluation:</strong> This process calculates unrealized foreign exchange gains or losses 
          on outstanding receivables and payables. It does not affect cash - these are non-cash adjustments 
          that reflect the change in value due to exchange rate movements.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Calculate Revaluation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Revaluation Date</Label>
              <Input
                type="date"
                value={revaluationDate}
                onChange={(e) => setRevaluationDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={calculateRevaluation} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Calculate FX Adjustments
              </Button>
            </div>
          </div>

          <div className="bg-gray-50 border rounded-lg p-4 text-sm">
            <p><strong>Base Currency:</strong> {baseCurrency}</p>
            <p className="mt-1">
              The system will compare current exchange rates with the rates at which transactions were recorded.
            </p>
          </div>
        </CardContent>
      </Card>

      {revaluationResults && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Revaluation Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-900 font-semibold">Total Gains</p>
                  <p className="text-2xl font-bold text-green-700 mt-2">
                    {baseCurrency} {revaluationResults.total_gain.toFixed(2)}
                  </p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-900 font-semibold">Total Losses</p>
                  <p className="text-2xl font-bold text-red-700 mt-2">
                    {baseCurrency} {revaluationResults.total_loss.toFixed(2)}
                  </p>
                </div>
                <div className={`border rounded-lg p-4 ${
                  revaluationResults.net_fx >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}>
                  <p className="text-sm font-semibold">Net FX Adjustment</p>
                  <p className={`text-2xl font-bold mt-2 ${
                    revaluationResults.net_fx >= 0 ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {baseCurrency} {revaluationResults.net_fx.toFixed(2)}
                  </p>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Document</TableHead>
                    <TableHead>Customer/Vendor</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Original Rate</TableHead>
                    <TableHead>Current Rate</TableHead>
                    <TableHead>FX Gain/Loss</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {revaluationResults.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.type}</TableCell>
                      <TableCell className="font-medium">{item.document_number}</TableCell>
                      <TableCell>{item.customer_vendor}</TableCell>
                      <TableCell>{item.currency}</TableCell>
                      <TableCell className="font-mono">
                        {item.currency} {item.balance_foreign.toFixed(2)}
                      </TableCell>
                      <TableCell className="font-mono">{item.original_rate.toFixed(4)}</TableCell>
                      <TableCell className="font-mono">{item.current_rate.toFixed(4)}</TableCell>
                      <TableCell>
                        <div className={`flex items-center gap-1 ${
                          item.is_gain ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {item.is_gain ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          <span className="font-mono font-semibold">
                            {baseCurrency} {Math.abs(item.fx_gain_loss).toFixed(2)}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-6 flex justify-end">
                <Button
                  onClick={() => postRevaluationMutation.mutate()}
                  disabled={postRevaluationMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {postRevaluationMutation.isPending ? 'Posting...' : 'Post Revaluation to GL'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-900">
              <strong>Important:</strong> Posting this revaluation will create a journal entry to adjust AR/AP 
              balances and record unrealized FX gains/losses. This is a period-end adjustment and should be 
              reviewed carefully before posting.
            </AlertDescription>
          </Alert>
        </>
      )}
    </div>
  );
}
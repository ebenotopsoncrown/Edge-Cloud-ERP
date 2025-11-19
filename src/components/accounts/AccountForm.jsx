import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { X, Save, AlertCircle } from "lucide-react";
import { useCompany } from "../auth/CompanyContext";
import { format } from "date-fns";

const accountCategories = {
  asset: ['current_asset', 'fixed_asset'],
  liability: ['current_liability', 'long_term_liability'],
  equity: ['equity'],
  revenue: ['operating_revenue', 'other_revenue'],
  expense: ['operating_expense', 'other_expense'],
  cost_of_goods_sold: ['cost_of_sales']
};

export default function AccountForm({ account, onClose }) {
  const queryClient = useQueryClient();
  const { currentCompany } = useCompany();
  const [formData, setFormData] = useState({
    company_id: currentCompany?.id,
    account_code: '',
    account_name: '',
    account_type: 'asset',
    account_category: 'current_asset',
    description: '',
    currency: 'USD',
    is_active: true,
    balance: 0,
    ...account
  });

  const [openingBalance, setOpeningBalance] = useState(account?.balance || 0);
  const [showOpeningBalance, setShowOpeningBalance] = useState(false);

  // Check if account type allows opening balance
  const canHaveOpeningBalance = ['asset', 'liability', 'equity'].includes(formData.account_type);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      let savedAccount;
      
      if (account?.id) {
        savedAccount = await base44.entities.Account.update(account.id, data);
      } else {
        savedAccount = await base44.entities.Account.create(data);
      }

      // If opening balance is set and this is a NEW account (not edit), create journal entry
      if (!account?.id && openingBalance !== 0 && canHaveOpeningBalance) {
        const equityAccount = await base44.entities.Account.filter({
          company_id: currentCompany.id,
          account_type: 'equity',
          account_name: "Owner's Capital"
        });

        if (equityAccount.length > 0) {
          const lineItems = [];
          
          // Determine debit/credit based on account type
          if (formData.account_type === 'asset') {
            // Debit Asset, Credit Equity
            lineItems.push({
              account_id: savedAccount.id,
              account_name: savedAccount.account_name,
              account_code: savedAccount.account_code,
              description: 'Opening Balance',
              debit: openingBalance,
              credit: 0
            });
            lineItems.push({
              account_id: equityAccount[0].id,
              account_name: equityAccount[0].account_name,
              account_code: equityAccount[0].account_code,
              description: 'Opening Balance',
              debit: 0,
              credit: openingBalance
            });
          } else if (formData.account_type === 'liability' || formData.account_type === 'equity') {
            // Debit Equity, Credit Liability/Equity
            lineItems.push({
              account_id: equityAccount[0].id,
              account_name: equityAccount[0].account_name,
              account_code: equityAccount[0].account_code,
              description: 'Opening Balance',
              debit: openingBalance,
              credit: 0
            });
            lineItems.push({
              account_id: savedAccount.id,
              account_name: savedAccount.account_name,
              account_code: savedAccount.account_code,
              description: 'Opening Balance',
              debit: 0,
              credit: openingBalance
            });
          }

          // Create journal entry
          await base44.entities.JournalEntry.create({
            company_id: currentCompany.id,
            entry_number: `OB-${savedAccount.account_code}-${Date.now()}`,
            entry_date: format(new Date(), 'yyyy-MM-dd'),
            description: `Opening Balance - ${savedAccount.account_name}`,
            source_type: 'manual',
            status: 'posted',
            line_items: lineItems,
            total_debits: openingBalance,
            total_credits: openingBalance,
            posted_by: currentCompany.admin_user_id || 'system',
            posted_date: new Date().toISOString()
          });

          // Update account balance
          await base44.entities.Account.update(savedAccount.id, {
            balance: openingBalance
          });

          // Update equity account balance
          const currentEquityBalance = equityAccount[0].balance || 0;
          let newEquityBalance;
          if (formData.account_type === 'asset') {
            newEquityBalance = currentEquityBalance + openingBalance;
          } else {
            newEquityBalance = currentEquityBalance - openingBalance;
          }
          await base44.entities.Account.update(equityAccount[0].id, {
            balance: newEquityBalance
          });
        }
      }

      return savedAccount;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['accounts']);
      onClose();
    }
  });

  const handleTypeChange = (type) => {
    setFormData(prev => ({
      ...prev,
      account_type: type,
      account_category: accountCategories[type][0]
    }));
  };

  const handleSave = () => {
    if (!formData.account_code || !formData.account_name) {
      alert('Please fill in Account Code and Account Name');
      return;
    }
    saveMutation.mutate(formData);
  };

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between border-b">
        <CardTitle>{account ? 'Edit Account' : 'New Account'}</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Account Code *</Label>
            <Input
              value={formData.account_code}
              onChange={(e) => setFormData(prev => ({ ...prev, account_code: e.target.value }))}
              placeholder="e.g., 1000, 4000"
            />
          </div>

          <div className="space-y-2">
            <Label>Account Name *</Label>
            <Input
              value={formData.account_name}
              onChange={(e) => setFormData(prev => ({ ...prev, account_name: e.target.value }))}
              placeholder="e.g., Cash, Sales Revenue"
            />
          </div>

          <div className="space-y-2">
            <Label>Account Type *</Label>
            <Select
              value={formData.account_type}
              onValueChange={handleTypeChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asset">Asset</SelectItem>
                <SelectItem value="liability">Liability</SelectItem>
                <SelectItem value="equity">Equity</SelectItem>
                <SelectItem value="revenue">Revenue</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="cost_of_goods_sold">Cost of Goods Sold</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Category *</Label>
            <Select
              value={formData.account_category}
              onValueChange={(value) => setFormData(prev => ({ ...prev, account_category: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {accountCategories[formData.account_type].map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Currency</Label>
            <Input
              value={formData.currency}
              onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Account description..."
              rows={3}
            />
          </div>
        </div>

        {/* OPENING BALANCE SECTION */}
        {!account?.id && canHaveOpeningBalance && (
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Opening Balance (Optional)</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowOpeningBalance(!showOpeningBalance)}
              >
                {showOpeningBalance ? 'Hide' : 'Set Opening Balance'}
              </Button>
            </div>

            {showOpeningBalance && (
              <div className="space-y-4">
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-900">
                    Setting an opening balance will automatically create a journal entry to record the initial balance.
                    The offsetting entry will be made to Owner's Capital account.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label>Opening Balance Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                  <p className="text-xs text-gray-500">
                    Enter the starting balance for this account. This will create a posted journal entry.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {!canHaveOpeningBalance && (
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-900">
              Opening balances cannot be set for Revenue, Expense, and Cost of Goods Sold accounts.
              These accounts start at zero and are affected by transactions only.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
            <Save className="w-4 h-4 mr-2" />
            Save Account
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
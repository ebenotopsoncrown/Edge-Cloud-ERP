import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { X, Save, AlertCircle } from "lucide-react";
import { useCompany } from "../auth/CompanyContext";

export default function FixedAssetForm({ asset, onClose }) {
  const queryClient = useQueryClient();
  const { currentCompany } = useCompany();
  
  const [formData, setFormData] = useState({
    company_id: currentCompany?.id,
    asset_code: '',
    asset_name: '',
    description: '',
    category: 'office_equipment',
    acquisition_date: '',
    acquisition_cost: 0,
    useful_life_years: 5,
    depreciation_method: 'straight_line',
    salvage_value: 0,
    location: '',
    assigned_to: '',
    serial_number: '',
    vendor_id: '',
    warranty_expiry: '',
    asset_account_id: '',
    depreciation_account_id: '',
    accumulated_depreciation_account_id: '',
    notes: '',
    is_active: true,
    ...asset
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.Vendor.filter({ company_id: currentCompany.id }) : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.Account.filter({ company_id: currentCompany.id }) : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const assetAccounts = accounts.filter(acc => 
    acc.account_type === 'asset' && 
    (acc.account_category === 'fixed_asset' || acc.account_name?.toLowerCase().includes('asset'))
  );

  const expenseAccounts = accounts.filter(acc => 
    acc.account_type === 'expense' && 
    acc.account_name?.toLowerCase().includes('depreciation')
  );

  const contraAssetAccounts = accounts.filter(acc => 
    acc.account_type === 'asset' && 
    acc.account_name?.toLowerCase().includes('accumulated depreciation')
  );

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const calculatedData = {
        ...data,
        current_book_value: data.acquisition_cost - (data.accumulated_depreciation || 0)
      };
      
      let savedAsset;
      if (asset?.id) {
        savedAsset = await base44.entities.FixedAsset.update(asset.id, calculatedData);
      } else {
        savedAsset = await base44.entities.FixedAsset.create(calculatedData);
        
        // POST OPENING BALANCE JOURNAL for new fixed assets
        if (!asset && data.acquisition_cost > 0 && data.asset_account_id) {
          const equityAccount = accounts.find(a => 
            a.account_type === 'equity' && 
            (a.account_name?.toLowerCase().includes("owner's capital") || a.account_name?.toLowerCase().includes('capital'))
          );
          
          if (equityAccount) {
            const assetAccount = accounts.find(a => a.id === data.asset_account_id);
            
            const journalEntry = {
              company_id: currentCompany.id,
              entry_number: `OB-FA-${savedAsset.asset_code || savedAsset.id}`,
              entry_date: data.acquisition_date,
              reference: `Fixed Asset Opening Balance - ${data.asset_name}`,
              source_type: 'manual',
              description: `Opening Balance - ${data.asset_name}`,
              status: 'posted',
              line_items: [
                {
                  account_id: data.asset_account_id,
                  account_name: assetAccount?.account_name || 'Fixed Asset',
                  account_code: assetAccount?.account_code || '',
                  description: `Fixed asset - ${data.asset_name}`,
                  debit: data.acquisition_cost,
                  credit: 0
                },
                {
                  account_id: equityAccount.id,
                  account_name: equityAccount.account_name,
                  account_code: equityAccount.account_code,
                  description: 'Opening Balance Equity',
                  debit: 0,
                  credit: data.acquisition_cost
                }
              ],
              total_debits: data.acquisition_cost,
              total_credits: data.acquisition_cost,
              posted_by: currentCompany.admin_user_id || 'system',
              posted_date: new Date().toISOString()
            };
            
            await base44.entities.JournalEntry.create(journalEntry);
            
            // Update asset account balance
            if (assetAccount) {
              await base44.entities.Account.update(assetAccount.id, {
                balance: (assetAccount.balance || 0) + data.acquisition_cost
              });
            }
            
            // Update equity account balance
            await base44.entities.Account.update(equityAccount.id, {
              balance: (equityAccount.balance || 0) + data.acquisition_cost
            });
          }
        }
      }
      
      return savedAsset;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['fixed-assets', currentCompany?.id]);
      queryClient.invalidateQueries(['journal-entries', currentCompany?.id]);
      queryClient.invalidateQueries(['accounts', currentCompany?.id]);
      onClose();
    }
  });

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between border-b">
        <CardTitle>{asset ? 'Edit Fixed Asset' : 'New Fixed Asset'}</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {!asset && (
          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              <strong>Opening Balance:</strong> When you create a new fixed asset, the system will automatically post an opening balance journal entry: <strong>DR</strong> Fixed Asset Account, <strong>CR</strong> Owner's Capital
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Asset Code</Label>
            <Input
              value={formData.asset_code}
              onChange={(e) => setFormData(prev => ({ ...prev, asset_code: e.target.value }))}
              placeholder="FA-001"
            />
          </div>

          <div className="space-y-2">
            <Label>Asset Name *</Label>
            <Input
              value={formData.asset_name}
              onChange={(e) => setFormData(prev => ({ ...prev, asset_name: e.target.value }))}
              placeholder="Office Desk, Delivery Van, etc."
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Detailed description of the asset..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Category *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="machinery">Machinery</SelectItem>
                <SelectItem value="vehicles">Vehicles</SelectItem>
                <SelectItem value="office_equipment">Office Equipment</SelectItem>
                <SelectItem value="furniture">Furniture</SelectItem>
                <SelectItem value="computers">Computers & IT</SelectItem>
                <SelectItem value="buildings">Buildings</SelectItem>
                <SelectItem value="land">Land</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Acquisition Date *</Label>
            <Input
              type="date"
              value={formData.acquisition_date}
              onChange={(e) => setFormData(prev => ({ ...prev, acquisition_date: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Acquisition Cost *</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.acquisition_cost}
              onChange={(e) => setFormData(prev => ({ ...prev, acquisition_cost: parseFloat(e.target.value) }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Useful Life (Years) *</Label>
            <Input
              type="number"
              value={formData.useful_life_years}
              onChange={(e) => setFormData(prev => ({ ...prev, useful_life_years: parseFloat(e.target.value) }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Depreciation Method</Label>
            <Select
              value={formData.depreciation_method}
              onValueChange={(value) => setFormData(prev => ({ ...prev, depreciation_method: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="straight_line">Straight Line</SelectItem>
                <SelectItem value="declining_balance">Declining Balance</SelectItem>
                <SelectItem value="units_of_production">Units of Production</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Salvage Value</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.salvage_value}
              onChange={(e) => setFormData(prev => ({ ...prev, salvage_value: parseFloat(e.target.value) }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Serial Number</Label>
            <Input
              value={formData.serial_number}
              onChange={(e) => setFormData(prev => ({ ...prev, serial_number: e.target.value }))}
              placeholder="Manufacturer serial number"
            />
          </div>

          <div className="space-y-2">
            <Label>Location</Label>
            <Input
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="Building, floor, room, etc."
            />
          </div>

          <div className="space-y-2">
            <Label>Assigned To</Label>
            <Input
              value={formData.assigned_to}
              onChange={(e) => setFormData(prev => ({ ...prev, assigned_to: e.target.value }))}
              placeholder="Employee name or department"
            />
          </div>

          <div className="space-y-2">
            <Label>Vendor</Label>
            <Select
              value={formData.vendor_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, vendor_id: value }))}
            >
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

          <div className="space-y-2">
            <Label>Warranty Expiry</Label>
            <Input
              type="date"
              value={formData.warranty_expiry}
              onChange={(e) => setFormData(prev => ({ ...prev, warranty_expiry: e.target.value }))}
            />
          </div>
        </div>

        {/* ACCOUNTING SECTION */}
        <div className="border-2 border-orange-200 rounded-lg p-4 bg-orange-50">
          <h3 className="text-lg font-semibold text-orange-900 mb-4">📊 Accounting (GL Accounts)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Asset Account *</Label>
              <Select
                value={formData.asset_account_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, asset_account_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select asset account" />
                </SelectTrigger>
                <SelectContent>
                  {assetAccounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.account_code} - {acc.account_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Depreciation Expense Account</Label>
              <Select
                value={formData.depreciation_account_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, depreciation_account_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select expense account" />
                </SelectTrigger>
                <SelectContent>
                  {expenseAccounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.account_code} - {acc.account_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Accumulated Depreciation Account</Label>
              <Select
                value={formData.accumulated_depreciation_account_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, accumulated_depreciation_account_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select contra-asset account" />
                </SelectTrigger>
                <SelectContent>
                  {contraAssetAccounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.account_code} - {acc.account_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Notes</Label>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Additional notes about this asset..."
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
            <Save className="w-4 h-4 mr-2" />
            Save Asset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
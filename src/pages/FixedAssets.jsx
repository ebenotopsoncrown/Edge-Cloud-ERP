import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, Package, Pencil, TrendingDown, AlertCircle, Play } from "lucide-react";
import { format, differenceInMonths } from "date-fns";
import FixedAssetForm from "../components/fixedAssets/FixedAssetForm";
import { useCompany } from "../components/auth/CompanyContext";

const categoryColors = {
  machinery: "bg-blue-100 text-blue-800",
  vehicles: "bg-purple-100 text-purple-800",
  office_equipment: "bg-green-100 text-green-800",
  furniture: "bg-yellow-100 text-yellow-800",
  computers: "bg-indigo-100 text-indigo-800",
  buildings: "bg-orange-100 text-orange-800",
  land: "bg-pink-100 text-pink-800",
  other: "bg-gray-100 text-gray-800"
};

export default function FixedAssets() {
  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { currentCompany } = useCompany();
  const queryClient = useQueryClient();

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['fixed-assets', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.FixedAsset.filter({ company_id: currentCompany.id }, '-acquisition_date') : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.Account.filter({ company_id: currentCompany.id }) : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const runDepreciationMutation = useMutation({
    mutationFn: async () => {
      const today = new Date();
      const results = [];
      
      for (const asset of assets) {
        if (!asset.is_active || !asset.depreciation_account_id || !asset.accumulated_depreciation_account_id) {
          continue;
        }
        
        // Calculate depreciation for this month
        const { accumulated, bookValue } = calculateDepreciation(asset);
        const monthsSinceAcquisition = differenceInMonths(today, new Date(asset.acquisition_date));
        const monthlyDepreciation = asset.depreciation_method === 'straight_line' 
          ? ((asset.acquisition_cost - (asset.salvage_value || 0)) / (asset.useful_life_years * 12))
          : 0;
        
        if (monthlyDepreciation > 0 && monthsSinceAcquisition > 0) {
          // Post depreciation journal entry
          const depreciationAccount = accounts.find(a => a.id === asset.depreciation_account_id);
          const accumulatedDepAccount = accounts.find(a => a.id === asset.accumulated_depreciation_account_id);
          
          if (depreciationAccount && accumulatedDepAccount) {
            const journalEntry = {
              company_id: currentCompany.id,
              entry_number: `DEP-${asset.asset_code}-${format(today, 'yyyyMM')}`,
              entry_date: format(today, 'yyyy-MM-dd'),
              reference: `Depreciation - ${asset.asset_name}`,
              source_type: 'manual',
              description: `Monthly depreciation for ${asset.asset_name}`,
              status: 'posted',
              line_items: [
                {
                  account_id: asset.depreciation_account_id,
                  account_name: depreciationAccount.account_name,
                  account_code: depreciationAccount.account_code,
                  description: `Depreciation expense - ${asset.asset_name}`,
                  debit: monthlyDepreciation,
                  credit: 0
                },
                {
                  account_id: asset.accumulated_depreciation_account_id,
                  account_name: accumulatedDepAccount.account_name,
                  account_code: accumulatedDepAccount.account_code,
                  description: `Accumulated depreciation - ${asset.asset_name}`,
                  debit: 0,
                  credit: monthlyDepreciation
                }
              ],
              total_debits: monthlyDepreciation,
              total_credits: monthlyDepreciation,
              posted_by: currentCompany.admin_user_id || 'system',
              posted_date: new Date().toISOString()
            };
            
            await base44.entities.JournalEntry.create(journalEntry);
            
            // Update depreciation expense account balance
            await base44.entities.Account.update(depreciationAccount.id, {
              balance: (depreciationAccount.balance || 0) + monthlyDepreciation
            });
            
            // Update accumulated depreciation account balance
            await base44.entities.Account.update(accumulatedDepAccount.id, {
              balance: (accumulatedDepAccount.balance || 0) + monthlyDepreciation
            });
            
            // Update fixed asset record
            await base44.entities.FixedAsset.update(asset.id, {
              accumulated_depreciation: accumulated + monthlyDepreciation,
              current_book_value: bookValue - monthlyDepreciation
            });
            
            results.push({ asset: asset.asset_name, amount: monthlyDepreciation });
          }
        }
      }
      
      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries(['fixed-assets', currentCompany?.id]);
      queryClient.invalidateQueries(['accounts', currentCompany?.id]);
      queryClient.invalidateQueries(['journal-entries', currentCompany?.id]);
      
      alert(`Depreciation posted successfully for ${results.length} assets!\n\nTotal Depreciation: $${results.reduce((sum, r) => sum + r.amount, 0).toFixed(2)}`);
    }
  });

  const calculateDepreciation = (asset) => {
    if (!asset.acquisition_date || !asset.acquisition_cost || !asset.useful_life_years) {
      return { accumulated: 0, bookValue: asset.acquisition_cost || 0 };
    }

    const monthsSinceAcquisition = differenceInMonths(new Date(), new Date(asset.acquisition_date));
    const totalMonths = asset.useful_life_years * 12;
    
    if (asset.depreciation_method === 'straight_line') {
      const depreciableAmount = asset.acquisition_cost - (asset.salvage_value || 0);
      const monthlyDepreciation = depreciableAmount / totalMonths;
      const accumulated = Math.min(monthlyDepreciation * monthsSinceAcquisition, depreciableAmount);
      const bookValue = Math.max(asset.acquisition_cost - accumulated, asset.salvage_value || 0);
      
      return { accumulated, bookValue };
    }
    
    return { 
      accumulated: asset.accumulated_depreciation || 0, 
      bookValue: asset.current_book_value || asset.acquisition_cost 
    };
  };

  const assetsWithCalculations = assets.map(asset => ({
    ...asset,
    ...calculateDepreciation(asset)
  }));

  const filteredAssets = assetsWithCalculations.filter(asset =>
    asset.asset_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.asset_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAssetValue = filteredAssets.reduce((sum, asset) => sum + (asset.bookValue || 0), 0);
  const totalAcquisitionCost = filteredAssets.reduce((sum, asset) => sum + (asset.acquisition_cost || 0), 0);
  const totalDepreciation = filteredAssets.reduce((sum, asset) => sum + (asset.accumulated || 0), 0);

  const handleEdit = (asset) => {
    setEditingAsset(asset);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingAsset(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fixed Assets</h1>
          <p className="text-gray-500 mt-1">Manage your long-term assets and depreciation</p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => runDepreciationMutation.mutate()}
            className="bg-orange-600 hover:bg-orange-700"
            disabled={runDepreciationMutation.isPending}
          >
            {runDepreciationMutation.isPending ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                Processing...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Run Depreciation
              </>
            )}
          </Button>
          <Button 
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Asset
          </Button>
        </div>
      </div>

      <Alert className="bg-yellow-50 border-yellow-200">
        <AlertCircle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-900">
          <strong>Important:</strong> Click "Run Depreciation" monthly to post depreciation journals to GL. This updates your P&L and Balance Sheet with accurate depreciation expenses.
        </AlertDescription>
      </Alert>

      {showForm && (
        <FixedAssetForm
          asset={editingAsset}
          onClose={handleFormClose}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border-none shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-blue-900">Total Asset Value</h3>
            <Package className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-blue-900">${totalAssetValue.toFixed(2)}</p>
          <p className="text-xs text-blue-700 mt-1">Current book value</p>
        </Card>

        <Card className="p-6 border-none shadow-lg bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-green-900">Acquisition Cost</h3>
            <Package className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-900">${totalAcquisitionCost.toFixed(2)}</p>
          <p className="text-xs text-green-700 mt-1">Original purchase value</p>
        </Card>

        <Card className="p-6 border-none shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-orange-900">Total Depreciation</h3>
            <TrendingDown className="w-8 h-8 text-orange-600" />
          </div>
          <p className="text-3xl font-bold text-orange-900">${totalDepreciation.toFixed(2)}</p>
          <p className="text-xs text-orange-700 mt-1">Accumulated to date</p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search assets by name, code, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset Code</TableHead>
                <TableHead>Asset Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Acquisition Date</TableHead>
                <TableHead>Acquisition Cost</TableHead>
                <TableHead>Accumulated Depreciation</TableHead>
                <TableHead>Book Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                    Loading assets...
                  </TableCell>
                </TableRow>
              ) : filteredAssets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No fixed assets found</p>
                    <Button 
                      onClick={() => setShowForm(true)}
                      variant="outline"
                      className="mt-3"
                    >
                      Add your first asset
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAssets.map((asset) => (
                  <TableRow key={asset.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{asset.asset_code}</TableCell>
                    <TableCell>{asset.asset_name}</TableCell>
                    <TableCell>
                      <Badge className={categoryColors[asset.category]}>
                        {asset.category?.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>{format(new Date(asset.acquisition_date), 'MMM d, yyyy')}</TableCell>
                    <TableCell className="font-semibold text-green-600">
                      ${asset.acquisition_cost?.toFixed(2)}
                    </TableCell>
                    <TableCell className="font-semibold text-orange-600">
                      ${asset.accumulated?.toFixed(2)}
                    </TableCell>
                    <TableCell className="font-semibold text-blue-600">
                      ${asset.bookValue?.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge className={asset.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                        {asset.is_active ? 'Active' : 'Disposed'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(asset)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
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
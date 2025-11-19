import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X, Save, Trash2 } from "lucide-react";
import { useCompany } from "../auth/CompanyContext";

export default function ProductForm({ product, onClose }) {
  const { currentCompany } = useCompany();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    company_id: currentCompany?.id || '',
    sku: '',
    product_name: '',
    description: '',
    category: '',
    product_type: 'inventory',
    unit_price: 0,
    cost_price: 0,
    unit_of_measure: 'unit',
    quantity_on_hand: 0,
    reorder_level: 0,
    reorder_quantity: 0,
    barcode: '',
    tax_rate: 0,
    sales_account_id: '',
    inventory_account_id: '',
    cogs_account_id: '',
    location_id: '',
    is_active: true
  });

  // Fetch GL Accounts
  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.Account.filter({ company_id: currentCompany.id }) : [],
    enabled: !!currentCompany
  });

  // Fetch Inventory Locations
  const { data: locations = [] } = useQuery({
    queryKey: ['locations', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.InventoryLocation.filter({ company_id: currentCompany.id }) : [],
    enabled: !!currentCompany
  });

  // Filter accounts by type
  const salesAccounts = accounts.filter(a => a.account_type === 'revenue');
  const inventoryAccounts = accounts.filter(a => 
    a.account_type === 'asset' && 
    (a.account_name?.toLowerCase().includes('inventory') || a.account_code?.startsWith('13'))
  );
  const cogsAccounts = accounts.filter(a => a.account_type === 'cost_of_goods_sold');

  // Load existing product data
  useEffect(() => {
    if (product) {
      setFormData({
        ...product,
        company_id: currentCompany?.id || product.company_id
      });
    }
  }, [product, currentCompany]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const productData = {
      ...formData,
      company_id: currentCompany.id,
      unit_price: parseFloat(formData.unit_price) || 0,
      cost_price: parseFloat(formData.cost_price) || 0,
      quantity_on_hand: parseFloat(formData.quantity_on_hand) || 0,
      reorder_level: parseFloat(formData.reorder_level) || 0,
      reorder_quantity: parseFloat(formData.reorder_quantity) || 0,
      tax_rate: parseFloat(formData.tax_rate) || 0
    };
    
    saveMutation.mutate(productData);
  };

  const saveMutation = useMutation({
    mutationFn: async (productData) => {
      setIsLoading(true);
      let savedProduct;
      
      if (product?.id) {
        savedProduct = await base44.entities.Product.update(product.id, productData);
      } else {
        savedProduct = await base44.entities.Product.create(productData);
        
        // CRITICAL: Create opening balance journal entry and inventory transaction if product has opening stock
        if (productData.product_type === 'inventory' && productData.quantity_on_hand > 0) {
          console.log('📦 Creating opening balance journal entry for inventory...');
          
          const openingValue = productData.quantity_on_hand * (productData.cost_price || 0);
          
          if (openingValue > 0) {
            // Find Equity account (Retained Earnings / Opening Balance Equity)
            let equityAccount = accounts.find(a => 
              a.account_type === 'equity' && 
              (a.account_name?.toLowerCase().includes('opening') ||
               a.account_name?.toLowerCase().includes('retained') ||
               a.account_code === '3900')
            );

            // If no opening balance equity account exists, use any equity account
            if (!equityAccount) {
              equityAccount = accounts.find(a => a.account_type === 'equity');
            }

            // Find inventory account
            const inventoryAccount = accounts.find(a => a.id === productData.inventory_account_id) ||
                                   accounts.find(a => 
                                     a.account_type === 'asset' && 
                                     (a.account_name?.toLowerCase().includes('inventory') || a.account_code?.startsWith('13'))
                                   );

            if (inventoryAccount && equityAccount) {
              console.log(`   Opening value: ${openingValue}`);
              console.log(`   DR: ${inventoryAccount.account_name} (${inventoryAccount.account_code})`);
              console.log(`   CR: ${equityAccount.account_name} (${equityAccount.account_code})`);

              const journalLines = [
                {
                  account_id: inventoryAccount.id,
                  account_name: inventoryAccount.account_name,
                  account_code: inventoryAccount.account_code,
                  description: `Opening balance for ${productData.product_name}`,
                  debit: openingValue,
                  credit: 0
                },
                {
                  account_id: equityAccount.id,
                  account_name: equityAccount.account_name,
                  account_code: equityAccount.account_code,
                  description: `Opening balance for ${productData.product_name}`,
                  debit: 0,
                  credit: openingValue
                }
              ];

              const journalEntry = {
                company_id: productData.company_id,
                entry_number: `JE-OB-${savedProduct.id}`,
                entry_date: new Date().toISOString().split('T')[0],
                reference: savedProduct.sku || savedProduct.product_name,
                source_type: 'inventory_adjustment',
                source_id: savedProduct.id,
                description: `Opening balance for ${productData.product_name} - ${productData.quantity_on_hand} units @ ${productData.cost_price}`,
                status: 'posted',
                line_items: journalLines,
                total_debits: openingValue,
                total_credits: openingValue,
                posted_by: 'system',
                posted_date: new Date().toISOString()
              };

              const je = await base44.entities.JournalEntry.create(journalEntry);
              console.log(`   ✅ Journal entry created: ${je.entry_number}`);

              // Update account balances
              const invCurrentBalance = parseFloat(inventoryAccount.balance) || 0;
              await base44.entities.Account.update(inventoryAccount.id, {
                balance: invCurrentBalance + openingValue,
                company_id: inventoryAccount.company_id
              });
              console.log(`   Posted to ${inventoryAccount.account_name}: ${invCurrentBalance} → ${invCurrentBalance + openingValue}`);

              const eqCurrentBalance = parseFloat(equityAccount.balance) || 0;
              await base44.entities.Account.update(equityAccount.id, {
                balance: eqCurrentBalance + openingValue,
                company_id: equityAccount.company_id
              });
              console.log(`   Posted to ${equityAccount.account_name}: ${eqCurrentBalance} → ${eqCurrentBalance + openingValue}`);

              // CRITICAL: Create inventory transaction for opening balance
              const inventoryTransaction = {
                company_id: productData.company_id,
                transaction_number: `OB-${savedProduct.id}`,
                transaction_date: new Date().toISOString().split('T')[0],
                transaction_type: 'opening_balance',
                product_id: savedProduct.id,
                product_name: productData.product_name,
                sku: productData.sku,
                location_id: productData.location_id,
                quantity_in: productData.quantity_on_hand,
                quantity_out: 0,
                unit_cost: productData.cost_price,
                total_value: openingValue,
                reference_type: 'opening_balance',
                reference_id: savedProduct.id,
                reference_number: `OB-${savedProduct.id}`,
                notes: `Opening balance for ${productData.product_name}`,
                journal_entry_id: je.id
              };

              await base44.entities.InventoryTransaction.create(inventoryTransaction);
              console.log(`   ✅ Inventory transaction created: ${inventoryTransaction.transaction_number}`);

              console.log('✅ Opening balance journal entry posted successfully');
            } else {
              console.warn('⚠️ Could not find Inventory or Equity account for opening balance');
              console.warn('   Inventory Account:', inventoryAccount ? 'Found' : 'NOT FOUND');
              console.warn('   Equity Account:', equityAccount ? 'Found' : 'NOT FOUND');
            }
          }
        }
      }
      
      return savedProduct;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      queryClient.invalidateQueries(['accounts']);
      queryClient.invalidateQueries(['journal-entries']);
      queryClient.invalidateQueries(['inventory-transactions']);
      setIsLoading(false);
      onClose();
    },
    onError: (error) => {
      console.error('❌ Error saving product:', error);
      alert('Error saving product: ' + error.message);
      setIsLoading(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!window.confirm('Are you sure you want to delete this product?')) {
        throw new Error('Cancelled');
      }
      await base44.entities.Product.delete(product.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      onClose();
    },
    onError: (error) => {
      if (error.message !== 'Cancelled') {
        alert('Error deleting product: ' + error.message);
      }
    }
  });

  return (
    <Card className="fixed inset-4 z-50 overflow-auto bg-white shadow-2xl">
      <CardHeader className="border-b sticky top-0 bg-white z-10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">
            {product ? 'Edit Inventory Item' : 'New Inventory Item'}
          </CardTitle>
          <div className="flex gap-2">
            {product && (
              <Button
                variant="destructive"
                onClick={() => deleteMutation.mutate()}
                disabled={isLoading}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Product ID (SKU) *</Label>
              <Input
                value={formData.sku}
                onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                placeholder="e.g., ADMIN-01000"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Description *</Label>
              <Input
                value={formData.product_name}
                onChange={(e) => setFormData(prev => ({ ...prev, product_name: e.target.value }))}
                placeholder="e.g., Bookkeeping/Administrative"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Input
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                placeholder="Product category"
              />
            </div>

            <div className="space-y-2">
              <Label>Unit of Measure</Label>
              <Input
                value={formData.unit_of_measure}
                onChange={(e) => setFormData(prev => ({ ...prev, unit_of_measure: e.target.value }))}
                placeholder="e.g., unit, kg, box"
              />
            </div>
          </div>

          {/* GL Accounts Section */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3">📊 General Ledger Accounts</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>GL Sales Account *</Label>
                <Select 
                  value={formData.sales_account_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, sales_account_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sales account" />
                  </SelectTrigger>
                  <SelectContent>
                    {salesAccounts.map(account => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.account_code} - {account.account_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>GL Inventory Account *</Label>
                <Select 
                  value={formData.inventory_account_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, inventory_account_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select inventory account" />
                  </SelectTrigger>
                  <SelectContent>
                    {inventoryAccounts.map(account => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.account_code} - {account.account_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>GL Cost of Sales *</Label>
                <Select 
                  value={formData.cogs_account_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, cogs_account_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select COGS account" />
                  </SelectTrigger>
                  <SelectContent>
                    {cogsAccounts.map(account => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.account_code} - {account.account_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label>Location *</Label>
            <Select 
              value={formData.location_id} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, location_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map(location => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.location_code} - {location.location_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {locations.length === 0 && (
              <p className="text-xs text-orange-600">
                No locations found. Please create a location first in Inventory → Inventory Locations.
              </p>
            )}
          </div>

          {/* Pricing & Inventory */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label>Cost Price *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.cost_price}
                onChange={(e) => setFormData(prev => ({ ...prev, cost_price: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Sales Price *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.unit_price}
                onChange={(e) => setFormData(prev => ({ ...prev, unit_price: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Opening Balance (Qty)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.quantity_on_hand}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity_on_hand: e.target.value }))}
                disabled={!!product}
              />
              {product && (
                <p className="text-xs text-gray-500">
                  Opening balance can only be set when creating new items
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Tax Rate (%)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.tax_rate}
                onChange={(e) => setFormData(prev => ({ ...prev, tax_rate: e.target.value }))}
              />
            </div>
          </div>

          {/* Reorder Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Reorder Level</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.reorder_level}
                onChange={(e) => setFormData(prev => ({ ...prev, reorder_level: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Reorder Quantity</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.reorder_quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, reorder_quantity: e.target.value }))}
              />
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-2">
            <Label>Additional Details</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              placeholder="Additional product details..."
            />
          </div>

          {/* Opening Balance Info */}
          {!product && formData.quantity_on_hand > 0 && formData.cost_price > 0 && (
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">📝 Opening Balance Journal Entry</h3>
              <p className="text-sm text-green-800">
                When you save this item, the following journal entry will be posted automatically:
              </p>
              <div className="mt-3 bg-white rounded p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="font-semibold">DR: Inventory</span>
                  <span className="font-mono">
                    {(formData.quantity_on_hand * formData.cost_price).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">CR: Opening Balance Equity</span>
                  <span className="font-mono">
                    {(formData.quantity_on_hand * formData.cost_price).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Inventory Item'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
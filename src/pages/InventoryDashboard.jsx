import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCompany } from "../components/auth/CompanyContext";
import ProductForm from "../components/products/ProductForm";
import { Plus, Package } from "lucide-react";
import { formatCurrency } from "../components/shared/FinancialCalculations";

export default function InventoryDashboard() {
  const { currentCompany } = useCompany();
  const [showProductForm, setShowProductForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const { data: products = [] } = useQuery({
    queryKey: ['products', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.Product.filter({ 
      company_id: currentCompany.id,
      product_type: 'inventory'
    }) : [],
    enabled: !!currentCompany
  });

  // Get inventory transactions to calculate units sold and purchased
  const { data: transactions = [] } = useQuery({
    queryKey: ['inventory-transactions', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.InventoryTransaction.filter({ 
      company_id: currentCompany.id 
    }) : [],
    enabled: !!currentCompany
  });

  // Calculate inventory metrics for each product
  const inventoryData = products.map(product => {
    const productTransactions = transactions.filter(t => t.product_id === product.id);
    
    // Calculate beginning balance (from opening balance transactions)
    const openingBalance = productTransactions
      .filter(t => t.transaction_type === 'opening_balance')
      .reduce((sum, t) => sum + (t.quantity_in || 0), 0);
    
    // Calculate units sold
    const unitsSold = productTransactions
      .filter(t => t.transaction_type === 'sale')
      .reduce((sum, t) => sum + (t.quantity_out || 0), 0);
    
    // Calculate units purchased
    const unitsPurchased = productTransactions
      .filter(t => t.transaction_type === 'purchase')
      .reduce((sum, t) => sum + (t.quantity_in || 0), 0);
    
    // Quantity on hand
    const quantityOnHand = product.quantity_on_hand || 0;
    
    // Value (Quantity × Cost Price)
    const value = quantityOnHand * (product.cost_price || 0);
    
    return {
      id: product.id,
      itemId: product.sku || product.id.substring(0, 8),
      description: product.product_name,
      beginningBalance: openingBalance,
      unitsSold: unitsSold,
      unitsPurchased: unitsPurchased,
      quantityOnHand: quantityOnHand,
      value: value,
      costPrice: product.cost_price || 0
    };
  });

  // Calculate totals
  const totalValue = inventoryData.reduce((sum, item) => sum + item.value, 0);
  const totalQuantity = inventoryData.reduce((sum, item) => sum + item.quantityOnHand, 0);

  const handleRowClick = (product) => {
    setSelectedProduct(product);
    setShowProductForm(true);
  };

  const baseCurrency = currentCompany?.base_currency || 'USD';

  return (
    <div className="p-6 space-y-6 bg-gray-50">
      {showProductForm && (
        <ProductForm
          product={selectedProduct}
          onClose={() => {
            setShowProductForm(false);
            setSelectedProduct(null);
          }}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-500 mt-1">Setup / Maintain</p>
        </div>
        <Button
          onClick={() => {
            setSelectedProduct(null);
            setShowProductForm(true);
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Inventory Item
        </Button>
      </div>

      {/* Main Inventory Table */}
      <Card className="shadow-md border-none">
        <CardHeader className="border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              Inventory Items
            </CardTitle>
            <div className="text-sm text-gray-600">
              <span className="font-semibold">Total Value:</span> {formatCurrency(totalValue, baseCurrency)} | 
              <span className="font-semibold ml-3">Total Units:</span> {totalQuantity.toFixed(2)}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100 hover:bg-gray-100">
                  <TableHead className="font-bold">Item ID</TableHead>
                  <TableHead className="font-bold">Description</TableHead>
                  <TableHead className="font-bold text-right">Beginning Balance</TableHead>
                  <TableHead className="font-bold text-right">No. Units Sold</TableHead>
                  <TableHead className="font-bold text-right">No. Units Purchased</TableHead>
                  <TableHead className="font-bold text-right">Qty on Hand</TableHead>
                  <TableHead className="font-bold text-right">Value ({baseCurrency})</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="font-semibold">No inventory items yet</p>
                      <p className="text-sm mt-1">Click "New Inventory Item" to create your first item</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  inventoryData.map((item) => (
                    <TableRow 
                      key={item.id}
                      className="hover:bg-blue-50 cursor-pointer transition-colors"
                      onClick={() => {
                        const product = products.find(p => p.id === item.id);
                        handleRowClick(product);
                      }}
                    >
                      <TableCell className="font-mono text-blue-600 hover:underline">
                        {item.itemId}
                      </TableCell>
                      <TableCell className="font-medium">{item.description}</TableCell>
                      <TableCell className="text-right">{item.beginningBalance.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{item.unitsSold.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{item.unitsPurchased.toFixed(2)}</TableCell>
                      <TableCell className={`text-right font-semibold ${
                        item.quantityOnHand < 0 ? 'text-red-600' : 
                        item.quantityOnHand === 0 ? 'text-gray-500' : 
                        'text-gray-900'
                      }`}>
                        {item.quantityOnHand.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(item.value, baseCurrency)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              {inventoryData.length > 0 && (
                <TableBody>
                  <TableRow className="bg-gray-100 font-bold hover:bg-gray-100">
                    <TableCell colSpan={6} className="text-right">TOTAL:</TableCell>
                    <TableCell className="text-right text-blue-700">
                      {formatCurrency(totalValue, baseCurrency)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              )}
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Information */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 text-sm text-blue-900">
            <Package className="w-5 h-5" />
            <div>
              <p className="font-semibold">Inventory Summary</p>
              <p className="text-xs mt-1">
                This table shows real-time inventory movements. Value is calculated as Quantity × Cost Price. 
                Click any row to view or edit item details.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
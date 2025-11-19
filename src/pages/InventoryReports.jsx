import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Printer, FileSpreadsheet, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { useCompany } from "../components/auth/CompanyContext";
import ReportHeader from "../components/reports/ReportHeader";

export default function InventoryReports() {
  const [activeReport, setActiveReport] = useState("stock-status");
  const [dateRange, setDateRange] = useState("current-month");
  const { currentCompany } = useCompany();

  const { data: products = [] } = useQuery({
    queryKey: ['products', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.Product.filter({ company_id: currentCompany.id }) : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const { data: inventoryTransactions = [] } = useQuery({
    queryKey: ['inventory-transactions', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.InventoryTransaction.filter({ company_id: currentCompany.id }, 'transaction_date') : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const inventoryProducts = products.filter(p => p.product_type === 'inventory');

  // Calculate inventory values
  const totalInventoryValue = inventoryProducts.reduce((sum, p) => 
    sum + ((p.quantity_on_hand || 0) * (p.cost_price || 0)), 0
  );

  const lowStockItems = inventoryProducts.filter(p => 
    p.quantity_on_hand <= p.reorder_level
  );

  const handlePrint = () => window.print();

  const handleExportCSV = (data, fileName) => {
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(','));
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Screen Header */}
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Reports</h1>
          <p className="text-gray-500 mt-1">Comprehensive inventory analysis and reporting</p>
        </div>
        <div className="flex gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current-month">Current Month</SelectItem>
              <SelectItem value="current-quarter">Current Quarter</SelectItem>
              <SelectItem value="current-year">Current Year</SelectItem>
              <SelectItem value="ytd">Year to Date</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeReport} onValueChange={setActiveReport} className="print:hidden">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="stock-status">Stock Status</TabsTrigger>
          <TabsTrigger value="unit-activity">Unit Activity</TabsTrigger>
          <TabsTrigger value="valuation">Inventory Valuation</TabsTrigger>
        </TabsList>

        {/* STOCK STATUS REPORT */}
        <TabsContent value="stock-status" className="space-y-4">
          <div className="flex justify-end gap-2 print:hidden">
            <Button onClick={handlePrint} variant="outline" className="bg-blue-50 hover:bg-blue-100">
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button 
              onClick={() => handleExportCSV(
                inventoryProducts.map(p => ({
                  SKU: p.sku,
                  'Item Description': p.product_name,
                  'Item Class': p.category || 'Stock Item',
                  'Stocking UOM': p.unit_of_measure,
                  'Qty on Hand': p.quantity_on_hand || 0,
                  'Min Stock': p.reorder_level || 0,
                  'Reorder Qty': p.reorder_quantity || 0,
                  Location: 'Main'
                })),
                `Inventory_Stock_Status_${format(new Date(), 'yyyy-MM-dd')}.csv`
              )}
              variant="outline"
              className="bg-green-50 hover:bg-green-100"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>

          <div className="bg-white p-8 print:p-0">
            <ReportHeader 
              reportTitle="Inventory Stock Status Report"
              reportDate={format(new Date(), 'MMMM dd, yyyy')}
              additionalInfo="Filter Criteria Includes: 1) StockAssetType=Stocked, Report order is by ID. Report is printed with shortened descriptions"
            />

            <Table>
              <TableHeader>
                <TableRow className="border-b-2 border-gray-800">
                  <TableHead className="font-bold">Item ID<br/>Item Description<br/>Item Class</TableHead>
                  <TableHead className="font-bold text-center">Stocking UOM</TableHead>
                  <TableHead className="font-bold text-right">Qty on Hand</TableHead>
                  <TableHead className="font-bold text-right">Min Stock</TableHead>
                  <TableHead className="font-bold text-right">Reorder Qty</TableHead>
                  <TableHead className="font-bold text-center">Location</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No inventory items found
                    </TableCell>
                  </TableRow>
                ) : (
                  inventoryProducts.map((product) => (
                    <TableRow 
                      key={product.id}
                      className={product.quantity_on_hand <= product.reorder_level ? 'bg-red-50' : ''}
                    >
                      <TableCell>
                        <div>
                          <div className="font-semibold">{product.sku || product.id}</div>
                          <div>{product.product_name}</div>
                          <div className="text-sm text-gray-600">{product.category || 'Stock Item'}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{product.unit_of_measure || 'Each'}</TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        {(product.quantity_on_hand || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {(product.reorder_level || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {(product.reorder_quantity || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">Main</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {lowStockItems.length > 0 && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded print:hidden">
                <div className="flex items-center gap-2 text-red-800 font-semibold mb-2">
                  <AlertTriangle className="w-5 h-5" />
                  Low Stock Alert
                </div>
                <p className="text-red-700 text-sm">
                  {lowStockItems.length} item(s) are at or below reorder level and require attention.
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* UNIT ACTIVITY REPORT */}
        <TabsContent value="unit-activity" className="space-y-4">
          <div className="flex justify-end gap-2 print:hidden">
            <Button onClick={handlePrint} variant="outline" className="bg-blue-50 hover:bg-blue-100">
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button 
              onClick={() => {
                const activityData = inventoryProducts.map(p => {
                  const productTransactions = inventoryTransactions.filter(t => t.product_id === p.id);
                  const beginQty = productTransactions.find(t => t.transaction_type === 'opening_balance')?.quantity_in || 0;
                  const unitsSold = productTransactions
                    .filter(t => t.transaction_type === 'sale')
                    .reduce((sum, t) => sum + (t.quantity_out || 0), 0);
                  const unitsPurc = productTransactions
                    .filter(t => t.transaction_type === 'purchase')
                    .reduce((sum, t) => sum + (t.quantity_in || 0), 0);
                  const adjustQty = productTransactions
                    .filter(t => t.transaction_type === 'adjustment')
                    .reduce((sum, t) => sum + ((t.quantity_in || 0) - (t.quantity_out || 0)), 0);
                  const assemblyQty = productTransactions
                    .filter(t => t.transaction_type === 'assembly')
                    .reduce((sum, t) => sum + ((t.quantity_in || 0) - (t.quantity_out || 0)), 0);

                  return {
                    SKU: p.sku,
                    'Item Description': p.product_name,
                    'Item Class': p.category || 'Stock Item',
                    'Beg Qty': beginQty,
                    'Units Sold': unitsSold,
                    'Units Purc': unitsPurc,
                    'Adjust Qty': adjustQty,
                    'Assembly Qty': assemblyQty,
                    'Qty on Hand': p.quantity_on_hand || 0
                  };
                });

                handleExportCSV(activityData, `Inventory_Unit_Activity_${format(new Date(), 'yyyy-MM-dd')}.csv`);
              }}
              variant="outline"
              className="bg-green-50 hover:bg-green-100"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>

          <div className="bg-white p-8 print:p-0">
            <ReportHeader 
              reportTitle="Inventory Unit Activity Report"
              reportDate={`For the Period From ${format(new Date(), 'MMM d, yyyy')} to ${format(new Date(), 'MMM d, yyyy')}`}
              additionalInfo="Filter Criteria Includes: 1) StockAssetType=Stocked. Report order is by ID. Report is printed with shortened descriptions"
            />

            <Table>
              <TableHeader>
                <TableRow className="border-b-2 border-gray-800">
                  <TableHead className="font-bold">Item ID<br/>Item Description<br/>Item Class</TableHead>
                  <TableHead className="font-bold text-right">Beg Qty</TableHead>
                  <TableHead className="font-bold text-right">Units Sold</TableHead>
                  <TableHead className="font-bold text-right">Units Purc</TableHead>
                  <TableHead className="font-bold text-right">Adjust Qty</TableHead>
                  <TableHead className="font-bold text-right">Assembly Qty</TableHead>
                  <TableHead className="font-bold text-right">Qty on Hand</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No inventory activity found
                    </TableCell>
                  </TableRow>
                ) : (
                  inventoryProducts.map((product) => {
                    const productTransactions = inventoryTransactions.filter(t => t.product_id === product.id);
                    const beginQty = productTransactions.find(t => t.transaction_type === 'opening_balance')?.quantity_in || 0;
                    const unitsSold = productTransactions
                      .filter(t => t.transaction_type === 'sale')
                      .reduce((sum, t) => sum + (t.quantity_out || 0), 0);
                    const unitsPurc = productTransactions
                      .filter(t => t.transaction_type === 'purchase')
                      .reduce((sum, t) => sum + (t.quantity_in || 0), 0);
                    const adjustQty = productTransactions
                      .filter(t => t.transaction_type === 'adjustment')
                      .reduce((sum, t) => sum + ((t.quantity_in || 0) - (t.quantity_out || 0)), 0);
                    const assemblyQty = productTransactions
                      .filter(t => t.transaction_type === 'assembly')
                      .reduce((sum, t) => sum + ((t.quantity_in || 0) - (t.quantity_out || 0)), 0);

                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div>
                            <div className="font-semibold">{product.sku || product.id}</div>
                            <div>{product.product_name}</div>
                            <div className="text-sm text-gray-600">{product.category || 'Stock Item'}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">{beginQty.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-mono">{unitsSold.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-mono">{unitsPurc.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-mono">{adjustQty.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-mono">{assemblyQty.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-mono font-semibold">
                          {(product.quantity_on_hand || 0).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* INVENTORY VALUATION REPORT */}
        <TabsContent value="valuation" className="space-y-4">
          <div className="flex justify-end gap-2 print:hidden">
            <Button onClick={handlePrint} variant="outline" className="bg-blue-50 hover:bg-blue-100">
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button 
              onClick={() => handleExportCSV(
                inventoryProducts.map(p => ({
                  SKU: p.sku,
                  'Item Description': p.product_name,
                  'Qty on Hand': p.quantity_on_hand || 0,
                  'Unit Cost': p.cost_price || 0,
                  'Total Value': (p.quantity_on_hand || 0) * (p.cost_price || 0)
                })),
                `Inventory_Valuation_${format(new Date(), 'yyyy-MM-dd')}.csv`
              )}
              variant="outline"
              className="bg-green-50 hover:bg-green-100"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>

          <div className="bg-white p-8 print:p-0">
            <ReportHeader 
              reportTitle="Inventory Valuation Report"
              reportDate={`As of ${format(new Date(), 'MMMM dd, yyyy')}`}
              additionalInfo="Valuation Method: Weighted Average Cost"
            />

            <Table>
              <TableHeader>
                <TableRow className="border-b-2 border-gray-800">
                  <TableHead className="font-bold">Item ID / Description</TableHead>
                  <TableHead className="font-bold text-center">UOM</TableHead>
                  <TableHead className="font-bold text-right">Qty on Hand</TableHead>
                  <TableHead className="font-bold text-right">Unit Cost ($)</TableHead>
                  <TableHead className="font-bold text-right">Total Value ($)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No inventory items found
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {inventoryProducts.map((product) => {
                      const qty = product.quantity_on_hand || 0;
                      const cost = product.cost_price || 0;
                      const totalValue = qty * cost;

                      return (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div className="font-semibold">{product.sku || product.id}</div>
                            <div>{product.product_name}</div>
                          </TableCell>
                          <TableCell className="text-center">{product.unit_of_measure || 'Each'}</TableCell>
                          <TableCell className="text-right font-mono">{qty.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-mono">{cost.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-mono font-semibold">
                            {totalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow className="border-t-2 border-gray-800 bg-gray-100 font-bold">
                      <TableCell colSpan={4} className="text-right text-lg">TOTAL INVENTORY VALUE:</TableCell>
                      <TableCell className="text-right text-lg font-mono">
                        ${totalInventoryValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
              <h3 className="font-semibold text-blue-900 mb-2">Valuation Summary</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-blue-700">Total Items:</p>
                  <p className="font-semibold text-blue-900">{inventoryProducts.length}</p>
                </div>
                <div>
                  <p className="text-blue-700">Total Units:</p>
                  <p className="font-semibold text-blue-900">
                    {inventoryProducts.reduce((sum, p) => sum + (p.quantity_on_hand || 0), 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-blue-700">Total Value:</p>
                  <p className="font-semibold text-blue-900">
                    ${totalInventoryValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
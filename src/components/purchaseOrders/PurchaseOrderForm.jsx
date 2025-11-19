
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Save, X, Printer } from "lucide-react";
import { format } from "date-fns";
import { useCompany } from "../auth/CompanyContext";
import PurchaseOrderPrintTemplate from "../print/PurchaseOrderPrintTemplate";

export default function PurchaseOrderForm({ purchaseOrder, onClose }) {
  const { currentCompany } = useCompany();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    po_number: purchaseOrder?.po_number || `PO-${Date.now()}`,
    vendor_id: purchaseOrder?.vendor_id || '',
    po_date: purchaseOrder?.po_date || format(new Date(), 'yyyy-MM-dd'),
    expected_delivery_date: purchaseOrder?.expected_delivery_date || format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    currency: purchaseOrder?.currency || currentCompany?.base_currency || 'USD',
    exchange_rate: purchaseOrder?.exchange_rate || 1,
    line_items: purchaseOrder?.line_items || [],
    notes: purchaseOrder?.notes || '',
    status: purchaseOrder?.status || 'draft'
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.Vendor.filter({ company_id: currentCompany.id }) : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.Product.filter({ company_id: currentCompany.id }) : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const { data: exchangeRates = [] } = useQuery({
    queryKey: ['exchange-rates', currentCompany?.id],
    queryFn: () => currentCompany 
      ? base44.entities.ExchangeRate.filter({ company_id: currentCompany.id }, '-effective_date') 
      : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const getCurrentExchangeRate = (currency) => {
    if (currency === (currentCompany?.base_currency || 'USD')) return 1;
    
    const latestRate = exchangeRates
      .filter(r => 
        r.from_currency === (currentCompany?.base_currency || 'USD') && 
        r.to_currency === currency &&
        new Date(r.effective_date) <= new Date(formData.po_date)
      )
      .sort((a, b) => new Date(b.effective_date) - new Date(a.effective_date))[0];
    
    return latestRate?.exchange_rate || 1;
  };

  const handleCurrencyChange = (currency) => {
    const rate = getCurrentExchangeRate(currency);
    setFormData({ ...formData, currency, exchange_rate: rate });
  };

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const vendor = vendors.find(v => v.id === data.vendor_id);
      
      const subtotal = data.line_items.reduce((sum, item) => sum + (item.line_total || 0), 0);
      const taxTotal = data.line_items.reduce((sum, item) => sum + (item.tax_amount || 0), 0);
      const total = subtotal + taxTotal;
      const totalBaseCurrency = total / data.exchange_rate;

      const poData = {
        company_id: currentCompany.id,
        po_number: data.po_number,
        vendor_id: data.vendor_id,
        vendor_name: vendor?.company_name,
        po_date: data.po_date,
        expected_delivery_date: data.expected_delivery_date,
        currency: data.currency,
        exchange_rate: data.exchange_rate,
        status: data.status,
        line_items: data.line_items,
        subtotal,
        tax_total: taxTotal,
        total_amount: total,
        total_amount_base_currency: totalBaseCurrency,
        notes: data.notes
      };

      if (purchaseOrder) {
        return await base44.entities.PurchaseOrder.update(purchaseOrder.id, poData);
      }

      return await base44.entities.PurchaseOrder.create(poData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['purchase-orders']);
      onClose();
    }
  });

  const addLineItem = () => {
    setFormData({
      ...formData,
      line_items: [
        ...formData.line_items,
        { product_id: '', description: '', quantity_ordered: 1, unit_cost: 0, tax_rate: 0, tax_amount: 0, line_total: 0 }
      ]
    });
  };

  const updateLineItem = (index, field, value) => {
    const newLineItems = [...formData.line_items];
    newLineItems[index][field] = value;

    if (field === 'product_id') {
      const product = products.find(p => p.id === value);
      if (product) {
        newLineItems[index].description = product.product_name;
        newLineItems[index].unit_cost = product.cost_price || product.unit_price;
        newLineItems[index].tax_rate = product.tax_rate || 0;
      }
    }

    if (['quantity_ordered', 'unit_cost', 'tax_rate'].includes(field)) {
      const qty = parseFloat(newLineItems[index].quantity_ordered) || 0;
      const cost = parseFloat(newLineItems[index].unit_cost) || 0;
      const taxRate = parseFloat(newLineItems[index].tax_rate) || 0;
      const lineTotal = qty * cost;
      const taxAmount = lineTotal * (taxRate / 100);
      newLineItems[index].line_total = lineTotal;
      newLineItems[index].tax_amount = taxAmount;
    }

    setFormData({ ...formData, line_items: newLineItems });
  };

  const removeLineItem = (index) => {
    setFormData({
      ...formData,
      line_items: formData.line_items.filter((_, i) => i !== index)
    });
  };

  const subtotal = formData.line_items.reduce((sum, item) => sum + (item.line_total || 0), 0);
  const taxTotal = formData.line_items.reduce((sum, item) => sum + (item.tax_amount || 0), 0);
  const total = subtotal + taxTotal;
  const totalBaseCurrency = total / formData.exchange_rate;

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Print Template - ONLY visible when printing */}
      <PurchaseOrderPrintTemplate 
        purchaseOrder={{
          ...formData,
          subtotal,
          tax_total: taxTotal,
          total_amount: total,
          vendor: vendors.find(v => v.id === formData.vendor_id)
        }}
        company={currentCompany}
      />

      {/* Screen View - HIDDEN when printing */}
      <Card className="fixed inset-4 z-50 overflow-auto bg-white print:hidden">
        <CardHeader className="bg-gradient-to-r from-green-600 to-teal-600 text-white">
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl">
              {purchaseOrder ? 'Edit Purchase Order' : 'Create Purchase Order'}
            </CardTitle>
            <Button variant="ghost" onClick={onClose} className="text-white hover:bg-white/20">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(formData); }} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>PO Number</Label>
                <Input
                  value={formData.po_number}
                  onChange={(e) => setFormData({ ...formData, po_number: e.target.value })}
                  disabled
                />
              </div>

              <div>
                <Label>Vendor *</Label>
                <Select
                  value={formData.vendor_id}
                  onValueChange={(value) => setFormData({ ...formData, vendor_id: value })}
                  required
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

              <div>
                <Label>PO Date</Label>
                <Input
                  type="date"
                  value={formData.po_date}
                  onChange={(e) => setFormData({ ...formData, po_date: e.target.value })}
                />
              </div>

              <div>
                <Label>Expected Delivery</Label>
                <Input
                  type="date"
                  value={formData.expected_delivery_date}
                  onChange={(e) => setFormData({ ...formData, expected_delivery_date: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={handleCurrencyChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    <SelectItem value="NGN">NGN - Nigerian Naira</SelectItem>
                    <SelectItem value="ZAR">ZAR - South African Rand</SelectItem>
                    <SelectItem value="KES">KES - Kenyan Shilling</SelectItem>
                    <SelectItem value="GHS">GHS - Ghanaian Cedi</SelectItem>
                  </SelectContent>
                </Select>
                {formData.currency !== (currentCompany?.base_currency || 'USD') && (
                  <p className="text-xs text-gray-500 mt-1">
                    Rate: 1 {currentCompany?.base_currency} = {formData.exchange_rate.toFixed(4)} {formData.currency}
                  </p>
                )}
              </div>

              <div>
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <Label className="text-lg">Line Items</Label>
                <Button type="button" onClick={addLineItem} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Line
                </Button>
              </div>

              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Unit Cost</TableHead>
                      <TableHead>Tax %</TableHead>
                      <TableHead>Line Total</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.line_items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Select
                            value={item.product_id}
                            onValueChange={(value) => updateLineItem(index, 'product_id', value)}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map(product => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.product_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.description}
                            onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                            className="w-48"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.quantity_ordered}
                            onChange={(e) => updateLineItem(index, 'quantity_ordered', e.target.value)}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.unit_cost}
                            onChange={(e) => updateLineItem(index, 'unit_cost', e.target.value)}
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.1"
                            value={item.tax_rate}
                            onChange={(e) => updateLineItem(index, 'tax_rate', e.target.value)}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formData.currency} {((item.line_total || 0) + (item.tax_amount || 0)).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeLineItem(index)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end mt-4">
                <div className="w-80 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span className="font-semibold">{formData.currency} {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax:</span>
                    <span className="font-semibold">{formData.currency} {taxTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total ({formData.currency}):</span>
                    <span className="text-green-600">{formData.currency} {total.toFixed(2)}</span>
                  </div>
                  {formData.currency !== (currentCompany?.base_currency || 'USD') && (
                    <div className="flex justify-between text-sm text-gray-600 border-t pt-2">
                      <span>Total ({currentCompany?.base_currency}):</span>
                      <span className="font-semibold">{currentCompany?.base_currency} {totalBaseCurrency.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Print Preview
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending} className="bg-green-600 hover:bg-green-700">
                <Save className="w-4 h-4 mr-2" />
                {purchaseOrder ? 'Update PO' : 'Create PO'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}

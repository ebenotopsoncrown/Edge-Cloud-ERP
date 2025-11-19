
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { X, Save, Package } from "lucide-react";
import { format } from "date-fns";
import { useCompany } from "../auth/CompanyContext";

export default function ReceiveInventoryForm({ onClose, pendingPOs = [] }) {
  const { currentCompany } = useCompany();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [selectedPOId, setSelectedPOId] = useState("");
  const [receiveItems, setReceiveItems] = useState([]);

  const [formData, setFormData] = useState({
    company_id: currentCompany?.id || '',
    receipt_number: `RCV-${Date.now()}`,
    receipt_date: format(new Date(), 'yyyy-MM-dd'),
    vendor_id: '',
    vendor_name: '',
    po_id: '',
    po_number: '',
    location_id: '',
    ap_account_id: '',
    status: 'draft',
    line_items: [],
    subtotal: 0,
    tax_total: 0,
    total_amount: 0,
    notes: ''
  });

  // Fetch vendors
  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.Vendor.filter({ company_id: currentCompany.id }) : [],
    enabled: !!currentCompany
  });

  // Fetch vendor POs
  const { data: vendorPOs = [] } = useQuery({
    queryKey: ['vendor-pos', selectedVendorId],
    queryFn: () => selectedVendorId ? base44.entities.PurchaseOrder.filter({
      company_id: currentCompany.id,
      vendor_id: selectedVendorId,
      status: ['sent', 'acknowledged', 'partially_received']
    }) : [],
    enabled: !!selectedVendorId
  });

  // Fetch selected PO details
  const { data: selectedPO } = useQuery({
    queryKey: ['po-details', selectedPOId],
    queryFn: () => selectedPOId ? base44.entities.PurchaseOrder.get(selectedPOId) : null,
    enabled: !!selectedPOId
  });

  // Fetch accounts
  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.Account.filter({ company_id: currentCompany.id }) : [],
    enabled: !!currentCompany
  });

  // Fetch locations
  const { data: locations = [] } = useQuery({
    queryKey: ['locations', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.InventoryLocation.filter({ company_id: currentCompany.id }) : [],
    enabled: !!currentCompany
  });

  // Filter AP accounts
  const apAccounts = accounts.filter(a =>
    a.account_type === 'liability' && a.account_name?.toLowerCase().includes('payable')
  );

  // Filter inventory accounts
  const inventoryAccounts = accounts.filter(a =>
    a.account_type === 'asset' && a.account_name?.toLowerCase().includes('inventory')
  );

  // Load PO details when selected - FIXED: Remove inventoryAccounts dependency
  useEffect(() => {
    if (selectedPO && receiveItems.length === 0) {
      const items = selectedPO.line_items.map(item => ({
        ...item,
        quantity_remaining: item.quantity_ordered - (item.quantity_received || 0),
        quantity_received_now: 0,
        gl_account_id: inventoryAccounts[0]?.id || ''
      }));

      setReceiveItems(items);
      setFormData(prev => ({
        ...prev,
        po_id: selectedPO.id,
        po_number: selectedPO.po_number,
        vendor_id: selectedPO.vendor_id,
        vendor_name: selectedPO.vendor_name
      }));
    }
  }, [selectedPO]); // Removed inventoryAccounts from dependency array

  const handleVendorChange = (vendorId) => {
    const vendor = vendors.find(v => v.id === vendorId);
    setSelectedVendorId(vendorId);
    setSelectedPOId("");
    setReceiveItems([]);
    setFormData(prev => ({
      ...prev,
      vendor_id: vendorId,
      vendor_name: vendor?.company_name || ''
    }));
  };

  const handlePOChange = (poId) => {
    setSelectedPOId(poId);
  };

  const updateReceivedQuantity = (index, quantity) => {
    const newItems = [...receiveItems];
    const item = newItems[index];
    
    // CRITICAL FIX: Handle empty string and parse properly
    const inputValue = quantity === '' ? 0 : parseFloat(quantity);
    const qty = Math.min(Math.max(0, inputValue || 0), item.quantity_remaining);
    
    newItems[index] = {
      ...item,
      quantity_received_now: qty
    };
    
    setReceiveItems(newItems);
    calculateTotals(newItems);
  };

  const calculateTotals = (items) => {
    const lineItems = items
      .filter(item => item.quantity_received_now > 0)
      .map(item => {
        const lineSubtotal = item.quantity_received_now * item.unit_cost;
        const taxAmount = (lineSubtotal * (item.tax_rate || 0)) / 100;
        return {
          ...item,
          quantity: item.quantity_received_now,
          tax_amount: taxAmount,
          line_total: lineSubtotal + taxAmount
        };
      });

    const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity_received_now * item.unit_cost), 0);
    const tax_total = lineItems.reduce((sum, item) => sum + (item.tax_amount || 0), 0);
    const total = subtotal + tax_total;

    setFormData(prev => ({
      ...prev,
      line_items: lineItems,
      subtotal,
      tax_total,
      total_amount: total
    }));
  };

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      setIsLoading(true);

      if (data.line_items.length === 0) {
        throw new Error('Please enter at least one item to receive');
      }

      // CRITICAL: Change status to 'received' instead of 'draft'
      const receiptData = {
        ...data,
        status: 'received'
      };

      const savedReceipt = await base44.entities.InventoryReceipt.create(receiptData);

      console.log('📦 PROCESSING INVENTORY RECEIPT');
      console.log('Receipt:', savedReceipt.receipt_number);
      console.log('Total Amount:', data.total_amount);

      // Find accounts
      const apAccount = accounts.find(a => a.id === data.ap_account_id) ||
                       accounts.find(a => 
                         a.account_type === 'liability' && 
                         a.account_name?.toLowerCase().includes('payable')
                       );

      const inventoryAccount = accounts.find(a => 
        a.account_type === 'asset' && 
        (a.account_name?.toLowerCase().includes('inventory') || a.account_code?.startsWith('13'))
      );

      if (!apAccount || !inventoryAccount) {
        throw new Error('Required GL accounts not found. Please check your Chart of Accounts setup.');
      }

      // CRITICAL: Create a Bill to track the payable
      console.log('\n📄 Creating Bill for Accounts Payable tracking...');
      
      const billData = {
        company_id: data.company_id,
        bill_number: `BILL-${savedReceipt.receipt_number}`,
        vendor_id: data.vendor_id,
        vendor_name: data.vendor_name,
        bill_date: data.receipt_date,
        due_date: data.receipt_date, // You can calculate based on payment terms
        status: 'pending',
        currency: currentCompany?.base_currency || 'USD',
        exchange_rate: 1,
        ap_account_id: apAccount.id,
        expense_account_id: inventoryAccount.id, // For P&L reports, but inventory is asset, so it's not really an expense here
        line_items: data.line_items.map(item => ({
          product_id: item.product_id,
          description: item.description,
          quantity: item.quantity,
          unit_cost: item.unit_cost,
          tax_rate: item.tax_rate || 0,
          tax_amount: item.tax_amount || 0,
          line_total: item.line_total,
          gl_account_id: inventoryAccount.id // Points to inventory asset account
        })),
        subtotal: data.subtotal,
        tax_total: data.tax_total,
        total_amount: data.total_amount,
        total_amount_base_currency: data.total_amount,
        amount_paid: 0,
        amount_paid_base_currency: 0,
        balance_due: data.total_amount,
        balance_due_base_currency: data.total_amount,
        reference: savedReceipt.receipt_number,
        notes: `Auto-created from Inventory Receipt ${savedReceipt.receipt_number}`
      };

      const savedBill = await base44.entities.Bill.create(billData);
      console.log(`✅ Bill created: ${savedBill.bill_number}`);

      // Update the receipt with bill reference
      await base44.entities.InventoryReceipt.update(savedReceipt.id, {
        bill_id: savedBill.id,
        bill_number: savedBill.bill_number
      });

      // Update vendor's total_outstanding
      try {
        const vendor = await base44.entities.Vendor.get(data.vendor_id);
        const currentOutstanding = parseFloat(vendor.total_outstanding) || 0;
        await base44.entities.Vendor.update(vendor.id, {
          total_outstanding: currentOutstanding + data.total_amount
        });
        console.log(`✅ Updated vendor outstanding: ${currentOutstanding} + ${data.total_amount} = ${currentOutstanding + data.total_amount}`);
      } catch (vendorError) {
        console.warn('Could not update vendor outstanding:', vendorError);
      }

      // Journal Entry: DR Inventory, CR Accounts Payable
      console.log('\n📝 JOURNAL ENTRY: Recording Inventory Receipt');

      const journalLines = [
        {
          account_id: inventoryAccount.id,
          account_name: inventoryAccount.account_name,
          account_code: inventoryAccount.account_code,
          description: `Inventory received - ${savedReceipt.receipt_number}`,
          debit: data.subtotal,
          credit: 0
        },
        {
          account_id: apAccount.id,
          account_name: apAccount.account_name,
          account_code: apAccount.account_code,
          description: `Purchase from ${data.vendor_name} - ${savedReceipt.receipt_number}`,
          debit: 0,
          credit: data.subtotal
        }
      ];

      console.log(`   DR: Inventory ${data.subtotal.toLocaleString()}`);
      console.log(`   CR: Accounts Payable ${data.subtotal.toLocaleString()}`);

      const journalEntry = {
        company_id: data.company_id,
        entry_number: `JE-RCV-${savedReceipt.id}`,
        entry_date: data.receipt_date,
        reference: savedReceipt.receipt_number,
        source_type: 'inventory_receipt',
        source_id: savedReceipt.id,
        description: `Goods received - ${savedReceipt.receipt_number} from ${data.vendor_name}`,
        status: 'posted',
        line_items: journalLines,
        total_debits: data.subtotal,
        total_credits: data.subtotal,
        posted_by: 'system',
        posted_date: new Date().toISOString()
      };

      const je = await base44.entities.JournalEntry.create(journalEntry);
      console.log(`✅ Journal Entry posted: ${je.entry_number}`);

      // Update account balances
      const invCurrentBalance = parseFloat(inventoryAccount.balance) || 0;
      await base44.entities.Account.update(inventoryAccount.id, {
        balance: invCurrentBalance + data.subtotal,
        company_id: inventoryAccount.company_id
      });
      console.log(`   Posted to ${inventoryAccount.account_name}: +${data.subtotal.toLocaleString()}`);

      const apCurrentBalance = parseFloat(apAccount.balance) || 0;
      await base44.entities.Account.update(apAccount.id, {
        balance: apCurrentBalance + data.subtotal,
        company_id: apAccount.company_id
      });
      console.log(`   Posted to ${apAccount.account_name}: +${data.subtotal.toLocaleString()}`);

      // Link journal entry to bill
      await base44.entities.Bill.update(savedBill.id, {
        journal_entry_id: je.id
      });

      // Update inventory quantities and create transactions
      console.log('\n📦 Updating inventory...');
      
      for (const item of data.line_items) {
        if (item.product_id) {
          try {
            const product = await base44.entities.Product.get(item.product_id);
            
            if (product && product.product_type === 'inventory') {
              const newQty = (product.quantity_on_hand || 0) + item.quantity;
              await base44.entities.Product.update(product.id, {
                quantity_on_hand: newQty
              });
              
              console.log(`   ${product.product_name}: ${product.quantity_on_hand} + ${item.quantity} = ${newQty}`);

              // Create inventory transaction
              const inventoryTransaction = {
                company_id: data.company_id,
                transaction_number: `RCV-${savedReceipt.receipt_number}-${item.product_id}`,
                transaction_date: data.receipt_date,
                transaction_type: 'purchase',
                product_id: product.id,
                product_name: product.product_name,
                sku: product.sku,
                location_id: data.location_id,
                quantity_in: item.quantity,
                quantity_out: 0,
                unit_cost: item.unit_cost,
                total_value: item.quantity * item.unit_cost,
                reference_type: 'inventory_receipt',
                reference_id: savedReceipt.id,
                reference_number: savedReceipt.receipt_number,
                notes: `Received via ${savedReceipt.receipt_number}`,
                journal_entry_id: je.id
              };

              await base44.entities.InventoryTransaction.create(inventoryTransaction);
            }
          } catch (error) {
            console.warn(`Could not update inventory for product ${item.product_id}:`, error);
          }
        }
      }

      // Update PO status if linked
      if (data.po_id) {
        console.log('\n🔄 Updating Purchase Order status...');
        const po = await base44.entities.PurchaseOrder.get(data.po_id);
        
        // Update PO line items with received quantities
        const updatedPOLineItems = po.line_items.map(poItem => {
          const receivedItem = data.line_items.find(ri => ri.product_id === poItem.product_id);
          if (receivedItem) {
            return {
              ...poItem,
              quantity_received: (poItem.quantity_received || 0) + receivedItem.quantity
            };
          }
          return poItem;
        });

        // Determine PO status
        const allFullyReceived = updatedPOLineItems.every(item => 
          item.quantity_received >= item.quantity_ordered
        );
        const someReceived = updatedPOLineItems.some(item => 
          item.quantity_received > 0
        );

        let newStatus = po.status;
        if (allFullyReceived) {
          newStatus = 'fully_received';
          console.log('   ✅ PO fully received');
        } else if (someReceived) {
          newStatus = 'partially_received';
          console.log('   ⚠️ PO partially received');
        }

        await base44.entities.PurchaseOrder.update(data.po_id, {
          line_items: updatedPOLineItems,
          status: newStatus
        });
      }

      console.log('\n✅ INVENTORY RECEIPT PROCESSED SUCCESSFULLY');
      console.log(`✅ Bill ${savedBill.bill_number} created and linked`);
      console.log(`✅ Vendor outstanding updated`);

      return savedReceipt;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['inventory-receipts']);
      queryClient.invalidateQueries(['purchase-orders']);
      queryClient.invalidateQueries(['bills']); // New: Invalidate bills query
      queryClient.invalidateQueries(['vendors']); // New: Invalidate vendors query
      queryClient.invalidateQueries(['accounts']);
      queryClient.invalidateQueries(['journal-entries']);
      queryClient.invalidateQueries(['products']);
      queryClient.invalidateQueries(['inventory-transactions']);
      setIsLoading(false);
      alert('✅ Inventory received successfully!\n\n✓ Inventory Receipt created\n✓ Bill created for payment tracking\n✓ Vendor balance updated\n✓ Journal entries posted\n✓ Inventory quantities updated');
      onClose();
    },
    onError: (error) => {
      console.error('Error processing receipt:', error);
      alert('Error processing receipt: ' + error.message);
      setIsLoading(false);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.vendor_id) {
      alert('Please select a vendor');
      return;
    }

    if (!formData.ap_account_id) {
      alert('Please select an A/P account');
      return;
    }

    if (!formData.location_id) {
      alert('Please select a receiving location');
      return;
    }

    if (formData.line_items.length === 0) {
      alert('Please enter quantities to receive');
      return;
    }

    saveMutation.mutate(formData);
  };

  return (
    <Card className="fixed inset-4 z-50 overflow-auto bg-white shadow-2xl">
      <CardHeader className="border-b sticky top-0 bg-white z-10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">Purchases / Receive Inventory</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Vendor *</Label>
              <Select value={selectedVendorId} onValueChange={handleVendorChange}>
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
              <Label>Receipt Date</Label>
              <Input
                type="date"
                value={formData.receipt_date}
                onChange={(e) => setFormData(prev => ({ ...prev, receipt_date: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>A/P Account *</Label>
              <Select 
                value={formData.ap_account_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, ap_account_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select A/P account" />
                </SelectTrigger>
                <SelectContent>
                  {apAccounts.map(account => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.account_code} - {account.account_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* PO Selection */}
          {selectedVendorId && vendorPOs.length > 0 && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <Label className="text-blue-900 font-semibold">Apply to Purchase Order</Label>
              <Select value={selectedPOId} onValueChange={handlePOChange}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select PO (or leave blank for direct entry)" />
                </SelectTrigger>
                <SelectContent>
                  {vendorPOs.map(po => (
                    <SelectItem key={po.id} value={po.id}>
                      {po.po_number} - ${po.total_amount.toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Location */}
          <div className="space-y-2">
            <Label>Receiving Location *</Label>
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
          </div>

          {/* Line Items */}
          {receiveItems.length > 0 && (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-4">Items to Receive</h3>
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100">
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                    <TableHead>U/M</TableHead>
                    <TableHead className="text-right">Received</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>GL Account</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receiveItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-sm">{item.sku || item.product_id?.substring(0, 8)}</TableCell>
                      <TableCell className="text-right font-semibold">{item.quantity_remaining.toFixed(2)}</TableCell>
                      <TableCell>Each</TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min="0"
                          max={item.quantity_remaining}
                          step="0.01"
                          value={item.quantity_received_now || ''}
                          onChange={(e) => updateReceivedQuantity(index, e.target.value)}
                          onFocus={(e) => e.target.select()}
                          className="w-24 text-right"
                          placeholder="0.00"
                        />
                      </TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>
                        <Select
                          value={item.gl_account_id}
                          onValueChange={(value) => {
                            const newItems = [...receiveItems];
                            newItems[index] = {
                              ...newItems[index],
                              gl_account_id: value
                            };
                            setReceiveItems(newItems);
                          }}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {inventoryAccounts.map(account => (
                              <SelectItem key={account.id} value={account.id}>
                                {account.account_code}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">${item.unit_cost.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-semibold">
                        ${((item.quantity_received_now || 0) * item.unit_cost).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex justify-end mt-4">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-semibold">${formData.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span className="font-semibold">${formData.tax_total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Invoice Total:</span>
                    <span className="text-blue-600">${formData.total_amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || formData.line_items.length === 0}>
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? 'Processing...' : 'Receive Items'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

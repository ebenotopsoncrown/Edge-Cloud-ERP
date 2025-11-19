import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { X, Save } from "lucide-react";
import { format } from "date-fns";
import { useCompany } from "../auth/CompanyContext";

export default function SalesReturnForm({ onClose }) {
  const { currentCompany } = useCompany();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [returnItems, setReturnItems] = useState([]);

  const [formData, setFormData] = useState({
    company_id: currentCompany?.id || '',
    return_number: '',
    customer_id: '',
    customer_name: '',
    invoice_id: '',
    invoice_number: '',
    return_date: format(new Date(), 'yyyy-MM-dd'),
    status: 'draft',
    return_reason: '',
    line_items: [],
    subtotal: 0,
    tax_total: 0,
    total_amount: 0,
    notes: ''
  });

  // Fetch customers
  const { data: customers = [] } = useQuery({
    queryKey: ['customers', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.Customer.filter({ company_id: currentCompany.id }) : [],
    enabled: !!currentCompany
  });

  // Fetch invoices for selected customer
  const { data: customerInvoices = [] } = useQuery({
    queryKey: ['invoices-for-customer', selectedCustomerId],
    queryFn: () => selectedCustomerId ? base44.entities.Invoice.filter({ 
      company_id: currentCompany.id,
      customer_id: selectedCustomerId,
      status: ['paid', 'partial']
    }) : [],
    enabled: !!selectedCustomerId
  });

  // Fetch selected invoice details
  const { data: selectedInvoice } = useQuery({
    queryKey: ['invoice-details', selectedInvoiceId],
    queryFn: () => selectedInvoiceId ? base44.entities.Invoice.get(selectedInvoiceId) : null,
    enabled: !!selectedInvoiceId
  });

  // Fetch accounts
  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.Account.filter({ company_id: currentCompany.id }) : [],
    enabled: !!currentCompany
  });

  // Load invoice details when selected
  useEffect(() => {
    if (selectedInvoice) {
      const items = selectedInvoice.line_items.map(item => ({
        ...item,
        quantity_returned: 0,
        original_quantity: item.quantity,
        max_returnable: item.quantity
      }));

      setReturnItems(items);
      setFormData(prev => ({
        ...prev,
        invoice_id: selectedInvoice.id,
        invoice_number: selectedInvoice.invoice_number,
        customer_id: selectedInvoice.customer_id,
        customer_name: selectedInvoice.customer_name,
        line_items: []
      }));
    }
  }, [selectedInvoice]);

  const handleCustomerChange = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    setSelectedCustomerId(customerId);
    setSelectedInvoiceId("");
    setReturnItems([]);
    setFormData(prev => ({
      ...prev,
      customer_id: customerId,
      customer_name: customer?.company_name || ''
    }));
  };

  const handleInvoiceChange = (invoiceId) => {
    setSelectedInvoiceId(invoiceId);
  };

  const updateReturnQuantity = (index, quantity) => {
    const newItems = [...returnItems];
    const item = newItems[index];
    
    // Validate quantity
    const qty = Math.min(Math.max(0, parseFloat(quantity) || 0), item.original_quantity);
    newItems[index].quantity_returned = qty;
    
    setReturnItems(newItems);
    calculateTotals(newItems);
  };

  const calculateTotals = (items) => {
    const lineItems = items
      .filter(item => item.quantity_returned > 0)
      .map(item => {
        const lineSubtotal = item.quantity_returned * item.unit_price;
        const taxAmount = (lineSubtotal * (item.tax_rate || 0)) / 100;
        return {
          ...item,
          tax_amount: taxAmount,
          line_total: lineSubtotal + taxAmount
        };
      });

    const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity_returned * item.unit_price), 0);
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
        throw new Error('Please enter at least one item to return');
      }

      // Generate return number
      const returnNumber = `CR-${Date.now()}`;
      const returnData = {
        ...data,
        return_number: returnNumber,
        status: 'completed'
      };

      const savedReturn = await base44.entities.SalesReturn.create(returnData);

      console.log('📦 POSTING SALES RETURN JOURNAL ENTRIES');
      console.log('Credit Memo:', savedReturn.return_number);
      console.log('Total Return Amount:', data.total_amount);

      // Find accounts
      const arAccount = accounts.find(a => 
        a.account_type === 'asset' && a.account_name?.toLowerCase().includes('receivable')
      );
      const revenueAccount = accounts.find(a => a.account_type === 'revenue');
      const inventoryAccount = accounts.find(a => 
        a.account_type === 'asset' && a.account_name?.toLowerCase().includes('inventory')
      );
      const cogsAccount = accounts.find(a => a.account_type === 'cost_of_goods_sold');

      // JOURNAL ENTRY 1: Reverse the Sale
      // DR: Sales Revenue (reduce revenue)
      // CR: Accounts Receivable (reduce customer balance)
      console.log('\n📝 JOURNAL ENTRY 1: Reversing the Sale');

      const journalLines1 = [
        {
          account_id: revenueAccount.id,
          account_name: revenueAccount.account_name,
          account_code: revenueAccount.account_code,
          description: `Sales Return ${savedReturn.return_number} - ${data.customer_name}`,
          debit: data.subtotal,
          credit: 0
        },
        {
          account_id: arAccount.id,
          account_name: arAccount.account_name,
          account_code: arAccount.account_code,
          description: `Credit Memo ${savedReturn.return_number}`,
          debit: 0,
          credit: data.subtotal
        }
      ];

      console.log(`   DR: Sales Revenue ₦${data.subtotal.toLocaleString()}`);
      console.log(`   CR: Accounts Receivable ₦${data.subtotal.toLocaleString()}`);

      const journalEntry1 = {
        company_id: data.company_id,
        entry_number: `JE-CR-${savedReturn.id}`,
        entry_date: data.return_date,
        reference: savedReturn.return_number,
        source_type: 'sales_return',
        source_id: savedReturn.id,
        description: `Sales Return ${savedReturn.return_number} - ${data.customer_name}`,
        status: 'posted',
        line_items: journalLines1,
        total_debits: data.subtotal,
        total_credits: data.subtotal,
        posted_by: 'system',
        posted_date: new Date().toISOString()
      };

      const je1 = await base44.entities.JournalEntry.create(journalEntry1);
      console.log(`✅ Journal Entry 1 posted: ${je1.entry_number}`);

      // Update account balances
      const revCurrentBalance = parseFloat(revenueAccount.balance) || 0;
      await base44.entities.Account.update(revenueAccount.id, {
        balance: revCurrentBalance - data.subtotal,
        company_id: revenueAccount.company_id
      });

      const arCurrentBalance = parseFloat(arAccount.balance) || 0;
      await base44.entities.Account.update(arAccount.id, {
        balance: arCurrentBalance - data.subtotal,
        company_id: arAccount.company_id
      });

      // JOURNAL ENTRY 2: Restore Inventory and Reverse COGS
      // DR: Inventory (restore inventory)
      // CR: Cost of Sales (reduce COGS)
      console.log('\n📝 JOURNAL ENTRY 2: Restoring Inventory and Reversing COGS');

      let totalCOGS = 0;

      for (const item of data.line_items) {
        if (item.product_id) {
          try {
            const product = await base44.entities.Product.get(item.product_id);
            
            if (product && product.product_type === 'inventory') {
              const itemCOGS = item.quantity_returned * (product.cost_price || 0);
              totalCOGS += itemCOGS;

              // Restore inventory quantity
              const newQty = (product.quantity_on_hand || 0) + item.quantity_returned;
              await base44.entities.Product.update(product.id, {
                quantity_on_hand: newQty
              });

              console.log(`   ${product.product_name}: Returned ${item.quantity_returned} units`);
              console.log(`   Inventory restored: ${product.quantity_on_hand} → ${newQty}`);

              // Create inventory transaction
              const inventoryTransaction = {
                company_id: data.company_id,
                transaction_number: `RET-${savedReturn.return_number}-${item.product_id}`,
                transaction_date: data.return_date,
                transaction_type: 'return',
                product_id: product.id,
                product_name: product.product_name,
                sku: product.sku,
                location_id: product.location_id,
                quantity_in: item.quantity_returned,
                quantity_out: 0,
                unit_cost: product.cost_price,
                total_value: itemCOGS,
                reference_type: 'sales_return',
                reference_id: savedReturn.id,
                reference_number: savedReturn.return_number,
                notes: `Returned via Credit Memo ${savedReturn.return_number}`
              };

              await base44.entities.InventoryTransaction.create(inventoryTransaction);
            }
          } catch (error) {
            console.warn(`Could not process return for product ${item.product_id}:`, error);
          }
        }
      }

      if (totalCOGS > 0 && inventoryAccount && cogsAccount) {
        console.log(`\n   Total COGS Reversal: ₦${totalCOGS.toLocaleString()}`);

        const journalLines2 = [
          {
            account_id: inventoryAccount.id,
            account_name: inventoryAccount.account_name,
            account_code: inventoryAccount.account_code,
            description: `Inventory restored - ${savedReturn.return_number}`,
            debit: totalCOGS,
            credit: 0
          },
          {
            account_id: cogsAccount.id,
            account_name: cogsAccount.account_name,
            account_code: cogsAccount.account_code,
            description: `COGS reversal - ${savedReturn.return_number}`,
            debit: 0,
            credit: totalCOGS
          }
        ];

        const journalEntry2 = {
          company_id: data.company_id,
          entry_number: `JE-CR-COGS-${savedReturn.id}`,
          entry_date: data.return_date,
          reference: savedReturn.return_number,
          source_type: 'sales_return',
          source_id: savedReturn.id,
          description: `COGS Reversal for ${savedReturn.return_number}`,
          status: 'posted',
          line_items: journalLines2,
          total_debits: totalCOGS,
          total_credits: totalCOGS,
          posted_by: 'system',
          posted_date: new Date().toISOString()
        };

        const je2 = await base44.entities.JournalEntry.create(journalEntry2);
        console.log(`✅ Journal Entry 2 posted: ${je2.entry_number}`);

        // Update Inventory account balance
        const invCurrentBalance = parseFloat(inventoryAccount.balance) || 0;
        await base44.entities.Account.update(inventoryAccount.id, {
          balance: invCurrentBalance + totalCOGS,
          company_id: inventoryAccount.company_id
        });

        // Update COGS account balance
        const cogsCurrentBalance = parseFloat(cogsAccount.balance) || 0;
        await base44.entities.Account.update(cogsAccount.id, {
          balance: cogsCurrentBalance - totalCOGS,
          company_id: cogsAccount.company_id
        });
      }

      console.log('\n✅ ALL SALES RETURN ENTRIES POSTED SUCCESSFULLY');

      return savedReturn;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['sales-returns']);
      queryClient.invalidateQueries(['invoices']);
      queryClient.invalidateQueries(['accounts']);
      queryClient.invalidateQueries(['journal-entries']);
      queryClient.invalidateQueries(['products']);
      queryClient.invalidateQueries(['inventory-transactions']);
      setIsLoading(false);
      alert('✅ Sales return processed successfully!');
      onClose();
    },
    onError: (error) => {
      console.error('Error processing sales return:', error);
      alert('Error processing sales return: ' + error.message);
      setIsLoading(false);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.customer_id) {
      alert('Please select a customer');
      return;
    }

    if (!formData.invoice_id) {
      alert('Please select an invoice');
      return;
    }

    if (formData.line_items.length === 0) {
      alert('Please enter quantities to return');
      return;
    }

    saveMutation.mutate(formData);
  };

  return (
    <Card className="fixed inset-4 z-50 overflow-auto bg-white shadow-2xl">
      <CardHeader className="border-b sticky top-0 bg-white z-10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">Credit Memo / Sales Return</CardTitle>
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
              <Label>Customer *</Label>
              <Select value={selectedCustomerId} onValueChange={handleCustomerChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(customer => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Apply to Invoice No. *</Label>
              <Select 
                value={selectedInvoiceId} 
                onValueChange={handleInvoiceChange}
                disabled={!selectedCustomerId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={selectedCustomerId ? "Select invoice" : "Select customer first"} />
                </SelectTrigger>
                <SelectContent>
                  {customerInvoices.map(invoice => (
                    <SelectItem key={invoice.id} value={invoice.id}>
                      {invoice.invoice_number} - ₦{invoice.total_amount.toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Return Date</Label>
              <Input
                type="date"
                value={formData.return_date}
                onChange={(e) => setFormData(prev => ({ ...prev, return_date: e.target.value }))}
              />
            </div>
          </div>

          {/* Line Items */}
          {returnItems.length > 0 && (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-4">Items to Return</h3>
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100">
                    <TableHead>Item</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Original Qty</TableHead>
                    <TableHead className="text-right">Qty Returned</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {returnItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-sm">{item.sku || item.product_id?.substring(0, 8)}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-right">{item.original_quantity}</TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min="0"
                          max={item.original_quantity}
                          step="0.01"
                          value={item.quantity_returned}
                          onChange={(e) => updateReturnQuantity(index, e.target.value)}
                          className="w-24 text-right"
                        />
                      </TableCell>
                      <TableCell className="text-right">₦{item.unit_price.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-semibold">
                        ₦{(item.quantity_returned * item.unit_price).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex justify-end mt-4">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-semibold">₦{formData.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span className="font-semibold">₦{formData.tax_total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Credit Total:</span>
                    <span className="text-red-600">₦{formData.total_amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Return Reason */}
          <div className="space-y-2">
            <Label>Return Reason</Label>
            <Textarea
              value={formData.return_reason}
              onChange={(e) => setFormData(prev => ({ ...prev, return_reason: e.target.value }))}
              rows={3}
              placeholder="Reason for return..."
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || formData.line_items.length === 0}>
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? 'Processing...' : 'Process Return'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
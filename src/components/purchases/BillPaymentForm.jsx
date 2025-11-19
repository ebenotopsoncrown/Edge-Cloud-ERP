
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
import { Checkbox } from "@/components/ui/checkbox";
import { X, Save, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { useCompany } from "../auth/CompanyContext";
import PaymentVoucherPrint from "../print/PaymentVoucherPrint"; // Added import

export default function BillPaymentForm({ onClose }) {
  const { currentCompany } = useCompany();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [selectedBills, setSelectedBills] = useState([]);

  const [formData, setFormData] = useState({
    company_id: currentCompany?.id || '',
    payment_number: `PMT-${Date.now()}`,
    payment_type: 'made',
    payment_date: format(new Date(), 'yyyy-MM-dd'),
    amount: 0,
    payment_method: 'bank_transfer',
    reference: '',
    ap_account_id: '',
    bank_account_id: '',
    notes: ''
  });

  // Fetch vendors
  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.Vendor.filter({ company_id: currentCompany.id }) : [],
    enabled: !!currentCompany
  });

  // Fetch bills for selected vendor
  const { data: vendorBills = [] } = useQuery({
    queryKey: ['vendor-bills', selectedVendorId],
    queryFn: () => selectedVendorId ? base44.entities.Bill.filter({
      company_id: currentCompany.id,
      vendor_id: selectedVendorId,
      status: ['pending', 'partial']
    }) : [],
    enabled: !!selectedVendorId
  });

  // Fetch accounts
  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.Account.filter({ company_id: currentCompany.id }) : [],
    enabled: !!currentCompany
  });

  // Filter accounts
  const apAccounts = accounts.filter(a =>
    a.account_type === 'liability' && a.account_name?.toLowerCase().includes('payable')
  );

  const bankAccounts = accounts.filter(a =>
    (a.account_type === 'asset' && 
    (a.account_name?.toLowerCase().includes('cash') || 
     a.account_name?.toLowerCase().includes('bank')))
  );

  // Initialize selected bills when vendor bills load
  useEffect(() => {
    if (vendorBills.length > 0) {
      const bills = vendorBills.map(bill => ({
        bill_id: bill.id,
        bill_number: bill.bill_number,
        due_date: bill.due_date,
        outstanding_amount: bill.balance_due || bill.total_amount,
        amount_to_pay: 0,
        selected: false
      }));
      setSelectedBills(bills);
    }
  }, [vendorBills]);

  const handleVendorChange = (vendorId) => {
    const vendor = vendors.find(v => v.id === vendorId);
    setSelectedVendorId(vendorId);
    setFormData(prev => ({
      ...prev,
      contact_id: vendorId,
      contact_name: vendor?.company_name || ''
    }));
  };

  const handleBillSelection = (index, checked) => {
    const newBills = [...selectedBills];
    newBills[index].selected = checked;
    
    // If selecting, auto-fill with outstanding amount
    if (checked) {
      newBills[index].amount_to_pay = newBills[index].outstanding_amount;
    } else {
      newBills[index].amount_to_pay = 0;
    }
    
    setSelectedBills(newBills);
    calculateTotalPayment(newBills);
  };

  const handleAmountChange = (index, amount) => {
    const newBills = [...selectedBills];
    const parsedAmount = parseFloat(amount) || 0;
    
    // Validate amount doesn't exceed outstanding
    if (parsedAmount <= newBills[index].outstanding_amount) {
      newBills[index].amount_to_pay = parsedAmount;
      newBills[index].selected = parsedAmount > 0;
      setSelectedBills(newBills);
      calculateTotalPayment(newBills);
    }
  };

  const calculateTotalPayment = (bills) => {
    const total = bills.reduce((sum, bill) => sum + bill.amount_to_pay, 0);
    setFormData(prev => ({ ...prev, amount: total }));
  };

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      setIsLoading(true);

      // Validate
      if (!data.contact_id) {
        throw new Error('Please select a vendor');
      }

      if (!data.ap_account_id) {
        throw new Error('Please select an A/P account');
      }

      if (!data.bank_account_id) {
        throw new Error('Please select a Cash/Bank account');
      }

      const billsToProcess = selectedBills.filter(b => b.selected && b.amount_to_pay > 0);

      if (billsToProcess.length === 0) {
        throw new Error('Please select at least one bill to pay');
      }

      if (data.amount <= 0) {
        throw new Error('Payment amount must be greater than zero');
      }

      console.log('💰 PROCESSING BILL PAYMENT');
      console.log('Vendor:', data.contact_name);
      console.log('Total Payment:', data.amount);

      // Find accounts
      const apAccount = accounts.find(a => a.id === data.ap_account_id);
      const bankAccount = accounts.find(a => a.id === data.bank_account_id);

      if (!apAccount || !bankAccount) {
        throw new Error('Required GL accounts not found');
      }

      // JOURNAL ENTRY: DR A/P, CR Cash/Bank
      console.log('\n📝 JOURNAL ENTRY: Recording Bill Payment');

      const journalLines = [
        {
          account_id: apAccount.id,
          account_name: apAccount.account_name,
          account_code: apAccount.account_code,
          description: `Payment to ${data.contact_name} - ${data.payment_number}`,
          debit: data.amount,
          credit: 0
        },
        {
          account_id: bankAccount.id,
          account_name: bankAccount.account_name,
          account_code: bankAccount.account_code,
          description: `Payment via ${data.payment_method} - ${data.reference || data.payment_number}`,
          debit: 0,
          credit: data.amount
        }
      ];

      console.log(`   DR: Accounts Payable ${data.amount.toLocaleString()}`);
      console.log(`   CR: ${bankAccount.account_name} ${data.amount.toLocaleString()}`);

      const journalEntry = {
        company_id: data.company_id,
        entry_number: `JE-PMT-${Date.now()}`,
        entry_date: data.payment_date,
        reference: data.payment_number,
        source_type: 'payment',
        source_id: null, // Will update after creating payment
        description: `Bill payment to ${data.contact_name}`,
        status: 'posted',
        line_items: journalLines,
        total_debits: data.amount,
        total_credits: data.amount,
        posted_by: 'system',
        posted_date: new Date().toISOString()
      };

      const je = await base44.entities.JournalEntry.create(journalEntry);
      console.log(`✅ Journal Entry posted: ${je.entry_number}`);

      // Update account balances
      const apCurrentBalance = parseFloat(apAccount.balance) || 0;
      await base44.entities.Account.update(apAccount.id, {
        balance: apCurrentBalance - data.amount, // Reduce liability
        company_id: apAccount.company_id
      });
      console.log(`   Updated ${apAccount.account_name}: ${apCurrentBalance} - ${data.amount} = ${apCurrentBalance - data.amount}`);

      const bankCurrentBalance = parseFloat(bankAccount.balance) || 0;
      await base44.entities.Account.update(bankAccount.id, {
        balance: bankCurrentBalance - data.amount, // Reduce cash/bank
        company_id: bankAccount.company_id
      });
      console.log(`   Updated ${bankAccount.account_name}: ${bankCurrentBalance} - ${data.amount} = ${bankCurrentBalance - data.amount}`);

      // Create payment records and update bills
      console.log('\n📄 Updating Bills...');
      
      for (const billInfo of billsToProcess) {
        const bill = await base44.entities.Bill.get(billInfo.bill_id);
        
        const newAmountPaid = (bill.amount_paid || 0) + billInfo.amount_to_pay;
        const newBalanceDue = bill.total_amount - newAmountPaid;
        
        let newStatus = bill.status;
        if (newBalanceDue <= 0.01) {
          newStatus = 'paid';
        } else if (newAmountPaid > 0) {
          newStatus = 'partial';
        }

        await base44.entities.Bill.update(bill.id, {
          amount_paid: newAmountPaid,
          balance_due: newBalanceDue,
          status: newStatus
        });

        console.log(`   ${bill.bill_number}: Paid ${billInfo.amount_to_pay}, Balance: ${newBalanceDue}, Status: ${newStatus}`);

        // Create individual payment record
        const paymentData = {
          ...data,
          bill_id: bill.id,
          amount: billInfo.amount_to_pay,
          journal_entry_id: je.id
        };

        await base44.entities.Payment.create(paymentData);
      }

      console.log('\n✅ BILL PAYMENT PROCESSED SUCCESSFULLY');

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['bills']);
      queryClient.invalidateQueries(['payments']);
      queryClient.invalidateQueries(['accounts']);
      queryClient.invalidateQueries(['journal-entries']);
      setIsLoading(false);
      alert('✅ Bill payment processed successfully!');
      onClose();
    },
    onError: (error) => {
      console.error('Error processing payment:', error);
      alert('Error processing payment: ' + error.message);
      setIsLoading(false);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const selectedVendor = vendors.find(v => v.id === selectedVendorId);

  return (
    <>
      {/* CRITICAL: Add print template */}
      <PaymentVoucherPrint
        payment={{
          ...formData,
          contact_name: selectedVendor?.company_name,
          payment_lines: selectedBills.filter(b => b.selected && b.amount_to_pay > 0).map(b => ({
            bill_number: b.bill_number,
            amount_to_pay: b.amount_to_pay,
            outstanding_amount: b.outstanding_amount,
            due_date: b.due_date
          }))
        }}
        company={currentCompany}
        vendor={selectedVendor}
      />

      {/* Screen View - HIDDEN when printing */}
      <Card className="fixed inset-4 z-50 overflow-auto bg-white shadow-2xl print:hidden">
        <CardHeader className="border-b sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Bill Payment Voucher</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column - Vendor Info */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Vendor *</Label> {/* Changed from Vendor ID to Vendor */}
                  <Select value={selectedVendorId} onValueChange={handleVendorChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map(vendor => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.vendor_code || vendor.id.substring(0, 8)} - {vendor.company_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedVendor && (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <p className="font-semibold text-lg">{selectedVendor.company_name}</p>
                    {selectedVendor.address && (
                      <div className="text-sm text-gray-600 mt-2">
                        <p>{selectedVendor.address.street}</p>
                        <p>{selectedVendor.address.city}, {selectedVendor.address.state} {selectedVendor.address.postal_code}</p>
                        <p>{selectedVendor.address.country}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column - Payment Details */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Payment Date</Label>
                    <Input
                      type="date"
                      value={formData.payment_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, payment_date: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Check/Reference No.</Label>
                    <Input
                      value={formData.reference}
                      onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
                      placeholder="Enter reference"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select 
                    value={formData.payment_method} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="mobile_payment">Mobile Payment</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Total Amount</Label>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-gray-400" />
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      readOnly
                      className="font-bold text-lg bg-blue-50"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* GL Account Selection */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-3">📊 General Ledger Accounts</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>A/P Account (Debit) *</Label>
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

                <div className="space-y-2">
                  <Label>Cash/Bank Account (Credit) *</Label>
                  <Select 
                    value={formData.bank_account_id} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, bank_account_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select cash/bank account" />
                    </SelectTrigger>
                    <SelectContent>
                      {bankAccounts.map(account => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.account_code} - {account.account_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-xs text-blue-700 mt-2">
                ℹ️ DR: A/P Account (Reduce liability) | CR: Cash/Bank (Reduce asset)
              </p>
            </div>

            {/* Bills Table */}
            {selectedBills.length > 0 && (
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-4">Apply to Bills</h3>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-100">
                      <TableHead className="w-12">Pay</TableHead>
                      <TableHead>Bill #</TableHead>
                      <TableHead>Date Due</TableHead>
                      <TableHead className="text-right">Amount Due</TableHead>
                      <TableHead className="text-right">Amount to Pay</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedBills.map((bill, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Checkbox
                            checked={bill.selected}
                            onCheckedChange={(checked) => handleBillSelection(index, checked)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{bill.bill_number}</TableCell>
                        <TableCell>{format(new Date(bill.due_date), 'MMM d, yyyy')}</TableCell>
                        <TableCell className="text-right font-mono">
                          ${bill.outstanding_amount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max={bill.outstanding_amount}
                            value={bill.amount_to_pay}
                            onChange={(e) => handleAmountChange(index, e.target.value)}
                            className="w-32 text-right"
                            disabled={!bill.selected}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-blue-50 font-bold">
                      <TableCell colSpan={4} className="text-right">Total Payment:</TableCell>
                      <TableCell className="text-right text-blue-700 text-lg">
                        ${formData.amount.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Memo/Notes */}
            <div className="space-y-2">
              <Label>Memo/Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                placeholder="Payment notes..."
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || formData.amount <= 0}>
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? 'Processing...' : 'Process Payment'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}


import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"; // Added useQuery
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Save, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function CustomerForm({ customer, onClose, companyId }) {
  const queryClient = useQueryClient();
  const [errors, setErrors] = useState({});
  const [showErrors, setShowErrors] = useState(false);

  const [formData, setFormData] = useState({
    company_id: companyId,
    customer_code: '',
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    billing_address: {
      street: '',
      city: '',
      state: '',
      postal_code: '',
      country: ''
    },
    shipping_address: {
      street: '',
      city: '',
      state: '',
      postal_code: '',
      country: ''
    },
    credit_limit: 0,
    payment_terms: 'net_30',
    tax_number: '',
    currency: 'USD',
    notes: '',
    is_active: true,
    total_outstanding: 0,
    ...customer
  });

  const [openingBalance, setOpeningBalance] = useState(0); // Added openingBalance state

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts', companyId],
    queryFn: () => companyId ? base44.entities.Account.filter({ company_id: companyId }) : Promise.resolve([]),
    enabled: !!companyId
  });

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.company_name || formData.company_name.trim() === '') {
      newErrors.company_name = 'Company name is required';
    }
    
    if (!formData.email || formData.email.trim() === '') {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      let savedCustomer;
      
      if (customer?.id) {
        savedCustomer = await base44.entities.Customer.update(customer.id, data);
      } else {
        savedCustomer = await base44.entities.Customer.create(data);
        
        // POST OPENING BALANCE JOURNAL if customer has opening balance
        if (!customer && openingBalance > 0) {
          const arAccount = accounts.find(a => 
            a.account_type === 'asset' && 
            (a.account_category === 'current_asset' || a.account_name?.toLowerCase().includes('receivable'))
          );
          
          const equityAccount = accounts.find(a => 
            a.account_type === 'equity' && 
            (a.account_name?.toLowerCase().includes("owner's capital") || a.account_name?.toLowerCase().includes('capital'))
          );
          
          if (arAccount && equityAccount) {
            const journalEntry = {
              company_id: companyId,
              entry_number: `OB-CUST-${savedCustomer.customer_code || savedCustomer.id}`,
              entry_date: new Date().toISOString().split('T')[0],
              reference: `Customer Opening Balance - ${data.company_name}`,
              source_type: 'manual',
              description: `Opening Balance - ${data.company_name}`,
              status: 'posted',
              line_items: [
                {
                  account_id: arAccount.id,
                  account_name: arAccount.account_name,
                  account_code: arAccount.account_code,
                  description: `Customer opening balance - ${data.company_name}`,
                  debit: openingBalance,
                  credit: 0
                },
                {
                  account_id: equityAccount.id,
                  account_name: equityAccount.account_name,
                  account_code: equityAccount.account_code,
                  description: 'Opening Balance Equity',
                  debit: 0,
                  credit: openingBalance
                }
              ],
              total_debits: openingBalance,
              total_credits: openingBalance,
              posted_by: 'system',
              posted_date: new Date().toISOString()
            };
            
            await base44.entities.JournalEntry.create(journalEntry);
            
            // Update AR account balance
            await base44.entities.Account.update(arAccount.id, {
              balance: (arAccount.balance || 0) + openingBalance
            });
            
            // Update equity account balance
            await base44.entities.Account.update(equityAccount.id, {
              balance: (equityAccount.balance || 0) + openingBalance
            });
            
            // Update customer outstanding balance
            await base44.entities.Customer.update(savedCustomer.id, {
              total_outstanding: openingBalance
            });
          }
        }
      }
      
      return savedCustomer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['customers', companyId]);
      queryClient.invalidateQueries(['journal-entries', companyId]); // Invalidate journal entries
      queryClient.invalidateQueries(['accounts', companyId]);       // Invalidate accounts
      onClose();
    },
    onError: (error) => {
      setErrors({ submit: error.message || 'Failed to save customer. Please try again.' });
      setShowErrors(true);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowErrors(true);
    
    if (!validateForm()) {
      return;
    }
    
    saveMutation.mutate(formData);
  };

  const [sameAsBilling, setSameAsBilling] = useState(false);

  const handleSameAsBillingChange = (checked) => {
    setSameAsBilling(checked);
    if (checked) {
      setFormData(prev => ({
        ...prev,
        shipping_address: { ...prev.billing_address }
      }));
    }
  };

  return (
    <Card className="mb-6 border-2 border-blue-200">
      <CardHeader className="flex flex-row items-center justify-between border-b bg-blue-50">
        <CardTitle className="text-xl">{customer ? 'Edit Customer' : 'New Customer'}</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-6">
        {showErrors && Object.keys(errors).length > 0 && (
          <Alert className="mb-6 bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-900">
              <strong>Please fix the following errors:</strong>
              <ul className="list-disc ml-5 mt-2">
                {Object.entries(errors).map(([field, error]) => (
                  <li key={field}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Customer Code</Label>
                <Input
                  value={formData.customer_code}
                  onChange={(e) => setFormData(prev => ({ ...prev, customer_code: e.target.value }))}
                  placeholder="AUTO"
                />
              </div>

              <div className="space-y-2">
                <Label>Company Name *</Label>
                <Input
                  value={formData.company_name}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, company_name: e.target.value }));
                    if (showErrors && errors.company_name) {
                      setErrors(prev => ({ ...prev, company_name: undefined }));
                    }
                  }}
                  placeholder="ABC Corporation"
                  className={showErrors && errors.company_name ? 'border-red-500' : ''}
                />
                {showErrors && errors.company_name && (
                  <p className="text-sm text-red-600">{errors.company_name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Contact Person</Label>
                <Input
                  value={formData.contact_person}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_person: e.target.value }))}
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, email: e.target.value }));
                    if (showErrors && errors.email) {
                      setErrors(prev => ({ ...prev, email: undefined }));
                    }
                  }}
                  placeholder="contact@example.com"
                  className={showErrors && errors.email ? 'border-red-500' : ''}
                />
                {showErrors && errors.email && (
                  <p className="text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+1234567890"
                />
              </div>

              <div className="space-y-2">
                <Label>Tax Number</Label>
                <Input
                  value={formData.tax_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, tax_number: e.target.value }))}
                  placeholder="VAT/Tax ID"
                />
              </div>
            </div>
          </div>

          {/* Billing Address */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Billing Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Street</Label>
                <Input
                  value={formData.billing_address.street}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    billing_address: { ...prev.billing_address, street: e.target.value }
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  value={formData.billing_address.city}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    billing_address: { ...prev.billing_address, city: e.target.value }
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label>State</Label>
                <Input
                  value={formData.billing_address.state}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    billing_address: { ...prev.billing_address, state: e.target.value }
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Postal Code</Label>
                <Input
                  value={formData.billing_address.postal_code}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    billing_address: { ...prev.billing_address, postal_code: e.target.value }
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Country</Label>
                <Input
                  value={formData.billing_address.country}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    billing_address: { ...prev.billing_address, country: e.target.value }
                  }))}
                />
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Shipping Address</h3>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sameAsBilling"
                  checked={sameAsBilling}
                  onCheckedChange={handleSameAsBillingChange}
                />
                <Label htmlFor="sameAsBilling" className="cursor-pointer">Same as billing address</Label>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Street</Label>
                <Input
                  value={formData.shipping_address.street}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    shipping_address: { ...prev.shipping_address, street: e.target.value }
                  }))}
                  disabled={sameAsBilling}
                />
              </div>

              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  value={formData.shipping_address.city}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    shipping_address: { ...prev.shipping_address, city: e.target.value }
                  }))}
                  disabled={sameAsBilling}
                />
              </div>

              <div className="space-y-2">
                <Label>State</Label>
                <Input
                  value={formData.shipping_address.state}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    shipping_address: { ...prev.shipping_address, state: e.target.value }
                  }))}
                  disabled={sameAsBilling}
                />
              </div>

              <div className="space-y-2">
                <Label>Postal Code</Label>
                <Input
                  value={formData.shipping_address.postal_code}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    shipping_address: { ...prev.shipping_address, postal_code: e.target.value }
                  }))}
                  disabled={sameAsBilling}
                />
              </div>

              <div className="space-y-2">
                <Label>Country</Label>
                <Input
                  value={formData.shipping_address.country}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    shipping_address: { ...prev.shipping_address, country: e.target.value }
                  }))}
                  disabled={sameAsBilling}
                />
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Financial Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Credit Limit</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.credit_limit}
                  onChange={(e) => setFormData(prev => ({ ...prev, credit_limit: parseFloat(e.target.value) }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Payment Terms</Label>
                <Select 
                  value={formData.payment_terms}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, payment_terms: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="due_on_receipt">Due on Receipt</SelectItem>
                    <SelectItem value="net_15">Net 15</SelectItem>
                    <SelectItem value="net_30">Net 30</SelectItem>
                    <SelectItem value="net_60">Net 60</SelectItem>
                    <SelectItem value="net_90">Net 90</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Currency</Label>
                <Select 
                  value={formData.currency}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="NGN">NGN</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* OPENING BALANCE SECTION */}
            {!customer && (
              <div className="border-2 border-orange-200 rounded-lg p-4 bg-orange-50 mt-4">
                <h4 className="text-md font-semibold text-orange-900 mb-3">Opening Balance (Optional)</h4>
                <Alert className="bg-blue-50 border-blue-200 mb-4">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-900 text-sm">
                    <strong>Double Entry Posting:</strong> If customer has existing balance, the system will automatically post: <strong>DR</strong> Accounts Receivable, <strong>CR</strong> Owner's Capital
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
                  <p className="text-xs text-orange-700">
                    Enter amount if this customer owes you from previous system
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              placeholder="Internal notes about this customer..."
            />
          </div>

          {/* Status */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
            <Label htmlFor="is_active" className="cursor-pointer">Active Customer</Label>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Customer
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Save, Building2, DollarSign, CheckCircle } from "lucide-react";
import { useCompany } from "../components/auth/CompanyContext";

export default function Settings() {
  const { currentCompany, user, switchCompany } = useCompany();
  const queryClient = useQueryClient();
  const [companySettings, setCompanySettings] = useState({
    company_name: '',
    base_currency: 'USD',
    fiscal_year_end: '12-31',
    time_zone: 'UTC',
    address: {
      street: '',
      city: '',
      state: '',
      postal_code: '',
      country: ''
    }
  });

  const [userSettings, setUserSettings] = useState({
    full_name: '',
    email: '',
    phone: '',
    job_title: '',
    department: ''
  });

  // Load company settings
  useEffect(() => {
    if (currentCompany) {
      setCompanySettings({
        company_name: currentCompany.company_name || '',
        base_currency: currentCompany.base_currency || 'USD',
        fiscal_year_end: currentCompany.fiscal_year_end || '12-31',
        time_zone: currentCompany.time_zone || 'UTC',
        address: currentCompany.address || {
          street: '',
          city: '',
          state: '',
          postal_code: '',
          country: ''
        }
      });
    }
  }, [currentCompany]);

  // Load user settings
  useEffect(() => {
    if (user) {
      setUserSettings({
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
        job_title: user.job_title || '',
        department: user.department || ''
      });
    }
  }, [user]);

  const updateCompanyMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.Company.update(currentCompany.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['companies']);
      // Refresh the current company context
      window.location.reload();
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.auth.updateMe(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['current-user']);
      alert('Profile updated successfully!');
    }
  });

  const handleSaveCompany = () => {
    updateCompanyMutation.mutate(companySettings);
  };

  const handleSaveUser = () => {
    updateUserMutation.mutate(userSettings);
  };

  if (!currentCompany || !user) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your company and user preferences</p>
      </div>

      {/* CRITICAL: Base Currency Configuration */}
      <Alert className="bg-blue-50 border-2 border-blue-300">
        <DollarSign className="h-5 w-5 text-blue-600" />
        <AlertDescription className="text-blue-900">
          <strong className="text-lg">Base Currency Configuration</strong>
          <p className="mt-2">
            Your base currency is <strong className="text-xl">{companySettings.base_currency}</strong>. 
            This is the currency used for all financial reports and statements. 
            Foreign currency transactions will be automatically converted to {companySettings.base_currency} for reporting purposes.
          </p>
        </AlertDescription>
      </Alert>

      {/* Company Settings */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            Company Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input
                value={companySettings.company_name}
                onChange={(e) => setCompanySettings({...companySettings, company_name: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                Base Currency (Reporting Currency) *
              </Label>
              <Select
                value={companySettings.base_currency}
                onValueChange={(value) => setCompanySettings({...companySettings, base_currency: value})}
              >
                <SelectTrigger className="border-2 border-green-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD - US Dollar ($)</SelectItem>
                  <SelectItem value="EUR">EUR - Euro (€)</SelectItem>
                  <SelectItem value="GBP">GBP - British Pound (£)</SelectItem>
                  <SelectItem value="NGN">NGN - Nigerian Naira (₦)</SelectItem>
                  <SelectItem value="ZAR">ZAR - South African Rand (R)</SelectItem>
                  <SelectItem value="KES">KES - Kenyan Shilling (KSh)</SelectItem>
                  <SelectItem value="GHS">GHS - Ghanaian Cedi (₵)</SelectItem>
                  <SelectItem value="CAD">CAD - Canadian Dollar (C$)</SelectItem>
                  <SelectItem value="AUD">AUD - Australian Dollar (A$)</SelectItem>
                  <SelectItem value="INR">INR - Indian Rupee (₹)</SelectItem>
                  <SelectItem value="JPY">JPY - Japanese Yen (¥)</SelectItem>
                  <SelectItem value="CNY">CNY - Chinese Yuan (¥)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-600 bg-yellow-50 p-2 rounded border border-yellow-200">
                ⚠️ <strong>Important:</strong> This is your reporting currency. All financial statements, 
                dashboards, and reports will show amounts in {companySettings.base_currency}. 
                Foreign currency transactions will be automatically converted.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Fiscal Year End (MM-DD)</Label>
              <Input
                value={companySettings.fiscal_year_end}
                onChange={(e) => setCompanySettings({...companySettings, fiscal_year_end: e.target.value})}
                placeholder="12-31"
              />
            </div>

            <div className="space-y-2">
              <Label>Time Zone</Label>
              <Select
                value={companySettings.time_zone}
                onValueChange={(value) => setCompanySettings({...companySettings, time_zone: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC (GMT+0)</SelectItem>
                  <SelectItem value="Africa/Lagos">West Africa Time (WAT) - Lagos</SelectItem>
                  <SelectItem value="Africa/Nairobi">East Africa Time (EAT) - Nairobi</SelectItem>
                  <SelectItem value="Africa/Johannesburg">South Africa Time (SAST)</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                  <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                  <SelectItem value="Europe/London">London (GMT/BST)</SelectItem>
                  <SelectItem value="Asia/Dubai">Dubai (GST)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4 border-t pt-6">
            <h3 className="font-semibold text-lg">Company Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Street Address</Label>
                <Input
                  value={companySettings.address.street}
                  onChange={(e) => setCompanySettings({
                    ...companySettings, 
                    address: {...companySettings.address, street: e.target.value}
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  value={companySettings.address.city}
                  onChange={(e) => setCompanySettings({
                    ...companySettings, 
                    address: {...companySettings.address, city: e.target.value}
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label>State/Province</Label>
                <Input
                  value={companySettings.address.state}
                  onChange={(e) => setCompanySettings({
                    ...companySettings, 
                    address: {...companySettings.address, state: e.target.value}
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label>Postal Code</Label>
                <Input
                  value={companySettings.address.postal_code}
                  onChange={(e) => setCompanySettings({
                    ...companySettings, 
                    address: {...companySettings.address, postal_code: e.target.value}
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label>Country</Label>
                <Input
                  value={companySettings.address.country}
                  onChange={(e) => setCompanySettings({
                    ...companySettings, 
                    address: {...companySettings.address, country: e.target.value}
                  })}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button 
              onClick={handleSaveCompany}
              disabled={updateCompanyMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateCompanyMutation.isPending ? 'Saving...' : 'Save Company Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* User Settings */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
          <CardTitle>User Profile</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={userSettings.full_name}
                onChange={(e) => setUserSettings({...userSettings, full_name: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={userSettings.email}
                disabled
                className="bg-gray-100"
              />
              <p className="text-xs text-gray-500">Email cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={userSettings.phone}
                onChange={(e) => setUserSettings({...userSettings, phone: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Job Title</Label>
              <Input
                value={userSettings.job_title}
                onChange={(e) => setUserSettings({...userSettings, job_title: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Department</Label>
              <Input
                value={userSettings.department}
                onChange={(e) => setUserSettings({...userSettings, department: e.target.value})}
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button 
              onClick={handleSaveUser}
              disabled={updateUserMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateUserMutation.isPending ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Currency Configuration Guide */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-blue-600" />
            Base Currency Guide
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex gap-3">
            <span className="font-bold text-blue-600">1.</span>
            <div>
              <p className="font-semibold">Set Your Base Currency Above</p>
              <p className="text-gray-700">Choose the currency you want for all financial reports (e.g., NGN for Nigerian companies)</p>
            </div>
          </div>

          <div className="flex gap-3">
            <span className="font-bold text-blue-600">2.</span>
            <div>
              <p className="font-semibold">Dashboards Show Base Currency</p>
              <p className="text-gray-700">All dashboards (Sales, Purchases, Accounting) will display amounts in your base currency</p>
            </div>
          </div>

          <div className="flex gap-3">
            <span className="font-bold text-blue-600">3.</span>
            <div>
              <p className="font-semibold">Foreign Currency Transactions</p>
              <p className="text-gray-700">When you create invoices/bills in foreign currencies (e.g., USD), the system automatically converts to your base currency using exchange rates</p>
            </div>
          </div>

          <div className="flex gap-3">
            <span className="font-bold text-blue-600">4.</span>
            <div>
              <p className="font-semibold">Exchange Rates</p>
              <p className="text-gray-700">Set up exchange rates in Settings → Exchange Rates for accurate multi-currency conversions</p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-blue-300">
            <p className="font-semibold text-blue-900 mb-2">Example:</p>
            <ul className="space-y-1 text-gray-700">
              <li>• Base Currency: <strong>NGN (Nigerian Naira)</strong></li>
              <li>• Invoice Currency: <strong>USD (US Dollar)</strong></li>
              <li>• Invoice Amount: <strong>$100</strong></li>
              <li>• Exchange Rate: <strong>1 USD = 1,500 NGN</strong></li>
              <li>• Dashboard Shows: <strong>₦150,000</strong> (automatically converted)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
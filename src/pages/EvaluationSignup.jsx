
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Rocket, AlertCircle, Eye, EyeOff } from "lucide-react";
import { format, addDays } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function EvaluationSignup() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // Removed loginCredentials state as user creation is decoupled
  const [companyEmail, setCompanyEmail] = useState(''); // New state for company email
  const [companyName, setCompanyName] = useState('');   // New state for company name
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    job_title: '',
    company_name: '',
    trading_name: '',
    company_type: 'trading',
    industry: '',
    accounting_method: 'accrual',
    account_period_structure: 'monthly',
    fiscal_year_end: '12-31',
    address: {
      street: '',
      city: '',
      state: '',
      postal_code: '',
      country: ''
    },
    contact_phone: '',
    website: '',
    base_currency: 'USD',
    tax_number: '',
    registration_number: ''
  });

  const businessTypes = [
    { value: 'manufacturing', label: 'Manufacturing', modules: { manufacturing: true, inventory: true, job_costing: true } },
    { value: 'trading', label: 'Trading/Wholesale', modules: { inventory: true, pos: false } },
    { value: 'retail', label: 'Retail', modules: { inventory: true, pos: true } },
    { value: 'service', label: 'Service', modules: { job_costing: true } },
    { value: 'construction', label: 'Construction', modules: { job_costing: true, fixed_assets: true } },
    { value: 'restaurant', label: 'Restaurant/Hospitality', modules: { inventory: true, pos: true } },
    { value: 'professional_services', label: 'Professional Services', modules: { job_costing: true } },
    { value: 'non_profit', label: 'Non-Profit', modules: { non_profit: true } },
    { value: 'healthcare', label: 'Healthcare', modules: { inventory: true } },
    { value: 'education', label: 'Education', modules: {} },
    { value: 'real_estate', label: 'Real Estate', modules: { fixed_assets: true } },
    { value: 'other', label: 'Other', modules: {} }
  ];

  const generateChartOfAccounts = (businessType, companyId) => {
    const baseAccounts = [
      { company_id: companyId, account_code: '1000', account_name: 'Cash', account_type: 'asset', account_category: 'current_asset', balance: 0, is_active: true },
      { company_id: companyId, account_code: '1010', account_name: 'Bank Account', account_type: 'asset', account_category: 'current_asset', balance: 0, is_active: true },
      { company_id: companyId, account_code: '1100', account_name: 'Accounts Receivable', account_type: 'asset', account_category: 'current_asset', balance: 0, is_active: true },
      { company_id: companyId, account_code: '1200', account_name: 'Inventory', account_type: 'asset', account_category: 'current_asset', balance: 0, is_active: true },
      { company_id: companyId, account_code: '1500', account_name: 'Fixed Assets', account_type: 'asset', account_category: 'fixed_asset', balance: 0, is_active: true },
      { company_id: companyId, account_code: '1510', account_name: 'Accumulated Depreciation', account_type: 'asset', account_category: 'fixed_asset', balance: 0, is_active: true },
      { company_id: companyId, account_code: '2000', account_name: 'Accounts Payable', account_type: 'liability', account_category: 'current_liability', balance: 0, is_active: true },
      { company_id: companyId, account_code: '2100', account_name: 'Sales Tax Payable', account_type: 'liability', account_category: 'current_liability', balance: 0, is_active: true },
      { company_id: companyId, account_code: '2500', account_name: 'Long Term Loans', account_type: 'liability', account_category: 'long_term_liability', balance: 0, is_active: true },
      { company_id: companyId, account_code: '3000', account_name: 'Owner\'s Capital', account_type: 'equity', account_category: 'equity', balance: 0, is_active: true },
      { company_id: companyId, account_code: '3100', account_name: 'Retained Earnings', account_type: 'equity', account_category: 'equity', balance: 0, is_active: true },
      { company_id: companyId, account_code: '4000', account_name: 'Sales Revenue', account_type: 'revenue', account_category: 'operating_revenue', balance: 0, is_active: true },
      { company_id: companyId, account_code: '4100', account_name: 'Service Revenue', account_type: 'revenue', account_category: 'operating_revenue', balance: 0, is_active: true },
      { company_id: companyId, account_code: '5000', account_name: 'Cost of Goods Sold', account_type: 'cost_of_goods_sold', account_category: 'cost_of_sales', balance: 0, is_active: true },
      { company_id: companyId, account_code: '6000', account_name: 'Salaries & Wages', account_type: 'expense', account_category: 'operating_expense', balance: 0, is_active: true },
      { company_id: companyId, account_code: '6100', account_name: 'Rent Expense', account_type: 'expense', account_category: 'operating_expense', balance: 0, is_active: true },
      { company_id: companyId, account_code: '6200', account_name: 'Utilities', account_type: 'expense', account_category: 'operating_expense', balance: 0, is_active: true },
      { company_id: companyId, account_code: '6300', account_name: 'Office Supplies', account_type: 'expense', account_category: 'operating_expense', balance: 0, is_active: true },
      { company_id: companyId, account_code: '6400', account_name: 'Insurance', account_type: 'expense', account_category: 'operating_expense', balance: 0, is_active: true },
      { company_id: companyId, account_code: '6500', account_name: 'Depreciation Expense', account_type: 'expense', account_category: 'operating_expense', balance: 0, is_active: true },
      { company_id: companyId, account_code: '6600', account_name: 'Marketing & Advertising', account_type: 'expense', account_category: 'operating_expense', balance: 0, is_active: true },
      { company_id: companyId, account_code: '6700', account_name: 'Professional Fees', account_type: 'expense', account_category: 'operating_expense', balance: 0, is_active: true },
      { company_id: companyId, account_code: '6800', account_name: 'Bank Charges', account_type: 'expense', account_category: 'operating_expense', balance: 0, is_active: true }
    ];

    if (businessType === 'manufacturing') {
      baseAccounts.push(
        { company_id: companyId, account_code: '1300', account_name: 'Raw Materials', account_type: 'asset', account_category: 'current_asset', balance: 0, is_active: true },
        { company_id: companyId, account_code: '1310', account_name: 'Work in Progress', account_type: 'asset', account_category: 'current_asset', balance: 0, is_active: true },
        { company_id: companyId, account_code: '5100', account_name: 'Direct Labor', account_type: 'cost_of_goods_sold', account_category: 'cost_of_sales', balance: 0, is_active: true },
        { company_id: companyId, account_code: '5200', account_name: 'Manufacturing Overhead', account_type: 'cost_of_goods_sold', account_category: 'cost_of_sales', balance: 0, is_active: true }
      );
    }

    if (businessType === 'restaurant' || businessType === 'retail') {
      baseAccounts.push(
        { company_id: companyId, account_code: '1210', account_name: 'Food & Beverage Inventory', account_type: 'asset', account_category: 'current_asset', balance: 0, is_active: true },
        { company_id: companyId, account_code: '6900', account_name: 'Credit Card Fees', account_type: 'expense', account_category: 'operating_expense', balance: 0, is_active: true }
      );
    }

    if (businessType === 'non_profit') {
      baseAccounts.push(
        { company_id: companyId, account_code: '4200', account_name: 'Donations Revenue', account_type: 'revenue', account_category: 'operating_revenue', balance: 0, is_active: true },
        { company_id: companyId, account_code: '4300', account_name: 'Grants Revenue', account_type: 'revenue', account_category: 'operating_revenue', balance: 0, is_active: true },
        { company_id: companyId, account_code: '6050', account_name: 'Program Expenses', account_type: 'expense', account_category: 'operating_expense', balance: 0, is_active: true }
      );
    }

    return baseAccounts;
  };

  const handleSubmit = async () => {
    if (!formData.full_name || !formData.email || !formData.password) {
      setError('Please fill in all required user information fields including password');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (!formData.company_name) {
      setError('Please enter company name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const today = new Date();
      const expiryDate = addDays(today, 30);

      const businessTypeConfig = businessTypes.find(bt => bt.value === formData.company_type);
      const enabledModules = {
        sales: true,
        purchases: true,
        inventory: true,
        accounting: true,
        ...businessTypeConfig?.modules
      };

      const companyData = {
        company_name: formData.company_name,
        trading_name: formData.trading_name || formData.company_name,
        company_type: formData.company_type,
        industry: formData.industry,
        accounting_method: formData.accounting_method,
        account_period_structure: formData.account_period_structure,
        fiscal_year_end: formData.fiscal_year_end,
        address: formData.address,
        contact_email: formData.email,
        contact_phone: formData.contact_phone,
        website: formData.website,
        base_currency: formData.base_currency,
        tax_number: formData.tax_number,
        registration_number: formData.registration_number,
        is_evaluation: true,
        license_type: 'evaluation',
        subscription_status: 'evaluation',
        evaluation_start_date: format(today, 'yyyy-MM-dd'),
        license_issue_date: format(today, 'yyyy-MM-dd'),
        license_expiry_date: format(expiryDate, 'yyyy-MM-dd'),
        evaluation_days_remaining: 30,
        modules_enabled: enabledModules,
        user_limit: 5,
        onboarding_completed: true,
        chart_of_accounts_setup: true,
        opening_balances_entered: false,
        is_active: true
      };

      console.log('Creating company...');
      const company = await base44.entities.Company.create(companyData);
      console.log('Company created:', company.id);

      // User creation is decoupled and moved to the login/signup flow
      // The user will register their account with Auth0 using their email
      // and then link it to this company.
      // This means the `admin_user_id` cannot be set here.
      // The company can be updated with `admin_user_id` once the first user
      // successfully links their account to this company via Auth0.

      console.log('Creating chart of accounts...');
      const accounts = generateChartOfAccounts(formData.company_type, company.id);
      await base44.entities.Account.bulkCreate(accounts);
      console.log('Chart of accounts created');

      // Send welcome email
      const appUrl = window.location.origin;
      
      try {
        await base44.integrations.Core.SendEmail({
          from_name: 'Edge Cloud ERP',
          to: formData.email,
          subject: `Welcome to Edge Cloud ERP - ${formData.company_name} Evaluation Activated!`,
          body: `
Dear ${formData.full_name},

🎉 Congratulations! Your Edge Cloud ERP evaluation account has been successfully activated!

YOUR EVALUATION ACCOUNT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Company Name: ${formData.company_name}
Contact Email: ${formData.email}
Business Type: ${businessTypeConfig?.label}
Base Currency: ${formData.base_currency}
Evaluation Period: 30 days (Expires: ${format(expiryDate, 'MMMM dd, yyyy')})

WHAT'S BEEN SET UP:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Company Profile created
✅ Complete Chart of Accounts (${businessTypeConfig?.label})
✅ All modules enabled for ${businessTypeConfig?.label}
✅ Full system access for 30 days

HOW TO ACCESS YOUR ACCOUNT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 1: Visit Your App
   Go to: ${appUrl}

STEP 2: Click "Sign In"
   You'll be redirected to secure authentication

STEP 3: Create Your Login Account
   - Click "Sign Up" to create your account
   - Use your email: ${formData.email}
   - Create a secure password
   - Complete the signup

STEP 4: Access Edge Cloud ERP
   After authentication, you'll see your company
   Select "${formData.company_name}" to start

ALREADY HAVE AN ACCOUNT?
If you already have an account with email ${formData.email}, 
just log in with your existing credentials!

WHAT YOU CAN DO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Create unlimited customers, vendors, and products
✅ Generate and send invoices
✅ Track inventory across multiple locations
✅ Manage bills and vendor payments
✅ Generate comprehensive financial reports
✅ Invite up to 5 team members
✅ Full access to all ${businessTypeConfig?.label} features

NEED HELP?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Visit Support Guide in the app
• Email: support@edgeclouderp.com

Your 30-day evaluation starts today! We're excited to have you on board.

Best regards,
The Edge Cloud ERP Team

---
This is an automated message. Please do not reply to this email.
          `
        });
        console.log('Welcome email sent successfully');
      } catch (emailError) {
        console.error('Email error (non-fatal):', emailError);
      }
      
      setCompanyEmail(formData.email);
      setCompanyName(formData.company_name);
      setRegistrationComplete(true);
      
    } catch (error) {
      console.error('Registration error:', error);
      setError('Setup failed: ' + (error.message || 'Please try again. If the problem persists, contact support.'));
    } finally {
      setLoading(false);
    }
  };

  if (registrationComplete) {
    const appUrl = window.location.origin;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <Card className="max-w-3xl w-full shadow-2xl">
          <CardContent className="p-12">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                🎉 Company Created Successfully!
              </h1>
              <p className="text-lg text-gray-700">
                {companyName} is ready to use!
              </p>
            </div>

            <Alert className="mb-6 bg-green-50 border-2 border-green-300">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <AlertDescription className="text-green-900">
                <strong className="text-lg">✅ Setup Complete!</strong>
                <p className="mt-2">Your company and chart of accounts have been created.</p>
                <p className="mt-1">We've sent instructions to: <strong>{companyEmail}</strong></p>
              </AlertDescription>
            </Alert>

            {/* Removed the 'Your Login Credentials' section */}

            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-lg p-6 mb-6">
              <h3 className="font-bold text-lg mb-4 text-gray-900">🚀 Next Steps:</h3>
              <ol className="space-y-3 text-gray-800 mb-4">
                <li className="flex gap-3">
                  <span className="font-bold text-blue-600">1.</span>
                  <span>Click "Go to Sign In" below</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-blue-600">2.</span>
                  <span>Create your login account using: <strong className="text-blue-600">{companyEmail}</strong></span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-blue-600">3.</span>
                  <span>After logging in, select your company: <strong>{companyName}</strong></span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-blue-600">4.</span>
                  <span>Start using Edge Cloud ERP!</span>
                </li>
              </ol>

              <Button
                onClick={() => window.location.href = appUrl}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-6 text-lg w-full"
              >
                Go to Sign In →
              </Button>
            </div>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="font-bold text-lg mb-3 text-blue-900">📋 What's Been Created:</h3>
              <ul className="space-y-2 text-blue-900">
                <li>✓ Company: {companyName}</li>
                <li>✓ Contact: {companyEmail}</li>
                <li>✓ Complete Chart of Accounts</li>
                <li>✓ 30-day evaluation access</li>
                <li>✓ All modules enabled</li>
              </ul>
            </div>

            <Alert className="bg-purple-50 border-purple-200">
              <AlertCircle className="h-4 w-4 text-purple-600" />
              <AlertDescription className="text-purple-900 text-sm">
                <strong>Need Help?</strong><br/>
                • Check your email for detailed instructions<br/>
                • Visit the Support Guide after logging in<br/>
                • Contact support@edgeclouderp.com
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Rocket className="w-12 h-12 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Edge Cloud ERP</h1>
          </div>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">
            Start Your 30-Day Free Evaluation
          </h2>
          <p className="text-gray-600">
            Full access to all features • No credit card required • Setup in minutes
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
                1
              </div>
              <span className="font-medium">User Info</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-300"></div>
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
                2
              </div>
              <span className="font-medium">Company Info</span>
            </div>
          </div>
        </div>

        {error && (
          <Alert className="mb-6 bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-900">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <Card className="shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <CardTitle className="text-2xl">
              {step === 1 ? 'Create Your Account' : 'Company Information'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            {step === 1 && (
              <div className="space-y-6">
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-900 text-sm">
                    <strong>Simple Setup:</strong> Your company will be created and then you can create your login account.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Full Name *</Label>
                    <Input
                      value={formData.full_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Email Address *</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="john@company.com"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Create Password *</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Minimum 6 characters"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-600">This password will be validated, but your actual login will be created via a separate sign-up flow after company creation.</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+1 234 567 8900"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Job Title</Label>
                    <Input
                      value={formData.job_title}
                      onChange={(e) => setFormData(prev => ({ ...prev, job_title: e.target.value }))}
                      placeholder="e.g., CEO, CFO, Manager"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => setStep(2)} className="bg-blue-600 hover:bg-blue-700">
                    Continue to Company Info →
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Company/Organization Name *</Label>
                    <Input
                      value={formData.company_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                      placeholder="ABC Manufacturing Ltd"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Trading Name</Label>
                    <Input
                      value={formData.trading_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, trading_name: e.target.value }))}
                      placeholder="ABC Manufacturing"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Business Type *</Label>
                    <Select
                      value={formData.company_type}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, company_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {businessTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Industry</Label>
                    <Input
                      value={formData.industry}
                      onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                      placeholder="e.g., Manufacturing, Retail"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Accounting Method *</Label>
                    <Select
                      value={formData.accounting_method}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, accounting_method: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="accrual">Accrual Basis</SelectItem>
                        <SelectItem value="cash">Cash Basis</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Account Period Structure *</Label>
                    <Select
                      value={formData.account_period_structure}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, account_period_structure: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Fiscal Year End</Label>
                    <Input
                      value={formData.fiscal_year_end}
                      onChange={(e) => setFormData(prev => ({ ...prev, fiscal_year_end: e.target.value }))}
                      placeholder="MM-DD (e.g., 12-31)"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Base Currency *</Label>
                    <Select
                      value={formData.base_currency}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, base_currency: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        <SelectItem value="NGN">NGN - Nigerian Naira</SelectItem>
                        <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                        <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Contact Phone</Label>
                    <Input
                      value={formData.contact_phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                      placeholder="+1 234 567 8900"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Website</Label>
                    <Input
                      value={formData.website}
                      onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                      placeholder="https://www.company.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tax Number</Label>
                    <Input
                      value={formData.tax_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, tax_number: e.target.value }))}
                      placeholder="Tax ID / VAT"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Registration Number</Label>
                    <Input
                      value={formData.registration_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, registration_number: e.target.value }))}
                      placeholder="Business registration #"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Company Address</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label>Street</Label>
                      <Input
                        value={formData.address.street}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          address: { ...prev.address, street: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>City</Label>
                      <Input
                        value={formData.address.city}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          address: { ...prev.address, city: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>State/Province</Label>
                      <Input
                        value={formData.address.state}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          address: { ...prev.address, state: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Postal Code</Label>
                      <Input
                        value={formData.address.postal_code}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          address: { ...prev.address, postal_code: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Country</Label>
                      <Input
                        value={formData.address.country}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          address: { ...prev.address, country: e.target.value }
                        }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                  <h3 className="font-semibold text-lg mb-2">What happens next?</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>✅ Your company will be created instantly</li>
                    <li>✅ Complete Chart of Accounts set up automatically</li>
                    <li>✅ Confirmation email sent with instructions on how to create your login</li>
                    <li>✅ Immediate access to all features for 30 days</li>
                  </ul>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    ← Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                        Setting Up...
                      </span>
                    ) : (
                      'Complete Setup & Activate'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-gray-600 mt-6 text-sm">
          Already have an account? <a href="/" className="text-blue-600 hover:underline">Login here</a>
        </p>
      </div>
    </div>
  );
}

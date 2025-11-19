
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Building2, CheckCircle, AlertCircle, Users, Pencil, Shield } from "lucide-react";
import { format } from "date-fns";
import { useCompany } from "../components/auth/CompanyContext";

export default function CompanyManagement() {
  const { user } = useCompany();
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [formData, setFormData] = useState({
    company_code: '',
    company_name: '',
    trading_name: '',
    registration_number: '',
    tax_number: '',
    industry: '',
    company_type: 'trading',
    address: {
      street: '',
      city: '',
      state: '',
      postal_code: '',
      country: ''
    },
    contact_email: '',
    contact_phone: '',
    website: '',
    fiscal_year_end: '12-31',
    base_currency: 'USD',
    is_active: true,
    onboarding_completed: false,
    modules_enabled: {
      sales: true,
      purchases: true,
      inventory: true,
      accounting: true,
      manufacturing: false,
      job_costing: false,
      fixed_assets: false,
      payroll: false,
      non_profit: false,
      multi_currency: false,
      pos: false
    }
  });

  const queryClient = useQueryClient();

  // CRITICAL: Only super admins can access this page
  const isSuperAdmin = user?.is_super_admin === true;

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list('-created_date'),
    enabled: isSuperAdmin // Only fetch if super admin
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    enabled: isSuperAdmin
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (editingCompany) {
        return base44.entities.Company.update(editingCompany.id, data);
      }
      return base44.entities.Company.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['companies']);
      setShowForm(false);
      resetForm();
    }
  });

  // If not super admin, show access denied
  if (!isSuperAdmin) {
    return (
      <div className="p-6">
        <Alert className="bg-red-50 border-red-200">
          <Shield className="h-5 w-5 text-red-600" />
          <AlertDescription className="text-red-900">
            <strong className="text-lg">Access Denied</strong>
            <p className="mt-2">This page is only accessible to system administrators. Please contact your administrator if you need access.</p>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleEdit = (company) => {
    setEditingCompany(company);
    setFormData({
      ...company,
      address: company.address || {
        street: '',
        city: '',
        state: '',
        postal_code: '',
        country: ''
      },
      modules_enabled: company.modules_enabled || {
        sales: true,
        purchases: true,
        inventory: true,
        accounting: true,
        manufacturing: false,
        job_costing: false,
        fixed_assets: false,
        payroll: false,
        non_profit: false,
        multi_currency: false,
        pos: false
      }
    });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!formData.company_name || !formData.contact_email) {
      alert('Please fill in required fields: Company Name and Contact Email');
      return;
    }
    saveMutation.mutate(formData);
  };

  const handleModuleToggle = (module) => {
    setFormData(prev => ({
      ...prev,
      modules_enabled: {
        ...prev.modules_enabled,
        [module]: !prev.modules_enabled[module]
      }
    }));
  };

  const resetForm = () => {
    setEditingCompany(null);
    setFormData({
      company_code: '',
      company_name: '',
      trading_name: '',
      registration_number: '',
      tax_number: '',
      industry: '',
      company_type: 'trading',
      address: {
        street: '',
        city: '',
        state: '',
        postal_code: '',
        country: ''
      },
      contact_email: '',
      contact_phone: '',
      website: '',
      fiscal_year_end: '12-31',
      base_currency: 'USD',
      is_active: true,
      onboarding_completed: false,
      modules_enabled: {
        sales: true,
        purchases: true,
        inventory: true,
        accounting: true,
        manufacturing: false,
        job_costing: false,
        fixed_assets: false,
        payroll: false,
        non_profit: false,
        multi_currency: false,
        pos: false
      }
    });
  };

  const licenseTypeColors = {
    trial: "bg-yellow-100 text-yellow-800",
    basic: "bg-blue-100 text-blue-800",
    professional: "bg-purple-100 text-purple-800",
    enterprise: "bg-green-100 text-green-800",
    custom: "bg-indigo-100 text-indigo-800"
  };

  const statusColors = {
    active: "bg-green-100 text-green-800",
    trial: "bg-blue-100 text-blue-800",
    expired: "bg-red-100 text-red-800",
    suspended: "bg-orange-100 text-orange-800",
    cancelled: "bg-gray-100 text-gray-800"
  };

  return (
    <div className="p-6 space-y-6">
      <Alert className="bg-blue-50 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900">
          <strong>Admin Panel:</strong> You are viewing this page as a <strong>Super Administrator</strong>. 
          Regular users do not have access to this page and cannot see this information.
        </AlertDescription>
      </Alert>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Company Management</h1>
          <p className="text-gray-500 mt-1">View and manage your company information</p>
        </div>
        <Dialog open={showForm} onOpenChange={(open) => {
          setShowForm(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              New Company
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCompany ? 'Edit Company' : 'Create New Company'}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 pt-4">
              {/* Company Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Company Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Company Code</Label>
                      <Input
                        value={formData.company_code}
                        onChange={(e) => setFormData(prev => ({ ...prev, company_code: e.target.value }))}
                        placeholder="e.g., ABC001"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Company Name *</Label>
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
                      <Label>Industry</Label>
                      <Input
                        value={formData.industry}
                        onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                        placeholder="Manufacturing, Retail, etc."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Company Type</Label>
                      <Select
                        value={formData.company_type}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, company_type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manufacturing">Manufacturing</SelectItem>
                          <SelectItem value="trading">Trading</SelectItem>
                          <SelectItem value="service">Service</SelectItem>
                          <SelectItem value="non_profit">Non-Profit</SelectItem>
                          <SelectItem value="construction">Construction</SelectItem>
                          <SelectItem value="retail">Retail</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Registration Number</Label>
                      <Input
                        value={formData.registration_number}
                        onChange={(e) => setFormData(prev => ({ ...prev, registration_number: e.target.value }))}
                        placeholder="Business registration number"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Tax Number</Label>
                      <Input
                        value={formData.tax_number}
                        onChange={(e) => setFormData(prev => ({ ...prev, tax_number: e.target.value }))}
                        placeholder="Tax ID / VAT number"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Base Currency</Label>
                      <Input
                        value={formData.base_currency}
                        onChange={(e) => setFormData(prev => ({ ...prev, base_currency: e.target.value }))}
                        placeholder="USD, EUR, GBP, etc."
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Contact Email *</Label>
                      <Input
                        type="email"
                        value={formData.contact_email}
                        onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                        placeholder="contact@company.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Contact Phone</Label>
                      <Input
                        value={formData.contact_phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                        placeholder="+1 234 567 8900"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>Website</Label>
                      <Input
                        value={formData.website}
                        onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                        placeholder="https://www.company.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Street Address</Label>
                      <Input
                        value={formData.address.street}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          address: { ...prev.address, street: e.target.value }
                        }))}
                        placeholder="123 Main Street"
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
                        placeholder="New York"
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
                        placeholder="NY"
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
                        placeholder="10001"
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
                        placeholder="United States"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* MODULE PREFERENCES - THIS IS WHAT YOU'RE LOOKING FOR! */}
              <Card className="border-2 border-blue-300 bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    Module Preferences
                  </CardTitle>
                  <p className="text-sm text-gray-600">Enable or disable modules for this company</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                      <div>
                        <Label className="font-semibold">Sales</Label>
                        <p className="text-xs text-gray-500">Invoices, Customers, Sales Reports</p>
                      </div>
                      <Switch
                        checked={formData.modules_enabled.sales}
                        onCheckedChange={() => handleModuleToggle('sales')}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                      <div>
                        <Label className="font-semibold">Purchases</Label>
                        <p className="text-xs text-gray-500">Bills, Vendors, Purchase Orders</p>
                      </div>
                      <Switch
                        checked={formData.modules_enabled.purchases}
                        onCheckedChange={() => handleModuleToggle('purchases')}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                      <div>
                        <Label className="font-semibold">Inventory</Label>
                        <p className="text-xs text-gray-500">Products, Stock Management</p>
                      </div>
                      <Switch
                        checked={formData.modules_enabled.inventory}
                        onCheckedChange={() => handleModuleToggle('inventory')}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                      <div>
                        <Label className="font-semibold">Accounting</Label>
                        <p className="text-xs text-gray-500">General Ledger, Reports</p>
                      </div>
                      <Switch
                        checked={formData.modules_enabled.accounting}
                        onCheckedChange={() => handleModuleToggle('accounting')}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                      <div>
                        <Label className="font-semibold">Point of Sale (POS)</Label>
                        <p className="text-xs text-gray-500">Retail Sales Terminal</p>
                      </div>
                      <Switch
                        checked={formData.modules_enabled.pos}
                        onCheckedChange={() => handleModuleToggle('pos')}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                      <div>
                        <Label className="font-semibold">Manufacturing</Label>
                        <p className="text-xs text-gray-500">Production, Work Orders, BOM</p>
                      </div>
                      <Switch
                        checked={formData.modules_enabled.manufacturing}
                        onCheckedChange={() => handleModuleToggle('manufacturing')}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                      <div>
                        <Label className="font-semibold">Job Costing</Label>
                        <p className="text-xs text-gray-500">Project Tracking, Job Costs</p>
                      </div>
                      <Switch
                        checked={formData.modules_enabled.job_costing}
                        onCheckedChange={() => handleModuleToggle('job_costing')}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                      <div>
                        <Label className="font-semibold">Fixed Assets</Label>
                        <p className="text-xs text-gray-500">Asset Management, Depreciation</p>
                      </div>
                      <Switch
                        checked={formData.modules_enabled.fixed_assets}
                        onCheckedChange={() => handleModuleToggle('fixed_assets')}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                      <div>
                        <Label className="font-semibold">Payroll</Label>
                        <p className="text-xs text-gray-500">Employee Payroll Processing</p>
                      </div>
                      <Switch
                        checked={formData.modules_enabled.payroll}
                        onCheckedChange={() => handleModuleToggle('payroll')}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                      <div>
                        <Label className="font-semibold">Non-Profit</Label>
                        <p className="text-xs text-gray-500">Donations, Grants, Programs</p>
                      </div>
                      <Switch
                        checked={formData.modules_enabled.non_profit}
                        onCheckedChange={() => handleModuleToggle('non_profit')}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                      <div>
                        <Label className="font-semibold">Multi-Currency</Label>
                        <p className="text-xs text-gray-500">Foreign Currency Support</p>
                      </div>
                      <Switch
                        checked={formData.modules_enabled.multi_currency}
                        onCheckedChange={() => handleModuleToggle('multi_currency')}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}>
                  Cancel
                </Button>
                <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                  {editingCompany ? 'Update Company' : 'Create Company'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Companies</p>
                <p className="text-3xl font-bold text-blue-900 mt-1">{companies.length}</p>
              </div>
              <Building2 className="w-12 h-12 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Companies</p>
                <p className="text-3xl font-bold text-green-900 mt-1">
                  {companies.filter(c => c.is_active && c.subscription_status === 'active').length}
                </p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-purple-900 mt-1">{users.length}</p>
              </div>
              <Users className="w-12 h-12 text-purple-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Companies Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Loading companies...</p>
            </div>
          ) : companies.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Companies Yet</h3>
              <p className="text-gray-600 mb-4">Create your first company to get started</p>
              <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Company
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>License Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Enabled Modules</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{company.company_name}</p>
                        {company.trading_name && company.trading_name !== company.company_name && (
                          <p className="text-xs text-gray-500">Trading as: {company.trading_name}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{company.industry || '-'}</TableCell>
                    <TableCell>
                      <Badge className={licenseTypeColors[company.license_type]}>
                        {company.license_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[company.subscription_status]}>
                        {company.subscription_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {company.license_expiry_date ? format(new Date(company.license_expiry_date), 'MMM d, yyyy') : '-'}
                    </TableCell>
                    <TableCell>
                      {users.filter(u => u.company_id === company.id || u.accessible_companies?.includes(company.id)).length} / {company.user_limit}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {company.modules_enabled && Object.entries(company.modules_enabled)
                          .filter(([_, enabled]) => enabled)
                          .slice(0, 3)
                          .map(([module]) => (
                            <Badge key={module} variant="outline" className="text-xs">
                              {module}
                            </Badge>
                          ))}
                        {company.modules_enabled && Object.values(company.modules_enabled).filter(Boolean).length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{Object.values(company.modules_enabled).filter(Boolean).length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(company)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-lg mb-3">📘 Company Management</h3>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex gap-3">
              <span className="font-bold text-blue-600">•</span>
              <p><strong>View Company Details:</strong> All users can view their company information and see which modules are enabled.</p>
            </div>
            <div className="flex gap-3">
              <span className="font-bold text-blue-600">•</span>
              <p><strong>Edit Company & Enable/Disable Modules:</strong> Click the Edit (pencil) button on any company to modify details and toggle modules on/off.</p>
            </div>
            <div className="flex gap-3">
              <span className="font-bold text-blue-600">•</span>
              <p><strong>Module Access:</strong> Enabled modules determine which features appear in the sidebar. Disabled modules are hidden.</p>
            </div>
            <div className="flex gap-3">
              <span className="font-bold text-blue-600">•</span>
              <p><strong>User Management:</strong> Go to User Management to invite new users and assign roles.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

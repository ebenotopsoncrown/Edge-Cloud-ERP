import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Key, Copy, CheckCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";

export default function LicenseManagement() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    license_key: '',
    activation_code: '',
    license_type: 'trial',
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
    },
    user_limit: 1,
    issue_date: format(new Date(), 'yyyy-MM-dd'),
    expiry_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    is_active: true,
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    custom_features: [],
    notes: ''
  });

  const queryClient = useQueryClient();

  const { data: licenses = [] } = useQuery({
    queryKey: ['licenses'],
    queryFn: () => base44.entities.License.list('-issue_date')
  });

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.License.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['licenses']);
      setShowForm(false);
      resetForm();
    }
  });

  const generateLicenseKey = () => {
    const segments = [];
    for (let i = 0; i < 4; i++) {
      const segment = Math.random().toString(36).substring(2, 7).toUpperCase();
      segments.push(segment);
    }
    return segments.join('-');
  };

  const generateActivationCode = () => {
    return Math.random().toString(36).substring(2, 15).toUpperCase();
  };

  const handleGenerateKeys = () => {
    setFormData(prev => ({
      ...prev,
      license_key: generateLicenseKey(),
      activation_code: generateActivationCode()
    }));
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

  const handleSave = () => {
    if (!formData.company_name || !formData.license_key) {
      alert('Please fill in required fields');
      return;
    }
    saveMutation.mutate(formData);
  };

  const resetForm = () => {
    setFormData({
      company_name: '',
      license_key: '',
      activation_code: '',
      license_type: 'trial',
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
      },
      user_limit: 1,
      issue_date: format(new Date(), 'yyyy-MM-dd'),
      expiry_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      is_active: true,
      contact_person: '',
      contact_email: '',
      contact_phone: '',
      custom_features: [],
      notes: ''
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const licenseTypeColors = {
    trial: "bg-yellow-100 text-yellow-800",
    basic: "bg-blue-100 text-blue-800",
    professional: "bg-purple-100 text-purple-800",
    enterprise: "bg-green-100 text-green-800",
    custom: "bg-indigo-100 text-indigo-800"
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">License Management</h1>
          <p className="text-gray-500 mt-1">Generate and manage client licenses</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              New License
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Generate New License</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 pt-4">
              {/* Company Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Company Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Company Name *</Label>
                    <Input
                      value={formData.company_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                      placeholder="ABC Corporation"
                    />
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
                    <Label>Contact Email</Label>
                    <Input
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                      placeholder="john@example.com"
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
                </div>
              </div>

              {/* License Keys */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">License Keys</h3>
                  <Button onClick={handleGenerateKeys} variant="outline" size="sm">
                    <Key className="w-4 h-4 mr-2" />
                    Generate Keys
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label>License Key *</Label>
                    <div className="flex gap-2">
                      <Input
                        value={formData.license_key}
                        onChange={(e) => setFormData(prev => ({ ...prev, license_key: e.target.value }))}
                        placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
                      />
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => copyToClipboard(formData.license_key)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Activation Code *</Label>
                    <div className="flex gap-2">
                      <Input
                        value={formData.activation_code}
                        onChange={(e) => setFormData(prev => ({ ...prev, activation_code: e.target.value }))}
                        placeholder="XXXXXXXXXXXXXX"
                      />
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => copyToClipboard(formData.activation_code)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* License Details */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">License Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>License Type</Label>
                    <Select 
                      value={formData.license_type}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, license_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="trial">Trial (30 days)</SelectItem>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>User Limit</Label>
                    <Input
                      type="number"
                      value={formData.user_limit}
                      onChange={(e) => setFormData(prev => ({ ...prev, user_limit: parseInt(e.target.value) }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Issue Date</Label>
                    <Input
                      type="date"
                      value={formData.issue_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, issue_date: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Expiry Date</Label>
                    <Input
                      type="date"
                      value={formData.expiry_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Modules */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Enabled Modules</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.keys(formData.modules_enabled).map((module) => (
                    <div key={module} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <Label className="text-sm capitalize">
                        {module.replace(/_/g, ' ')}
                      </Label>
                      <Switch
                        checked={formData.modules_enabled[module]}
                        onCheckedChange={() => handleModuleToggle(module)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes & Custom Features</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Custom features, special requirements, etc."
                  rows={4}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                  Generate License
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Licenses Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>License Key</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {licenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    No licenses generated yet
                  </TableCell>
                </TableRow>
              ) : (
                licenses.map((license) => (
                  <TableRow key={license.id}>
                    <TableCell className="font-medium">{license.company_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">{license.license_key}</span>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(license.license_key)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={licenseTypeColors[license.license_type]}>
                        {license.license_type}
                      </Badge>
                    </TableCell>
                    <TableCell>{license.user_limit}</TableCell>
                    <TableCell>{format(new Date(license.issue_date), 'MMM d, yyyy')}</TableCell>
                    <TableCell>{format(new Date(license.expiry_date), 'MMM d, yyyy')}</TableCell>
                    <TableCell>
                      {license.is_active ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
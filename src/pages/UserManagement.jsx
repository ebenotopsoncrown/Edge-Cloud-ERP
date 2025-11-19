
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Plus, Users, Shield, Pencil, Trash2, Key, Info, Copy, CheckCircle, Building2 } from "lucide-react";
import { useCompany } from "../components/auth/CompanyContext";

export default function UserManagement() {
  const { currentCompany, user } = useCompany();
  const queryClient = useQueryClient();
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingRole, setEditingRole] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const [userForm, setUserForm] = useState({
    email: '',
    full_name: '',
    role_id: '',
    is_active: true
  });

  const [roleForm, setRoleForm] = useState({
    role_name: '',
    description: '',
    permissions: {
      sales: { access: false, create: false, edit: false, delete: false, view_reports: false },
      purchases: { access: false, create: false, edit: false, delete: false, view_reports: false },
      inventory: { access: false, create: false, edit: false, delete: false, view_reports: false },
      accounting: { access: false, create_entries: false, post_entries: false, void_entries: false, view_reports: false, reconcile_accounts: false },
      banking: { access: false, make_payments: false, write_checks: false, reconcile: false },
      reports: { view_financial_reports: false, view_management_reports: false, export_reports: false },
      settings: { manage_users: false, manage_company: false, manage_chart_of_accounts: false }
    }
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users', currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany) return [];
      const allUsers = await base44.entities.User.list();
      return allUsers.filter(u => 
        u.company_id === currentCompany.id || 
        u.accessible_companies?.includes(currentCompany.id)
      );
    },
    enabled: !!currentCompany
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies-list'],
    queryFn: () => base44.entities.Company.list(),
    enabled: true
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['roles', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.Role.filter({ company_id: currentCompany.id }) : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, data }) => base44.entities.User.update(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      alert('User updated successfully!');
    }
  });

  const saveRoleMutation = useMutation({
    mutationFn: (data) => {
      if (editingRole) {
        return base44.entities.Role.update(editingRole.id, data);
      }
      return base44.entities.Role.create({ ...data, company_id: currentCompany.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['roles']);
      setShowRoleDialog(false);
      resetRoleForm();
    }
  });

  const handlePermissionToggle = (module, permission) => {
    setRoleForm(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [module]: {
          ...prev.permissions[module],
          [permission]: !prev.permissions[module][permission]
        }
      }
    }));
  };

  const handleModuleToggle = (module) => {
    const currentAccess = roleForm.permissions[module].access || false;
    const newPermissions = { ...roleForm.permissions };
    
    Object.keys(newPermissions[module]).forEach(key => {
      newPermissions[module][key] = !currentAccess;
    });

    setRoleForm(prev => ({
      ...prev,
      permissions: newPermissions
    }));
  };

  const resetRoleForm = () => {
    setEditingRole(null);
    setRoleForm({
      role_name: '',
      description: '',
      permissions: {
        sales: { access: false, create: false, edit: false, delete: false, view_reports: false },
        purchases: { access: false, create: false, edit: false, delete: false, view_reports: false },
        inventory: { access: false, create: false, edit: false, delete: false, view_reports: false },
        accounting: { access: false, create_entries: false, post_entries: false, void_entries: false, view_reports: false, reconcile_accounts: false },
        banking: { access: false, make_payments: false, write_checks: false, reconcile: false },
        reports: { view_financial_reports: false, view_management_reports: false, export_reports: false },
        settings: { manage_users: false, manage_company: false, manage_chart_of_accounts: false }
      }
    });
  };

  const handleEditRole = (role) => {
    setEditingRole(role);
    setRoleForm({
      role_name: role.role_name,
      description: role.description || '',
      permissions: role.permissions || roleForm.permissions
    });
    setShowRoleDialog(true);
  };

  const handleCopyCompanyId = (companyId, companyName) => {
    navigator.clipboard.writeText(companyId);
    setCopiedId(companyId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAssignUserToCompany = (userId, companyId) => {
    updateUserMutation.mutate({
      userId,
      data: {
        company_id: companyId,
        accessible_companies: [companyId] // Per outline, replace accessible_companies with the new company_id
      }
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">User & Company Management</h1>
        <p className="text-gray-500 mt-1">Manage users and assign them to companies</p>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-2xl">
          <TabsTrigger value="users">
            <Users className="w-4 h-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="companies">
            <Building2 className="w-4 h-4 mr-2" />
            Company IDs
          </TabsTrigger>
          <TabsTrigger value="roles">
            <Shield className="w-4 h-4 mr-2" />
            Roles
          </TabsTrigger>
        </TabsList>

        {/* USERS TAB */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Users</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-900">
                  <strong>To invite new users:</strong> Go to base44 Dashboard → Users → Invite User. 
                  Then assign them to companies using the Company IDs tab.
                </AlertDescription>
              </Alert>

              {users.length > 0 && (
                <div className="mt-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Primary Company</TableHead>
                        <TableHead>Accessible Companies</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map(u => {
                        const primaryCompany = companies.find(c => c.id === u.company_id);
                        const accessibleCompanyNames = u.accessible_companies?.map(id => 
                          companies.find(c => c.id === id)?.company_name || 'Unknown'
                        ) || [];
                        
                        return (
                          <TableRow key={u.id}>
                            <TableCell className="font-medium">{u.full_name}</TableCell>
                            <TableCell>{u.email}</TableCell>
                            <TableCell>
                              {primaryCompany ? (
                                <Badge variant="outline">{primaryCompany.company_name}</Badge>
                              ) : (
                                <span className="text-red-600 text-sm">Not Assigned</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {accessibleCompanyNames.length > 0 ? (
                                  accessibleCompanyNames.slice(0, 2).map((name, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">{name}</Badge>
                                  ))
                                ) : (
                                  <span className="text-gray-500 text-sm">None</span>
                                )}
                                {accessibleCompanyNames.length > 2 && (
                                  <Badge variant="outline" className="text-xs">+{accessibleCompanyNames.length - 2}</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={u.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                                {u.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Select onValueChange={(companyId) => handleAssignUserToCompany(u.id, companyId)}>
                                <SelectTrigger className="w-40">
                                  <SelectValue placeholder="Assign Company" />
                                </SelectTrigger>
                                <SelectContent>
                                  {companies.map(company => (
                                    <SelectItem key={company.id} value={company.id}>
                                      {company.company_name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* COMPANY IDs TAB - NEW! */}
        <TabsContent value="companies">
          <Card>
            <CardHeader>
              <CardTitle>Company IDs Reference</CardTitle>
              <p className="text-sm text-gray-600 mt-2">Copy company IDs to assign users in base44 settings</p>
            </CardHeader>
            <CardContent>
              <Alert className="mb-6 bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-900">
                  <strong>How to assign users:</strong><br/>
                  1. Click the copy button next to a company ID<br/>
                  2. Go to base44 Dashboard → Users → Edit User<br/>
                  3. Paste the company ID in the "company_id" field<br/>
                  4. Add the same ID to "accessible_companies" array<br/>
                  5. Save!
                </AlertDescription>
              </Alert>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company Name</TableHead>
                    <TableHead>Company ID</TableHead>
                    <TableHead>Contact Email</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map(company => (
                    <TableRow key={company.id}>
                      <TableCell className="font-medium">{company.company_name}</TableCell>
                      <TableCell>
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs">{company.id}</code>
                      </TableCell>
                      <TableCell>{company.contact_email}</TableCell>
                      <TableCell>
                        <Badge className="capitalize">{company.company_type?.replace(/_/g, ' ')}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyCompanyId(company.id, company.company_name)}
                          className="gap-2"
                        >
                          {copiedId === company.id ? (
                            <>
                              <CheckCircle className="w-3 h-3 text-green-600" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              Copy ID
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ROLES TAB */}
        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Roles</CardTitle>
                <Dialog open={showRoleDialog} onOpenChange={(open) => {
                  setShowRoleDialog(open);
                  if (!open) resetRoleForm();
                }}>
                  <DialogTrigger asChild>
                    <Button className="bg-green-600 hover:bg-green-700">
                      <Plus className="w-4 h-4 mr-2" />
                      New Role
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingRole ? 'Edit Role' : 'Create New Role'}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6 pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Role Name *</Label>
                          <Input
                            value={roleForm.role_name}
                            onChange={(e) => setRoleForm(prev => ({ ...prev, role_name: e.target.value }))}
                            placeholder="e.g., Accountant, AR Manager"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Input
                            value={roleForm.description}
                            onChange={(e) => setRoleForm(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Brief description of role"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Permissions</h3>
                        
                        {/* Sales Module */}
                        <Card>
                          <CardHeader className="pb-3">
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={roleForm.permissions.sales.access}
                                onCheckedChange={() => handleModuleToggle('sales')}
                              />
                              <Label className="font-semibold">Sales & Customers</Label>
                            </div>
                          </CardHeader>
                          {roleForm.permissions.sales.access && (
                            <CardContent className="grid grid-cols-3 gap-3 pt-0">
                              {Object.keys(roleForm.permissions.sales).filter(k => k !== 'access').map(perm => (
                                <div key={perm} className="flex items-center gap-2">
                                  <Checkbox
                                    checked={roleForm.permissions.sales[perm]}
                                    onCheckedChange={() => handlePermissionToggle('sales', perm)}
                                  />
                                  <Label className="text-sm capitalize">{perm.replace(/_/g, ' ')}</Label>
                                </div>
                              ))}
                            </CardContent>
                          )}
                        </Card>

                        {/* Purchases Module */}
                        <Card>
                          <CardHeader className="pb-3">
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={roleForm.permissions.purchases.access}
                                onCheckedChange={() => handleModuleToggle('purchases')}
                              />
                              <Label className="font-semibold">Purchases & Vendors</Label>
                            </div>
                          </CardHeader>
                          {roleForm.permissions.purchases.access && (
                            <CardContent className="grid grid-cols-3 gap-3 pt-0">
                              {Object.keys(roleForm.permissions.purchases).filter(k => k !== 'access').map(perm => (
                                <div key={perm} className="flex items-center gap-2">
                                  <Checkbox
                                    checked={roleForm.permissions.purchases[perm]}
                                    onCheckedChange={() => handlePermissionToggle('purchases', perm)}
                                  />
                                  <Label className="text-sm capitalize">{perm.replace(/_/g, ' ')}</Label>
                                </div>
                              ))}
                            </CardContent>
                          )}
                        </Card>

                        {/* Accounting Module */}
                        <Card>
                          <CardHeader className="pb-3">
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={roleForm.permissions.accounting.access}
                                onCheckedChange={() => handleModuleToggle('accounting')}
                              />
                              <Label className="font-semibold">Accounting & General Ledger</Label>
                            </div>
                          </CardHeader>
                          {roleForm.permissions.accounting.access && (
                            <CardContent className="grid grid-cols-3 gap-3 pt-0">
                              {Object.keys(roleForm.permissions.accounting).filter(k => k !== 'access').map(perm => (
                                <div key={perm} className="flex items-center gap-2">
                                  <Checkbox
                                    checked={roleForm.permissions.accounting[perm]}
                                    onCheckedChange={() => handlePermissionToggle('accounting', perm)}
                                  />
                                  <Label className="text-sm capitalize">{perm.replace(/_/g, ' ')}</Label>
                                </div>
                              ))}
                            </CardContent>
                          )}
                        </Card>

                        {/* Banking Module */}
                        <Card>
                          <CardHeader className="pb-3">
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={roleForm.permissions.banking.access}
                                onCheckedChange={() => handleModuleToggle('banking')}
                              />
                              <Label className="font-semibold">Banking</Label>
                            </div>
                          </CardHeader>
                          {roleForm.permissions.banking.access && (
                            <CardContent className="grid grid-cols-3 gap-3 pt-0">
                              {Object.keys(roleForm.permissions.banking).filter(k => k !== 'access').map(perm => (
                                <div key={perm} className="flex items-center gap-2">
                                  <Checkbox
                                    checked={roleForm.permissions.banking[perm]}
                                    onCheckedChange={() => handlePermissionToggle('banking', perm)}
                                  />
                                  <Label className="text-sm capitalize">{perm.replace(/_/g, ' ')}</Label>
                                </div>
                              ))}
                            </CardContent>
                          )}
                        </Card>
                      </div>

                      <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button variant="outline" onClick={() => {
                          setShowRoleDialog(false);
                          resetRoleForm();
                        }}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={() => saveRoleMutation.mutate(roleForm)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {editingRole ? 'Update Role' : 'Create Role'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {roles.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 mb-4">No roles created yet</p>
                  <p className="text-sm text-gray-400">Create roles to assign specific permissions to users</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roles.map(role => (
                      <TableRow key={role.id}>
                        <TableCell className="font-medium">{role.role_name}</TableCell>
                        <TableCell>{role.description}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(role.permissions || {}).filter(([_, perms]) => perms.access).map(([module]) => (
                              <Badge key={module} variant="outline" className="text-xs">
                                {module}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={role.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                            {role.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleEditRole(role)}>
                              <Pencil className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Help Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            User Assignment Made Easy
          </h3>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex gap-3">
              <span className="font-bold text-blue-600">1.</span>
              <p><strong>View Company IDs:</strong> Click the "Company IDs" tab to see all company IDs</p>
            </div>
            <div className="flex gap-3">
              <span className="font-bold text-blue-600">2.</span>
              <p><strong>Copy Company ID:</strong> Click "Copy ID" button next to the company</p>
            </div>
            <div className="flex gap-3">
              <span className="font-bold text-blue-600">3.</span>
              <p><strong>Assign in base44:</strong> Edit user in base44 Dashboard and paste the ID</p>
            </div>
            <div className="flex gap-3">
              <span className="font-bold text-blue-600">4.</span>
              <p><strong>Quick Assign:</strong> Or use the dropdown in the Users tab to assign instantly</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

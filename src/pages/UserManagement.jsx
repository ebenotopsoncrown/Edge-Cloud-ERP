import React, { useState } from "react";
import { Company, createEntity } from "@/api/entities";
const UserRecord = createEntity('users');
const Role = createEntity('roles');
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Users, Shield, Pencil, Key, Info, Copy, CheckCircle, Building2 } from "lucide-react";
import { useCompany } from "../components/auth/CompanyContext";
import PageShell, { PageHeader, StatBar, ERPTable, ERPTableRow, ERPTableCell, StatusBadge, ActionBtn, NewBtn } from "../components/shared/PageShell";

const PRIMARY = '#1B4F8A';
const ACCENT  = '#00A86B';

const inputStyle = {
  width: '100%', padding: '9px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8,
  fontSize: 13.5, color: '#0F172A', background: 'white', outline: 'none', fontFamily: 'inherit',
};

function PermCheckbox({ checked, onChange, label }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 13 }}>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ width: 14, height: 14, accentColor: ACCENT }} />
      <span style={{ color: '#475569', textTransform: 'capitalize' }}>{label.replace(/_/g, ' ')}</span>
    </label>
  );
}

export default function UserManagement() {
  const { currentCompany, user } = useCompany();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('users');
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const [roleForm, setRoleForm] = useState({
    role_name: '', description: '',
    permissions: {
      sales:      { access: false, create: false, edit: false, delete: false, view_reports: false },
      purchases:  { access: false, create: false, edit: false, delete: false, view_reports: false },
      inventory:  { access: false, create: false, edit: false, delete: false, view_reports: false },
      accounting: { access: false, create_entries: false, post_entries: false, void_entries: false, view_reports: false, reconcile_accounts: false },
      banking:    { access: false, make_payments: false, write_checks: false, reconcile: false },
      reports:    { view_financial_reports: false, view_management_reports: false, export_reports: false },
      settings:   { manage_users: false, manage_company: false, manage_chart_of_accounts: false }
    }
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users', currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany) return [];
      const allUsers = await UserRecord.list();
      return allUsers.filter(u => u.company_id === currentCompany.id || u.accessible_companies?.includes(currentCompany.id));
    },
    enabled: !!currentCompany
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies-list'],
    queryFn: () => Company.list(),
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['roles', currentCompany?.id],
    queryFn: () => currentCompany ? Role.list({ filters: { company_id: currentCompany.id } }) : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, data }) => UserRecord.update(userId, data),
    onSuccess: () => { queryClient.invalidateQueries(['users']); alert('User updated!'); }
  });

  const saveRoleMutation = useMutation({
    mutationFn: (data) => editingRole ? Role.update(editingRole.id, data) : Role.create({ ...data, company_id: currentCompany.id }),
    onSuccess: () => { queryClient.invalidateQueries(['roles']); setShowRoleDialog(false); resetRoleForm(); }
  });

  const handlePermissionToggle = (module, permission) => {
    setRoleForm(prev => ({ ...prev, permissions: { ...prev.permissions, [module]: { ...prev.permissions[module], [permission]: !prev.permissions[module][permission] } } }));
  };

  const handleModuleToggle = (module) => {
    const currentAccess = roleForm.permissions[module].access || false;
    const newPermissions = { ...roleForm.permissions };
    Object.keys(newPermissions[module]).forEach(key => { newPermissions[module][key] = !currentAccess; });
    setRoleForm(prev => ({ ...prev, permissions: newPermissions }));
  };

  const resetRoleForm = () => {
    setEditingRole(null);
    setRoleForm({ role_name: '', description: '', permissions: { sales: { access: false, create: false, edit: false, delete: false, view_reports: false }, purchases: { access: false, create: false, edit: false, delete: false, view_reports: false }, inventory: { access: false, create: false, edit: false, delete: false, view_reports: false }, accounting: { access: false, create_entries: false, post_entries: false, void_entries: false, view_reports: false, reconcile_accounts: false }, banking: { access: false, make_payments: false, write_checks: false, reconcile: false }, reports: { view_financial_reports: false, view_management_reports: false, export_reports: false }, settings: { manage_users: false, manage_company: false, manage_chart_of_accounts: false } } });
  };

  const handleEditRole = (role) => {
    setEditingRole(role);
    setRoleForm({ role_name: role.role_name, description: role.description || '', permissions: role.permissions || roleForm.permissions });
    setShowRoleDialog(true);
  };

  const tabStyle = (id) => ({
    padding: '10px 20px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
    fontSize: 13.5, borderBottom: activeTab === id ? `2.5px solid ${PRIMARY}` : '2.5px solid transparent',
    color: activeTab === id ? PRIMARY : '#64748B', background: 'none',
  });

  const TABS = [{ id: 'users', label: 'Users', icon: Users }, { id: 'companies', label: 'Company IDs', icon: Building2 }, { id: 'roles', label: 'Roles & Permissions', icon: Shield }];

  const USER_HEADERS = [{ label: 'Name' }, { label: 'Email' }, { label: 'Primary Company' }, { label: 'Status' }, { label: 'Assign Company' }];
  const CO_HEADERS   = [{ label: 'Company Name' }, { label: 'Company ID' }, { label: 'Contact Email' }, { label: 'Type' }, { label: '' }];
  const ROLE_HEADERS = [{ label: 'Role Name' }, { label: 'Description' }, { label: 'Active Modules' }, { label: 'Actions' }];

  const MODULES = [
    { key: 'sales', label: 'Sales & Customers' },
    { key: 'purchases', label: 'Purchases & Vendors' },
    { key: 'inventory', label: 'Inventory' },
    { key: 'accounting', label: 'Accounting' },
    { key: 'banking', label: 'Banking' },
    { key: 'reports', label: 'Reports' },
    { key: 'settings', label: 'Settings' },
  ];

  return (
    <PageShell>
      <PageHeader
        title="User Management"
        subtitle="Manage users, company access, and role-based permissions"
        icon={Users}
        accentColor={PRIMARY}
        actions={activeTab === 'roles' ? <NewBtn onClick={() => { resetRoleForm(); setShowRoleDialog(true); }} label="New Role" /> : null}
      />

      <StatBar stats={[
        { label: 'Total Users',     value: users.length,     icon: Users,    color: PRIMARY },
        { label: 'Companies',       value: companies.length, icon: Building2, color: ACCENT },
        { label: 'Roles Defined',   value: roles.length,     icon: Shield,   color: '#8B5CF6' },
        { label: 'Active Users',    value: users.filter(u => u.is_active !== false).length, color: ACCENT },
      ]} />

      {/* Info Banner */}
      <div style={{ background: '#EBF4FB', border: '1.5px solid #AED6F1', borderRadius: 12, padding: '14px 20px', marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <Info style={{ width: 18, height: 18, color: PRIMARY, flexShrink: 0, marginTop: 1 }} />
        <div>
          <p style={{ fontWeight: 700, color: PRIMARY, fontSize: 13.5 }}>Inviting New Users</p>
          <p style={{ color: '#2E86C1', fontSize: 13, marginTop: 2 }}>Go to Supabase Dashboard → Authentication → Invite User. Then use "Assign Company" below to link users to this company.</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: 'white', borderRadius: 14, border: '1px solid #F1F5F9', boxShadow: '0 2px 8px rgba(15,43,91,0.06)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #F1F5F9', padding: '0 16px', gap: 4 }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={tabStyle(tab.id)}>
              <tab.icon style={{ width: 14, height: 14, display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ padding: 24 }}>

          {activeTab === 'users' && (
            <ERPTable headers={USER_HEADERS} emptyIcon={Users} emptyTitle="No users found" emptyDesc="Invite users via Supabase Dashboard.">
              {users.map(u => {
                const primaryCo = companies.find(c => c.id === u.company_id);
                return (
                  <ERPTableRow key={u.id}>
                    <ERPTableCell bold>{u.full_name || '—'}</ERPTableCell>
                    <ERPTableCell muted>{u.email}</ERPTableCell>
                    <ERPTableCell>
                      {primaryCo ? (
                        <span style={{ padding: '3px 9px', background: '#EBF4FB', color: PRIMARY, borderRadius: 99, fontSize: 11.5, fontWeight: 600 }}>{primaryCo.company_name}</span>
                      ) : (
                        <span style={{ color: '#EF4444', fontSize: 12 }}>Not Assigned</span>
                      )}
                    </ERPTableCell>
                    <ERPTableCell><StatusBadge status={u.is_active !== false ? 'active' : 'inactive'} /></ERPTableCell>
                    <ERPTableCell>
                      <Select onValueChange={(companyId) => updateUserMutation.mutate({ userId: u.id, data: { company_id: companyId, accessible_companies: [companyId] } })}>
                        <SelectTrigger style={{ width: 160, fontSize: 12, borderRadius: 8 }}><SelectValue placeholder="Assign Company" /></SelectTrigger>
                        <SelectContent>
                          {companies.map(co => <SelectItem key={co.id} value={co.id}>{co.company_name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </ERPTableCell>
                  </ERPTableRow>
                );
              })}
            </ERPTable>
          )}

          {activeTab === 'companies' && (
            <>
              <div style={{ background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: 10, padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 12 }}>
                <CheckCircle style={{ width: 18, height: 18, color: ACCENT, flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontSize: 13, color: '#14532D' }}>
                  <strong>How to assign users:</strong> Copy a company ID → Go to Supabase Auth → Edit User → paste in company_id field.
                </div>
              </div>
              <ERPTable headers={CO_HEADERS} emptyIcon={Building2} emptyTitle="No companies found" emptyDesc="">
                {companies.map(co => (
                  <ERPTableRow key={co.id}>
                    <ERPTableCell bold>{co.company_name}</ERPTableCell>
                    <ERPTableCell>
                      <code style={{ background: '#F1F5F9', padding: '3px 8px', borderRadius: 5, fontSize: 11, fontFamily: 'monospace', color: '#475569' }}>{co.id}</code>
                    </ERPTableCell>
                    <ERPTableCell muted>{co.contact_email || '—'}</ERPTableCell>
                    <ERPTableCell>
                      <span style={{ padding: '3px 9px', background: '#F3E8FF', color: '#7C3AED', borderRadius: 99, fontSize: 11.5, fontWeight: 600, textTransform: 'capitalize' }}>
                        {(co.company_type || 'trading').replace(/_/g, ' ')}
                      </span>
                    </ERPTableCell>
                    <ERPTableCell>
                      <button
                        onClick={() => { navigator.clipboard.writeText(co.id); setCopiedId(co.id); setTimeout(() => setCopiedId(null), 2000); }}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: copiedId === co.id ? ACCENT : '#475569', fontFamily: 'inherit' }}
                      >
                        {copiedId === co.id ? <><CheckCircle style={{ width: 12, height: 12 }} />Copied!</> : <><Copy style={{ width: 12, height: 12 }} />Copy ID</>}
                      </button>
                    </ERPTableCell>
                  </ERPTableRow>
                ))}
              </ERPTable>
            </>
          )}

          {activeTab === 'roles' && (
            <ERPTable headers={ROLE_HEADERS} emptyIcon={Shield} emptyTitle="No roles created yet" emptyDesc="Create roles to assign specific permissions to users">
              {roles.map(role => (
                <ERPTableRow key={role.id}>
                  <ERPTableCell bold style={{ color: PRIMARY }}>{role.role_name}</ERPTableCell>
                  <ERPTableCell muted>{role.description || '—'}</ERPTableCell>
                  <ERPTableCell>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {Object.entries(role.permissions || {}).filter(([_, p]) => p.access).map(([mod]) => (
                        <span key={mod} style={{ padding: '2px 8px', background: '#EBF4FB', color: PRIMARY, borderRadius: 99, fontSize: 11, fontWeight: 600, textTransform: 'capitalize' }}>{mod}</span>
                      ))}
                    </div>
                  </ERPTableCell>
                  <ERPTableCell>
                    <ActionBtn onClick={() => handleEditRole(role)} icon={Pencil} variant="ghost" />
                  </ERPTableCell>
                </ERPTableRow>
              ))}
            </ERPTable>
          )}

        </div>
      </div>

      {/* Role Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={(open) => { setShowRoleDialog(open); if (!open) resetRoleForm(); }}>
        <DialogContent style={{ maxWidth: 680, maxHeight: '90vh', overflowY: 'auto' }}>
          <DialogHeader>
            <DialogTitle>{editingRole ? 'Edit Role' : 'Create New Role'}</DialogTitle>
          </DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#64748B', display: 'block', marginBottom: 6 }}>Role Name *</label>
                <input style={inputStyle} value={roleForm.role_name} onChange={e => setRoleForm(p => ({ ...p, role_name: e.target.value }))} placeholder="e.g., Accountant, AR Manager" />
              </div>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#64748B', display: 'block', marginBottom: 6 }}>Description</label>
                <input style={inputStyle} value={roleForm.description} onChange={e => setRoleForm(p => ({ ...p, description: e.target.value }))} placeholder="Brief description" />
              </div>
            </div>

            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Module Permissions</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {MODULES.map(({ key, label }) => (
                  <div key={key} style={{ border: '1.5px solid #E2E8F0', borderRadius: 10, overflow: 'hidden' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#F8FAFC', cursor: 'pointer' }}>
                      <input type="checkbox" checked={roleForm.permissions[key]?.access || false} onChange={() => handleModuleToggle(key)} style={{ width: 15, height: 15, accentColor: PRIMARY }} />
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A' }}>{label}</span>
                    </label>
                    {roleForm.permissions[key]?.access && (
                      <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, borderTop: '1px solid #F1F5F9' }}>
                        {Object.keys(roleForm.permissions[key]).filter(k => k !== 'access').map(perm => (
                          <PermCheckbox key={perm} label={perm} checked={roleForm.permissions[key][perm]} onChange={() => handlePermissionToggle(key, perm)} />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 16, borderTop: '1px solid #F1F5F9' }}>
              <button onClick={() => { setShowRoleDialog(false); resetRoleForm(); }} style={{ padding: '9px 18px', border: '1.5px solid #E2E8F0', borderRadius: 9, background: 'white', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', color: '#475569' }}>Cancel</button>
              <button onClick={() => saveRoleMutation.mutate(roleForm)} disabled={saveRoleMutation.isPending} style={{ padding: '9px 18px', border: 'none', borderRadius: 9, background: PRIMARY, color: 'white', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                {editingRole ? 'Update Role' : 'Create Role'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

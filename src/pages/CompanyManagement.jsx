import React, { useState } from "react";
import { Company, createEntity } from "@/api/entities";
const UserRecord = createEntity('users');
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Building2, CheckCircle, AlertCircle, Users, Pencil, Shield } from "lucide-react";
import { format } from "date-fns";
import { useCompany } from "../components/auth/CompanyContext";
import PageShell, { PageHeader, StatBar, ERPTable, ERPTableRow, ERPTableCell, StatusBadge, ActionBtn, NewBtn } from "../components/shared/PageShell";

const PRIMARY = '#1B4F8A';
const ACCENT  = '#00A86B';

const inputStyle = {
  width: '100%', padding: '9px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8,
  fontSize: 13.5, color: '#0F172A', background: 'white', outline: 'none', fontFamily: 'inherit',
};

const fieldLabel = (text) => (
  <label style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#64748B', display: 'block', marginBottom: 6 }}>{text}</label>
);

const MODULE_LIST = [
  { key: 'sales',          label: 'Sales',            desc: 'Invoices, Customers' },
  { key: 'purchases',      label: 'Purchases',         desc: 'Bills, Vendors, POs' },
  { key: 'inventory',      label: 'Inventory',         desc: 'Products, Stock' },
  { key: 'accounting',     label: 'Accounting',        desc: 'General Ledger, Reports' },
  { key: 'pos',            label: 'Point of Sale',     desc: 'Retail Sales Terminal' },
  { key: 'manufacturing',  label: 'Manufacturing',     desc: 'Work Orders, BOM' },
  { key: 'job_costing',    label: 'Job Costing',       desc: 'Projects, Cost Tracking' },
  { key: 'fixed_assets',   label: 'Fixed Assets',      desc: 'Asset Management' },
  { key: 'payroll',        label: 'Payroll',           desc: 'Employee Payroll' },
  { key: 'non_profit',     label: 'Non-Profit',        desc: 'Donations, Grants' },
  { key: 'multi_currency', label: 'Multi-Currency',    desc: 'Foreign Currency Support' },
];

const defaultModules = { sales: true, purchases: true, inventory: true, accounting: true, manufacturing: false, job_costing: false, fixed_assets: false, payroll: false, non_profit: false, multi_currency: false, pos: false };

export default function CompanyManagement() {
  const { user } = useCompany();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);

  const [formData, setFormData] = useState({
    company_code: '', company_name: '', trading_name: '', registration_number: '', tax_number: '',
    industry: '', company_type: 'trading', contact_email: '', contact_phone: '', website: '',
    fiscal_year_end: '12-31', base_currency: 'USD', is_active: true, onboarding_completed: false,
    address: { street: '', city: '', state: '', postal_code: '', country: '' },
    modules_enabled: { ...defaultModules }
  });

  const isSuperAdmin = user?.is_super_admin === true;

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: () => Company.list({ orderBy: 'created_date', ascending: false }),
    enabled: isSuperAdmin
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => UserRecord.list(),
    enabled: isSuperAdmin
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editingCompany ? Company.update(editingCompany.id, data) : Company.create(data),
    onSuccess: () => { queryClient.invalidateQueries(['companies']); setShowForm(false); resetForm(); }
  });

  if (!isSuperAdmin) {
    return (
      <PageShell>
        <div style={{ background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: 12, padding: '24px', display: 'flex', gap: 14 }}>
          <Shield style={{ width: 24, height: 24, color: '#EF4444', flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#DC2626', marginBottom: 6 }}>Access Denied</p>
            <p style={{ fontSize: 13.5, color: '#7F1D1D' }}>This page is only accessible to system administrators. Contact your administrator if you need access.</p>
          </div>
        </div>
      </PageShell>
    );
  }

  const handleEdit = (company) => {
    setEditingCompany(company);
    setFormData({ ...company, address: company.address || { street: '', city: '', state: '', postal_code: '', country: '' }, modules_enabled: company.modules_enabled || { ...defaultModules } });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!formData.company_name || !formData.contact_email) { alert('Company Name and Contact Email are required.'); return; }
    saveMutation.mutate(formData);
  };

  const resetForm = () => {
    setEditingCompany(null);
    setFormData({ company_code: '', company_name: '', trading_name: '', registration_number: '', tax_number: '', industry: '', company_type: 'trading', contact_email: '', contact_phone: '', website: '', fiscal_year_end: '12-31', base_currency: 'USD', is_active: true, onboarding_completed: false, address: { street: '', city: '', state: '', postal_code: '', country: '' }, modules_enabled: { ...defaultModules } });
  };

  const toggleModule = (key) => setFormData(p => ({ ...p, modules_enabled: { ...p.modules_enabled, [key]: !p.modules_enabled[key] } }));
  const set = (field) => (e) => setFormData(p => ({ ...p, [field]: e.target.value }));
  const setAddr = (field) => (e) => setFormData(p => ({ ...p, address: { ...p.address, [field]: e.target.value } }));

  const activeCount = companies.filter(c => c.is_active && c.subscription_status === 'active').length;

  const LICENSE_COLORS = { trial: { bg: '#FEF3C7', color: '#92400E' }, basic: { bg: '#EBF4FB', color: PRIMARY }, professional: { bg: '#F3E8FF', color: '#7C3AED' }, enterprise: { bg: '#E6F9F2', color: '#00875A' }, custom: { bg: '#EEF2FF', color: '#4338CA' } };
  const TABLE_HEADERS = [{ label: 'Company Name' }, { label: 'Industry' }, { label: 'License' }, { label: 'Status' }, { label: 'Expiry' }, { label: 'Users' }, { label: 'Modules' }, { label: '' }];

  return (
    <PageShell>
      <PageHeader
        title="Company Management"
        subtitle="System administrator panel — manage all companies and modules"
        icon={Building2}
        accentColor={PRIMARY}
        actions={<NewBtn onClick={() => { resetForm(); setShowForm(true); }} label="New Company" />}
      />

      {/* Admin notice */}
      <div style={{ background: '#EBF4FB', border: '1.5px solid #AED6F1', borderRadius: 12, padding: '14px 20px', marginBottom: 20, display: 'flex', gap: 12 }}>
        <AlertCircle style={{ width: 18, height: 18, color: PRIMARY, flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 13.5, color: '#1B4F8A' }}><strong>Admin Panel:</strong> You are viewing this as a Super Administrator. Regular users cannot access this page.</p>
      </div>

      <StatBar stats={[
        { label: 'Total Companies', value: companies.length, icon: Building2, color: PRIMARY },
        { label: 'Active Companies', value: activeCount, icon: CheckCircle, color: ACCENT },
        { label: 'Total Users', value: users.length, icon: Users, color: '#8B5CF6' },
      ]} />

      <ERPTable headers={TABLE_HEADERS} isLoading={isLoading} emptyIcon={Building2} emptyTitle="No companies yet" emptyDesc="Create your first company to get started.">
        {companies.map(company => {
          const lic    = LICENSE_COLORS[company.license_type] || { bg: '#F1F5F9', color: '#64748B' };
          const mods   = company.modules_enabled ? Object.entries(company.modules_enabled).filter(([_, v]) => v).map(([k]) => k) : [];
          const usersC = users.filter(u => u.company_id === company.id || u.accessible_companies?.includes(company.id)).length;
          return (
            <ERPTableRow key={company.id}>
              <ERPTableCell>
                <div>
                  <p style={{ fontWeight: 700, color: '#0F172A', fontSize: 13.5 }}>{company.company_name}</p>
                  {company.trading_name && company.trading_name !== company.company_name && (
                    <p style={{ fontSize: 11.5, color: '#94A3B8' }}>Trading as: {company.trading_name}</p>
                  )}
                </div>
              </ERPTableCell>
              <ERPTableCell muted>{company.industry || '—'}</ERPTableCell>
              <ERPTableCell>
                <span style={{ padding: '3px 9px', background: lic.bg, color: lic.color, borderRadius: 99, fontSize: 11.5, fontWeight: 600, textTransform: 'capitalize' }}>{company.license_type}</span>
              </ERPTableCell>
              <ERPTableCell><StatusBadge status={company.subscription_status || 'trial'} /></ERPTableCell>
              <ERPTableCell muted style={{ fontSize: 12.5 }}>{company.license_expiry_date ? format(new Date(company.license_expiry_date), 'MMM d, yyyy') : '—'}</ERPTableCell>
              <ERPTableCell muted>{usersC} / {company.user_limit || '∞'}</ERPTableCell>
              <ERPTableCell>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {mods.slice(0, 3).map(m => <span key={m} style={{ padding: '2px 7px', background: '#EBF4FB', color: PRIMARY, borderRadius: 99, fontSize: 10.5, fontWeight: 600 }}>{m}</span>)}
                  {mods.length > 3 && <span style={{ padding: '2px 7px', background: '#F1F5F9', color: '#64748B', borderRadius: 99, fontSize: 10.5 }}>+{mods.length - 3}</span>}
                </div>
              </ERPTableCell>
              <ERPTableCell>
                <ActionBtn onClick={() => handleEdit(company)} icon={Pencil} variant="ghost" />
              </ERPTableCell>
            </ERPTableRow>
          );
        })}
      </ERPTable>

      {/* Company Form Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) resetForm(); }}>
        <DialogContent style={{ maxWidth: 720, maxHeight: '90vh', overflowY: 'auto' }}>
          <DialogHeader>
            <DialogTitle>{editingCompany ? 'Edit Company' : 'Create New Company'}</DialogTitle>
          </DialogHeader>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 8 }}>
            {/* Company Info */}
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748B', marginBottom: 12 }}>Company Information</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {[['Company Code', 'company_code', 'e.g., ABC001'], ['Company Name *', 'company_name', 'ABC Ltd'], ['Trading Name', 'trading_name', ''], ['Industry', 'industry', 'Manufacturing, Retail…'], ['Registration #', 'registration_number', ''], ['Tax / VAT #', 'tax_number', ''], ['Base Currency', 'base_currency', 'USD, EUR, NGN…']].map(([label, field, placeholder]) => (
                  <div key={field}>
                    {fieldLabel(label)}
                    <input style={inputStyle} value={formData[field]} onChange={set(field)} placeholder={placeholder} />
                  </div>
                ))}
                <div>
                  {fieldLabel('Company Type')}
                  <Select value={formData.company_type} onValueChange={v => setFormData(p => ({ ...p, company_type: v }))}>
                    <SelectTrigger style={{ borderRadius: 8, fontSize: 13.5 }}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['manufacturing','trading','service','non_profit','construction','retail','other'].map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, x => x.toUpperCase())}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748B', marginBottom: 12 }}>Contact Information</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {[['Contact Email *', 'contact_email', 'contact@company.com'], ['Phone', 'contact_phone', '+1 234 567 8900']].map(([label, field, placeholder]) => (
                  <div key={field}>
                    {fieldLabel(label)}
                    <input style={inputStyle} value={formData[field]} onChange={set(field)} placeholder={placeholder} />
                  </div>
                ))}
                <div style={{ gridColumn: '1 / -1' }}>
                  {fieldLabel('Website')}
                  <input style={inputStyle} value={formData.website} onChange={set('website')} placeholder="https://www.company.com" />
                </div>
                {[['Street', 'street', '123 Main St'], ['City', 'city', ''], ['State', 'state', ''], ['Postal Code', 'postal_code', ''], ['Country', 'country', '']].map(([label, field, placeholder]) => (
                  <div key={field}>
                    {fieldLabel(label)}
                    <input style={inputStyle} value={formData.address[field]} onChange={setAddr(field)} placeholder={placeholder} />
                  </div>
                ))}
              </div>
            </div>

            {/* Modules */}
            <div>
              <div style={{ padding: '14px 16px', background: '#EBF4FB', borderRadius: '10px 10px 0 0', border: '1.5px solid #AED6F1', borderBottom: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircle style={{ width: 16, height: 16, color: PRIMARY }} />
                <p style={{ fontSize: 13.5, fontWeight: 700, color: PRIMARY }}>Module Preferences</p>
                <p style={{ fontSize: 12, color: '#64748B', marginLeft: 4 }}>Enable or disable modules for this company</p>
              </div>
              <div style={{ border: '1.5px solid #AED6F1', borderRadius: '0 0 10px 10px', padding: 16, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                {MODULE_LIST.map(({ key, label, desc }) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'white', borderRadius: 8, border: '1px solid #F1F5F9', cursor: 'pointer' }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{label}</p>
                      <p style={{ fontSize: 11.5, color: '#94A3B8' }}>{desc}</p>
                    </div>
                    <div
                      onClick={() => toggleModule(key)}
                      style={{ width: 40, height: 22, borderRadius: 11, background: formData.modules_enabled[key] ? ACCENT : '#CBD5E1', position: 'relative', cursor: 'pointer', transition: 'background 150ms', flexShrink: 0 }}
                    >
                      <div style={{ position: 'absolute', top: 3, left: formData.modules_enabled[key] ? 20 : 3, width: 16, height: 16, borderRadius: '50%', background: 'white', transition: 'left 150ms', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 16, borderTop: '1px solid #F1F5F9' }}>
              <button onClick={() => { setShowForm(false); resetForm(); }} style={{ padding: '9px 18px', border: '1.5px solid #E2E8F0', borderRadius: 9, background: 'white', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', color: '#475569' }}>Cancel</button>
              <button onClick={handleSave} disabled={saveMutation.isPending} style={{ padding: '9px 18px', border: 'none', borderRadius: 9, background: PRIMARY, color: 'white', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                {editingCompany ? 'Update Company' : 'Create Company'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

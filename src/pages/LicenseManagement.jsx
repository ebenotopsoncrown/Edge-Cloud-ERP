import React, { useState } from "react";
import { createEntity } from "@/api/entities";
const License = createEntity('licenses');
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Key, Copy, Shield } from "lucide-react";
import { format } from "date-fns";
import PageShell, { PageHeader, StatBar, ERPTable, ERPTableRow, ERPTableCell, StatusBadge, NewBtn } from "../components/shared/PageShell";

const INPUT_STYLE = { width: '100%', padding: '8px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13.5, fontFamily: 'inherit', outline: 'none', background: 'white', color: '#0F172A', boxSizing: 'border-box' };
const LABEL_STYLE = { fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5, display: 'block' };
const SECTION_STYLE = { fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #F1F5F9' };

const MODULES = ['sales','purchases','inventory','accounting','manufacturing','job_costing','fixed_assets','payroll','non_profit','multi_currency','pos'];

const LICENSE_COLORS = {
  trial:        { bg: '#FEF9C3', color: '#854D0E' },
  basic:        { bg: '#EBF4FB', color: '#1B4F8A' },
  professional: { bg: '#F3E8FF', color: '#7C3AED' },
  enterprise:   { bg: '#DCFCE7', color: '#14532D' },
  custom:       { bg: '#E0E7FF', color: '#3730A3' },
};

const BLANK_FORM = () => ({
  company_name: '', license_key: '', activation_code: '', license_type: 'trial',
  modules_enabled: { sales:true, purchases:true, inventory:true, accounting:true, manufacturing:false, job_costing:false, fixed_assets:false, payroll:false, non_profit:false, multi_currency:false, pos:false },
  user_limit: 1,
  issue_date:   format(new Date(), 'yyyy-MM-dd'),
  expiry_date:  format(new Date(Date.now() + 30*24*60*60*1000), 'yyyy-MM-dd'),
  is_active: true, contact_person: '', contact_email: '', contact_phone: '', custom_features: [], notes: ''
});

export default function LicenseManagement() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(BLANK_FORM());
  const queryClient = useQueryClient();

  const { data: licenses = [] } = useQuery({
    queryKey: ['licenses'],
    queryFn: () => License.list({ orderBy: 'issue_date', ascending: false })
  });

  const saveMutation = useMutation({
    mutationFn: (data) => License.create(data),
    onSuccess: () => { queryClient.invalidateQueries(['licenses']); setShowForm(false); setFormData(BLANK_FORM()); }
  });

  const generateLicenseKey = () =>
    Array.from({ length: 4 }, () => Math.random().toString(36).substring(2, 7).toUpperCase()).join('-');

  const generateActivationCode = () =>
    Math.random().toString(36).substring(2, 15).toUpperCase();

  const handleGenerateKeys = () =>
    setFormData(prev => ({ ...prev, license_key: generateLicenseKey(), activation_code: generateActivationCode() }));

  const handleModuleToggle = (mod) =>
    setFormData(prev => ({ ...prev, modules_enabled: { ...prev.modules_enabled, [mod]: !prev.modules_enabled[mod] } }));

  const handleSave = () => {
    if (!formData.company_name || !formData.license_key) { alert('Please fill in required fields'); return; }
    saveMutation.mutate(formData);
  };

  const copyToClipboard = (text) => { navigator.clipboard.writeText(text); };

  const set = (field, val) => setFormData(prev => ({ ...prev, [field]: val }));

  const activeLicenses = licenses.filter(l => l.is_active);
  const trialLicenses  = licenses.filter(l => l.license_type === 'trial');

  const TABLE_HEADERS = [
    { label: 'Company' }, { label: 'License Key' }, { label: 'Type' }, { label: 'Users', right: true },
    { label: 'Issued' }, { label: 'Expires' }, { label: 'Status' }, { label: '' }
  ];

  return (
    <PageShell>
      <PageHeader
        title="License Management"
        subtitle="Generate and manage client licenses"
        icon={Key}
        accentColor="#1B4F8A"
        actions={<NewBtn label="New License" onClick={() => setShowForm(true)} />}
      />

      <StatBar stats={[
        { label: 'Total Licenses', value: licenses.length,       icon: Key,    color: '#1B4F8A' },
        { label: 'Active',         value: activeLicenses.length, icon: Shield, color: '#00A86B' },
        { label: 'Trial',          value: trialLicenses.length,  color: '#F59E0B' },
        { label: 'Inactive',       value: licenses.length - activeLicenses.length, color: '#64748B' },
      ]} />

      <ERPTable headers={TABLE_HEADERS} emptyIcon={Key} emptyTitle="No licenses yet" emptyDesc="Generate your first license to get started.">
        {licenses.map(license => {
          const lc = LICENSE_COLORS[license.license_type] || LICENSE_COLORS.basic;
          return (
            <ERPTableRow key={license.id}>
              <ERPTableCell bold>{license.company_name}</ERPTableCell>
              <ERPTableCell>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#475569' }}>{license.license_key}</span>
                  <button
                    onClick={() => copyToClipboard(license.license_key)}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94A3B8', padding: 2, display: 'flex', alignItems: 'center' }}
                    title="Copy"
                  >
                    <Copy style={{ width: 12, height: 12 }} />
                  </button>
                </div>
              </ERPTableCell>
              <ERPTableCell>
                <span style={{ padding: '3px 9px', background: lc.bg, color: lc.color, borderRadius: 99, fontSize: 11.5, fontWeight: 700, textTransform: 'capitalize' }}>
                  {license.license_type}
                </span>
              </ERPTableCell>
              <ERPTableCell right muted>{license.user_limit}</ERPTableCell>
              <ERPTableCell muted>{format(new Date(license.issue_date), 'MMM d, yyyy')}</ERPTableCell>
              <ERPTableCell muted>{format(new Date(license.expiry_date), 'MMM d, yyyy')}</ERPTableCell>
              <ERPTableCell><StatusBadge status={license.is_active ? 'active' : 'inactive'} /></ERPTableCell>
              <ERPTableCell>
                <button
                  onClick={() => copyToClipboard(license.activation_code)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', border: '1.5px solid #E2E8F0', borderRadius: 7, background: 'white', color: '#475569', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}
                  title="Copy activation code"
                >
                  <Copy style={{ width: 11, height: 11 }} />
                  Copy Code
                </button>
              </ERPTableCell>
            </ERPTableRow>
          );
        })}
      </ERPTable>

      {/* New License Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent style={{ maxWidth: 760, maxHeight: '90vh', overflowY: 'auto' }}>
          <DialogHeader>
            <DialogTitle style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Key style={{ width: 18, height: 18, color: '#1B4F8A' }} />
              Generate New License
            </DialogTitle>
          </DialogHeader>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingTop: 8 }}>
            {/* Company Info */}
            <div>
              <p style={SECTION_STYLE}>Company Information</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={LABEL_STYLE}>Company Name *</label>
                  <input style={INPUT_STYLE} value={formData.company_name} onChange={e => set('company_name', e.target.value)} placeholder="ABC Corporation" />
                </div>
                <div>
                  <label style={LABEL_STYLE}>Contact Person</label>
                  <input style={INPUT_STYLE} value={formData.contact_person} onChange={e => set('contact_person', e.target.value)} placeholder="John Doe" />
                </div>
                <div>
                  <label style={LABEL_STYLE}>Contact Email</label>
                  <input type="email" style={INPUT_STYLE} value={formData.contact_email} onChange={e => set('contact_email', e.target.value)} placeholder="john@example.com" />
                </div>
                <div>
                  <label style={LABEL_STYLE}>Contact Phone</label>
                  <input style={INPUT_STYLE} value={formData.contact_phone} onChange={e => set('contact_phone', e.target.value)} placeholder="+1 234 567 8900" />
                </div>
              </div>
            </div>

            {/* License Keys */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #F1F5F9' }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: 0 }}>License Keys</p>
                <button
                  onClick={handleGenerateKeys}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', border: '1.5px solid #E2E8F0', borderRadius: 7, background: 'white', color: '#1B4F8A', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  <Key style={{ width: 13, height: 13 }} />
                  Generate Keys
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={LABEL_STYLE}>License Key *</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input style={{ ...INPUT_STYLE, fontFamily: 'monospace' }} value={formData.license_key} onChange={e => set('license_key', e.target.value)} placeholder="XXXXX-XXXXX-XXXXX-XXXXX" />
                    <button onClick={() => copyToClipboard(formData.license_key)} style={{ padding: '8px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, background: 'white', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                      <Copy style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                </div>
                <div>
                  <label style={LABEL_STYLE}>Activation Code *</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input style={{ ...INPUT_STYLE, fontFamily: 'monospace' }} value={formData.activation_code} onChange={e => set('activation_code', e.target.value)} placeholder="XXXXXXXXXXXXXX" />
                    <button onClick={() => copyToClipboard(formData.activation_code)} style={{ padding: '8px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, background: 'white', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                      <Copy style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* License Details */}
            <div>
              <p style={SECTION_STYLE}>License Details</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={LABEL_STYLE}>License Type</label>
                  <Select value={formData.license_type} onValueChange={v => set('license_type', v)}>
                    <SelectTrigger style={{ height: 38, fontSize: 13.5 }}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trial">Trial (30 days)</SelectItem>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label style={LABEL_STYLE}>User Limit</label>
                  <input type="number" style={INPUT_STYLE} value={formData.user_limit} onChange={e => set('user_limit', parseInt(e.target.value))} />
                </div>
                <div>
                  <label style={LABEL_STYLE}>Issue Date</label>
                  <input type="date" style={INPUT_STYLE} value={formData.issue_date} onChange={e => set('issue_date', e.target.value)} />
                </div>
                <div>
                  <label style={LABEL_STYLE}>Expiry Date</label>
                  <input type="date" style={INPUT_STYLE} value={formData.expiry_date} onChange={e => set('expiry_date', e.target.value)} />
                </div>
              </div>
            </div>

            {/* Modules */}
            <div>
              <p style={SECTION_STYLE}>Enabled Modules</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {MODULES.map(mod => (
                  <div key={mod} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#475569', textTransform: 'capitalize' }}>
                      {mod.replace(/_/g, ' ')}
                    </span>
                    <div
                      onClick={() => handleModuleToggle(mod)}
                      style={{ width: 36, height: 20, borderRadius: 10, background: formData.modules_enabled[mod] ? '#00A86B' : '#CBD5E1', position: 'relative', cursor: 'pointer', transition: 'background 150ms', flexShrink: 0 }}
                    >
                      <div style={{ position: 'absolute', top: 2, left: formData.modules_enabled[mod] ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: 'white', transition: 'left 150ms' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label style={LABEL_STYLE}>Notes & Custom Features</label>
              <textarea
                value={formData.notes}
                onChange={e => set('notes', e.target.value)}
                placeholder="Custom features, special requirements, etc."
                rows={3}
                style={{ ...INPUT_STYLE, resize: 'vertical' }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 16, borderTop: '1px solid #F1F5F9' }}>
              <button onClick={() => setShowForm(false)} style={{ padding: '9px 18px', border: '1.5px solid #E2E8F0', borderRadius: 8, background: 'white', color: '#475569', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saveMutation.isPending} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 20px', border: 'none', borderRadius: 8, background: '#1B4F8A', color: 'white', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                <Key style={{ width: 14, height: 14 }} />
                {saveMutation.isPending ? 'Generating…' : 'Generate License'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

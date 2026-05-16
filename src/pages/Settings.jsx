import React, { useState, useEffect } from "react";
import { Company, createEntity } from "@/api/entities";
const UserRecord = createEntity('users');
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Building2, DollarSign, User, CheckCircle, Globe, Clock } from "lucide-react";
import { useCompany } from "../components/auth/CompanyContext";
import PageShell, { PageHeader, NewBtn, ActionBtn } from "../components/shared/PageShell";

const PRIMARY = '#1B4F8A';
const ACCENT  = '#00A86B';

function SettingsSection({ title, icon: Icon, accentColor = PRIMARY, children, onSave, saving, saveLabel = "Save Changes" }) {
  return (
    <div style={{ background: 'white', borderRadius: 14, border: '1px solid #F1F5F9', boxShadow: '0 2px 8px rgba(15,43,91,0.06)', overflow: 'hidden', marginBottom: 24 }}>
      <div style={{ padding: '18px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 12, background: `${accentColor}06` }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${accentColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon style={{ width: 18, height: 18, color: accentColor }} />
        </div>
        <h2 style={{ fontSize: 15.5, fontWeight: 700, color: '#0F172A' }}>{title}</h2>
      </div>
      <div style={{ padding: '24px' }}>
        {children}
        {onSave && (
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={onSave}
              disabled={saving}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '9px 20px', background: saving ? '#94A3B8' : accentColor,
                color: 'white', border: 'none', borderRadius: 9,
                fontSize: 13.5, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <Save style={{ width: 14, height: 14 }} />
              {saving ? 'Saving…' : saveLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function FormField({ label, children, hint }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#64748B' }}>{label}</label>
      {children}
      {hint && <p style={{ fontSize: 11.5, color: '#94A3B8' }}>{hint}</p>}
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '9px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8,
  fontSize: 13.5, color: '#0F172A', background: 'white', outline: 'none',
  fontFamily: 'inherit', transition: 'border-color 150ms',
};

export default function Settings() {
  const { currentCompany, user, switchCompany } = useCompany();
  const queryClient = useQueryClient();

  const [company, setCompany] = useState({
    company_name: '', base_currency: 'USD', fiscal_year_end: '12-31', time_zone: 'UTC',
    address: { street: '', city: '', state: '', postal_code: '', country: '' },
  });

  const [profile, setProfile] = useState({
    full_name: '', email: '', phone: '', job_title: '', department: '',
  });

  useEffect(() => {
    if (currentCompany) setCompany({ company_name: currentCompany.company_name || '', base_currency: currentCompany.base_currency || 'USD', fiscal_year_end: currentCompany.fiscal_year_end || '12-31', time_zone: currentCompany.time_zone || 'UTC', address: currentCompany.address || { street: '', city: '', state: '', postal_code: '', country: '' } });
  }, [currentCompany]);

  useEffect(() => {
    if (user) setProfile({ full_name: user.full_name || '', email: user.email || '', phone: user.phone || '', job_title: user.job_title || '', department: user.department || '' });
  }, [user]);

  const updateCompanyMutation = useMutation({
    mutationFn: data => Company.update(currentCompany.id, data),
    onSuccess: () => { queryClient.invalidateQueries(['companies']); window.location.reload(); },
  });

  const updateUserMutation = useMutation({
    mutationFn: data => user?.id ? UserRecord.update(user.id, data) : null,
    onSuccess: () => { queryClient.invalidateQueries(['current-user']); alert('Profile updated successfully!'); },
  });

  if (!currentCompany || !user) {
    return <PageShell><div style={{ textAlign: 'center', padding: 40, color: '#94A3B8' }}>Loading settings…</div></PageShell>;
  }

  return (
    <PageShell>
      <PageHeader
        title="Settings"
        subtitle="Manage company configuration and user preferences"
        icon={Building2}
      />

      {/* Currency notice */}
      <div style={{ background: '#EBF4FB', border: '1.5px solid #AED6F1', borderRadius: 12, padding: '14px 20px', marginBottom: 24, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <DollarSign style={{ width: 18, height: 18, color: PRIMARY, flexShrink: 0, marginTop: 1 }} />
        <div>
          <p style={{ fontWeight: 700, color: PRIMARY, fontSize: 13.5 }}>Base Currency: <strong>{company.base_currency}</strong></p>
          <p style={{ color: '#2E86C1', fontSize: 13, marginTop: 3 }}>All financial reports and dashboards display amounts in {company.base_currency}. Foreign currency transactions are auto-converted.</p>
        </div>
      </div>

      {/* Company Settings */}
      <SettingsSection title="Company Settings" icon={Building2} accentColor={PRIMARY} onSave={() => updateCompanyMutation.mutate(company)} saving={updateCompanyMutation.isPending} saveLabel="Save Company Settings">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          <FormField label="Company Name">
            <input style={inputStyle} value={company.company_name} onChange={e => setCompany({ ...company, company_name: e.target.value })} onFocus={e => e.target.style.borderColor = PRIMARY} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
          </FormField>

          <FormField label="Base Currency (Reporting Currency)" hint="⚠️ This affects all financial reports. Foreign transactions are auto-converted.">
            <Select value={company.base_currency} onValueChange={v => setCompany({ ...company, base_currency: v })}>
              <SelectTrigger style={{ border: '1.5px solid #00A86B30', borderRadius: 8, fontSize: 13.5 }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[['USD','USD - US Dollar ($)'],['EUR','EUR - Euro (€)'],['GBP','GBP - British Pound (£)'],['NGN','NGN - Nigerian Naira (₦)'],['ZAR','ZAR - South African Rand (R)'],['KES','KES - Kenyan Shilling (KSh)'],['GHS','GHS - Ghanaian Cedi (₵)'],['CAD','CAD - Canadian Dollar (C$)'],['AUD','AUD - Australian Dollar (A$)'],['INR','INR - Indian Rupee (₹)'],['JPY','JPY - Japanese Yen (¥)'],['CNY','CNY - Chinese Yuan (¥)']].map(([v,l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Fiscal Year End (MM-DD)">
            <input style={inputStyle} value={company.fiscal_year_end} onChange={e => setCompany({ ...company, fiscal_year_end: e.target.value })} placeholder="12-31" onFocus={e => e.target.style.borderColor = PRIMARY} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
          </FormField>

          <FormField label="Time Zone">
            <Select value={company.time_zone} onValueChange={v => setCompany({ ...company, time_zone: v })}>
              <SelectTrigger style={{ borderRadius: 8, fontSize: 13.5 }}><SelectValue /></SelectTrigger>
              <SelectContent>
                {[['UTC','UTC (GMT+0)'],['Africa/Lagos','West Africa Time (WAT)'],['Africa/Nairobi','East Africa Time (EAT)'],['Africa/Johannesburg','South Africa Time (SAST)'],['America/New_York','Eastern Time (ET)'],['America/Chicago','Central Time (CT)'],['America/Los_Angeles','Pacific Time (PT)'],['Europe/London','London (GMT/BST)'],['Asia/Dubai','Dubai (GST)']].map(([v,l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>
        </div>

        <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#64748B', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Company Address</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <FormField label="Street Address" style={{ gridColumn: '1 / -1' }}>
              <input style={inputStyle} value={company.address.street} onChange={e => setCompany({ ...company, address: { ...company.address, street: e.target.value } })} onFocus={e => e.target.style.borderColor = PRIMARY} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
            </FormField>
            <FormField label="City"><input style={inputStyle} value={company.address.city} onChange={e => setCompany({ ...company, address: { ...company.address, city: e.target.value } })} onFocus={e => e.target.style.borderColor = PRIMARY} onBlur={e => e.target.style.borderColor = '#E2E8F0'} /></FormField>
            <FormField label="State / Province"><input style={inputStyle} value={company.address.state} onChange={e => setCompany({ ...company, address: { ...company.address, state: e.target.value } })} onFocus={e => e.target.style.borderColor = PRIMARY} onBlur={e => e.target.style.borderColor = '#E2E8F0'} /></FormField>
            <FormField label="Postal Code"><input style={inputStyle} value={company.address.postal_code} onChange={e => setCompany({ ...company, address: { ...company.address, postal_code: e.target.value } })} onFocus={e => e.target.style.borderColor = PRIMARY} onBlur={e => e.target.style.borderColor = '#E2E8F0'} /></FormField>
            <FormField label="Country"><input style={inputStyle} value={company.address.country} onChange={e => setCompany({ ...company, address: { ...company.address, country: e.target.value } })} onFocus={e => e.target.style.borderColor = PRIMARY} onBlur={e => e.target.style.borderColor = '#E2E8F0'} /></FormField>
          </div>
        </div>
      </SettingsSection>

      {/* User Profile */}
      <SettingsSection title="My Profile" icon={User} accentColor={ACCENT} onSave={() => updateUserMutation.mutate(profile)} saving={updateUserMutation.isPending} saveLabel="Save Profile">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <FormField label="Full Name"><input style={inputStyle} value={profile.full_name} onChange={e => setProfile({ ...profile, full_name: e.target.value })} onFocus={e => e.target.style.borderColor = ACCENT} onBlur={e => e.target.style.borderColor = '#E2E8F0'} /></FormField>
          <FormField label="Email" hint="Email cannot be changed."><input style={{ ...inputStyle, background: '#F8FAFC', color: '#94A3B8', cursor: 'not-allowed' }} value={profile.email} disabled /></FormField>
          <FormField label="Phone"><input style={inputStyle} value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} onFocus={e => e.target.style.borderColor = ACCENT} onBlur={e => e.target.style.borderColor = '#E2E8F0'} /></FormField>
          <FormField label="Job Title"><input style={inputStyle} value={profile.job_title} onChange={e => setProfile({ ...profile, job_title: e.target.value })} onFocus={e => e.target.style.borderColor = ACCENT} onBlur={e => e.target.style.borderColor = '#E2E8F0'} /></FormField>
          <FormField label="Department"><input style={inputStyle} value={profile.department} onChange={e => setProfile({ ...profile, department: e.target.value })} onFocus={e => e.target.style.borderColor = ACCENT} onBlur={e => e.target.style.borderColor = '#E2E8F0'} /></FormField>
        </div>
      </SettingsSection>

      {/* Currency Guide */}
      <div style={{ background: 'white', borderRadius: 14, border: '1px solid #F1F5F9', boxShadow: '0 2px 8px rgba(15,43,91,0.06)', overflow: 'hidden' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 12, background: '#EBF4FB' }}>
          <CheckCircle style={{ width: 18, height: 18, color: PRIMARY }} />
          <h2 style={{ fontSize: 15, fontWeight: 700, color: PRIMARY }}>Base Currency Guide</h2>
        </div>
        <div style={{ padding: 24 }}>
          {[
            ['Set Your Base Currency', `Choose the currency for all financial reports (e.g., NGN for Nigerian companies). Currently: ${company.base_currency}`],
            ['Dashboards Show Base Currency', 'All dashboards — Sales, Purchases, Accounting — display amounts in your base currency.'],
            ['Foreign Currency Transactions', 'Record invoices/bills in any currency. The system converts to your base currency using exchange rates you set.'],
            ['Chart of Accounts', 'Account balances are maintained in your base currency. Enable Multi-Currency in Settings to track foreign currency accounts separately.'],
          ].map(([title, desc], i) => (
            <div key={i} style={{ display: 'flex', gap: 14, marginBottom: i < 3 ? 16 : 0 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: PRIMARY, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
              <div>
                <p style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A', marginBottom: 3 }}>{title}</p>
                <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}

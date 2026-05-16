import React, { useState } from "react";
import { Store, InventoryLocation } from "@/api/entities";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Store as StoreIcon, Pencil, Trash2, X, Save, MapPin } from "lucide-react";
import { useCompany } from "../components/auth/CompanyContext";
import PageShell, { PageHeader, StatBar, ERPTable, ERPTableRow, ERPTableCell, StatusBadge, NewBtn, ActionBtn } from "../components/shared/PageShell";

const INPUT_STYLE = { width: '100%', padding: '8px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13.5, fontFamily: 'inherit', outline: 'none', background: 'white', color: '#0F172A', boxSizing: 'border-box' };
const LABEL_STYLE = { fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5, display: 'block' };

const BLANK_FORM = (companyId) => ({
  store_code: '', store_name: '', company_id: companyId, store_type: 'retail',
  address: { street: '', city: '', state: '', postal_code: '', country: '' },
  phone: '', email: '', manager_id: '',
  tax_settings: { default_tax_rate: 0, tax_inclusive: false, tax_number: '' },
  default_inventory_location_id: '', is_active: true
});

const TYPE_COLORS = { retail: '#1B4F8A', warehouse: '#F59E0B', outlet: '#8B5CF6', franchise: '#00A86B', online: '#EF4444' };

export default function StoreManagement() {
  const { currentCompany } = useCompany();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [formData, setFormData] = useState(BLANK_FORM(currentCompany?.id));

  const { data: stores = [] } = useQuery({
    queryKey: ['stores', currentCompany?.id],
    queryFn: () => currentCompany ? Store.list({ filters: { company_id: currentCompany.id } }) : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['inventory-locations', currentCompany?.id],
    queryFn: () => currentCompany ? InventoryLocation.list({ filters: { company_id: currentCompany.id } }) : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editingStore ? Store.update(editingStore.id, data) : Store.create(data),
    onSuccess: () => { queryClient.invalidateQueries(['stores']); handleClose(); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => Store.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['stores'])
  });

  const handleEdit = (store) => { setEditingStore(store); setFormData(store); setShowForm(true); };
  const handleClose = () => { setShowForm(false); setEditingStore(null); setFormData(BLANK_FORM(currentCompany?.id)); };
  const handleSubmit = (e) => { e.preventDefault(); saveMutation.mutate(formData); };
  const set = (field, val) => setFormData(prev => ({ ...prev, [field]: val }));
  const setAddr = (field, val) => setFormData(prev => ({ ...prev, address: { ...prev.address, [field]: val } }));
  const setTax = (field, val) => setFormData(prev => ({ ...prev, tax_settings: { ...prev.tax_settings, [field]: val } }));

  const activeStores = stores.filter(s => s.is_active);
  const storeTypes = [...new Set(stores.map(s => s.store_type).filter(Boolean))];

  const TABLE_HEADERS = [
    { label: 'Code' }, { label: 'Store Name' }, { label: 'Type' }, { label: 'City' }, { label: 'Phone' }, { label: 'Status' }, { label: '' }
  ];

  return (
    <PageShell>
      <PageHeader
        title="Store Management"
        subtitle={`${stores.length} stores · ${storeTypes.length} types`}
        icon={StoreIcon}
        accentColor="#1B4F8A"
        actions={<NewBtn label="New Store" onClick={() => setShowForm(true)} />}
      />

      <StatBar stats={[
        { label: 'Total Stores',  value: stores.length,        icon: StoreIcon, color: '#1B4F8A' },
        { label: 'Active',        value: activeStores.length,  color: '#00A86B' },
        { label: 'Inactive',      value: stores.length - activeStores.length, color: '#64748B' },
        { label: 'Locations',     value: locations.length,     icon: MapPin, color: '#8B5CF6' },
      ]} />

      {showForm && (
        <div style={{ background: 'white', borderRadius: 14, border: '1.5px solid #E2E8F0', boxShadow: '0 4px 20px rgba(15,43,91,0.10)', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #F1F5F9', background: '#F8FAFC', borderRadius: '14px 14px 0 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EBF4FB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <StoreIcon style={{ width: 16, height: 16, color: '#1B4F8A' }} />
              </div>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>{editingStore ? 'Edit Store' : 'New Store'}</span>
            </div>
            <button onClick={handleClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94A3B8', padding: 4 }}>
              <X style={{ width: 18, height: 18 }} />
            </button>
          </div>
          <form onSubmit={handleSubmit} style={{ padding: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={LABEL_STYLE}>Store Code *</label>
                <input style={INPUT_STYLE} value={formData.store_code} onChange={e => set('store_code', e.target.value)} required />
              </div>
              <div>
                <label style={LABEL_STYLE}>Store Name *</label>
                <input style={INPUT_STYLE} value={formData.store_name} onChange={e => set('store_name', e.target.value)} required />
              </div>
              <div>
                <label style={LABEL_STYLE}>Store Type</label>
                <Select value={formData.store_type} onValueChange={v => set('store_type', v)}>
                  <SelectTrigger style={{ height: 38, fontSize: 13.5 }}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="warehouse">Warehouse</SelectItem>
                    <SelectItem value="outlet">Outlet</SelectItem>
                    <SelectItem value="franchise">Franchise</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label style={LABEL_STYLE}>Default Inventory Location</label>
                <Select value={formData.default_inventory_location_id} onValueChange={v => set('default_inventory_location_id', v)}>
                  <SelectTrigger style={{ height: 38, fontSize: 13.5 }}><SelectValue placeholder="Select location" /></SelectTrigger>
                  <SelectContent>
                    {locations.map(loc => <SelectItem key={loc.id} value={loc.id}>{loc.location_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label style={LABEL_STYLE}>Phone</label>
                <input style={INPUT_STYLE} value={formData.phone} onChange={e => set('phone', e.target.value)} />
              </div>
              <div>
                <label style={LABEL_STYLE}>Email</label>
                <input type="email" style={INPUT_STYLE} value={formData.email} onChange={e => set('email', e.target.value)} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={LABEL_STYLE}>Street Address</label>
                <input style={INPUT_STYLE} value={formData.address.street} onChange={e => setAddr('street', e.target.value)} />
              </div>
              <div>
                <label style={LABEL_STYLE}>City</label>
                <input style={INPUT_STYLE} value={formData.address.city} onChange={e => setAddr('city', e.target.value)} />
              </div>
              <div>
                <label style={LABEL_STYLE}>State</label>
                <input style={INPUT_STYLE} value={formData.address.state} onChange={e => setAddr('state', e.target.value)} />
              </div>
              <div>
                <label style={LABEL_STYLE}>Default Tax Rate (%)</label>
                <input type="number" step="0.01" style={INPUT_STYLE} value={formData.tax_settings.default_tax_rate} onChange={e => setTax('default_tax_rate', parseFloat(e.target.value))} />
              </div>
              <div>
                <label style={LABEL_STYLE}>Tax Number</label>
                <input style={INPUT_STYLE} value={formData.tax_settings.tax_number} onChange={e => setTax('tax_number', e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div
                onClick={() => set('is_active', !formData.is_active)}
                style={{ width: 40, height: 22, borderRadius: 11, background: formData.is_active ? '#00A86B' : '#CBD5E1', position: 'relative', cursor: 'pointer', transition: 'background 150ms', flexShrink: 0 }}
              >
                <div style={{ position: 'absolute', top: 3, left: formData.is_active ? 20 : 3, width: 16, height: 16, borderRadius: '50%', background: 'white', transition: 'left 150ms' }} />
              </div>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: '#475569' }}>Active Store</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 16, borderTop: '1px solid #F1F5F9' }}>
              <button type="button" onClick={handleClose} style={{ padding: '9px 18px', border: '1.5px solid #E2E8F0', borderRadius: 8, background: 'white', color: '#475569', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancel
              </button>
              <button type="submit" disabled={saveMutation.isPending} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 20px', border: 'none', borderRadius: 8, background: '#1B4F8A', color: 'white', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                <Save style={{ width: 14, height: 14 }} />
                {saveMutation.isPending ? 'Saving…' : 'Save Store'}
              </button>
            </div>
          </form>
        </div>
      )}

      <ERPTable headers={TABLE_HEADERS} emptyIcon={StoreIcon} emptyTitle="No stores yet" emptyDesc="Add your first store to manage retail outlets.">
        {stores.map(store => {
          const typeColor = TYPE_COLORS[store.store_type] || '#64748B';
          return (
            <ERPTableRow key={store.id}>
              <ERPTableCell style={{ fontFamily: 'monospace', fontSize: 12.5, color: '#1B4F8A', fontWeight: 700 }}>{store.store_code}</ERPTableCell>
              <ERPTableCell bold>{store.store_name}</ERPTableCell>
              <ERPTableCell>
                <span style={{ padding: '3px 9px', background: `${typeColor}18`, color: typeColor, borderRadius: 99, fontSize: 11.5, fontWeight: 600, textTransform: 'capitalize' }}>
                  {store.store_type}
                </span>
              </ERPTableCell>
              <ERPTableCell muted>{store.address?.city || '—'}</ERPTableCell>
              <ERPTableCell muted>{store.phone || '—'}</ERPTableCell>
              <ERPTableCell><StatusBadge status={store.is_active ? 'active' : 'inactive'} /></ERPTableCell>
              <ERPTableCell>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => handleEdit(store)} style={{ padding: '5px 8px', border: '1.5px solid #E2E8F0', borderRadius: 6, background: 'white', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center' }}>
                    <Pencil style={{ width: 13, height: 13 }} />
                  </button>
                  <button onClick={() => deleteMutation.mutate(store.id)} style={{ padding: '5px 8px', border: '1.5px solid #FECACA', borderRadius: 6, background: 'white', cursor: 'pointer', color: '#EF4444', display: 'flex', alignItems: 'center' }}>
                    <Trash2 style={{ width: 13, height: 13 }} />
                  </button>
                </div>
              </ERPTableCell>
            </ERPTableRow>
          );
        })}
      </ERPTable>
    </PageShell>
  );
}

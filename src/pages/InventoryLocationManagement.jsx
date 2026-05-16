import React, { useState } from "react";
import { InventoryLocation, Store } from "@/api/entities";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Pencil, Trash2, X, Save } from "lucide-react";
import { useCompany } from "../components/auth/CompanyContext";
import PageShell, {
  PageHeader,
  StatBar,
  ERPTable,
  ERPTableRow,
  ERPTableCell,
  StatusBadge,
  ActionBtn,
  NewBtn,
} from "../components/shared/PageShell";

const PRIMARY = "#1B4F8A";
const ACCENT  = "#00A86B";

export default function InventoryLocationManagement() {
  const { currentCompany } = useCompany();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);

  const [formData, setFormData] = useState({
    location_code: '',
    location_name: '',
    company_id: currentCompany?.id,
    store_id: '',
    location_type: 'warehouse',
    address: { street: '', city: '', state: '', postal_code: '', country: '' },
    is_active: true,
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['inventory-locations', currentCompany?.id],
    queryFn: () =>
      currentCompany
        ? InventoryLocation.list({ filters: { company_id: currentCompany.id } })
        : Promise.resolve([]),
    enabled: !!currentCompany,
  });

  const { data: stores = [] } = useQuery({
    queryKey: ['stores', currentCompany?.id],
    queryFn: () =>
      currentCompany
        ? Store.list({ filters: { company_id: currentCompany.id } })
        : Promise.resolve([]),
    enabled: !!currentCompany,
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (editingLocation) {
        return InventoryLocation.update(editingLocation.id, data);
      }
      return InventoryLocation.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['inventory-locations']);
      handleClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => InventoryLocation.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['inventory-locations']);
    },
  });

  const handleEdit = (location) => {
    setEditingLocation(location);
    setFormData(location);
    setShowForm(true);
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingLocation(null);
    setFormData({
      location_code: '',
      location_name: '',
      company_id: currentCompany?.id,
      store_id: '',
      location_type: 'warehouse',
      address: { street: '', city: '', state: '', postal_code: '', country: '' },
      is_active: true,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const activeCount   = locations.filter(l => l.is_active).length;
  const inactiveCount = locations.filter(l => !l.is_active).length;

  const TABLE_HEADERS = [
    { label: 'Code' },
    { label: 'Location Name' },
    { label: 'Type' },
    { label: 'Store' },
    { label: 'City' },
    { label: 'Status' },
    { label: '' },
  ];

  return (
    <PageShell>
      <PageHeader
        title="Inventory Locations"
        subtitle="Manage warehouses and inventory storage locations"
        icon={MapPin}
        accentColor={PRIMARY}
        actions={<NewBtn onClick={() => setShowForm(true)} label="New Location" />}
      />

      <StatBar
        stats={[
          { label: 'Total Locations', value: locations.length, color: PRIMARY },
          { label: 'Active',          value: activeCount,       color: ACCENT  },
          { label: 'Inactive',        value: inactiveCount,     color: '#94A3B8' },
        ]}
      />

      {showForm && (
        <Card style={{ marginBottom: 24, border: `1.5px solid ${PRIMARY}30` }}>
          <CardHeader
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #F1F5F9',
              background: `${PRIMARY}06`,
            }}
          >
            <CardTitle style={{ color: '#0F172A' }}>
              {editingLocation ? 'Edit Location' : 'New Inventory Location'}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Location Code *</Label>
                  <Input
                    value={formData.location_code}
                    onChange={(e) => setFormData(prev => ({ ...prev, location_code: e.target.value }))}
                    placeholder="e.g., WH-001"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Location Name *</Label>
                  <Input
                    value={formData.location_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, location_name: e.target.value }))}
                    placeholder="e.g., Main Warehouse"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Location Type</Label>
                  <Select
                    value={formData.location_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, location_type: value }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="store">Store</SelectItem>
                      <SelectItem value="warehouse">Warehouse</SelectItem>
                      <SelectItem value="transit">Transit</SelectItem>
                      <SelectItem value="virtual">Virtual</SelectItem>
                      <SelectItem value="consignment">Consignment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Link to Store (Optional)</Label>
                  <Select
                    value={formData.store_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, store_id: value }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Select store" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>None</SelectItem>
                      {stores.map(store => (
                        <SelectItem key={store.id} value={store.id}>{store.store_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Street Address</Label>
                  <Input
                    value={formData.address?.street || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: { ...prev.address, street: e.target.value } }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    value={formData.address?.city || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: { ...prev.address, city: e.target.value } }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>State</Label>
                  <Input
                    value={formData.address?.state || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: { ...prev.address, state: e.target.value } }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Postal Code</Label>
                  <Input
                    value={formData.address?.postal_code || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: { ...prev.address, postal_code: e.target.value } }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input
                    value={formData.address?.country || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: { ...prev.address, country: e.target.value } }))}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">Active Location</Label>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 10,
                  paddingTop: 16,
                  borderTop: '1px solid #F1F5F9',
                }}
              >
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saveMutation.isPending}
                  style={{ background: PRIMARY, color: 'white', border: 'none' }}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Location
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <ERPTable
        headers={TABLE_HEADERS}
        emptyIcon={MapPin}
        emptyTitle="No inventory locations found"
        emptyDesc="Add your first warehouse or storage location."
        emptyAction={<NewBtn onClick={() => setShowForm(true)} label="Add First Location" />}
      >
        {locations.map((location) => (
          <ERPTableRow key={location.id}>
            <ERPTableCell bold style={{ color: PRIMARY }}>{location.location_code}</ERPTableCell>
            <ERPTableCell bold>{location.location_name}</ERPTableCell>
            <ERPTableCell muted style={{ textTransform: 'capitalize' }}>{location.location_type}</ERPTableCell>
            <ERPTableCell muted>
              {stores.find(s => s.id === location.store_id)?.store_name || 'N/A'}
            </ERPTableCell>
            <ERPTableCell muted>{location.address?.city || 'N/A'}</ERPTableCell>
            <ERPTableCell>
              <StatusBadge status={location.is_active ? 'active' : 'inactive'} />
            </ERPTableCell>
            <ERPTableCell>
              <div style={{ display: 'flex', gap: 6 }}>
                <ActionBtn onClick={() => handleEdit(location)} icon={Pencil} variant="ghost" />
                <ActionBtn
                  onClick={() => deleteMutation.mutate(location.id)}
                  icon={Trash2}
                  variant="ghost"
                  style={{ color: '#EF4444' }}
                />
              </div>
            </ERPTableCell>
          </ERPTableRow>
        ))}
      </ERPTable>
    </PageShell>
  );
}

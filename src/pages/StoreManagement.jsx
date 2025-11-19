import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Store, Pencil, Trash2, X, Save } from "lucide-react";
import { useCompany } from "../components/auth/CompanyContext";

export default function StoreManagement() {
  const { currentCompany } = useCompany();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingStore, setEditingStore] = useState(null);

  const [formData, setFormData] = useState({
    store_code: '',
    store_name: '',
    company_id: currentCompany?.id,
    store_type: 'retail',
    address: {
      street: '',
      city: '',
      state: '',
      postal_code: '',
      country: ''
    },
    phone: '',
    email: '',
    manager_id: '',
    tax_settings: {
      default_tax_rate: 0,
      tax_inclusive: false,
      tax_number: ''
    },
    default_inventory_location_id: '',
    is_active: true
  });

  const { data: stores = [] } = useQuery({
    queryKey: ['stores', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.Store.filter({ company_id: currentCompany.id }) : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['inventory-locations', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.InventoryLocation.filter({ company_id: currentCompany.id }) : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (editingStore) {
        return base44.entities.Store.update(editingStore.id, data);
      }
      return base44.entities.Store.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['stores']);
      handleClose();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Store.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['stores']);
    }
  });

  const handleEdit = (store) => {
    setEditingStore(store);
    setFormData(store);
    setShowForm(true);
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingStore(null);
    setFormData({
      store_code: '',
      store_name: '',
      company_id: currentCompany?.id,
      store_type: 'retail',
      address: { street: '', city: '', state: '', postal_code: '', country: '' },
      phone: '',
      email: '',
      manager_id: '',
      tax_settings: { default_tax_rate: 0, tax_inclusive: false, tax_number: '' },
      default_inventory_location_id: '',
      is_active: true
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Store Management</h1>
          <p className="text-gray-500 mt-1">Manage retail stores and outlets</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          New Store
        </Button>
      </div>

      {showForm && (
        <Card className="border-2 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between border-b bg-blue-50">
            <CardTitle>{editingStore ? 'Edit Store' : 'New Store'}</CardTitle>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Store Code *</Label>
                  <Input
                    value={formData.store_code}
                    onChange={(e) => setFormData(prev => ({ ...prev, store_code: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Store Name *</Label>
                  <Input
                    value={formData.store_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, store_name: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Store Type</Label>
                  <Select
                    value={formData.store_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, store_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="warehouse">Warehouse</SelectItem>
                      <SelectItem value="outlet">Outlet</SelectItem>
                      <SelectItem value="franchise">Franchise</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Default Inventory Location</Label>
                  <Select
                    value={formData.default_inventory_location_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, default_inventory_location_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map(loc => (
                        <SelectItem key={loc.id} value={loc.id}>{loc.location_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Street Address</Label>
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
                  <Label>State</Label>
                  <Input
                    value={formData.address.state}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      address: { ...prev.address, state: e.target.value }
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Default Tax Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.tax_settings.default_tax_rate}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      tax_settings: { ...prev.tax_settings, default_tax_rate: parseFloat(e.target.value) }
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tax Number</Label>
                  <Input
                    value={formData.tax_settings.tax_number}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      tax_settings: { ...prev.tax_settings, tax_number: e.target.value }
                    }))}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">Active Store</Label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  <Save className="w-4 h-4 mr-2" />
                  Save Store
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Store Code</TableHead>
                <TableHead>Store Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Store className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No stores found</p>
                    <Button onClick={() => setShowForm(true)} variant="outline" className="mt-3">
                      Add your first store
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                stores.map(store => (
                  <TableRow key={store.id}>
                    <TableCell className="font-medium">{store.store_code}</TableCell>
                    <TableCell>{store.store_name}</TableCell>
                    <TableCell className="capitalize">{store.store_type}</TableCell>
                    <TableCell>{store.address?.city}</TableCell>
                    <TableCell>{store.phone}</TableCell>
                    <TableCell>
                      <Badge className={store.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {store.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(store)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteMutation.mutate(store.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
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
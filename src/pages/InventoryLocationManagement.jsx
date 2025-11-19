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
import { Plus, MapPin, Pencil, Trash2, X, Save } from "lucide-react";
import { useCompany } from "../components/auth/CompanyContext";

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
    address: {
      street: '',
      city: '',
      state: '',
      postal_code: '',
      country: ''
    },
    is_active: true
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['inventory-locations', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.InventoryLocation.filter({ company_id: currentCompany.id }) : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const { data: stores = [] } = useQuery({
    queryKey: ['stores', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.Store.filter({ company_id: currentCompany.id }) : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (editingLocation) {
        return base44.entities.InventoryLocation.update(editingLocation.id, data);
      }
      return base44.entities.InventoryLocation.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['inventory-locations']);
      handleClose();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.InventoryLocation.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['inventory-locations']);
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Inventory Locations</h1>
          <p className="text-gray-500 mt-1">Manage warehouses and inventory storage locations</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          New Location
        </Button>
      </div>

      {showForm && (
        <Card className="border-2 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between border-b bg-blue-50">
            <CardTitle>{editingLocation ? 'Edit Location' : 'New Inventory Location'}</CardTitle>
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
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
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
                    <SelectTrigger>
                      <SelectValue placeholder="Select store" />
                    </SelectTrigger>
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
                  <Label>Postal Code</Label>
                  <Input
                    value={formData.address.postal_code}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      address: { ...prev.address, postal_code: e.target.value }
                    }))}
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

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  <Save className="w-4 h-4 mr-2" />
                  Save Location
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
                <TableHead>Code</TableHead>
                <TableHead>Location Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <MapPin className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No inventory locations found</p>
                    <Button onClick={() => setShowForm(true)} variant="outline" className="mt-3">
                      Add your first location
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                locations.map(location => (
                  <TableRow key={location.id}>
                    <TableCell className="font-medium">{location.location_code}</TableCell>
                    <TableCell>{location.location_name}</TableCell>
                    <TableCell className="capitalize">{location.location_type}</TableCell>
                    <TableCell>{stores.find(s => s.id === location.store_id)?.store_name || 'N/A'}</TableCell>
                    <TableCell>{location.address?.city || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge className={location.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {location.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(location)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteMutation.mutate(location.id)}
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
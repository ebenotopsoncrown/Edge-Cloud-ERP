import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, Plus, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function BOMForm({ bom, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    bom_number: '',
    product_id: '',
    product_name: '',
    version: '1.0',
    is_active: true,
    components: [],
    labor_hours: 0,
    labor_rate_per_hour: 0,
    overhead_rate: 0,
    ...bom
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list()
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      const totalMaterial = data.components.reduce((sum, c) => sum + (c.total_cost || 0), 0);
      const totalLabor = (data.labor_hours || 0) * (data.labor_rate_per_hour || 0);
      const totalOverhead = totalMaterial * ((data.overhead_rate || 0) / 100);
      
      const finalData = {
        ...data,
        total_material_cost: totalMaterial,
        total_labor_cost: totalLabor,
        total_overhead_cost: totalOverhead,
        total_cost: totalMaterial + totalLabor + totalOverhead
      };
      
      if (bom?.id) {
        return base44.entities.BillOfMaterials.update(bom.id, finalData);
      }
      return base44.entities.BillOfMaterials.create(finalData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['boms']);
      onClose();
    }
  });

  const addComponent = () => {
    setFormData(prev => ({
      ...prev,
      components: [...prev.components, {
        component_id: '',
        component_name: '',
        quantity_required: 1,
        unit_of_measure: 'unit',
        unit_cost: 0,
        total_cost: 0
      }]
    }));
  };

  const updateComponent = (index, field, value) => {
    const newComponents = [...formData.components];
    newComponents[index][field] = value;
    
    if (field === 'quantity_required' || field === 'unit_cost') {
      const qty = parseFloat(newComponents[index].quantity_required) || 0;
      const cost = parseFloat(newComponents[index].unit_cost) || 0;
      newComponents[index].total_cost = qty * cost;
    }
    
    if (field === 'component_id') {
      const product = products.find(p => p.id === value);
      if (product) {
        newComponents[index].component_name = product.product_name;
        newComponents[index].unit_cost = product.cost_price || product.unit_price;
        const qty = parseFloat(newComponents[index].quantity_required) || 0;
        newComponents[index].total_cost = qty * (product.cost_price || product.unit_price);
      }
    }
    
    setFormData(prev => ({ ...prev, components: newComponents }));
  };

  const removeComponent = (index) => {
    setFormData(prev => ({
      ...prev,
      components: prev.components.filter((_, i) => i !== index)
    }));
  };

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between border-b">
        <CardTitle>{bom ? 'Edit BOM' : 'New Bill of Materials'}</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>BOM Number *</Label>
            <Input
              value={formData.bom_number}
              onChange={(e) => setFormData(prev => ({ ...prev, bom_number: e.target.value }))}
              placeholder="BOM-001"
            />
          </div>

          <div className="space-y-2">
            <Label>Product *</Label>
            <Select 
              value={formData.product_id} 
              onValueChange={(value) => {
                const product = products.find(p => p.id === value);
                setFormData(prev => ({
                  ...prev,
                  product_id: value,
                  product_name: product?.product_name || ''
                }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {products.map(product => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.product_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Labor Hours</Label>
            <Input
              type="number"
              step="0.1"
              value={formData.labor_hours}
              onChange={(e) => setFormData(prev => ({ ...prev, labor_hours: parseFloat(e.target.value) }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Labor Rate per Hour</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.labor_rate_per_hour}
              onChange={(e) => setFormData(prev => ({ ...prev, labor_rate_per_hour: parseFloat(e.target.value) }))}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Components</h3>
            <Button onClick={addComponent} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Component
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Component</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit Cost</TableHead>
                <TableHead>Total</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {formData.components.map((comp, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Select
                      value={comp.component_id}
                      onValueChange={(value) => updateComponent(index, 'component_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map(product => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.product_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.1"
                      value={comp.quantity_required}
                      onChange={(e) => updateComponent(index, 'quantity_required', e.target.value)}
                      className="w-24"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      value={comp.unit_cost}
                      onChange={(e) => updateComponent(index, 'unit_cost', e.target.value)}
                      className="w-24"
                    />
                  </TableCell>
                  <TableCell className="font-semibold">
                    ${(comp.total_cost || 0).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeComponent(index)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => saveMutation.mutate(formData)} className="bg-blue-600 hover:bg-blue-700">
            <Save className="w-4 h-4 mr-2" />
            Save BOM
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
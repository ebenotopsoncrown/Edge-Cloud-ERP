import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X, Save } from "lucide-react";

export default function WorkOrderForm({ workOrder, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    work_order_number: '',
    product_id: '',
    product_name: '',
    quantity_to_produce: 1,
    quantity_produced: 0,
    start_date: '',
    expected_completion_date: '',
    status: 'draft',
    material_costs: 0,
    labor_costs: 0,
    overhead_costs: 0,
    total_cost: 0,
    notes: '',
    ...workOrder
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list()
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      const totalCost = (data.material_costs || 0) + (data.labor_costs || 0) + (data.overhead_costs || 0);
      const costPerUnit = data.quantity_produced > 0 ? totalCost / data.quantity_produced : 0;
      
      const finalData = {
        ...data,
        total_cost: totalCost,
        cost_per_unit: costPerUnit
      };
      
      if (workOrder?.id) {
        return base44.entities.WorkOrder.update(workOrder.id, finalData);
      }
      return base44.entities.WorkOrder.create(finalData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['work-orders']);
      onClose();
    }
  });

  const handleProductChange = (productId) => {
    const product = products.find(p => p.id === productId);
    setFormData(prev => ({
      ...prev,
      product_id: productId,
      product_name: product?.product_name || ''
    }));
  };

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between border-b">
        <CardTitle>{workOrder ? 'Edit Work Order' : 'New Work Order'}</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Work Order Number *</Label>
            <Input
              value={formData.work_order_number}
              onChange={(e) => setFormData(prev => ({ ...prev, work_order_number: e.target.value }))}
              placeholder="WO-001"
            />
          </div>

          <div className="space-y-2">
            <Label>Product *</Label>
            <Select value={formData.product_id} onValueChange={handleProductChange}>
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
            <Label>Quantity to Produce *</Label>
            <Input
              type="number"
              value={formData.quantity_to_produce}
              onChange={(e) => setFormData(prev => ({ ...prev, quantity_to_produce: parseFloat(e.target.value) }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Quantity Produced</Label>
            <Input
              type="number"
              value={formData.quantity_produced}
              onChange={(e) => setFormData(prev => ({ ...prev, quantity_produced: parseFloat(e.target.value) }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Start Date *</Label>
            <Input
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Expected Completion</Label>
            <Input
              type="date"
              value={formData.expected_completion_date}
              onChange={(e) => setFormData(prev => ({ ...prev, expected_completion_date: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="released">Released</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Material Costs</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.material_costs}
              onChange={(e) => setFormData(prev => ({ ...prev, material_costs: parseFloat(e.target.value) }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Labor Costs</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.labor_costs}
              onChange={(e) => setFormData(prev => ({ ...prev, labor_costs: parseFloat(e.target.value) }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Overhead Costs</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.overhead_costs}
              onChange={(e) => setFormData(prev => ({ ...prev, overhead_costs: parseFloat(e.target.value) }))}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
            <Save className="w-4 h-4 mr-2" />
            Save Work Order
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
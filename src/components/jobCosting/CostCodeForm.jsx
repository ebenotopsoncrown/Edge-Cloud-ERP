import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X, Save } from "lucide-react";

export default function CostCodeForm({ costCode, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    cost_code: '',
    cost_code_name: '',
    category: 'labor',
    description: '',
    is_active: true,
    ...costCode
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (costCode?.id) {
        return base44.entities.CostCode.update(costCode.id, data);
      }
      return base44.entities.CostCode.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['cost-codes']);
      onClose();
    }
  });

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between border-b">
        <CardTitle>{costCode ? 'Edit Cost Code' : 'New Cost Code'}</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Cost Code *</Label>
            <Input
              value={formData.cost_code}
              onChange={(e) => setFormData(prev => ({ ...prev, cost_code: e.target.value }))}
              placeholder="CC-001"
            />
          </div>

          <div className="space-y-2">
            <Label>Cost Code Name *</Label>
            <Input
              value={formData.cost_code_name}
              onChange={(e) => setFormData(prev => ({ ...prev, cost_code_name: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Category *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="labor">Labor</SelectItem>
                <SelectItem value="materials">Materials</SelectItem>
                <SelectItem value="equipment">Equipment</SelectItem>
                <SelectItem value="subcontractor">Subcontractor</SelectItem>
                <SelectItem value="overhead">Overhead</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => saveMutation.mutate(formData)} className="bg-blue-600 hover:bg-blue-700">
            <Save className="w-4 h-4 mr-2" />
            Save Cost Code
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
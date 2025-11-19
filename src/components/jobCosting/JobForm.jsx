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

export default function JobForm({ job, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    job_number: '',
    job_name: '',
    description: '',
    customer_id: '',
    customer_name: '',
    job_type: 'fixed_price',
    status: 'pending',
    start_date: '',
    expected_end_date: '',
    contract_amount: 0,
    budgeted_cost: 0,
    actual_cost: 0,
    percent_complete: 0,
    project_manager: '',
    location: '',
    notes: '',
    ...job
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list()
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (job?.id) {
        return base44.entities.Job.update(job.id, data);
      }
      return base44.entities.Job.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['jobs']);
      onClose();
    }
  });

  const handleCustomerChange = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    setFormData(prev => ({
      ...prev,
      customer_id: customerId,
      customer_name: customer?.company_name || ''
    }));
  };

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between border-b">
        <CardTitle>{job ? 'Edit Job' : 'New Job/Project'}</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Job Number *</Label>
            <Input
              value={formData.job_number}
              onChange={(e) => setFormData(prev => ({ ...prev, job_number: e.target.value }))}
              placeholder="JOB-001"
            />
          </div>

          <div className="space-y-2">
            <Label>Job Name *</Label>
            <Input
              value={formData.job_name}
              onChange={(e) => setFormData(prev => ({ ...prev, job_name: e.target.value }))}
              placeholder="Project name"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Customer *</Label>
            <Select value={formData.customer_id} onValueChange={handleCustomerChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map(customer => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.company_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Job Type</Label>
            <Select
              value={formData.job_type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, job_type: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed_price">Fixed Price</SelectItem>
                <SelectItem value="time_and_materials">Time & Materials</SelectItem>
                <SelectItem value="cost_plus">Cost Plus</SelectItem>
              </SelectContent>
            </Select>
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
            <Label>Expected End Date</Label>
            <Input
              type="date"
              value={formData.expected_end_date}
              onChange={(e) => setFormData(prev => ({ ...prev, expected_end_date: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Contract Amount</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.contract_amount}
              onChange={(e) => setFormData(prev => ({ ...prev, contract_amount: parseFloat(e.target.value) }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Budgeted Cost</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.budgeted_cost}
              onChange={(e) => setFormData(prev => ({ ...prev, budgeted_cost: parseFloat(e.target.value) }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Project Manager</Label>
            <Input
              value={formData.project_manager}
              onChange={(e) => setFormData(prev => ({ ...prev, project_manager: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Location</Label>
            <Input
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => saveMutation.mutate(formData)} className="bg-blue-600 hover:bg-blue-700">
            <Save className="w-4 h-4 mr-2" />
            Save Job
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
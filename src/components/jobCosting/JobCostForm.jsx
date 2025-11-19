import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Save } from "lucide-react";

export default function JobCostForm({ jobCost, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    job_id: '',
    phase_id: '',
    cost_code_id: '',
    transaction_date: '',
    description: '',
    quantity: 1,
    unit_cost: 0,
    total_cost: 0,
    cost_type: 'labor',
    is_billable: true,
    is_billed: false,
    ...jobCost
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => base44.entities.Job.list()
  });

  const { data: phases = [] } = useQuery({
    queryKey: ['job-phases'],
    queryFn: () => base44.entities.JobPhase.list()
  });

  const { data: costCodes = [] } = useQuery({
    queryKey: ['cost-codes'],
    queryFn: () => base44.entities.CostCode.list()
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      const totalCost = (data.quantity || 0) * (data.unit_cost || 0);
      const finalData = { ...data, total_cost: totalCost };
      
      if (jobCost?.id) {
        return base44.entities.JobCost.update(jobCost.id, finalData);
      }
      return base44.entities.JobCost.create(finalData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['job-costs']);
      onClose();
    }
  });

  const jobPhases = phases.filter(p => p.job_id === formData.job_id);

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between border-b">
        <CardTitle>{jobCost ? 'Edit Job Cost' : 'Record Job Cost'}</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Job *</Label>
            <Select 
              value={formData.job_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, job_id: value, phase_id: '' }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select job" />
              </SelectTrigger>
              <SelectContent>
                {jobs.map(job => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.job_number} - {job.job_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Phase</Label>
            <Select 
              value={formData.phase_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, phase_id: value }))}
              disabled={!formData.job_id}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select phase" />
              </SelectTrigger>
              <SelectContent>
                {jobPhases.map(phase => (
                  <SelectItem key={phase.id} value={phase.id}>
                    {phase.phase_code} - {phase.phase_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Cost Type *</Label>
            <Select
              value={formData.cost_type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, cost_type: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="labor">Labor</SelectItem>
                <SelectItem value="material">Material</SelectItem>
                <SelectItem value="equipment">Equipment</SelectItem>
                <SelectItem value="subcontractor">Subcontractor</SelectItem>
                <SelectItem value="overhead">Overhead</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Transaction Date *</Label>
            <Input
              type="date"
              value={formData.transaction_date}
              onChange={(e) => setFormData(prev => ({ ...prev, transaction_date: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Quantity</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.quantity}
              onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseFloat(e.target.value) }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Unit Cost</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.unit_cost}
              onChange={(e) => setFormData(prev => ({ ...prev, unit_cost: parseFloat(e.target.value) }))}
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

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="billable" 
              checked={formData.is_billable}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_billable: checked }))}
            />
            <label htmlFor="billable" className="text-sm font-medium">
              Billable to customer
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => saveMutation.mutate(formData)} className="bg-blue-600 hover:bg-blue-700">
            <Save className="w-4 h-4 mr-2" />
            Save Cost
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
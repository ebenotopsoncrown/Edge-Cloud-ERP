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

export default function JobPhaseForm({ phase, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    phase_code: '',
    phase_name: '',
    job_id: '',
    description: '',
    status: 'not_started',
    budgeted_amount: 0,
    ...phase
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => base44.entities.Job.list()
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (phase?.id) {
        return base44.entities.JobPhase.update(phase.id, data);
      }
      return base44.entities.JobPhase.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['job-phases']);
      onClose();
    }
  });

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between border-b">
        <CardTitle>{phase ? 'Edit Phase' : 'New Job Phase'}</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Phase Code *</Label>
            <Input
              value={formData.phase_code}
              onChange={(e) => setFormData(prev => ({ ...prev, phase_code: e.target.value }))}
              placeholder="PH-001"
            />
          </div>

          <div className="space-y-2">
            <Label>Phase Name *</Label>
            <Input
              value={formData.phase_name}
              onChange={(e) => setFormData(prev => ({ ...prev, phase_name: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Job *</Label>
            <Select 
              value={formData.job_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, job_id: value }))}
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
            <Label>Budgeted Amount</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.budgeted_amount}
              onChange={(e) => setFormData(prev => ({ ...prev, budgeted_amount: parseFloat(e.target.value) }))}
            />
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
            Save Phase
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
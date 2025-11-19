import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, Briefcase, Layers, Code, Pencil } from "lucide-react";
import { format } from "date-fns";
import JobForm from "../components/jobCosting/JobForm";
import JobPhaseForm from "../components/jobCosting/JobPhaseForm";
import CostCodeForm from "../components/jobCosting/CostCodeForm";
import JobCostForm from "../components/jobCosting/JobCostForm";

const statusColors = {
  pending: "bg-gray-100 text-gray-800",
  in_progress: "bg-blue-100 text-blue-800",
  on_hold: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800"
};

export default function JobCosting() {
  const [activeTab, setActiveTab] = useState("jobs");
  const [showJobForm, setShowJobForm] = useState(false);
  const [showPhaseForm, setShowPhaseForm] = useState(false);
  const [showCostCodeForm, setShowCostCodeForm] = useState(false);
  const [showJobCostForm, setShowJobCostForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => base44.entities.Job.list('-start_date')
  });

  const { data: phases = [] } = useQuery({
    queryKey: ['job-phases'],
    queryFn: () => base44.entities.JobPhase.list()
  });

  const { data: costCodes = [] } = useQuery({
    queryKey: ['cost-codes'],
    queryFn: () => base44.entities.CostCode.list()
  });

  const { data: jobCosts = [] } = useQuery({
    queryKey: ['job-costs'],
    queryFn: () => base44.entities.JobCost.list('-transaction_date')
  });

  const filteredJobs = jobs.filter(job =>
    job.job_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.job_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Job Costing</h1>
          <p className="text-gray-500 mt-1">Track project costs and profitability</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="jobs">Jobs/Projects</TabsTrigger>
          <TabsTrigger value="phases">Job Phases</TabsTrigger>
          <TabsTrigger value="cost-codes">Cost Codes</TabsTrigger>
          <TabsTrigger value="job-costs">Job Costs</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => setShowJobForm(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              New Job
            </Button>
          </div>

          {showJobForm && (
            <JobForm
              job={editingItem}
              onClose={() => {
                setShowJobForm(false);
                setEditingItem(null);
              }}
            />
          )}

          <Card className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Number</TableHead>
                  <TableHead>Job Name</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contract Amount</TableHead>
                  <TableHead>Actual Cost</TableHead>
                  <TableHead>Profit</TableHead>
                  <TableHead>% Complete</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <Briefcase className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500">No jobs found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredJobs.map((job) => {
                    const profit = (job.contract_amount || 0) - (job.actual_cost || 0);
                    return (
                      <TableRow key={job.id}>
                        <TableCell className="font-medium">{job.job_number}</TableCell>
                        <TableCell>{job.job_name}</TableCell>
                        <TableCell>{job.customer_name}</TableCell>
                        <TableCell className="font-semibold">${job.contract_amount?.toFixed(2)}</TableCell>
                        <TableCell className="text-red-600">${job.actual_cost?.toFixed(2)}</TableCell>
                        <TableCell className={profit >= 0 ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                          ${profit.toFixed(2)}
                        </TableCell>
                        <TableCell>{job.percent_complete || 0}%</TableCell>
                        <TableCell>
                          <Badge className={statusColors[job.status]}>{job.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingItem(job);
                              setShowJobForm(true);
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="phases" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowPhaseForm(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              New Phase
            </Button>
          </div>

          {showPhaseForm && (
            <JobPhaseForm
              phase={editingItem}
              onClose={() => {
                setShowPhaseForm(false);
                setEditingItem(null);
              }}
            />
          )}

          <Card className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Phase Code</TableHead>
                  <TableHead>Phase Name</TableHead>
                  <TableHead>Job</TableHead>
                  <TableHead>Budgeted</TableHead>
                  <TableHead>Actual Cost</TableHead>
                  <TableHead>Variance</TableHead>
                  <TableHead>% Complete</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {phases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <Layers className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500">No phases found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  phases.map((phase) => {
                    const job = jobs.find(j => j.id === phase.job_id);
                    const variance = (phase.budgeted_amount || 0) - (phase.actual_cost || 0);
                    return (
                      <TableRow key={phase.id}>
                        <TableCell className="font-medium">{phase.phase_code}</TableCell>
                        <TableCell>{phase.phase_name}</TableCell>
                        <TableCell>{job?.job_number}</TableCell>
                        <TableCell>${phase.budgeted_amount?.toFixed(2)}</TableCell>
                        <TableCell className="text-red-600">${phase.actual_cost?.toFixed(2)}</TableCell>
                        <TableCell className={variance >= 0 ? "text-green-600" : "text-red-600"}>
                          ${variance.toFixed(2)}
                        </TableCell>
                        <TableCell>{phase.percent_complete || 0}%</TableCell>
                        <TableCell>
                          <Badge>{phase.status?.replace(/_/g, ' ')}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingItem(phase);
                              setShowPhaseForm(true);
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="cost-codes" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowCostCodeForm(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              New Cost Code
            </Button>
          </div>

          {showCostCodeForm && (
            <CostCodeForm
              costCode={editingItem}
              onClose={() => {
                setShowCostCodeForm(false);
                setEditingItem(null);
              }}
            />
          )}

          <Card className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cost Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {costCodes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Code className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500">No cost codes found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  costCodes.map((code) => (
                    <TableRow key={code.id}>
                      <TableCell className="font-medium">{code.cost_code}</TableCell>
                      <TableCell>{code.cost_code_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{code.category}</Badge>
                      </TableCell>
                      <TableCell>{code.description}</TableCell>
                      <TableCell>
                        <Badge className={code.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                          {code.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingItem(code);
                            setShowCostCodeForm(true);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="job-costs" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowJobCostForm(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Record Job Cost
            </Button>
          </div>

          {showJobCostForm && (
            <JobCostForm
              jobCost={editingItem}
              onClose={() => {
                setShowJobCostForm(false);
                setEditingItem(null);
              }}
            />
          )}

          <Card className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Job</TableHead>
                  <TableHead>Phase</TableHead>
                  <TableHead>Cost Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead>Billable</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobCosts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <p className="text-gray-500">No job costs recorded</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  jobCosts.map((cost) => {
                    const job = jobs.find(j => j.id === cost.job_id);
                    const phase = phases.find(p => p.id === cost.phase_id);
                    return (
                      <TableRow key={cost.id}>
                        <TableCell>{format(new Date(cost.transaction_date), 'MMM d, yyyy')}</TableCell>
                        <TableCell>{job?.job_number}</TableCell>
                        <TableCell>{phase?.phase_code || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{cost.cost_type}</Badge>
                        </TableCell>
                        <TableCell>{cost.description}</TableCell>
                        <TableCell>{cost.quantity}</TableCell>
                        <TableCell className="font-semibold">${cost.total_cost?.toFixed(2)}</TableCell>
                        <TableCell>
                          {cost.is_billable ? (
                            <Badge className={cost.is_billed ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                              {cost.is_billed ? 'Billed' : 'To Bill'}
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800">Non-billable</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingItem(cost);
                              setShowJobCostForm(true);
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
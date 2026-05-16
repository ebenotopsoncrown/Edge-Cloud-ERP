import React, { useState } from "react";
import { Job, JobPhase, CostCode, JobCost } from "@/api/entities";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Briefcase, Layers, Code, Pencil, DollarSign, TrendingUp, Clock } from "lucide-react";
import { format } from "date-fns";
import JobForm from "../components/jobCosting/JobForm";
import JobPhaseForm from "../components/jobCosting/JobPhaseForm";
import CostCodeForm from "../components/jobCosting/CostCodeForm";
import JobCostForm from "../components/jobCosting/JobCostForm";
import PageShell, { PageHeader, StatBar, StatusBadge, NewBtn, ActionBtn } from "../components/shared/PageShell";

const STATUS_COLORS = {
  pending:     { bg: '#F8FAFC', color: '#64748B' },
  in_progress: { bg: '#EBF4FB', color: '#1B4F8A' },
  on_hold:     { bg: '#FEF3C7', color: '#B45309' },
  completed:   { bg: '#E6F9F2', color: '#00875A' },
  cancelled:   { bg: '#FEF2F2', color: '#DC2626' },
};

const TABS = [
  { id: 'jobs',       label: 'Jobs / Projects' },
  { id: 'phases',     label: 'Job Phases' },
  { id: 'cost-codes', label: 'Cost Codes' },
  { id: 'job-costs',  label: 'Job Costs' },
];

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
    queryFn: () => Job.list({ orderBy: 'start_date', ascending: false })
  });

  const { data: phases = [] } = useQuery({
    queryKey: ['job-phases'],
    queryFn: () => JobPhase.list()
  });

  const { data: costCodes = [] } = useQuery({
    queryKey: ['cost-codes'],
    queryFn: () => CostCode.list()
  });

  const { data: jobCosts = [] } = useQuery({
    queryKey: ['job-costs'],
    queryFn: () => JobCost.list({ orderBy: 'transaction_date', ascending: false })
  });

  const filteredJobs = jobs.filter(job =>
    job.job_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.job_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalContractValue = jobs.reduce((s, j) => s + (j.contract_amount || 0), 0);
  const totalActualCost = jobs.reduce((s, j) => s + (j.actual_cost || 0), 0);
  const activeJobs = jobs.filter(j => j.status === 'in_progress').length;
  const totalProfit = totalContractValue - totalActualCost;

  const tabBtnStyle = (id) => ({
    padding: '14px 18px',
    fontSize: 13.5,
    fontWeight: activeTab === id ? 700 : 500,
    color: activeTab === id ? '#1B4F8A' : '#64748B',
    background: 'none',
    border: 'none',
    borderBottom: activeTab === id ? '2.5px solid #1B4F8A' : '2.5px solid transparent',
    cursor: 'pointer',
    fontFamily: 'inherit',
  });

  const inlineStatusBadge = (status) => {
    const cfg = STATUS_COLORS[status] || { bg: '#F1F5F9', color: '#64748B' };
    const label = status ? status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '—';
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 99, fontSize: 11.5, fontWeight: 600, background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap' }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
        {label}
      </span>
    );
  };

  const renderNewBtn = () => {
    if (activeTab === 'jobs') return <NewBtn label="New Job" onClick={() => { setEditingItem(null); setShowJobForm(true); }} />;
    if (activeTab === 'phases') return <NewBtn label="New Phase" onClick={() => { setEditingItem(null); setShowPhaseForm(true); }} />;
    if (activeTab === 'cost-codes') return <NewBtn label="New Cost Code" onClick={() => { setEditingItem(null); setShowCostCodeForm(true); }} />;
    if (activeTab === 'job-costs') return <NewBtn label="Record Job Cost" onClick={() => { setEditingItem(null); setShowJobCostForm(true); }} />;
    return null;
  };

  return (
    <PageShell>
      <PageHeader
        title="Job Costing"
        subtitle="Track project costs and profitability"
        icon={Briefcase}
        accentColor="#F59E0B"
        actions={renderNewBtn()}
      />

      <StatBar stats={[
        { label: 'Total Jobs', value: jobs.length, icon: Briefcase, color: '#F59E0B' },
        { label: 'Active Jobs', value: activeJobs, icon: Clock, color: '#1B4F8A' },
        { label: 'Contract Value', value: `$${totalContractValue.toFixed(2)}`, icon: DollarSign, color: '#1B4F8A' },
        { label: 'Actual Cost', value: `$${totalActualCost.toFixed(2)}`, icon: DollarSign, color: '#F59E0B' },
        { label: 'Profit', value: `$${totalProfit.toFixed(2)}`, icon: TrendingUp, color: totalProfit >= 0 ? '#00A86B' : '#DC2626' },
      ]} />

      {/* Search */}
      {(activeTab === 'jobs') && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ position: 'relative', maxWidth: 400 }}>
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search jobs..."
              style={{ width: '100%', padding: '9px 12px 9px 34px', border: '1.5px solid #E2E8F0', borderRadius: 9, fontSize: 13.5, color: '#0F172A', background: 'white', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
            <svg style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#94A3B8' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          </div>
        </div>
      )}

      {/* Inline forms */}
      {showJobForm && (
        <div style={{ marginBottom: 16 }}>
          <JobForm job={editingItem} onClose={() => { setShowJobForm(false); setEditingItem(null); }} />
        </div>
      )}
      {showPhaseForm && (
        <div style={{ marginBottom: 16 }}>
          <JobPhaseForm phase={editingItem} onClose={() => { setShowPhaseForm(false); setEditingItem(null); }} />
        </div>
      )}
      {showCostCodeForm && (
        <div style={{ marginBottom: 16 }}>
          <CostCodeForm costCode={editingItem} onClose={() => { setShowCostCodeForm(false); setEditingItem(null); }} />
        </div>
      )}
      {showJobCostForm && (
        <div style={{ marginBottom: 16 }}>
          <JobCostForm jobCost={editingItem} onClose={() => { setShowJobCostForm(false); setEditingItem(null); }} />
        </div>
      )}

      {/* Tabbed panel */}
      <div style={{ background: 'white', borderRadius: 14, border: '1px solid #F1F5F9', boxShadow: '0 2px 8px rgba(15,43,91,0.06)', overflow: 'hidden' }}>
        {/* Tab buttons */}
        <div style={{ display: 'flex', borderBottom: '1px solid #F1F5F9', padding: '0 16px', gap: 4 }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSearchTerm(''); }} style={tabBtnStyle(tab.id)}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ padding: 24 }}>

          {/* Jobs Tab */}
          {activeTab === 'jobs' && (
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
                    <TableCell colSpan={9} style={{ textAlign: 'center', padding: '40px 16px' }}>
                      <Briefcase style={{ width: 36, height: 36, color: '#CBD5E1', margin: '0 auto 10px', display: 'block' }} />
                      <p style={{ fontSize: 14, color: '#94A3B8' }}>No jobs found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredJobs.map((job) => {
                    const profit = (job.contract_amount || 0) - (job.actual_cost || 0);
                    return (
                      <TableRow key={job.id}>
                        <TableCell style={{ fontWeight: 600 }}>{job.job_number}</TableCell>
                        <TableCell>{job.job_name}</TableCell>
                        <TableCell>{job.customer_name}</TableCell>
                        <TableCell style={{ fontWeight: 600 }}>${job.contract_amount?.toFixed(2)}</TableCell>
                        <TableCell style={{ color: '#DC2626' }}>${job.actual_cost?.toFixed(2)}</TableCell>
                        <TableCell style={{ fontWeight: 600, color: profit >= 0 ? '#00875A' : '#DC2626' }}>
                          ${profit.toFixed(2)}
                        </TableCell>
                        <TableCell>{job.percent_complete || 0}%</TableCell>
                        <TableCell>{inlineStatusBadge(job.status)}</TableCell>
                        <TableCell>
                          <ActionBtn
                            icon={Pencil}
                            variant="ghost"
                            onClick={() => { setEditingItem(job); setShowJobForm(true); }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}

          {/* Phases Tab */}
          {activeTab === 'phases' && (
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
                    <TableCell colSpan={9} style={{ textAlign: 'center', padding: '40px 16px' }}>
                      <Layers style={{ width: 36, height: 36, color: '#CBD5E1', margin: '0 auto 10px', display: 'block' }} />
                      <p style={{ fontSize: 14, color: '#94A3B8' }}>No phases found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  phases.map((phase) => {
                    const job = jobs.find(j => j.id === phase.job_id);
                    const variance = (phase.budgeted_amount || 0) - (phase.actual_cost || 0);
                    return (
                      <TableRow key={phase.id}>
                        <TableCell style={{ fontWeight: 600 }}>{phase.phase_code}</TableCell>
                        <TableCell>{phase.phase_name}</TableCell>
                        <TableCell>{job?.job_number}</TableCell>
                        <TableCell>${phase.budgeted_amount?.toFixed(2)}</TableCell>
                        <TableCell style={{ color: '#DC2626' }}>${phase.actual_cost?.toFixed(2)}</TableCell>
                        <TableCell style={{ color: variance >= 0 ? '#00875A' : '#DC2626' }}>
                          ${variance.toFixed(2)}
                        </TableCell>
                        <TableCell>{phase.percent_complete || 0}%</TableCell>
                        <TableCell><StatusBadge status={phase.status} /></TableCell>
                        <TableCell>
                          <ActionBtn
                            icon={Pencil}
                            variant="ghost"
                            onClick={() => { setEditingItem(phase); setShowPhaseForm(true); }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}

          {/* Cost Codes Tab */}
          {activeTab === 'cost-codes' && (
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
                    <TableCell colSpan={6} style={{ textAlign: 'center', padding: '40px 16px' }}>
                      <Code style={{ width: 36, height: 36, color: '#CBD5E1', margin: '0 auto 10px', display: 'block' }} />
                      <p style={{ fontSize: 14, color: '#94A3B8' }}>No cost codes found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  costCodes.map((code) => (
                    <TableRow key={code.id}>
                      <TableCell style={{ fontWeight: 600 }}>{code.cost_code}</TableCell>
                      <TableCell>{code.cost_code_name}</TableCell>
                      <TableCell>
                        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 99, fontSize: 11.5, fontWeight: 600, background: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0' }}>
                          {code.category}
                        </span>
                      </TableCell>
                      <TableCell>{code.description}</TableCell>
                      <TableCell>
                        <StatusBadge status={code.is_active ? 'active' : 'inactive'} />
                      </TableCell>
                      <TableCell>
                        <ActionBtn
                          icon={Pencil}
                          variant="ghost"
                          onClick={() => { setEditingItem(code); setShowCostCodeForm(true); }}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {/* Job Costs Tab */}
          {activeTab === 'job-costs' && (
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
                    <TableCell colSpan={9} style={{ textAlign: 'center', padding: '40px 16px', color: '#94A3B8', fontSize: 14 }}>
                      No job costs recorded
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
                          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 99, fontSize: 11.5, fontWeight: 600, background: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0' }}>
                            {cost.cost_type}
                          </span>
                        </TableCell>
                        <TableCell>{cost.description}</TableCell>
                        <TableCell>{cost.quantity}</TableCell>
                        <TableCell style={{ fontWeight: 600 }}>${cost.total_cost?.toFixed(2)}</TableCell>
                        <TableCell>
                          {cost.is_billable ? (
                            <StatusBadge status={cost.is_billed ? 'paid' : 'pending'} />
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 99, fontSize: 11.5, fontWeight: 600, background: '#F1F5F9', color: '#94A3B8' }}>
                              Non-billable
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <ActionBtn
                            icon={Pencil}
                            variant="ghost"
                            onClick={() => { setEditingItem(cost); setShowJobCostForm(true); }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}

        </div>
      </div>
    </PageShell>
  );
}

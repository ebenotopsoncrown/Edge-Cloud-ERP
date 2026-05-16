import React, { useState } from "react";
import { Employee, PayrollItem, PayrollRun } from "@/api/entities";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Upload, Save, Calendar, Users, DollarSign, CheckCircle, Clock } from "lucide-react";
import { format, addDays } from "date-fns";
import PageShell, { PageHeader, StatBar, StatusBadge, NewBtn, ActionBtn } from "../components/shared/PageShell";

const STATUS_COLORS = {
  draft:      { bg: '#F8FAFC', color: '#64748B' },
  processing: { bg: '#EBF4FB', color: '#1B4F8A' },
  approved:   { bg: '#E6F9F2', color: '#00875A' },
  paid:       { bg: '#E6F9F2', color: '#00875A' },
  cancelled:  { bg: '#FEF2F2', color: '#DC2626' },
};

const TABS = [
  { id: 'payroll-runs',  label: 'Payroll Runs' },
  { id: 'employees',     label: 'Employees' },
  { id: 'payroll-items', label: 'Payroll Items' },
  { id: 'timesheets',    label: 'Time Sheets' },
];

export default function Payroll() {
  const [activeTab, setActiveTab] = useState("payroll-runs");
  const [searchTerm, setSearchTerm] = useState("");
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [showPayrollItemForm, setShowPayrollItemForm] = useState(false);
  const [showPayrollRunForm, setShowPayrollRunForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editingPayrollItem, setEditingPayrollItem] = useState(null);
  const [editingPayrollRun, setEditingPayrollRun] = useState(null);

  const queryClient = useQueryClient();

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => Employee.list({ orderBy: 'hire_date', ascending: false })
  });

  const { data: payrollItems = [] } = useQuery({
    queryKey: ['payroll-items'],
    queryFn: () => PayrollItem.list()
  });

  const { data: payrollRuns = [] } = useQuery({
    queryKey: ['payroll-runs'],
    queryFn: () => PayrollRun.list({ orderBy: 'pay_date', ascending: false })
  });

  const totalGross = payrollRuns.reduce((s, r) => s + (r.total_gross || 0), 0);
  const totalNet = payrollRuns.reduce((s, r) => s + (r.total_net || 0), 0);
  const activeEmployees = employees.filter(e => e.is_active).length;
  const pendingRuns = payrollRuns.filter(r => r.status === 'draft' || r.status === 'processing').length;

  const tabBtnStyle = (id) => ({
    padding: '14px 18px',
    fontSize: 13.5,
    fontWeight: activeTab === id ? 700 : 500,
    color: activeTab === id ? '#1B4F8A' : '#64748B',
    borderBottom: activeTab === id ? '2.5px solid #1B4F8A' : '2.5px solid transparent',
    background: 'none',
    border: 'none',
    borderBottom: activeTab === id ? '2.5px solid #1B4F8A' : '2.5px solid transparent',
    cursor: 'pointer',
    fontFamily: 'inherit',
  });

  return (
    <PageShell>
      <PageHeader
        title="Payroll Management"
        subtitle="Manage employees, payroll items, and payroll runs"
        icon={Users}
        accentColor="#8B5CF6"
        actions={
          activeTab === 'payroll-runs' ? (
            <Dialog open={showPayrollRunForm} onOpenChange={setShowPayrollRunForm}>
              <DialogTrigger asChild>
                <NewBtn label="Run Payroll" icon={Plus} onClick={() => setShowPayrollRunForm(true)} />
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Run Payroll</DialogTitle>
                </DialogHeader>
                <PayrollRunForm
                  payrollRun={editingPayrollRun}
                  employees={employees}
                  payrollItems={payrollItems}
                  onClose={() => { setShowPayrollRunForm(false); setEditingPayrollRun(null); }}
                />
              </DialogContent>
            </Dialog>
          ) : activeTab === 'employees' ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <ActionBtn variant="outline" icon={Upload} label="Import Employees" />
              <Dialog open={showEmployeeForm} onOpenChange={setShowEmployeeForm}>
                <DialogTrigger asChild>
                  <NewBtn label="New Employee" icon={Plus} onClick={() => setShowEmployeeForm(true)} />
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingEmployee ? 'Edit Employee' : 'New Employee'}</DialogTitle>
                  </DialogHeader>
                  <EmployeeForm
                    employee={editingEmployee}
                    onClose={() => { setShowEmployeeForm(false); setEditingEmployee(null); }}
                  />
                </DialogContent>
              </Dialog>
            </div>
          ) : activeTab === 'payroll-items' ? (
            <Dialog open={showPayrollItemForm} onOpenChange={setShowPayrollItemForm}>
              <DialogTrigger asChild>
                <NewBtn label="New Payroll Item" icon={Plus} onClick={() => setShowPayrollItemForm(true)} />
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingPayrollItem ? 'Edit Payroll Item' : 'New Payroll Item'}</DialogTitle>
                </DialogHeader>
                <PayrollItemForm
                  payrollItem={editingPayrollItem}
                  onClose={() => { setShowPayrollItemForm(false); setEditingPayrollItem(null); }}
                />
              </DialogContent>
            </Dialog>
          ) : null
        }
      />

      <StatBar stats={[
        { label: 'Active Employees', value: activeEmployees, icon: Users, color: '#8B5CF6' },
        { label: 'Payroll Runs', value: payrollRuns.length, icon: Clock, color: '#1B4F8A' },
        { label: 'Total Gross Pay', value: `$${totalGross.toFixed(2)}`, icon: DollarSign, color: '#F59E0B' },
        { label: 'Total Net Pay', value: `$${totalNet.toFixed(2)}`, icon: CheckCircle, color: '#00A86B' },
        { label: 'Pending Runs', value: pendingRuns, icon: Clock, color: '#F59E0B' },
      ]} />

      {/* Search bar for tabs that need it */}
      {(activeTab === 'payroll-runs' || activeTab === 'employees' || activeTab === 'payroll-items') && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ position: 'relative', maxWidth: 400 }}>
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={`Search ${activeTab === 'payroll-runs' ? 'payroll runs' : activeTab === 'employees' ? 'employees' : 'payroll items'}...`}
              style={{
                width: '100%', padding: '9px 12px 9px 34px',
                border: '1.5px solid #E2E8F0', borderRadius: 9,
                fontSize: 13.5, color: '#0F172A', background: 'white',
                outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />
            <svg style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#94A3B8' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          </div>
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

          {/* Payroll Runs Tab */}
          {activeTab === 'payroll-runs' && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payroll #</TableHead>
                  <TableHead>Pay Period</TableHead>
                  <TableHead>Pay Date</TableHead>
                  <TableHead>Employees</TableHead>
                  <TableHead>Gross Pay</TableHead>
                  <TableHead>Net Pay</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrollRuns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} style={{ textAlign: 'center', padding: '40px 16px', color: '#94A3B8' }}>
                      No payroll runs yet. Click "Run Payroll" to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  payrollRuns
                    .filter(r =>
                      !searchTerm ||
                      r.payroll_number?.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((run) => (
                      <TableRow key={run.id}>
                        <TableCell style={{ fontWeight: 600 }}>{run.payroll_number}</TableCell>
                        <TableCell>{run.pay_period_start} to {run.pay_period_end}</TableCell>
                        <TableCell>{run.pay_date}</TableCell>
                        <TableCell>{run.employee_payments?.length || 0}</TableCell>
                        <TableCell style={{ fontWeight: 600 }}>${run.total_gross?.toFixed(2)}</TableCell>
                        <TableCell style={{ fontWeight: 600, color: '#00875A' }}>${run.total_net?.toFixed(2)}</TableCell>
                        <TableCell>
                          <StatusBadge status={run.status} />
                        </TableCell>
                        <TableCell>
                          <ActionBtn
                            icon={Pencil}
                            variant="ghost"
                            onClick={() => { setEditingPayrollRun(run); setShowPayrollRunForm(true); }}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          )}

          {/* Employees Tab */}
          {activeTab === 'employees' && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Basic Salary</TableHead>
                  <TableHead>Hire Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees
                  .filter(emp =>
                    emp.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    emp.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    emp.employee_code?.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell style={{ fontWeight: 600 }}>{employee.employee_code}</TableCell>
                      <TableCell>{employee.first_name} {employee.last_name}</TableCell>
                      <TableCell>{employee.department}</TableCell>
                      <TableCell>{employee.job_title}</TableCell>
                      <TableCell style={{ fontWeight: 600 }}>${employee.basic_salary?.toFixed(2)}</TableCell>
                      <TableCell>{employee.hire_date}</TableCell>
                      <TableCell>
                        <StatusBadge status={employee.is_active ? 'active' : 'inactive'} />
                      </TableCell>
                      <TableCell>
                        <ActionBtn
                          icon={Pencil}
                          variant="ghost"
                          onClick={() => { setEditingEmployee(employee); setShowEmployeeForm(true); }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}

          {/* Payroll Items Tab */}
          {activeTab === 'payroll-items' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {['salary', 'allowance', 'deduction', 'tax'].map(type => {
                const items = payrollItems.filter(item => item.item_type === type &&
                  (!searchTerm || item.item_name?.toLowerCase().includes(searchTerm.toLowerCase()))
                );
                return (
                  <div key={type} style={{ border: '1px solid #F1F5F9', borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{ padding: '12px 16px', background: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', textTransform: 'capitalize' }}>{type}s</p>
                    </div>
                    <div style={{ padding: 12 }}>
                      {items.length === 0 ? (
                        <p style={{ fontSize: 13, color: '#94A3B8', padding: '8px 0' }}>No {type}s defined</p>
                      ) : (
                        items.map(item => (
                          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#F8FAFC', borderRadius: 7, marginBottom: 6 }}>
                            <div>
                              <p style={{ fontWeight: 600, fontSize: 13, color: '#0F172A' }}>{item.item_name}</p>
                              <p style={{ fontSize: 11.5, color: '#94A3B8' }}>{item.calculation_method}</p>
                            </div>
                            <ActionBtn
                              icon={Pencil}
                              variant="ghost"
                              onClick={() => { setEditingPayrollItem(item); setShowPayrollItemForm(true); }}
                            />
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Time Sheets Tab */}
          {activeTab === 'timesheets' && (
            <div style={{ textAlign: 'center', padding: '60px 16px' }}>
              <Calendar style={{ width: 56, height: 56, color: '#CBD5E1', margin: '0 auto 16px', display: 'block' }} />
              <p style={{ fontSize: 15, fontWeight: 600, color: '#94A3B8', marginBottom: 8 }}>Time Sheet Management</p>
              <p style={{ fontSize: 13, color: '#CBD5E1' }}>Time sheet tracking coming soon. Track employee hours, overtime, and attendance.</p>
            </div>
          )}

        </div>
      </div>
    </PageShell>
  );
}

// Employee Form Component
function EmployeeForm({ employee, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    employee_code: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    hire_date: format(new Date(), 'yyyy-MM-dd'),
    department: '',
    job_title: '',
    employment_type: 'full_time',
    pay_frequency: 'monthly',
    basic_salary: 0,
    currency: 'USD',
    tax_id: '',
    is_active: true,
    ...employee
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (employee?.id) return Employee.update(employee.id, data);
      return Employee.create(data);
    },
    onSuccess: () => { queryClient.invalidateQueries(['employees']); onClose(); }
  });

  const handleSave = () => saveMutation.mutate(formData);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Employee Code *</Label>
          <Input value={formData.employee_code} onChange={(e) => setFormData(prev => ({ ...prev, employee_code: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>Email *</Label>
          <Input type="email" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>First Name *</Label>
          <Input value={formData.first_name} onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>Last Name *</Label>
          <Input value={formData.last_name} onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>Phone</Label>
          <Input value={formData.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>Date of Birth</Label>
          <Input type="date" value={formData.date_of_birth} onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>Hire Date *</Label>
          <Input type="date" value={formData.hire_date} onChange={(e) => setFormData(prev => ({ ...prev, hire_date: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>Department</Label>
          <Input value={formData.department} onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>Job Title</Label>
          <Input value={formData.job_title} onChange={(e) => setFormData(prev => ({ ...prev, job_title: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>Employment Type</Label>
          <Select value={formData.employment_type} onValueChange={(value) => setFormData(prev => ({ ...prev, employment_type: value }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="full_time">Full Time</SelectItem>
              <SelectItem value="part_time">Part Time</SelectItem>
              <SelectItem value="contract">Contract</SelectItem>
              <SelectItem value="temporary">Temporary</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Pay Frequency</Label>
          <Select value={formData.pay_frequency} onValueChange={(value) => setFormData(prev => ({ ...prev, pay_frequency: value }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="bi_weekly">Bi-Weekly</SelectItem>
              <SelectItem value="semi_monthly">Semi-Monthly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Basic Salary</Label>
          <Input type="number" step="0.01" value={formData.basic_salary} onChange={(e) => setFormData(prev => ({ ...prev, basic_salary: parseFloat(e.target.value) }))} />
        </div>
        <div className="space-y-2">
          <Label>Tax ID / SSN</Label>
          <Input value={formData.tax_id} onChange={(e) => setFormData(prev => ({ ...prev, tax_id: e.target.value }))} />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <button
          onClick={handleSave}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 9, background: '#1B4F8A', color: 'white', border: 'none', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          <Save style={{ width: 14, height: 14 }} />
          Save Employee
        </button>
      </div>
    </div>
  );
}

// Payroll Item Form Component
function PayrollItemForm({ payrollItem, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    item_code: '',
    item_name: '',
    item_type: 'allowance',
    calculation_method: 'fixed_amount',
    default_amount: 0,
    is_taxable: false,
    description: '',
    is_active: true,
    ...payrollItem
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (payrollItem?.id) return PayrollItem.update(payrollItem.id, data);
      return PayrollItem.create(data);
    },
    onSuccess: () => { queryClient.invalidateQueries(['payroll-items']); onClose(); }
  });

  const handleSave = () => saveMutation.mutate(formData);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Item Code *</Label>
          <Input value={formData.item_code} onChange={(e) => setFormData(prev => ({ ...prev, item_code: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>Item Name *</Label>
          <Input value={formData.item_name} onChange={(e) => setFormData(prev => ({ ...prev, item_name: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>Item Type *</Label>
          <Select value={formData.item_type} onValueChange={(value) => setFormData(prev => ({ ...prev, item_type: value }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="salary">Salary</SelectItem>
              <SelectItem value="allowance">Allowance</SelectItem>
              <SelectItem value="deduction">Deduction</SelectItem>
              <SelectItem value="tax">Tax</SelectItem>
              <SelectItem value="benefit">Benefit</SelectItem>
              <SelectItem value="reimbursement">Reimbursement</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Calculation Method</Label>
          <Select value={formData.calculation_method} onValueChange={(value) => setFormData(prev => ({ ...prev, calculation_method: value }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
              <SelectItem value="percentage_of_salary">Percentage of Salary</SelectItem>
              <SelectItem value="hours_worked">Hours Worked</SelectItem>
              <SelectItem value="units">Units</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Default Amount</Label>
          <Input type="number" step="0.01" value={formData.default_amount} onChange={(e) => setFormData(prev => ({ ...prev, default_amount: parseFloat(e.target.value) }))} />
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <input type="checkbox" checked={formData.is_taxable} onChange={(e) => setFormData(prev => ({ ...prev, is_taxable: e.target.checked }))} />
            Is Taxable
          </Label>
        </div>
        <div className="space-y-2 col-span-2">
          <Label>Description</Label>
          <Textarea value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} rows={3} />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <button
          onClick={handleSave}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 9, background: '#1B4F8A', color: 'white', border: 'none', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          <Save style={{ width: 14, height: 14 }} />
          Save Item
        </button>
      </div>
    </div>
  );
}

// Payroll Run Form Component
function PayrollRunForm({ payrollRun, employees, payrollItems, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    payroll_number: `PAY-${Date.now()}`,
    pay_period_start: format(new Date(), 'yyyy-MM-dd'),
    pay_period_end: format(addDays(new Date(), 14), 'yyyy-MM-dd'),
    pay_date: format(addDays(new Date(), 15), 'yyyy-MM-dd'),
    status: 'draft',
    employee_payments: [],
    total_gross: 0,
    total_deductions: 0,
    total_taxes: 0,
    total_net: 0,
    notes: '',
    ...payrollRun
  });

  const [selectedEmployees, setSelectedEmployees] = useState(
    payrollRun?.employee_payments?.map(ep => ep.employee_id) || []
  );

  const calculatePayrollTotals = (employeePayments) => {
    return employeePayments.reduce((acc, ep) => ({
      total_gross: acc.total_gross + (ep.gross_pay || 0),
      total_deductions: acc.total_deductions + (ep.total_deductions || 0),
      total_taxes: acc.total_taxes + (ep.total_taxes || 0),
      total_net: acc.total_net + (ep.net_pay || 0)
    }), { total_gross: 0, total_deductions: 0, total_taxes: 0, total_net: 0 });
  };

  const handleAddEmployee = (employeeId) => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return;

    const grossPay = employee.basic_salary || 0;
    const taxes = grossPay * 0.15;
    const deductions = 0;
    const netPay = grossPay - taxes - deductions;

    const newPayment = {
      employee_id: employee.id,
      employee_name: `${employee.first_name} ${employee.last_name}`,
      gross_pay: grossPay,
      total_deductions: deductions,
      total_taxes: taxes,
      net_pay: netPay,
      line_items: [
        { payroll_item_id: 'salary', item_name: 'Basic Salary', item_type: 'salary', amount: grossPay },
        { payroll_item_id: 'tax', item_name: 'Income Tax', item_type: 'tax', amount: taxes }
      ]
    };

    const updatedPayments = [...formData.employee_payments, newPayment];
    const totals = calculatePayrollTotals(updatedPayments);
    setFormData(prev => ({ ...prev, employee_payments: updatedPayments, ...totals }));
    setSelectedEmployees([...selectedEmployees, employeeId]);
  };

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (payrollRun?.id) return PayrollRun.update(payrollRun.id, data);
      return PayrollRun.create(data);
    },
    onSuccess: () => { queryClient.invalidateQueries(['payroll-runs']); onClose(); }
  });

  const handleSave = () => saveMutation.mutate(formData);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Payroll Number</Label>
          <Input value={formData.payroll_number} readOnly className="bg-gray-50" />
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Pay Period Start</Label>
          <Input type="date" value={formData.pay_period_start} onChange={(e) => setFormData(prev => ({ ...prev, pay_period_start: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>Pay Period End</Label>
          <Input type="date" value={formData.pay_period_end} onChange={(e) => setFormData(prev => ({ ...prev, pay_period_end: e.target.value }))} />
        </div>
        <div className="space-y-2 col-span-2">
          <Label>Pay Date</Label>
          <Input type="date" value={formData.pay_date} onChange={(e) => setFormData(prev => ({ ...prev, pay_date: e.target.value }))} />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <Label>Select Employees</Label>
          <Select onValueChange={handleAddEmployee}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Add employee..." />
            </SelectTrigger>
            <SelectContent>
              {employees
                .filter(e => e.is_active && !selectedEmployees.includes(e.id))
                .map(emp => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name} - ${emp.basic_salary}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Gross Pay</TableHead>
              <TableHead>Deductions</TableHead>
              <TableHead>Taxes</TableHead>
              <TableHead>Net Pay</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {formData.employee_payments.map((payment, idx) => (
              <TableRow key={idx}>
                <TableCell style={{ fontWeight: 600 }}>{payment.employee_name}</TableCell>
                <TableCell>${payment.gross_pay?.toFixed(2)}</TableCell>
                <TableCell>${payment.total_deductions?.toFixed(2)}</TableCell>
                <TableCell>${payment.total_taxes?.toFixed(2)}</TableCell>
                <TableCell style={{ fontWeight: 600, color: '#00875A' }}>${payment.net_pay?.toFixed(2)}</TableCell>
              </TableRow>
            ))}
            <TableRow style={{ background: '#F8FAFC', fontWeight: 700 }}>
              <TableCell style={{ fontWeight: 700 }}>TOTAL</TableCell>
              <TableCell style={{ fontWeight: 700 }}>${formData.total_gross?.toFixed(2)}</TableCell>
              <TableCell style={{ fontWeight: 700 }}>${formData.total_deductions?.toFixed(2)}</TableCell>
              <TableCell style={{ fontWeight: 700 }}>${formData.total_taxes?.toFixed(2)}</TableCell>
              <TableCell style={{ fontWeight: 700, color: '#00875A' }}>${formData.total_net?.toFixed(2)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <button
          onClick={handleSave}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 9, background: '#1B4F8A', color: 'white', border: 'none', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          <Save style={{ width: 14, height: 14 }} />
          Save Payroll Run
        </button>
      </div>
    </div>
  );
}

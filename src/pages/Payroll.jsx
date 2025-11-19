import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Search, Pencil, Upload, X, Save, Calendar } from "lucide-react";
import { format, addDays } from "date-fns";

const statusColors = {
  draft: "bg-gray-100 text-gray-800",
  processing: "bg-blue-100 text-blue-800",
  approved: "bg-green-100 text-green-800",
  paid: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800"
};

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
    queryFn: () => base44.entities.Employee.list('-hire_date')
  });

  const { data: payrollItems = [] } = useQuery({
    queryKey: ['payroll-items'],
    queryFn: () => base44.entities.PayrollItem.list()
  });

  const { data: payrollRuns = [] } = useQuery({
    queryKey: ['payroll-runs'],
    queryFn: () => base44.entities.PayrollRun.list('-pay_date')
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payroll Management</h1>
          <p className="text-gray-500 mt-1">Manage employees, payroll items, and payroll runs</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="payroll-runs">Payroll Runs</TabsTrigger>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="payroll-items">Payroll Items</TabsTrigger>
          <TabsTrigger value="timesheets">Time Sheets</TabsTrigger>
        </TabsList>

        {/* Payroll Runs Tab */}
        <TabsContent value="payroll-runs" className="space-y-4">
          <div className="flex justify-between items-center">
            <Input
              placeholder="Search payroll runs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Dialog open={showPayrollRunForm} onOpenChange={setShowPayrollRunForm}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Run Payroll
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Run Payroll</DialogTitle>
                </DialogHeader>
                <PayrollRunForm
                  payrollRun={editingPayrollRun}
                  employees={employees}
                  payrollItems={payrollItems}
                  onClose={() => {
                    setShowPayrollRunForm(false);
                    setEditingPayrollRun(null);
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="pt-6">
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
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        No payroll runs yet. Click "Run Payroll" to create one.
                      </TableCell>
                    </TableRow>
                  ) : (
                    payrollRuns.map((run) => (
                      <TableRow key={run.id}>
                        <TableCell className="font-medium">{run.payroll_number}</TableCell>
                        <TableCell>{run.pay_period_start} to {run.pay_period_end}</TableCell>
                        <TableCell>{run.pay_date}</TableCell>
                        <TableCell>{run.employee_payments?.length || 0}</TableCell>
                        <TableCell className="font-semibold">${run.total_gross?.toFixed(2)}</TableCell>
                        <TableCell className="font-semibold text-green-600">${run.total_net?.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge className={statusColors[run.status]}>{run.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingPayrollRun(run);
                              setShowPayrollRunForm(true);
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Employees Tab */}
        <TabsContent value="employees" className="space-y-4">
          <div className="flex justify-between items-center">
            <Input
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <div className="flex gap-2">
              <Button variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Import Employees
              </Button>
              <Dialog open={showEmployeeForm} onOpenChange={setShowEmployeeForm}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    New Employee
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingEmployee ? 'Edit Employee' : 'New Employee'}</DialogTitle>
                  </DialogHeader>
                  <EmployeeForm
                    employee={editingEmployee}
                    onClose={() => {
                      setShowEmployeeForm(false);
                      setEditingEmployee(null);
                    }}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Card>
            <CardContent className="pt-6">
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
                        <TableCell className="font-medium">{employee.employee_code}</TableCell>
                        <TableCell>{employee.first_name} {employee.last_name}</TableCell>
                        <TableCell>{employee.department}</TableCell>
                        <TableCell>{employee.job_title}</TableCell>
                        <TableCell className="font-semibold">${employee.basic_salary?.toFixed(2)}</TableCell>
                        <TableCell>{employee.hire_date}</TableCell>
                        <TableCell>
                          <Badge className={employee.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                            {employee.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingEmployee(employee);
                              setShowEmployeeForm(true);
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payroll Items Tab */}
        <TabsContent value="payroll-items" className="space-y-4">
          <div className="flex justify-between items-center">
            <Input
              placeholder="Search payroll items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Dialog open={showPayrollItemForm} onOpenChange={setShowPayrollItemForm}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  New Payroll Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingPayrollItem ? 'Edit Payroll Item' : 'New Payroll Item'}</DialogTitle>
                </DialogHeader>
                <PayrollItemForm
                  payrollItem={editingPayrollItem}
                  onClose={() => {
                    setShowPayrollItemForm(false);
                    setEditingPayrollItem(null);
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {['salary', 'allowance', 'deduction', 'tax'].map(type => {
              const items = payrollItems.filter(item => item.item_type === type);
              return (
                <Card key={type}>
                  <CardHeader>
                    <CardTitle className="text-lg capitalize">{type}s</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {items.length === 0 ? (
                        <p className="text-sm text-gray-500">No {type}s defined</p>
                      ) : (
                        items.map(item => (
                          <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <div>
                              <p className="font-medium text-sm">{item.item_name}</p>
                              <p className="text-xs text-gray-500">{item.calculation_method}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingPayrollItem(item);
                                setShowPayrollItemForm(true);
                              }}
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Time Sheets Tab */}
        <TabsContent value="timesheets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Time Sheet Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 mb-4">Time sheet tracking coming soon</p>
                <p className="text-sm text-gray-400">Track employee hours, overtime, and attendance</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
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
      if (employee?.id) {
        return base44.entities.Employee.update(employee.id, data);
      }
      return base44.entities.Employee.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['employees']);
      onClose();
    }
  });

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Employee Code *</Label>
          <Input
            value={formData.employee_code}
            onChange={(e) => setFormData(prev => ({ ...prev, employee_code: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Email *</Label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>First Name *</Label>
          <Input
            value={formData.first_name}
            onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Last Name *</Label>
          <Input
            value={formData.last_name}
            onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Phone</Label>
          <Input
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Date of Birth</Label>
          <Input
            type="date"
            value={formData.date_of_birth}
            onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Hire Date *</Label>
          <Input
            type="date"
            value={formData.hire_date}
            onChange={(e) => setFormData(prev => ({ ...prev, hire_date: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Department</Label>
          <Input
            value={formData.department}
            onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Job Title</Label>
          <Input
            value={formData.job_title}
            onChange={(e) => setFormData(prev => ({ ...prev, job_title: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Employment Type</Label>
          <Select
            value={formData.employment_type}
            onValueChange={(value) => setFormData(prev => ({ ...prev, employment_type: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
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
          <Select
            value={formData.pay_frequency}
            onValueChange={(value) => setFormData(prev => ({ ...prev, pay_frequency: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
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
          <Input
            type="number"
            step="0.01"
            value={formData.basic_salary}
            onChange={(e) => setFormData(prev => ({ ...prev, basic_salary: parseFloat(e.target.value) }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Tax ID / SSN</Label>
          <Input
            value={formData.tax_id}
            onChange={(e) => setFormData(prev => ({ ...prev, tax_id: e.target.value }))}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
          <Save className="w-4 h-4 mr-2" />
          Save Employee
        </Button>
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
      if (payrollItem?.id) {
        return base44.entities.PayrollItem.update(payrollItem.id, data);
      }
      return base44.entities.PayrollItem.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['payroll-items']);
      onClose();
    }
  });

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Item Code *</Label>
          <Input
            value={formData.item_code}
            onChange={(e) => setFormData(prev => ({ ...prev, item_code: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Item Name *</Label>
          <Input
            value={formData.item_name}
            onChange={(e) => setFormData(prev => ({ ...prev, item_name: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Item Type *</Label>
          <Select
            value={formData.item_type}
            onValueChange={(value) => setFormData(prev => ({ ...prev, item_type: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
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
          <Select
            value={formData.calculation_method}
            onValueChange={(value) => setFormData(prev => ({ ...prev, calculation_method: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
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
          <Input
            type="number"
            step="0.01"
            value={formData.default_amount}
            onChange={(e) => setFormData(prev => ({ ...prev, default_amount: parseFloat(e.target.value) }))}
          />
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.is_taxable}
              onChange={(e) => setFormData(prev => ({ ...prev, is_taxable: e.target.checked }))}
            />
            Is Taxable
          </Label>
        </div>
        <div className="space-y-2 col-span-2">
          <Label>Description</Label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
          <Save className="w-4 h-4 mr-2" />
          Save Item
        </Button>
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
    const totals = employeePayments.reduce((acc, ep) => ({
      total_gross: acc.total_gross + (ep.gross_pay || 0),
      total_deductions: acc.total_deductions + (ep.total_deductions || 0),
      total_taxes: acc.total_taxes + (ep.total_taxes || 0),
      total_net: acc.total_net + (ep.net_pay || 0)
    }), { total_gross: 0, total_deductions: 0, total_taxes: 0, total_net: 0 });

    return totals;
  };

  const handleAddEmployee = (employeeId) => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return;

    const grossPay = employee.basic_salary || 0;
    const taxes = grossPay * 0.15; // Simple 15% tax
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
        {
          payroll_item_id: 'salary',
          item_name: 'Basic Salary',
          item_type: 'salary',
          amount: grossPay
        },
        {
          payroll_item_id: 'tax',
          item_name: 'Income Tax',
          item_type: 'tax',
          amount: taxes
        }
      ]
    };

    const updatedPayments = [...formData.employee_payments, newPayment];
    const totals = calculatePayrollTotals(updatedPayments);

    setFormData(prev => ({
      ...prev,
      employee_payments: updatedPayments,
      ...totals
    }));

    setSelectedEmployees([...selectedEmployees, employeeId]);
  };

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (payrollRun?.id) {
        return base44.entities.PayrollRun.update(payrollRun.id, data);
      }
      return base44.entities.PayrollRun.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['payroll-runs']);
      onClose();
    }
  });

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Payroll Number</Label>
          <Input value={formData.payroll_number} readOnly className="bg-gray-50" />
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
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Pay Period Start</Label>
          <Input
            type="date"
            value={formData.pay_period_start}
            onChange={(e) => setFormData(prev => ({ ...prev, pay_period_start: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Pay Period End</Label>
          <Input
            type="date"
            value={formData.pay_period_end}
            onChange={(e) => setFormData(prev => ({ ...prev, pay_period_end: e.target.value }))}
          />
        </div>
        <div className="space-y-2 col-span-2">
          <Label>Pay Date</Label>
          <Input
            type="date"
            value={formData.pay_date}
            onChange={(e) => setFormData(prev => ({ ...prev, pay_date: e.target.value }))}
          />
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

        <Card>
          <CardContent className="pt-6">
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
                    <TableCell className="font-medium">{payment.employee_name}</TableCell>
                    <TableCell>${payment.gross_pay?.toFixed(2)}</TableCell>
                    <TableCell>${payment.total_deductions?.toFixed(2)}</TableCell>
                    <TableCell>${payment.total_taxes?.toFixed(2)}</TableCell>
                    <TableCell className="font-semibold text-green-600">
                      ${payment.net_pay?.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-gray-50 font-bold">
                  <TableCell>TOTAL</TableCell>
                  <TableCell>${formData.total_gross?.toFixed(2)}</TableCell>
                  <TableCell>${formData.total_deductions?.toFixed(2)}</TableCell>
                  <TableCell>${formData.total_taxes?.toFixed(2)}</TableCell>
                  <TableCell className="text-green-600">${formData.total_net?.toFixed(2)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
          <Save className="w-4 h-4 mr-2" />
          Save Payroll Run
        </Button>
      </div>
    </div>
  );
}
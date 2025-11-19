import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useCompany } from "../components/auth/CompanyContext";
import {
  Users,
  DollarSign,
  Calendar,
  Plus,
  Upload,
  FileText,
  Settings as SettingsIcon
} from "lucide-react";

export default function PayrollDashboard() {
  const { currentCompany } = useCompany();

  const { data: employees = [] } = useQuery({
    queryKey: ['employees', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.Employee.filter({ company_id: currentCompany.id }) : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const { data: payrollRuns = [] } = useQuery({
    queryKey: ['payroll-runs', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.PayrollRun.filter({ company_id: currentCompany.id }, '-pay_date') : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const activeEmployees = employees.filter(e => e.is_active).length;
  const totalPayroll = payrollRuns
    .filter(pr => pr.status === 'paid')
    .reduce((sum, pr) => sum + (parseFloat(pr.total_net) || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Payroll Management</h1>
        <p className="text-gray-500 mt-1">Manage employee payroll and compensation for {currentCompany?.company_name}</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-2 border-emerald-100">
          <CardHeader>
            <CardTitle className="text-lg">Transactions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
              <Link to={createPageUrl("Payroll")}>
                <Plus className="w-4 h-4 mr-2" />
                Run Payroll
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={createPageUrl("Payroll")}>
                <Calendar className="w-4 h-4 mr-2" />
                Payroll Schedule
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={createPageUrl("Payroll")}>
                <FileText className="w-4 h-4 mr-2" />
                Time Sheets
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={createPageUrl("Reports")}>
                Payroll Reports
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 border-cyan-100">
          <CardHeader>
            <CardTitle className="text-lg">Master Data</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Button asChild className="bg-cyan-600 hover:bg-cyan-700">
              <Link to={createPageUrl("Payroll")}>
                <Plus className="w-4 h-4 mr-2" />
                New Employee
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={createPageUrl("Payroll")}>
                <Upload className="w-4 h-4 mr-2" />
                Import Employees
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={createPageUrl("Payroll")}>
                <SettingsIcon className="w-4 h-4 mr-2" />
                Payroll Items
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={createPageUrl("Payroll")}>
                View All Employees
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-emerald-900">Total Employees</CardTitle>
            <Users className="w-8 h-8 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-900">{activeEmployees}</div>
            <p className="text-xs text-emerald-700 mt-2">Active employees</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">Total Payroll YTD</CardTitle>
            <DollarSign className="w-8 h-8 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">${totalPayroll.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
            <p className="text-xs text-blue-700 mt-2">Year to date</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-purple-900">Payroll Runs</CardTitle>
            <Calendar className="w-8 h-8 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900">{payrollRuns.length}</div>
            <p className="text-xs text-purple-700 mt-2">This year</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-orange-900">Avg Salary</CardTitle>
            <DollarSign className="w-8 h-8 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-900">
              ${activeEmployees > 0 ? Math.round(employees.reduce((sum, e) => sum + (parseFloat(e.basic_salary) || 0), 0) / activeEmployees).toLocaleString() : 0}
            </div>
            <p className="text-xs text-orange-700 mt-2">Per employee</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Payroll Runs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Payroll Runs</CardTitle>
          <Button asChild variant="outline" size="sm">
            <Link to={createPageUrl("Payroll")}>View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {payrollRuns.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p>No payroll runs yet</p>
              <Button asChild variant="outline" size="sm" className="mt-3">
                <Link to={createPageUrl("Payroll")}>Run First Payroll</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {payrollRuns.slice(0, 5).map(run => (
                <div key={run.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold">{run.payroll_number}</p>
                    <p className="text-sm text-gray-600">Pay Period: {run.pay_period_start} to {run.pay_period_end}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${(run.total_net || 0).toFixed(2)}</p>
                    <p className="text-xs text-gray-600">{run.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useCompany } from "../components/auth/CompanyContext";
import {
  Briefcase,
  Plus,
  Upload,
  Clock,
  DollarSign,
  TrendingUp,
  FileText
} from "lucide-react";

// CRITICAL FIX: Correct currency symbol function
const getCurrencySymbol = (currencyCode) => {
  const symbols = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'NGN': '₦',
    'ZAR': 'R',
    'KES': 'KSh',
    'GHS': '₵',
    'CAD': 'C$',
    'AUD': 'A$',
    'INR': '₹',
    'JPY': '¥',
    'CNY': '¥'
  };
  return symbols[currencyCode] || currencyCode;
};

export default function JobCostingDashboard() {
  const { currentCompany } = useCompany();

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.Job.filter({ company_id: currentCompany.id }) : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const { data: jobCosts = [] } = useQuery({
    queryKey: ['job-costs', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.JobCost.filter({ company_id: currentCompany.id }) : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const activeJobs = jobs.filter(j => j.status === 'in_progress').length;
  const completedJobs = jobs.filter(j => j.status === 'completed').length;

  const totalContractValue = jobs
    .filter(j => j.status !== 'cancelled')
    .reduce((sum, j) => sum + (parseFloat(j.contract_amount) || 0), 0);

  const totalCosts = jobs
    .reduce((sum, j) => sum + (parseFloat(j.actual_cost) || 0), 0);

  const totalProfit = totalContractValue - totalCosts;

  const baseCurrency = currentCompany?.base_currency || 'USD';
  const currencySymbol = getCurrencySymbol(baseCurrency);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Job Costing</h1>
        <p className="text-gray-500 mt-1">Track project costs and profitability for {currentCompany?.company_name}</p>
        <p className="text-sm text-blue-600 font-semibold mt-1">
          📊 All amounts shown in {baseCurrency} ({currencySymbol})
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-2 border-purple-100">
          <CardHeader>
            <CardTitle className="text-lg">Transactions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Button asChild className="bg-purple-600 hover:bg-purple-700">
              <Link to={createPageUrl("JobCosting")}>
                <Plus className="w-4 h-4 mr-2" />
                Record Job Cost
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={createPageUrl("JobCosting")}>
                <Clock className="w-4 h-4 mr-2" />
                Time Sheet
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={createPageUrl("JobCosting")}>
                <FileText className="w-4 h-4 mr-2" />
                Job Invoice
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={createPageUrl("JobCosting")}>
                <TrendingUp className="w-4 h-4 mr-2" />
                Job Report
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 border-indigo-100">
          <CardHeader>
            <CardTitle className="text-lg">Master Data</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
              <Link to={createPageUrl("JobCosting")}>
                <Plus className="w-4 h-4 mr-2" />
                New Job
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={createPageUrl("JobCosting")}>
                <Upload className="w-4 h-4 mr-2" />
                Import Jobs
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={createPageUrl("JobCosting")}>
                Cost Codes
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={createPageUrl("JobCosting")}>
                Phases
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-purple-900">Active Jobs</CardTitle>
            <Briefcase className="w-8 h-8 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900">{activeJobs}</div>
            <p className="text-xs text-purple-700 mt-2">{completedJobs} completed</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-900">Contract Value</CardTitle>
            <DollarSign className="w-8 h-8 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">{currencySymbol}{totalContractValue.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
            <p className="text-xs text-green-700 mt-2">Total contracts</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-red-900">Total Costs</CardTitle>
            <TrendingUp className="w-8 h-8 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-900">{currencySymbol}{totalCosts.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
            <p className="text-xs text-red-700 mt-2">Incurred to date</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">Total Profit</CardTitle>
            <TrendingUp className="w-8 h-8 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${totalProfit >= 0 ? 'text-blue-900' : 'text-red-900'}`}>
              {currencySymbol}{totalProfit.toLocaleString(undefined, {minimumFractionDigits: 2})}
            </div>
            <p className="text-xs text-blue-700 mt-2">
              Margin: {totalContractValue ? ((totalProfit / totalContractValue) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Jobs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Active Jobs</CardTitle>
          <Button asChild variant="outline" size="sm">
            <Link to={createPageUrl("JobCosting")}>View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Briefcase className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p>No jobs yet</p>
              <Button asChild variant="outline" size="sm" className="mt-3">
                <Link to={createPageUrl("JobCosting")}>Create First Job</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.filter(j => j.status === 'in_progress').slice(0, 5).map(job => {
                const profit = (parseFloat(job.contract_amount) || 0) - (parseFloat(job.actual_cost) || 0);
                return (
                  <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-semibold">{job.job_number}</p>
                      <p className="text-sm text-gray-600">{job.job_name}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {currencySymbol}{profit.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-600">{job.percent_complete || 0}% complete</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

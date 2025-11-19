import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useCompany } from "../components/auth/CompanyContext";
import {
  Heart,
  Users,
  Target,
  DollarSign,
  Plus,
  Receipt,
  CreditCard,
  FileText,
  TrendingUp,
  Briefcase
} from "lucide-react";

export default function NonProfitDashboard() {
  const { currentCompany } = useCompany();

  const { data: donations = [] } = useQuery({
    queryKey: ['donations', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.Donation.filter({ company_id: currentCompany.id }) : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const { data: donors = [] } = useQuery({
    queryKey: ['donors', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.Donor.filter({ company_id: currentCompany.id }) : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const { data: programs = [] } = useQuery({
    queryKey: ['programs', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.Program.filter({ company_id: currentCompany.id }) : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const { data: grants = [] } = useQuery({
    queryKey: ['grants', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.Grant.filter({ company_id: currentCompany.id }) : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const totalDonations = donations
    .filter(d => d.status === 'received')
    .reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);

  const totalGrants = grants
    .filter(g => g.status === 'active')
    .reduce((sum, g) => sum + (parseFloat(g.grant_amount) || 0), 0);

  const activePrograms = programs.filter(p => p.status === 'active').length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Non-Profit Management</h1>
        <p className="text-gray-500 mt-1">Manage donations, grants, and programs for {currentCompany?.company_name}</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-2 border-pink-100">
          <CardHeader>
            <CardTitle className="text-lg">Transactions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Button asChild className="bg-pink-600 hover:bg-pink-700">
              <Link to={createPageUrl("NonProfit")}>
                <Receipt className="w-4 h-4 mr-2" />
                Enter Donation
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={createPageUrl("NonProfit")}>
                <FileText className="w-4 h-4 mr-2" />
                Enter Pledge
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={createPageUrl("NonProfit")}>
                <CreditCard className="w-4 h-4 mr-2" />
                Receive Payment
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={createPageUrl("NonProfit")}>
                <TrendingUp className="w-4 h-4 mr-2" />
                Budget Setup
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 border-rose-100">
          <CardHeader>
            <CardTitle className="text-lg">Master Data</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Button asChild className="bg-rose-600 hover:bg-rose-700">
              <Link to={createPageUrl("NonProfit")}>
                <Plus className="w-4 h-4 mr-2" />
                New Donor
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={createPageUrl("NonProfit")}>
                <Briefcase className="w-4 h-4 mr-2" />
                New Program
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={createPageUrl("NonProfit")}>
                <Plus className="w-4 h-4 mr-2" />
                New Grant
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={createPageUrl("Reports")}>
                NP Reports
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-pink-50 to-pink-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-pink-900">Total Donations</CardTitle>
            <Heart className="w-8 h-8 text-pink-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-pink-900">${totalDonations.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
            <p className="text-xs text-pink-700 mt-2">Year to date</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-purple-900">Total Grants</CardTitle>
            <DollarSign className="w-8 h-8 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900">${totalGrants.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
            <p className="text-xs text-purple-700 mt-2">Active grants</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">Total Donors</CardTitle>
            <Users className="w-8 h-8 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">{donors.length}</div>
            <p className="text-xs text-blue-700 mt-2">Active donors</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-900">Active Programs</CardTitle>
            <Target className="w-8 h-8 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">{activePrograms}</div>
            <p className="text-xs text-green-700 mt-2">Total: {programs.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Donations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Donations</CardTitle>
          <Button asChild variant="outline" size="sm">
            <Link to={createPageUrl("NonProfit")}>View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {donations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Heart className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p>No donations yet</p>
              <Button asChild variant="outline" size="sm" className="mt-3">
                <Link to={createPageUrl("NonProfit")}>Record First Donation</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {donations.slice(0, 5).map(donation => (
                <div key={donation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold">{donation.donor_name}</p>
                    <p className="text-sm text-gray-600">{donation.program_name || 'General'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${(donation.amount || 0).toFixed(2)}</p>
                    <p className="text-xs text-gray-600">{donation.donation_date}</p>
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
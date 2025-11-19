import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useCompany } from "../components/auth/CompanyContext";
import {
  Factory,
  FileText,
  Plus,
  Upload,
  Play,
  Package,
  TrendingUp
} from "lucide-react";

export default function ManufacturingDashboard() {
  const { currentCompany } = useCompany();

  const { data: workOrders = [] } = useQuery({
    queryKey: ['work-orders', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.WorkOrder.filter({ company_id: currentCompany.id }) : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const { data: boms = [] } = useQuery({
    queryKey: ['boms', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.BillOfMaterials.filter({ company_id: currentCompany.id }) : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const activeWOs = workOrders.filter(wo => 
    ['released', 'in_progress'].includes(wo.status)
  ).length;

  const completedWOs = workOrders.filter(wo => wo.status === 'completed').length;

  const totalProduction = workOrders
    .filter(wo => wo.status === 'completed')
    .reduce((sum, wo) => sum + (wo.quantity_produced || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Manufacturing</h1>
        <p className="text-gray-500 mt-1">Manage production and bill of materials for {currentCompany?.company_name}</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-2 border-blue-100">
          <CardHeader>
            <CardTitle className="text-lg">Transactions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <Link to={createPageUrl("Manufacturing")}>
                <Plus className="w-4 h-4 mr-2" />
                New Work Order
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={createPageUrl("Manufacturing")}>
                <Play className="w-4 h-4 mr-2" />
                Start Production
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={createPageUrl("Manufacturing")}>
                <Package className="w-4 h-4 mr-2" />
                Material Issue
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={createPageUrl("Manufacturing")}>
                <TrendingUp className="w-4 h-4 mr-2" />
                Production Report
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-100">
          <CardHeader>
            <CardTitle className="text-lg">Master Data</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Button asChild className="bg-green-600 hover:bg-green-700">
              <Link to={createPageUrl("Manufacturing")}>
                <Plus className="w-4 h-4 mr-2" />
                New BOM
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={createPageUrl("Manufacturing")}>
                <Upload className="w-4 h-4 mr-2" />
                Import BOMs
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={createPageUrl("Manufacturing")}>
                Work Centers
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={createPageUrl("Manufacturing")}>
                Routings
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">Active Work Orders</CardTitle>
            <Factory className="w-8 h-8 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">{activeWOs}</div>
            <p className="text-xs text-blue-700 mt-2">In production</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-900">Completed</CardTitle>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">{completedWOs}</div>
            <p className="text-xs text-green-700 mt-2">This period</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-purple-900">Total Production</CardTitle>
            <Package className="w-8 h-8 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900">{totalProduction}</div>
            <p className="text-xs text-purple-700 mt-2">Units produced</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-orange-900">Active BOMs</CardTitle>
            <FileText className="w-8 h-8 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-900">{boms.filter(b => b.is_active).length}</div>
            <p className="text-xs text-orange-700 mt-2">Total BOMs: {boms.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Work Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Work Orders</CardTitle>
          <Button asChild variant="outline" size="sm">
            <Link to={createPageUrl("Manufacturing")}>View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {workOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Factory className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p>No work orders yet</p>
              <Button asChild variant="outline" size="sm" className="mt-3">
                <Link to={createPageUrl("Manufacturing")}>Create First Work Order</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {workOrders.slice(0, 5).map(wo => (
                <div key={wo.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold">{wo.work_order_number}</p>
                    <p className="text-sm text-gray-600">{wo.product_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{wo.quantity_produced || 0} / {wo.quantity_to_produce}</p>
                    <p className="text-xs text-gray-600">{wo.status}</p>
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
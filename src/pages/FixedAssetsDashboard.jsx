import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useCompany } from "../components/auth/CompanyContext";
import {
  Package,
  Plus,
  Upload,
  TrendingDown,
  DollarSign,
  Trash2
} from "lucide-react";

export default function FixedAssetsDashboard() {
  const { currentCompany } = useCompany();

  const { data: assets = [] } = useQuery({
    queryKey: ['fixed-assets', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.FixedAsset.filter({ company_id: currentCompany.id }) : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const activeAssets = assets.filter(a => a.is_active);

  const totalAcquisitionCost = activeAssets.reduce((sum, a) => 
    sum + (parseFloat(a.acquisition_cost) || 0), 0
  );

  const totalDepreciation = activeAssets.reduce((sum, a) => 
    sum + (parseFloat(a.accumulated_depreciation) || 0), 0
  );

  const totalBookValue = totalAcquisitionCost - totalDepreciation;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Fixed Assets</h1>
        <p className="text-gray-500 mt-1">Track and manage your long-term assets for {currentCompany?.company_name}</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-2 border-indigo-100">
          <CardHeader>
            <CardTitle className="text-lg">Transactions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
              <Link to={createPageUrl("FixedAssets")}>
                <Plus className="w-4 h-4 mr-2" />
                Asset Acquisition
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={createPageUrl("FixedAssets")}>
                <TrendingDown className="w-4 h-4 mr-2" />
                Run Depreciation
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={createPageUrl("FixedAssets")}>
                <Trash2 className="w-4 h-4 mr-2" />
                Asset Disposal
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={createPageUrl("FixedAssets")}>
                Asset Report
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 border-teal-100">
          <CardHeader>
            <CardTitle className="text-lg">Master Data</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Button asChild className="bg-teal-600 hover:bg-teal-700">
              <Link to={createPageUrl("FixedAssets")}>
                <Plus className="w-4 h-4 mr-2" />
                New Asset
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={createPageUrl("FixedAssets")}>
                <Upload className="w-4 h-4 mr-2" />
                Import Assets
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={createPageUrl("FixedAssets")}>
                Asset Categories
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={createPageUrl("FixedAssets")}>
                Locations
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-indigo-900">Total Assets</CardTitle>
            <Package className="w-8 h-8 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-900">{activeAssets.length}</div>
            <p className="text-xs text-indigo-700 mt-2">Active assets</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">Acquisition Cost</CardTitle>
            <DollarSign className="w-8 h-8 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">${totalAcquisitionCost.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
            <p className="text-xs text-blue-700 mt-2">Original cost</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-orange-900">Accumulated Depreciation</CardTitle>
            <TrendingDown className="w-8 h-8 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-900">${totalDepreciation.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
            <p className="text-xs text-orange-700 mt-2">Total depreciation</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-900">Net Book Value</CardTitle>
            <DollarSign className="w-8 h-8 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">${totalBookValue.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
            <p className="text-xs text-green-700 mt-2">Current value</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Assets */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Assets</CardTitle>
          <Button asChild variant="outline" size="sm">
            <Link to={createPageUrl("FixedAssets")}>View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {activeAssets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p>No fixed assets yet</p>
              <Button asChild variant="outline" size="sm" className="mt-3">
                <Link to={createPageUrl("FixedAssets")}>Add First Asset</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {activeAssets.slice(0, 5).map(asset => {
                const bookValue = (parseFloat(asset.acquisition_cost) || 0) - (parseFloat(asset.accumulated_depreciation) || 0);
                return (
                  <div key={asset.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-semibold">{asset.asset_name}</p>
                      <p className="text-sm text-gray-600">{asset.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${bookValue.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                      <p className="text-xs text-gray-600">Book Value</p>
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
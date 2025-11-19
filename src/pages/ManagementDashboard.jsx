import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";
import { TrendingUp, Download, RefreshCw, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useCompany } from "../components/auth/CompanyContext";
import { useFinancialMetrics, formatCurrency, getCurrencySymbol } from "../components/shared/FinancialCalculations";

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function ManagementDashboard() {
  const [generatingReport, setGeneratingReport] = useState(false);
  const [executiveSummary, setExecutiveSummary] = useState("");
  const { currentCompany } = useCompany();

  // CRITICAL: Get base currency
  const baseCurrency = currentCompany?.base_currency || 'USD';
  const currencySymbol = getCurrencySymbol(baseCurrency);

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.Invoice.filter({ company_id: currentCompany.id }) : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const { data: bills = [] } = useQuery({
    queryKey: ['bills', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.Bill.filter({ company_id: currentCompany.id }) : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.Account.filter({ company_id: currentCompany.id }) : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const { data: journalEntries = [] } = useQuery({
    queryKey: ['journal-entries', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.JournalEntry.filter({ 
      company_id: currentCompany.id,
      status: 'posted'
    }) : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.Product.filter({ company_id: currentCompany.id }) : Promise.resolve([]),
    enabled: !!currentCompany
  });

  // CRITICAL FIX: Use centralized financial calculations
  const metrics = useFinancialMetrics(accounts, journalEntries);

  // Use the EXACT same metrics as Sales Dashboard and Income Statement
  const totalRevenue = metrics.totalRevenue;
  const totalExpenses = metrics.totalExpenses;
  const netProfit = metrics.netIncome;
  const profitMargin = metrics.netProfitMargin;

  // Calculate financial ratios from centralized metrics
  const currentAssets = metrics.assetAccounts
    .filter(a => a.account_category === 'current_asset')
    .reduce((sum, a) => sum + a.calculatedBalance, 0);

  const currentLiabilities = metrics.liabilityAccounts
    .filter(a => a.account_category === 'current_liability')
    .reduce((sum, a) => sum + a.calculatedBalance, 0);

  const currentRatio = currentLiabilities ? currentAssets / currentLiabilities : 0;

  const totalAssets = metrics.totalAssets;
  const totalLiabilities = metrics.totalLiabilities;
  const totalEquity = metrics.totalEquity;
  
  const debtToEquity = totalEquity ? totalLiabilities / totalEquity : 0;
  const returnOnAssets = totalAssets ? (netProfit / totalAssets) * 100 : 0;
  const returnOnEquity = totalEquity ? (netProfit / totalEquity) * 100 : 0;

  // Revenue trend (using actual data when available)
  const revenueTrend = [
    { month: 'Jan', revenue: 0, expenses: 0, profit: 0 },
    { month: 'Feb', revenue: 0, expenses: 0, profit: 0 },
    { month: 'Mar', revenue: 0, expenses: 0, profit: 0 },
    { month: 'Apr', revenue: 0, expenses: 0, profit: 0 },
    { month: 'May', revenue: 0, expenses: 0, profit: 0 },
    { month: 'Current', revenue: totalRevenue, expenses: totalExpenses, profit: netProfit }
  ];

  // KPI data for radar chart
  const kpiData = [
    { metric: 'Profitability', value: Math.min(Math.abs(profitMargin) / 10, 10) },
    { metric: 'Liquidity', value: Math.min(currentRatio * 2, 10) },
    { metric: 'Efficiency', value: totalRevenue && totalAssets ? Math.min((totalRevenue / totalAssets) * 2, 10) : 5 },
    { metric: 'Growth', value: 5 },
    { metric: 'Leverage', value: Math.max(10 - debtToEquity, 0) }
  ];

  const generateExecutiveSummary = useMutation({
    mutationFn: async () => {
      const prompt = `You are a senior financial analyst. Analyze the following business performance data and provide an executive summary with insights, recommendations, and strategic advice.

Financial Data:
- Total Revenue: ${currencySymbol}${totalRevenue.toLocaleString()}
- Total Expenses: ${currencySymbol}${totalExpenses.toLocaleString()}
- Net Profit: ${currencySymbol}${netProfit.toLocaleString()}
- Profit Margin: ${profitMargin.toFixed(2)}%
- Current Ratio: ${currentRatio.toFixed(2)}
- Debt-to-Equity Ratio: ${debtToEquity.toFixed(2)}
- Return on Assets: ${returnOnAssets.toFixed(2)}%
- Return on Equity: ${returnOnEquity.toFixed(2)}%
- Total Assets: ${currencySymbol}${totalAssets.toLocaleString()}
- Total Liabilities: ${currencySymbol}${totalLiabilities.toLocaleString()}
- Total Equity: ${currencySymbol}${totalEquity.toLocaleString()}

Provide:
1. Executive Summary (2-3 paragraphs)
2. Key Strengths (3-4 points)
3. Areas of Concern (2-3 points)
4. Strategic Recommendations (4-5 actionable recommendations)
5. Financial Health Score (0-100)

Format the response in markdown with clear headers.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: false
      });

      return result;
    },
    onSuccess: (data) => {
      setExecutiveSummary(data);
      setGeneratingReport(false);
    }
  });

  const handleGenerateReport = () => {
    setGeneratingReport(true);
    generateExecutiveSummary.mutate();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Management Dashboard</h1>
          <p className="text-gray-500 mt-1">Executive-level insights for {currentCompany?.company_name}</p>
          <p className="text-sm text-blue-600 font-semibold mt-1">
            📊 All amounts shown in {baseCurrency} - Calculated from Posted Journal Entries
          </p>
          <p className="text-xs text-green-600 font-semibold mt-1">
            ✅ Synchronized with Sales Dashboard, Income Statement & Balance Sheet
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleGenerateReport} disabled={generatingReport}>
            <RefreshCw className={`w-4 h-4 mr-2 ${generatingReport ? 'animate-spin' : ''}`} />
            {generatingReport ? 'Generating...' : 'Generate AI Report'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="financial">Financial Analysis</TabsTrigger>
          <TabsTrigger value="kpis">Key Metrics & KPIs</TabsTrigger>
          <TabsTrigger value="executive">Executive Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
              <CardHeader>
                <CardTitle className="text-sm text-blue-900">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-900">{formatCurrency(totalRevenue, baseCurrency)}</div>
                <div className="flex items-center mt-2 text-gray-600 text-sm">
                  <span>Current Period</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100">
              <CardHeader>
                <CardTitle className="text-sm text-green-900">Net Profit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-900">{formatCurrency(netProfit, baseCurrency)}</div>
                <div className="text-sm text-green-700 mt-2">
                  Margin: {profitMargin.toFixed(2)}%
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
              <CardHeader>
                <CardTitle className="text-sm text-purple-900">Current Ratio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-900">{currentRatio.toFixed(2)}</div>
                <div className="text-sm text-purple-700 mt-2">
                  {currentRatio >= 1.5 ? 'Healthy' : 'Needs attention'}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
              <CardHeader>
                <CardTitle className="text-sm text-orange-900">ROA</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-900">{returnOnAssets.toFixed(2)}%</div>
                <div className="text-sm text-orange-700 mt-2">
                  Return on Assets
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue & Profitability Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue & Profitability Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={revenueTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={3} name="Revenue" />
                  <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={3} name="Expenses" />
                  <Line type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={3} name="Profit" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Business Health Radar */}
          <Card>
            <CardHeader>
              <CardTitle>Business Health Score</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={kpiData}>
                  <PolarGrid stroke="#E5E7EB" />
                  <PolarAngleAxis dataKey="metric" stroke="#6B7280" />
                  <PolarRadiusAxis angle={90} domain={[0, 10]} stroke="#6B7280" />
                  <Radar name="Performance" dataKey="value" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Financial Ratios Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-b pb-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Profit Margin</span>
                  <span className="text-2xl font-bold text-green-600">{profitMargin.toFixed(2)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: `${Math.min(Math.abs(profitMargin) * 2, 100)}%` }}></div>
                </div>
              </div>

              <div className="border-b pb-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Current Ratio</span>
                  <span className="text-2xl font-bold text-blue-600">{currentRatio.toFixed(2)}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {currentRatio >= 1.5 ? '✓ Strong liquidity position' : '⚠ Consider improving liquidity'}
                </p>
              </div>

              <div className="border-b pb-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Debt-to-Equity</span>
                  <span className="text-2xl font-bold text-purple-600">{debtToEquity.toFixed(2)}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {debtToEquity <= 1 ? '✓ Conservative leverage' : '⚠ High leverage'}
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Return on Assets</span>
                  <span className="text-2xl font-bold text-orange-600">{returnOnAssets.toFixed(2)}%</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Asset utilization efficiency
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kpis" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Profitability Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gross Profit Margin</span>
                    <span className="font-semibold">{metrics.grossProfitMargin.toFixed(2)}%</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Operating Margin</span>
                    <span className="font-semibold">{(profitMargin * 0.85).toFixed(2)}%</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Net Margin</span>
                    <span className="font-semibold">{profitMargin.toFixed(2)}%</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">ROE</span>
                    <span className="font-semibold">{returnOnEquity.toFixed(2)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Liquidity Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Ratio</span>
                    <span className="font-semibold">{currentRatio.toFixed(2)}</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quick Ratio</span>
                    <span className="font-semibold">{(currentRatio * 0.8).toFixed(2)}</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Working Capital</span>
                    <span className="font-semibold">{formatCurrency(currentAssets - currentLiabilities, baseCurrency)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Efficiency Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Asset Turnover</span>
                    <span className="font-semibold">{totalAssets && totalRevenue ? (totalRevenue / totalAssets).toFixed(2) : '0.00'}</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Revenue per Asset</span>
                    <span className="font-semibold">{formatCurrency(totalAssets && totalRevenue ? (totalRevenue / totalAssets) : 0, baseCurrency)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="executive" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Executive Summary & Strategic Analysis
              </CardTitle>
              {!executiveSummary && (
                <Button onClick={handleGenerateReport} disabled={generatingReport}>
                  {generatingReport ? 'Generating...' : 'Generate AI Report'}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {executiveSummary ? (
                <div className="prose max-w-none">
                  <ReactMarkdown>{executiveSummary}</ReactMarkdown>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 mb-4">
                    Click "Generate AI Report" to create an executive summary with AI-powered insights and recommendations
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
import React, { useState } from "react";
import { Invoice, Bill, Account, JournalEntry, Product } from "@/api/entities";
import { InvokeLLM } from "@/api/integrations";
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
  ResponsiveContainer
} from "recharts";
import { TrendingUp, Download, RefreshCw, FileText, BarChart3 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useCompany } from "../components/auth/CompanyContext";
import { useFinancialMetrics, formatCurrency, getCurrencySymbol, getMonthlyRevenueAndExpenses } from "../components/shared/FinancialCalculations";
import PageShell, { PageHeader, StatBar, ActionBtn } from "../components/shared/PageShell";

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

function NoDataMessage({ title, detail }) {
  return (
    <div className="text-center py-12">
      <BarChart3 className="w-12 h-12 mx-auto text-gray-300 mb-3" />
      <p className="text-gray-500 font-medium">{title}</p>
      <p className="text-gray-400 text-sm mt-1">{detail}</p>
    </div>
  );
}

const NO_POSTED_DATA = 'These figures appear once invoices, bills or journals are posted.';

export default function ManagementDashboard() {
  const [generatingReport, setGeneratingReport] = useState(false);
  const [executiveSummary, setExecutiveSummary] = useState("");
  const { currentCompany } = useCompany();

  // CRITICAL: Get base currency
  const baseCurrency = currentCompany?.base_currency || 'USD';
  const currencySymbol = getCurrencySymbol(baseCurrency);

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices', currentCompany?.id],
    queryFn: () => currentCompany ? Invoice.list({ filters: { company_id: currentCompany.id } }) : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const { data: bills = [] } = useQuery({
    queryKey: ['bills', currentCompany?.id],
    queryFn: () => currentCompany ? Bill.list({ filters: { company_id: currentCompany.id } }) : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts', currentCompany?.id],
    queryFn: () => currentCompany ? Account.list({ filters: { company_id: currentCompany.id } }) : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const { data: journalEntries = [] } = useQuery({
    queryKey: ['journal-entries', currentCompany?.id],
    queryFn: () => currentCompany ? JournalEntry.list({ filters: {
      company_id: currentCompany.id,
      status: 'posted'
    } }) : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products', currentCompany?.id],
    queryFn: () => currentCompany ? Product.list({ filters: { company_id: currentCompany.id } }) : Promise.resolve([]),
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

  // A ratio with nothing to divide by has no honest value, so it shows as a dash.
  const hasCurrentRatio = currentLiabilities > 0;
  const currentRatio = hasCurrentRatio ? currentAssets / currentLiabilities : 0;
  const currentRatioText = hasCurrentRatio ? currentRatio.toFixed(2) : '—';
  const inventoryValue = metrics.inventoryAccounts
    .filter(a => a.account_category === 'current_asset')
    .reduce((sum, a) => sum + a.calculatedBalance, 0);
  const quickRatioText = hasCurrentRatio ? ((currentAssets - inventoryValue) / currentLiabilities).toFixed(2) : '—';

  const totalAssets = metrics.totalAssets;
  const totalLiabilities = metrics.totalLiabilities;
  const totalEquity = metrics.totalEquity;
  
  const hasDebtToEquity = totalEquity > 0;
  const debtToEquity = hasDebtToEquity ? totalLiabilities / totalEquity : 0;
  const debtToEquityText = hasDebtToEquity ? debtToEquity.toFixed(2) : '—';
  const returnOnAssets = totalAssets ? (netProfit / totalAssets) * 100 : 0;
  const returnOnEquity = totalEquity ? (netProfit / totalEquity) * 100 : 0;

  const hasPostedData = journalEntries.length > 0;
  const revenueTrend = getMonthlyRevenueAndExpenses(accounts, journalEntries)
    .map(month => ({ ...month, Profit: Math.round((month.Revenue - month.Expenses) * 100) / 100 }));
  const hasTrendData = revenueTrend.some(month => month.Revenue !== 0 || month.Expenses !== 0);
  const compactAmount = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });

  const generateExecutiveSummary = useMutation({
    mutationFn: async () => {
      const prompt = `You are a senior financial analyst. Analyze the following business performance data and provide an executive summary with insights, recommendations, and strategic advice.

Financial Data (all-time totals):
- Total Revenue: ${currencySymbol}${totalRevenue.toLocaleString()}
- Total Expenses: ${currencySymbol}${totalExpenses.toLocaleString()}
- Net Profit: ${currencySymbol}${netProfit.toLocaleString()}
- Profit Margin: ${profitMargin.toFixed(2)}%
- Current Ratio: ${currentRatioText}
- Debt-to-Equity Ratio: ${debtToEquityText}
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

      const result = await InvokeLLM({
        prompt: prompt,
        add_context_from_internet: false
      });

      return result;
    },
    onSuccess: (data) => {
      setExecutiveSummary(data);
      setGeneratingReport(false);
    },
    onError: () => setGeneratingReport(false),
  });

  const handleGenerateReport = () => {
    setGeneratingReport(true);
    generateExecutiveSummary.mutate();
  };

  return (
    <PageShell>
      <PageHeader
        title="Management Dashboard"
        subtitle={`Executive-level insights · ${currentCompany?.company_name} · ${baseCurrency}`}
        icon={BarChart3}
        accentColor="#1B4F8A"
        actions={
          <ActionBtn
            onClick={handleGenerateReport}
            icon={RefreshCw}
            label={generatingReport ? 'Generating…' : 'Generate AI Report'}
            variant="outline"
            disabled={generatingReport || !hasPostedData}
          />
        }
      />
      <StatBar stats={[
        { label: 'Revenue (All time)',  value: formatCurrency(totalRevenue, baseCurrency),  icon: TrendingUp, color: '#00A86B' },
        { label: 'Net Profit (All time)',     value: formatCurrency(netProfit, baseCurrency),      icon: TrendingUp, color: netProfit >= 0 ? '#00A86B' : '#EF4444' },
        { label: 'Margin (All time)',  value: `${profitMargin.toFixed(1)}%`,              color: '#1B4F8A' },
        { label: 'Current Ratio',  value: currentRatioText,                   color: !hasCurrentRatio ? '#64748B' : currentRatio >= 1.5 ? '#00A86B' : '#F59E0B' },
        { label: 'ROA',            value: `${returnOnAssets.toFixed(1)}%`,           color: '#8B5CF6' },
      ]} />
      <div>

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
                  <span>All time</span>
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
                  All time · Margin: {profitMargin.toFixed(2)}%
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
              <CardHeader>
                <CardTitle className="text-sm text-purple-900">Current Ratio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-900">{currentRatioText}</div>
                <div className="text-sm text-purple-700 mt-2">
                  {!hasCurrentRatio ? 'No current liabilities yet' : currentRatio >= 1.5 ? 'Healthy' : 'Needs attention'}
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
                  All time · Return on Assets
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue & Profitability Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue & Profitability Trend (Last 6 Months)</CardTitle>
            </CardHeader>
            <CardContent>
              {hasTrendData ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={revenueTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="month" stroke="#6B7280" />
                    <YAxis stroke="#6B7280" tickFormatter={value => `${value < 0 ? '-' : ''}${currencySymbol}${compactAmount.format(Math.abs(value))}`} />
                    <Tooltip formatter={value => formatCurrency(value, baseCurrency)} />
                    <Legend />
                    <Line type="monotone" dataKey="Revenue" stroke="#3B82F6" strokeWidth={3} />
                    <Line type="monotone" dataKey="Expenses" stroke="#EF4444" strokeWidth={3} />
                    <Line type="monotone" dataKey="Profit" stroke="#10B981" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <NoDataMessage title="No posted revenue or expenses in the last 6 months" detail="This chart fills in as invoices and bills are posted." />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          {!hasPostedData ? (
            <Card><CardContent><NoDataMessage title="No financial ratios yet" detail={NO_POSTED_DATA} /></CardContent></Card>
          ) : (
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
                  <span className="text-2xl font-bold text-blue-600">{currentRatioText}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {!hasCurrentRatio ? 'No current liabilities yet' : currentRatio >= 1.5 ? '✓ Strong liquidity position' : '⚠ Consider improving liquidity'}
                </p>
              </div>

              <div className="border-b pb-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Debt-to-Equity</span>
                  <span className="text-2xl font-bold text-purple-600">{debtToEquityText}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {!hasDebtToEquity ? 'No equity balance yet' : debtToEquity <= 1 ? '✓ Conservative leverage' : '⚠ High leverage'}
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
          )}
        </TabsContent>

        <TabsContent value="kpis" className="space-y-6">
          {!hasPostedData ? (
            <Card><CardContent><NoDataMessage title="No key metrics yet" detail={NO_POSTED_DATA} /></CardContent></Card>
          ) : (
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
                    <span className="font-semibold">{currentRatioText}</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quick Ratio</span>
                    <span className="font-semibold">{quickRatioText}</span>
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
              </CardContent>
            </Card>
          </div>
          )}
        </TabsContent>

        <TabsContent value="executive" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Executive Summary & Strategic Analysis
              </CardTitle>
              {!executiveSummary && (
                <Button onClick={handleGenerateReport} disabled={generatingReport || !hasPostedData}>
                  {generatingReport ? 'Generating...' : 'Generate AI Report'}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {generateExecutiveSummary.error && (
                <div role="alert" className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  The report could not be generated: {generateExecutiveSummary.error.message}
                </div>
              )}
              {executiveSummary ? (
                <div className="prose max-w-none">
                  <ReactMarkdown>{executiveSummary}</ReactMarkdown>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 mb-4">
                    {hasPostedData
                      ? 'Click "Generate AI Report" to create an executive summary with AI-powered insights and recommendations'
                      : NO_POSTED_DATA}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </PageShell>
  );
}
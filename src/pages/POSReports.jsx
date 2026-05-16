
import React, { useState } from "react";
import { POSSale, POSSession, Store } from "@/api/entities";
import { useQuery } from "@tanstack/react-query";
import { useCompany } from "../components/auth/CompanyContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PageShell, { PageHeader, StatBar } from "../components/shared/PageShell";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  FileText,
  Download,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Store as StoreIcon,
  BarChart3
} from "lucide-react";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function POSReports() {
  const { currentCompany } = useCompany();
  const [dateFrom, setDateFrom] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [selectedStore, setSelectedStore] = useState('all');
  const [selectedCashier, setSelectedCashier] = useState('all'); // New state for cashier filter

  const { data: sales = [] } = useQuery({
    queryKey: ['pos-sales', currentCompany?.id, dateFrom, dateTo, selectedStore, selectedCashier], // Added selectedCashier to queryKey
    queryFn: async () => {
      if (!currentCompany) return [];
      const filters = {
        company_id: currentCompany.id,
        status: 'completed'
      };
      if (selectedStore !== 'all') {
        filters.store_id = selectedStore;
      }
      if (selectedCashier !== 'all') { // Added cashier filter
        filters.cashier_id = selectedCashier;
      }
      return POSSale.list({ filters });
    },
    enabled: !!currentCompany
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['pos-sessions', currentCompany?.id, dateFrom, dateTo],
    queryFn: async () => {
      if (!currentCompany) return [];
      // Filter sessions by date range if available in the API
      // For now, assuming POSSession filter endpoint can handle date ranges implicitly or needs explicit parameters.
      // If `start_date` and `end_date` are available for filtering sessions, add them here.
      return POSSession.list({ filters: {
        company_id: currentCompany.id
      } });
    },
    enabled: !!currentCompany
  });

  const { data: stores = [] } = useQuery({
    queryKey: ['stores', currentCompany?.id],
    queryFn: () => Store.list({ filters: { company_id: currentCompany.id } }),
    enabled: !!currentCompany
  });

  // Calculate summary statistics
  const totalSales = sales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
  const totalTransactions = sales.length;
  const averageTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0;
  const totalDiscount = sales.reduce((sum, sale) => sum + (sale.discount_total || 0), 0);
  const totalTax = sales.reduce((sum, sale) => sum + (sale.tax_total || 0), 0);

  // Payment method breakdown
  const paymentMethodData = sales.reduce((acc, sale) => {
    sale.payments?.forEach(payment => {
      acc[payment.payment_method] = (acc[payment.payment_method] || 0) + (payment.amount || 0);
    });
    return acc;
  }, {});

  const paymentChartData = Object.entries(paymentMethodData).map(([method, amount]) => ({
    name: method.charAt(0).toUpperCase() + method.slice(1),
    value: amount
  }));

  // Top selling products
  const productSalesMap = {};
  sales.forEach(sale => {
    sale.line_items?.forEach(item => {
      if (!productSalesMap[item.product_id]) {
        productSalesMap[item.product_id] = {
          product_name: item.product_name,
          quantity: 0,
          revenue: 0
        };
      }
      productSalesMap[item.product_id].quantity += item.quantity || 0;
      productSalesMap[item.product_id].revenue += item.line_total || 0;
    });
  });

  const topProducts = Object.entries(productSalesMap)
    .map(([id, data]) => ({ product_id: id, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // Hourly sales trend
  const hourlySales = sales.reduce((acc, sale) => {
    const saleDate = new Date(sale.sale_date);
    if (!isNaN(saleDate.getTime())) { // Check if date is valid
      const hour = saleDate.getHours();
      acc[hour] = (acc[hour] || 0) + (sale.total_amount || 0);
    }
    return acc;
  }, {});

  const hourlyChartData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    sales: hourlySales[i] || 0
  }));

  // Store performance
  const storePerformance = stores.map(store => {
    const storeSales = sales.filter(s => s.store_id === store.id);
    return {
      store_name: store.store_name,
      sales: storeSales.reduce((sum, s) => sum + (s.total_amount || 0), 0),
      transactions: storeSales.length
    };
  });

  // Sales by Cashier/Sales Rep
  const salesByCashier = sales.reduce((acc, sale) => {
    const cashierId = sale.cashier_id;
    const cashierName = sale.cashier_name;

    if (!cashierId) return acc; // Skip if cashier_id is missing

    if (!acc[cashierId]) {
      acc[cashierId] = {
        cashier_id: cashierId,
        cashier_name: cashierName || `Unknown Cashier (${cashierId})`,
        total_sales: 0,
        transactions: 0,
        gross_profit: 0
      };
    }
    acc[cashierId].total_sales += sale.total_amount || 0;
    acc[cashierId].transactions += 1;
    acc[cashierId].gross_profit += (sale.gross_profit || 0); // Assuming gross_profit exists on sale object
    return acc;
  }, {});

  const cashierPerformance = Object.values(salesByCashier).sort((a, b) => b.total_sales - a.total_sales);


  const INPUT_STYLE = { padding: '8px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13.5, fontFamily: 'inherit', outline: 'none', background: 'white', color: '#0F172A', width: '100%', boxSizing: 'border-box' };

  return (
    <PageShell>
      <PageHeader
        title="POS Reports & Analytics"
        subtitle="Comprehensive sales and performance insights"
        icon={BarChart3}
        accentColor="#1B4F8A"
        actions={
          <button style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', border: '1.5px solid #E2E8F0', borderRadius: 8, background: 'white', color: '#475569', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            <Download style={{ width: 14, height: 14 }} />
            Export Report
          </button>
        }
      />

      <StatBar stats={[
        { label: 'Total Sales',       value: `$${totalSales.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`, icon: DollarSign, color: '#1B4F8A' },
        { label: 'Transactions',      value: totalTransactions,                icon: ShoppingCart, color: '#00A86B' },
        { label: 'Avg Transaction',   value: `$${averageTransaction.toFixed(2)}`, icon: TrendingUp, color: '#8B5CF6' },
        { label: 'Total Discount',    value: `$${totalDiscount.toFixed(2)}`,   color: '#F59E0B' },
        { label: 'Tax Collected',     value: `$${totalTax.toFixed(2)}`,        icon: FileText, color: '#EF4444' },
      ]} />

      {/* Filters */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #F1F5F9', padding: '16px 20px', marginBottom: 20, boxShadow: '0 1px 4px rgba(15,43,91,0.05)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 14, alignItems: 'end' }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5, display: 'block' }}>From Date</label>
            <input type="date" style={INPUT_STYLE} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5, display: 'block' }}>To Date</label>
            <input type="date" style={INPUT_STYLE} value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5, display: 'block' }}>Store</label>
            <Select value={selectedStore} onValueChange={setSelectedStore}>
              <SelectTrigger style={{ height: 38, fontSize: 13.5 }}><SelectValue placeholder="All Stores" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stores</SelectItem>
                {stores.map(store => <SelectItem key={store.id} value={store.id}>{store.store_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5, display: 'block' }}>Sales Rep</label>
            <Select value={selectedCashier} onValueChange={setSelectedCashier}>
              <SelectTrigger style={{ height: 38, fontSize: 13.5 }}><SelectValue placeholder="All Sales Reps" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sales Reps</SelectItem>
                {cashierPerformance.map(c => <SelectItem key={c.cashier_id} value={c.cashier_id}>{c.cashier_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <button style={{ padding: '9px 18px', border: 'none', borderRadius: 8, background: '#1B4F8A', color: 'white', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
            Generate
          </button>
        </div>
      </div>

      {/* Detailed Reports Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="sales-rep">Sales Rep</TabsTrigger> {/* New tab trigger */}
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="stores">Stores</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Hourly Sales Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={hourlyChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis tickFormatter={(value) => `$${value}`} />
                    <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, 'Sales']} />
                    <Line type="monotone" dataKey="sales" stroke="#3B82F6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={paymentChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {paymentChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Top Selling Products</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Quantity Sold</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>% of Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProducts.map(product => (
                    <TableRow key={product.product_id}>
                      <TableCell className="font-medium">{product.product_name}</TableCell>
                      <TableCell>{product.quantity}</TableCell>
                      <TableCell>${product.revenue.toFixed(2)}</TableCell>
                      <TableCell>
                        {totalSales > 0 ? ((product.revenue / totalSales) * 100).toFixed(1) : '0.0'}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payment Method Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(paymentMethodData).map(([method, amount]) => (
                  <div key={method} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-semibold capitalize">{method}</p>
                      <p className="text-sm text-gray-600">
                        {sales.filter(s => s.payments?.some(p => p.payment_method === method)).length} transactions
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">${amount.toFixed(2)}</p>
                      <p className="text-xs text-gray-600">
                        {totalSales > 0 ? ((amount / totalSales) * 100).toFixed(1) : '0.0'}% of total
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales-rep"> {/* New Sales Rep Performance tab content */}
          <Card>
            <CardHeader>
              <CardTitle>Sales Rep Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sales Rep Name</TableHead>
                    <TableHead>Total Sales</TableHead>
                    <TableHead>Transactions</TableHead>
                    <TableHead>Avg Transaction</TableHead>
                    <TableHead>Gross Profit</TableHead>
                    <TableHead>% of Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cashierPerformance.map((cashier, index) => (
                    <TableRow key={cashier.cashier_id || index}>
                      <TableCell className="font-medium">{cashier.cashier_name}</TableCell>
                      <TableCell className="font-semibold text-green-600">
                        ${cashier.total_sales.toFixed(2)}
                      </TableCell>
                      <TableCell>{cashier.transactions}</TableCell>
                      <TableCell>
                        ${cashier.transactions > 0 ? (cashier.total_sales / cashier.transactions).toFixed(2) : '0.00'}
                      </TableCell>
                      <TableCell className="text-blue-600 font-semibold">
                        ${cashier.gross_profit.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {totalSales > 0 ? ((cashier.total_sales / totalSales) * 100).toFixed(1) : '0.0'}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>POS Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Session #</TableHead>
                    <TableHead>Cashier</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>End Time</TableHead>
                    <TableHead>Sales</TableHead>
                    <TableHead>Transactions</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map(session => (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">{session.session_number}</TableCell>
                      <TableCell>{session.cashier_name}</TableCell>
                      <TableCell>{session.start_time ? format(new Date(session.start_time), 'MMM d, h:mm a') : '-'}</TableCell>
                      <TableCell>{session.end_time ? format(new Date(session.end_time), 'MMM d, h:mm a') : '-'}</TableCell>
                      <TableCell>${session.total_sales?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell>{session.total_transactions || 0}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${
                          session.status === 'open' ? 'bg-green-100 text-green-800' :
                          session.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {session.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stores">
          <Card>
            <CardHeader>
              <CardTitle>Store Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {storePerformance.map((store, index) => (
                  <div key={index} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <StoreIcon className="w-5 h-5 text-blue-600" />
                          <h3 className="font-semibold text-lg">{store.store_name}</h3>
                        </div>
                        <p className="text-sm text-gray-600">{store.transactions} transactions</p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-green-600">${store.sales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <p className="text-xs text-gray-600">
                          {totalSales > 0 ? ((store.sales / totalSales) * 100).toFixed(1) : '0.0'}% of total
                        </p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${totalSales > 0 ? (store.sales / totalSales) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}

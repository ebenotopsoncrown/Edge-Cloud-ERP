import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { formatCurrency } from "../shared/FinancialCalculations";

const COLORS = ['#10B981', '#FBBF24', '#F97316', '#EF4444'];

export default function AgedReceivables({ invoices, baseCurrency = 'USD' }) {
  const agedData = useMemo(() => {
    const today = new Date();
    
    const categories = {
      current: { label: '0 - 30', amount: 0, color: COLORS[0] },
      days31to60: { label: '31 - 60', amount: 0, color: COLORS[1] },
      days61to90: { label: '61 - 90', amount: 0, color: COLORS[2] },
      over90: { label: 'Over 90 days', amount: 0, color: COLORS[3] }
    };

    // Calculate aged amounts from unpaid invoices
    invoices
      .filter(inv => ['sent', 'viewed', 'partial', 'overdue'].includes(inv.status))
      .forEach(invoice => {
        const dueDate = new Date(invoice.due_date);
        const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
        const outstandingAmount = invoice.balance_due || invoice.total_amount;

        if (daysOverdue <= 30) {
          categories.current.amount += outstandingAmount;
        } else if (daysOverdue <= 60) {
          categories.days31to60.amount += outstandingAmount;
        } else if (daysOverdue <= 90) {
          categories.days61to90.amount += outstandingAmount;
        } else {
          categories.over90.amount += outstandingAmount;
        }
      });

    const totalAmount = Object.values(categories).reduce((sum, cat) => sum + cat.amount, 0);

    const tableData = Object.values(categories).map(cat => ({
      label: cat.label,
      amount: cat.amount,
      percentage: totalAmount > 0 ? (cat.amount / totalAmount) * 100 : 0,
      color: cat.color
    }));

    const chartData = tableData
      .filter(d => d.amount > 0)
      .map(d => ({
        name: d.label,
        value: d.amount,
        color: d.color
      }));

    return { tableData, chartData, totalAmount };
  }, [invoices]);

  return (
    <Card className="shadow-md border-none">
      <CardHeader className="bg-gray-50 border-b">
        <CardTitle className="text-lg">Aged Receivables</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="flex items-center justify-center">
            {agedData.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={agedData.chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {agedData.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value, baseCurrency)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-40 h-40 rounded-full border-8 border-gray-200 flex items-center justify-center">
                <p className="text-gray-400 text-sm">No Data</p>
              </div>
            )}
          </div>

          {/* Table */}
          <div>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100 hover:bg-gray-100">
                  <TableHead className="font-bold">Days Overdue ▲</TableHead>
                  <TableHead className="font-bold text-right">Amount</TableHead>
                  <TableHead className="font-bold text-right">Percent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agedData.tableData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: row.color }}
                      />
                      <span className="font-medium">{row.label}</span>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(row.amount, baseCurrency)}
                    </TableCell>
                    <TableCell className="text-right text-gray-600">
                      {row.percentage.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-gray-100 font-bold hover:bg-gray-100">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right text-blue-700">
                    {formatCurrency(agedData.totalAmount, baseCurrency)}
                  </TableCell>
                  <TableCell className="text-right">100.0%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
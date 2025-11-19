import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, RefreshCcw } from "lucide-react";
import { format } from "date-fns";
import SalesReturnForm from "../components/sales/SalesReturnForm";
import { useCompany } from "../components/auth/CompanyContext";

const statusColors = {
  draft: "bg-gray-100 text-gray-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800"
};

export default function SalesReturns() {
  const [showForm, setShowForm] = useState(false);
  const { currentCompany } = useCompany();

  const { data: returns = [], isLoading } = useQuery({
    queryKey: ['sales-returns', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.SalesReturn.filter({ 
      company_id: currentCompany.id 
    }, '-return_date') : [],
    enabled: !!currentCompany
  });

  const baseCurrency = currentCompany?.base_currency || 'USD';

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales Returns / Credit Memos</h1>
          <p className="text-gray-500 mt-1">Process customer returns and credit memos</p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Credit Memo
        </Button>
      </div>

      {showForm && (
        <SalesReturnForm onClose={() => setShowForm(false)} />
      )}

      <Card className="p-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Credit Memo #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Invoice #</TableHead>
                <TableHead>Return Date</TableHead>
                <TableHead>Amount ({baseCurrency})</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    Loading returns...
                  </TableCell>
                </TableRow>
              ) : returns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <RefreshCcw className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No sales returns yet</p>
                    <Button 
                      onClick={() => setShowForm(true)}
                      variant="outline"
                      className="mt-3"
                    >
                      Create first credit memo
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                returns.map((ret) => (
                  <TableRow key={ret.id}>
                    <TableCell className="font-medium text-blue-600">
                      {ret.return_number}
                    </TableCell>
                    <TableCell>{ret.customer_name}</TableCell>
                    <TableCell>{ret.invoice_number}</TableCell>
                    <TableCell>{format(new Date(ret.return_date), 'MMM d, yyyy')}</TableCell>
                    <TableCell className="font-semibold text-red-600">
                      -₦{ret.total_amount?.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[ret.status]}>
                        {ret.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
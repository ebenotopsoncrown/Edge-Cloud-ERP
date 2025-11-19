
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, FileText, Eye, Pencil } from "lucide-react";
import { format } from "date-fns";
import InvoiceForm from "../components/invoices/InvoiceForm";
import { useCompany } from "../components/auth/CompanyContext";

// CRITICAL FIX: Currency symbol function
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

const statusColors = {
  draft: "bg-gray-100 text-gray-800",
  sent: "bg-blue-100 text-blue-800",
  viewed: "bg-purple-100 text-purple-800",
  partial: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-800"
};

export default function Invoices() {
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();
  const { currentCompany } = useCompany();

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.Invoice.filter({ company_id: currentCompany.id }, '-invoice_date') : Promise.resolve([]),
    enabled: !!currentCompany
  });

  // CRITICAL: Get base currency
  const baseCurrency = currentCompany?.base_currency || 'USD';
  const currencySymbol = getCurrencySymbol(baseCurrency);

  const filteredInvoices = invoices.filter(invoice =>
    invoice.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (invoice) => {
    setEditingInvoice(invoice);
    setShowForm(true);
  };

  const handleView = (invoice) => {
    setEditingInvoice(invoice);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingInvoice(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales Invoices</h1>
          <p className="text-gray-500 mt-1">Manage your sales invoices and track payments</p>
          <p className="text-sm text-blue-600 font-semibold mt-1">
            💰 All amounts shown in {baseCurrency} ({currencySymbol})
          </p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Invoice
        </Button>
      </div>

      {showForm && (
        <InvoiceForm
          invoice={editingInvoice}
          onClose={handleFormClose}
        />
      )}

      <Card className="p-6">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by customer or invoice number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Amount ({baseCurrency})</TableHead>
                <TableHead>Balance Due ({baseCurrency})</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    Loading invoices...
                  </TableCell>
                </TableRow>
              ) : filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No invoices found</p>
                    <Button 
                      onClick={() => setShowForm(true)}
                      variant="outline"
                      className="mt-3"
                    >
                      Create your first invoice
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((invoice) => (
                  <TableRow 
                    key={invoice.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleView(invoice)}
                    title="Click to view/edit invoice"
                  >
                    <TableCell className="font-medium text-blue-600 hover:underline">
                      {invoice.invoice_number}
                    </TableCell>
                    <TableCell>{invoice.customer_name}</TableCell>
                    <TableCell>{format(new Date(invoice.invoice_date), 'MMM d, yyyy')}</TableCell>
                    <TableCell>{format(new Date(invoice.due_date), 'MMM d, yyyy')}</TableCell>
                    <TableCell className="font-semibold">{currencySymbol}{invoice.total_amount?.toFixed(2)}</TableCell>
                    <TableCell className="font-semibold text-orange-600">
                      {currencySymbol}{invoice.balance_due?.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[invoice.status]}>
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(invoice)}
                          title="Edit invoice"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </div>
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

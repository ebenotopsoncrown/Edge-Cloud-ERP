
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
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
import { Plus, Search, Receipt, Pencil } from "lucide-react";
import { format } from "date-fns";
import BillForm from "../components/bills/BillForm";

const statusColors = {
  draft: "bg-gray-100 text-gray-800",
  pending: "bg-blue-100 text-blue-800",
  partial: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-800"
};

export default function Bills() {
  const [showForm, setShowForm] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: bills = [], isLoading } = useQuery({
    queryKey: ['bills'],
    queryFn: () => base44.entities.Bill.list('-bill_date')
  });

  const filteredBills = bills.filter(bill =>
    bill.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.bill_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (bill) => {
    setEditingBill(bill);
    setShowForm(true);
  };

  const handleView = (bill) => {
    setEditingBill(bill);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingBill(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Purchase Bills</h1>
          <p className="text-gray-500 mt-1">Track vendor bills and manage payments</p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Bill
        </Button>
      </div>

      {showForm && (
        <BillForm
          bill={editingBill}
          onClose={handleFormClose}
        />
      )}

      <Card className="p-6">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by vendor or bill number..."
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
                <TableHead>Bill #</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Balance Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    Loading bills...
                  </TableCell>
                </TableRow>
              ) : filteredBills.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <Receipt className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No bills found</p>
                    <Button 
                      onClick={() => setShowForm(true)}
                      variant="outline"
                      className="mt-3"
                    >
                      Create your first bill
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                filteredBills.map((bill) => (
                  <TableRow 
                    key={bill.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleView(bill)}
                    title="Click to view/edit bill"
                  >
                    <TableCell className="font-medium text-blue-600 hover:underline">
                      {bill.bill_number}
                    </TableCell>
                    <TableCell>{bill.vendor_name}</TableCell>
                    <TableCell>{format(new Date(bill.bill_date), 'MMM d, yyyy')}</TableCell>
                    <TableCell>{format(new Date(bill.due_date), 'MMM d, yyyy')}</TableCell>
                    <TableCell className="font-semibold">${bill.total_amount?.toFixed(2)}</TableCell>
                    <TableCell className="font-semibold text-orange-600">
                      ${bill.balance_due?.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[bill.status]}>
                        {bill.status}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(bill)}
                        title="Edit bill"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
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

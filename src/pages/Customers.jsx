
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, Users, Pencil, Trash2 } from "lucide-react";
import CustomerForm from "../components/customers/CustomerForm";
import { useCompany } from "../components/auth/CompanyContext";

export default function Customers() {
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);

  const queryClient = useQueryClient();
  const { currentCompany } = useCompany();

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers', currentCompany?.id],
    queryFn: () => currentCompany
      ? base44.entities.Customer.filter({ company_id: currentCompany.id }, '-created_date')
      : Promise.resolve([]),
    enabled: !!currentCompany
  });

  // CRITICAL FIX: Fetch invoices to calculate outstanding amounts
  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices', currentCompany?.id],
    queryFn: () => currentCompany
      ? base44.entities.Invoice.filter({ company_id: currentCompany.id })
      : Promise.resolve([]),
    enabled: !!currentCompany
  });

  // Calculate outstanding amounts for each customer
  const customersWithOutstanding = customers.map(customer => {
    const customerInvoices = invoices.filter(inv =>
      inv.customer_id === customer.id &&
      ['sent', 'viewed', 'partial', 'overdue'].includes(inv.status)
    );

    const totalOutstanding = customerInvoices.reduce((sum, inv) =>
      sum + (inv.balance_due || (inv.total_amount || 0) - (inv.amount_paid || 0)), 0
    );

    return {
      ...customer,
      total_outstanding: totalOutstanding
    };
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Customer.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['customers', currentCompany?.id]);
      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
    }
  });

  const filteredCustomers = customersWithOutstanding.filter(customer =>
    customer.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingCustomer(null);
  };

  const handleDelete = (customer) => {
    setCustomerToDelete(customer);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (customerToDelete) {
      deleteMutation.mutate(customerToDelete.id);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-500 mt-1">Manage your customer relationships</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Customer
        </Button>
      </div>

      {showForm && (
        <CustomerForm
          customer={editingCustomer}
          onClose={handleFormClose}
          companyId={currentCompany?.id}
        />
      )}

      <Card className="p-6">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search customers..."
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
                <TableHead>Company Name</TableHead>
                <TableHead>Contact Person</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Credit Limit</TableHead>
                <TableHead>Outstanding</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    Loading customers...
                  </TableCell>
                </TableRow>
              ) : filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No customers found</p>
                    <Button
                      onClick={() => setShowForm(true)}
                      variant="outline"
                      className="mt-3"
                    >
                      Add your first customer
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer) => (
                  <TableRow key={customer.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{customer.company_name}</TableCell>
                    <TableCell>{customer.contact_person}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell>${customer.credit_limit?.toFixed(2)}</TableCell>
                    <TableCell className="font-semibold text-orange-600">
                      ${customer.total_outstanding?.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge className={customer.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                        {customer.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(customer)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(customer)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{customerToDelete?.company_name}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

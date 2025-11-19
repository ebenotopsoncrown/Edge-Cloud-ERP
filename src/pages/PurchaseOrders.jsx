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
import { Plus, Search, ShoppingCart, Pencil, Trash2, FileText } from "lucide-react";
import { format } from "date-fns";
import PurchaseOrderForm from "../components/purchaseOrders/PurchaseOrderForm";
import { useCompany } from "../components/auth/CompanyContext";

const statusColors = {
  draft: "bg-gray-100 text-gray-800",
  sent: "bg-blue-100 text-blue-800",
  acknowledged: "bg-purple-100 text-purple-800",
  partially_received: "bg-yellow-100 text-yellow-800",
  fully_received: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800"
};

export default function PurchaseOrders() {
  const [showForm, setShowForm] = useState(false);
  const [editingPO, setEditingPO] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [poToDelete, setPoToDelete] = useState(null);

  const queryClient = useQueryClient();
  const { currentCompany } = useCompany();

  const { data: purchaseOrders = [], isLoading } = useQuery({
    queryKey: ['purchase-orders', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.PurchaseOrder.filter({ company_id: currentCompany.id }, '-po_date') : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PurchaseOrder.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['purchase-orders', currentCompany?.id]);
      setDeleteDialogOpen(false);
      setPoToDelete(null);
    }
  });

  const convertToBillMutation = useMutation({
    mutationFn: async (po) => {
      const bill = {
        company_id: currentCompany.id,
        bill_number: `BILL-${po.po_number}`,
        vendor_id: po.vendor_id,
        vendor_name: po.vendor_name,
        bill_date: format(new Date(), 'yyyy-MM-dd'),
        due_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        status: 'pending',
        line_items: po.line_items.map(item => ({
          product_id: item.product_id,
          description: item.description,
          quantity: item.quantity_ordered,
          unit_cost: item.unit_cost,
          tax_rate: item.tax_rate,
          tax_amount: item.tax_amount,
          line_total: item.line_total
        })),
        subtotal: po.subtotal,
        tax_total: po.tax_total,
        total_amount: po.total_amount,
        amount_paid: 0,
        balance_due: po.total_amount,
        reference: po.po_number,
        notes: `Converted from PO ${po.po_number}`
      };

      const createdBill = await base44.entities.Bill.create(bill);
      
      await base44.entities.PurchaseOrder.update(po.id, {
        converted_to_bill: true,
        bill_id: createdBill.id,
        status: 'fully_received'
      });

      return createdBill;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['purchase-orders', currentCompany?.id]);
      queryClient.invalidateQueries(['bills', currentCompany?.id]);
    }
  });

  const filteredPOs = purchaseOrders.filter(po =>
    po.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    po.po_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (po) => {
    setEditingPO(po);
    setShowForm(true);
  };

  const handleDelete = (po) => {
    setPoToDelete(po);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (poToDelete) {
      deleteMutation.mutate(poToDelete.id);
    }
  };

  const handleConvertToBill = (po) => {
    if (window.confirm(`Convert PO ${po.po_number} to a bill?`)) {
      convertToBillMutation.mutate(po);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingPO(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="text-gray-500 mt-1">Manage orders to your vendors</p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Purchase Order
        </Button>
      </div>

      {showForm && (
        <PurchaseOrderForm
          purchaseOrder={editingPO}
          onClose={handleFormClose}
          currentCompany={currentCompany}
        />
      )}

      <Card className="p-6">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by vendor or PO number..."
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
                <TableHead>PO #</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Expected Delivery</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    Loading purchase orders...
                  </TableCell>
                </TableRow>
              ) : filteredPOs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <ShoppingCart className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No purchase orders found</p>
                    <Button 
                      onClick={() => setShowForm(true)}
                      variant="outline"
                      className="mt-3"
                    >
                      Create your first purchase order
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPOs.map((po) => (
                  <TableRow key={po.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{po.po_number}</TableCell>
                    <TableCell>{po.vendor_name}</TableCell>
                    <TableCell>{format(new Date(po.po_date), 'MMM d, yyyy')}</TableCell>
                    <TableCell>
                      {po.expected_delivery_date ? format(new Date(po.expected_delivery_date), 'MMM d, yyyy') : '-'}
                    </TableCell>
                    <TableCell className="font-semibold">${po.total_amount?.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[po.status]}>
                        {po.status.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {!po.converted_to_bill && po.status !== 'cancelled' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleConvertToBill(po)}
                            title="Convert to Bill"
                          >
                            <FileText className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(po)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(po)}
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
            <AlertDialogTitle>Delete Purchase Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete PO "{poToDelete?.po_number}"? 
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
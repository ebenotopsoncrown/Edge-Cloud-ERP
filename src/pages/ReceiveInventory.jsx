
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
import { Plus, Search, Package, CheckCircle, Truck } from "lucide-react";
import { format } from "date-fns";
import { useCompany } from "../components/auth/CompanyContext";
import ReceiveInventoryForm from "../components/inventory/ReceiveInventoryForm";

const statusColors = {
  draft: "bg-gray-100 text-gray-800",
  received: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800"
};

export default function ReceiveInventory() {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { currentCompany } = useCompany();
  const queryClient = useQueryClient();

  const { data: receipts = [], isLoading } = useQuery({
    queryKey: ['inventory-receipts', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.InventoryReceipt.filter({ company_id: currentCompany.id }, '-receipt_date') : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const { data: pendingPOs = [] } = useQuery({
    queryKey: ['pending-pos', currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany) return [];
      const pos = await base44.entities.PurchaseOrder.filter({ 
        company_id: currentCompany.id,
        status: 'sent'
      });
      return pos;
    },
    enabled: !!currentCompany
  });

  const filteredReceipts = receipts.filter(receipt =>
    receipt.receipt_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    receipt.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Receive Inventory</h1>
          <p className="text-gray-500 mt-1">Record goods received from vendors</p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Receive Goods
        </Button>
      </div>

      {showForm && (
        <ReceiveInventoryForm
          onClose={() => setShowForm(false)}
          pendingPOs={pendingPOs}
        />
      )}

      {pendingPOs.length > 0 && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-3">
            <Truck className="w-6 h-6 text-blue-600" />
            <div>
              <p className="font-semibold text-blue-900">
                {pendingPOs.length} Purchase Order{pendingPOs.length !== 1 ? 's' : ''} Awaiting Receipt
              </p>
              <p className="text-sm text-blue-700">Click "Receive Goods" to process incoming inventory</p>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by receipt number or vendor..."
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
                <TableHead>Receipt #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>PO #</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Bill #</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    Loading receipts...
                  </TableCell>
                </TableRow>
              ) : filteredReceipts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No inventory receipts found</p>
                    <Button 
                      onClick={() => setShowForm(true)}
                      variant="outline"
                      className="mt-3"
                    >
                      Record your first receipt
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                filteredReceipts.map((receipt) => (
                  <TableRow key={receipt.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{receipt.receipt_number}</TableCell>
                    <TableCell>{format(new Date(receipt.receipt_date), 'MMM d, yyyy')}</TableCell>
                    <TableCell>{receipt.po_number || 'N/A'}</TableCell>
                    <TableCell>{receipt.vendor_name}</TableCell>
                    <TableCell className="font-semibold">${receipt.total_amount?.toFixed(2)}</TableCell>
                    <TableCell>
                      {receipt.bill_number ? (
                        <span className="text-blue-600 font-medium">{receipt.bill_number}</span>
                      ) : (
                        <span className="text-gray-400">Not created</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[receipt.status]}>
                        {receipt.status}
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

import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, Factory, FileText, Pencil } from "lucide-react";
import { format } from "date-fns";
import WorkOrderForm from "../components/manufacturing/WorkOrderForm";
import BOMForm from "../components/manufacturing/BOMForm";

const statusColors = {
  draft: "bg-gray-100 text-gray-800",
  released: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800"
};

export default function Manufacturing() {
  const [activeTab, setActiveTab] = useState("work-orders");
  const [showWOForm, setShowWOForm] = useState(false);
  const [showBOMForm, setShowBOMForm] = useState(false);
  const [editingWO, setEditingWO] = useState(null);
  const [editingBOM, setEditingBOM] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: workOrders = [], isLoading: loadingWO } = useQuery({
    queryKey: ['work-orders'],
    queryFn: () => base44.entities.WorkOrder.list('-start_date')
  });

  const { data: boms = [], isLoading: loadingBOM } = useQuery({
    queryKey: ['boms'],
    queryFn: () => base44.entities.BillOfMaterials.list()
  });

  const filteredWOs = workOrders.filter(wo =>
    wo.work_order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wo.product_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBOMs = boms.filter(bom =>
    bom.bom_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bom.product_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manufacturing</h1>
          <p className="text-gray-500 mt-1">Manage production and bill of materials</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="work-orders">Work Orders</TabsTrigger>
          <TabsTrigger value="bom">Bill of Materials</TabsTrigger>
        </TabsList>

        <TabsContent value="work-orders" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search work orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => setShowWOForm(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              New Work Order
            </Button>
          </div>

          {showWOForm && (
            <WorkOrderForm
              workOrder={editingWO}
              onClose={() => {
                setShowWOForm(false);
                setEditingWO(null);
              }}
            />
          )}

          <Card className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>WO Number</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Produced</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingWO ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">Loading...</TableCell>
                  </TableRow>
                ) : filteredWOs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <Factory className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500">No work orders found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredWOs.map((wo) => (
                    <TableRow key={wo.id}>
                      <TableCell className="font-medium">{wo.work_order_number}</TableCell>
                      <TableCell>{wo.product_name}</TableCell>
                      <TableCell>{wo.quantity_to_produce}</TableCell>
                      <TableCell>{wo.quantity_produced || 0}</TableCell>
                      <TableCell>{format(new Date(wo.start_date), 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[wo.status]}>{wo.status}</Badge>
                      </TableCell>
                      <TableCell className="font-semibold">${wo.total_cost?.toFixed(2)}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingWO(wo);
                            setShowWOForm(true);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="bom" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search BOMs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => setShowBOMForm(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              New BOM
            </Button>
          </div>

          {showBOMForm && (
            <BOMForm
              bom={editingBOM}
              onClose={() => {
                setShowBOMForm(false);
                setEditingBOM(null);
              }}
            />
          )}

          <Card className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>BOM Number</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Material Cost</TableHead>
                  <TableHead>Labor Cost</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingBOM ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">Loading...</TableCell>
                  </TableRow>
                ) : filteredBOMs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500">No BOMs found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBOMs.map((bom) => (
                    <TableRow key={bom.id}>
                      <TableCell className="font-medium">{bom.bom_number}</TableCell>
                      <TableCell>{bom.product_name}</TableCell>
                      <TableCell>{bom.version}</TableCell>
                      <TableCell>${bom.total_material_cost?.toFixed(2)}</TableCell>
                      <TableCell>${bom.total_labor_cost?.toFixed(2)}</TableCell>
                      <TableCell className="font-semibold">${bom.total_cost?.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge className={bom.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                          {bom.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingBOM(bom);
                            setShowBOMForm(true);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
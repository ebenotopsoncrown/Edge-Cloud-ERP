import React, { useState } from "react";
import { WorkOrder, BillOfMaterials } from "@/api/entities";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Factory, FileText, Pencil, DollarSign, CheckCircle, Clock, Layers } from "lucide-react";
import { format } from "date-fns";
import WorkOrderForm from "../components/manufacturing/WorkOrderForm";
import BOMForm from "../components/manufacturing/BOMForm";
import PageShell, { PageHeader, StatBar, StatusBadge, NewBtn, ActionBtn } from "../components/shared/PageShell";

const STATUS_COLORS = {
  draft:       { bg: '#F8FAFC', color: '#64748B' },
  released:    { bg: '#EBF4FB', color: '#1B4F8A' },
  in_progress: { bg: '#FEF3C7', color: '#B45309' },
  completed:   { bg: '#E6F9F2', color: '#00875A' },
  cancelled:   { bg: '#FEF2F2', color: '#DC2626' },
};

const TABS = [
  { id: 'work-orders', label: 'Work Orders' },
  { id: 'bom',         label: 'Bill of Materials' },
];

export default function Manufacturing() {
  const [activeTab, setActiveTab] = useState("work-orders");
  const [showWOForm, setShowWOForm] = useState(false);
  const [showBOMForm, setShowBOMForm] = useState(false);
  const [editingWO, setEditingWO] = useState(null);
  const [editingBOM, setEditingBOM] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: workOrders = [], isLoading: loadingWO } = useQuery({
    queryKey: ['work-orders'],
    queryFn: () => WorkOrder.list({ orderBy: 'start_date', ascending: false })
  });

  const { data: boms = [], isLoading: loadingBOM } = useQuery({
    queryKey: ['boms'],
    queryFn: () => BillOfMaterials.list()
  });

  const filteredWOs = workOrders.filter(wo =>
    wo.work_order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wo.product_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBOMs = boms.filter(bom =>
    bom.bom_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bom.product_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const completedWOs = workOrders.filter(wo => wo.status === 'completed').length;
  const inProgressWOs = workOrders.filter(wo => wo.status === 'in_progress').length;
  const totalWOCost = workOrders.reduce((s, wo) => s + (wo.total_cost || 0), 0);
  const activeBOMs = boms.filter(b => b.is_active).length;

  const tabBtnStyle = (id) => ({
    padding: '14px 18px',
    fontSize: 13.5,
    fontWeight: activeTab === id ? 700 : 500,
    color: activeTab === id ? '#1B4F8A' : '#64748B',
    background: 'none',
    border: 'none',
    borderBottom: activeTab === id ? '2.5px solid #1B4F8A' : '2.5px solid transparent',
    cursor: 'pointer',
    fontFamily: 'inherit',
  });

  return (
    <PageShell>
      <PageHeader
        title="Manufacturing"
        subtitle="Manage production and bill of materials"
        icon={Factory}
        accentColor="#F59E0B"
        actions={
          activeTab === 'work-orders'
            ? <NewBtn label="New Work Order" onClick={() => { setEditingWO(null); setShowWOForm(true); }} />
            : <NewBtn label="New BOM" onClick={() => { setEditingBOM(null); setShowBOMForm(true); }} />
        }
      />

      <StatBar stats={[
        { label: 'Work Orders', value: workOrders.length, icon: Factory, color: '#F59E0B' },
        { label: 'In Progress', value: inProgressWOs, icon: Clock, color: '#1B4F8A' },
        { label: 'Completed', value: completedWOs, icon: CheckCircle, color: '#00A86B' },
        { label: 'Total WO Cost', value: `$${totalWOCost.toFixed(2)}`, icon: DollarSign, color: '#F59E0B' },
        { label: 'Active BOMs', value: activeBOMs, icon: Layers, color: '#1B4F8A' },
      ]} />

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ position: 'relative', maxWidth: 400 }}>
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={activeTab === 'work-orders' ? 'Search work orders...' : 'Search BOMs...'}
            style={{ width: '100%', padding: '9px 12px 9px 34px', border: '1.5px solid #E2E8F0', borderRadius: 9, fontSize: 13.5, color: '#0F172A', background: 'white', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
          />
          <svg style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#94A3B8' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
        </div>
      </div>

      {/* Inline forms */}
      {showWOForm && (
        <div style={{ marginBottom: 16 }}>
          <WorkOrderForm
            workOrder={editingWO}
            onClose={() => { setShowWOForm(false); setEditingWO(null); }}
          />
        </div>
      )}
      {showBOMForm && (
        <div style={{ marginBottom: 16 }}>
          <BOMForm
            bom={editingBOM}
            onClose={() => { setShowBOMForm(false); setEditingBOM(null); }}
          />
        </div>
      )}

      {/* Tabbed panel */}
      <div style={{ background: 'white', borderRadius: 14, border: '1px solid #F1F5F9', boxShadow: '0 2px 8px rgba(15,43,91,0.06)', overflow: 'hidden' }}>
        {/* Tab buttons */}
        <div style={{ display: 'flex', borderBottom: '1px solid #F1F5F9', padding: '0 16px', gap: 4 }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSearchTerm(''); }} style={tabBtnStyle(tab.id)}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ padding: 24 }}>

          {/* Work Orders Tab */}
          {activeTab === 'work-orders' && (
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
                    <TableCell colSpan={8} style={{ textAlign: 'center', padding: '40px 16px', color: '#94A3B8' }}>
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredWOs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} style={{ textAlign: 'center', padding: '40px 16px' }}>
                      <Factory style={{ width: 36, height: 36, color: '#CBD5E1', margin: '0 auto 10px', display: 'block' }} />
                      <p style={{ fontSize: 14, color: '#94A3B8' }}>No work orders found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredWOs.map((wo) => (
                    <TableRow key={wo.id}>
                      <TableCell style={{ fontWeight: 600 }}>{wo.work_order_number}</TableCell>
                      <TableCell>{wo.product_name}</TableCell>
                      <TableCell>{wo.quantity_to_produce}</TableCell>
                      <TableCell>{wo.quantity_produced || 0}</TableCell>
                      <TableCell>{format(new Date(wo.start_date), 'MMM d, yyyy')}</TableCell>
                      <TableCell><StatusBadge status={wo.status} /></TableCell>
                      <TableCell style={{ fontWeight: 600 }}>${wo.total_cost?.toFixed(2)}</TableCell>
                      <TableCell>
                        <ActionBtn
                          icon={Pencil}
                          variant="ghost"
                          onClick={() => { setEditingWO(wo); setShowWOForm(true); }}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {/* BOM Tab */}
          {activeTab === 'bom' && (
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
                    <TableCell colSpan={8} style={{ textAlign: 'center', padding: '40px 16px', color: '#94A3B8' }}>
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredBOMs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} style={{ textAlign: 'center', padding: '40px 16px' }}>
                      <FileText style={{ width: 36, height: 36, color: '#CBD5E1', margin: '0 auto 10px', display: 'block' }} />
                      <p style={{ fontSize: 14, color: '#94A3B8' }}>No BOMs found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBOMs.map((bom) => (
                    <TableRow key={bom.id}>
                      <TableCell style={{ fontWeight: 600 }}>{bom.bom_number}</TableCell>
                      <TableCell>{bom.product_name}</TableCell>
                      <TableCell>{bom.version}</TableCell>
                      <TableCell>${bom.total_material_cost?.toFixed(2)}</TableCell>
                      <TableCell>${bom.total_labor_cost?.toFixed(2)}</TableCell>
                      <TableCell style={{ fontWeight: 600 }}>${bom.total_cost?.toFixed(2)}</TableCell>
                      <TableCell>
                        <StatusBadge status={bom.is_active ? 'active' : 'inactive'} />
                      </TableCell>
                      <TableCell>
                        <ActionBtn
                          icon={Pencil}
                          variant="ghost"
                          onClick={() => { setEditingBOM(bom); setShowBOMForm(true); }}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

        </div>
      </div>
    </PageShell>
  );
}

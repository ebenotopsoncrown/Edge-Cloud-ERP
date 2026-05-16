import React, { useState } from "react";
import { Product, InventoryTransaction } from "@/api/entities";
import { useQuery } from "@tanstack/react-query";
import { useCompany } from "../components/auth/CompanyContext";
import PageShell, { PageHeader } from "../components/shared/PageShell";
import ProductForm from "../components/products/ProductForm";
import { Plus, Package, AlertTriangle, TrendingUp, DollarSign, Layers } from "lucide-react";
import { formatCurrency } from "../components/shared/FinancialCalculations";

function KpiCard({ title, value, subtitle, icon: Icon, accentColor }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 14,
      boxShadow: '0 2px 8px rgba(15,43,91,0.06)',
      border: '1px solid #F1F5F9',
      padding: '22px 24px',
      borderTop: `3px solid ${accentColor}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            {title}
          </p>
          <p style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>
            {value}
          </p>
          {subtitle && (
            <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 6 }}>{subtitle}</p>
          )}
        </div>
        <div style={{
          width: 44, height: 44, borderRadius: 10,
          background: `${accentColor}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
          <Icon size={20} style={{ color: accentColor }} />
        </div>
      </div>
    </div>
  );
}

export default function InventoryDashboard() {
  const { currentCompany } = useCompany();
  const [showProductForm, setShowProductForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const { data: products = [] } = useQuery({
    queryKey: ['products', currentCompany?.id],
    queryFn: () => currentCompany ? Product.list({ filters: {
      company_id: currentCompany.id,
      product_type: 'inventory'
    } }) : [],
    enabled: !!currentCompany
  });

  // Get inventory transactions to calculate units sold and purchased
  const { data: transactions = [] } = useQuery({
    queryKey: ['inventory-transactions', currentCompany?.id],
    queryFn: () => currentCompany ? InventoryTransaction.list({ filters: {
      company_id: currentCompany.id
    } }) : [],
    enabled: !!currentCompany
  });

  // Calculate inventory metrics for each product
  const inventoryData = products.map(product => {
    const productTransactions = transactions.filter(t => t.product_id === product.id);

    // Calculate beginning balance (from opening balance transactions)
    const openingBalance = productTransactions
      .filter(t => t.transaction_type === 'opening_balance')
      .reduce((sum, t) => sum + (t.quantity_in || 0), 0);

    // Calculate units sold
    const unitsSold = productTransactions
      .filter(t => t.transaction_type === 'sale')
      .reduce((sum, t) => sum + (t.quantity_out || 0), 0);

    // Calculate units purchased
    const unitsPurchased = productTransactions
      .filter(t => t.transaction_type === 'purchase')
      .reduce((sum, t) => sum + (t.quantity_in || 0), 0);

    // Quantity on hand
    const quantityOnHand = product.quantity_on_hand || 0;

    // Value (Quantity × Cost Price)
    const value = quantityOnHand * (product.cost_price || 0);

    return {
      id: product.id,
      itemId: product.sku || product.id.substring(0, 8),
      description: product.product_name,
      beginningBalance: openingBalance,
      unitsSold: unitsSold,
      unitsPurchased: unitsPurchased,
      quantityOnHand: quantityOnHand,
      value: value,
      costPrice: product.cost_price || 0
    };
  });

  // Calculate totals
  const totalValue = inventoryData.reduce((sum, item) => sum + item.value, 0);
  const totalQuantity = inventoryData.reduce((sum, item) => sum + item.quantityOnHand, 0);
  const lowStockItems = inventoryData.filter(item => item.quantityOnHand > 0 && item.quantityOnHand < 5).length;
  const zeroStockItems = inventoryData.filter(item => item.quantityOnHand <= 0).length;

  const handleRowClick = (product) => {
    setSelectedProduct(product);
    setShowProductForm(true);
  };

  const baseCurrency = currentCompany?.base_currency || 'USD';

  return (
    <PageShell>
      {showProductForm && (
        <ProductForm
          product={selectedProduct}
          onClose={() => {
            setShowProductForm(false);
            setSelectedProduct(null);
          }}
        />
      )}

      <PageHeader
        title="Inventory"
        subtitle={`Setup / Maintain · ${currentCompany?.company_name}`}
        icon={Package}
        accentColor="#1B4F8A"
        actions={
          <button
            onClick={() => {
              setSelectedProduct(null);
              setShowProductForm(true);
            }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600,
              background: '#1B4F8A', color: '#fff', border: 'none', cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(27,79,138,0.3)', transition: 'opacity 0.15s'
            }}
          >
            <Plus size={16} /> New Inventory Item
          </button>
        }
      />

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 24 }}>
        <KpiCard
          title="Total Products"
          value={inventoryData.length}
          subtitle="Inventory items"
          icon={Layers}
          accentColor="#1B4F8A"
        />
        <KpiCard
          title="Stock Value"
          value={formatCurrency(totalValue, baseCurrency)}
          subtitle={`${totalQuantity.toFixed(0)} total units`}
          icon={DollarSign}
          accentColor="#00A86B"
        />
        <KpiCard
          title="Low Stock"
          value={lowStockItems}
          subtitle="Items below threshold"
          icon={AlertTriangle}
          accentColor="#F59E0B"
        />
        <KpiCard
          title="Out of Stock"
          value={zeroStockItems}
          subtitle="Items at zero"
          icon={TrendingUp}
          accentColor="#EF4444"
        />
      </div>

      {/* Main Inventory Table */}
      <div style={{
        background: '#fff', borderRadius: 14,
        boxShadow: '0 2px 8px rgba(15,43,91,0.06)',
        border: '1px solid #F1F5F9', overflow: 'hidden', marginBottom: 20
      }}>
        {/* Table Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid #F1F5F9',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#FAFBFC'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8, background: '#EFF6FF',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Package size={18} style={{ color: '#1B4F8A' }} />
            </div>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Inventory Items</p>
          </div>
          <div style={{ fontSize: 13, color: '#64748B', display: 'flex', gap: 20 }}>
            <span><strong style={{ color: '#0F172A' }}>Total Value:</strong> {formatCurrency(totalValue, baseCurrency)}</span>
            <span><strong style={{ color: '#0F172A' }}>Total Units:</strong> {totalQuantity.toFixed(2)}</span>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC' }}>
                {['Item ID', 'Description', 'Beginning Balance', 'Units Sold', 'Units Purchased', 'Qty on Hand', `Value (${baseCurrency})`].map((col, i) => (
                  <th
                    key={col}
                    style={{
                      padding: '11px 16px', fontSize: 12, fontWeight: 700,
                      color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em',
                      textAlign: i >= 2 ? 'right' : 'left',
                      borderBottom: '1px solid #E2E8F0', whiteSpace: 'nowrap'
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {inventoryData.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '48px 24px', color: '#94A3B8' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                      <Package size={40} style={{ color: '#CBD5E1' }} />
                      <p style={{ fontWeight: 600, color: '#64748B' }}>No inventory items yet</p>
                      <p style={{ fontSize: 13 }}>Click "New Inventory Item" to create your first item</p>
                    </div>
                  </td>
                </tr>
              ) : (
                inventoryData.map((item, i) => {
                  const qtyColor = item.quantityOnHand < 0 ? '#EF4444'
                    : item.quantityOnHand === 0 ? '#94A3B8'
                    : '#0F172A';
                  return (
                    <tr
                      key={item.id}
                      onClick={() => {
                        const product = products.find(p => p.id === item.id);
                        handleRowClick(product);
                      }}
                      style={{
                        cursor: 'pointer',
                        borderBottom: '1px solid #F1F5F9',
                        transition: 'background 0.12s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#EFF6FF'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '13px 16px', fontSize: 13, fontFamily: 'monospace', color: '#1B4F8A', fontWeight: 600 }}>
                        {item.itemId}
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 600, color: '#0F172A' }}>
                        {item.description}
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 13, textAlign: 'right', color: '#374151' }}>
                        {item.beginningBalance.toFixed(2)}
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 13, textAlign: 'right', color: '#374151' }}>
                        {item.unitsSold.toFixed(2)}
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 13, textAlign: 'right', color: '#374151' }}>
                        {item.unitsPurchased.toFixed(2)}
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 13, textAlign: 'right', fontWeight: 700, color: qtyColor }}>
                        {item.quantityOnHand.toFixed(2)}
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 13, textAlign: 'right', fontWeight: 700, color: '#0F172A' }}>
                        {formatCurrency(item.value, baseCurrency)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {inventoryData.length > 0 && (
              <tfoot>
                <tr style={{ background: '#F0F4FA', borderTop: '2px solid #E2E8F0' }}>
                  <td colSpan={6} style={{ padding: '13px 16px', fontSize: 13, fontWeight: 700, color: '#374151', textAlign: 'right', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Total
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: 14, fontWeight: 800, color: '#1B4F8A', textAlign: 'right' }}>
                    {formatCurrency(totalValue, baseCurrency)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Info Banner */}
      <div style={{
        background: '#EFF6FF', borderRadius: 12,
        border: '1px solid #BFDBFE', padding: '14px 20px',
        display: 'flex', gap: 12, alignItems: 'center'
      }}>
        <Package size={18} style={{ color: '#1B4F8A', flexShrink: 0 }} />
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#1E3A5F' }}>Inventory Summary</p>
          <p style={{ fontSize: 12, color: '#2563EB', marginTop: 2 }}>
            Real-time inventory movements. Value is calculated as Quantity x Cost Price. Click any row to view or edit item details.
          </p>
        </div>
      </div>
    </PageShell>
  );
}

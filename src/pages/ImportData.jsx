import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileSpreadsheet, Users, Building2, Package, Book, Download, AlertCircle, Info } from "lucide-react";
import { useCompany } from "../components/auth/CompanyContext";
import ImportChartOfAccounts from "../components/import/ImportChartOfAccounts";
import ImportCustomers from "../components/import/ImportCustomers";
import ImportVendors from "../components/import/ImportVendors";
import ImportProducts from "../components/import/ImportProducts";
import PageShell, { PageHeader, ActionBtn } from "../components/shared/PageShell";

export default function ImportData() {
  const { currentCompany } = useCompany();
  const [activeTab, setActiveTab] = useState("accounts");

  const downloadTemplate = (type) => {
    const templates = {
      accounts: {
        content: "account_code,account_name,account_type,account_category,description,opening_balance\n1000,Cash,asset,current_asset,Cash on hand,5000\n1200,Accounts Receivable,asset,current_asset,Customer receivables,15000\n2000,Accounts Payable,liability,current_liability,Vendor payables,8000\n3000,Owner's Capital,equity,equity,Owner's equity,50000\n4000,Sales Revenue,revenue,operating_revenue,Product sales,0",
        filename: "chart_of_accounts_template.csv"
      },
      customers: {
        content: "customer_code,company_name,contact_person,email,phone,street,city,state,postal_code,country,credit_limit,payment_terms,opening_balance\nCUST001,ABC Corporation,John Smith,john@abc.com,555-0100,123 Main St,New York,NY,10001,USA,10000,net_30,2500\nCUST002,XYZ Industries,Jane Doe,jane@xyz.com,555-0200,456 Oak Ave,Los Angeles,CA,90001,USA,15000,net_30,0",
        filename: "customers_template.csv"
      },
      vendors: {
        content: "vendor_code,company_name,contact_person,email,phone,street,city,state,postal_code,country,payment_terms,opening_balance\nVEND001,Office Supplies Co,Bob Johnson,bob@office.com,555-0300,789 Pine St,Chicago,IL,60601,USA,net_30,1500\nVEND002,Tech Solutions Inc,Alice Brown,alice@tech.com,555-0400,321 Elm St,Boston,MA,02101,USA,net_30,0",
        filename: "vendors_template.csv"
      },
      products: {
        content: "sku,product_name,description,category,product_type,unit_price,cost_price,unit_of_measure,quantity_on_hand,reorder_level,tax_rate\nPRD001,Office Chair,Ergonomic office chair,Furniture,inventory,199.99,120.00,unit,50,10,7.5\nPRD002,Consulting Service,Hourly consulting,Services,service,150.00,0,hour,0,0,0\nPRD003,Printer Paper,A4 printer paper,Supplies,inventory,25.99,15.00,ream,200,50,7.5",
        filename: "products_template.csv"
      }
    };
    const t = templates[type];
    if (!t) return;
    const blob = new Blob([t.content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = t.filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); window.URL.revokeObjectURL(url);
  };

  if (!currentCompany) {
    return (
      <PageShell>
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '48px', textAlign: 'center', color: '#94A3B8', fontSize: 14 }}>
          Please select a company first
        </div>
      </PageShell>
    );
  }

  const STEPS = [
    { n: 1, label: 'Download CSV template for the data type you want to import' },
    { n: 2, label: 'Fill in your data in Excel or any spreadsheet software' },
    { n: 3, label: 'Save the file as CSV format' },
    { n: 4, label: 'Upload the CSV file using the upload button below' },
    { n: 5, label: 'Preview and validate the data' },
    { n: 6, label: 'Click "Import" to create the records' },
  ];

  const TAB_CONFIG = {
    accounts:  { label: 'Chart of Accounts', icon: Book,      title: 'Import Chart of Accounts',  subtitle: 'Upload CSV file with account information' },
    customers: { label: 'Customers',          icon: Users,     title: 'Import Customers',            subtitle: 'Upload CSV file with customer information' },
    vendors:   { label: 'Vendors',            icon: Building2, title: 'Import Vendors',              subtitle: 'Upload CSV file with vendor information' },
    products:  { label: 'Products',           icon: Package,   title: 'Import Products',             subtitle: 'Upload CSV file with product/inventory information' },
  };

  const IMPORT_COMPONENTS = { accounts: ImportChartOfAccounts, customers: ImportCustomers, vendors: ImportVendors, products: ImportProducts };

  return (
    <PageShell>
      <PageHeader
        title="Import Data"
        subtitle={`Bulk import from CSV/Excel · ${currentCompany.company_name}`}
        icon={Upload}
        accentColor="#1B4F8A"
      />

      {/* Instructions */}
      <div style={{ background: '#EBF4FB', border: '1.5px solid #BFDBFE', borderRadius: 12, padding: '18px 20px', marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <FileSpreadsheet style={{ width: 18, height: 18, color: '#1B4F8A', flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: 14, fontWeight: 700, color: '#1B4F8A' }}>How to Import Data</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
          {STEPS.map(step => (
            <div key={step.n} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#1B4F8A', color: 'white', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{step.n}</span>
              <span style={{ fontSize: 12.5, color: '#1E3A5F' }}>{step.label}</span>
            </div>
          ))}
        </div>
        <div style={{ background: '#FEF9C3', border: '1px solid #FDE047', borderRadius: 8, padding: '10px 14px' }}>
          <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
            <AlertCircle style={{ width: 14, height: 14, color: '#854D0E', flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ fontSize: 12.5, fontWeight: 700, color: '#854D0E', marginBottom: 4 }}>Important Notes:</p>
              <ul style={{ fontSize: 12, color: '#713F12', paddingLeft: 14, margin: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <li>All required fields must be filled</li>
                <li>Account types and categories must match exact values</li>
                <li>Opening balances will post journal entries automatically</li>
                <li>Invalid rows will be skipped with error messages</li>
                <li>Duplicate codes will be skipped</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList style={{ display: 'flex', gap: 4, background: '#F1F5F9', padding: 4, borderRadius: 10, width: 'fit-content', marginBottom: 20 }}>
          {Object.entries(TAB_CONFIG).map(([key, cfg]) => (
            <TabsTrigger
              key={key}
              value={key}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 7, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', background: activeTab === key ? 'white' : 'transparent', color: activeTab === key ? '#1B4F8A' : '#64748B', boxShadow: activeTab === key ? '0 1px 4px rgba(15,43,91,0.10)' : 'none' }}
            >
              <cfg.icon style={{ width: 14, height: 14 }} />
              {cfg.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(TAB_CONFIG).map(([key, cfg]) => {
          const ImportComp = IMPORT_COMPONENTS[key];
          return (
            <TabsContent key={key} value={key}>
              <div style={{ background: 'white', borderRadius: 14, border: '1.5px solid #E2E8F0', boxShadow: '0 2px 12px rgba(15,43,91,0.07)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #F1F5F9', background: '#F8FAFC' }}>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>{cfg.title}</p>
                    <p style={{ fontSize: 12.5, color: '#64748B', marginTop: 2 }}>{cfg.subtitle}</p>
                  </div>
                  <button
                    onClick={() => downloadTemplate(key)}
                    style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', border: '1.5px solid #E2E8F0', borderRadius: 8, background: 'white', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    <Download style={{ width: 14, height: 14 }} />
                    Download Template
                  </button>
                </div>
                <div style={{ padding: '24px' }}>
                  <ImportComp />
                </div>
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </PageShell>
  );
}

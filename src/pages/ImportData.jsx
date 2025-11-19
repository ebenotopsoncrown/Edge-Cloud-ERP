import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileSpreadsheet, Users, Building2, Package, Book, Download } from "lucide-react";
import { useCompany } from "../components/auth/CompanyContext";
import ImportChartOfAccounts from "../components/import/ImportChartOfAccounts";
import ImportCustomers from "../components/import/ImportCustomers";
import ImportVendors from "../components/import/ImportVendors";
import ImportProducts from "../components/import/ImportProducts";

export default function ImportData() {
  const { currentCompany } = useCompany();
  const [activeTab, setActiveTab] = useState("accounts");

  const downloadTemplate = (type) => {
    let csvContent = "";
    let filename = "";

    switch(type) {
      case "accounts":
        csvContent = "account_code,account_name,account_type,account_category,description,opening_balance\n" +
                     "1000,Cash,asset,current_asset,Cash on hand,5000\n" +
                     "1200,Accounts Receivable,asset,current_asset,Customer receivables,15000\n" +
                     "2000,Accounts Payable,liability,current_liability,Vendor payables,8000\n" +
                     "3000,Owner's Capital,equity,equity,Owner's equity,50000\n" +
                     "4000,Sales Revenue,revenue,operating_revenue,Product sales,0";
        filename = "chart_of_accounts_template.csv";
        break;
      
      case "customers":
        csvContent = "customer_code,company_name,contact_person,email,phone,street,city,state,postal_code,country,credit_limit,payment_terms,opening_balance\n" +
                     "CUST001,ABC Corporation,John Smith,john@abc.com,555-0100,123 Main St,New York,NY,10001,USA,10000,net_30,2500\n" +
                     "CUST002,XYZ Industries,Jane Doe,jane@xyz.com,555-0200,456 Oak Ave,Los Angeles,CA,90001,USA,15000,net_30,0";
        filename = "customers_template.csv";
        break;
      
      case "vendors":
        csvContent = "vendor_code,company_name,contact_person,email,phone,street,city,state,postal_code,country,payment_terms,opening_balance\n" +
                     "VEND001,Office Supplies Co,Bob Johnson,bob@office.com,555-0300,789 Pine St,Chicago,IL,60601,USA,net_30,1500\n" +
                     "VEND002,Tech Solutions Inc,Alice Brown,alice@tech.com,555-0400,321 Elm St,Boston,MA,02101,USA,net_30,0";
        filename = "vendors_template.csv";
        break;
      
      case "products":
        csvContent = "sku,product_name,description,category,product_type,unit_price,cost_price,unit_of_measure,quantity_on_hand,reorder_level,tax_rate\n" +
                     "PRD001,Office Chair,Ergonomic office chair,Furniture,inventory,199.99,120.00,unit,50,10,7.5\n" +
                     "PRD002,Consulting Service,Hourly consulting,Services,service,150.00,0,hour,0,0,0\n" +
                     "PRD003,Printer Paper,A4 printer paper,Supplies,inventory,25.99,15.00,ream,200,50,7.5";
        filename = "products_template.csv";
        break;
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (!currentCompany) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500">Please select a company first</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Import Data</h1>
        <p className="text-gray-500 mt-1">Bulk import data from Excel/CSV files for {currentCompany.company_name}</p>
      </div>

      {/* Instructions Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg text-blue-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            How to Import Data
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-900 space-y-2 text-sm">
          <p><strong>Step 1:</strong> Download the CSV template for the data type you want to import</p>
          <p><strong>Step 2:</strong> Fill in your data in Excel or any spreadsheet software</p>
          <p><strong>Step 3:</strong> Save the file as CSV format</p>
          <p><strong>Step 4:</strong> Upload the CSV file using the upload button</p>
          <p><strong>Step 5:</strong> Preview and validate the data</p>
          <p><strong>Step 6:</strong> Click "Import" to create the records</p>
          <div className="bg-yellow-100 border border-yellow-300 p-3 rounded mt-4">
            <p className="font-semibold">⚠️ Important Notes:</p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>All required fields must be filled</li>
              <li>Account types and categories must match exact values</li>
              <li>Opening balances will post journal entries automatically</li>
              <li>Invalid rows will be skipped with error messages</li>
              <li>Duplicate codes will be skipped</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="accounts" className="flex items-center gap-2">
            <Book className="w-4 h-4" />
            <span className="hidden sm:inline">Chart of Accounts</span>
            <span className="sm:hidden">Accounts</span>
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Customers
          </TabsTrigger>
          <TabsTrigger value="vendors" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Vendors
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Products
          </TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Import Chart of Accounts</CardTitle>
                <p className="text-sm text-gray-500 mt-1">Upload CSV file with account information</p>
              </div>
              <Button 
                variant="outline"
                onClick={() => downloadTemplate("accounts")}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Template
              </Button>
            </CardHeader>
            <CardContent>
              <ImportChartOfAccounts />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Import Customers</CardTitle>
                <p className="text-sm text-gray-500 mt-1">Upload CSV file with customer information</p>
              </div>
              <Button 
                variant="outline"
                onClick={() => downloadTemplate("customers")}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Template
              </Button>
            </CardHeader>
            <CardContent>
              <ImportCustomers />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendors" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Import Vendors</CardTitle>
                <p className="text-sm text-gray-500 mt-1">Upload CSV file with vendor information</p>
              </div>
              <Button 
                variant="outline"
                onClick={() => downloadTemplate("vendors")}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Template
              </Button>
            </CardHeader>
            <CardContent>
              <ImportVendors />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Import Products</CardTitle>
                <p className="text-sm text-gray-500 mt-1">Upload CSV file with product/inventory information</p>
              </div>
              <Button 
                variant="outline"
                onClick={() => downloadTemplate("products")}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Template
              </Button>
            </CardHeader>
            <CardContent>
              <ImportProducts />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
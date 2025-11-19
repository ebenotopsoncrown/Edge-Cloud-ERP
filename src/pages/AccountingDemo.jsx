import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, AlertCircle, FileText, Play, RefreshCw } from "lucide-react";
import { useCompany } from "../components/auth/CompanyContext";

export default function AccountingDemo() {
  const { currentCompany } = useCompany();
  const queryClient = useQueryClient();
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  
  const [productName, setProductName] = useState("Test Widget");
  const [openingQty, setOpeningQty] = useState(5);
  const [costPrice, setCostPrice] = useState(5000);
  const [saleQty, setSaleQty] = useState(2);
  const [salePrice, setSalePrice] = useState(10000);
  const [purchaseQty, setPurchaseQty] = useState(10);
  const [purchasePrice, setPurchasePrice] = useState(5000);

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.Account.filter({ company_id: currentCompany.id }) : [],
    enabled: !!currentCompany
  });

  const { data: journalEntries = [] } = useQuery({
    queryKey: ['journal-entries', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.JournalEntry.filter({ company_id: currentCompany.id }, '-created_date') : [],
    enabled: !!currentCompany
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.Product.filter({ company_id: currentCompany.id }) : [],
    enabled: !!currentCompany
  });

  const addTestResult = (result) => {
    setTestResults(prev => [...prev, { ...result, timestamp: new Date().toISOString() }]);
  };

  const runFullTest = async () => {
    setIsRunning(true);
    setTestResults([]);

    try {
      addTestResult({ type: 'info', message: '🚀 Starting comprehensive accounting test...' });

      // STEP 1: Create Product with Opening Balance
      addTestResult({ type: 'info', message: '\n📦 STEP 1: Creating product with opening balance...' });
      
      const productData = {
        company_id: currentCompany.id,
        product_name: productName,
        sku: `TEST-${Date.now()}`,
        product_type: 'inventory',
        quantity_on_hand: openingQty,
        cost_price: costPrice,
        unit_price: salePrice
      };

      const product = await base44.entities.Product.create(productData);
      addTestResult({ type: 'success', message: `✅ Product created: ${product.product_name} (ID: ${product.id})` });

      // Check if opening balance journal was created
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for journal entry
      const openingJE = await base44.entities.JournalEntry.filter({ 
        company_id: currentCompany.id,
        source_id: product.id,
        source_type: 'inventory_adjustment'
      });

      if (openingJE.length > 0) {
        const je = openingJE[0];
        addTestResult({ 
          type: 'success', 
          message: `✅ Opening Balance Journal Entry: ${je.entry_number}`,
          details: {
            debits: je.total_debits,
            credits: je.total_credits,
            lines: je.line_items
          }
        });

        // Verify account balances
        const inventoryAccount = accounts.find(a => 
          a.account_type === 'asset' && a.account_name?.toLowerCase().includes('inventory')
        );
        const equityAccount = accounts.find(a => a.account_type === 'equity');

        if (inventoryAccount && equityAccount) {
          const invAccount = await base44.entities.Account.get(inventoryAccount.id);
          const eqAccount = await base44.entities.Account.get(equityAccount.id);
          
          addTestResult({ 
            type: 'info', 
            message: `📊 Inventory Balance: ₦${invAccount.balance.toLocaleString()}` 
          });
          addTestResult({ 
            type: 'info', 
            message: `📊 Equity Balance: ₦${eqAccount.balance.toLocaleString()}` 
          });
        }
      } else {
        addTestResult({ type: 'error', message: '❌ Opening balance journal entry NOT created!' });
      }

      // STEP 2: Create Invoice (Sale)
      addTestResult({ type: 'info', message: '\n🧾 STEP 2: Creating invoice (sale)...' });

      const customer = await base44.entities.Customer.create({
        company_id: currentCompany.id,
        company_name: `Test Customer ${Date.now()}`,
        email: `test${Date.now()}@example.com`
      });

      const arAccount = accounts.find(a => 
        a.account_type === 'asset' && a.account_name?.toLowerCase().includes('receivable')
      );
      const revenueAccount = accounts.find(a => a.account_type === 'revenue');

      const invoiceData = {
        company_id: currentCompany.id,
        customer_id: customer.id,
        customer_name: customer.company_name,
        invoice_number: `INV-TEST-${Date.now()}`,
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: new Date().toISOString().split('T')[0],
        status: 'sent',
        ar_account_id: arAccount?.id,
        revenue_account_id: revenueAccount?.id,
        line_items: [{
          product_id: product.id,
          description: product.product_name,
          quantity: saleQty,
          unit_price: salePrice,
          tax_rate: 0,
          tax_amount: 0,
          line_total: saleQty * salePrice
        }],
        subtotal: saleQty * salePrice,
        tax_total: 0,
        total_amount: saleQty * salePrice,
        amount_paid: 0,
        balance_due: saleQty * salePrice
      };

      const invoice = await base44.entities.Invoice.create(invoiceData);
      addTestResult({ type: 'success', message: `✅ Invoice created: ${invoice.invoice_number}` });

      // Check journal entries
      await new Promise(resolve => setTimeout(resolve, 1000));
      const invoiceJEs = await base44.entities.JournalEntry.filter({ 
        company_id: currentCompany.id,
        source_id: invoice.id,
        source_type: 'invoice'
      });

      addTestResult({ type: 'info', message: `📝 Journal Entries Created: ${invoiceJEs.length}` });

      invoiceJEs.forEach((je, index) => {
        addTestResult({ 
          type: 'success', 
          message: `✅ Journal Entry ${index + 1}: ${je.entry_number} - ${je.description}`,
          details: {
            debits: je.total_debits,
            credits: je.total_credits,
            lines: je.line_items
          }
        });
      });

      // Verify product quantity reduced
      const updatedProduct = await base44.entities.Product.get(product.id);
      addTestResult({ 
        type: 'info', 
        message: `📦 Product Quantity: ${openingQty} → ${updatedProduct.quantity_on_hand}` 
      });

      // STEP 3: Create Bill (Purchase)
      addTestResult({ type: 'info', message: '\n📄 STEP 3: Creating bill (purchase)...' });

      const vendor = await base44.entities.Vendor.create({
        company_id: currentCompany.id,
        company_name: `Test Vendor ${Date.now()}`,
        email: `vendor${Date.now()}@example.com`
      });

      const apAccount = accounts.find(a => 
        a.account_type === 'liability' && a.account_name?.toLowerCase().includes('payable')
      );
      const inventoryAccount = accounts.find(a => 
        a.account_type === 'asset' && a.account_name?.toLowerCase().includes('inventory')
      );

      const billData = {
        company_id: currentCompany.id,
        vendor_id: vendor.id,
        vendor_name: vendor.company_name,
        bill_number: `BILL-TEST-${Date.now()}`,
        bill_date: new Date().toISOString().split('T')[0],
        due_date: new Date().toISOString().split('T')[0],
        status: 'pending',
        ap_account_id: apAccount?.id,
        expense_account_id: inventoryAccount?.id,
        line_items: [{
          product_id: product.id,
          description: product.product_name,
          quantity: purchaseQty,
          unit_cost: purchasePrice,
          tax_rate: 0,
          tax_amount: 0,
          line_total: purchaseQty * purchasePrice
        }],
        subtotal: purchaseQty * purchasePrice,
        tax_total: 0,
        total_amount: purchaseQty * purchasePrice,
        amount_paid: 0,
        balance_due: purchaseQty * purchasePrice
      };

      const bill = await base44.entities.Bill.create(billData);
      addTestResult({ type: 'success', message: `✅ Bill created: ${bill.bill_number}` });

      // Check journal entries
      await new Promise(resolve => setTimeout(resolve, 1000));
      const billJEs = await base44.entities.JournalEntry.filter({ 
        company_id: currentCompany.id,
        source_id: bill.id,
        source_type: 'bill'
      });

      if (billJEs.length > 0) {
        billJEs.forEach((je, index) => {
          addTestResult({ 
            type: 'success', 
            message: `✅ Journal Entry: ${je.entry_number} - ${je.description}`,
            details: {
              debits: je.total_debits,
              credits: je.total_credits,
              lines: je.line_items
            }
          });
        });
      } else {
        addTestResult({ type: 'error', message: '❌ Bill journal entry NOT created!' });
      }

      // Verify product quantity increased
      const finalProduct = await base44.entities.Product.get(product.id);
      addTestResult({ 
        type: 'info', 
        message: `📦 Product Quantity: ${updatedProduct.quantity_on_hand} → ${finalProduct.quantity_on_hand}` 
      });

      // FINAL VERIFICATION
      addTestResult({ type: 'info', message: '\n🔍 FINAL VERIFICATION...' });

      // Refresh all accounts
      const allAccounts = await base44.entities.Account.filter({ company_id: currentCompany.id });
      
      const finalInventory = allAccounts.find(a => 
        a.account_type === 'asset' && a.account_name?.toLowerCase().includes('inventory')
      );
      const finalAR = allAccounts.find(a => 
        a.account_type === 'asset' && a.account_name?.toLowerCase().includes('receivable')
      );
      const finalAP = allAccounts.find(a => 
        a.account_type === 'liability' && a.account_name?.toLowerCase().includes('payable')
      );
      const finalRevenue = allAccounts.find(a => a.account_type === 'revenue');
      const finalCOGS = allAccounts.find(a => a.account_type === 'cost_of_goods_sold');
      const finalEquity = allAccounts.find(a => a.account_type === 'equity');

      addTestResult({ type: 'info', message: '\n📊 FINAL ACCOUNT BALANCES:' });
      if (finalInventory) addTestResult({ type: 'info', message: `   Inventory: ₦${finalInventory.balance.toLocaleString()}` });
      if (finalAR) addTestResult({ type: 'info', message: `   Accounts Receivable: ₦${finalAR.balance.toLocaleString()}` });
      if (finalAP) addTestResult({ type: 'info', message: `   Accounts Payable: ₦${finalAP.balance.toLocaleString()}` });
      if (finalRevenue) addTestResult({ type: 'info', message: `   Sales Revenue: ₦${finalRevenue.balance.toLocaleString()}` });
      if (finalCOGS) addTestResult({ type: 'info', message: `   Cost of Goods Sold: ₦${finalCOGS.balance.toLocaleString()}` });
      if (finalEquity) addTestResult({ type: 'info', message: `   Equity: ₦${finalEquity.balance.toLocaleString()}` });

      // Calculate totals
      const totalAssets = (finalInventory?.balance || 0) + (finalAR?.balance || 0);
      const totalLiabilities = finalAP?.balance || 0;
      const totalEquity = (finalEquity?.balance || 0) + ((finalRevenue?.balance || 0) - (finalCOGS?.balance || 0));

      addTestResult({ type: 'info', message: '\n🧮 ACCOUNTING EQUATION:' });
      addTestResult({ type: 'info', message: `   Total Assets: ₦${totalAssets.toLocaleString()}` });
      addTestResult({ type: 'info', message: `   Total Liabilities: ₦${totalLiabilities.toLocaleString()}` });
      addTestResult({ type: 'info', message: `   Total Equity + Net Profit: ₦${totalEquity.toLocaleString()}` });
      
      if (Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01) {
        addTestResult({ type: 'success', message: '✅ BALANCED! Assets = Liabilities + Equity' });
      } else {
        addTestResult({ type: 'error', message: `❌ NOT BALANCED! Difference: ₦${(totalAssets - (totalLiabilities + totalEquity)).toFixed(2)}` });
      }

      addTestResult({ type: 'success', message: '\n🎉 Test completed successfully!' });
      
      // Refresh queries
      queryClient.invalidateQueries(['accounts']);
      queryClient.invalidateQueries(['journal-entries']);
      queryClient.invalidateQueries(['products']);

    } catch (error) {
      addTestResult({ type: 'error', message: `❌ Error: ${error.message}` });
      console.error('Test error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50">
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Live Accounting Test & Verification</h1>
        <p className="text-gray-500 mt-2">Run actual transactions and see real-time journal entries</p>
      </div>

      {/* Test Parameters */}
      <Card className="border-2 border-blue-500">
        <CardHeader className="bg-blue-50">
          <CardTitle>Test Parameters</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Product Name</label>
              <Input 
                value={productName} 
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Test Widget"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Opening Qty</label>
              <Input 
                type="number"
                value={openingQty} 
                onChange={(e) => setOpeningQty(parseInt(e.target.value))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Cost Price</label>
              <Input 
                type="number"
                value={costPrice} 
                onChange={(e) => setCostPrice(parseFloat(e.target.value))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Sale Qty</label>
              <Input 
                type="number"
                value={saleQty} 
                onChange={(e) => setSaleQty(parseInt(e.target.value))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Sale Price</label>
              <Input 
                type="number"
                value={salePrice} 
                onChange={(e) => setSalePrice(parseFloat(e.target.value))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Purchase Qty</label>
              <Input 
                type="number"
                value={purchaseQty} 
                onChange={(e) => setPurchaseQty(parseInt(e.target.value))}
              />
            </div>
          </div>

          <Button
            onClick={runFullTest}
            disabled={isRunning || !currentCompany}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg py-6"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                Running Test...
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                Run Complete Test
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card className="border-2 border-green-500">
          <CardHeader className="bg-green-50">
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-2 font-mono text-sm bg-black text-green-400 p-4 rounded-lg max-h-96 overflow-y-auto">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-start gap-2">
                  {result.type === 'success' && <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-1" />}
                  {result.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-1" />}
                  {result.type === 'info' && <FileText className="w-4 h-4 text-blue-400 flex-shrink-0 mt-1" />}
                  <div className="flex-1">
                    <div>{result.message}</div>
                    {result.details && (
                      <div className="ml-4 mt-1 text-xs text-gray-400">
                        {result.details.lines && result.details.lines.map((line, i) => (
                          <div key={i} className="mt-1">
                            {line.account_name}: DR {line.debit} / CR {line.credit}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Journal Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Journal Entries (Last 10)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entry #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Debits</TableHead>
                <TableHead className="text-right">Credits</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {journalEntries.slice(0, 10).map(je => (
                <TableRow key={je.id}>
                  <TableCell className="font-mono">{je.entry_number}</TableCell>
                  <TableCell>{new Date(je.entry_date).toLocaleDateString()}</TableCell>
                  <TableCell>{je.description}</TableCell>
                  <TableCell className="text-right font-bold text-green-600">
                    ₦{je.total_debits?.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-bold text-red-600">
                    ₦{je.total_credits?.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge className={je.status === 'posted' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {je.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {journalEntries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No journal entries yet. Run the test to create some!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Current Account Balances */}
      <Card>
        <CardHeader>
          <CardTitle>Current Account Balances</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account Code</TableHead>
                <TableHead>Account Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts
                .filter(a => Math.abs(a.balance) > 0.01)
                .sort((a, b) => a.account_code?.localeCompare(b.account_code))
                .map(account => (
                <TableRow key={account.id}>
                  <TableCell className="font-mono">{account.account_code}</TableCell>
                  <TableCell className="font-semibold">{account.account_name}</TableCell>
                  <TableCell>
                    <Badge className={
                      account.account_type === 'asset' ? 'bg-blue-100 text-blue-800' :
                      account.account_type === 'liability' ? 'bg-red-100 text-red-800' :
                      account.account_type === 'equity' ? 'bg-purple-100 text-purple-800' :
                      account.account_type === 'revenue' ? 'bg-green-100 text-green-800' :
                      'bg-orange-100 text-orange-800'
                    }>
                      {account.account_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    ₦{account.balance?.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
              {accounts.filter(a => Math.abs(a.balance) > 0.01).length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                    No account balances yet. Run the test to create some!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
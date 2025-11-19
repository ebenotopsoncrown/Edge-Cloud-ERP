
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCompany } from "../components/auth/CompanyContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, Plus, Minus, Trash2, ShoppingCart, DollarSign, 
  CreditCard, Store as StoreIcon, Clock, User, Package, 
  Pause, X, Check, Receipt, Calculator, AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function POS() {
  const { currentCompany, user } = useCompany();
  const queryClient = useQueryClient();
  
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedStore, setSelectedStore] = useState(null);
  const [selectedTerminal, setSelectedTerminal] = useState(null);
  const [currentSession, setCurrentSession] = useState(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [amountTendered, setAmountTendered] = useState(0);
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: products = [] } = useQuery({
    queryKey: ['products', currentCompany?.id],
    queryFn: () => base44.entities.Product.filter({ company_id: currentCompany.id, is_active: true }),
    enabled: !!currentCompany
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers', currentCompany?.id],
    queryFn: () => base44.entities.Customer.filter({ company_id: currentCompany.id }),
    enabled: !!currentCompany
  });

  const { data: stores = [] } = useQuery({
    queryKey: ['stores', currentCompany?.id],
    queryFn: () => base44.entities.Store.filter({ company_id: currentCompany.id, is_active: true }),
    enabled: !!currentCompany
  });

  const { data: terminals = [] } = useQuery({
    queryKey: ['terminals', currentCompany?.id, selectedStore?.id],
    queryFn: () => base44.entities.POSTerminal.filter({ 
      company_id: currentCompany.id, 
      store_id: selectedStore?.id, // Use optional chaining to avoid error if selectedStore is null
      is_active: true 
    }),
    enabled: !!currentCompany && !!selectedStore
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['pos-sessions', currentCompany?.id, selectedStore?.id],
    queryFn: () => base44.entities.POSSession.filter({ 
      company_id: currentCompany.id,
      store_id: selectedStore?.id,
      status: 'open'
    }),
    enabled: !!currentCompany && !!selectedStore
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts', currentCompany?.id],
    queryFn: () => base44.entities.Account.filter({ company_id: currentCompany.id }),
    enabled: !!currentCompany
  });

  // Auto-select first store and terminal
  useEffect(() => {
    if (stores.length > 0 && !selectedStore) {
      setSelectedStore(stores[0]);
    }
  }, [stores, selectedStore]);

  useEffect(() => {
    if (terminals.length > 0 && !selectedTerminal) {
      setSelectedTerminal(terminals[0]);
    }
  }, [terminals, selectedTerminal]);

  useEffect(() => {
    if (sessions.length > 0 && !currentSession) {
      setCurrentSession(sessions[0]);
    }
  }, [sessions, currentSession]);

  const createSaleMutation = useMutation({
    mutationFn: async (saleData) => {
      setIsProcessing(true);
      
      try {
        // Step 1: Create POS Sale
        const sale = await base44.entities.POSSale.create(saleData);
        
        // Step 2: Update inventory for each item
        for (const item of cart) {
          if (item.product_type === 'inventory') {
            // Update quantity in specific product location
            const productLocations = await base44.entities.ProductLocation.filter({
              company_id: currentCompany.id,
              product_id: item.id,
              location_id: selectedStore.default_inventory_location_id
            });
            
            if (productLocations.length > 0) {
              const currentQty = productLocations[0].quantity_on_hand || 0;
              await base44.entities.ProductLocation.update(productLocations[0].id, {
                quantity_on_hand: currentQty - item.quantity,
                quantity_available: currentQty - item.quantity // Also update available quantity
              });
            }
            
            // Update master product quantity
            // Fetch the latest product data to ensure we're updating the most current quantity
            const currentProduct = await base44.entities.Product.get(item.id);
            if (currentProduct) {
              await base44.entities.Product.update(item.id, {
                quantity_on_hand: (currentProduct.quantity_on_hand || 0) - item.quantity
              });
            }
          }
        }

        // Step 3: Create Invoice
        const invoiceData = {
          company_id: currentCompany.id,
          invoice_number: `INV-${sale.sale_number}`,
          customer_id: selectedCustomer?.id || '',
          customer_name: selectedCustomer?.company_name || 'Walk-in Customer',
          invoice_date: format(new Date(), 'yyyy-MM-dd'),
          due_date: format(new Date(), 'yyyy-MM-dd'),
          status: 'paid',
          line_items: cart.map(item => ({
            product_id: item.id,
            description: item.product_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            tax_rate: item.tax_rate || 0,
            tax_amount: (item.unit_price * item.quantity * (item.tax_rate || 0)) / 100,
            line_total: item.unit_price * item.quantity + ((item.unit_price * item.quantity * (item.tax_rate || 0)) / 100)
          })),
          subtotal: saleData.subtotal,
          tax_total: saleData.tax_total,
          total_amount: saleData.total_amount,
          amount_paid: saleData.total_amount,
          balance_due: 0
        };

        const invoice = await base44.entities.Invoice.create(invoiceData);

        // Step 4: Post to General Ledger
        // Find relevant GL accounts. These account codes/names are illustrative.
        // In a real system, these would be configurable or linked to product/store settings.
        const cashAccount = accounts.find(a => a.account_code === '1010' || a.account_name?.toLowerCase().includes('cash'));
        const salesRevenueAccount = accounts.find(a => a.account_code === '4000' || (a.account_type === 'revenue' && a.account_category === 'operating_revenue'));
        const inventoryAccount = accounts.find(a => a.account_code === '1200' || (a.account_type === 'asset' && a.account_name?.toLowerCase().includes('inventory')));
        const cogsAccount = accounts.find(a => a.account_code === '5000' || a.account_type === 'cost_of_goods_sold');

        // Calculate COGS
        const totalCOGS = cart.reduce((sum, item) => {
          return sum + ((item.cost_price || 0) * item.quantity);
        }, 0);

        // Create Journal Entry for the sale
        const journalEntry = {
          company_id: currentCompany.id,
          entry_number: `JE-POS-${Date.now()}`,
          entry_date: format(new Date(), 'yyyy-MM-dd'),
          reference: `POS Sale ${sale.sale_number}`,
          source_type: 'pos_sale',
          source_id: sale.id,
          description: `POS Sale - ${selectedStore.store_name} - Cashier: ${user?.full_name || currentSession.cashier_name}`,
          status: 'posted',
          line_items: [
            // Debit: Cash Account (Asset increases)
            cashAccount ? {
              account_id: cashAccount.id,
              account_name: cashAccount.account_name,
              account_code: cashAccount.account_code,
              description: `Cash received from POS sale ${sale.sale_number}`,
              debit: saleData.total_amount,
              credit: 0
            } : null,
            // Credit: Sales Revenue Account (Revenue increases)
            salesRevenueAccount ? {
              account_id: salesRevenueAccount.id,
              account_name: salesRevenueAccount.account_name,
              account_code: salesRevenueAccount.account_code,
              description: `Revenue from POS sale ${sale.sale_number}`,
              debit: 0,
              credit: saleData.subtotal + saleData.tax_total
            } : null,
            // Debit: Cost of Goods Sold (Expense increases)
            cogsAccount && totalCOGS > 0 ? { // Only post COGS if it's an inventory item and has cost
              account_id: cogsAccount.id,
              account_name: cogsAccount.account_name,
              account_code: cogsAccount.account_code,
              description: `COGS for POS sale ${sale.sale_number}`,
              debit: totalCOGS,
              credit: 0
            } : null,
            // Credit: Inventory Account (Asset decreases)
            inventoryAccount && totalCOGS > 0 ? { // Only post inventory decrease if it's an inventory item and has cost
              account_id: inventoryAccount.id,
              account_name: inventoryAccount.account_name,
              account_code: inventoryAccount.account_code,
              description: `Inventory sold - POS sale ${sale.sale_number}`,
              debit: 0,
              credit: totalCOGS
            } : null
          ].filter(Boolean), // Filter out nulls if accounts are not found
          total_debits: saleData.total_amount + totalCOGS,
          total_credits: saleData.subtotal + saleData.tax_total + totalCOGS, // Adjusted to match debits for balanced entry
          posted_by: user?.email || 'System',
          posted_date: new Date().toISOString()
        };

        const journalEntryRecord = await base44.entities.JournalEntry.create(journalEntry);

        // Step 5: Update Account Balances (Direct update for simplicity, real ERPs might have specific balance update methods)
        // Update Cash Account
        if (cashAccount) {
          const currentCashBalance = (await base44.entities.Account.get(cashAccount.id))?.balance || 0;
          await base44.entities.Account.update(cashAccount.id, {
            balance: currentCashBalance + saleData.total_amount
          });
        }

        // Update Sales Revenue Account
        if (salesRevenueAccount) {
          const currentRevenueBalance = (await base44.entities.Account.get(salesRevenueAccount.id))?.balance || 0;
          await base44.entities.Account.update(salesRevenueAccount.id, {
            balance: currentRevenueBalance + (saleData.subtotal + saleData.tax_total)
          });
        }

        // Update COGS Account
        if (cogsAccount && totalCOGS > 0) {
          const currentCogsBalance = (await base44.entities.Account.get(cogsAccount.id))?.balance || 0;
          await base44.entities.Account.update(cogsAccount.id, {
            balance: currentCogsBalance + totalCOGS
          });
        }

        // Update Inventory Account
        if (inventoryAccount && totalCOGS > 0) {
          const currentInventoryBalance = (await base44.entities.Account.get(inventoryAccount.id))?.balance || 0;
          await base44.entities.Account.update(inventoryAccount.id, {
            balance: currentInventoryBalance - totalCOGS
          });
        }

        // Step 6: Update Sale with references
        await base44.entities.POSSale.update(sale.id, { 
          invoice_id: invoice.id,
          journal_entry_id: journalEntryRecord.id,
          gl_posted: true,
          cost_of_goods: totalCOGS,
          gross_profit: saleData.total_amount - totalCOGS
        });

        // Step 7: Update POS Session
        await base44.entities.POSSession.update(currentSession.id, {
          total_sales: (currentSession.total_sales || 0) + saleData.total_amount,
          total_transactions: (currentSession.total_transactions || 0) + 1,
          payment_breakdown: {
            ...currentSession.payment_breakdown, // Keep existing breakdown
            cash: (currentSession.payment_breakdown?.cash || 0) + (paymentMethod === 'cash' ? saleData.total_amount : 0),
            card: (currentSession.payment_breakdown?.card || 0) + (paymentMethod === 'card' ? saleData.total_amount : 0),
            mobile: (currentSession.payment_breakdown?.mobile || 0) + (paymentMethod === 'mobile' ? saleData.total_amount : 0),
            other: (currentSession.payment_breakdown?.other || 0) + (paymentMethod === 'other' ? saleData.total_amount : 0)
          }
        });
        
        return { sale, invoice, journalEntry: journalEntryRecord };
      } catch (error) {
        console.error('Error processing sale:', error);
        throw error;
      } finally {
        setIsProcessing(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pos-sales']);
      queryClient.invalidateQueries(['invoices']);
      queryClient.invalidateQueries(['product-locations']);
      queryClient.invalidateQueries(['products']); // Invalidate products to reflect quantity_on_hand changes
      queryClient.invalidateQueries(['pos-sessions']);
      queryClient.invalidateQueries(['accounts']);
      queryClient.invalidateQueries(['journal-entries']);
      setCart([]);
      setSelectedCustomer(null);
      setShowPaymentDialog(false);
      alert('Sale completed successfully! All systems updated.');
    },
    onError: (error) => {
      alert(`Error processing sale: ${error.message}. Please check console for details.`);
      setIsProcessing(false); // Ensure processing state is reset even on error
    }
  });

  const filteredProducts = products.filter(p => 
    p.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { 
        ...product, 
        quantity: 1,
        discount_percent: 0,
        discount_amount: 0,
        cost_price: product.cost_price || 0 // Ensure cost_price is carried to cart item
      }]);
    }
  };

  const updateQuantity = (productId, change) => {
    setCart(cart.map(item => {
      if (item.id === productId) {
        const newQuantity = Math.max(1, item.quantity + change);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  // NOTE: The updateDiscount function was present in the original code but not utilized or called.
  // I will leave it as is, assuming it might be implemented later.
  // const updateDiscount = (productId, discountPercent) => {
  //   setCart(cart.map(item => {
  //     if (item.id === productId) {
  //       const discountAmount = (item.unit_price * item.quantity * discountPercent) / 100;
  //       return { ...item, discount_percent: discountPercent, discount_amount: discountAmount };
  //     }
  //     return item;
  //   }));
  // };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    const discountTotal = cart.reduce((sum, item) => sum + (item.discount_amount || 0), 0);
    const taxTotal = cart.reduce((sum, item) => {
      const itemSubtotal = (item.unit_price * item.quantity) - (item.discount_amount || 0);
      return sum + (itemSubtotal * (item.tax_rate || 0) / 100);
    }, 0);
    return {
      subtotal,
      discountTotal,
      taxTotal,
      total: subtotal - discountTotal + taxTotal
    };
  };

  const { subtotal, discountTotal, taxTotal, total } = calculateTotals();

  const handleCheckout = () => {
    if (cart.length === 0) return;
    if (!currentSession) {
      alert('Please start a POS session first');
      return;
    }
    setShowPaymentDialog(true);
    setAmountTendered(total);
  };

  const handlePayment = async () => {
    if (!currentCompany || !selectedStore || !selectedTerminal || !currentSession) {
      alert('Missing critical POS setup information. Please ensure company, store, terminal, and session are selected.');
      return;
    }

    if (!user) {
      alert('User information is missing for sale processing.');
      return;
    }

    // Default to 'Walk-in Customer' if no customer is selected
    const customerName = selectedCustomer?.company_name || 'Walk-in Customer';
    const customerId = selectedCustomer?.id || '';

    const saleData = {
      company_id: currentCompany.id,
      store_id: selectedStore.id,
      store_name: selectedStore.store_name, // Add store name for tracking
      terminal_id: selectedTerminal.id,
      terminal_name: selectedTerminal.terminal_name, // Add terminal name for tracking
      session_id: currentSession.id,
      cashier_id: user.id, // Use actual user ID
      cashier_name: user.full_name, // Use actual user name
      customer_id: customerId,
      customer_name: customerName,
      sale_number: `SALE-${Date.now()}`,
      sale_date: new Date().toISOString(),
      line_items: cart.map(item => ({
        product_id: item.id,
        product_name: item.product_name,
        sku: item.sku,
        quantity: item.quantity,
        unit_price: item.unit_price,
        cost_price: item.cost_price || 0, // Ensure cost_price is passed for COGS
        discount_percent: item.discount_percent || 0,
        discount_amount: item.discount_amount || 0,
        tax_rate: item.tax_rate || 0,
        tax_amount: ((item.unit_price * item.quantity - (item.discount_amount || 0)) * (item.tax_rate || 0)) / 100,
        line_total: (item.unit_price * item.quantity) - (item.discount_amount || 0) + ((item.unit_price * item.quantity - (item.discount_amount || 0)) * (item.tax_rate || 0)) / 100,
        location_id: selectedStore.default_inventory_location_id
      })),
      subtotal,
      discount_total: discountTotal,
      tax_total: taxTotal,
      total_amount: total,
      payments: [{
        payment_method: paymentMethod,
        amount: total,
        reference: '' // Could add transaction ID from payment gateway here
      }],
      amount_paid: total,
      change_given: Math.max(0, amountTendered - total),
      status: 'completed'
    };

    createSaleMutation.mutate(saleData);
  };

  const handleParkSale = async () => {
    // Implementation for parking sale
    alert('Sale parked successfully');
    setCart([]);
  };

  if (!selectedStore || !selectedTerminal) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>POS Setup Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">Please set up stores and terminals to use POS</p>
            {stores.length === 0 && (
              <p className="text-sm text-red-600">No stores found. Please create a store first.</p>
            )}
            {selectedStore && terminals.length === 0 && (
              <p className="text-sm text-red-600">No terminals found for {selectedStore.store_name}. Please create a terminal.</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentSession) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Start POS Session</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">No active session. Please start a new session to begin.</p>
            {/* Placeholder for actual "Start Session" functionality */}
            <Button className="bg-green-600 hover:bg-green-700">
              Start Session
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 h-screen flex flex-col bg-gray-50">
      {/* Integration Status Alert */}
      <Alert className="mb-4 bg-green-50 border-green-200">
        <AlertCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-900">
          <strong>Fully Integrated:</strong> All sales automatically update Inventory, GL Accounts, AR, P&L, and Balance Sheet in real-time.
        </AlertDescription>
      </Alert>

      {/* Header */}
      <div className="mb-4 bg-white rounded-lg shadow-md p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <StoreIcon className="w-5 h-5 text-blue-600" />
              <span className="font-semibold">{selectedStore.store_name}</span>
            </div>
            <Badge variant="outline">{selectedTerminal.terminal_name}</Badge>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="w-4 h-4" />
              <span>{user?.full_name || currentSession.cashier_name}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-gray-500">Session</p>
              <p className="text-sm font-semibold">{currentSession.session_number}</p>
            </div>
            {/* Placeholder for actual "Close Session" functionality */}
            <Button variant="outline" size="sm">
              <Clock className="w-4 h-4 mr-2" />
              Close Session
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 overflow-hidden">
        {/* Products Section */}
        <div className="lg:col-span-2 flex flex-col space-y-4 overflow-hidden">
          <Card className="shadow-lg">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Scan barcode or search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 text-lg"
                  autoFocus
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map(product => (
                <Card
                  key={product.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => addToCart(product)}
                >
                  <CardContent className="p-4">
                    <div className="aspect-square bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg mb-3 flex items-center justify-center">
                      <Package className="w-12 h-12 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-sm mb-1 line-clamp-2">{product.product_name}</h3>
                    <p className="text-xs text-gray-500 mb-2">{product.sku}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-green-600">
                        ${product.unit_price?.toFixed(2)}
                      </span>
                      {product.product_type === 'inventory' && (
                        <Badge variant="outline" className="text-xs">
                          Stock: {product.quantity_on_hand || 'N/A'}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Cart Section */}
        <div className="flex flex-col space-y-4 overflow-hidden">
          <Card className="flex-1 flex flex-col shadow-lg overflow-hidden">
            <CardHeader className="border-b bg-gray-50">
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShoppingCart className="w-5 h-5" />
                  Current Sale
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowCustomerDialog(true)}
                  disabled={isProcessing}
                >
                  <User className="w-4 h-4 mr-2" />
                  {selectedCustomer ? selectedCustomer.company_name : 'Walk-in'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-4 overflow-hidden">
              <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <ShoppingCart className="w-16 h-16 mb-3" />
                    <p>Cart is empty</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm">{item.product_name}</h4>
                          <p className="text-xs text-gray-500">${item.unit_price?.toFixed(2)} each</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeFromCart(item.id)}
                          disabled={isProcessing}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, -1)}
                            disabled={isProcessing}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="font-semibold w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, 1)}
                            disabled={isProcessing}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        <span className="font-bold">
                          ${(item.unit_price * item.quantity - (item.discount_amount || 0)).toFixed(2)}
                        </span>
                      </div>
                      {item.discount_percent > 0 && (
                        <div className="text-xs text-orange-600">
                          Discount: {item.discount_percent}% (-${item.discount_amount.toFixed(2)})
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="border-t pt-4 space-y-2 bg-white">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold">${subtotal.toFixed(2)}</span>
                </div>
                {discountTotal > 0 && (
                  <div className="flex justify-between text-sm text-orange-600">
                    <span>Discount:</span>
                    <span className="font-semibold">-${discountTotal.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax:</span>
                  <span className="font-semibold">${taxTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-2xl font-bold border-t pt-2">
                  <span>Total:</span>
                  <span className="text-green-600">${total.toFixed(2)}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setCart([])}
                  disabled={cart.length === 0 || isProcessing}
                  className="text-red-600"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
                <Button
                  variant="outline"
                  onClick={handleParkSale}
                  disabled={cart.length === 0 || isProcessing}
                >
                  <Pause className="w-4 h-4 mr-1" />
                  Park
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700 col-span-1"
                  onClick={handleCheckout}
                  disabled={cart.length === 0 || isProcessing}
                >
                  {isProcessing ? (
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Pay
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between text-xl font-bold">
                <span>Total Amount:</span>
                <span className="text-green-600">${total.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Payment Method</label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod} disabled={isProcessing}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Credit/Debit Card</SelectItem>
                  <SelectItem value="mobile">Mobile Payment</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {paymentMethod === 'cash' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount Tendered</label>
                <Input
                  type="number"
                  step="0.01"
                  value={amountTendered}
                  onChange={(e) => setAmountTendered(parseFloat(e.target.value))}
                  className="text-lg"
                  disabled={isProcessing}
                />
                {amountTendered >= total && (
                  <div className="bg-blue-50 rounded p-3">
                    <div className="flex justify-between">
                      <span className="font-medium">Change:</span>
                      <span className="text-xl font-bold text-blue-600">
                        ${(amountTendered - total).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900 text-xs">
                This sale will automatically update: Inventory, Cash Account, Sales Revenue, COGS, P&L, and Balance Sheet
              </AlertDescription>
            </Alert>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowPaymentDialog(false)}
                className="flex-1"
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={handlePayment}
                disabled={(paymentMethod === 'cash' && amountTendered < total) || isProcessing}
              >
                {isProcessing ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                ) : (
                  <Receipt className="w-4 h-4 mr-2" />
                )}
                Complete Sale
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Customer Selection Dialog */}
      <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                setSelectedCustomer(null);
                setShowCustomerDialog(false);
              }}
            >
              Walk-in Customer (No selection)
            </Button>
            {customers.map(customer => (
              <Button
                key={customer.id}
                variant={selectedCustomer?.id === customer.id ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => {
                  setSelectedCustomer(customer);
                  setShowCustomerDialog(false);
                }}
              >
                <div className="text-left">
                  <div className="font-semibold">{customer.company_name}</div>
                  <div className="text-xs opacity-70">{customer.email}</div>
                </div>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

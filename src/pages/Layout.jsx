

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { CompanyProvider, useCompany } from "./components/auth/CompanyContext";
import CompanySelector from "./components/auth/CompanySelector";
import LandingPage from "./components/auth/LandingPage";
import RealtimeNotifications from "./components/shared/RealtimeNotifications";
import ActiveUsersWidget from "./components/shared/ActiveUsersWidget";
import {
  LayoutDashboard,
  FileText,
  ShoppingCart,
  Users,
  Package,
  DollarSign,
  TrendingUp,
  Settings,
  Book,
  Receipt,
  CreditCard,
  Building2,
  BarChart3,
  Store,
  Factory,
  Briefcase,
  Heart,
  Key,
  BookOpen,
  HelpCircle,
  LogOut,
  User,
  AlertCircle,
  MapPin,
  Upload,
  Lock,
  RefreshCw // Added RefreshCw icon
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const navigationItems = [
  {
    title: "Main Dashboard",
    url: createPageUrl("Dashboard"),
    icon: LayoutDashboard,
    group: "main"
  },
  {
    title: "Sales",
    icon: ShoppingCart,
    group: "sales",
    children: [
      { title: "Sales Dashboard", url: createPageUrl("SalesDashboard"), icon: LayoutDashboard },
      { title: "Invoices", url: createPageUrl("Invoices"), icon: FileText },
      { title: "Customers", url: createPageUrl("Customers"), icon: Users },
      { title: "POS", url: createPageUrl("POS"), icon: Store },
      { title: "POS Reports", url: createPageUrl("POSReports"), icon: BarChart3 }
    ]
  },
  {
    title: "Purchases",
    icon: Receipt,
    group: "purchases",
    children: [
      { title: "Purchase Dashboard", url: createPageUrl("PurchaseDashboard"), icon: LayoutDashboard },
      { title: "Purchase Orders", url: createPageUrl("PurchaseOrders"), icon: ShoppingCart },
      { title: "Receive Inventory", url: createPageUrl("ReceiveInventory"), icon: Package },
      { title: "Bills", url: createPageUrl("Bills"), icon: Receipt },
      { title: "Vendors", url: createPageUrl("Vendors"), icon: Building2 }
    ]
  },
  {
    title: "Inventory",
    icon: Package,
    group: "inventory",
    children: [
      { title: "Inventory Dashboard", url: createPageUrl("InventoryDashboard"), icon: LayoutDashboard },
      { title: "Products", url: createPageUrl("Products"), icon: Package },
      { title: "Inventory Reports", url: createPageUrl("InventoryReports"), icon: BarChart3 },
      { title: "Inventory Locations", url: createPageUrl("InventoryLocationManagement"), icon: MapPin }
    ]
  },
  {
    title: "Manufacturing",
    icon: Factory,
    group: "manufacturing",
    children: [
      { title: "Manufacturing Dashboard", url: createPageUrl("ManufacturingDashboard"), icon: LayoutDashboard },
      { title: "Production", url: createPageUrl("Manufacturing"), icon: Factory }
    ]
  },
  {
    title: "Job Costing",
    icon: Briefcase,
    group: "job-costing",
    children: [
      { title: "Job Costing Dashboard", url: createPageUrl("JobCostingDashboard"), icon: LayoutDashboard },
      { title: "Jobs & Costs", url: createPageUrl("JobCosting"), icon: Briefcase }
    ]
  },
  {
    title: "Payroll",
    icon: Users,
    group: "payroll",
    children: [
      { title: "Payroll Dashboard", url: createPageUrl("PayrollDashboard"), icon: LayoutDashboard },
      { title: "Employees & Payroll", url: createPageUrl("Payroll"), icon: Users }
    ]
  },
  {
    title: "Non-Profit",
    icon: Heart,
    group: "non-profit",
    children: [
      { title: "Non-Profit Dashboard", url: createPageUrl("NonProfitDashboard"), icon: LayoutDashboard },
      { title: "Donations & Programs", url: createPageUrl("NonProfit"), icon: Heart }
    ]
  },
  {
    title: "Accounting",
    icon: Book,
    group: "accounting",
    children: [
      { title: "Accounting Dashboard", url: createPageUrl("AccountingDashboard"), icon: LayoutDashboard },
      { title: "Chart of Accounts", url: createPageUrl("ChartOfAccounts"), icon: Book },
      { title: "Journal Entries", url: createPageUrl("JournalEntries"), icon: FileText },
      { title: "Payments", url: createPageUrl("Payments"), icon: CreditCard },
      { title: "Banking", url: createPageUrl("Banking"), icon: DollarSign }, // Changed icon from CreditCard to DollarSign
      { title: "Exchange Rates", url: createPageUrl("ExchangeRates"), icon: TrendingUp },
      { title: "FX Revaluation", url: createPageUrl("FXRevaluation"), icon: DollarSign }
    ]
  },
  {
    title: "Fixed Assets",
    icon: Package,
    group: "fixed-assets",
    children: [
      { title: "Fixed Assets Dashboard", url: createPageUrl("FixedAssetsDashboard"), icon: LayoutDashboard },
      { title: "Assets", url: createPageUrl("FixedAssets"), icon: Package }
    ]
  },
  {
    title: "Reports",
    icon: BarChart3,
    group: "reports",
    children: [
      { title: "Financial Reports", url: createPageUrl("Reports"), icon: FileText },
      { title: "Management Dashboard", url: createPageUrl("ManagementDashboard"), icon: TrendingUp }
    ]
  },
  {
    title: "Settings",
    icon: Settings,
    group: "settings",
    children: [
      { title: "App Settings", url: createPageUrl("Settings"), icon: Settings },
      { title: "Company Management", url: createPageUrl("CompanyManagement"), icon: Building2 },
      { title: "User Management", url: createPageUrl("UserManagement"), icon: Users },
      { title: "Store Management", url: createPageUrl("StoreManagement"), icon: Store },
      { title: "License Management", url: createPageUrl("LicenseManagement"), icon: Key },
      { title: "Audit Trail", url: createPageUrl("AuditTrail"), icon: FileText },
      { title: "Lock Management", url: createPageUrl("LockManagement"), icon: Lock },
      { title: "Import Data", url: createPageUrl("ImportData"), icon: Upload }
    ]
  },
  {
    title: "Help & Support",
    icon: HelpCircle,
    group: "help",
    children: [
      { title: "Support Guide", url: createPageUrl("SupportGuide"), icon: HelpCircle },
      { title: "Licensing Guide", url: createPageUrl("LicensingGuide"), icon: BookOpen },
      { title: "Deployment Guide", url: createPageUrl("DeploymentGuide"), icon: BookOpen }
    ]
  }
];

// Loading component
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="p-12 text-center">
          <div className="animate-spin w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-6"></div>
          <p className="text-xl text-gray-700">Loading...</p>
        </CardContent>
      </Card>
    </div>
  );
}

function LayoutContent({ children }) {
  const location = useLocation();
  const { currentCompany, switchCompany, user, networkError, retryConnection, hasNetworkError } = useCompany();
  
  const [expandedGroups, setExpandedGroups] = React.useState({
    sales: true,
    purchases: true,
    inventory: true,
    manufacturing: true,
    "job-costing": true,
    payroll: true,
    "non-profit": true,
    accounting: true,
    "fixed-assets": true,
    reports: true,
    settings: true,
    help: false,
  });

  const [enabledModules, setEnabledModules] = React.useState({
    multi_currency: false,
    fixed_assets: true,
    manufacturing: true,
    job_costing: true,
    payroll: false,
    non_profit: false,
    pos: true,
    inventory: true
  });

  React.useEffect(() => {
    if (currentCompany?.modules_enabled) {
      setEnabledModules(prev => ({ ...prev, ...currentCompany.modules_enabled }));
    }
  }, [currentCompany]);

  const evaluationDaysRemaining = React.useMemo(() => {
    if (!currentCompany?.is_evaluation || !currentCompany?.license_expiry_date) {
      return null;
    }
    
    const today = new Date();
    const expiryDate = new Date(currentCompany.license_expiry_date);
    const diffTime = expiryDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  }, [currentCompany]);

  const toggleGroup = (group) => {
    setExpandedGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };

  const handleLogout = () => {
    switchCompany(null);
    localStorage.removeItem('current_company_id');
    sessionStorage.removeItem('current_company_id');
    base44.auth.logout(window.location.origin);
  };

  const handleSwitchCompany = () => {
    switchCompany(null);
    window.location.reload();
  };

  const isSuperAdmin = user?.is_super_admin === true;

  // Show network error screen
  if (hasNetworkError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-12 h-12 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Connection Error</h1>
            <p className="text-lg text-gray-700 mb-6">
              Unable to connect to the server. Please check your internet connection and try again.
            </p>
            <div className="bg-gray-100 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 font-mono break-words">
                {networkError}
              </p>
            </div>
            <div className="space-y-3">
              <Button 
                onClick={retryConnection}
                className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Retry Connection
              </Button>
              <p className="text-sm text-gray-600">
                If the problem persists, please contact your system administrator or check:
              </p>
              <ul className="text-sm text-gray-600 text-left list-disc list-inside space-y-1">
                <li>Your internet connection is working</li>
                <li>The server is running and accessible</li>
                <li>You're not being blocked by a firewall</li>
                <li>The API URL is correctly configured</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // CRITICAL FIX: Allow EvaluationSignup page even when logged in but no company
  if (location.pathname === '/EvaluationSignup') {
    return children;
  }

  // CRITICAL: Allow SetupSuperAdmin page without company access
  if (location.pathname === '/SetupSuperAdmin') {
    return children;
  }

  // CRITICAL FIX: Don't redirect to CompanySelector if already on a valid page with company in session
  const hasStoredCompany = sessionStorage.getItem('current_company_id');
  if (!currentCompany && !hasStoredCompany) {
    return <CompanySelector />;
  }

  // CRITICAL FIX: Show loading while company is being restored from session
  if (!currentCompany && hasStoredCompany) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-12 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your company...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredNavigationItems = navigationItems
    .map(item => {
      if (!isSuperAdmin && ['settings', 'help'].includes(item.group)) {
        if (item.children) {
          const filteredChildren = item.children.filter(child => {
            // Include 'Audit Trail' here for non-super admins if needed, or keep it admin-only.
            // For now, assuming it's an admin-level setting.
            const allowedPages = ['App Settings', 'Support Guide'];
            return allowedPages.includes(child.title);
          });
          
          if (filteredChildren.length === 0) return null;
          
          return { ...item, children: filteredChildren };
        }
      }

      if (item.children) {
        let filteredChildren = item.children;

        if (item.group === 'sales' && !enabledModules.pos) {
          filteredChildren = filteredChildren.filter(child => 
            child.title !== 'POS' && child.title !== 'POS Reports'
          );
        }
        
        if (item.group === 'accounting' && !enabledModules.multi_currency) {
          filteredChildren = filteredChildren.filter(child =>
            child.title !== 'Exchange Rates' && child.title !== 'FX Revaluation'
          );
        }

        return { ...item, children: filteredChildren };
      }
      return item;
    })
    .filter(item => {
      if (!item) return false;
      
      if (['main', 'accounting', 'reports', 'sales', 'purchases'].includes(item.group)) {
        return true;
      }

      if (item.group === 'settings' || item.group === 'help') {
        if (isSuperAdmin) return true;
        return item.children && item.children.length > 0;
      }

      const moduleKeyMap = {
        'inventory': enabledModules.inventory,
        'manufacturing': enabledModules.manufacturing,
        'job-costing': enabledModules.job_costing,
        'payroll': enabledModules.payroll,
        'non-profit': enabledModules.non_profit,
        'fixed-assets': enabledModules.fixed_assets,
      };

      if (Object.prototype.hasOwnProperty.call(moduleKeyMap, item.group)) {
        return moduleKeyMap[item.group];
      }

      return false;
    });

  return (
    <SidebarProvider>
      <style>{`
        :root {
          --primary: 220 70% 50%;
          --primary-foreground: 0 0% 100%;
          --secondary: 220 14% 96%;
          --accent: 220 14% 96%;
          --background: 0 0% 99%;
          --foreground: 222 47% 11%;
        }
      `}</style>

      {/* Realtime Notifications */}
      <RealtimeNotifications />
      
      <div className="min-h-screen flex w-full bg-gray-50">
        <Sidebar className="border-r border-gray-200 bg-white">
          <SidebarHeader className="border-b border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Edge Cloud ERP</h2>
                {currentCompany && (
                  <p className="text-xs text-gray-500">{currentCompany.company_name}</p>
                )}
              </div>
            </div>

            {/* Active Users Widget in Sidebar */}
            <div className="mt-4">
              <ActiveUsersWidget compact />
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-3">
            <SidebarMenu>
              {filteredNavigationItems.map((item) => {
                if (item.children) {
                  return (
                    <div key={item.group} className="mb-2">
                      <button
                        onClick={() => toggleGroup(item.group)}
                        className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="w-4 h-4" />
                          <span>{item.title}</span>
                        </div>
                        <span className={`transition-transform ${expandedGroups[item.group] ? 'rotate-90' : ''}`}>
                          ›
                        </span>
                      </button>
                      {expandedGroups[item.group] && item.children.length > 0 && (
                        <div className="ml-4 mt-1 space-y-1">
                          {item.children.map((child) => (
                            <SidebarMenuItem key={child.title}>
                              <SidebarMenuButton 
                                asChild 
                                className={`hover:bg-blue-50 hover:text-blue-700 transition-colors rounded-lg ${
                                  location.pathname === child.url ? 'bg-blue-50 text-blue-700 font-medium' : ''
                                }`}
                              >
                                <Link to={child.url} className="flex items-center gap-3 px-3 py-2">
                                  <child.icon className="w-4 h-4" />
                                  <span className="text-sm">{child.title}</span>
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      className={`hover:bg-blue-50 hover:text-blue-700 transition-colors rounded-lg mb-1 ${
                        location.pathname === item.url ? 'bg-blue-50 text-blue-700 font-medium' : ''
                      }`}
                    >
                      <Link to={item.url} className="flex items-center gap-3 px-3 py-2">
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="border-t border-gray-200 p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center justify-between w-full hover:bg-gray-50 p-2 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {user?.full_name || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
                      {isSuperAdmin && (
                        <p className="text-xs text-blue-600 font-semibold">Super Admin</p>
                      )}
                    </div>
                  </div>
                  <Settings className="w-4 h-4 text-gray-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => window.location.href = createPageUrl("Settings")}>
                  <User className="w-4 h-4 mr-2" />
                  My Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSwitchCompany}>
                  <Building2 className="w-4 h-4 mr-2" />
                  Switch Company
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          {evaluationDaysRemaining !== null && (
            <div className={`w-full px-6 py-3 ${
              evaluationDaysRemaining <= 5 ? 'bg-red-600' : 
              evaluationDaysRemaining <= 10 ? 'bg-orange-500' : 
              'bg-blue-600'
            } text-white`}>
              <div className="flex items-center justify-between max-w-7xl mx-auto">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-semibold">
                    {evaluationDaysRemaining === 0 ? (
                      'Your evaluation period has expired'
                    ) : evaluationDaysRemaining === 1 ? (
                      'Last day of your evaluation period!'
                    ) : (
                      `${evaluationDaysRemaining} days remaining in your evaluation period`
                    )}
                  </span>
                </div>
                <Link to={createPageUrl("UpgradeSubscription")}>
                  <Button 
                    size="sm" 
                    className={`${
                      evaluationDaysRemaining <= 5 ? 'bg-white text-red-600 hover:bg-gray-100' : 
                      'bg-white text-blue-600 hover:bg-gray-100'
                    } font-semibold`}
                  >
                    Upgrade Now
                  </Button>
                </Link>
              </div>
            </div>
          )}

          <header className="bg-white border-b border-gray-200 px-6 py-4 md:hidden">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-gray-100 p-2 rounded-lg transition-colors" />
              <h1 className="text-xl font-semibold">Edge Cloud ERP</h1>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

function AuthWrapper({ children }) {
  const location = useLocation();
  const [isChecking, setIsChecking] = React.useState(true);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = await base44.auth.isAuthenticated();
        setIsAuthenticated(authenticated);
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, []);

  if (isChecking) {
    return <LoadingScreen />;
  }

  // CRITICAL: Allow access to these pages without authentication
  const publicPages = ['/SetupSuperAdmin', '/EvaluationSignup'];
  const isPublicPage = publicPages.includes(location.pathname);
  
  if (isPublicPage) {
    return children;
  }

  if (!isAuthenticated) {
    return <LandingPage onLogin={() => base44.auth.redirectToLogin(window.location.pathname)} />;
  }

  return children;
}

export default function Layout({ children }) {
  return (
    <AuthWrapper>
      <CompanyProvider>
        <LayoutContent>{children}</LayoutContent>
      </CompanyProvider>
    </AuthWrapper>
  );
}


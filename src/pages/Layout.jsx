import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/supabaseClient";
import { CompanyProvider, useCompany } from "../components/auth/CompanyContext";
import CompanySelector from "../components/auth/CompanySelector";
import LandingPage from "../components/auth/LandingPage";
import RealtimeNotifications from "../components/shared/RealtimeNotifications";
import ActiveUsersWidget from "../components/shared/ActiveUsersWidget";
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
  User as UserIcon,
  AlertCircle,
  MapPin,
  Upload,
  Lock,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Bell,
  Search,
  Zap,
  Cloud,
  Menu,
  X,
  ArrowUpRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ── Navigation structure ────────────────────────────────────
const navigationGroups = [
  {
    group: "main",
    label: null,
    items: [
      { title: "Dashboard", url: createPageUrl("Dashboard"), icon: LayoutDashboard },
    ]
  },
  {
    group: "sales",
    label: "Sales & Revenue",
    icon: ShoppingCart,
    items: [
      { title: "Sales Dashboard", url: createPageUrl("SalesDashboard"), icon: LayoutDashboard },
      { title: "Invoices",        url: createPageUrl("Invoices"),        icon: FileText },
      { title: "Customers",       url: createPageUrl("Customers"),       icon: Users },
      { title: "POS",             url: createPageUrl("POS"),             icon: Store },
      { title: "POS Reports",     url: createPageUrl("POSReports"),      icon: BarChart3 },
    ]
  },
  {
    group: "purchases",
    label: "Purchasing",
    icon: Receipt,
    items: [
      { title: "Purchase Dashboard", url: createPageUrl("PurchaseDashboard"), icon: LayoutDashboard },
      { title: "Purchase Orders",    url: createPageUrl("PurchaseOrders"),    icon: ShoppingCart },
      { title: "Receive Inventory",  url: createPageUrl("ReceiveInventory"),  icon: Package },
      { title: "Bills",              url: createPageUrl("Bills"),              icon: Receipt },
      { title: "Vendors",            url: createPageUrl("Vendors"),            icon: Building2 },
    ]
  },
  {
    group: "inventory",
    label: "Inventory",
    icon: Package,
    items: [
      { title: "Inventory Dashboard",  url: createPageUrl("InventoryDashboard"),          icon: LayoutDashboard },
      { title: "Products",             url: createPageUrl("Products"),                    icon: Package },
      { title: "Inventory Reports",    url: createPageUrl("InventoryReports"),            icon: BarChart3 },
      { title: "Inventory Locations",  url: createPageUrl("InventoryLocationManagement"), icon: MapPin },
    ]
  },
  {
    group: "manufacturing",
    label: "Manufacturing",
    icon: Factory,
    items: [
      { title: "Mfg Dashboard", url: createPageUrl("ManufacturingDashboard"), icon: LayoutDashboard },
      { title: "Production",    url: createPageUrl("Manufacturing"),           icon: Factory },
    ]
  },
  {
    group: "job-costing",
    label: "Job Costing",
    icon: Briefcase,
    items: [
      { title: "Job Costing Dashboard", url: createPageUrl("JobCostingDashboard"), icon: LayoutDashboard },
      { title: "Jobs & Costs",          url: createPageUrl("JobCosting"),          icon: Briefcase },
    ]
  },
  {
    group: "payroll",
    label: "Payroll",
    icon: Users,
    items: [
      { title: "Payroll Dashboard",  url: createPageUrl("PayrollDashboard"), icon: LayoutDashboard },
      { title: "Employees & Payroll", url: createPageUrl("Payroll"),          icon: Users },
    ]
  },
  {
    group: "non-profit",
    label: "Non-Profit",
    icon: Heart,
    items: [
      { title: "Non-Profit Dashboard", url: createPageUrl("NonProfitDashboard"), icon: LayoutDashboard },
      { title: "Donations & Programs", url: createPageUrl("NonProfit"),           icon: Heart },
    ]
  },
  {
    group: "accounting",
    label: "Accounting",
    icon: Book,
    items: [
      { title: "Accounting Dashboard", url: createPageUrl("AccountingDashboard"), icon: LayoutDashboard },
      { title: "Chart of Accounts",    url: createPageUrl("ChartOfAccounts"),     icon: Book },
      { title: "Journal Entries",      url: createPageUrl("JournalEntries"),      icon: FileText },
      { title: "Payments",             url: createPageUrl("Payments"),            icon: CreditCard },
      { title: "Banking",              url: createPageUrl("Banking"),             icon: DollarSign },
      { title: "Exchange Rates",       url: createPageUrl("ExchangeRates"),       icon: TrendingUp },
      { title: "FX Revaluation",       url: createPageUrl("FXRevaluation"),       icon: DollarSign },
    ]
  },
  {
    group: "fixed-assets",
    label: "Fixed Assets",
    icon: Package,
    items: [
      { title: "Assets Dashboard", url: createPageUrl("FixedAssetsDashboard"), icon: LayoutDashboard },
      { title: "Assets",           url: createPageUrl("FixedAssets"),          icon: Package },
    ]
  },
  {
    group: "reports",
    label: "Reports & Analytics",
    icon: BarChart3,
    items: [
      { title: "Financial Reports",    url: createPageUrl("Reports"),             icon: FileText },
      { title: "Management Dashboard", url: createPageUrl("ManagementDashboard"), icon: TrendingUp },
    ]
  },
  {
    group: "settings",
    label: "Administration",
    icon: Settings,
    items: [
      { title: "App Settings",      url: createPageUrl("Settings"),          icon: Settings },
      { title: "Companies",         url: createPageUrl("CompanyManagement"), icon: Building2 },
      { title: "Users",             url: createPageUrl("UserManagement"),    icon: Users },
      { title: "Stores",            url: createPageUrl("StoreManagement"),   icon: Store },
      { title: "Licenses",          url: createPageUrl("LicenseManagement"), icon: Key },
      { title: "Audit Trail",       url: createPageUrl("AuditTrail"),        icon: FileText },
      { title: "Lock Management",   url: createPageUrl("LockManagement"),    icon: Lock },
      { title: "Import Data",       url: createPageUrl("ImportData"),        icon: Upload },
    ]
  },
  {
    group: "help",
    label: "Help & Guides",
    icon: HelpCircle,
    items: [
      { title: "Support Guide",    url: createPageUrl("SupportGuide"),    icon: HelpCircle },
      { title: "Licensing Guide",  url: createPageUrl("LicensingGuide"),  icon: BookOpen },
      { title: "Deployment Guide", url: createPageUrl("DeploymentGuide"), icon: BookOpen },
    ]
  },
];

// ── Loading screen ──────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F0F4F8' }}>
      <div className="text-center">
        <div
          style={{
            width: 64, height: 64,
            background: 'linear-gradient(135deg, #1E3A5F, #2E7DE8)',
            borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 8px 24px rgba(27,79,138,0.3)',
          }}
        >
          <Cloud style={{ width: 32, height: 32, color: 'white' }} />
        </div>
        <div
          style={{
            width: 40, height: 4, background: '#E2E8F0', borderRadius: 9999,
            margin: '0 auto 12px', overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%', width: '40%', background: '#1B4F8A',
              borderRadius: 9999,
              animation: 'loading-bar 1.2s ease-in-out infinite',
            }}
          />
        </div>
        <p style={{ color: '#64748B', fontSize: 14, fontWeight: 500 }}>Loading Edge Cloud ERP…</p>
      </div>
      <style>{`
        @keyframes loading-bar {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
      `}</style>
    </div>
  );
}

// ── Sidebar nav item ────────────────────────────────────────
function NavItem({ item, isActive }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.url}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '7px 12px',
        borderRadius: 7,
        color: isActive ? '#E2E8F0' : 'rgba(226,232,240,0.65)',
        fontWeight: isActive ? 600 : 400,
        fontSize: 13.5,
        textDecoration: 'none',
        background: isActive ? 'rgba(46,125,232,0.22)' : 'transparent',
        transition: 'all 150ms ease',
        marginBottom: 1,
      }}
      onMouseEnter={e => {
        if (!isActive) {
          e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
          e.currentTarget.style.color = '#E2E8F0';
        }
      }}
      onMouseLeave={e => {
        if (!isActive) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'rgba(226,232,240,0.65)';
        }
      }}
    >
      <Icon style={{
        width: 15, height: 15, flexShrink: 0,
        color: isActive ? '#60A5FA' : 'rgba(226,232,240,0.45)',
      }} />
      <span style={{ lineHeight: 1.3 }}>{item.title}</span>
      {isActive && (
        <div style={{
          marginLeft: 'auto', width: 5, height: 5,
          borderRadius: '50%', background: '#2E7DE8',
          flexShrink: 0,
        }} />
      )}
    </Link>
  );
}

// ── Sidebar group ───────────────────────────────────────────
function NavGroup({ group, isExpanded, onToggle, currentPath }) {
  if (group.group === 'main') {
    return (
      <div style={{ marginBottom: 4 }}>
        {group.items.map(item => (
          <NavItem key={item.url} item={item} isActive={currentPath === item.url} />
        ))}
      </div>
    );
  }

  const Icon = group.icon;
  const hasActive = group.items.some(i => currentPath === i.url);

  return (
    <div style={{ marginBottom: 2 }}>
      <button
        onClick={() => onToggle(group.group)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          width: '100%', padding: '8px 12px', borderRadius: 7,
          background: hasActive && !isExpanded ? 'rgba(46,125,232,0.15)' : 'transparent',
          color: hasActive ? '#E2E8F0' : 'rgba(226,232,240,0.75)',
          fontWeight: 600, fontSize: 13.5,
          cursor: 'pointer', border: 'none', textAlign: 'left',
          transition: 'all 150ms ease',
          justifyContent: 'space-between',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
          e.currentTarget.style.color = '#E2E8F0';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = hasActive && !isExpanded ? 'rgba(46,125,232,0.15)' : 'transparent';
          e.currentTarget.style.color = hasActive ? '#E2E8F0' : 'rgba(226,232,240,0.75)';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon style={{
            width: 15, height: 15, flexShrink: 0,
            color: hasActive ? '#60A5FA' : 'rgba(226,232,240,0.45)',
          }} />
          <span>{group.label}</span>
        </div>
        {isExpanded
          ? <ChevronDown style={{ width: 13, height: 13, opacity: 0.5, flexShrink: 0 }} />
          : <ChevronRight style={{ width: 13, height: 13, opacity: 0.5, flexShrink: 0 }} />
        }
      </button>

      {isExpanded && (
        <div style={{ marginLeft: 14, paddingLeft: 12, borderLeft: '1px solid rgba(255,255,255,0.1)', marginTop: 2 }}>
          {group.items.map(item => (
            <NavItem key={item.url} item={item} isActive={currentPath === item.url} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Layout Content ─────────────────────────────────────
function LayoutContent({ children }) {
  const location = useLocation();
  const { currentCompany, switchCompany, user, networkError, retryConnection, hasNetworkError } = useCompany();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const [expandedGroups, setExpandedGroups] = React.useState({
    sales: true,
    purchases: false,
    inventory: false,
    manufacturing: false,
    "job-costing": false,
    payroll: false,
    "non-profit": false,
    accounting: true,
    "fixed-assets": false,
    reports: false,
    settings: false,
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
    inventory: true,
  });

  React.useEffect(() => {
    if (currentCompany?.modules_enabled) {
      setEnabledModules(prev => ({ ...prev, ...currentCompany.modules_enabled }));
    }
  }, [currentCompany]);

  // Auto-expand group when navigating to a child page
  React.useEffect(() => {
    navigationGroups.forEach(group => {
      if (group.items?.some(i => i.url === location.pathname)) {
        setExpandedGroups(prev => ({ ...prev, [group.group]: true }));
      }
    });
  }, [location.pathname]);

  const evaluationDaysRemaining = React.useMemo(() => {
    if (!currentCompany?.is_evaluation || !currentCompany?.license_expiry_date) return null;
    const diffMs = new Date(currentCompany.license_expiry_date) - new Date();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }, [currentCompany]);

  const toggleGroup = group =>
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));

  const handleLogout = () => {
    switchCompany(null);
    localStorage.removeItem('current_company_id');
    sessionStorage.removeItem('current_company_id');
    User.logout();
  };

  const isSuperAdmin = user?.is_super_admin === true;

  // ── Build visible nav groups ──────────────────────────────
  const visibleGroups = navigationGroups
    .map(group => {
      if (group.group === 'main') return group;

      let items = [...group.items];

      // Filter POS if disabled
      if (group.group === 'sales' && !enabledModules.pos) {
        items = items.filter(i => !['POS', 'POS Reports'].includes(i.title));
      }
      // Filter FX if multi_currency off
      if (group.group === 'accounting' && !enabledModules.multi_currency) {
        items = items.filter(i => !['Exchange Rates', 'FX Revaluation'].includes(i.title));
      }
      // Admin-only sections limited for non-admin
      if (!isSuperAdmin && group.group === 'settings') {
        items = items.filter(i => ['App Settings'].includes(i.title));
      }
      if (!isSuperAdmin && group.group === 'help') {
        items = items.filter(i => ['Support Guide'].includes(i.title));
      }

      return { ...group, items };
    })
    .filter(group => {
      if (group.group === 'main') return true;
      if (['sales', 'purchases', 'accounting', 'reports'].includes(group.group)) return true;
      if (group.group === 'settings') return isSuperAdmin || group.items.length > 0;
      if (group.group === 'help') return group.items.length > 0;

      const moduleMap = {
        'inventory':       enabledModules.inventory,
        'manufacturing':   enabledModules.manufacturing,
        'job-costing':     enabledModules.job_costing,
        'payroll':         enabledModules.payroll,
        'non-profit':      enabledModules.non_profit,
        'fixed-assets':    enabledModules.fixed_assets,
      };
      return moduleMap[group.group] ?? false;
    });

  // ── Network error screen ──────────────────────────────────
  if (hasNetworkError) {
    return (
      <div style={{ minHeight: '100vh', background: '#F5F7FA', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ background: 'white', borderRadius: 16, padding: 48, maxWidth: 520, width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, background: '#FEF2F2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <AlertCircle style={{ width: 32, height: 32, color: '#EF4444' }} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', marginBottom: 12 }}>Connection Error</h1>
          <p style={{ color: '#64748B', fontSize: 15, marginBottom: 20, lineHeight: 1.6 }}>
            Unable to connect to the server. Please check your internet connection and try again.
          </p>
          <div style={{ background: '#F8FAFC', borderRadius: 8, padding: '12px 16px', marginBottom: 24, fontFamily: 'monospace', fontSize: 12, color: '#475569', wordBreak: 'break-all', textAlign: 'left' }}>
            {networkError}
          </div>
          <button
            onClick={retryConnection}
            style={{ width: '100%', padding: '12px 24px', background: '#1B4F8A', color: 'white', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <RefreshCw style={{ width: 18, height: 18 }} />
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (location.pathname === '/EvaluationSignup') return children;
  if (location.pathname === '/SetupSuperAdmin') return children;

  const hasStoredCompany = sessionStorage.getItem('current_company_id');
  if (!currentCompany && !hasStoredCompany) return <CompanySelector />;
  if (!currentCompany && hasStoredCompany) return <LoadingScreen />;

  // ── User initials ─────────────────────────────────────────
  const userInitials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  // ── Sidebar JSX ───────────────────────────────────────────
  const sidebarContent = (
    <div style={{
      width: 256, minWidth: 256,
      background: '#1E3A5F',
      height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      position: 'sticky', top: 0, flexShrink: 0,
    }}>
      {/* Logo / Brand */}
      <div style={{
        padding: '20px 18px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: '#163354',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{
            width: 40, height: 40, flexShrink: 0,
            background: 'linear-gradient(135deg, #2E7DE8, #00A86B)',
            borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(46,125,232,0.4)',
          }}>
            <Cloud style={{ width: 22, height: 22, color: 'white' }} />
          </div>
          <div>
            <div style={{ color: 'white', fontWeight: 800, fontSize: 15, letterSpacing: '-0.01em', lineHeight: 1.2 }}>
              Edge Cloud
            </div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              ERP Platform
            </div>
          </div>
        </div>

        {/* Company pill */}
        {currentCompany && (
          <div style={{
            background: 'rgba(255,255,255,0.06)', borderRadius: 8,
            padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8,
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{
              width: 24, height: 24, background: '#2E7DE8', borderRadius: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Building2 style={{ width: 13, height: 13, color: 'rgba(255,255,255,0.8)' }} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: 600, truncate: true, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentCompany.company_name}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10.5, fontWeight: 500 }}>
                {isSuperAdmin ? 'Super Admin' : 'Standard User'}
              </div>
            </div>
          </div>
        )}

        {/* Active users widget */}
        <div style={{ marginTop: 10 }}>
          <ActiveUsersWidget compact />
        </div>
      </div>

      {/* Navigation */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 10px', scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.15) transparent' }}>
        {visibleGroups.map(group => (
          <NavGroup
            key={group.group}
            group={group}
            isExpanded={expandedGroups[group.group]}
            onToggle={toggleGroup}
            currentPath={location.pathname}
          />
        ))}

        <div style={{ height: 16 }} />
      </div>

      {/* User profile footer */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.08)', background: '#163354' }}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', padding: '10px 12px', borderRadius: 10,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              cursor: 'pointer', transition: 'background 150ms',
              textAlign: 'left',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            >
              <div style={{
                width: 34, height: 34, flexShrink: 0,
                background: 'linear-gradient(135deg, #2E7DE8, #00A86B)',
                borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ color: 'white', fontWeight: 700, fontSize: 12.5 }}>{userInitials}</span>
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.full_name || 'User'}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.email || ''}
                </div>
              </div>
              <Settings style={{ width: 13, height: 13, color: 'rgba(255,255,255,0.35)', flexShrink: 0 }} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            side="top"
            style={{ width: 200, marginBottom: 8 }}
            className="border border-gray-200 shadow-xl rounded-xl bg-white"
          >
            <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid #F1F5F9' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{user?.full_name || 'User'}</p>
              <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{user?.email}</p>
              {isSuperAdmin && (
                <span style={{ display: 'inline-block', marginTop: 4, fontSize: 10, fontWeight: 700, background: '#EFF6FF', color: '#2E7DE8', padding: '2px 8px', borderRadius: 99, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Super Admin
                </span>
              )}
            </div>
            <div style={{ padding: '4px' }}>
              <DropdownMenuItem
                onClick={() => window.location.href = createPageUrl("Settings")}
                className="rounded-lg text-sm font-medium"
              >
                <UserIcon className="w-4 h-4 mr-2 text-gray-400" />
                My Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => { switchCompany(null); window.location.reload(); }}
                className="rounded-lg text-sm font-medium"
              >
                <Building2 className="w-4 h-4 mr-2 text-gray-400" />
                Switch Company
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="rounded-lg text-sm font-medium text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <>
      <RealtimeNotifications />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
      `}</style>

      <div style={{ display: 'flex', minHeight: '100vh', background: '#F0F4F8' }}>
        {/* Desktop sidebar */}
        <div className="hidden md:flex">
          {sidebarContent}
        </div>

        {/* Mobile sidebar overlay */}
        {mobileOpen && (
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}
            onClick={() => setMobileOpen(false)}
          >
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />
            <div style={{ position: 'relative', zIndex: 10 }} onClick={e => e.stopPropagation()}>
              {sidebarContent}
            </div>
          </div>
        )}

        {/* Main content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
          {/* Evaluation banner */}
          {evaluationDaysRemaining !== null && (
            <div style={{
              background: evaluationDaysRemaining <= 5 ? '#EF4444' : evaluationDaysRemaining <= 10 ? '#F59E0B' : '#2E7DE8',
              color: 'white', padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              fontSize: 13.5, fontWeight: 500, flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle style={{ width: 16, height: 16 }} />
                {evaluationDaysRemaining === 0
                  ? 'Your evaluation period has expired.'
                  : evaluationDaysRemaining === 1
                    ? 'Last day of your evaluation period!'
                    : `${evaluationDaysRemaining} days remaining in your evaluation period.`}
              </div>
              <Link
                to={createPageUrl("UpgradeSubscription")}
                style={{
                  background: 'rgba(255,255,255,0.2)', color: 'white', padding: '4px 14px',
                  borderRadius: 6, fontSize: 12, fontWeight: 700, textDecoration: 'none',
                  border: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'background 150ms',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              >
                Upgrade Now <ArrowUpRight style={{ width: 13, height: 13 }} />
              </Link>
            </div>
          )}

          {/* Mobile top bar */}
          <div className="flex md:hidden" style={{
            background: '#1E3A5F', color: 'white', padding: '12px 16px',
            alignItems: 'center', gap: 12, flexShrink: 0,
          }}>
            <button
              onClick={() => setMobileOpen(true)}
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, padding: 8, color: 'white', cursor: 'pointer' }}
            >
              <Menu style={{ width: 20, height: 20 }} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Cloud style={{ width: 18, height: 18 }} />
              <span style={{ fontWeight: 700, fontSize: 15 }}>Edge Cloud ERP</span>
            </div>
          </div>

          {/* Page content */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            {children}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Auth wrapper ────────────────────────────────────────────
function AuthWrapper({ children }) {
  const location = useLocation();
  const [isChecking, setIsChecking] = React.useState(true);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await User.getCurrent();
        setIsAuthenticated(!!currentUser);
      } catch {
        setIsAuthenticated(false);
      } finally {
        setIsChecking(false);
      }
    };
    checkAuth();
  }, []);

  if (isChecking) return <LoadingScreen />;

  const publicPages = ['/SetupSuperAdmin', '/EvaluationSignup'];
  if (publicPages.includes(location.pathname)) return children;

  if (!isAuthenticated) {
    return (
      <LandingPage
        onLogin={() => {
          sessionStorage.setItem('returnUrl', window.location.pathname);
          window.location.href = '/';
        }}
      />
    );
  }

  return children;
}

// ── Root export ─────────────────────────────────────────────
export default function Layout({ children }) {
  return (
    <AuthWrapper>
      <CompanyProvider>
        <LayoutContent>{children}</LayoutContent>
      </CompanyProvider>
    </AuthWrapper>
  );
}

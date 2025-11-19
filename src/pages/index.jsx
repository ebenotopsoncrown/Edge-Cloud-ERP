import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import Invoices from "./Invoices";

import Customers from "./Customers";

import Bills from "./Bills";

import Vendors from "./Vendors";

import Products from "./Products";

import POS from "./POS";

import ChartOfAccounts from "./ChartOfAccounts";

import JournalEntries from "./JournalEntries";

import Banking from "./Banking";

import Reports from "./Reports";

import FixedAssets from "./FixedAssets";

import Manufacturing from "./Manufacturing";

import JobCosting from "./JobCosting";

import SalesDashboard from "./SalesDashboard";

import PurchaseDashboard from "./PurchaseDashboard";

import InventoryDashboard from "./InventoryDashboard";

import ManufacturingDashboard from "./ManufacturingDashboard";

import JobCostingDashboard from "./JobCostingDashboard";

import AccountingDashboard from "./AccountingDashboard";

import FixedAssetsDashboard from "./FixedAssetsDashboard";

import Settings from "./Settings";

import PayrollDashboard from "./PayrollDashboard";

import NonProfitDashboard from "./NonProfitDashboard";

import ManagementDashboard from "./ManagementDashboard";

import Payroll from "./Payroll";

import PurchaseOrders from "./PurchaseOrders";

import LicenseManagement from "./LicenseManagement";

import LicensingGuide from "./LicensingGuide";

import DeploymentGuide from "./DeploymentGuide";

import MultiTenancyGuide from "./MultiTenancyGuide";

import DatabaseSecurityGuide from "./DatabaseSecurityGuide";

import POSReports from "./POSReports";

import CompanyManagement from "./CompanyManagement";

import SupportGuide from "./SupportGuide";

import InventoryReports from "./InventoryReports";

import ReceiveInventory from "./ReceiveInventory";

import Payments from "./Payments";

import UserManagement from "./UserManagement";

import EvaluationSignup from "./EvaluationSignup";

import UpgradeSubscription from "./UpgradeSubscription";

import SetupSuperAdmin from "./SetupSuperAdmin";

import StoreManagement from "./StoreManagement";

import InventoryLocationManagement from "./InventoryLocationManagement";

import ImportData from "./ImportData";

import ExchangeRates from "./ExchangeRates";

import FXRevaluation from "./FXRevaluation";

import LockManagement from "./LockManagement";

import AuditTrail from "./AuditTrail";

import AccountingDemo from "./AccountingDemo";

import SalesReturns from "./SalesReturns";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    Invoices: Invoices,
    
    Customers: Customers,
    
    Bills: Bills,
    
    Vendors: Vendors,
    
    Products: Products,
    
    POS: POS,
    
    ChartOfAccounts: ChartOfAccounts,
    
    JournalEntries: JournalEntries,
    
    Banking: Banking,
    
    Reports: Reports,
    
    FixedAssets: FixedAssets,
    
    Manufacturing: Manufacturing,
    
    JobCosting: JobCosting,
    
    SalesDashboard: SalesDashboard,
    
    PurchaseDashboard: PurchaseDashboard,
    
    InventoryDashboard: InventoryDashboard,
    
    ManufacturingDashboard: ManufacturingDashboard,
    
    JobCostingDashboard: JobCostingDashboard,
    
    AccountingDashboard: AccountingDashboard,
    
    FixedAssetsDashboard: FixedAssetsDashboard,
    
    Settings: Settings,
    
    PayrollDashboard: PayrollDashboard,
    
    NonProfitDashboard: NonProfitDashboard,
    
    ManagementDashboard: ManagementDashboard,
    
    Payroll: Payroll,
    
    PurchaseOrders: PurchaseOrders,
    
    LicenseManagement: LicenseManagement,
    
    LicensingGuide: LicensingGuide,
    
    DeploymentGuide: DeploymentGuide,
    
    MultiTenancyGuide: MultiTenancyGuide,
    
    DatabaseSecurityGuide: DatabaseSecurityGuide,
    
    POSReports: POSReports,
    
    CompanyManagement: CompanyManagement,
    
    SupportGuide: SupportGuide,
    
    InventoryReports: InventoryReports,
    
    ReceiveInventory: ReceiveInventory,
    
    Payments: Payments,
    
    UserManagement: UserManagement,
    
    EvaluationSignup: EvaluationSignup,
    
    UpgradeSubscription: UpgradeSubscription,
    
    SetupSuperAdmin: SetupSuperAdmin,
    
    StoreManagement: StoreManagement,
    
    InventoryLocationManagement: InventoryLocationManagement,
    
    ImportData: ImportData,
    
    ExchangeRates: ExchangeRates,
    
    FXRevaluation: FXRevaluation,
    
    LockManagement: LockManagement,
    
    AuditTrail: AuditTrail,
    
    AccountingDemo: AccountingDemo,
    
    SalesReturns: SalesReturns,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Invoices" element={<Invoices />} />
                
                <Route path="/Customers" element={<Customers />} />
                
                <Route path="/Bills" element={<Bills />} />
                
                <Route path="/Vendors" element={<Vendors />} />
                
                <Route path="/Products" element={<Products />} />
                
                <Route path="/POS" element={<POS />} />
                
                <Route path="/ChartOfAccounts" element={<ChartOfAccounts />} />
                
                <Route path="/JournalEntries" element={<JournalEntries />} />
                
                <Route path="/Banking" element={<Banking />} />
                
                <Route path="/Reports" element={<Reports />} />
                
                <Route path="/FixedAssets" element={<FixedAssets />} />
                
                <Route path="/Manufacturing" element={<Manufacturing />} />
                
                <Route path="/JobCosting" element={<JobCosting />} />
                
                <Route path="/SalesDashboard" element={<SalesDashboard />} />
                
                <Route path="/PurchaseDashboard" element={<PurchaseDashboard />} />
                
                <Route path="/InventoryDashboard" element={<InventoryDashboard />} />
                
                <Route path="/ManufacturingDashboard" element={<ManufacturingDashboard />} />
                
                <Route path="/JobCostingDashboard" element={<JobCostingDashboard />} />
                
                <Route path="/AccountingDashboard" element={<AccountingDashboard />} />
                
                <Route path="/FixedAssetsDashboard" element={<FixedAssetsDashboard />} />
                
                <Route path="/Settings" element={<Settings />} />
                
                <Route path="/PayrollDashboard" element={<PayrollDashboard />} />
                
                <Route path="/NonProfitDashboard" element={<NonProfitDashboard />} />
                
                <Route path="/ManagementDashboard" element={<ManagementDashboard />} />
                
                <Route path="/Payroll" element={<Payroll />} />
                
                <Route path="/PurchaseOrders" element={<PurchaseOrders />} />
                
                <Route path="/LicenseManagement" element={<LicenseManagement />} />
                
                <Route path="/LicensingGuide" element={<LicensingGuide />} />
                
                <Route path="/DeploymentGuide" element={<DeploymentGuide />} />
                
                <Route path="/MultiTenancyGuide" element={<MultiTenancyGuide />} />
                
                <Route path="/DatabaseSecurityGuide" element={<DatabaseSecurityGuide />} />
                
                <Route path="/POSReports" element={<POSReports />} />
                
                <Route path="/CompanyManagement" element={<CompanyManagement />} />
                
                <Route path="/SupportGuide" element={<SupportGuide />} />
                
                <Route path="/InventoryReports" element={<InventoryReports />} />
                
                <Route path="/ReceiveInventory" element={<ReceiveInventory />} />
                
                <Route path="/Payments" element={<Payments />} />
                
                <Route path="/UserManagement" element={<UserManagement />} />
                
                <Route path="/EvaluationSignup" element={<EvaluationSignup />} />
                
                <Route path="/UpgradeSubscription" element={<UpgradeSubscription />} />
                
                <Route path="/SetupSuperAdmin" element={<SetupSuperAdmin />} />
                
                <Route path="/StoreManagement" element={<StoreManagement />} />
                
                <Route path="/InventoryLocationManagement" element={<InventoryLocationManagement />} />
                
                <Route path="/ImportData" element={<ImportData />} />
                
                <Route path="/ExchangeRates" element={<ExchangeRates />} />
                
                <Route path="/FXRevaluation" element={<FXRevaluation />} />
                
                <Route path="/LockManagement" element={<LockManagement />} />
                
                <Route path="/AuditTrail" element={<AuditTrail />} />
                
                <Route path="/AccountingDemo" element={<AccountingDemo />} />
                
                <Route path="/SalesReturns" element={<SalesReturns />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}
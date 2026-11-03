// Master data for the MLU demo. All organisations and people are fictional, and
// phone numbers, emails and tax numbers are placeholders.
//
// Rows list both the database's column names and the names the app's forms use.
// seed.mjs writes only the ones that exist, and reports the rest.
import { readFileSync } from 'fs';
import { join } from 'path';
import { projectRoot } from './lib.mjs';

const NGN = 'NGN';
const email = (slug) => `accounts@${slug}.example.com`;
const phone = (n) => `+234 800 000 ${String(n).padStart(4, '0')}`;

export const COMPANY_PROFILE = {
  base_currency: NGN,
  currency: NGN,
  fiscal_year_start: '01-01',
  fiscal_year_end: '12-31',
  address: 'Nigeria',
  company_type: 'education',
  industry: 'Education & Training',
  modules_enabled: { sales: true, purchases: true, inventory: true, accounting: true, pos: true, manufacturing: true, job_costing: true, fixed_assets: true, payroll: true, non_profit: true, multi_currency: true },
  modules: { sales: true, purchases: true, inventory: true, accounting: true, pos: true, manufacturing: true, job_costing: true, fixed_assets: true, payroll: true, non_profit: true, multi_currency: true },
  onboarding_completed: true,
  chart_of_accounts_setup: true,
};

// ── Chart of accounts: the setup wizard's fullest template, plus Nigerian statutory
// accounts and what this company's activities need.
//
// Names avoid "receivable" on tax assets and "tax" on WHT and PAYE, because the app
// picks its default A/R and invoice-tax accounts by searching account names.
export async function buildAccounts() {
  const source = readFileSync(join(projectRoot, 'src/components/setup/ChartOfAccountsTemplates.jsx'), 'utf8');
  const { CHART_OF_ACCOUNTS_TEMPLATES } = await import(`data:text/javascript;charset=utf-8,${encodeURIComponent(source)}`);
  const template = CHART_OF_ACCOUNTS_TEMPLATES.manufacturing.accounts.map(a => (a.code === '2200' ? { ...a, name: 'VAT Payable' } : a));
  const extras = [
    { code: '1030', name: 'Bank - USD Domiciliary Account', type: 'asset', category: 'current_asset' },
    { code: '1150', name: 'Input VAT Recoverable', type: 'asset', category: 'current_asset' },
    { code: '1160', name: 'WHT Credits', type: 'asset', category: 'current_asset' },
    { code: '1250', name: 'Construction Work in Progress', type: 'asset', category: 'current_asset' },
    { code: '1550', name: 'Office Furniture & Equipment', type: 'asset', category: 'fixed_asset' },
    { code: '1555', name: 'Accumulated Depreciation - Furniture & Equipment', type: 'asset', category: 'fixed_asset' },
    { code: '1560', name: 'Computer Equipment', type: 'asset', category: 'fixed_asset' },
    { code: '1565', name: 'Accumulated Depreciation - Computers', type: 'asset', category: 'fixed_asset' },
    { code: '1570', name: 'Motor Vehicles', type: 'asset', category: 'fixed_asset' },
    { code: '1575', name: 'Accumulated Depreciation - Vehicles', type: 'asset', category: 'fixed_asset' },
    { code: '2210', name: 'WHT Payable', type: 'liability', category: 'current_liability' },
    { code: '2310', name: 'PAYE Payable', type: 'liability', category: 'current_liability' },
    { code: '2320', name: 'Pension Payable', type: 'liability', category: 'current_liability' },
    { code: '4010', name: 'Tuition & Training Fees', type: 'revenue', category: 'operating_revenue' },
    { code: '4020', name: 'Consulting Income', type: 'revenue', category: 'operating_revenue' },
    { code: '4030', name: 'Construction Contract Revenue', type: 'revenue', category: 'operating_revenue' },
    { code: '5400', name: 'Subcontractors', type: 'cost_of_goods_sold', category: 'cost_of_sales' },
    { code: '6010', name: 'Employer Pension Contributions', type: 'expense', category: 'operating_expense' },
    { code: '7200', name: 'Foreign Exchange Gain/Loss', type: 'expense', category: 'other_expense' },
  ];
  return [...template, ...extras]
    .sort((a, b) => a.code.localeCompare(b.code))
    .map(a => ({
      code: a.code, account_code: a.code, name: a.name, account_name: a.name,
      type: a.type, account_type: a.type, account_category: a.category,
      balance: 0, currency: NGN, is_active: true,
    }));
}

// Indicative demo rates, not market data. 1 unit of foreign currency = rate in NGN.
export const EXCHANGE_RATES = [
  ['USD', 1550], ['EUR', 1780], ['GBP', 2060],
].map(([from, rate]) => ({
  from_currency: from, to_currency: NGN, rate, exchange_rate: rate,
  effective_date: '2026-11-01', rate_type: 'spot', source: 'Demo rate',
}));

const party = ([name, slug, contact, street, city, state], index, kind) => ({
  name, company_name: name, contact_person: contact,
  email: email(slug), phone: phone(index + (kind === 'CUST' ? 1 : 101)),
  address: `${street}, ${city}, ${state}, Nigeria`, street_address: street, city, state, country: 'Nigeria',
  tax_id: `DEMO-TIN-${kind}-${String(index + 1).padStart(3, '0')}`,
  currency: NGN, is_active: true, balance: 0,
});

export const CUSTOMERS = [
  ['Adunola Crest Academy', 'adunolacrest', 'Mrs Adunola Bankole', '14 Crestview Road', 'Ibadan', 'Oyo'],
  ['Nkemdi Polytechnic Services Ltd', 'nkemdipoly', 'Mr Nkemdi Eze', '22 College Avenue', 'Enugu', 'Enugu'],
  ['Baraka Skills Institute', 'barakaskills', 'Hajiya Baraka Sule', '5 Unity Close', 'Kaduna', 'Kaduna'],
  ['Tamuno Oilfield Training Co', 'tamunotraining', 'Engr Tamuno Briggs', '31 Harbour Link', 'Port Harcourt', 'Rivers'],
  ['Ofure Microfinance Bank Ltd', 'ofuremfb', 'Mr Ofure Ighodaro', '8 Palm Grove Street', 'Benin City', 'Edo'],
  ['Golden Sahel Agro Cooperative', 'goldensahel', 'Malam Isa Danjuma', '17 Market Road', 'Kano', 'Kano'],
  ['Ikenga Heritage Schools', 'ikengaheritage', 'Dr Chidi Nwosu', '3 Heritage Drive', 'Awka', 'Anambra'],
  ['Lagoon City Consulting Partners', 'lagooncity', 'Ms Tola Adeyemi', '46 Marina View', 'Lagos', 'Lagos'],
  ['Zuma Ridge Logistics Ltd', 'zumaridge', 'Mr Abba Yusuf', '12 Depot Crescent', 'Abuja', 'FCT'],
  ['Ewere Community Health Trust', 'ewerehealth', 'Dr Ewere Okoro', '9 Wellness Way', 'Asaba', 'Delta'],
  ['Kwara Valley Foods Plc', 'kwaravalley', 'Mrs Rukayat Alabi', '27 Industrial Layout', 'Ilorin', 'Kwara'],
  ['Crossriver Bright Futures Foundation', 'brightfutures', 'Mr Effiong Bassey', '6 Marina Lane', 'Calabar', 'Cross River'],
].map((row, i) => ({
  ...party(row, i, 'CUST'),
  customer_code: `CUST-${String(i + 1).padStart(3, '0')}`,
  credit_limit: [2000000, 5000000, 1500000, 10000000][i % 4],
  payment_terms: 'net_30',
  notes: 'Demo customer',
}));

export const VENDORS = [
  ['Olumide Educational Publishers Ltd', 'olumidebooks', 'Mr Olumide Ajayi', '19 Book Haven Road', 'Ibadan', 'Oyo'],
  ['Chukwudi Office Supplies Ltd', 'chukwudioffice', 'Mr Chukwudi Obi', '40 Trade Fair Complex', 'Lagos', 'Lagos'],
  ['Hadiza Technical Components Ltd', 'hadizatech', 'Mrs Hadiza Bello', '2 Electronics Plaza', 'Kano', 'Kano'],
  ['Ekanem Building Materials Co', 'ekanembuild', 'Mr Ekanem Udo', '55 Quarry Road', 'Uyo', 'Akwa Ibom'],
  ['Damilola Facility Services Ltd', 'damilolafm', 'Ms Damilola Fashola', '7 Service Lane', 'Abuja', 'FCT'],
  ['Northgate Power Solutions Ltd', 'northgatepower', 'Engr Sani Garba', '33 Transformer Close', 'Kaduna', 'Kaduna'],
  ['Amaka Uniforms & Branding', 'amakabrands', 'Mrs Amaka Okeke', '11 Fashion Street', 'Aba', 'Abia'],
  ['Delta Crest Civil Contractors Ltd', 'deltacrest', 'Engr Efe Omonigho', '24 Site Road', 'Warri', 'Delta'],
].map((row, i) => ({
  ...party(row, i, 'VEND'),
  vendor_code: `VEND-${String(i + 1).padStart(3, '0')}`,
  payment_terms: 'net_30',
  notes: 'Demo vendor',
}));

// Quantities start at zero: stock on hand without a posted opening journal would
// show a stock value that the ledger doesn't have, and there are no transactions yet.
const product = (sku, name, description, type, category, unit, cost, price, taxRate, reorder) => ({
  sku, name, product_name: name, description,
  type, product_type: type, category,
  unit, unit_of_measure: unit,
  cost_price: cost, sale_price: price, unit_price: price,
  tax_rate: taxRate, quantity: 0, quantity_on_hand: 0,
  reorder_point: reorder, reorder_level: reorder,
  track_inventory: type === 'inventory', is_active: true,
});
const VAT = 7.5;
export const PRODUCTS = [
  // Stock items
  product('STK-001', 'Principles of Accounting Textbook', 'Core course text', 'inventory', 'Books', 'each', 6500, 9500, 0, 50),
  product('STK-002', 'Practical Bookkeeping Workbook', 'Exercises and answer sheets', 'inventory', 'Books', 'each', 2800, 4500, 0, 80),
  product('STK-003', 'Scientific Calculator', 'Approved for examinations', 'inventory', 'Student Supplies', 'each', 7200, 11000, VAT, 30),
  product('STK-004', 'University Branded Polo Shirt', 'Staff and student wear', 'inventory', 'Merchandise', 'each', 4800, 8000, VAT, 40),
  product('STK-005', 'Laptop Backpack', 'Branded, padded', 'inventory', 'Merchandise', 'each', 9500, 15000, VAT, 20),
  // Services
  product('SRV-001', 'Accounting Foundation Course', 'Twelve-week course fee, per student', 'service', 'Training', 'course', 0, 150000, 0, 0),
  product('SRV-002', 'Professional Exam Preparation', 'Eight-week intensive, per student', 'service', 'Training', 'course', 0, 220000, 0, 0),
  product('SRV-003', 'Corporate Training Day', 'On-site training, per day', 'service', 'Training', 'day', 0, 450000, VAT, 0),
  product('SRV-004', 'Finance Systems Consulting', 'Advisory, per hour', 'service', 'Consulting', 'hour', 0, 45000, VAT, 0),
  // Manufacturing components
  product('CMP-001', 'Kit Enclosure Box', 'Component: moulded case', 'inventory', 'Manufacturing Components', 'each', 3200, 0, VAT, 40),
  product('CMP-002', 'Solderless Breadboard', 'Component', 'inventory', 'Manufacturing Components', 'each', 2100, 0, VAT, 60),
  product('CMP-003', 'Digital Multimeter', 'Component', 'inventory', 'Manufacturing Components', 'each', 8400, 0, VAT, 25),
  product('CMP-004', 'Jumper Wire Set', 'Component: pack of 65', 'inventory', 'Manufacturing Components', 'pack', 1500, 0, VAT, 60),
  product('CMP-005', 'Assembly Instruction Booklet', 'Component', 'inventory', 'Manufacturing Components', 'each', 600, 0, 0, 60),
  // Finished good built from the components above
  product('FG-001', 'Student Electronics Lab Kit', 'Finished good, assembled from CMP-001 to CMP-005', 'inventory', 'Finished Goods', 'kit', 15800, 28000, VAT, 15),
];

export const BOM = {
  finished_sku: 'FG-001',
  name: 'Student Electronics Lab Kit BOM', bom_number: 'BOM-001', version: '1.0', quantity: 1, is_active: true,
  notes: 'Demo bill of materials',
  components: [['CMP-001', 1], ['CMP-002', 1], ['CMP-003', 1], ['CMP-004', 1], ['CMP-005', 1]],
  labor_hours: 0.5, labor_rate_per_hour: 3000, overhead_rate: 0,
};

const employee = (i, first, last, department, position, hired, pay) => ({
  employee_number: `EMP-${String(i).padStart(3, '0')}`, employee_code: `EMP-${String(i).padStart(3, '0')}`,
  first_name: first, last_name: last,
  email: `${first}.${last}`.toLowerCase() + '@mlu-demo.example.com', phone: phone(200 + i),
  department, position, job_title: position, hire_date: hired,
  employment_type: 'full_time', pay_type: 'salary', pay_frequency: 'monthly',
  pay_rate: pay, basic_salary: pay, currency: NGN, status: 'active', is_active: true,
});
export const EMPLOYEES = [
  employee(1, 'Ifeoma', 'Nwachukwu', 'Finance', 'Finance Manager', '2021-02-01', 650000),
  employee(2, 'Babatunde', 'Oyelaran', 'Finance', 'Accounts Officer', '2022-06-13', 320000),
  employee(3, 'Zainab', 'Abdullahi', 'Training', 'Head of Training', '2020-09-07', 720000),
  employee(4, 'Emeka', 'Onuoha', 'Training', 'Lecturer', '2023-01-16', 410000),
  employee(5, 'Blessing', 'Akpan', 'Administration', 'Administrative Officer', '2023-08-01', 280000),
  employee(6, 'Musa', 'Lawal', 'Projects', 'Site Supervisor', '2024-03-04', 380000),
];

const asset = (i, name, category, accountCode, date, cost, salvage, life, location) => ({
  asset_number: `FA-${String(i).padStart(3, '0')}`, asset_code: `FA-${String(i).padStart(3, '0')}`,
  name, asset_name: name, category, accountCode,
  purchase_date: date, acquisition_date: date,
  purchase_cost: cost, acquisition_cost: cost, salvage_value: salvage,
  useful_life: life, useful_life_years: life,
  depreciation_method: 'straight_line', location, status: 'active', is_active: true,
  notes: 'Demo asset. No journal posted.',
});
export const FIXED_ASSETS = [
  asset(1, 'Toyota Hiace Staff Bus', 'vehicles', '1570', '2024-02-15', 38000000, 5000000, 8, 'Main Campus'),
  asset(2, 'Computer Lab Workstations (30)', 'computer_equipment', '1560', '2024-09-02', 27000000, 1500000, 5, 'ICT Lab'),
  asset(3, 'Lecture Hall Furniture Set', 'furniture', '1550', '2023-11-20', 9500000, 500000, 10, 'Lecture Hall B'),
  asset(4, '60 kVA Diesel Generator', 'machinery', '1500', '2025-01-10', 21000000, 2000000, 10, 'Power House'),
  asset(5, 'Kit Assembly Workbench Line', 'machinery', '1500', '2025-06-05', 6800000, 300000, 7, 'Workshop'),
];

export const JOBS = [
  {
    job_number: 'JOB-001', name: 'Adunola Crest Science Block', job_name: 'Adunola Crest Science Block',
    customerName: 'Adunola Crest Academy', job_type: 'fixed_price', status: 'in_progress',
    start_date: '2026-09-01', end_date: '2027-03-31', expected_end_date: '2027-03-31',
    contract_value: 85000000, contract_amount: 85000000, budget: 68000000, budgeted_cost: 68000000,
    actual_cost: 0, percent_complete: 0, location: 'Ibadan, Oyo', project_manager: 'Musa Lawal',
    notes: 'Two-storey laboratory block. Demo job.',
  },
  {
    job_number: 'JOB-002', name: 'Ewere Community Clinic Extension', job_name: 'Ewere Community Clinic Extension',
    customerName: 'Ewere Community Health Trust', job_type: 'fixed_price', status: 'pending',
    start_date: '2027-01-11', end_date: '2027-06-30', expected_end_date: '2027-06-30',
    contract_value: 42000000, contract_amount: 42000000, budget: 33500000, budgeted_cost: 33500000,
    actual_cost: 0, percent_complete: 0, location: 'Asaba, Delta', project_manager: 'Musa Lawal',
    notes: 'Outpatient wing extension. Demo job.',
  },
];

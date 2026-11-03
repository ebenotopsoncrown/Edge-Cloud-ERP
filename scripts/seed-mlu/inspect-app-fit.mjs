// Read-only: compares the fields the app's forms send with the columns that really exist.
// A write containing an unknown column is rejected outright by the database API.
import { readFileSync } from 'fs';
import { join } from 'path';
import { getSchema, projectRoot, scrub } from './lib.mjs';

// Each form's field list, taken from its initial state.
const APP_FIELDS = {
  customers: ['company_id', 'customer_code', 'company_name', 'contact_person', 'email', 'phone', 'billing_address', 'shipping_address', 'credit_limit', 'payment_terms', 'tax_number', 'currency', 'notes', 'is_active', 'total_outstanding'],
  vendors: ['company_id', 'vendor_code', 'company_name', 'contact_person', 'email', 'phone', 'address', 'payment_terms', 'tax_number', 'currency', 'bank_details', 'notes', 'is_active', 'total_outstanding'],
  products: ['company_id', 'sku', 'product_name', 'description', 'category', 'product_type', 'unit_price', 'cost_price', 'unit_of_measure', 'quantity_on_hand', 'reorder_level', 'reorder_quantity', 'barcode', 'tax_rate', 'sales_account_id', 'inventory_account_id', 'cogs_account_id', 'location_id', 'is_active'],
  employees: ['company_id', 'employee_code', 'first_name', 'last_name', 'email', 'phone', 'date_of_birth', 'hire_date', 'department', 'job_title', 'employment_type', 'pay_frequency', 'basic_salary', 'currency', 'tax_id', 'is_active'],
  fixed_assets: ['company_id', 'asset_code', 'asset_name', 'description', 'category', 'acquisition_date', 'acquisition_cost', 'useful_life_years', 'depreciation_method', 'salvage_value', 'location', 'assigned_to', 'serial_number', 'vendor_id', 'warranty_expiry', 'asset_account_id', 'depreciation_account_id', 'accumulated_depreciation_account_id', 'notes', 'is_active'],
  jobs: ['company_id', 'job_number', 'job_name', 'description', 'customer_id', 'customer_name', 'job_type', 'status', 'start_date', 'expected_end_date', 'contract_amount', 'budgeted_cost', 'actual_cost', 'percent_complete', 'project_manager', 'location', 'notes'],
  exchange_rates: ['company_id', 'from_currency', 'to_currency', 'exchange_rate', 'effective_date', 'rate_type', 'source'],
  bill_of_materials: ['company_id', 'bom_number', 'product_id', 'product_name', 'version', 'is_active', 'components', 'labor_hours', 'labor_rate_per_hour', 'overhead_rate', 'total_material_cost', 'total_labor_cost', 'total_overhead_cost', 'total_cost'],
  accounts: ['company_id', 'account_code', 'account_name', 'account_type', 'account_category', 'balance', 'is_active', 'currency'],
  invoices: ['company_id', 'invoice_number', 'customer_id', 'customer_name', 'job_id', 'job_name', 'invoice_date', 'due_date', 'status', 'currency', 'ar_account_id', 'revenue_account_id', 'tax_account_id', 'line_items', 'subtotal', 'tax_total', 'total_amount', 'notes', 'billing_address', 'shipping_address', 'payment_terms', 'amount_paid', 'balance_due', 'journal_entry_id'],
  bills: ['company_id', 'bill_number', 'vendor_id', 'vendor_name', 'bill_date', 'due_date', 'status', 'currency', 'ap_account_id', 'expense_account_id', 'tax_account_id', 'line_items', 'subtotal', 'tax_total', 'total_amount', 'amount_paid', 'balance_due', 'journal_entry_id'],
  journal_entries: ['company_id', 'entry_number', 'entry_date', 'reference', 'source_type', 'source_id', 'description', 'status', 'line_items', 'total_debits', 'total_credits', 'posted_by', 'posted_date'],
  payments: ['company_id', 'payment_type', 'contact_id', 'contact_name', 'payment_date', 'amount', 'currency', 'payment_method', 'reference', 'bank_account_id', 'ar_ap_account_id', 'invoice_id', 'bill_id', 'notes', 'amount_base_currency', 'exchange_rate', 'status', 'journal_entry_id'],
};

try {
  const schema = await getSchema();
  for (const [table, fields] of Object.entries(APP_FIELDS)) {
    if (!schema[table]) { console.log(`${table}: TABLE MISSING`); continue; }
    const columns = Object.keys(schema[table]);
    const missing = fields.filter(f => !columns.includes(f));
    console.log(`${table}: ${missing.length === 0 ? 'OK' : `${missing.length}/${fields.length} app fields have no column -> ${missing.join(', ')}`}`);
  }
  for (const table of ['company_members', 'journal_entries', 'invoices', 'bills', 'payments']) {
    console.log(`\n--- ${table}\n${Object.entries(schema[table] || {}).map(([c, i]) => `${c}:${i.type}${i.required && !i.hasDefault ? '!' : ''}`).join(', ')}`);
  }
  const wizard = readFileSync(join(projectRoot, 'src/components/products/ProductForm.jsx'), 'utf8');
  console.log('\nProduct types in form:', [...wizard.matchAll(/SelectItem value="(\w+)"/g)].map(m => m[1]).join(', '));
  const signup = readFileSync(join(projectRoot, 'src/pages/EvaluationSignup.jsx'), 'utf8');
  console.log('Company types in signup:', [...signup.matchAll(/value: '([a-z_]+)'/g)].map(m => m[1]).slice(0, 12).join(', '));
} catch (error) {
  console.error('Failed:', scrub(error.message));
  process.exit(1);
}

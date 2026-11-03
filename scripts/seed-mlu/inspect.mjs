// Read-only: prints the real columns of the tables the seed cares about, and what MLU already has.
import { COMPANY_ID, countRows, getSchema, readRows, scrub, writeOutput } from './lib.mjs';

const WANTED = ['companies', 'accounts', 'exchange_rates', 'customers', 'vendors', 'products', 'bill_of_materials', 'employees', 'fixed_assets', 'jobs', 'job_phases', 'cost_codes', 'inventory_locations', 'product_locations', 'payroll_items', 'stores', 'users', 'roles'];
const TRANSACTIONS = ['invoices', 'bills', 'payments', 'journal_entries', 'inventory_transactions', 'inventory_receipts', 'purchase_orders', 'sales_returns', 'work_orders', 'job_costs', 'payroll_runs', 'pos_sales', 'pos_sessions', 'pos_terminals', 'audit_logs', 'record_locks', 'record_versions', 'donations', 'donors', 'grants', 'programs', 'np_budgets', 'licenses', 'app_settings'];

try {
  const schema = await getSchema();
  writeOutput('schema.json', schema);
  console.log(`Tables visible: ${Object.keys(schema).length}`);
  console.log(`All tables: ${Object.keys(schema).sort().join(', ')}\n`);

  for (const table of WANTED) {
    if (!schema[table]) { console.log(`--- ${table}: NOT IN DATABASE\n`); continue; }
    console.log(`--- ${table}`);
    console.log(Object.entries(schema[table]).map(([c, i]) => `${c}:${i.type}${i.required && !i.hasDefault ? '!' : ''}${i.fk ? `->${i.fk}` : ''}`).join(', '));
    console.log('');
  }

  const company = (await readRows('companies'))[0];
  if (!company) throw new Error(`Company ${COMPANY_ID} does not exist.`);
  console.log('=== Target company (current values)');
  console.log(JSON.stringify(company, null, 1));

  console.log('\n=== Rows MLU already has');
  for (const table of [...WANTED, ...TRANSACTIONS]) {
    if (!schema[table] || table === 'companies') continue;
    if (!schema[table].company_id) { console.log(`${table}: no company_id column`); continue; }
    console.log(`${table}: ${await countRows(table)}`);
  }
} catch (error) {
  console.error('Inspect failed:', scrub(error.message));
  process.exit(1);
}

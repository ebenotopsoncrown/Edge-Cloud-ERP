// Seeds master data for the MLU company only.
//
//   node scripts/seed-mlu/seed.mjs            first run; refuses if MLU already has seeded rows
//   node scripts/seed-mlu/seed.mjs --reset    deletes MLU's rows from the seeded tables, then re-seeds
//
// Fields with no matching column are skipped and reported. Tables with no company_id
// column are not written at all: the rows couldn't be scoped to MLU or reset safely.
import { existsSync } from 'fs';
import { join } from 'path';
import {
  COMPANY_ID, countAll, countRows, deleteCompanyRows, getSchema, insertRows, outputDir,
  readRows, scrub, updateCompany, writeOutput,
} from './lib.mjs';
import { BOM, COMPANY_PROFILE, CUSTOMERS, EMPLOYEES, EXCHANGE_RATES, FIXED_ASSETS, JOBS, PRODUCTS, VENDORS, buildAccounts } from './data.mjs';

const EXPECTED_COMPANY_NAME = 'Margaret Lawrence';
// Children before parents, so foreign keys don't block a reset.
const SEEDED_TABLES = ['bill_of_materials', 'jobs', 'fixed_assets', 'employees', 'products', 'vendors', 'customers', 'exchange_rates', 'accounts'];

const args = process.argv.slice(2);
const unknown = args.filter(a => a !== '--reset');
if (unknown.length) { console.error(`Unknown option: ${unknown.join(' ')}. The only option is --reset.`); process.exit(1); }
const reset = args.includes('--reset');

async function main() {
  const schema = await getSchema();

  // Read first: confirm the target before anything is written.
  const [company] = await readRows('companies');
  if (!company || company.id !== COMPANY_ID) throw new Error(`Company ${COMPANY_ID} was not found. Nothing changed.`);
  if (!company.company_name?.includes(EXPECTED_COMPANY_NAME)) throw new Error(`Company ${COMPANY_ID} is "${company.company_name}", not the MLU company. Nothing changed.`);
  console.log(`Target: ${company.company_name}`);

  const scopable = SEEDED_TABLES.filter(t => schema[t]?.company_id);
  const unscopable = SEEDED_TABLES.filter(t => !schema[t]?.company_id);

  const existing = {};
  for (const table of scopable) existing[table] = await countRows(table);
  const hasRows = Object.values(existing).some(n => n > 0);
  for (const table of ['invoices', 'bills', 'payments', 'journal_entries']) {
    if (await countRows(table) > 0) throw new Error('MLU has transactions. Run seed-transactions.mjs --clear first. Nothing changed.');
  }
  if (hasRows && !reset) {
    throw new Error(`MLU already has rows (${JSON.stringify(existing)}). Re-run with --reset to replace them. Nothing changed.`);
  }

  // Every other company's rows must be untouched at the end.
  const othersBefore = {};
  for (const table of scopable) othersBefore[table] = (await countAll(table)) - existing[table];

  if (!existsSync(join(outputDir, 'company-before.json'))) writeOutput('company-before.json', company);

  if (reset) {
    for (const table of scopable) {
      const removed = await deleteCompanyRows(table);
      if (removed) console.log(`Reset: removed ${removed} from ${table}`);
    }
  }

  const skippedFields = {};
  const fit = (table, row) => {
    const out = {};
    for (const [key, value] of Object.entries(row)) {
      if (schema[table][key]) out[key] = value;
      else (skippedFields[table] ||= new Set()).add(key);
    }
    return out;
  };
  const seedTable = async (table, rows) => {
    if (!schema[table]?.company_id) return null;
    // Newest first is how the app lists rows, so stepping created_at back keeps file order.
    const start = Date.now();
    const shaped = rows.map((row, i) => ({ ...fit(table, row), company_id: COMPANY_ID, created_at: new Date(start - i * 1000).toISOString() }));
    const inserted = await insertRows(table, shaped);
    console.log(`Seeded ${table}: ${inserted.length}`);
    return inserted;
  };

  const errors = {};
  const attempt = async (table, rows) => {
    try { return await seedTable(table, rows); } catch (error) { errors[table] = scrub(error.message); console.error(`FAILED ${table}: ${errors[table]}`); return null; }
  };

  await updateCompany(fit('companies', COMPANY_PROFILE));
  console.log('Updated company profile');

  const accounts = await attempt('accounts', await buildAccounts()) || [];
  await attempt('exchange_rates', EXCHANGE_RATES);
  const customers = await attempt('customers', CUSTOMERS) || [];
  await attempt('vendors', VENDORS);
  const products = await attempt('products', PRODUCTS) || [];
  await attempt('employees', EMPLOYEES);

  const accountByCode = new Map(accounts.map(a => [a.account_code || a.code, a]));
  await attempt('fixed_assets', FIXED_ASSETS.map(({ accountCode, ...a }) => ({ ...a, account_id: accountByCode.get(accountCode)?.id, asset_account_id: accountByCode.get(accountCode)?.id })));

  const customerByName = new Map(customers.map(c => [c.name || c.company_name, c]));
  await attempt('jobs', JOBS.map(({ customerName, ...j }) => ({ ...j, customer_id: customerByName.get(customerName)?.id, customer_name: customerName })));

  const productBySku = new Map(products.map(p => [p.sku, p]));
  const finished = productBySku.get(BOM.finished_sku);
  const { finished_sku: _unused, components, ...bomFields } = BOM;
  await attempt('bill_of_materials', [{
    ...bomFields,
    product_id: finished?.id,
    product_name: finished?.name,
    components: components.map(([sku, quantity]) => {
      const part = productBySku.get(sku);
      return { product_id: part?.id, sku, product_name: part?.name, quantity, unit_cost: part?.cost_price, total_cost: (part?.cost_price || 0) * quantity };
    }),
  }]);

  // Report from the database, not from what was sent.
  const counts = {};
  const othersChanged = [];
  for (const table of scopable) {
    counts[table] = await countRows(table);
    const othersNow = (await countAll(table)) - counts[table];
    if (othersNow !== othersBefore[table]) othersChanged.push(`${table}: ${othersBefore[table]} -> ${othersNow}`);
  }
  const [after] = await readRows('companies');

  console.log('\n=== Rows for MLU, read back from the database');
  for (const table of SEEDED_TABLES) console.log(`${table.padEnd(20)} ${table in counts ? counts[table] : 'NOT FILLED (table has no company_id)'}`);
  console.log(`\nCompany: base_currency=${after.base_currency}, currency=${after.currency}, fiscal_year_end=${after.fiscal_year_end}, industry=${after.industry}, onboarding_completed=${after.onboarding_completed}`);
  console.log(`Other companies' row counts: ${othersChanged.length ? `CHANGED ${othersChanged.join('; ')}` : 'unchanged'}`);
  if (unscopable.length) console.log(`Not filled, no company_id column: ${unscopable.join(', ')}`);
  if (Object.keys(errors).length) console.log(`Errors: ${JSON.stringify(errors, null, 1)}`);
  console.log('\n=== Fields with no column, so not written');
  for (const [table, fields] of Object.entries(skippedFields)) console.log(`${table}: ${[...fields].join(', ')}`);

  writeOutput('last-run.json', {
    at: new Date().toISOString(), reset, counts, unscopable, errors,
    skippedFields: Object.fromEntries(Object.entries(skippedFields).map(([t, f]) => [t, [...f]])),
  });
  if (Object.keys(errors).length || othersChanged.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error('Seed stopped:', scrub(error.message));
  process.exit(1);
});

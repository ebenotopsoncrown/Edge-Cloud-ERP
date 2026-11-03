// Demo transactions for the MLU company only. Run seed.mjs first.
//
//   node scripts/seed-mlu/seed-transactions.mjs            first run; refuses if MLU has transactions
//   node scripts/seed-mlu/seed-transactions.mjs --reset    deletes MLU's transactions, then re-creates them
//   node scripts/seed-mlu/seed-transactions.mjs --clear    deletes MLU's transactions and stops
//
// Records use the same fields and posting rules as the app's own screens, so each one
// can be opened and edited there. Where this differs from the app, a comment says why.
import {
  COMPANY_ID, countRows, deleteCompanyRows, deleteRowById, insertRows, readRows, scrub,
  updateCompanyRows, updateRowById, writeOutput,
} from './lib.mjs';
import { JOBS } from './data.mjs';
import { checkBooks, isDebitNormal } from './books.mjs';

const args = process.argv.slice(2);
const unknown = args.filter(a => a !== '--reset' && a !== '--clear');
if (unknown.length) { console.error(`Unknown option: ${unknown.join(' ')}. Options are --reset and --clear.`); process.exit(1); }
const reset = args.includes('--reset');
const clearOnly = args.includes('--clear');

// Children before parents.
const TRANSACTION_TABLES = [
  'pos_sales', 'pos_sessions', 'pos_terminals', 'stores', 'inventory_locations',
  'job_costs', 'work_orders', 'payroll_runs', 'inventory_transactions', 'inventory_receipts',
  'payments', 'journal_entries', 'invoices', 'bills',
];

const TODAY = '2026-11-03';
const USD_RATE = 1550;
const VAT = 7.5;
const round2 = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const created = {};
const at = (date) => `${date}T12:00:00.000Z`;
let sequence = 0;
async function insert(table, row, date) {
  // Business date as created_at, because the app lists many records newest first.
  const stamp = new Date(new Date(at(date)).getTime() + (sequence++) * 1000).toISOString();
  const [saved] = await insertRows(table, [{ ...row, company_id: COMPANY_ID, created_at: stamp }]);
  created[table] = (created[table] || 0) + 1;
  return saved;
}

let accounts; let customers; let vendors; let products; let employees; let assets; let jobs; let boms;
const account = (code) => {
  const found = accounts.find(a => a.account_code === code);
  if (!found) throw new Error(`Account ${code} is missing. Run seed.mjs first.`);
  return found;
};
const customer = (name) => {
  const found = customers.find(c => c.company_name === name);
  if (!found) throw new Error(`Customer "${name}" is missing. Run seed.mjs first.`);
  return found;
};
const vendor = (name) => {
  const found = vendors.find(v => v.company_name === name);
  if (!found) throw new Error(`Vendor "${name}" is missing. Run seed.mjs first.`);
  return found;
};
const product = (sku) => {
  const found = products.find(p => p.sku === sku);
  if (!found) throw new Error(`Product ${sku} is missing. Run seed.mjs first.`);
  return found;
};

// ── Posting: the same debit and credit rule everywhere in the app ─────────────
const balanceChanges = new Map();
const quantityChanges = new Map();
const vendorOutstanding = new Map();
const line = (code, description, debit, credit) => {
  const a = account(code);
  return { account_id: a.id, account_name: a.account_name, account_code: a.account_code, description, debit: round2(debit), credit: round2(credit) };
};

async function postJournal({ entry_number, entry_date, reference, source_type, source_id, description, line_items }) {
  const debits = round2(line_items.reduce((s, l) => s + l.debit, 0));
  const credits = round2(line_items.reduce((s, l) => s + l.credit, 0));
  if (debits !== credits) throw new Error(`Journal ${entry_number} does not balance: ${debits} vs ${credits}.`);
  const saved = await insert('journal_entries', {
    entry_number, entry_date, reference, source_type, ...(source_id ? { source_id } : {}), description,
    status: 'posted', line_items, total_debits: debits, total_credits: credits,
    posted_by: 'system', posted_date: at(entry_date),
  }, entry_date);
  for (const l of line_items) {
    const a = accounts.find(x => x.id === l.account_id);
    const change = isDebitNormal(a.account_type) ? l.debit - l.credit : l.credit - l.debit;
    balanceChanges.set(a.id, (balanceChanges.get(a.id) || 0) + change);
  }
  return saved;
}

// ── Invoices (InvoiceForm) ────────────────────────────────────────────────────
const INVOICE_POSTED = ['sent', 'overdue'];
const invoices = new Map();

async function createInvoice({ number, customerName, date, due, status = 'sent', revenue, lines, currency = 'NGN', rate = null, notes = '' }) {
  if (!INVOICE_POSTED.includes(status)) throw new Error(`Invoice status "${status}": paid and partial come from payments.`);
  const c = customer(customerName);
  const line_items = lines.map(({ sku, description, quantity, unit_price, tax_rate }) => {
    const p = product(sku);
    const lineSubtotal = round2(quantity * unit_price);
    const taxRate = tax_rate ?? p.tax_rate ?? 0;
    const tax_amount = round2(lineSubtotal * taxRate / 100);
    return { product_id: p.id, description: description || p.product_name, quantity, unit_price, tax_rate: taxRate, tax_amount, line_total: round2(lineSubtotal + tax_amount) };
  });
  const subtotal = round2(line_items.reduce((s, l) => s + l.quantity * l.unit_price, 0));
  const tax_total = round2(line_items.reduce((s, l) => s + l.tax_amount, 0));
  const total_amount = round2(subtotal + tax_total);
  const isForeign = currency !== 'NGN';
  const documentRate = isForeign ? 1 / rate : 1;
  const baseSubtotal = round2(subtotal / documentRate);
  const baseTotal = round2(total_amount / documentRate);
  const baseTax = round2(baseTotal - baseSubtotal);

  const address = { street: c.address || '', city: c.city || '', state: c.state || '', postal_code: '', country: c.country || 'Nigeria' };
  const saved = await insert('invoices', {
    invoice_number: number, customer_id: c.id, customer_name: c.company_name,
    invoice_date: date, due_date: due, status, currency,
    ar_account_id: account('1100').id, revenue_account_id: account(revenue).id, tax_account_id: account('2200').id,
    line_items, subtotal, tax_total, total_amount, amount_paid: 0, balance_due: total_amount,
    billing_address: address, shipping_address: address, payment_terms: c.payment_terms || 'net_30', notes,
    ...(isForeign ? { exchange_rate: documentRate, total_amount_base_currency: baseTotal, balance_due_base_currency: baseTotal } : {}),
  }, date);

  const journalLines = [
    line('1100', `Invoice ${number} - ${c.company_name}`, baseTotal, 0),
    line(revenue, `Revenue from Invoice ${number}`, 0, baseSubtotal),
  ];
  if (baseTax > 0) journalLines.push(line('2200', `Sales Tax on Invoice ${number}`, 0, baseTax));
  const je = await postJournal({
    entry_number: `JE-INV-${saved.id}`, entry_date: date, reference: number, source_type: 'invoice', source_id: saved.id,
    description: `Sales Invoice ${number} - ${c.company_name}${isForeign ? ` (${currency} ${total_amount} at 1 ${currency} = ${rate} NGN)` : ''}`,
    line_items: journalLines,
  });
  await updateRowById('invoices', saved.id, { journal_entry_id: je.id });

  // Cost of goods sold and stock movement, per stock line.
  let totalCOGS = 0;
  for (const item of line_items) {
    const p = products.find(x => x.id === item.product_id);
    if (p.product_type !== 'inventory') continue;
    const value = round2(item.quantity * (p.cost_price || 0));
    totalCOGS += value;
    quantityChanges.set(p.id, (quantityChanges.get(p.id) || 0) - item.quantity);
    await insert('inventory_transactions', {
      transaction_number: `INV-${number}-${p.id}`, transaction_date: date, transaction_type: 'sale',
      product_id: p.id, product_name: p.product_name, sku: p.sku,
      quantity_in: 0, quantity_out: item.quantity, unit_cost: p.cost_price, total_value: value,
      reference_type: 'invoice', reference_id: saved.id, reference_number: number, notes: `Sold via Invoice ${number}`,
    }, date);
  }
  if (totalCOGS > 0) {
    await postJournal({
      entry_number: `JE-COGS-${saved.id}`, entry_date: date, reference: number, source_type: 'invoice', source_id: saved.id,
      description: `Cost of Goods Sold for Invoice ${number}`,
      line_items: [line('5000', `COGS for Invoice ${number}`, totalCOGS, 0), line('1200', `Inventory sold via Invoice ${number}`, 0, totalCOGS)],
    });
  }
  const record = { ...saved, journal_entry_id: je.id, amount_paid: 0, documentRate, isForeign };
  invoices.set(number, record);
  return record;
}

// ── Payments (Payments page) ──────────────────────────────────────────────────
async function receivePayment({ invoiceNumber, date, amount, bankCode = '1020', reference, method = 'bank_transfer' }) {
  const invoice = invoices.get(invoiceNumber);
  const saved = await insert('payments', {
    payment_type: 'received', contact_id: invoice.customer_id, contact_name: invoice.customer_name,
    payment_date: date, amount, currency: 'NGN', payment_method: method, reference,
    bank_account_id: account(bankCode).id, ar_ap_account_id: account('1100').id,
    invoice_id: invoice.id, notes: '', amount_base_currency: amount, exchange_rate: 1, status: 'completed',
  }, date);
  const je = await postJournal({
    entry_number: `JE-PMT-${saved.id}`, entry_date: date, reference, source_type: 'payment', source_id: saved.id,
    description: `Payment Received - ${invoice.customer_name}`,
    line_items: [
      line(bankCode, `Payment received from ${invoice.customer_name}`, amount, 0),
      line('1100', `Payment received from ${invoice.customer_name}`, 0, amount),
    ],
  });
  await updateRowById('payments', saved.id, { journal_entry_id: je.id });
  // A foreign invoice tracks what's been paid in its own currency.
  invoice.amount_paid = round2(invoice.amount_paid + (invoice.isForeign ? amount * invoice.documentRate : amount));
  const balance = round2(Number(invoice.total_amount) - invoice.amount_paid);
  const status = balance <= 0 ? 'paid' : 'partial';
  await updateRowById('invoices', invoice.id, {
    amount_paid: invoice.amount_paid, balance_due: balance, status,
    ...(invoice.isForeign ? { balance_due_base_currency: round2(balance / invoice.documentRate) } : {}),
  });
  return status;
}

async function makePayment({ bill, date, reference, method = 'bank_transfer' }) {
  const amount = Number(bill.total_amount);
  const saved = await insert('payments', {
    payment_type: 'made', contact_id: bill.vendor_id, contact_name: bill.vendor_name,
    payment_date: date, amount, currency: 'NGN', payment_method: method, reference,
    bank_account_id: account('1020').id, ar_ap_account_id: account('2000').id,
    bill_id: bill.id, notes: '', amount_base_currency: amount, exchange_rate: 1, status: 'completed',
  }, date);
  const je = await postJournal({
    entry_number: `JE-PMT-${saved.id}`, entry_date: date, reference, source_type: 'payment', source_id: saved.id,
    description: `Payment Made - ${bill.vendor_name}`,
    line_items: [
      line('2000', `Payment made to ${bill.vendor_name}`, amount, 0),
      line('1020', `Payment made to ${bill.vendor_name}`, 0, amount),
    ],
  });
  await updateRowById('payments', saved.id, { journal_entry_id: je.id });
  await updateRowById('bills', bill.id, { amount_paid: amount, balance_due: 0, status: 'paid' });
  // The app only raises this figure. It's lowered here so the Vendors page stays correct.
  vendorOutstanding.set(bill.vendor_id, (vendorOutstanding.get(bill.vendor_id) || 0) - amount);
}

// ── Stock receipts (ReceiveInventoryForm): receipt, bill, journal, stock movement ───
async function receiveStock({ number, vendorName, date, due, items }) {
  const v = vendor(vendorName);
  const line_items = items.map(([sku, quantity]) => {
    const p = product(sku);
    const line_total = round2(quantity * p.cost_price);
    return { product_id: p.id, description: p.product_name, quantity, unit_cost: p.cost_price, tax_rate: 0, tax_amount: 0, line_total };
  });
  const subtotal = round2(line_items.reduce((s, l) => s + l.line_total, 0));
  const receipt = await insert('inventory_receipts', {
    receipt_number: number, receipt_date: date, vendor_id: v.id, vendor_name: v.company_name,
    ap_account_id: account('2000').id, status: 'received', line_items, subtotal, tax_total: 0, total_amount: subtotal, notes: '',
  }, date);
  const bill = await insert('bills', {
    bill_number: `BILL-${number}`, vendor_id: v.id, vendor_name: v.company_name,
    bill_date: date, due_date: due, status: 'pending', currency: 'NGN', exchange_rate: 1,
    ap_account_id: account('2000').id, expense_account_id: account('1200').id,
    line_items: line_items.map(l => ({ ...l, gl_account_id: account('1200').id })),
    subtotal, tax_total: 0, total_amount: subtotal, total_amount_base_currency: subtotal,
    amount_paid: 0, amount_paid_base_currency: 0, balance_due: subtotal, balance_due_base_currency: subtotal,
    reference: number, notes: `Auto-created from Inventory Receipt ${number}`,
  }, date);
  await updateRowById('inventory_receipts', receipt.id, { bill_id: bill.id, bill_number: bill.bill_number });
  vendorOutstanding.set(v.id, (vendorOutstanding.get(v.id) || 0) + subtotal);
  const je = await postJournal({
    entry_number: `JE-RCV-${receipt.id}`, entry_date: date, reference: number, source_type: 'inventory_receipt', source_id: receipt.id,
    description: `Goods received - ${number} from ${v.company_name}`,
    line_items: [
      line('1200', `Inventory received - ${number}`, subtotal, 0),
      line('2000', `Purchase from ${v.company_name} - ${number}`, 0, subtotal),
    ],
  });
  await updateRowById('bills', bill.id, { journal_entry_id: je.id });
  for (const item of line_items) {
    const p = products.find(x => x.id === item.product_id);
    quantityChanges.set(p.id, (quantityChanges.get(p.id) || 0) + item.quantity);
    await insert('inventory_transactions', {
      transaction_number: `RCV-${number}-${p.id}`, transaction_date: date, transaction_type: 'purchase',
      product_id: p.id, product_name: p.product_name, sku: p.sku,
      quantity_in: item.quantity, quantity_out: 0, unit_cost: item.unit_cost, total_value: item.line_total,
      reference_type: 'inventory_receipt', reference_id: receipt.id, reference_number: number,
      notes: `Received via ${number}`, journal_entry_id: je.id,
    }, date);
  }
  return { ...bill, journal_entry_id: je.id };
}

// ── Bills (BillForm) ──────────────────────────────────────────────────────────
async function createBill({ number, vendorName, date, due, status = 'approved', expense, description, amount, job = null }) {
  const v = vendor(vendorName);
  const tax_amount = round2(amount * VAT / 100);
  const total_amount = round2(amount + tax_amount);
  const line_items = [{ product_id: null, description, quantity: 1, unit_cost: amount, tax_rate: VAT, tax_amount, line_total: total_amount, gl_account_id: null }];
  const saved = await insert('bills', {
    bill_number: number, vendor_id: v.id, vendor_name: v.company_name,
    ...(job ? { job_id: job.id, job_name: job.job_name } : {}),
    bill_date: date, due_date: due, status, currency: 'NGN',
    ap_account_id: account('2000').id, expense_account_id: account(expense).id, tax_account_id: account('1150').id,
    line_items, subtotal: amount, tax_total: tax_amount, total_amount, amount_paid: 0, balance_due: total_amount, notes: '',
  }, date);
  const je = await postJournal({
    entry_number: `JE-BILL-${saved.id}`, entry_date: date, reference: number, source_type: 'bill', source_id: saved.id,
    description: `Bill ${number} - ${v.company_name}`,
    line_items: [
      line(expense, `Bill ${number} - ${v.company_name}`, amount, 0),
      line('1150', `Input Tax on Bill ${number}`, tax_amount, 0),
      line('2000', `Bill ${number} - ${v.company_name}`, 0, total_amount),
    ],
  });
  await updateRowById('bills', saved.id, { journal_entry_id: je.id });
  return { ...saved, journal_entry_id: je.id };
}

const manualJournal = (number, date, description, line_items, reference = number) => postJournal({
  entry_number: number, entry_date: date, reference, source_type: 'manual', description, line_items,
});

// ── Fixed asset accounts and straight-line figures ────────────────────────────
const ASSET_ACCOUNTS = { vehicles: ['1570', '1575'], computer_equipment: ['1560', '1565'], furniture: ['1550', '1555'], machinery: ['1500', '1510'] };
const monthsBetween = (fromIso, toIso) => {
  const from = new Date(fromIso); const to = new Date(toIso);
  let months = (to.getUTCFullYear() - from.getUTCFullYear()) * 12 + (to.getUTCMonth() - from.getUTCMonth());
  if (to.getUTCDate() < from.getUTCDate()) months -= 1;
  return Math.max(0, months);
};
const monthlyDepreciation = (a) => (Number(a.acquisition_cost) - Number(a.salvage_value || 0)) / (Number(a.useful_life_years) * 12);

async function clearTransactions() {
  for (const table of TRANSACTION_TABLES) {
    const removed = await deleteCompanyRows(table);
    if (removed) console.log(`Removed ${removed} from ${table}`);
  }
  // Put back what posting moved on the master records.
  await updateCompanyRows('accounts', { balance: 0 });
  await updateCompanyRows('products', { quantity_on_hand: 0, quantity: 0 });
  await updateCompanyRows('vendors', { total_outstanding: 0 });
  await updateCompanyRows('fixed_assets', { accumulated_depreciation: null, book_value: null, current_book_value: null, last_depreciation_date: null });
  const seededJobs = await readRows('jobs');
  for (const job of seededJobs) {
    const original = JOBS.find(j => j.job_number === job.job_number);
    if (original) await updateRowById('jobs', job.id, { actual_cost: 0, percent_complete: 0, status: original.status, start_date: original.start_date });
  }
}

async function loadMasterData() {
  [accounts, customers, vendors, products, employees, assets, jobs, boms] = await Promise.all(['accounts', 'customers', 'vendors', 'products', 'employees', 'fixed_assets', 'jobs', 'bill_of_materials'].map(t => readRows(t)));
  accounts.sort((a, b) => String(a.account_code).localeCompare(String(b.account_code)));
  if (accounts.length < 40 || customers.length < 12 || products.length < 15) throw new Error('Master data is missing. Run seed.mjs first.');
}

async function createAll() {
  await loadMasterData();

  // Depreciation needs these on each asset, or the app's own run skips it.
  for (const a of assets) {
    const [assetCode, accumulatedCode] = ASSET_ACCOUNTS[a.category];
    Object.assign(a, { asset_account_id: account(assetCode).id, depreciation_account_id: account('6400').id, accumulated_depreciation_account_id: account(accumulatedCode).id });
    await updateRowById('fixed_assets', a.id, { asset_account_id: a.asset_account_id, depreciation_account_id: a.depreciation_account_id, accumulated_depreciation_account_id: a.accumulated_depreciation_account_id });
  }

  // ── Opening balances, 1 Aug. Capital, bank and cash, plus the asset register, so that
  // depreciation has assets to reduce instead of showing negative fixed assets.
  const BANK = 60000000; const CASH = 2500000;
  const openingLines = [line('1020', 'Opening balance', BANK, 0), line('1000', 'Opening balance', CASH, 0)];
  let capital = BANK + CASH;
  const accumulatedAtOpening = new Map();
  for (const a of assets) {
    const months = monthsBetween(a.acquisition_date, '2026-07-31');
    const accumulated = round2(monthlyDepreciation(a) * months);
    accumulatedAtOpening.set(a.id, accumulated);
    const [assetCode, accumulatedCode] = ASSET_ACCOUNTS[a.category];
    openingLines.push(line(assetCode, `Opening balance - ${a.asset_name}`, Number(a.acquisition_cost), 0));
    openingLines.push(line(accumulatedCode, `Opening depreciation - ${a.asset_name} (${months} months)`, 0, accumulated));
    capital += Number(a.acquisition_cost) - accumulated;
  }
  openingLines.push(line('3000', "Owner's capital at opening", 0, round2(capital)));
  await manualJournal('OB-MLU-001', '2026-08-01', 'Opening balances at 1 August 2026', openingLines, 'Opening balances');

  // ── Stock received. The app raises a bill for each, so these are 3 of the 6 bills.
  const r1 = await receiveStock({ number: 'RCV-2026-001', vendorName: 'Olumide Educational Publishers Ltd', date: '2026-08-05', due: '2026-09-04', items: [['STK-001', 150], ['STK-002', 200], ['STK-003', 80]] });
  await receiveStock({ number: 'RCV-2026-002', vendorName: 'Amaka Uniforms & Branding', date: '2026-08-12', due: '2026-09-11', items: [['STK-004', 120], ['STK-005', 60]] });
  await receiveStock({ number: 'RCV-2026-003', vendorName: 'Hadiza Technical Components Ltd', date: '2026-08-19', due: '2026-11-18', items: [['CMP-001', 30], ['CMP-002', 30], ['CMP-003', 30], ['CMP-004', 30], ['CMP-005', 30]] });

  // ── 8 NGN invoices ──
  await createInvoice({ number: 'INV-2026-001', customerName: 'Lagoon City Consulting Partners', date: '2026-08-10', due: '2026-09-09', revenue: '4010', lines: [{ sku: 'SRV-003', quantity: 4, unit_price: 450000 }] });
  await createInvoice({ number: 'INV-2026-002', customerName: 'Zuma Ridge Logistics Ltd', date: '2026-08-24', due: '2026-09-23', revenue: '4020', lines: [{ sku: 'SRV-004', quantity: 40, unit_price: 45000 }] });
  await createInvoice({ number: 'INV-2026-003', customerName: 'Adunola Crest Academy', date: '2026-09-08', due: '2026-10-08', revenue: '4000', lines: [{ sku: 'STK-001', quantity: 60, unit_price: 9500 }, { sku: 'STK-003', quantity: 40, unit_price: 11000 }] });
  await createInvoice({ number: 'INV-2026-004', customerName: 'Ofure Microfinance Bank Ltd', date: '2026-09-18', due: '2026-10-18', status: 'overdue', revenue: '4010', lines: [{ sku: 'SRV-003', quantity: 3, unit_price: 450000 }] });
  await createInvoice({ number: 'INV-2026-005', customerName: 'Ikenga Heritage Schools', date: '2026-09-29', due: '2026-10-29', status: 'overdue', revenue: '4000', lines: [{ sku: 'STK-002', quantity: 100, unit_price: 4500 }, { sku: 'STK-005', quantity: 25, unit_price: 15000 }] });
  await createInvoice({ number: 'INV-2026-006', customerName: 'Tamuno Oilfield Training Co', date: '2026-10-06', due: '2026-11-05', revenue: '4010', lines: [{ sku: 'SRV-003', quantity: 5, unit_price: 450000 }, { sku: 'SRV-002', quantity: 6, unit_price: 220000 }] });
  await createInvoice({ number: 'INV-2026-007', customerName: 'Kwara Valley Foods Plc', date: '2026-10-20', due: '2026-11-19', revenue: '4000', lines: [{ sku: 'STK-004', quantity: 50, unit_price: 8000 }] });
  await createInvoice({ number: 'INV-2026-008', customerName: 'Baraka Skills Institute', date: '2026-10-30', due: '2026-11-29', revenue: '4020', lines: [{ sku: 'SRV-004', quantity: 20, unit_price: 45000 }] });

  const total = (n) => Number(invoices.get(n).total_amount);
  await receivePayment({ invoiceNumber: 'INV-2026-001', date: '2026-09-05', amount: total('INV-2026-001'), reference: 'TRF-55101' });
  await receivePayment({ invoiceNumber: 'INV-2026-002', date: '2026-09-20', amount: total('INV-2026-002'), reference: 'TRF-55102' });
  await receivePayment({ invoiceNumber: 'INV-2026-003', date: '2026-10-01', amount: 500000, reference: 'TRF-55103' });
  await receivePayment({ invoiceNumber: 'INV-2026-006', date: '2026-10-28', amount: 2000000, reference: 'TRF-55104' });

  // ── 2 USD invoices, paid at the same rate, so no exchange difference arises.
  await createInvoice({ number: 'INV-USD-001', customerName: 'Crossriver Bright Futures Foundation', date: '2026-11-01', due: '2026-12-01', revenue: '4010', currency: 'USD', rate: USD_RATE, lines: [{ sku: 'SRV-003', quantity: 2, unit_price: 300 }] });
  await createInvoice({ number: 'INV-USD-002', customerName: 'Golden Sahel Agro Cooperative', date: '2026-11-02', due: '2026-12-02', revenue: '4020', currency: 'USD', rate: USD_RATE, lines: [{ sku: 'SRV-004', quantity: 10, unit_price: 30 }] });
  await receivePayment({ invoiceNumber: 'INV-USD-001', date: '2026-11-02', amount: round2(total('INV-USD-001') * USD_RATE), bankCode: '1030', reference: 'SWIFT-77001' });
  await receivePayment({ invoiceNumber: 'INV-USD-002', date: '2026-11-03', amount: round2(total('INV-USD-002') * USD_RATE), bankCode: '1030', reference: 'SWIFT-77002' });

  // ── The other 3 bills, then 2 of the 6 paid ──
  const jobByNumber = (n) => jobs.find(j => j.job_number === n);
  const facilities = await createBill({ number: 'BILL-2026-101', vendorName: 'Damilola Facility Services Ltd', date: '2026-08-28', due: '2026-09-27', expense: '6500', description: 'Campus facility maintenance, August', amount: 850000 });
  await createBill({ number: 'BILL-2026-102', vendorName: 'Northgate Power Solutions Ltd', date: '2026-09-30', due: '2026-10-30', expense: '6200', description: 'Generator servicing and diesel, Q3', amount: 1240000 });
  await createBill({ number: 'BILL-2026-103', vendorName: 'Delta Crest Civil Contractors Ltd', date: '2026-10-15', due: '2026-11-14', status: 'pending', expense: '5400', description: 'Foundation works, Adunola Crest Science Block', amount: 6500000, job: jobByNumber('JOB-001') });
  await makePayment({ bill: facilities, date: '2026-09-25', reference: 'TRF-66101' });
  await makePayment({ bill: r1, date: '2026-09-02', reference: 'TRF-66102' });

  // ── 5 manual journals. They cover months and costs that the runs below don't.
  const monthly = assets.map(a => ({ a, amount: round2(monthlyDepreciation(a)) }));
  const twoMonths = monthly.map(({ a, amount }) => ({ a, amount: round2(amount * 2) }));
  const twoMonthTotal = round2(twoMonths.reduce((s, x) => s + x.amount, 0));
  await manualJournal('MJ-2026-001', '2026-08-03', 'Rent, August to October 2026', [line('6100', 'Campus rent, three months', 2250000, 0), line('1020', 'Campus rent, three months', 0, 2250000)]);
  const employeesGross = employees.reduce((s, e) => s + Number(e.basic_salary), 0);
  const employeesTax = round2(employeesGross * 0.15);
  await manualJournal('MJ-2026-002', '2026-10-31', 'Salaries for October 2026 (payroll PAY-2026-10)', [
    line('6000', 'Gross salaries', employeesGross, 0),
    line('2310', 'PAYE on October salaries', 0, employeesTax),
    line('1020', 'Net salaries paid', 0, round2(employeesGross - employeesTax)),
  ]);
  await manualJournal('MJ-2026-003', '2026-10-31', 'Accrued utilities, October 2026', [line('6200', 'Utilities accrued', 450000, 0), line('2100', 'Utilities accrued', 0, 450000)]);
  await manualJournal('MJ-2026-004', '2026-10-31', 'Employer pension accrual, October 2026', [line('6010', 'Employer pension at 10%', round2(employeesGross * 0.1), 0), line('2320', 'Employer pension at 10%', 0, round2(employeesGross * 0.1))]);
  await manualJournal('MJ-2026-005', '2026-09-30', 'Depreciation, August and September 2026', [
    line('6400', 'Depreciation, two months', twoMonthTotal, 0),
    ...twoMonths.map(({ a, amount }) => line(ASSET_ACCOUNTS[a.category][1], `${a.asset_name}, two months`, 0, amount)),
  ]);

  // ── Depreciation run for October, in the shape the Fixed Assets page writes. That page
  // doesn't move stored account balances, but you asked for them to update, so these do.
  const runDate = '2026-10-31';
  for (const { a, amount } of monthly) {
    await postJournal({
      entry_number: `DEP-${a.asset_code}-202610`, entry_date: runDate, reference: `Depreciation - ${a.asset_name}`, source_type: 'manual',
      description: `Monthly depreciation for ${a.asset_name}`,
      line_items: [line('6400', `Depreciation - ${a.asset_name}`, amount, 0), line(ASSET_ACCOUNTS[a.category][1], `Accumulated depreciation - ${a.asset_name}`, 0, amount)],
    });
    const accumulated = round2(accumulatedAtOpening.get(a.id) + amount * 3);
    await updateRowById('fixed_assets', a.id, { accumulated_depreciation: accumulated, book_value: round2(Number(a.acquisition_cost) - accumulated), last_depreciation_date: runDate });
  }

  // ── Payroll run. The app's Payroll page posts no journal: the cost is in MJ-2026-002.
  const employee_payments = employees.map(e => {
    const gross = Number(e.basic_salary); const tax = round2(gross * 0.15);
    return {
      employee_id: e.id, employee_name: `${e.first_name} ${e.last_name}`, gross_pay: gross, total_deductions: 0, total_taxes: tax, net_pay: round2(gross - tax),
      line_items: [{ payroll_item_id: 'salary', item_name: 'Basic Salary', item_type: 'salary', amount: gross }, { payroll_item_id: 'tax', item_name: 'Income Tax', item_type: 'tax', amount: tax }],
    };
  });
  await insert('payroll_runs', {
    payroll_number: 'PAY-2026-10', pay_period_start: '2026-10-01', pay_period_end: '2026-10-31', pay_date: '2026-10-31', status: 'paid',
    employee_payments, total_gross: employeesGross, total_deductions: 0, total_taxes: employeesTax, total_net: round2(employeesGross - employeesTax), notes: 'October 2026 salaries',
  }, '2026-10-31');

  // ── Job costs. The app's Job Costing page posts no journal and doesn't update the job's
  // actual cost. It's set here because the dashboards read it. Subcontract costs reach the
  // ledger through bill BILL-2026-103.
  const costs = [
    ['JOB-001', '2026-09-15', 'Site labour, September', 'labor', 1, 1850000],
    ['JOB-001', '2026-10-02', 'Cement and reinforcement', 'material', 1, 3400000],
    ['JOB-001', '2026-10-15', 'Foundation works subcontract', 'subcontractor', 1, 6500000],
    ['JOB-002', '2026-10-12', 'Site survey and setting out', 'labor', 1, 420000],
    ['JOB-002', '2026-10-26', 'Blockwork materials', 'material', 1, 1150000],
  ];
  for (const [jobNumber, date, description, cost_type, quantity, unit_cost] of costs) {
    await insert('job_costs', { job_id: jobByNumber(jobNumber).id, transaction_date: date, description, quantity, unit_cost, total_cost: quantity * unit_cost, cost_type, is_billable: true, is_billed: false }, date);
  }
  await updateRowById('jobs', jobByNumber('JOB-001').id, { actual_cost: 11750000, percent_complete: 17 });
  // JOB-002 was seeded as not starting until 2027, which can't carry costs from October.
  await updateRowById('jobs', jobByNumber('JOB-002').id, { actual_cost: 1570000, percent_complete: 5, status: 'in_progress', start_date: '2026-10-05' });

  // ── Work order. The app posts no journal or stock movement for these.
  const kit = product('FG-001');
  await insert('work_orders', {
    work_order_number: 'WO-2026-001', product_id: kit.id, product_name: kit.product_name, bom_id: boms[0]?.id ?? null,
    quantity_to_produce: 10, quantity_produced: 0, start_date: '2026-10-19', expected_completion_date: '2026-11-13', status: 'in_progress',
    material_costs: 158000, labor_costs: 15000, overhead_costs: 0, total_cost: 173000, cost_per_unit: 0, notes: 'First batch of lab kits',
  }, '2026-10-19');

  await flushMasterUpdates();
}

async function flushMasterUpdates() {
  const fresh = await readRows('accounts');
  for (const [id, change] of balanceChanges) {
    const current = fresh.find(a => a.id === id);
    await updateRowById('accounts', id, { balance: round2(Number(current.balance || 0) + change) });
  }
  balanceChanges.clear();
  const freshProducts = await readRows('products');
  for (const [id, change] of quantityChanges) {
    const current = freshProducts.find(p => p.id === id);
    const quantity = Number(current.quantity_on_hand || 0) + change;
    if (quantity < 0) throw new Error(`${current.product_name} would go negative.`);
    await updateRowById('products', id, { quantity_on_hand: quantity, quantity });
  }
  quantityChanges.clear();
  const freshVendors = await readRows('vendors');
  for (const [id, change] of vendorOutstanding) {
    const current = freshVendors.find(v => v.id === id);
    await updateRowById('vendors', id, { total_outstanding: round2(Number(current.total_outstanding || 0) + change) });
  }
  vendorOutstanding.clear();
}

// ── POS: tried last. Any failure removes what it made, and the rest stands. ───
async function tryPos() {
  const made = [];
  const track = async (table, row, date) => { const saved = await insert(table, row, date); made.push([table, saved.id]); return saved; };
  try {
    const location = await track('inventory_locations', { name: 'Main Campus Bookshop', location_code: 'LOC-001', location_name: 'Main Campus Bookshop', location_type: 'store', is_active: true }, '2026-08-01');
    const store = await track('stores', { store_code: 'STR-001', store_name: 'Campus Bookshop', name: 'Campus Bookshop', store_type: 'retail', default_inventory_location_id: location.id, location_id: location.id, is_active: true }, '2026-08-01');
    const terminal = await track('pos_terminals', { name: 'Till 1', terminal_name: 'Till 1', store_id: store.id, is_active: true }, '2026-08-01');
    const session = await track('pos_sessions', { store_id: store.id, terminal_id: terminal.id, session_number: 'SES-2026-001', cashier_name: 'Blessing Akpan', opening_time: at('2026-10-27'), opening_cash: 50000, total_sales: 0, total_transactions: 0, payment_breakdown: { cash: 0, card: 0, mobile: 0, other: 0 }, status: 'open' }, '2026-10-27');

    let sessionSales = 0; let sessionCount = 0;
    const SALES = [['SALE-2026-001', '2026-10-27', [['STK-002', 3]]], ['SALE-2026-002', '2026-10-28', [['STK-001', 2], ['STK-002', 1]]]];
    for (const [saleNumber, date, items] of SALES) {
      const line_items = items.map(([sku, quantity]) => {
        const p = product(sku);
        return { product_id: p.id, product_name: p.product_name, sku: p.sku, quantity, unit_price: Number(p.unit_price), cost_price: Number(p.cost_price), discount_percent: 0, discount_amount: 0, tax_rate: 0, tax_amount: 0, line_total: quantity * Number(p.unit_price), location_id: location.id };
      });
      const total = line_items.reduce((s, l) => s + l.line_total, 0);
      const sale = await track('pos_sales', {
        store_id: store.id, store_name: store.store_name, terminal_id: terminal.id, terminal_name: terminal.terminal_name, session_id: session.id,
        cashier_name: 'Blessing Akpan', customer_name: 'Walk-in Customer', sale_number: saleNumber, sale_date: at(date), line_items,
        subtotal: total, discount_total: 0, tax_total: 0, total_amount: total, payments: [{ payment_method: 'cash', amount: total, reference: '' }], amount_paid: total, change_given: 0, status: 'completed',
      }, date);
      const invoice = await track('invoices', {
        invoice_number: `INV-${saleNumber}`, customer_name: 'Walk-in Customer', invoice_date: date, due_date: date, status: 'paid', currency: 'NGN',
        line_items: line_items.map(l => ({ product_id: l.product_id, description: l.product_name, quantity: l.quantity, unit_price: l.unit_price, tax_rate: 0, tax_amount: 0, line_total: l.line_total })),
        subtotal: total, tax_total: 0, total_amount: total, amount_paid: total, balance_due: 0,
      }, date);
      const cogs = line_items.reduce((s, l) => s + l.cost_price * l.quantity, 0);
      const je = await postJournal({
        entry_number: `JE-POS-${sale.id}`, entry_date: date, reference: `POS Sale ${saleNumber}`, source_type: 'pos_sale', source_id: sale.id,
        description: `POS Sale - ${store.store_name} - Cashier: Blessing Akpan`,
        line_items: [
          line('1000', `Cash received from POS sale ${saleNumber}`, total, 0),
          line('4000', `Revenue from POS sale ${saleNumber}`, 0, total),
          line('5000', `COGS for POS sale ${saleNumber}`, cogs, 0),
          line('1200', `Inventory sold - POS sale ${saleNumber}`, 0, cogs),
        ],
      });
      made.push(['journal_entries', je.id]);
      await updateRowById('pos_sales', sale.id, { invoice_id: invoice.id, journal_entry_id: je.id, gl_posted: true, cost_of_goods: cogs, gross_profit: total - cogs });
      for (const l of line_items) quantityChanges.set(l.product_id, (quantityChanges.get(l.product_id) || 0) - l.quantity);
      sessionSales += total; sessionCount += 1;
    }
    await updateRowById('pos_sessions', session.id, { total_sales: sessionSales, total_transactions: sessionCount, payment_breakdown: { cash: sessionSales, card: 0, mobile: 0, other: 0 } });
    await flushMasterUpdates();
    return { ok: true, sales: SALES.length, total: sessionSales };
  } catch (error) {
    balanceChanges.clear(); quantityChanges.clear();
    for (const [table, id] of made.reverse()) { await deleteRowById(table, id).catch(() => {}); created[table] = Math.max(0, (created[table] || 1) - 1); }
    return { ok: false, error: scrub(error.message) };
  }
}

async function main() {
  const [company] = await readRows('companies');
  if (!company || company.id !== COMPANY_ID || !company.company_name?.includes('Margaret Lawrence')) throw new Error('Target is not the MLU company. Nothing changed.');
  console.log(`Target: ${company.company_name}`);
  if (company.base_currency !== 'NGN') throw new Error(`Base currency is ${company.base_currency}, not NGN. Run seed.mjs first. Nothing changed.`);

  const existing = {};
  for (const table of TRANSACTION_TABLES) existing[table] = await countRows(table);
  const hasRows = Object.values(existing).some(n => n > 0);
  if (hasRows && !reset && !clearOnly) throw new Error(`MLU already has transactions. Re-run with --reset to replace them. Nothing changed.`);

  if (reset || clearOnly) await clearTransactions();
  if (clearOnly) { console.log('Transactions cleared.'); return; }

  await createAll();
  const pos = await tryPos();

  console.log('\n=== Created (read back from the database)');
  const counts = {};
  for (const table of [...TRANSACTION_TABLES].reverse()) { counts[table] = await countRows(table); console.log(`${table.padEnd(24)} ${counts[table]}`); }
  console.log(`\nPOS: ${pos.ok ? `${pos.sales} sales, total ${pos.total}` : `SKIPPED: ${pos.error}`}`);

  const books = await checkBooks();
  console.log('\n=== Books, from stored journals');
  console.log(`Journals: ${books.journals} | dated ${books.earliest} to ${books.latest}`);
  console.log(`Debits ${books.debits} | Credits ${books.credits} | unbalanced: ${books.unbalanced.join(', ') || 'none'}`);
  console.log(`Stored account balances differing from journals: ${books.mismatched.join(' | ') || 'none'}`);
  console.log(`Trial Balance: Dr ${books.tb.debit} / Cr ${books.tb.credit}`);
  console.log(`P&L: revenue ${books.pl.revenue}, expenses ${books.pl.expenses}, net ${books.pl.net}`);
  console.log(`Balance Sheet: assets ${books.bs.assets} = liabilities ${books.bs.liabilities} + equity ${books.bs.equity} + net profit ${books.pl.net} = ${books.bs.liabilitiesAndEquity}`);
  console.log('\nAccounts:');
  for (const [name, value] of Object.entries(books.accounts)) console.log(`  ${name.padEnd(48)} ${value}`);
  const stock = (await readRows('products')).filter(p => Number(p.quantity_on_hand) !== 0).map(p => `${p.sku}=${p.quantity_on_hand}`);
  console.log(`\nStock on hand: ${stock.join(', ') || 'none'}`);

  writeOutput('last-transactions.json', { at: new Date().toISOString(), today: TODAY, counts, pos, books });
  if (books.unbalanced.length || books.mismatched.length || Math.abs(books.tb.debit - books.tb.credit) > 0.01 || Math.abs(books.bs.assets - books.bs.liabilitiesAndEquity) > 0.01) process.exitCode = 1;
}

main().catch((error) => {
  console.error('Stopped:', scrub(error.message));
  console.error('Run again with --reset to start clean.');
  process.exit(1);
});

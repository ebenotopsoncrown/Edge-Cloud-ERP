// REAL end-to-end test: the live app, the real database, signed in as the test user, MLU only.
//
//   cd scripts/seed-mlu && npm install
//   node scripts/seed-mlu/e2e.mjs
//
// Needs SUPABASE_ANON_KEY, SEED_TEST_EMAIL and SEED_TEST_PASSWORD in .env.seed, and an installed
// Chrome (set CHROME_PATH if it isn't in the default Windows location).
// It stops without writing if MLU already has transactions, and deletes what it creates.
import puppeteer from 'puppeteer-core';
import { join } from 'path';
import { COMPANY_ID, envValue, outputDir, readRows, countRows, deleteRowById, updateRowById, scrub } from './lib.mjs';
import { mkdirSync } from 'fs';

mkdirSync(outputDir, { recursive: true });
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const SITE = 'https://edgeclouderp.com';
const EMAIL = envValue('SEED_TEST_EMAIL');
const PASSWORD = envValue('SEED_TEST_PASSWORD');
const ANON = envValue('SUPABASE_ANON_KEY');
const API = envValue('SUPABASE_URL').replace(/\/+$/, '');
if (!EMAIL || !PASSWORD || !ANON) { console.error('Missing test credentials in .env.seed'); process.exit(1); }
const clean = (t) => scrub(String(t)).split(PASSWORD).join('[hidden]').split(ANON).join('[hidden]');
const wait = ms => new Promise(r => setTimeout(r, ms));

const CUSTOMER = 'E2E TEST Customer Ltd';
const INV = 'E2E-INV-1';
const USD = 'E2E-USD-1';
const MEMO = 'E2E TEST manual journal';

const results = [];
const created = new Map(); // table -> Set(ids) created during the test
let stepApiErrors = [];
let stepDialogs = [];
const blockedWrites = [];

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', defaultViewport: { width: 1440, height: 1200 }, args: ['--disable-gpu'] });
const page = await browser.newPage();
const pageErrors = [];
page.on('pageerror', e => pageErrors.push(clean(e.message).slice(0, 200)));
page.on('dialog', async d => { stepDialogs.push(clean(d.message()).slice(0, 300)); await d.accept(); });

// Guard: never let the browser write anything labelled for another company.
await page.setRequestInterception(true);
page.on('request', (req) => {
  const url = req.url();
  if (url.includes('/rest/v1/') && ['POST', 'PATCH', 'PUT'].includes(req.method())) {
    try {
      const body = JSON.parse(req.postData() || '{}');
      const rows = Array.isArray(body) ? body : [body];
      if (rows.some(r => r.company_id && r.company_id !== COMPANY_ID)) {
        blockedWrites.push(new URL(url).pathname);
        return req.abort();
      }
    } catch { /* not JSON */ }
  }
  req.continue();
});
page.on('response', async (res) => {
  const url = res.url();
  if (!url.includes('/rest/v1/')) return;
  const method = res.request().method();
  if (method === 'OPTIONS') return;
  const table = new URL(url).pathname.split('/').pop();
  try {
    if (res.status() >= 400) {
      const body = await res.text();
      let message = body;
      try { const p = JSON.parse(body); message = [p.code, p.message, p.details, p.hint].filter(Boolean).join(' | '); } catch { /* raw */ }
      stepApiErrors.push(`${method} ${table} -> ${res.status()}: ${clean(message).slice(0, 260)}`);
    } else if (method === 'POST') {
      const rows = JSON.parse(await res.text());
      for (const r of Array.isArray(rows) ? rows : [rows]) if (r?.id) { if (!created.has(table)) created.set(table, new Set()); created.get(table).add(r.id); }
    }
  } catch { /* body unavailable */ }
});

const go = async (p) => { await page.goto(SITE + p, { waitUntil: 'load', timeout: 60000 }); await wait(2200); };
const text = () => page.evaluate(() => document.body.innerText);
const clickButton = async (label) => {
  const ok = await page.evaluate((l) => { const b = [...document.querySelectorAll('button')].filter(x => x.offsetParent !== null && x.textContent.trim().includes(l)).pop(); if (!b) return false; b.scrollIntoView({ block: 'center' }); b.click(); return true; }, label);
  if (!ok) throw new Error(`Button not found: "${label}"`);
  await wait(700);
};
const fieldControl = (label, selector) => page.evaluateHandle((l, sel) => {
  const labels = [...document.querySelectorAll('label, p')].filter(x => x.offsetParent !== null && x.textContent.trim().toLowerCase().startsWith(l.toLowerCase()));
  for (const lab of labels.reverse()) { let n = lab.parentElement; for (let i = 0; i < 3 && n; i++, n = n.parentElement) { const c = n.querySelector(sel); if (c) return c; } }
  return null;
}, label, selector);
const pickOption = async (trigger, option, what) => {
  await trigger.evaluate(n => n.scrollIntoView({ block: 'center' }));
  await trigger.click();
  await wait(500);
  const opt = await page.evaluateHandle((o) => [...document.querySelectorAll('[role="option"]')].find(x => x.textContent.trim().startsWith(o)), option);
  if (!opt.asElement()) {
    const available = await page.evaluate(() => [...document.querySelectorAll('[role="option"]')].map(x => x.textContent.trim()).slice(0, 8).join(' / '));
    await page.keyboard.press('Escape');
    throw new Error(`Option "${option}" not offered in ${what}. Offered: ${available || 'nothing'}`);
  }
  // Scroll the list with the mouse wheel until the option is really on screen, as a person
  // would, then click it and confirm the dropdown shows what was asked for.
  const list = await page.$('[role="listbox"]');
  const listBox = await list.boundingBox();
  await page.mouse.move(listBox.x + listBox.width / 2, listBox.y + listBox.height / 2, { steps: 4 });
  for (let i = 0; i < 80; i++) {
    const box = await opt.asElement().boundingBox();
    if (box && box.y >= listBox.y + 28 && box.y + box.height <= listBox.y + listBox.height - 28) break;
    await page.mouse.wheel({ deltaY: !box || box.y > listBox.y ? 120 : -120 });
    await wait(120);
  }
  await wait(250);
  const box = await opt.asElement().boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 6 });
  await wait(250);
  await page.mouse.down(); await wait(60); await page.mouse.up();
  await wait(500);
  const shown = await trigger.evaluate(n => n.textContent.trim());
  if (!shown.startsWith(option)) throw new Error(`Selected "${option}" in ${what}, but the dropdown shows "${shown}"`);
};
const choose = async (label, option) => {
  const el = (await fieldControl(label, 'button[role="combobox"]')).asElement();
  if (!el) throw new Error(`Dropdown not found: "${label}"`);
  await pickOption(el, option, `"${label}"`);
};
const type = async (label, value) => {
  const el = (await fieldControl(label, 'input')).asElement();
  if (!el) throw new Error(`Field not found: "${label}"`);
  await el.evaluate(n => n.scrollIntoView({ block: 'center' }));
  await el.click({ clickCount: 3 });
  await el.type(String(value));
  await wait(150);
};
const svc = async (table, query = '') => readRows(table, query);

async function step(name, fn) {
  stepApiErrors = []; stepDialogs = [];
  const outcome = { name, status: 'PASS', notes: [], errors: [] };
  const check = (label, ok, got = '') => { if (ok) outcome.notes.push(`ok: ${label}`); else { outcome.status = 'FAIL'; outcome.errors.push(`${label}${got !== '' ? ` (got: ${clean(got)})` : ''}`); } };
  try {
    await fn(check, outcome);
  } catch (error) {
    outcome.status = 'FAIL';
    outcome.errors.push(clean(error.message).slice(0, 320));
  }
  await wait(400);
  outcome.apiErrors = [...new Set(stepApiErrors)];
  outcome.dialogs = [...new Set(stepDialogs)];
  if (outcome.apiErrors.length && outcome.status === 'PASS') outcome.status = 'PASS WITH ERRORS';
  results.push(outcome);
  console.log(`[${outcome.status}] ${name}`);
  return outcome.status !== 'FAIL';
}

const baseline = {};
const BASE_TABLES = ['accounts', 'exchange_rates', 'customers', 'vendors', 'products', 'bill_of_materials', 'employees', 'fixed_assets', 'jobs'];
const TX_TABLES = ['invoices', 'payments', 'journal_entries', 'bills'];
let accountsBefore = [];
let onlyMlu = false;

try {
  for (const t of [...BASE_TABLES, ...TX_TABLES]) baseline[t] = await countRows(t);
  accountsBefore = await readRows('accounts');
  console.log('Baseline', JSON.stringify(baseline));
  if (TX_TABLES.some(t => baseline[t] !== 0)) throw new Error(`MLU already has transactions: ${JSON.stringify(baseline)}. Stopping before writing anything.`);

  // ── Read-only: what this user can see through RLS ──
  await step('RLS: what the test user can read (read-only)', async (check, o) => {
    const res = await fetch(`${API}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: EMAIL, password: PASSWORD }) });
    if (!res.ok) throw new Error(`Sign-in failed: ${res.status} ${(await res.text()).slice(0, 160)}`);
    const { access_token: token } = await res.json();
    const headers = { apikey: ANON, Authorization: `Bearer ${token}`, Prefer: 'count=exact', Range: '0-0' };
    const count = async (path) => {
      const r = await fetch(`${API}/rest/v1/${path}`, { method: 'HEAD', headers });
      return r.ok ? Number(r.headers.get('content-range')?.split('/')[1] ?? 0) : `HTTP ${r.status}`;
    };
    const companies = await count('companies?select=id');
    const otherCompanies = await count(`companies?select=id&id=neq.${COMPANY_ID}`);
    o.notes.push(`companies visible: ${companies}, other than MLU: ${otherCompanies}`);
    check('sees only MLU in companies', otherCompanies === 0, `${otherCompanies} other company rows visible`);
    for (const t of ['customers', 'vendors', 'products', 'accounts', 'employees', 'fixed_assets', 'jobs', 'invoices', 'bills', 'payments', 'journal_entries', 'exchange_rates', 'bill_of_materials', 'roles', 'company_members']) {
      const mine = await count(`${t}?select=id&company_id=eq.${COMPANY_ID}`.replace('select=id', t === 'company_members' ? 'select=user_id' : 'select=id'));
      const others = await count(`${t}?select=${t === 'company_members' ? 'user_id' : 'id'}&company_id=not.eq.${COMPANY_ID}`);
      const nulls = await count(`${t}?select=${t === 'company_members' ? 'user_id' : 'id'}&company_id=is.null`);
      o.notes.push(`${t}: MLU=${mine}, other companies=${others}, no company=${nulls}`);
      check(`${t}: no other company's rows visible`, others === 0, others);
    }
  });

  // ── Sign in through the real login page ──
  const signedIn = await step('Sign in through the live login page', async (check) => {
    await page.goto(SITE, { waitUntil: 'load', timeout: 60000 });
    await page.waitForSelector('#login-email', { timeout: 30000 });
    await page.type('#login-email', EMAIL);
    await page.type('#login-password', PASSWORD);
    await clickButton('Sign In');
    await wait(5000);
    const t = await text();
    check('dashboard opened', t.includes('Financial Dashboard'), t.slice(0, 160));
    onlyMlu = t.includes('Margaret Lawrence');
    check('current company is MLU', onlyMlu, t.slice(0, 200));
    check('dashboard shows NGN', t.includes('₦'), '');
  });
  if (!signedIn || !onlyMlu) throw new Error('Not signed in to MLU, so no test records were written.');

  await step('Seeded data is visible in the app', async (check) => {
    await go('/customers');
    let t = await text();
    check('customer names show', t.includes('Adunola Crest Academy'));
    check('12 customers listed in subtitle', t.includes('12 customers'), t.slice(0, 200));
    await go('/products');
    t = await text();
    check('product names show', t.includes('Principles of Accounting Textbook'));
    await go('/vendors');
    t = await text();
    check('vendor names show', t.includes('Olumide Educational Publishers'));
    await go('/chartofaccounts');
    t = await text();
    check('chart of accounts shows', t.includes('Accounts Receivable') && t.includes('62 accounts'), t.slice(0, 200));
    await go('/exchangerates');
    t = await text();
    check('exchange rates show', /1 USD in NGN\s*1,550/.test(t), t.slice(t.indexOf('Quick Reference'), t.indexOf('Quick Reference') + 90));
  });

  // ── 1. Customer ──
  let customer = null;
  await step('1. Create a customer', async (check) => {
    await go('/customers');
    await clickButton('New Customer');
    await type('Company Name', CUSTOMER);
    await type('Email', 'e2e-test@example.com');
    await clickButton('Save Customer');
    await wait(2500);
    [customer] = await svc('customers', `&company_name=eq.${encodeURIComponent(CUSTOMER)}`);
    check('row saved to database under MLU', customer?.company_id === COMPANY_ID, JSON.stringify(customer)?.slice(0, 120));
    const t = await text();
    check('appears in the customer list', t.includes(CUSTOMER));
  });

  // ── 2. Sent invoice with tax ──
  let invoice = null;
  if (customer) await step('2. Create a sent invoice with tax', async (check) => {
    await go('/invoices');
    await clickButton('New Invoice');
    await wait(900);
    await choose('Customer', CUSTOMER);
    await type('Invoice Number', INV);
    await choose('Status', 'Sent');
    await type('Quantity', '2');
    await type('Unit Price', '50000');
    await type('Tax %', '7.5');
    await clickButton('Save Invoice');
    await wait(4000);
    [invoice] = await svc('invoices', `&invoice_number=eq.${INV}`);
    check('invoice saved', !!invoice);
    if (!invoice) return;
    check('status is sent', invoice.status === 'sent', invoice.status);
    check('total 107,500', Number(invoice.total_amount) === 107500, invoice.total_amount);
    check('tax 7,500', Number(invoice.tax_total) === 7500, invoice.tax_total);
    const jes = await svc('journal_entries', `&source_id=eq.${invoice.id}`);
    check('one posted journal', jes.length === 1 && jes[0].status === 'posted', jes.length);
    const lines = jes[0]?.line_items || [];
    const accountName = (l) => l.account_name;
    check('Dr Accounts Receivable 107,500', lines.some(l => accountName(l) === 'Accounts Receivable' && Number(l.debit) === 107500), JSON.stringify(lines.map(l => [l.account_name, l.debit, l.credit])));
    check('Cr Sales Revenue 100,000', lines.some(l => accountName(l) === 'Sales Revenue' && Number(l.credit) === 100000), JSON.stringify(lines.map(l => [l.account_name, l.debit, l.credit])));
    check('Cr VAT Payable 7,500', lines.some(l => accountName(l) === 'VAT Payable' && Number(l.credit) === 7500), JSON.stringify(lines.map(l => [l.account_name, l.debit, l.credit])));
    check('journal balances', Number(jes[0]?.total_debits) === Number(jes[0]?.total_credits), `${jes[0]?.total_debits} vs ${jes[0]?.total_credits}`);
  });

  // ── 3. Part payment ──
  if (invoice) await step('3. Record a part payment of 50,000', async (check) => {
    await go('/payments');
    await clickButton('Receive Payment');
    await wait(700);
    await choose('Customer', CUSTOMER);
    await wait(400);
    await choose('Link to Invoice', INV);
    await type('Amount', '50000');
    await clickButton('Save Payment');
    await wait(4000);
    const pays = await svc('payments', `&invoice_id=eq.${invoice.id}`);
    check('payment saved', pays.length === 1, pays.length);
    const [after] = await svc('invoices', `&id=eq.${invoice.id}`);
    check('amount paid 50,000', Number(after?.amount_paid) === 50000, after?.amount_paid);
    check('balance due 57,500', Number(after?.balance_due) === 57500, after?.balance_due);
    check('status partial', after?.status === 'partial', after?.status);
    if (pays[0]) {
      const jes = await svc('journal_entries', `&source_id=eq.${pays[0].id}`);
      const lines = jes[0]?.line_items || [];
      check('journal posted', jes.length === 1, jes.length);
      check('Cr Accounts Receivable 50,000', lines.some(l => l.account_name === 'Accounts Receivable' && Number(l.credit) === 50000), JSON.stringify(lines.map(l => [l.account_name, l.debit, l.credit])));
      check('Dr a bank or cash account 50,000', lines.some(l => /bank|cash/i.test(l.account_name) && Number(l.debit) === 50000), JSON.stringify(lines.map(l => [l.account_name, l.debit, l.credit])));
    }
  });

  // ── 4. Manual journal ──
  await step('4. Post a manual journal: Dr Rent Expense 100 / Cr Accounts Payable 100', async (check) => {
    await go('/journalentries');
    await clickButton('New Journal Entry');
    await wait(900);
    await (await page.$('#mje-memo')).type(MEMO);
    await pickOption(await page.$('[aria-label="Line 1 account"]'), '6100 - Rent Expense', 'line 1');
    await pickOption(await page.$('[aria-label="Line 2 account"]'), '2000 - Accounts Payable', 'line 2');
    await (await page.$('[aria-label="Line 1 debit"]')).type('100');
    await (await page.$('[aria-label="Line 2 credit"]')).type('100');
    await clickButton('Post Journal');
    await wait(3500);
    const [je] = await svc('journal_entries', `&description=eq.${encodeURIComponent(MEMO)}`);
    check('journal saved', !!je);
    if (!je) return;
    check('posted, manual', je.status === 'posted' && je.source_type === 'manual', `${je.status}/${je.source_type}`);
    check('debits = credits = 100', Number(je.total_debits) === 100 && Number(je.total_credits) === 100, `${je.total_debits}/${je.total_credits}`);
    const lines = je.line_items || [];
    check('Dr Rent Expense 100', lines.some(l => l.account_name === 'Rent Expense' && Number(l.debit) === 100), JSON.stringify(lines));
    check('Cr Accounts Payable 100', lines.some(l => l.account_name === 'Accounts Payable' && Number(l.credit) === 100), JSON.stringify(lines));
    const t = await text();
    check('appears in Journal Entries', t.includes(MEMO));
  });

  // ── 5. USD invoice ──
  if (customer) await step('5. Create a USD invoice at an exchange rate', async (check) => {
    await go('/invoices');
    await clickButton('New Invoice');
    await wait(900);
    await choose('Customer', CUSTOMER);
    await type('Invoice Number', USD);
    await choose('Status', 'Sent');
    await choose('Currency', 'USD');
    const rate = await page.evaluate(() => document.getElementById('invoice-rate')?.value);
    check('rate filled from the saved USD rate (1550)', rate === '1550', rate);
    await type('Quantity', '1');
    await type('Unit Price', '100');
    await clickButton('Save Invoice');
    await wait(4000);
    const [inv] = await svc('invoices', `&invoice_number=eq.${USD}`);
    check('invoice saved', !!inv);
    if (!inv) return;
    check('currency USD, total 100', inv.currency === 'USD' && Number(inv.total_amount) === 100, `${inv.currency} ${inv.total_amount}`);
    check('rate stored', Math.abs(Number(inv.exchange_rate) - 1 / 1550) < 1e-9, inv.exchange_rate);
    check('base total 155,000', Number(inv.total_amount_base_currency) === 155000, inv.total_amount_base_currency);
    const jes = await svc('journal_entries', `&source_id=eq.${inv.id}`);
    const lines = jes[0]?.line_items || [];
    check('one posted journal', jes.length === 1, jes.length);
    check('Dr A/R NGN 155,000', lines.some(l => l.account_name === 'Accounts Receivable' && Number(l.debit) === 155000), JSON.stringify(lines.map(l => [l.account_name, l.debit, l.credit])));
    check('Cr Sales NGN 155,000', lines.some(l => l.account_name === 'Sales Revenue' && Number(l.credit) === 155000), JSON.stringify(lines.map(l => [l.account_name, l.debit, l.credit])));
    const t = await text();
    check('list shows $100.00', t.includes('$100.00'));
  });

  // ── 6. Trial Balance ──
  await step('6. Trial Balance: debits equal credits', async (check, o) => {
    await go('/reports');
    await choose('Select Report', 'Trial Balance');
    await wait(2500);
    const t = await text();
    const row = t.slice(t.lastIndexOf('Totals'));
    const nums = (row.match(/₦[\d,]+\.\d\d/g) || []).slice(0, 2);
    o.notes.push(`on screen: Dr ${nums[0]} / Cr ${nums[1]}`);
    check('two totals shown', nums.length === 2, row.slice(0, 80));
    check('on-screen debits equal credits', nums[0] === nums[1], nums.join(' vs '));
    check('total is the expected ₦262,600.00', nums[0] === '₦262,600.00', nums[0]);
    await page.screenshot({ path: join(outputDir, 'e2e-trial-balance.png'), fullPage: false });
    // Independently, from the stored journals.
    const jes = await svc('journal_entries', '&status=eq.posted');
    let dr = 0; let cr = 0; const unbalanced = [];
    for (const je of jes) {
      const d = (je.line_items || []).reduce((s, l) => s + Number(l.debit || 0), 0);
      const c = (je.line_items || []).reduce((s, l) => s + Number(l.credit || 0), 0);
      dr += d; cr += c;
      if (Math.abs(d - c) > 0.005) unbalanced.push(je.entry_number);
    }
    o.notes.push(`database: ${jes.length} posted journals, Dr ${dr} / Cr ${cr}`);
    check('every stored journal balances', unbalanced.length === 0, unbalanced.join(', '));
    check('stored debits equal credits', Math.abs(dr - cr) < 0.005, `${dr} vs ${cr}`);
  });

  await step('Financial Dashboard and Reports show the posted figures', async (check) => {
    await go('/dashboard');
    await wait(1500);
    const t = await text();
    check('revenue ₦255,000 on dashboard', t.includes('₦255,000.00'), t.slice(0, 300));
    check('chart not empty', !t.includes('No posted revenue or expenses'));
  });
} catch (error) {
  console.error('STOPPED:', clean(error.message));
  results.push({ name: 'Run stopped', status: 'FAIL', errors: [clean(error.message)], notes: [], apiErrors: [], dialogs: [] });
} finally {
  // ── Clean up: test records only, by id, MLU only ──
  console.log('\n=== Cleanup');
  await browser.close().catch(() => {});
  const cleanupErrors = [];
  const order = ['journal_entries', 'payments', 'invoices', 'customers'];
  const tables = [...order.filter(t => created.has(t)), ...[...created.keys()].filter(t => !order.includes(t))];
  for (const table of tables) {
    let removed = 0;
    for (const id of created.get(table)) {
      try { removed += await deleteRowById(table, id); } catch (e) { cleanupErrors.push(`${table} ${id}: ${clean(e.message).slice(0, 160)}`); }
    }
    console.log(`deleted ${removed} of ${created.get(table).size} from ${table}`);
  }
  // Stored balances were moved by posting, so put them back.
  let restored = 0;
  try {
    const now = await readRows('accounts');
    for (const before of accountsBefore) {
      const current = now.find(a => a.id === before.id);
      if (current && Number(current.balance) !== Number(before.balance)) { restored += await updateRowById('accounts', before.id, { balance: before.balance }); }
    }
  } catch (e) { cleanupErrors.push(`accounts: ${clean(e.message).slice(0, 160)}`); }
  console.log(`account balances restored: ${restored}`);

  const final = {};
  for (const t of [...BASE_TABLES, ...TX_TABLES]) final[t] = await countRows(t);
  const mismatch = Object.keys(baseline).filter(t => baseline[t] !== final[t]);
  const nonZero = (await readRows('accounts')).filter(a => Number(a.balance) !== 0).length;
  console.log('counts after cleanup:', JSON.stringify(final));
  console.log('differs from before the test:', mismatch.join(', ') || 'nothing');
  console.log('accounts with a non-zero balance:', nonZero);
  if (cleanupErrors.length) console.log('CLEANUP ERRORS:', cleanupErrors.join(' | '));

  console.log('\n=== Results');
  for (const r of results) {
    console.log(`\n[${r.status}] ${r.name}`);
    r.notes.forEach(n => console.log(`   ${n}`));
    r.errors.forEach(e => console.log(`   FAILED: ${e}`));
    (r.apiErrors || []).forEach(e => console.log(`   API: ${e}`));
    (r.dialogs || []).forEach(e => console.log(`   POPUP: ${e}`));
  }
  console.log(`\nWrites blocked by the company guard: ${blockedWrites.join(', ') || 'none'}`);
  console.log(`Page errors: ${[...new Set(pageErrors)].join(' | ') || 'none'}`);
  process.exit(0);
}

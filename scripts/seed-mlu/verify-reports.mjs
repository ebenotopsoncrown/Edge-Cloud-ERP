// Reads the reports through the live app, signed in as the test user, and compares them with
// the stored journals. Then opens and saves one of each record type to prove they stay editable.
//
//   node scripts/seed-mlu/verify-reports.mjs            reports and pages only, no writes
//   node scripts/seed-mlu/verify-reports.mjs --edit     also re-saves records through the app
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'fs';
import { join } from 'path';
import { envValue, outputDir, readRows, scrub } from './lib.mjs';
import { checkBooks } from './books.mjs';

mkdirSync(outputDir, { recursive: true });
const SITE = process.env.SITE_URL || 'https://edgeclouderp.com';
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PASSWORD = envValue('SEED_TEST_PASSWORD');
const clean = (t) => scrub(String(t)).split(PASSWORD).join('[hidden]');
const wait = ms => new Promise(r => setTimeout(r, ms));
const money = (n) => `₦${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const signed = (n) => `${n < 0 ? '-' : ''}${money(Math.abs(n))}`;

let failed = 0;
const check = (name, ok, got = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `   -> ${clean(got)}`}`); if (!ok) failed++; };

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', defaultViewport: { width: 1440, height: 1300 }, args: ['--disable-gpu'] });
const page = await browser.newPage();
const pageErrors = []; const apiErrors = []; const popups = [];
page.on('pageerror', e => pageErrors.push(clean(e.message).slice(0, 180)));
page.on('dialog', async d => { popups.push(clean(d.message()).slice(0, 220)); await d.accept(); });
page.on('response', async (res) => {
  if (!res.url().includes('/rest/v1/') || res.status() < 400) return;
  let message = '';
  try { const p = JSON.parse(await res.text()); message = [p.code, p.message].filter(Boolean).join(' '); } catch { /* none */ }
  apiErrors.push(`${res.request().method()} ${new URL(res.url()).pathname.split('/').pop()} ${res.status()}: ${clean(message).slice(0, 200)}`);
});

const go = async (p) => { await page.goto(SITE + p, { waitUntil: 'load', timeout: 60000 }); await wait(2500); };
const text = () => page.evaluate(() => document.body.innerText);
const fieldControl = (label, selector) => page.evaluateHandle((l, sel) => {
  const labels = [...document.querySelectorAll('label, p')].filter(x => x.offsetParent !== null && x.textContent.trim().toLowerCase().startsWith(l.toLowerCase()));
  for (const lab of labels.reverse()) { let n = lab.parentElement; for (let i = 0; i < 3 && n; i++, n = n.parentElement) { const c = n.querySelector(sel); if (c) return c; } }
  return null;
}, label, selector);
const choose = async (label, option) => {
  const trigger = (await fieldControl(label, 'button[role="combobox"]')).asElement();
  if (!trigger) throw new Error(`Dropdown not found: ${label}`);
  await trigger.click();
  await wait(500);
  const opt = await page.evaluateHandle((o) => [...document.querySelectorAll('[role="option"]')].find(x => x.textContent.trim().startsWith(o)), option);
  if (!opt.asElement()) throw new Error(`Option not found: ${option}`);
  const box = await opt.asElement().boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 5 });
  await wait(200);
  await page.mouse.down(); await wait(60); await page.mouse.up();
  await wait(600);
};
const clickButton = async (label) => {
  const ok = await page.evaluate((l) => { const b = [...document.querySelectorAll('button')].filter(x => x.offsetParent !== null && x.textContent.trim().includes(l)).pop(); if (!b) return false; b.scrollIntoView({ block: 'center' }); b.click(); return true; }, label);
  if (!ok) throw new Error(`Button not found: ${label}`);
  await wait(700);
};
const clickRow = async (rowText) => {
  const ok = await page.evaluate((t) => { const r = [...document.querySelectorAll('tr')].find(x => x.innerText.includes(t)); if (!r) return false; r.scrollIntoView({ block: 'center' }); r.click(); return true; }, rowText);
  if (!ok) throw new Error(`Row not found: ${rowText}`);
  await wait(1500);
};
const between = (body, label) => {
  const i = body.lastIndexOf(label);
  return i < 0 ? null : (body.slice(i).match(/-?₦[\d,]+\.\d\d/) || [null])[0];
};

try {
  const books = await checkBooks();

  await page.goto(SITE, { waitUntil: 'load', timeout: 60000 });
  await page.waitForSelector('#login-email', { timeout: 30000 });
  await page.type('#login-email', envValue('SEED_TEST_EMAIL'));
  await page.type('#login-password', PASSWORD);
  await page.click('button[type="submit"]');
  await wait(6000);
  check('signed in on MLU', (await text()).includes('Margaret Lawrence'));

  console.log('\n=== Reports on the live site');
  await go('/reports');
  let t = await text();
  check(`P&L: revenue ${money(books.pl.revenue)}`, between(t, 'Total Revenue') === money(books.pl.revenue), between(t, 'Total Revenue'));
  check(`P&L: expenses ${money(books.pl.expenses)}`, between(t, 'Total Expenses') === money(books.pl.expenses), between(t, 'Total Expenses'));
  check(`P&L: net ${signed(books.pl.net)}`, between(t, 'Net Profit/Loss') === signed(books.pl.net), between(t, 'Net Profit/Loss'));
  await page.screenshot({ path: join(outputDir, 'report-pl.png') });

  await choose('Select Report', 'Statement of Financial Position');
  await wait(1500);
  t = await text();
  const assets = between(t, 'Total Assets'); const le = between(t, 'Total Liabilities & Equity');
  check(`Balance Sheet: assets ${money(books.bs.assets)}`, assets === money(books.bs.assets), assets);
  check(`Balance Sheet: liabilities + equity ${money(books.bs.liabilitiesAndEquity)}`, le === money(books.bs.liabilitiesAndEquity), le);
  check('Balance Sheet balances on screen', assets === le, `${assets} vs ${le}`);
  await page.screenshot({ path: join(outputDir, 'report-bs.png') });

  await choose('Select Report', 'Trial Balance');
  await wait(1500);
  t = await text();
  const totals = (t.slice(t.lastIndexOf('Totals')).match(/₦[\d,]+\.\d\d/g) || []).slice(0, 2);
  check(`Trial Balance: ${money(books.tb.debit)} both sides`, totals[0] === money(books.tb.debit) && totals[1] === money(books.tb.credit), totals.join(' vs '));
  await page.screenshot({ path: join(outputDir, 'report-tb.png') });

  console.log('\n=== Records appear on their own pages');
  const pages = [
    ['/invoices', ['INV-2026-001', 'INV-2026-008', 'INV-USD-001', '$645.00']],
    ['/bills', ['BILL-2026-101', 'BILL-RCV-2026-001', '6 bills']],
    ['/payments', ['TRF-55101', 'SWIFT-77001']],
    ['/journalentries', ['OB-MLU-001', 'MJ-2026-001', 'DEP-FA-001-202610']],
    ['/products', ['STK-001']],
    ['/receiveinventory', ['RCV-2026-001']],
    ['/payroll', ['PAY-2026-10']],
    ['/fixedassets', ['FA-001', 'Toyota Hiace']],
    ['/jobcosting', ['JOB-001']],
    ['/manufacturing', ['WO-2026-001']],
    ['/posreports', ['SALE-2026-001']],
    ['/dashboard', [money(books.pl.revenue)]],
    ['/managementdashboard', [money(books.pl.revenue)]],
  ];
  for (const [path, needles] of pages) {
    await go(path);
    const body = await text();
    const missing = needles.filter(n => !body.includes(n));
    check(`${path} shows ${needles.join(', ')}`, missing.length === 0, `missing ${missing.join(', ')}`);
    check(`${path} did not crash`, !body.includes('This page hit a problem'));
  }
  await go('/pos');
  const posText = await text();
  check('/pos offers the seeded store', !posText.includes('No stores found'), posText.slice(posText.indexOf('POS'), posText.indexOf('POS') + 120));

  if (process.argv.includes('--edit')) {
    console.log('\n=== Records stay editable: open in the app, save, books must not move');
    const quantities = async () => JSON.stringify((await readRows('products')).map(p => [p.sku, Number(p.quantity_on_hand)]).sort());
    const stockBefore = await quantities();
    const same = (a, b) => a.tb.debit === b.tb.debit && a.pl.net === b.pl.net && a.bs.assets === b.bs.assets && a.bs.liabilitiesAndEquity === b.bs.liabilitiesAndEquity;
    const verifyStep = async (name) => {
      const after = await checkBooks();
      check(`${name}: reports unchanged`, same(books, after), JSON.stringify({ tb: after.tb, pl: after.pl, bs: after.bs }));
      check(`${name}: journals balance, stored balances agree`, after.unbalanced.length === 0 && after.mismatched.length === 0, [...after.unbalanced, ...after.mismatched].join(' | '));
      check(`${name}: journal count unchanged`, after.journals === books.journals, `${books.journals} -> ${after.journals}`);
      check(`${name}: stock unchanged`, (await quantities()) === stockBefore);
    };

    await go('/invoices');
    await clickRow('INV-2026-003');
    check('invoice opens with its figures', (await text()).includes('INV-2026-003') || (await page.evaluate(() => [...document.querySelectorAll('input')].some(i => i.value === 'INV-2026-003'))));
    await clickButton('Save Invoice');
    await wait(5000);
    const [inv] = await readRows('invoices', '&invoice_number=eq.INV-2026-003');
    check('part-paid invoice keeps its payment', Number(inv.amount_paid) === 500000 && inv.status === 'partial', `${inv.amount_paid} ${inv.status}`);
    await verifyStep('invoice re-saved');

    await go('/bills');
    await clickRow('BILL-2026-102');
    await clickButton('Save Bill');
    await wait(4000);
    await verifyStep('bill re-saved');

    await go('/payments');
    await page.evaluate(() => { const r = [...document.querySelectorAll('tr')].find(x => x.innerText.includes('TRF-55103')); r.scrollIntoView({ block: 'center' }); [...r.querySelectorAll('button')].pop().click(); });
    await wait(1500);
    await clickButton('Save Payment');
    await wait(4000);
    const [inv2] = await readRows('invoices', '&invoice_number=eq.INV-2026-003');
    check('invoice paid amount unchanged after payment edit', Number(inv2.amount_paid) === 500000, inv2.amount_paid);
    await verifyStep('payment re-saved');

    await go('/journalentries');
    await clickRow('MJ-2026-003');
    const detail = await text();
    check('manual journal opens', detail.includes('Accrued utilities') || detail.includes('MJ-2026-003'));
    const canEdit = await page.evaluate(() => [...document.querySelectorAll('button')].some(b => /^(edit|edit entry)/i.test(b.textContent.trim())));
    check('manual journal offers Edit', canEdit);
  }
} catch (error) {
  check('run completed', false, error.message);
}

console.log(`\nAPI errors: ${[...new Set(apiErrors)].join(' | ') || 'none'}`);
console.log(`Popups: ${[...new Set(popups)].join(' | ') || 'none'}`);
console.log(`Page errors: ${[...new Set(pageErrors)].join(' | ') || 'none'}`);
console.log(failed ? `\n${failed} FAILED` : '\nALL PASSED');
await browser.close();
process.exit(failed ? 1 : 0);

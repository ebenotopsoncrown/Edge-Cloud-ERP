// Recomputes the books from stored journals, with the same debit and credit rule as the app.
import { readRows } from './lib.mjs';

export const isDebitNormal = (type) => ['asset', 'expense', 'cost_of_goods_sold'].includes(type);
const round2 = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

export async function checkBooks() {
  const allAccounts = await readRows('accounts');
  const journals = await readRows('journal_entries', '&status=eq.posted');
  const computed = new Map(allAccounts.map(a => [a.id, 0]));
  let debits = 0; let credits = 0; const unbalanced = []; const dates = [];
  for (const je of journals) {
    const d = (je.line_items || []).reduce((s, l) => s + Number(l.debit || 0), 0);
    const c = (je.line_items || []).reduce((s, l) => s + Number(l.credit || 0), 0);
    debits += d; credits += c; dates.push(je.entry_date);
    if (Math.abs(d - c) > 0.005) unbalanced.push(je.entry_number);
    for (const l of je.line_items || []) {
      const a = allAccounts.find(x => x.id === l.account_id);
      if (!a) { unbalanced.push(`${je.entry_number}: unknown account`); continue; }
      computed.set(a.id, computed.get(a.id) + (isDebitNormal(a.account_type) ? Number(l.debit || 0) - Number(l.credit || 0) : Number(l.credit || 0) - Number(l.debit || 0)));
    }
  }
  const mismatched = allAccounts.filter(a => Math.abs(Number(a.balance || 0) - computed.get(a.id)) > 0.02).map(a => `${a.account_code} stored ${a.balance}, journals ${round2(computed.get(a.id))}`);
  const sum = (type) => allAccounts.filter(a => (Array.isArray(type) ? type : [type]).includes(a.account_type)).reduce((s, a) => s + computed.get(a.id), 0);
  const revenue = sum('revenue'); const expenses = sum(['expense', 'cost_of_goods_sold']);
  const net = revenue - expenses; const assetsTotal = sum('asset'); const liabilities = sum('liability'); const equity = sum('equity');
  let tbDr = 0; let tbCr = 0;
  for (const a of allAccounts) {
    const value = computed.get(a.id);
    if (isDebitNormal(a.account_type)) { if (value >= 0) tbDr += value; else tbCr -= value; } else if (value >= 0) tbCr += value; else tbDr -= value;
  }
  return {
    journals: journals.length, debits: round2(debits), credits: round2(credits), unbalanced, mismatched,
    tb: { debit: round2(tbDr), credit: round2(tbCr) },
    pl: { revenue: round2(revenue), expenses: round2(expenses), net: round2(net) },
    bs: { assets: round2(assetsTotal), liabilities: round2(liabilities), equity: round2(equity), liabilitiesAndEquity: round2(liabilities + equity + net) },
    earliest: dates.sort()[0], latest: dates.sort().at(-1),
    accounts: Object.fromEntries(allAccounts.filter(a => Math.abs(computed.get(a.id)) > 0.004).sort((a, b) => String(a.account_code).localeCompare(String(b.account_code))).map(a => [`${a.account_code} ${a.account_name}`, round2(computed.get(a.id))])),
  };
}


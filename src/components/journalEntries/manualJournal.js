// Validation and payload building for manual journal entries.
// Amounts are compared in whole cents so floating point can't hide an imbalance.

const parseCents = (value) => {
  if (value === '' || value === null || value === undefined) return 0;
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) return null;
  const cents = Math.round(amount * 100);
  return Math.abs(amount * 100 - cents) < 1e-6 ? cents : null;
};

const isBlankLine = (line) =>
  !line.account_id && !line.description?.trim() && !line.debit && !line.credit;

export function getTotals(lines) {
  return lines.reduce(
    (totals, line) => ({
      debit: totals.debit + (parseCents(line.debit) ?? 0),
      credit: totals.credit + (parseCents(line.credit) ?? 0),
    }),
    { debit: 0, credit: 0 },
  );
}

export function validateManualJournal({ entry_date, description, lines }) {
  const errors = [];
  if (!entry_date) errors.push('Enter a date.');
  if (!description?.trim()) errors.push('Enter a memo.');

  const filled = lines.filter((line) => !isBlankLine(line));
  if (filled.length < 2) errors.push('Enter at least two lines.');

  lines.forEach((line, index) => {
    if (isBlankLine(line)) return;
    const label = `Line ${index + 1}`;
    const debit = parseCents(line.debit);
    const credit = parseCents(line.credit);
    if (!line.account_id) errors.push(`${label}: choose an account.`);
    if (debit === null || credit === null) {
      errors.push(`${label}: amounts must be positive, with at most 2 decimal places.`);
    } else if (debit > 0 && credit > 0) {
      errors.push(`${label}: enter a debit or a credit, not both.`);
    } else if (debit === 0 && credit === 0) {
      errors.push(`${label}: enter a debit or a credit.`);
    }
  });

  const totals = getTotals(filled);
  if (totals.debit !== totals.credit) {
    errors.push(`Debits (${(totals.debit / 100).toFixed(2)}) must equal credits (${(totals.credit / 100).toFixed(2)}).`);
  }
  return errors;
}

// Same shape as the system-generated journals, so every report reads it unchanged.
export function buildManualJournalEntry({ companyId, entry_date, reference, description, lines, accounts, postedBy, now = new Date() }) {
  const memo = description.trim();
  const line_items = lines
    .filter((line) => !isBlankLine(line))
    .map((line) => {
      const account = accounts.find((a) => a.id === line.account_id);
      return {
        account_id: account.id,
        account_name: account.account_name,
        account_code: account.account_code,
        description: line.description?.trim() || memo,
        debit: parseCents(line.debit) / 100,
        credit: parseCents(line.credit) / 100,
      };
    });
  const totals = getTotals(lines.filter((line) => !isBlankLine(line)));
  const entry_number = `JE-MAN-${now.getTime()}`;

  return {
    company_id: companyId,
    entry_number,
    entry_date,
    reference: reference?.trim() || entry_number,
    source_type: 'manual',
    description: memo,
    status: 'posted',
    line_items,
    total_debits: totals.debit / 100,
    total_credits: totals.credit / 100,
    posted_by: postedBy || 'system',
    posted_date: now.toISOString(),
  };
}

// Net change to each account's stored balance, by its normal debit or credit side.
export function getBalanceChanges(line_items, accounts) {
  const changes = new Map();
  for (const line of line_items) {
    const account = accounts.find((a) => a.id === line.account_id);
    const isDebitNormal = ['asset', 'expense', 'cost_of_goods_sold'].includes(account.account_type);
    const change = isDebitNormal ? line.debit - line.credit : line.credit - line.debit;
    changes.set(account.id, (changes.get(account.id) || 0) + change);
  }
  return changes;
}

// Shared multi-currency rules.
//
// A document's exchange_rate means "units of its currency per 1 unit of base
// currency", so: base amount = document amount / exchange_rate.

export const CURRENCY_CODES = ['USD', 'EUR', 'GBP', 'NGN', 'ZAR', 'KES', 'GHS', 'CAD', 'AUD', 'INR', 'JPY', 'CNY'];

export const round2 = (value) => Math.round((Number(value) || 0) * 100) / 100;

// A document with no usable rate (for example one raised before the company's
// base currency was changed) is left as it is rather than converted by a guess.
export const isForeignDocument = (doc, baseCurrency) =>
  !!doc?.currency && doc.currency !== baseCurrency && Number(doc.exchange_rate) > 0;

export const toBaseAmount = (amount, doc, baseCurrency) =>
  isForeignDocument(doc, baseCurrency) ? round2((Number(amount) || 0) / Number(doc.exchange_rate)) : Number(amount) || 0;

const AMOUNT_FIELDS = ['subtotal', 'tax_total', 'total_amount', 'amount_paid', 'balance_due'];
const LINE_AMOUNT_FIELDS = ['unit_price', 'unit_cost', 'tax_amount', 'line_total'];

// A copy of an invoice, bill or PO with its amounts in base currency, for totals and reports.
export function toBaseDocument(doc, baseCurrency) {
  if (!isForeignDocument(doc, baseCurrency)) return doc;
  const converted = { ...doc };
  AMOUNT_FIELDS.forEach((field) => {
    if (doc[field] !== undefined && doc[field] !== null) converted[field] = toBaseAmount(doc[field], doc, baseCurrency);
  });
  if (Array.isArray(doc.line_items)) {
    converted.line_items = doc.line_items.map((line) => {
      const convertedLine = { ...line };
      LINE_AMOUNT_FIELDS.forEach((field) => {
        if (line[field] !== undefined && line[field] !== null) convertedLine[field] = toBaseAmount(line[field], doc, baseCurrency);
      });
      return convertedLine;
    });
  }
  return converted;
}

// Base totals for posting. Tax is the difference, so the journal always balances after rounding.
export function getBaseTotals({ subtotal, total_amount }, exchangeRate = 1) {
  const baseSubtotal = round2((Number(subtotal) || 0) / exchangeRate);
  const baseTotal = round2((Number(total_amount) || 0) / exchangeRate);
  return { subtotal: baseSubtotal, total: baseTotal, tax: round2(baseTotal - baseSubtotal) };
}

// Latest rate on or before a date, whichever way round it was entered: both
// "1 NGN = x USD" and "1 USD = x NGN" are valid on the Exchange Rates page.
export function findExchangeRateRecord(rates, foreignCurrency, baseCurrency, onDate) {
  const cutoff = (onDate || new Date().toISOString()).slice(0, 10);
  let best = null;
  (rates || []).forEach((record) => {
    const value = Number(record.exchange_rate);
    const effective = (record.effective_date || '').slice(0, 10);
    if (!(value > 0) || effective > cutoff) return;
    let rate = null;
    if (record.from_currency === baseCurrency && record.to_currency === foreignCurrency) rate = value;
    if (record.from_currency === foreignCurrency && record.to_currency === baseCurrency) rate = 1 / value;
    if (rate !== null && (!best || effective > best.effective_date)) best = { rate, effective_date: effective };
  });
  return best;
}

export const findExchangeRate = (rates, foreignCurrency, baseCurrency, onDate) =>
  findExchangeRateRecord(rates, foreignCurrency, baseCurrency, onDate)?.rate ?? null;

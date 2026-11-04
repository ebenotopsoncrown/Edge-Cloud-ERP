import { useCompany } from "@/components/auth/CompanyContext";
import { formatCurrency } from "./FinancialCalculations";

// Formats an amount in the current company's base currency. Pass a currency code for
// a document in another currency, such as a USD invoice.
export function useMoney() {
  const { currentCompany } = useCompany();
  const baseCurrency = currentCompany?.base_currency || 'USD';
  return (amount, currency) => formatCurrency(amount, currency || baseCurrency);
}

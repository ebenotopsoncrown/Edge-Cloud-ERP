import React, { useState } from "react";
import { ExchangeRate } from "@/api/entities";
import { InvokeLLM } from "@/api/integrations";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrendingUp, RefreshCw, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useCompany } from "../components/auth/CompanyContext";
import PageShell, {
  PageHeader,
  StatBar,
  ERPTable,
  ERPTableRow,
  ERPTableCell,
  ActionBtn,
  NewBtn,
} from "../components/shared/PageShell";

const ACCENT = "#00A86B";
const PRIMARY = "#1B4F8A";

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar',           symbol: '$'   },
  { code: 'EUR', name: 'Euro',                symbol: '€'   },
  { code: 'GBP', name: 'British Pound',       symbol: '£'   },
  { code: 'NGN', name: 'Nigerian Naira',      symbol: '₦'   },
  { code: 'ZAR', name: 'South African Rand',  symbol: 'R'   },
  { code: 'KES', name: 'Kenyan Shilling',     symbol: 'KSh' },
  { code: 'GHS', name: 'Ghanaian Cedi',       symbol: '₵'   },
  { code: 'CAD', name: 'Canadian Dollar',     symbol: 'C$'  },
  { code: 'AUD', name: 'Australian Dollar',   symbol: 'A$'  },
  { code: 'INR', name: 'Indian Rupee',        symbol: '₹'   },
  { code: 'JPY', name: 'Japanese Yen',        symbol: '¥'   },
  { code: 'CNY', name: 'Chinese Yuan',        symbol: '¥'   },
];

export default function ExchangeRates() {
  const { currentCompany } = useCompany();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingRate, setEditingRate] = useState(null);
  const [formData, setFormData] = useState({
    from_currency: 'USD',
    to_currency: 'NGN',
    exchange_rate: 0,
    effective_date: format(new Date(), 'yyyy-MM-dd'),
    rate_type: 'spot',
    source: 'Manual',
  });

  const { data: rates = [], isLoading } = useQuery({
    queryKey: ['exchange-rates', currentCompany?.id],
    queryFn: () =>
      currentCompany
        ? ExchangeRate.list({
            filters: { company_id: currentCompany.id },
            orderBy: 'effective_date',
            ascending: false,
          })
        : Promise.resolve([]),
    enabled: !!currentCompany,
  });

  const createMutation = useMutation({
    mutationFn: (data) => ExchangeRate.create({ ...data, company_id: currentCompany.id }),
    onSuccess: () => {
      queryClient.invalidateQueries(['exchange-rates', currentCompany?.id]);
      setShowForm(false);
      setEditingRate(null);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => ExchangeRate.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['exchange-rates', currentCompany?.id]);
      setShowForm(false);
      setEditingRate(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => ExchangeRate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['exchange-rates', currentCompany?.id]);
    },
  });

  const fetchLiveRates = useMutation({
    mutationFn: async ({ from, to }) => {
      const prompt = `Get the current exchange rate from ${from} to ${to}. Return ONLY a JSON object with this exact structure: {"exchange_rate": number}. The number should be how many ${to} equals 1 ${from}. For example, if 1 USD = 1500 NGN, return {"exchange_rate": 1500}`;
      const result = await InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: { exchange_rate: { type: 'number' } },
        },
      });
      return result.exchange_rate;
    },
    onSuccess: (rate) => {
      setFormData(prev => ({ ...prev, exchange_rate: rate, source: 'Live API' }));
    },
  });

  const resetForm = () => {
    setFormData({
      from_currency: currentCompany?.base_currency || 'USD',
      to_currency: 'NGN',
      exchange_rate: 0,
      effective_date: format(new Date(), 'yyyy-MM-dd'),
      rate_type: 'spot',
      source: 'Manual',
    });
  };

  const handleEdit = (rate) => {
    setEditingRate(rate);
    setFormData({
      from_currency: rate.from_currency,
      to_currency: rate.to_currency,
      exchange_rate: rate.exchange_rate,
      effective_date: rate.effective_date,
      rate_type: rate.rate_type,
      source: rate.source || 'Manual',
    });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingRate) {
      updateMutation.mutate({ id: editingRate.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const baseCurrency = currentCompany?.base_currency || 'USD';
  const activeCurrencies = [...new Set(rates.map(r => r.to_currency))];

  const TABLE_HEADERS = [
    { label: 'From' },
    { label: 'To' },
    { label: 'Rate', right: true },
    { label: 'Effective Date' },
    { label: 'Type' },
    { label: 'Source' },
    { label: '' },
  ];

  return (
    <PageShell>
      <PageHeader
        title="Exchange Rates"
        subtitle={`Manage currency exchange rates for ${currentCompany?.company_name} · Base: ${baseCurrency}`}
        icon={TrendingUp}
        accentColor={ACCENT}
        actions={
          <NewBtn onClick={() => setShowForm(true)} label="Add Exchange Rate" />
        }
      />

      <StatBar
        stats={[
          { label: 'Total Rates', value: rates.length, color: ACCENT },
          { label: 'Currencies', value: activeCurrencies.length, color: PRIMARY },
          { label: 'Base Currency', value: baseCurrency, color: '#64748B' },
        ]}
      />

      <Alert style={{ marginBottom: 20, background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
        <TrendingUp style={{ height: 16, width: 16, color: ACCENT }} />
        <AlertDescription style={{ color: '#14532D' }}>
          <strong>Multi-Currency Setup:</strong> Exchange rates allow you to transact in multiple currencies.
          All amounts are converted to your base currency ({baseCurrency}) for reporting.
        </AlertDescription>
      </Alert>

      {showForm && (
        <Card style={{ marginBottom: 24, border: `1.5px solid ${ACCENT}30` }}>
          <CardHeader>
            <CardTitle style={{ color: '#0F172A' }}>
              {editingRate ? 'Edit Exchange Rate' : 'Add Exchange Rate'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>From Currency</Label>
                  <Select
                    value={formData.from_currency}
                    onValueChange={(value) => setFormData({ ...formData, from_currency: value })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map(curr => (
                        <SelectItem key={curr.code} value={curr.code}>
                          {curr.code} - {curr.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>To Currency</Label>
                  <Select
                    value={formData.to_currency}
                    onValueChange={(value) => setFormData({ ...formData, to_currency: value })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map(curr => (
                        <SelectItem key={curr.code} value={curr.code}>
                          {curr.code} - {curr.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Exchange Rate</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      step="0.0001"
                      value={formData.exchange_rate}
                      onChange={(e) => setFormData({ ...formData, exchange_rate: parseFloat(e.target.value) })}
                      placeholder="1500.00"
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fetchLiveRates.mutate({ from: formData.from_currency, to: formData.to_currency })}
                      disabled={fetchLiveRates.isPending}
                    >
                      <RefreshCw className={`w-4 h-4 ${fetchLiveRates.isPending ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                  <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>
                    1 {formData.from_currency} = {formData.exchange_rate} {formData.to_currency}
                  </p>
                </div>

                <div>
                  <Label>Effective Date</Label>
                  <Input
                    type="date"
                    value={formData.effective_date}
                    onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Rate Type</Label>
                  <Select
                    value={formData.rate_type}
                    onValueChange={(value) => setFormData({ ...formData, rate_type: value })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spot">Spot Rate</SelectItem>
                      <SelectItem value="average">Average Rate</SelectItem>
                      <SelectItem value="fixed">Fixed Rate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Source</Label>
                  <Input
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    placeholder="e.g., Central Bank, Manual"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 16, borderTop: '1px solid #F1F5F9' }}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setShowForm(false); setEditingRate(null); resetForm(); }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  style={{ background: ACCENT, color: 'white', border: 'none' }}
                >
                  {editingRate ? 'Update Rate' : 'Add Rate'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <ERPTable
        headers={TABLE_HEADERS}
        isLoading={isLoading}
        emptyIcon={TrendingUp}
        emptyTitle="No exchange rates configured"
        emptyDesc="Add your first exchange rate to enable multi-currency transactions."
        emptyAction={<NewBtn onClick={() => setShowForm(true)} label="Add First Rate" />}
      >
        {rates.map((rate) => (
          <ERPTableRow key={rate.id}>
            <ERPTableCell bold>{rate.from_currency}</ERPTableCell>
            <ERPTableCell bold>{rate.to_currency}</ERPTableCell>
            <ERPTableCell right style={{ fontFamily: 'monospace', color: ACCENT, fontWeight: 700 }}>
              {rate.exchange_rate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
            </ERPTableCell>
            <ERPTableCell muted>
              {format(new Date(rate.effective_date), 'MMM d, yyyy')}
            </ERPTableCell>
            <ERPTableCell muted style={{ textTransform: 'capitalize' }}>{rate.rate_type}</ERPTableCell>
            <ERPTableCell muted>{rate.source}</ERPTableCell>
            <ERPTableCell>
              <div style={{ display: 'flex', gap: 6 }}>
                <ActionBtn onClick={() => handleEdit(rate)} icon={Pencil} variant="ghost" />
                <ActionBtn
                  onClick={() => deleteMutation.mutate(rate.id)}
                  icon={Trash2}
                  variant="ghost"
                  style={{ color: '#EF4444' }}
                />
              </div>
            </ERPTableCell>
          </ERPTableRow>
        ))}
      </ERPTable>

      {rates.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 12 }}>Quick Reference</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            {activeCurrencies.map(currency => {
              const latestRate = rates
                .filter(r => r.to_currency === currency && r.from_currency === baseCurrency)
                .sort((a, b) => new Date(b.effective_date) - new Date(a.effective_date))[0];

              if (!latestRate) return null;

              return (
                <div
                  key={currency}
                  style={{
                    background: `${PRIMARY}08`,
                    border: `1px solid ${PRIMARY}20`,
                    borderRadius: 10,
                    padding: '14px 16px',
                  }}
                >
                  <p style={{ fontSize: 12, fontWeight: 600, color: PRIMARY }}>
                    {baseCurrency} → {currency}
                  </p>
                  <p style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', marginTop: 4 }}>
                    {latestRate.exchange_rate.toFixed(2)}
                  </p>
                  <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                    {format(new Date(latestRate.effective_date), 'MMM d')}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </PageShell>
  );
}

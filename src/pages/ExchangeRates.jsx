import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, TrendingUp, RefreshCw, Pencil, Trash2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { useCompany } from "../components/auth/CompanyContext";

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' }
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
    source: 'Manual'
  });

  const { data: rates = [], isLoading } = useQuery({
    queryKey: ['exchange-rates', currentCompany?.id],
    queryFn: () => currentCompany 
      ? base44.entities.ExchangeRate.filter({ company_id: currentCompany.id }, '-effective_date') 
      : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ExchangeRate.create({
      ...data,
      company_id: currentCompany.id
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['exchange-rates', currentCompany?.id]);
      setShowForm(false);
      setEditingRate(null);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ExchangeRate.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['exchange-rates', currentCompany?.id]);
      setShowForm(false);
      setEditingRate(null);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ExchangeRate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['exchange-rates', currentCompany?.id]);
    }
  });

  const fetchLiveRates = useMutation({
    mutationFn: async ({ from, to }) => {
      const prompt = `Get the current exchange rate from ${from} to ${to}. Return ONLY a JSON object with this exact structure: {"exchange_rate": number}. The number should be how many ${to} equals 1 ${from}. For example, if 1 USD = 1500 NGN, return {"exchange_rate": 1500}`;
      
      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            exchange_rate: { type: "number" }
          }
        }
      });
      
      return result.exchange_rate;
    },
    onSuccess: (rate) => {
      setFormData(prev => ({ ...prev, exchange_rate: rate, source: 'Live API' }));
    }
  });

  const resetForm = () => {
    setFormData({
      from_currency: currentCompany?.base_currency || 'USD',
      to_currency: 'NGN',
      exchange_rate: 0,
      effective_date: format(new Date(), 'yyyy-MM-dd'),
      rate_type: 'spot',
      source: 'Manual'
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
      source: rate.source || 'Manual'
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Exchange Rates</h1>
          <p className="text-gray-500 mt-1">
            Manage currency exchange rates for {currentCompany?.company_name}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Base Currency: <span className="font-semibold">{baseCurrency}</span>
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Exchange Rate
        </Button>
      </div>

      <Alert className="bg-blue-50 border-blue-200">
        <TrendingUp className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900">
          <strong>Multi-Currency Setup:</strong> Exchange rates allow you to transact in multiple currencies. 
          All amounts are converted to your base currency ({baseCurrency}) for reporting.
        </AlertDescription>
      </Alert>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingRate ? 'Edit Exchange Rate' : 'Add Exchange Rate'}</CardTitle>
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
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
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
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
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
                      onClick={() => fetchLiveRates.mutate({ 
                        from: formData.from_currency, 
                        to: formData.to_currency 
                      })}
                      disabled={fetchLiveRates.isPending}
                    >
                      {fetchLiveRates.isPending ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
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
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
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

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingRate(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {editingRate ? 'Update Rate' : 'Add Rate'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Exchange Rates History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8 text-gray-500">Loading exchange rates...</p>
          ) : rates.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 mb-4">No exchange rates configured</p>
              <Button onClick={() => setShowForm(true)} variant="outline">
                Add your first exchange rate
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Effective Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rates.map((rate) => (
                  <TableRow key={rate.id}>
                    <TableCell className="font-medium">{rate.from_currency}</TableCell>
                    <TableCell className="font-medium">{rate.to_currency}</TableCell>
                    <TableCell>
                      <span className="font-mono text-green-600">
                        {rate.exchange_rate.toLocaleString(undefined, { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 4 
                        })}
                      </span>
                    </TableCell>
                    <TableCell>{format(new Date(rate.effective_date), 'MMM d, yyyy')}</TableCell>
                    <TableCell className="capitalize">{rate.rate_type}</TableCell>
                    <TableCell>{rate.source}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(rate)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteMutation.mutate(rate.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {rates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Reference</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {activeCurrencies.map(currency => {
                const latestRate = rates
                  .filter(r => r.to_currency === currency && r.from_currency === baseCurrency)
                  .sort((a, b) => new Date(b.effective_date) - new Date(a.effective_date))[0];
                
                if (!latestRate) return null;

                return (
                  <div key={currency} className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                    <p className="text-sm text-blue-900 font-semibold">{baseCurrency} → {currency}</p>
                    <p className="text-2xl font-bold text-blue-900 mt-2">
                      {latestRate.exchange_rate.toFixed(2)}
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      {format(new Date(latestRate.effective_date), 'MMM d')}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
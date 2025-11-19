import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Building2, Book, Users, Package } from "lucide-react";
import { CHART_OF_ACCOUNTS_TEMPLATES } from "./ChartOfAccountsTemplates";

export default function CompanySetupWizard({ company, onComplete }) {
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const setupChartOfAccounts = async () => {
    if (!selectedTemplate) {
      alert('Please select a chart of accounts template');
      return;
    }

    setIsLoading(true);

    try {
      const template = CHART_OF_ACCOUNTS_TEMPLATES[selectedTemplate];
      const accounts = template.accounts.map(acc => ({
        company_id: company.id,
        account_code: acc.code,
        account_name: acc.name,
        account_type: acc.type,
        account_category: acc.category,
        is_active: true,
        balance: 0,
        currency: company.base_currency || 'USD'
      }));

      // Create all accounts
      await base44.entities.Account.bulkCreate(accounts);

      // Mark company as onboarded
      await base44.entities.Company.update(company.id, {
        onboarding_completed: true,
        setup_wizard_step: 1
      });

      queryClient.invalidateQueries(['companies']);
      queryClient.invalidateQueries(['accounts']);
      
      onComplete();
    } catch (error) {
      console.error('Error setting up chart of accounts:', error);
      alert('Error setting up chart of accounts. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <Card className="w-full max-w-4xl shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-2xl">Welcome to {company.company_name}!</CardTitle>
              <p className="text-blue-100 text-sm mt-1">Let's set up your Chart of Accounts</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8 space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mb-2">
                1
              </div>
              <span className="text-sm font-medium text-blue-600">Chart of Accounts</span>
            </div>
            <div className="w-24 h-1 bg-gray-200"></div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center font-bold mb-2">
                2
              </div>
              <span className="text-sm text-gray-500">Customers & Vendors</span>
            </div>
            <div className="w-24 h-1 bg-gray-200"></div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center font-bold mb-2">
                3
              </div>
              <span className="text-sm text-gray-500">Products & Services</span>
            </div>
          </div>

          {/* Info Card */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <Book className="w-12 h-12 text-blue-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">Why Chart of Accounts?</h3>
                  <p className="text-sm text-gray-700">
                    The Chart of Accounts is the foundation of your accounting system. It categorizes all 
                    financial transactions into Assets, Liabilities, Equity, Revenue, and Expenses. Choose 
                    a preset template that matches your business type, and you can customize it later.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Template Selection */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Select Your Business Type</Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger className="text-lg p-6">
                <SelectValue placeholder="Choose a Chart of Accounts template..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CHART_OF_ACCOUNTS_TEMPLATES).map(([key, template]) => (
                  <SelectItem key={key} value={key} className="text-lg p-4">
                    <div className="flex items-center gap-3">
                      <Building2 className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-semibold">{template.name}</p>
                        <p className="text-xs text-gray-500">{template.accounts.length} accounts included</p>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Template Preview */}
          {selectedTemplate && (
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  {CHART_OF_ACCOUNTS_TEMPLATES[selectedTemplate].name} - Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-sm text-gray-600">Total Accounts</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {CHART_OF_ACCOUNTS_TEMPLATES[selectedTemplate].accounts.length}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-sm text-gray-600">Fully Customizable</p>
                    <p className="text-2xl font-bold text-green-600">✓ Yes</p>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 max-h-60 overflow-y-auto">
                  <p className="font-semibold mb-3">Sample Accounts:</p>
                  <div className="space-y-2">
                    {CHART_OF_ACCOUNTS_TEMPLATES[selectedTemplate].accounts.slice(0, 10).map((acc, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm border-b pb-2">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="font-mono">{acc.code}</Badge>
                          <span>{acc.name}</span>
                        </div>
                        <Badge className="text-xs capitalize">{acc.type}</Badge>
                      </div>
                    ))}
                    {CHART_OF_ACCOUNTS_TEMPLATES[selectedTemplate].accounts.length > 10 && (
                      <p className="text-xs text-gray-500 pt-2 text-center">
                        + {CHART_OF_ACCOUNTS_TEMPLATES[selectedTemplate].accounts.length - 10} more accounts...
                      </p>
                    )}
                  </div>
                </div>

                <p className="text-xs text-green-700 mt-4">
                  <strong>Note:</strong> After setup, you can edit account codes, names, add new accounts, 
                  or deactivate accounts you don't need.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button
              onClick={setupChartOfAccounts}
              disabled={!selectedTemplate || isLoading}
              className="bg-blue-600 hover:bg-blue-700 px-8 py-6 text-lg"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  Setting up...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Complete Setup
                </div>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
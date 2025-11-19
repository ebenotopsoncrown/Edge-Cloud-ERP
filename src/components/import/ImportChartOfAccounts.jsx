import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { useCompany } from "../auth/CompanyContext";

export default function ImportChartOfAccounts() {
  const { currentCompany } = useCompany();
  const queryClient = useQueryClient();
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [validationResults, setValidationResults] = useState([]);
  const [importResults, setImportResults] = useState(null);

  const { data: existingAccounts = [] } = useQuery({
    queryKey: ['accounts', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.Account.filter({ company_id: currentCompany.id }) : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return file_url;
    }
  });

  const parseMutation = useMutation({
    mutationFn: async (fileUrl) => {
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: fileUrl,
        json_schema: {
          type: "object",
          properties: {
            accounts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  account_code: { type: "string" },
                  account_name: { type: "string" },
                  account_type: { type: "string" },
                  account_category: { type: "string" },
                  description: { type: "string" },
                  opening_balance: { type: "number" }
                }
              }
            }
          }
        }
      });
      return result.output.accounts || result.output;
    },
    onSuccess: (data) => {
      const dataArray = Array.isArray(data) ? data : [data];
      setParsedData(dataArray);
      validateData(dataArray);
    }
  });

  const validateData = (data) => {
    const validAccountTypes = ['asset', 'liability', 'equity', 'revenue', 'expense', 'cost_of_goods_sold'];
    const validCategories = [
      'current_asset', 'fixed_asset', 'current_liability', 'long_term_liability', 
      'equity', 'operating_revenue', 'other_revenue', 'operating_expense', 
      'other_expense', 'cost_of_sales'
    ];

    const results = data.map((row, index) => {
      const errors = [];
      
      if (!row.account_code || row.account_code.trim() === '') {
        errors.push('Account code is required');
      } else if (existingAccounts.some(acc => acc.account_code === row.account_code)) {
        errors.push('Account code already exists');
      }
      
      if (!row.account_name || row.account_name.trim() === '') {
        errors.push('Account name is required');
      }
      
      if (!row.account_type || !validAccountTypes.includes(row.account_type)) {
        errors.push(`Invalid account type. Must be one of: ${validAccountTypes.join(', ')}`);
      }
      
      if (!row.account_category || !validCategories.includes(row.account_category)) {
        errors.push(`Invalid category. Must be one of: ${validCategories.join(', ')}`);
      }

      return {
        index,
        row,
        valid: errors.length === 0,
        errors
      };
    });

    setValidationResults(results);
  };

  const importMutation = useMutation({
    mutationFn: async () => {
      const validRows = validationResults.filter(r => r.valid);
      const results = {
        total: validRows.length,
        success: 0,
        failed: 0,
        errors: []
      };

      // Find equity account for opening balance journals
      const equityAccount = existingAccounts.find(a => 
        a.account_type === 'equity' && 
        (a.account_name?.toLowerCase().includes("owner's capital") || a.account_name?.toLowerCase().includes('capital'))
      );

      for (const { row } of validRows) {
        try {
          const accountData = {
            company_id: currentCompany.id,
            account_code: row.account_code,
            account_name: row.account_name,
            account_type: row.account_type,
            account_category: row.account_category,
            description: row.description || '',
            balance: parseFloat(row.opening_balance) || 0,
            is_active: true
          };

          const createdAccount = await base44.entities.Account.create(accountData);

          // Post opening balance journal if balance exists and equity account exists
          if (accountData.balance !== 0 && equityAccount) {
            const isDebit = ['asset', 'expense', 'cost_of_goods_sold'].includes(accountData.account_type);
            
            const journalEntry = {
              company_id: currentCompany.id,
              entry_number: `OB-${accountData.account_code}`,
              entry_date: new Date().toISOString().split('T')[0],
              reference: `Opening Balance - ${accountData.account_name}`,
              source_type: 'manual',
              description: `Opening Balance - ${accountData.account_name}`,
              status: 'posted',
              line_items: isDebit ? [
                {
                  account_id: createdAccount.id,
                  account_name: accountData.account_name,
                  account_code: accountData.account_code,
                  description: 'Opening balance',
                  debit: Math.abs(accountData.balance),
                  credit: 0
                },
                {
                  account_id: equityAccount.id,
                  account_name: equityAccount.account_name,
                  account_code: equityAccount.account_code,
                  description: 'Opening Balance Equity',
                  debit: 0,
                  credit: Math.abs(accountData.balance)
                }
              ] : [
                {
                  account_id: equityAccount.id,
                  account_name: equityAccount.account_name,
                  account_code: equityAccount.account_code,
                  description: 'Opening Balance Equity',
                  debit: Math.abs(accountData.balance),
                  credit: 0
                },
                {
                  account_id: createdAccount.id,
                  account_name: accountData.account_name,
                  account_code: accountData.account_code,
                  description: 'Opening balance',
                  debit: 0,
                  credit: Math.abs(accountData.balance)
                }
              ],
              total_debits: Math.abs(accountData.balance),
              total_credits: Math.abs(accountData.balance),
              posted_by: currentCompany.admin_user_id || 'system',
              posted_date: new Date().toISOString()
            };

            await base44.entities.JournalEntry.create(journalEntry);

            // Update equity account balance
            await base44.entities.Account.update(equityAccount.id, {
              balance: isDebit 
                ? (equityAccount.balance || 0) + Math.abs(accountData.balance)
                : (equityAccount.balance || 0) - Math.abs(accountData.balance)
            });
          }

          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            account: row.account_code,
            error: error.message
          });
        }
      }

      return results;
    },
    onSuccess: (results) => {
      setImportResults(results);
      queryClient.invalidateQueries(['accounts', currentCompany?.id]);
      queryClient.invalidateQueries(['journal-entries', currentCompany?.id]);
    }
  });

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setParsedData([]);
      setValidationResults([]);
      setImportResults(null);

      const fileUrl = await uploadMutation.mutateAsync(selectedFile);
      parseMutation.mutate(fileUrl);
    }
  };

  const validCount = validationResults.filter(r => r.valid).length;
  const invalidCount = validationResults.length - validCount;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileChange}
          disabled={uploadMutation.isPending || parseMutation.isPending}
        />
        {(uploadMutation.isPending || parseMutation.isPending) && (
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
        )}
      </div>

      {parseMutation.isError && (
        <Alert className="bg-red-50 border-red-200">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-900">
            Failed to parse file. Please ensure it's a valid CSV file with correct format.
          </AlertDescription>
        </Alert>
      )}

      {validationResults.length > 0 && (
        <>
          <Alert className={validCount === validationResults.length ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"}>
            <AlertCircle className={`h-4 w-4 ${validCount === validationResults.length ? 'text-green-600' : 'text-yellow-600'}`} />
            <AlertDescription className={validCount === validationResults.length ? 'text-green-900' : 'text-yellow-900'}>
              <strong>Validation Results:</strong> {validCount} valid rows, {invalidCount} invalid rows
              {invalidCount > 0 && <p className="mt-1">Invalid rows will be skipped during import.</p>}
            </AlertDescription>
          </Alert>

          <div className="border rounded-lg overflow-hidden">
            <div className="max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Status</TableHead>
                    <TableHead>Account Code</TableHead>
                    <TableHead>Account Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Opening Balance</TableHead>
                    <TableHead>Errors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validationResults.map((result) => (
                    <TableRow key={result.index} className={result.valid ? 'bg-green-50' : 'bg-red-50'}>
                      <TableCell>
                        {result.valid ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{result.row.account_code}</TableCell>
                      <TableCell>{result.row.account_name}</TableCell>
                      <TableCell>{result.row.account_type}</TableCell>
                      <TableCell>{result.row.account_category}</TableCell>
                      <TableCell>${parseFloat(result.row.opening_balance || 0).toFixed(2)}</TableCell>
                      <TableCell>
                        {result.errors.length > 0 && (
                          <ul className="text-xs text-red-600 list-disc ml-4">
                            {result.errors.map((error, i) => (
                              <li key={i}>{error}</li>
                            ))}
                          </ul>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {validCount > 0 && !importResults && (
            <Button
              onClick={() => importMutation.mutate()}
              disabled={importMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {importMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import {validCount} Account{validCount !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          )}
        </>
      )}

      {importResults && (
        <Alert className="bg-blue-50 border-blue-200">
          <CheckCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <strong>Import Complete!</strong>
            <p className="mt-2">
              Successfully imported: {importResults.success} accounts<br />
              Failed: {importResults.failed} accounts
            </p>
            {importResults.errors.length > 0 && (
              <div className="mt-3">
                <strong>Errors:</strong>
                <ul className="list-disc ml-5 mt-1">
                  {importResults.errors.map((err, i) => (
                    <li key={i}>{err.account}: {err.error}</li>
                  ))}
                </ul>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
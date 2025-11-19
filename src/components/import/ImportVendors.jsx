import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { useCompany } from "../auth/CompanyContext";

export default function ImportVendors() {
  const { currentCompany } = useCompany();
  const queryClient = useQueryClient();
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [validationResults, setValidationResults] = useState([]);
  const [importResults, setImportResults] = useState(null);

  const { data: existingVendors = [] } = useQuery({
    queryKey: ['vendors', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.Vendor.filter({ company_id: currentCompany.id }) : Promise.resolve([]),
    enabled: !!currentCompany
  });

  const { data: accounts = [] } = useQuery({
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
            vendors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  vendor_code: { type: "string" },
                  company_name: { type: "string" },
                  contact_person: { type: "string" },
                  email: { type: "string" },
                  phone: { type: "string" },
                  street: { type: "string" },
                  city: { type: "string" },
                  state: { type: "string" },
                  postal_code: { type: "string" },
                  country: { type: "string" },
                  payment_terms: { type: "string" },
                  opening_balance: { type: "number" }
                }
              }
            }
          }
        }
      });
      return result.output.vendors || result.output;
    },
    onSuccess: (data) => {
      const dataArray = Array.isArray(data) ? data : [data];
      setParsedData(dataArray);
      validateData(dataArray);
    }
  });

  const validateData = (data) => {
    const validPaymentTerms = ['due_on_receipt', 'net_15', 'net_30', 'net_60', 'net_90'];

    const results = data.map((row, index) => {
      const errors = [];
      
      if (!row.company_name || row.company_name.trim() === '') {
        errors.push('Company name is required');
      }
      
      if (!row.email || !row.email.includes('@')) {
        errors.push('Valid email is required');
      }

      if (row.vendor_code && existingVendors.some(v => v.vendor_code === row.vendor_code)) {
        errors.push('Vendor code already exists');
      }

      if (row.payment_terms && !validPaymentTerms.includes(row.payment_terms)) {
        errors.push(`Invalid payment terms. Must be one of: ${validPaymentTerms.join(', ')}`);
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

      const apAccount = accounts.find(a => 
        a.account_type === 'liability' && 
        (a.account_category === 'current_liability' || a.account_name?.toLowerCase().includes('payable'))
      );
      
      const equityAccount = accounts.find(a => 
        a.account_type === 'equity' && 
        (a.account_name?.toLowerCase().includes("owner's capital") || a.account_name?.toLowerCase().includes('capital'))
      );

      for (const { row } of validRows) {
        try {
          const openingBalance = parseFloat(row.opening_balance) || 0;
          
          const vendorData = {
            company_id: currentCompany.id,
            vendor_code: row.vendor_code || `VEND${Date.now()}`,
            company_name: row.company_name,
            contact_person: row.contact_person || '',
            email: row.email,
            phone: row.phone || '',
            address: {
              street: row.street || '',
              city: row.city || '',
              state: row.state || '',
              postal_code: row.postal_code || '',
              country: row.country || ''
            },
            payment_terms: row.payment_terms || 'net_30',
            currency: 'USD',
            is_active: true,
            total_outstanding: openingBalance
          };

          const createdVendor = await base44.entities.Vendor.create(vendorData);

          if (openingBalance > 0 && apAccount && equityAccount) {
            const journalEntry = {
              company_id: currentCompany.id,
              entry_number: `OB-VEND-${vendorData.vendor_code}`,
              entry_date: new Date().toISOString().split('T')[0],
              reference: `Vendor Opening Balance - ${vendorData.company_name}`,
              source_type: 'manual',
              description: `Opening Balance - ${vendorData.company_name}`,
              status: 'posted',
              line_items: [
                {
                  account_id: equityAccount.id,
                  account_name: equityAccount.account_name,
                  account_code: equityAccount.account_code,
                  description: 'Opening Balance Equity',
                  debit: openingBalance,
                  credit: 0
                },
                {
                  account_id: apAccount.id,
                  account_name: apAccount.account_name,
                  account_code: apAccount.account_code,
                  description: `Vendor opening balance - ${vendorData.company_name}`,
                  debit: 0,
                  credit: openingBalance
                }
              ],
              total_debits: openingBalance,
              total_credits: openingBalance,
              posted_by: 'system',
              posted_date: new Date().toISOString()
            };
            
            await base44.entities.JournalEntry.create(journalEntry);
            
            await base44.entities.Account.update(apAccount.id, {
              balance: (apAccount.balance || 0) + openingBalance
            });
            
            await base44.entities.Account.update(equityAccount.id, {
              balance: (equityAccount.balance || 0) - openingBalance
            });
          }

          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            vendor: row.company_name,
            error: error.message
          });
        }
      }

      return results;
    },
    onSuccess: (results) => {
      setImportResults(results);
      queryClient.invalidateQueries(['vendors', currentCompany?.id]);
      queryClient.invalidateQueries(['journal-entries', currentCompany?.id]);
      queryClient.invalidateQueries(['accounts', currentCompany?.id]);
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
            Failed to parse file. Please ensure it is a valid CSV file with correct format.
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
                    <TableHead>Company Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
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
                      <TableCell className="font-medium">{result.row.company_name}</TableCell>
                      <TableCell>{result.row.contact_person}</TableCell>
                      <TableCell>{result.row.email}</TableCell>
                      <TableCell>{result.row.phone}</TableCell>
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
                  Import {validCount} Vendor{validCount !== 1 ? 's' : ''}
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
              Successfully imported: {importResults.success} vendors<br />
              Failed: {importResults.failed} vendors
            </p>
            {importResults.errors.length > 0 && (
              <div className="mt-3">
                <strong>Errors:</strong>
                <ul className="list-disc ml-5 mt-1">
                  {importResults.errors.map((err, i) => (
                    <li key={i}>{err.vendor}: {err.error}</li>
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
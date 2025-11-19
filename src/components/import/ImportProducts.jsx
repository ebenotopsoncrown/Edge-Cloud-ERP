import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { useCompany } from "../auth/CompanyContext";

export default function ImportProducts() {
  const { currentCompany } = useCompany();
  const queryClient = useQueryClient();
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [validationResults, setValidationResults] = useState([]);
  const [importResults, setImportResults] = useState(null);

  const { data: existingProducts = [] } = useQuery({
    queryKey: ['products', currentCompany?.id],
    queryFn: () => currentCompany ? base44.entities.Product.filter({ company_id: currentCompany.id }) : Promise.resolve([]),
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
            products: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  sku: { type: "string" },
                  product_name: { type: "string" },
                  description: { type: "string" },
                  category: { type: "string" },
                  product_type: { type: "string" },
                  unit_price: { type: "number" },
                  cost_price: { type: "number" },
                  unit_of_measure: { type: "string" },
                  quantity_on_hand: { type: "number" },
                  reorder_level: { type: "number" },
                  tax_rate: { type: "number" }
                }
              }
            }
          }
        }
      });
      return result.output.products || result.output;
    },
    onSuccess: (data) => {
      const dataArray = Array.isArray(data) ? data : [data];
      setParsedData(dataArray);
      validateData(dataArray);
    }
  });

  const validateData = (data) => {
    const validProductTypes = ['inventory', 'service', 'non_inventory'];

    const results = data.map((row, index) => {
      const errors = [];
      
      if (!row.product_name || row.product_name.trim() === '') {
        errors.push('Product name is required');
      }
      
      if (!row.unit_price || parseFloat(row.unit_price) <= 0) {
        errors.push('Unit price must be greater than 0');
      }

      if (row.sku && existingProducts.some(p => p.sku === row.sku)) {
        errors.push('SKU already exists');
      }

      if (row.product_type && !validProductTypes.includes(row.product_type)) {
        errors.push(`Invalid product type. Must be one of: ${validProductTypes.join(', ')}`);
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

      for (const { row } of validRows) {
        try {
          const productData = {
            company_id: currentCompany.id,
            sku: row.sku || `PRD${Date.now()}`,
            product_name: row.product_name,
            description: row.description || '',
            category: row.category || '',
            product_type: row.product_type || 'inventory',
            unit_price: parseFloat(row.unit_price) || 0,
            cost_price: parseFloat(row.cost_price) || 0,
            unit_of_measure: row.unit_of_measure || 'unit',
            quantity_on_hand: parseFloat(row.quantity_on_hand) || 0,
            reorder_level: parseFloat(row.reorder_level) || 0,
            reorder_quantity: 0,
            tax_rate: parseFloat(row.tax_rate) || 0,
            is_active: true
          };

          await base44.entities.Product.create(productData);
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            product: row.product_name,
            error: error.message
          });
        }
      }

      return results;
    },
    onSuccess: (results) => {
      setImportResults(results);
      queryClient.invalidateQueries(['products', currentCompany?.id]);
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
            </AlertDescription>
          </Alert>

          <div className="border rounded-lg overflow-hidden">
            <div className="max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Status</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Cost Price</TableHead>
                    <TableHead>Quantity</TableHead>
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
                      <TableCell className="font-medium">{result.row.sku}</TableCell>
                      <TableCell>{result.row.product_name}</TableCell>
                      <TableCell>{result.row.product_type}</TableCell>
                      <TableCell>${parseFloat(result.row.unit_price || 0).toFixed(2)}</TableCell>
                      <TableCell>${parseFloat(result.row.cost_price || 0).toFixed(2)}</TableCell>
                      <TableCell>{parseFloat(result.row.quantity_on_hand || 0)}</TableCell>
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
                  Import {validCount} Product{validCount !== 1 ? 's' : ''}
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
              Successfully imported: {importResults.success} products<br />
              Failed: {importResults.failed} products
            </p>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
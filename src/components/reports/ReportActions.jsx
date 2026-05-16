import React from "react";
import { Button } from "@/components/ui/button";
import { Download, Printer, FileSpreadsheet } from "lucide-react";

export default function ReportActions({ 
  reportTitle, 
  tableData, 
  onPrint,
  fileName 
}) {
  
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  const handleExportExcel = () => {
    if (!tableData || tableData.length === 0) {
      alert('No data to export');
      return;
    }

    // Create a simple CSV instead of Excel for now
    const headers = Object.keys(tableData[0]).join(',');
    const rows = tableData.map(row => 
      Object.values(row).map(val => 
        typeof val === 'string' && val.includes(',') ? `"${val}"` : val
      ).join(',')
    );
    const csv = [headers, ...rows].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || `report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="flex gap-3 print:hidden">
      <Button
        onClick={handleExportExcel}
        variant="outline"
        className="bg-green-50 hover:bg-green-100 border-green-200"
      >
        <FileSpreadsheet className="w-4 h-4 mr-2" />
        Export to CSV
      </Button>
      
      <Button
        onClick={handleExportPDF}
        variant="outline"
        className="bg-red-50 hover:bg-red-100 border-red-200"
      >
        <Download className="w-4 h-4 mr-2" />
        Export to PDF
      </Button>
      
      <Button
        onClick={handlePrint}
        variant="outline"
        className="bg-blue-50 hover:bg-blue-100 border-blue-200"
      >
        <Printer className="w-4 h-4 mr-2" />
        Print
      </Button>
    </div>
  );
}
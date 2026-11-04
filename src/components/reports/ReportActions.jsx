import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, Printer, FileSpreadsheet } from "lucide-react";
import { useCompany } from "../auth/CompanyContext";

// "₦1,234.50" or "-₦1,234.50" becomes 1234.50, so a spreadsheet can add it up.
const toCellValue = (text) => {
  const value = text.replace(/\s+/g, ' ').trim();
  const money = value.match(/^(-?)[^\d\s.,-]{0,3}([\d,]+\.\d{2})$/);
  return money ? `${money[1]}${money[2].replace(/,/g, '')}` : value;
};

const toCsvField = (value) => {
  // Stops a name such as "=SUM(...)" running as a formula when the file is opened.
  const safe = /^[=+@\t\r]/.test(value) || /^-[^\d.\s]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

// Reads the report as displayed: section headings, tables and total lines, in page order.
function readReportRows(scope) {
  const rows = [];
  scope.querySelectorAll('table, h3, h4, .font-bold.text-sm, .flex.justify-between').forEach((element) => {
    if (element.closest('table') && element.tagName !== 'TABLE') return;
    if (element.tagName === 'TABLE') {
      element.querySelectorAll('tr').forEach((tr) => {
        const cells = [];
        tr.querySelectorAll('th, td').forEach((cell) => {
          cells.push(toCellValue(cell.innerText));
          for (let i = 1; i < cell.colSpan; i++) cells.push('');
        });
        if (cells.some(Boolean)) rows.push(cells);
      });
    } else if (element.classList.contains('flex')) {
      const cells = [...element.children].map((child) => toCellValue(child.innerText));
      if (cells.some(Boolean)) rows.push(cells);
    } else {
      rows.push([]);
      rows.push([element.innerText.replace(/\s*\n+\s*/g, ' - ').trim()]);
    }
  });
  return rows;
}

export default function ReportActions({
  reportTitle,
  onPrint,
  fileName
}) {
  const { currentCompany } = useCompany();
  const rootRef = useRef(null);

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  const handleExportCsv = () => {
    const rows = readReportRows(rootRef.current.parentElement);
    if (!rows.some(row => row.length > 1)) {
      alert('No data to export');
      return;
    }

    const header = [
      [reportTitle],
      [currentCompany?.company_name || ''],
      [`Reporting Currency: ${currentCompany?.base_currency || ''}`],
      [`Exported: ${new Date().toISOString().split('T')[0]}`],
      [],
    ];
    const csv = [...header, ...rows].map(row => row.map(toCsvField).join(',')).join('\r\n');

    // The byte order mark tells Excel the file is UTF-8.
    const blob = new Blob([`﻿${csv}\r\n`], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const slug = (reportTitle || 'report').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    a.download = fileName || `${slug}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div ref={rootRef} className="flex gap-3 print:hidden">
      <Button
        onClick={handleExportCsv}
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

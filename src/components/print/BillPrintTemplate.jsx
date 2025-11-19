import React from "react";
import { format } from "date-fns";

export default function BillPrintTemplate({ bill, company }) {
  return (
    <div className="hidden print:block print:p-8">
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>

      {/* Header */}
      <div className="flex justify-between items-start mb-8 pb-4 border-b-2 border-gray-800">
        <div>
          {company?.logo_url && (
            <img src={company.logo_url} alt="Company Logo" className="h-16 mb-2" />
          )}
          <h1 className="text-2xl font-bold text-gray-900">{company?.company_name || 'Edge Cloud Enterprise'}</h1>
          <p className="text-sm text-gray-600">{company?.address?.street}</p>
          <p className="text-sm text-gray-600">
            {company?.address?.city}, {company?.address?.state} {company?.address?.postal_code}
          </p>
          <p className="text-sm text-gray-600">Tax ID: {company?.tax_number}</p>
        </div>
        <div className="text-right">
          <h2 className="text-3xl font-bold text-gray-900">BILL</h2>
          <p className="text-lg font-semibold mt-2">#{bill.bill_number}</p>
          <p className="text-sm text-gray-600 mt-2">Date: {format(new Date(bill.bill_date), 'MMM dd, yyyy')}</p>
          <p className="text-sm text-gray-600">Due: {format(new Date(bill.due_date), 'MMM dd, yyyy')}</p>
        </div>
      </div>

      {/* Vendor Info */}
      <div className="mb-8">
        <h3 className="font-bold text-gray-700 mb-2">VENDOR:</h3>
        <p className="font-semibold text-lg">{bill.vendor_name}</p>
        {bill.reference && (
          <p className="text-sm text-gray-600 mt-1">Vendor Reference: {bill.reference}</p>
        )}
      </div>

      {/* Line Items */}
      <table className="w-full mb-8">
        <thead className="bg-gray-100">
          <tr className="border-b-2 border-gray-800">
            <th className="text-left p-2">#</th>
            <th className="text-left p-2">Description</th>
            <th className="text-right p-2">Qty</th>
            <th className="text-right p-2">Unit Cost</th>
            <th className="text-right p-2">Tax</th>
            <th className="text-right p-2">Total</th>
          </tr>
        </thead>
        <tbody>
          {bill.line_items?.map((item, index) => (
            <tr key={index} className="border-b border-gray-300">
              <td className="p-2">{index + 1}</td>
              <td className="p-2">{item.description}</td>
              <td className="text-right p-2">{item.quantity}</td>
              <td className="text-right p-2">${item.unit_cost.toFixed(2)}</td>
              <td className="text-right p-2">${item.tax_amount.toFixed(2)}</td>
              <td className="text-right p-2 font-semibold">${item.line_total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-64">
          <div className="flex justify-between py-2 border-b border-gray-300">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-semibold">${bill.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-300">
            <span className="text-gray-600">Tax:</span>
            <span className="font-semibold">${bill.tax_total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-2 border-t-2 border-gray-800">
            <span className="text-xl font-bold">TOTAL:</span>
            <span className="text-xl font-bold">${bill.total_amount.toFixed(2)}</span>
          </div>
          {bill.balance_due > 0 && (
            <div className="flex justify-between py-2 bg-red-50 px-2 mt-2">
              <span className="font-bold text-red-700">Amount Due:</span>
              <span className="font-bold text-red-700">${bill.balance_due.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      {bill.notes && (
        <div className="mb-8">
          <h4 className="font-bold text-gray-700 mb-2">Notes:</h4>
          <p className="text-sm text-gray-600">{bill.notes}</p>
        </div>
      )}

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-8 mt-16">
        <div className="text-center">
          <div className="border-t-2 border-gray-800 pt-2">
            <p className="text-sm font-semibold">Received By</p>
          </div>
        </div>
        <div className="text-center">
          <div className="border-t-2 border-gray-800 pt-2">
            <p className="text-sm font-semibold">Approved By</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500 mt-8 pt-4 border-t border-gray-300">
        <p>This is a computer-generated bill</p>
      </div>
    </div>
  );
}
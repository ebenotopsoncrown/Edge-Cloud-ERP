import React from "react";
import { format } from "date-fns";

export default function InventoryReceiptPrintTemplate({ receipt, company }) {
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
      <div className="text-center mb-8 pb-4 border-b-2 border-gray-800">
        {company?.logo_url && (
          <img src={company.logo_url} alt="Company Logo" className="h-16 mx-auto mb-2" />
        )}
        <h1 className="text-2xl font-bold text-gray-900">{company?.company_name || 'Edge Cloud Enterprise'}</h1>
        <h2 className="text-xl font-semibold text-green-700 mt-2">GOODS RECEIPT NOTE</h2>
        <p className="text-lg font-semibold mt-1">#{receipt.receipt_number}</p>
      </div>

      {/* Receipt Details */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="font-bold text-gray-700 mb-3">Receipt Information:</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Date:</span>
              <span className="font-semibold">{format(new Date(receipt.receipt_date), 'MMM dd, yyyy')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Vendor:</span>
              <span className="font-semibold">{receipt.vendor_name}</span>
            </div>
            {receipt.po_number && (
              <div className="flex justify-between">
                <span className="text-gray-600">PO Number:</span>
                <span className="font-semibold">{receipt.po_number}</span>
              </div>
            )}
            {receipt.location_name && (
              <div className="flex justify-between">
                <span className="text-gray-600">Location:</span>
                <span className="font-semibold">{receipt.location_name}</span>
              </div>
            )}
          </div>
        </div>
        
        <div>
          <h3 className="font-bold text-gray-700 mb-3">Billing Information:</h3>
          <div className="space-y-2">
            {receipt.bill_number && (
              <div className="flex justify-between">
                <span className="text-gray-600">Bill Number:</span>
                <span className="font-semibold">{receipt.bill_number}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Total Amount:</span>
              <span className="font-semibold text-green-700">${receipt.total_amount?.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Items Received */}
      <table className="w-full mb-8">
        <thead className="bg-green-50">
          <tr className="border-b-2 border-gray-800">
            <th className="text-left p-2">#</th>
            <th className="text-left p-2">Product</th>
            <th className="text-left p-2">SKU</th>
            <th className="text-right p-2">Qty Received</th>
            <th className="text-right p-2">Unit Cost</th>
            <th className="text-right p-2">Total Value</th>
          </tr>
        </thead>
        <tbody>
          {receipt.line_items?.map((item, index) => (
            <tr key={index} className="border-b border-gray-300">
              <td className="p-2">{index + 1}</td>
              <td className="p-2">{item.product_name}</td>
              <td className="p-2">{item.sku}</td>
              <td className="text-right p-2 font-semibold">{item.quantity_received}</td>
              <td className="text-right p-2">${item.unit_cost.toFixed(2)}</td>
              <td className="text-right p-2 font-semibold">${item.line_total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Total */}
      <div className="flex justify-end mb-8">
        <div className="w-64">
          <div className="flex justify-between py-2 border-b border-gray-300">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-semibold">${receipt.subtotal?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-300">
            <span className="text-gray-600">Tax:</span>
            <span className="font-semibold">${receipt.tax_total?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-3 border-t-2 border-gray-800 bg-green-50 px-2">
            <span className="text-xl font-bold">TOTAL VALUE:</span>
            <span className="text-xl font-bold text-green-700">${receipt.total_amount?.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {receipt.notes && (
        <div className="mb-8">
          <h4 className="font-bold text-gray-700 mb-2">Notes:</h4>
          <p className="text-sm text-gray-600">{receipt.notes}</p>
        </div>
      )}

      {/* Condition Check */}
      <div className="mb-8 p-4 border-2 border-gray-300 rounded">
        <h4 className="font-bold text-gray-700 mb-3">Goods Condition Check:</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <input type="checkbox" className="w-4 h-4" />
            <span className="text-sm">All items received in good condition</span>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" className="w-4 h-4" />
            <span className="text-sm">Packaging intact</span>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" className="w-4 h-4" />
            <span className="text-sm">Quantities verified</span>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" className="w-4 h-4" />
            <span className="text-sm">No damages observed</span>
          </div>
        </div>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-3 gap-8 mt-16">
        <div className="text-center">
          <div className="border-t-2 border-gray-800 pt-2">
            <p className="text-sm font-semibold">Received By</p>
          </div>
        </div>
        <div className="text-center">
          <div className="border-t-2 border-gray-800 pt-2">
            <p className="text-sm font-semibold">Verified By</p>
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
        <p>This is a computer-generated goods receipt note</p>
        <p className="mt-1">Goods received are subject to quality inspection</p>
      </div>
    </div>
  );
}
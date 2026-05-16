import React from "react";
import { useCompany } from "../auth/CompanyContext";
import { format } from "date-fns";

export default function InvoiceTemplate({ invoice, customer }) {
  const { currentCompany } = useCompany();

  return (
    <div className="bg-white p-8 max-w-4xl mx-auto print:p-0">
      <style>{`
        @media print {
          body { margin: 0; }
          @page { margin: 1cm; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>

      {/* Header */}
      <div className="border-b-2 border-gray-800 pb-6 mb-8">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-4">
            {currentCompany?.logo_url ? (
              <img 
                src={currentCompany.logo_url} 
                alt={currentCompany.company_name}
                className="w-24 h-24 object-contain"
              />
            ) : (
              <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white text-4xl font-bold">
                {currentCompany?.company_name?.charAt(0) || 'E'}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{currentCompany?.company_name}</h1>
              {currentCompany?.address && (
                <div className="text-sm text-gray-600 mt-2 space-y-0.5">
                  {currentCompany.address.street && <p>{currentCompany.address.street}</p>}
                  <p>
                    {[currentCompany.address.city, currentCompany.address.state, currentCompany.address.postal_code]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                </div>
              )}
              {currentCompany?.contact_phone && <p className="text-sm text-gray-600 mt-1">{currentCompany.contact_phone}</p>}
              {currentCompany?.tax_number && <p className="text-sm text-gray-600">Tax ID: {currentCompany.tax_number}</p>}
            </div>
          </div>
          
          <div className="text-right">
            <h2 className="text-4xl font-bold text-blue-600">INVOICE</h2>
            <p className="text-lg font-semibold mt-2">#{invoice.invoice_number}</p>
          </div>
        </div>
      </div>

      {/* Invoice Details */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="font-semibold text-gray-900 mb-3 text-lg">BILL TO:</h3>
          <div className="text-gray-700">
            <p className="font-semibold text-lg">{invoice.customer_name}</p>
            {invoice.billing_address && (
              <div className="mt-2 text-sm space-y-0.5">
                {invoice.billing_address.street && <p>{invoice.billing_address.street}</p>}
                {(invoice.billing_address.city || invoice.billing_address.state) && (
                  <p>
                    {[invoice.billing_address.city, invoice.billing_address.state, invoice.billing_address.postal_code]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="text-right">
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <span className="font-semibold text-gray-700">Invoice Date:</span>
              <span className="text-gray-900">{format(new Date(invoice.invoice_date), 'MMM dd, yyyy')}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <span className="font-semibold text-gray-700">Due Date:</span>
              <span className="text-gray-900">{format(new Date(invoice.due_date), 'MMM dd, yyyy')}</span>
            </div>
            {invoice.balance_due > 0 && (
              <div className="grid grid-cols-2 gap-4 text-sm mt-4 pt-4 border-t">
                <span className="font-bold text-gray-900">Amount Due:</span>
                <span className="font-bold text-red-600 text-lg">
                  ${invoice.balance_due?.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Line Items */}
      <table className="w-full mb-8">
        <thead>
          <tr className="border-b-2 border-gray-800">
            <th className="text-left py-3 px-2 font-semibold text-gray-900">ITEM</th>
            <th className="text-center py-3 px-2 font-semibold text-gray-900">QTY</th>
            <th className="text-right py-3 px-2 font-semibold text-gray-900">UNIT PRICE</th>
            <th className="text-right py-3 px-2 font-semibold text-gray-900">TAX</th>
            <th className="text-right py-3 px-2 font-semibold text-gray-900">AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          {invoice.line_items?.map((item, index) => (
            <tr key={index} className="border-b border-gray-200">
              <td className="py-4 px-2">
                <p className="font-medium text-gray-900">{item.description}</p>
              </td>
              <td className="py-4 px-2 text-center text-gray-700">{item.quantity}</td>
              <td className="py-4 px-2 text-right text-gray-700">${item.unit_price?.toFixed(2)}</td>
              <td className="py-4 px-2 text-right text-gray-700">${item.tax_amount?.toFixed(2) || '0.00'}</td>
              <td className="py-4 px-2 text-right font-semibold text-gray-900">${item.line_total?.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-80 space-y-3">
          <div className="flex justify-between text-gray-700">
            <span>Subtotal:</span>
            <span className="font-semibold">${invoice.subtotal?.toFixed(2)}</span>
          </div>
          {invoice.discount_amount > 0 && (
            <div className="flex justify-between text-orange-600">
              <span>Discount:</span>
              <span className="font-semibold">-${invoice.discount_amount?.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-gray-700">
            <span>Tax:</span>
            <span className="font-semibold">${invoice.tax_total?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xl font-bold text-gray-900 pt-3 border-t-2 border-gray-800">
            <span>TOTAL:</span>
            <span>${invoice.total_amount?.toFixed(2)}</span>
          </div>
          {invoice.amount_paid > 0 && (
            <>
              <div className="flex justify-between text-green-600">
                <span>Amount Paid:</span>
                <span className="font-semibold">-${invoice.amount_paid?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-red-600 pt-2 border-t">
                <span>BALANCE DUE:</span>
                <span>${invoice.balance_due?.toFixed(2)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div className="border-t pt-6 mb-6">
          <h4 className="font-semibold text-gray-900 mb-2">Notes:</h4>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
        </div>
      )}

      {/* Terms */}
      {invoice.terms_and_conditions && (
        <div className="border-t pt-6 mb-6">
          <h4 className="font-semibold text-gray-900 mb-2">Terms & Conditions:</h4>
          <p className="text-xs text-gray-600 whitespace-pre-wrap">{invoice.terms_and_conditions}</p>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-gray-500 mt-12 pt-6 border-t">
        <p>Thank you for your business!</p>
        {currentCompany?.website && (
          <p className="mt-1">{currentCompany.website}</p>
        )}
      </div>
    </div>
  );
}
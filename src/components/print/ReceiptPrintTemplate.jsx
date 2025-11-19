import React from "react";
import { format } from "date-fns";

export default function ReceiptPrintTemplate({ sale, company, store }) {
  const safeToFixed = (value, decimals = 2) => {
    const num = parseFloat(value);
    return isNaN(num) ? '0.00' : num.toFixed(decimals);
  };

  return (
    <div className="hidden print:block">
      <style>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 5mm;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
            margin: 0;
            padding: 0;
            font-size: 10px;
          }
          * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          /* Hide ALL screen elements */
          header, nav, .sidebar, [role="banner"], [role="navigation"] {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-white text-center" style={{fontSize: '10px', width: '100%'}}>
        {/* Header */}
        <div className="mb-2">
          {company?.logo_url && (
            <img src={company.logo_url} alt="" className="h-8 mx-auto mb-1" />
          )}
          <h1 className="text-base font-bold mb-0">{company?.company_name}</h1>
          <p className="text-xs mb-0">{store?.address?.street}</p>
          <p className="text-xs mb-0">{store?.address?.city}, {store?.address?.state}</p>
          <p className="text-xs mb-0">Tel: {store?.phone || company?.contact_phone}</p>
        </div>

        <div className="border-t border-dashed border-black my-2"></div>

        {/* Receipt Info */}
        <div className="text-xs mb-2">
          <p className="mb-0"><strong>Receipt:</strong> {sale.sale_number}</p>
          <p className="mb-0"><strong>Date:</strong> {format(new Date(sale.sale_date), 'dd/MM/yyyy HH:mm')}</p>
          <p className="mb-0"><strong>Cashier:</strong> {sale.cashier_name}</p>
        </div>

        <div className="border-t border-dashed border-black my-2"></div>

        {/* Items */}
        <table className="w-full text-xs" style={{fontSize: '9px'}}>
          <thead>
            <tr className="border-b border-black">
              <th className="text-left py-1">Item</th>
              <th className="text-center py-1">Qty</th>
              <th className="text-right py-1">Price</th>
              <th className="text-right py-1">Total</th>
            </tr>
          </thead>
          <tbody>
            {sale.line_items?.map((item, index) => (
              <tr key={index} className="border-b border-dotted">
                <td className="text-left py-1">{item.product_name}</td>
                <td className="text-center py-1">{item.quantity}</td>
                <td className="text-right py-1">{safeToFixed(item.unit_price)}</td>
                <td className="text-right py-1">{safeToFixed(item.line_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t border-black my-2"></div>

        {/* Totals */}
        <div className="text-xs">
          <div className="flex justify-between mb-1">
            <span>Subtotal:</span>
            <span>{safeToFixed(sale.subtotal)}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Tax:</span>
            <span>{safeToFixed(sale.tax_total)}</span>
          </div>
          <div className="flex justify-between font-bold text-sm border-t border-black pt-1">
            <span>TOTAL:</span>
            <span>{safeToFixed(sale.total_amount)}</span>
          </div>
        </div>

        <div className="border-t border-dashed border-black my-2"></div>

        {/* Payment */}
        <div className="text-xs mb-2">
          {sale.payments?.map((payment, idx) => (
            <div key={idx} className="flex justify-between">
              <span>{payment.payment_method}:</span>
              <span>{safeToFixed(payment.amount)}</span>
            </div>
          ))}
          {sale.change_given > 0 && (
            <div className="flex justify-between font-bold">
              <span>Change:</span>
              <span>{safeToFixed(sale.change_given)}</span>
            </div>
          )}
        </div>

        <div className="border-t border-dashed border-black my-2"></div>

        <p className="text-xs text-center mt-2">Thank you for your purchase!</p>
        <p className="text-xs text-center">Please visit us again</p>
      </div>
    </div>
  );
}
import React from "react";
import { format } from "date-fns";

export default function InvoicePrintTemplate({ invoice, company }) {
  const safeToFixed = (value, decimals = 2) => {
    const num = parseFloat(value);
    return isNaN(num) ? '0.00' : num.toFixed(decimals);
  };

  return (
    <>
      <style>{`
        @media print {
          .invoice-print-template {
            display: block !important;
          }
          
          body > *:not(.invoice-print-template),
          .print\\:hidden,
          header, nav, aside, .sidebar,
          [role="banner"], [role="navigation"],
          button, .no-print {
            display: none !important;
          }
          
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          
          body {
            margin: 0;
            padding: 0;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
        
        .invoice-print-template {
          display: none;
        }
      `}</style>

      <div className="invoice-print-template" style={{fontSize: '11px'}}>
        {/* Simple Header */}
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px'}}>
          <div>
            <h1 style={{fontSize: '18px', fontWeight: 'bold', margin: 0}}>{company?.company_name}</h1>
            <p style={{fontSize: '10px', margin: 0}}>{company?.address?.street}</p>
            <p style={{fontSize: '10px', margin: 0}}>{company?.address?.city}, {company?.address?.state} {company?.address?.postal_code}</p>
            <p style={{fontSize: '10px', margin: 0}}>Phone: {company?.contact_phone}</p>
          </div>
          
          <div style={{textAlign: 'right'}}>
            <h2 style={{fontSize: '24px', fontWeight: 'bold', margin: 0}}>INVOICE</h2>
            <div style={{fontSize: '10px', marginTop: '4px'}}>
              <p style={{margin: 0}}><strong>Invoice #:</strong> {invoice.invoice_number}</p>
              <p style={{margin: 0}}><strong>Date:</strong> {format(new Date(invoice.invoice_date), 'MMM d, yyyy')}</p>
              <p style={{margin: 0}}><strong>Due:</strong> {format(new Date(invoice.due_date), 'MMM d, yyyy')}</p>
            </div>
          </div>
        </div>

        {/* Bill To / Ship To */}
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px'}}>
          <div style={{border: '1px solid black', padding: '8px', fontSize: '10px'}}>
            <p style={{fontWeight: 'bold', margin: 0}}>Bill To:</p>
            <p style={{fontWeight: 'bold', margin: 0}}>{invoice.customer_name}</p>
          </div>
          <div style={{border: '1px solid black', padding: '8px', fontSize: '10px'}}>
            <p style={{fontWeight: 'bold', margin: 0}}>Ship To:</p>
            <p style={{fontWeight: 'bold', margin: 0}}>{invoice.customer_name}</p>
          </div>
        </div>

        {/* Line Items */}
        <table style={{width: '100%', borderCollapse: 'collapse', border: '1px solid black', marginBottom: '12px', fontSize: '10px'}}>
          <thead>
            <tr style={{backgroundColor: '#f3f4f6'}}>
              <th style={{border: '1px solid black', padding: '4px', textAlign: 'center', fontWeight: 'bold', width: '30px'}}>Qty</th>
              <th style={{border: '1px solid black', padding: '4px', textAlign: 'left', fontWeight: 'bold'}}>Description</th>
              <th style={{border: '1px solid black', padding: '4px', textAlign: 'right', fontWeight: 'bold', width: '60px'}}>Unit Price</th>
              <th style={{border: '1px solid black', padding: '4px', textAlign: 'right', fontWeight: 'bold', width: '70px'}}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.line_items?.slice(0, 10).map((item, index) => (
              <tr key={index}>
                <td style={{border: '1px solid black', padding: '4px', textAlign: 'center'}}>{safeToFixed(item.quantity, 0)}</td>
                <td style={{border: '1px solid black', padding: '4px'}}>{item.description}</td>
                <td style={{border: '1px solid black', padding: '4px', textAlign: 'right'}}>{safeToFixed(item.unit_price)}</td>
                <td style={{border: '1px solid black', padding: '4px', textAlign: 'right', fontWeight: 'bold'}}>{safeToFixed(item.quantity * item.unit_price)}</td>
              </tr>
            ))}
            {Array.from({ length: Math.max(0, 10 - (invoice.line_items?.length || 0)) }).map((_, i) => (
              <tr key={`empty-${i}`}>
                <td style={{border: '1px solid black', padding: '4px'}}>&nbsp;</td>
                <td style={{border: '1px solid black', padding: '4px'}}>&nbsp;</td>
                <td style={{border: '1px solid black', padding: '4px'}}>&nbsp;</td>
                <td style={{border: '1px solid black', padding: '4px'}}>&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: '16px'}}>
          <div style={{width: '180px', fontSize: '10px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #d1d5db'}}>
              <span style={{fontWeight: 'bold'}}>Subtotal:</span>
              <span>{safeToFixed(invoice.subtotal)}</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #d1d5db'}}>
              <span style={{fontWeight: 'bold'}}>Tax:</span>
              <span>{safeToFixed(invoice.tax_total)}</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', padding: '4px 8px', backgroundColor: 'black', color: 'white', fontWeight: 'bold'}}>
              <span>TOTAL:</span>
              <span>{safeToFixed(invoice.total_amount)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '24px', fontSize: '10px'}}>
          <div>
            <p style={{fontWeight: 'bold', marginBottom: '24px'}}>Authorized Signature:</p>
            <div style={{borderTop: '1px solid black', width: '128px'}}></div>
          </div>
          <div style={{textAlign: 'right'}}>
            <p>Thank you for your business!</p>
          </div>
        </div>
      </div>
    </>
  );
}
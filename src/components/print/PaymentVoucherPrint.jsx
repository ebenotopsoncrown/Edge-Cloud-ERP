import React from "react";
import { format } from "date-fns";

export default function PaymentVoucherPrint({ payment, company, bill, vendor }) {
  const safeToFixed = (value, decimals = 2) => {
    const num = parseFloat(value);
    return isNaN(num) ? '0.00' : num.toFixed(decimals);
  };

  return (
    <>
      <style>{`
        @media print {
          .payment-print-template {
            display: block !important;
          }
          
          body > *:not(.payment-print-template),
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
        
        .payment-print-template {
          display: none;
        }
      `}</style>

      <div className="payment-print-template" style={{fontSize: '11px'}}>
        {/* Header */}
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px'}}>
          <div>
            <h1 style={{fontSize: '18px', fontWeight: 'bold', margin: 0}}>{company?.company_name}</h1>
            <p style={{fontSize: '10px', margin: 0}}>{company?.address?.street}</p>
            <p style={{fontSize: '10px', margin: 0}}>{company?.address?.city}, {company?.address?.state}</p>
            <p style={{fontSize: '10px', margin: 0}}>Phone: {company?.contact_phone}</p>
          </div>

          <div style={{textAlign: 'right'}}>
            <h2 style={{fontSize: '24px', fontWeight: 'bold', lineHeight: '1.2', margin: 0}}>PAYMENT VOUCHER</h2>
            <div style={{fontSize: '10px', marginTop: '4px'}}>
              <p style={{margin: 0}}><strong>Voucher No:</strong> {payment.payment_number}</p>
              <p style={{margin: 0}}><strong>Date:</strong> {format(new Date(payment.payment_date), 'MMM d, yyyy')}</p>
            </div>
          </div>
        </div>

        {/* Pay To */}
        <div style={{border: '2px solid black', padding: '8px', marginBottom: '12px', fontSize: '10px'}}>
          <p style={{fontWeight: 'bold', margin: 0}}>Pay To:</p>
          <p style={{fontWeight: 'bold', fontSize: '14px', margin: 0}}>{payment.contact_name || vendor?.company_name}</p>
        </div>

        {/* Payment Details */}
        <table style={{width: '100%', borderCollapse: 'collapse', border: '2px solid black', marginBottom: '12px', fontSize: '10px'}}>
          <thead>
            <tr style={{backgroundColor: '#f3f4f6'}}>
              <th style={{border: '1px solid black', padding: '4px', textAlign: 'left', fontWeight: 'bold'}}>Description</th>
              <th style={{border: '1px solid black', padding: '4px', textAlign: 'center', fontWeight: 'bold', width: '100px'}}>Reference</th>
              <th style={{border: '1px solid black', padding: '4px', textAlign: 'right', fontWeight: 'bold', width: '100px'}}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {payment.payment_lines && payment.payment_lines.length > 0 ? (
              payment.payment_lines.map((line, idx) => (
                <tr key={idx}>
                  <td style={{border: '1px solid black', padding: '4px'}}>
                    Payment for Bill {line.bill_number}
                    {payment.notes && <div style={{color: '#666'}}>{payment.notes}</div>}
                  </td>
                  <td style={{border: '1px solid black', padding: '4px', textAlign: 'center'}}>{payment.reference || '-'}</td>
                  <td style={{border: '1px solid black', padding: '4px', textAlign: 'right', fontWeight: 'bold'}}>
                    {payment.currency} {safeToFixed(line.amount_to_pay)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td style={{border: '1px solid black', padding: '4px'}}>
                  Payment
                  {payment.notes && <div style={{color: '#666'}}>{payment.notes}</div>}
                </td>
                <td style={{border: '1px solid black', padding: '4px', textAlign: 'center'}}>{payment.reference || '-'}</td>
                <td style={{border: '1px solid black', padding: '4px', textAlign: 'right', fontWeight: 'bold'}}>
                  {payment.currency} {safeToFixed(payment.amount)}
                </td>
              </tr>
            )}
            
            {Array.from({ length: 8 }).map((_, i) => (
              <tr key={`empty-${i}`}>
                <td style={{border: '1px solid black', padding: '4px'}}>&nbsp;</td>
                <td style={{border: '1px solid black', padding: '4px'}}>&nbsp;</td>
                <td style={{border: '1px solid black', padding: '4px'}}>&nbsp;</td>
              </tr>
            ))}
            
            <tr style={{backgroundColor: 'black', color: 'white', fontWeight: 'bold'}}>
              <td colSpan="2" style={{border: '1px solid black', padding: '4px', textAlign: 'right'}}>TOTAL</td>
              <td style={{border: '1px solid black', padding: '4px', textAlign: 'right'}}>
                {payment.currency} {safeToFixed(payment.amount)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Signature */}
        <div style={{marginTop: '24px', fontSize: '10px'}}>
          <p style={{fontWeight: 'bold', marginBottom: '24px'}}>Authorized Signature:</p>
          <div style={{borderTop: '1px solid black', width: '128px'}}></div>
        </div>
      </div>
    </>
  );
}
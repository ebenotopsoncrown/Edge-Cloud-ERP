import React from "react";
import { format } from "date-fns";

export default function PurchaseOrderPrintTemplate({ purchaseOrder, company }) {
  const safeToFixed = (value, decimals = 2) => {
    const num = parseFloat(value);
    return isNaN(num) ? '0.00' : num.toFixed(decimals);
  };

  return (
    <>
      <style>{`
        @media print {
          /* Force this template to show */
          .print-template {
            display: block !important;
          }
          
          /* Hide EVERYTHING else */
          body > *:not(.print-template),
          .print\\:hidden,
          header,
          nav,
          aside,
          .sidebar,
          [role="banner"],
          [role="navigation"],
          [class*="SidebarProvider"],
          [class*="sidebar"],
          button,
          .no-print {
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
        
        /* Hide by default on screen */
        .print-template {
          display: none;
        }
      `}</style>

      <div className="print-template" style={{fontSize: '11px'}}>
        {/* Minimal Header */}
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px'}}>
          <div style={{display: 'flex', alignItems: 'flex-start', gap: '8px'}}>
            {company?.logo_url && (
              <img src={company.logo_url} alt="" style={{height: '32px'}} />
            )}
            <div style={{fontSize: '10px'}}>
              <p style={{fontSize: '10px', textTransform: 'uppercase', color: '#666', margin: 0}}>Ordered By:</p>
              <p style={{fontWeight: 'bold', margin: 0}}>{company?.company_name}</p>
              <p style={{margin: 0}}>{company?.contact_phone}</p>
            </div>
          </div>

          <div style={{textAlign: 'right'}}>
            <h1 style={{fontSize: '24px', fontWeight: 'bold', lineHeight: '1.2', margin: 0}}>PURCHASE ORDER</h1>
            <div style={{fontSize: '10px', marginTop: '4px'}}>
              <p style={{margin: 0}}><strong>PO No:</strong> {purchaseOrder.po_number}</p>
              <p style={{margin: 0}}><strong>Date:</strong> {format(new Date(purchaseOrder.po_date), 'MMM d, yyyy')}</p>
            </div>
          </div>
        </div>

        {/* Ship To - Compact */}
        <div style={{border: '2px solid black', padding: '8px', marginBottom: '12px', fontSize: '10px'}}>
          <p style={{fontWeight: 'bold', margin: 0}}>Ship To:</p>
          <p style={{fontWeight: 'bold', fontSize: '14px', margin: 0}}>{purchaseOrder.vendor?.company_name}</p>
        </div>

        {/* Quote Item - Compact */}
        <table style={{width: '100%', borderCollapse: 'collapse', border: '2px solid black', marginBottom: '8px', fontSize: '10px'}}>
          <thead>
            <tr style={{backgroundColor: '#f3f4f6'}}>
              <th style={{border: '1px solid black', padding: '4px', textAlign: 'left', fontWeight: 'bold'}}>Quote Item</th>
              <th style={{border: '1px solid black', padding: '4px', textAlign: 'center', fontWeight: 'bold', width: '64px'}}>Make Val</th>
              <th style={{border: '1px solid black', padding: '4px', textAlign: 'left', fontWeight: 'bold', width: '80px'}}>Acct No.</th>
              <th style={{border: '1px solid black', padding: '4px', textAlign: 'center', fontWeight: 'bold', width: '64px'}}>Format</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{border: '1px solid black', padding: '4px'}}>{purchaseOrder.line_items?.[0]?.description || '-'}</td>
              <td style={{border: '1px solid black', padding: '4px', textAlign: 'center'}}>-</td>
              <td style={{border: '1px solid black', padding: '4px'}}>EXP-5000</td>
              <td style={{border: '1px solid black', padding: '4px', textAlign: 'center'}}>-</td>
            </tr>
          </tbody>
        </table>

        {/* Items - Ultra Compact */}
        <table style={{width: '100%', borderCollapse: 'collapse', border: '2px solid black', fontSize: '10px'}}>
          <thead>
            <tr style={{backgroundColor: '#f3f4f6'}}>
              <th style={{border: '1px solid black', padding: '4px', textAlign: 'center', fontWeight: 'bold', width: '40px'}}>Qty</th>
              <th style={{border: '1px solid black', padding: '4px', textAlign: 'left', fontWeight: 'bold', width: '50px'}}>Make</th>
              <th style={{border: '1px solid black', padding: '4px', textAlign: 'left', fontWeight: 'bold'}}>Description</th>
              <th style={{border: '1px solid black', padding: '4px', textAlign: 'right', fontWeight: 'bold', width: '60px'}}>Unit Cost</th>
              <th style={{border: '1px solid black', padding: '4px', textAlign: 'right', fontWeight: 'bold', width: '70px'}}>Extended</th>
            </tr>
          </thead>
          <tbody>
            {purchaseOrder.line_items?.slice(0, 12).map((item, index) => (
              <tr key={index}>
                <td style={{border: '1px solid black', padding: '4px', textAlign: 'center'}}>{safeToFixed(item.quantity_ordered, 0)}</td>
                <td style={{border: '1px solid black', padding: '4px'}}>Item</td>
                <td style={{border: '1px solid black', padding: '4px'}}>{item.description}</td>
                <td style={{border: '1px solid black', padding: '4px', textAlign: 'right'}}>{safeToFixed(item.unit_cost)}</td>
                <td style={{border: '1px solid black', padding: '4px', textAlign: 'right', fontWeight: 'bold'}}>{safeToFixed(item.line_total)}</td>
              </tr>
            ))}
            
            {Array.from({ length: Math.max(0, 12 - (purchaseOrder.line_items?.length || 0)) }).map((_, i) => (
              <tr key={`empty-${i}`}>
                <td style={{border: '1px solid black', padding: '4px'}}>&nbsp;</td>
                <td style={{border: '1px solid black', padding: '4px'}}>&nbsp;</td>
                <td style={{border: '1px solid black', padding: '4px'}}>&nbsp;</td>
                <td style={{border: '1px solid black', padding: '4px'}}>&nbsp;</td>
                <td style={{border: '1px solid black', padding: '4px'}}>&nbsp;</td>
              </tr>
            ))}

            {/* Total */}
            <tr style={{backgroundColor: 'black', color: 'white', fontWeight: 'bold'}}>
              <td colSpan="4" style={{border: '1px solid black', padding: '4px', textAlign: 'right'}}>TOTAL</td>
              <td style={{border: '1px solid black', padding: '4px', textAlign: 'right'}}>
                ${safeToFixed(purchaseOrder.total_amount || 0)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Signature - Compact */}
        <div style={{marginTop: '16px', fontSize: '10px'}}>
          <p style={{fontWeight: 'bold', marginBottom: '24px'}}>Authorized Signature:</p>
          <div style={{borderTop: '1px solid black', width: '128px'}}></div>
        </div>
      </div>
    </>
  );
}
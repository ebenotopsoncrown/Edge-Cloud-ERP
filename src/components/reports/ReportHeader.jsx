import React from "react";
import { useCompany } from "../auth/CompanyContext";

export default function ReportHeader({ reportTitle, reportDate, additionalInfo }) {
  const { currentCompany } = useCompany();

  return (
    <div className="border-b-2 border-gray-800 pb-4 mb-6 print:mb-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 print:text-2xl">
            {currentCompany?.company_name || 'Edge Cloud Enterprise'}
          </h1>
        </div>
        
        <div className="text-right">
          <h2 className="text-xl font-semibold text-gray-700 print:text-lg">{reportTitle}</h2>
          {reportDate && (
            <p className="text-sm text-gray-600 mt-1">Report Date: {reportDate}</p>
          )}
          {additionalInfo && (
            <p className="text-xs text-gray-500 mt-1">{additionalInfo}</p>
          )}
        </div>
      </div>
    </div>
  );
}
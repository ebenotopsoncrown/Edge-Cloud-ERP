import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";

/**
 * Drillable KPI Card Component
 * 
 * A reusable component for displaying KPI metrics that can be clicked
 * to drill down to the underlying ledger accounts.
 */
export default function DrillableKPI({
  title,
  value,
  subtitle,
  icon: Icon,
  colorClass = "from-blue-50 to-blue-100",
  textColorClass = "text-blue-900",
  iconColorClass = "text-blue-600",
  onClick,
  loading = false
}) {
  return (
    <Card 
      className={`bg-gradient-to-br ${colorClass} ${onClick ? 'cursor-pointer hover:shadow-lg' : ''} transition-shadow border-none`}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className={`text-sm font-medium ${textColorClass}`}>
          {title}
        </CardTitle>
        <div className={`w-10 h-10 bg-white/50 rounded-xl flex items-center justify-center`}>
          {Icon && <Icon className={`w-5 h-5 ${iconColorClass}`} />}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="animate-pulse">
            <div className="h-8 bg-white/30 rounded w-32 mb-2"></div>
            <div className="h-4 bg-white/20 rounded w-24"></div>
          </div>
        ) : (
          <>
            <div className={`text-3xl font-bold ${textColorClass} flex items-center gap-2`}>
              {value}
              {onClick && <ChevronRight className="w-5 h-5 opacity-50" />}
            </div>
            {subtitle && (
              <p className={`text-xs mt-2 opacity-80 ${textColorClass}`}>
                {subtitle}
              </p>
            )}
            {onClick && (
              <p className={`text-xs mt-1 opacity-60 ${textColorClass}`}>
                Click to view ledger
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
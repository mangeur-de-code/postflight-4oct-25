
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Calendar, CheckCircle } from "lucide-react";
import { format, differenceInDays } from "date-fns";

export default function CustomFieldStatus({ user }) {
  const getFieldWarnings = () => {
    const warnings = [];
    const current = [];

    // Medical expiry
    if (user?.medical_expiry) {
      const daysUntilExpiry = differenceInDays(new Date(user.medical_expiry), new Date());
      if (daysUntilExpiry <= 30) {
        warnings.push({
          name: "Medical Certificate",
          daysLeft: daysUntilExpiry,
          date: user.medical_expiry,
          isExpired: daysUntilExpiry < 0
        });
      } else {
        current.push({
          name: "Medical Certificate",
          date: user.medical_expiry
        });
      }
    }

    // Custom tracking fields
    if (user?.custom_tracking_fields && user.custom_tracking_fields.length > 0) {
      user.custom_tracking_fields.forEach((field) => {
        if (field.is_expiry_field && field.value) {
          const daysUntilExpiry = differenceInDays(new Date(field.value), new Date());
          if (daysUntilExpiry <= (field.warning_days || 30)) {
            warnings.push({
              name: field.name,
              daysLeft: daysUntilExpiry,
              date: field.value,
              isExpired: daysUntilExpiry < 0
            });
          } else {
            current.push({
              name: field.name,
              date: field.value
            });
          }
        } else if (!field.is_expiry_field && field.value) {
          // Show non-expiry fields as informational
          current.push({
            name: field.name,
            value: field.value,
            type: field.type
          });
        }
      });
    }

    return { warnings, current };
  };

  const { warnings, current } = getFieldWarnings();

  // Only show if there are warnings, current items, or if user has custom fields configured
  const hasCustomFields = user?.custom_tracking_fields && user.custom_tracking_fields.length > 0;
  const hasMedical = user?.medical_expiry;

  if (!hasCustomFields && !hasMedical) {
    return null;
  }

  return (
    <Card className="bg-white shadow-lg border-0">
      <CardHeader>
        <CardTitle className="tracking-tight text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Custom Tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {warnings.map((warning, index) => {
          const isExpired = warning.isExpired;
          const badgeClass = isExpired ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800";
          const containerClass = isExpired ? "bg-red-50 border-red-200" : "bg-yellow-50 border-yellow-200";
          const iconColor = isExpired ? "text-red-600" : "text-yellow-600";
          const textColor = isExpired ? "text-red-900" : "text-yellow-900";
          const subTextColor = isExpired ? "text-red-700" : "text-yellow-700";
          const badgeText = isExpired ? "Expired" : `${warning.daysLeft}d left`;

          return (
            <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${containerClass}`}>
              <div className="flex items-center gap-3">
                <AlertTriangle className={`w-4 h-4 ${iconColor}`} />
                <div>
                  <p className={`font-medium text-sm ${textColor}`}>{warning.name}</p>
                  <p className={`text-xs ${subTextColor}`}>
                    {format(new Date(warning.date), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
              <Badge className={`text-xs ${badgeClass}`}>
                {badgeText}
              </Badge>
            </div>
          );
        })}
        
        {current.map((item, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <div>
                <p className="font-medium text-green-900 text-sm">{item.name}</p>
                <p className="text-xs text-green-700">
                  {item.date ? 
                    `Valid until ${format(new Date(item.date), "MMM d, yyyy")}` :
                    `${item.value} ${item.type === 'hours' ? 'hours' : ''}`
                  }
                </p>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-800 text-xs">Current</Badge>
          </div>
        ))}
        
        {/* Show message if user has custom fields but none have values */}
        {hasCustomFields && warnings.length === 0 && current.length === 0 && !hasMedical && (
          <div className="text-center py-4 text-slate-500">
            <p className="text-sm">Custom fields configured but no data entered yet.</p>
            <p className="text-xs mt-1">Update your profile to track certifications and dates.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Clock, Calendar } from "lucide-react";
import { format, subDays, isAfter, differenceInDays, startOfDay } from "date-fns";

const getProgressClass = (percentage) => {
  if (percentage >= 100) return '[&>div]:bg-green-600';
  if (percentage > 50) return '[&>div]:bg-yellow-500';
  return '[&>div]:bg-red-600';
};

export default function CurrencyTracker({ user, flights }) {
  const [currencyStatus, setCurrencyStatus] = useState({ ng: 0, ns: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && flights) {
      calculateCurrency();
    }
  }, [user, flights]);

  const calculateCurrency = () => {
    try {
      const settings = user.currency_settings || { ng_required_hours: 6, ns_required_hours: 6, currency_period_days: 60 };
      const lookbackDate = startOfDay(subDays(new Date(), settings.currency_period_days));
      const recentFlights = flights.filter(flight => {
        const flightDate = startOfDay(new Date(flight.date));
        return isAfter(flightDate, lookbackDate) || flightDate.getTime() === lookbackDate.getTime();
      });
      
      let ngHours = 0;
      let nsHours = 0;

      recentFlights.forEach(flight => {
        flight.hour_breakdown?.forEach(breakdown => {
          if (breakdown.mode === 'NG') ngHours += breakdown.duration;
          if (breakdown.mode === 'NS') nsHours += breakdown.duration;
        });
      });
      
      setCurrencyStatus({ ng: ngHours, ns: nsHours });
    } catch (error) {
      console.error("Error calculating currency status:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-white shadow-lg border-0">
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    );
  }

  const settings = user.currency_settings || { ng_required_hours: 6, ns_required_hours: 6, currency_period_days: 60 };
  const ngStatus = currencyStatus.ng >= settings.ng_required_hours ? "current" : "expired";
  const nsStatus = currencyStatus.ns >= settings.ns_required_hours ? "current" : "expired";

  const ngPercentage = settings.ng_required_hours > 0 ? Math.min((currencyStatus.ng / settings.ng_required_hours) * 100, 100) : 0;
  const nsPercentage = settings.ns_required_hours > 0 ? Math.min((currencyStatus.ns / settings.ns_required_hours) * 100, 100) : 0;

  const getStatusColor = (status) => status === "current" ? "text-green-600" : "text-red-600";
  const getStatusIcon = (status) => status === "current" ? CheckCircle : AlertTriangle;
  const getStatusBadge = (status) => 
    status === "current" 
      ? <Badge className="bg-green-100 text-green-800">Current</Badge>
      : <Badge className="bg-red-100 text-red-800">Expired</Badge>;

  const getExpiryWarnings = () => {
    const warnings = [];
    
    // Medical expiry warning
    if (user.medical_expiry) {
      const daysUntilExpiry = differenceInDays(new Date(user.medical_expiry), new Date());
      if (daysUntilExpiry <= 30 && daysUntilExpiry >= 0) {
        warnings.push({
          type: "Medical Certificate",
          daysLeft: daysUntilExpiry,
          date: user.medical_expiry
        });
      }
    }

    // Custom field expiry warnings
    user.custom_tracking_fields?.forEach(field => {
      if (field.is_expiry_field && field.value) {
        const daysUntilExpiry = differenceInDays(new Date(field.value), new Date());
        if (daysUntilExpiry <= (field.warning_days || 30) && daysUntilExpiry >= 0) {
          warnings.push({
            type: field.name,
            daysLeft: daysUntilExpiry,
            date: field.value
          });
        }
      }
    });

    return warnings;
  };

  const expiryWarnings = getExpiryWarnings();

  return (
    <div className="space-y-6">
      <Card className="bg-white shadow-lg border-0">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Currency Status ({settings.currency_period_days}-Day Window)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${ngStatus === "current" ? "bg-green-100" : "bg-red-100"}`}>
                  {React.createElement(getStatusIcon(ngStatus), { 
                    className: `w-5 h-5 ${getStatusColor(ngStatus)}` 
                  })}
                </div>
                <div>
                  <p className="font-medium text-slate-900">Night Goggle (NG)</p>
                  <p className="text-sm text-slate-600">
                    {currencyStatus.ng.toFixed(1)} / {settings.ng_required_hours} hours required
                  </p>
                </div>
              </div>
              {getStatusBadge(ngStatus)}
            </div>
            <Progress 
              value={ngPercentage} 
              className={`h-2 ${getProgressClass(ngPercentage)}`}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${nsStatus === "current" ? "bg-green-100" : "bg-red-100"}`}>
                  {React.createElement(getStatusIcon(nsStatus), { 
                    className: `w-5 h-5 ${getStatusColor(nsStatus)}` 
                  })}
                </div>
                <div>
                  <p className="font-medium text-slate-900">Night System (NS)</p>
                  <p className="text-sm text-slate-600">
                    {currencyStatus.ns.toFixed(1)} / {settings.ns_required_hours} hours required
                  </p>
                </div>
              </div>
              {getStatusBadge(nsStatus)}
            </div>
            <Progress 
              value={nsPercentage}
              className={`h-2 ${getProgressClass(nsPercentage)}`}
            />
          </div>
        </CardContent>
      </Card>

      {expiryWarnings.length > 0 && (
        <Card className="bg-white shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Upcoming Expirations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {expiryWarnings.map((warning, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="font-medium text-yellow-900">{warning.type}</p>
                      <p className="text-sm text-yellow-700">
                        Expires on {format(new Date(warning.date), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">
                    {warning.daysLeft} days left
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { subDays, isAfter, startOfDay, addDays, format, max, differenceInCalendarDays, endOfDay, isBefore, isEqual, parseISO } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


const getProgressClass = (daysLeft, totalDays) => {
  const percentage = daysLeft / totalDays * 100;
  if (daysLeft === 0) return '[&>div]:bg-red-600'; // Full red when 0 days remain
  if (daysLeft <= 15) return '[&>div]:bg-red-600'; // Red when 15 days or less
  if (percentage < 50) return '[&>div]:bg-yellow-500'; // Yellow when below 50%
  return '[&>div]:bg-green-600'; // Green otherwise
};

export default function CurrencyStatus({ currencyStatus, user, flights = [] }) {
  const settings = user?.currency_settings || { ng_required_hours: 1, ns_required_hours: 1, currency_period_days: 60 };

  // Only show currency sections if requirements are set (greater than 0)
  const showNGStatus = settings.ng_required_hours > 0;
  const showNSStatus = settings.ns_required_hours > 0;

  // If neither currency is configured, don't show the card at all
  if (!showNGStatus && !showNSStatus) {
    return null;
  }

  // Calculate expiration dates and days remaining based on the last flight with relevant hours
  const getCurrencyInfo = (mode) => {
    if (!flights || flights.length === 0) return { expirationDate: null, daysLeft: 0, isExpired: true, lastFlightWasSimulator: false };

    // Find all flights that have hours in the specified mode
    const relevantFlights = flights.filter((flight) =>
      flight.hour_breakdown && flight.hour_breakdown.some((breakdown) =>
        breakdown.mode === mode && breakdown.duration > 0
      )
    );

    if (relevantFlights.length === 0) return { expirationDate: null, daysLeft: 0, isExpired: true, lastFlightWasSimulator: false };

    // Sort to find the most recent flight
    const sortedFlights = relevantFlights.sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
    const mostRecentFlight = sortedFlights[0];
    
    const mostRecentFlightDate = startOfDay(parseISO(mostRecentFlight.date));

    // Add the currency period days and set to end of that day (11:59:59 PM)
    const expirationDate = endOfDay(addDays(mostRecentFlightDate, settings.currency_period_days));

    // Calculate calendar days left until expiration
    const today = startOfDay(new Date());
    const expirationDay = startOfDay(expirationDate);
    const daysLeft = differenceInCalendarDays(expirationDay, today);

    const isExpired = daysLeft < 0;

    return { 
        expirationDate, 
        daysLeft: Math.max(0, daysLeft), 
        isExpired,
        lastFlightWasSimulator: mostRecentFlight.is_simulator || false
    };
  };

  const ngInfo = getCurrencyInfo('NG');
  const nsInfo = getCurrencyInfo('NS');

  // Determine status based on both hours requirement AND currency window
  const ngStatus = currencyStatus.ng >= settings.ng_required_hours && !ngInfo.isExpired ? "current" : "expired";
  const nsStatus = currencyStatus.ns >= settings.ns_required_hours && !nsInfo.isExpired ? "current" : "expired";

  // Calculate progress percentage based on calendar days remaining in currency window
  // When 0 days left, show as 0% to make the bar appear empty but still red
  const ngProgressPercentage = ngInfo.expirationDate ?
  ngInfo.daysLeft === 0 ? 0 : Math.min(ngInfo.daysLeft / settings.currency_period_days * 100, 100) : 0;
  const nsProgressPercentage = nsInfo.expirationDate ?
  nsInfo.daysLeft === 0 ? 0 : Math.min(nsInfo.daysLeft / settings.currency_period_days * 100, 100) : 0;

  const getStatusColor = (status) => {
    return status === "current" ? "text-green-600" : "text-red-600";
  };

  const getStatusIcon = (status) => {
    return status === "current" ? CheckCircle : AlertTriangle;
  };

  const getStatusBadge = (status, daysLeft) => {
    if (status === "expired") {
      return <Badge className="bg-red-100 text-red-800">Expired</Badge>;
    }

    if (daysLeft === 0) {
      return <Badge className="bg-red-100 text-red-800">Expires today</Badge>;
    } else if (daysLeft <= 15) {
      return <Badge className="bg-red-100 text-red-800">{daysLeft}d left</Badge>;
    } else if (daysLeft <= settings.currency_period_days * 0.5) {
      return <Badge className="bg-yellow-100 text-yellow-800">{daysLeft}d left</Badge>;
    } else {
      return <Badge className="bg-green-100 text-green-800">Current</Badge>;
    }
  };

  return (
    <Card className="bg-white shadow-lg border-0">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Currency Status ({settings.currency_period_days}-Day Window)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {showNGStatus &&
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
                  {ngInfo.expirationDate &&
                <p className="text-xs text-slate-500">
                      Expires at midnight: {format(ngInfo.expirationDate, "d MMM yyyy")}
                    </p>
                }
                </div>
              </div>
              {getStatusBadge(ngStatus, ngInfo.daysLeft)}
            </div>
            <Progress
            value={ngInfo.daysLeft === 0 ? 100 : ngProgressPercentage}
            className={`h-2 ${getProgressClass(ngInfo.daysLeft, settings.currency_period_days)}`} />

            <p className="text-xs text-slate-500">
              Currency window: {ngInfo.daysLeft} of {settings.currency_period_days} calendar days remaining
            </p>
          </div>
        }

        {showNSStatus &&
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
                  {nsInfo.expirationDate &&
                <p className="text-xs text-slate-500">
                      Expires at midnight: {format(nsInfo.expirationDate, "d MMM yyyy")}
                    </p>
                }
                </div>
              </div>
              {getStatusBadge(nsStatus, nsInfo.daysLeft)}
            </div>
            <Progress
            value={nsInfo.daysLeft === 0 ? 100 : nsProgressPercentage}
            className={`h-2 ${getProgressClass(nsInfo.daysLeft, settings.currency_period_days)}`} />

            <div className="flex items-center gap-2">
              <p className="text-xs text-slate-500">
                Currency window: {nsInfo.daysLeft} of {settings.currency_period_days} calendar days remaining
              </p>
              {nsInfo.lastFlightWasSimulator && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <div className="flex items-center gap-1 text-yellow-600">
                      <AlertTriangle className="w-3 h-3" />
                      <span className="text-xs font-semibold">SIM</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Last NS flight was a simulator session.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              )}
            </div>
          </div>
        }

        <div className="bg-slate-50 rounded-lg p-4">
          <p className="bg-amber-100 text-slate-600 text-sm">Note: Currency tracking uses calendar days and expires at midnight on the last day. This section of the tracker is separeate from your semi-annual tracker. See Requirements page for more details


          </p>
        </div>
      </CardContent>
    </Card>);

}


import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, AlertTriangle, CheckCircle, Computer } from "lucide-react";
import { format, isWithinInterval, startOfDay, parseISO } from "date-fns";

const getCurrentPeriod = (settings) => {
  if (!settings || (!settings.period_one_start && !settings.period_two_start)) {
    return null;
  }

  const currentDate = startOfDay(new Date());

  if (settings.period_one_start && settings.period_one_end) {
    const p1_start = parseISO(settings.period_one_start);
    const p1_end = parseISO(settings.period_one_end);
    if (isWithinInterval(currentDate, { start: p1_start, end: p1_end })) {
      return { start: p1_start, end: p1_end, name: "First Semi-annual Period" };
    }
  }

  if (settings.period_two_start && settings.period_two_end) {
    const p2_start = parseISO(settings.period_two_start);
    const p2_end = parseISO(settings.period_two_end);
    if (isWithinInterval(currentDate, { start: p2_start, end: p2_end })) {
      return { start: p2_start, end: p2_end, name: "Second Semi-annual Period" };
    }
  }

  return null; 
};

const getProgressClass = (percentage) => {
    if (percentage >= 100) return '[&>div]:bg-green-600';
    if (percentage > 50) return '[&>div]:bg-yellow-500';
    return '[&>div]:bg-red-600';
};

export default function SemiannualStatus({ user, flights = [] }) {
  const [semiannualHours, setSemiannualHours] = useState({ 
    total: 0, 
    simulator: 0, 
    custom: {} 
  });
  const [loading, setLoading] = useState(true);

  const settings = user?.semiannual_settings;
  const period = getCurrentPeriod(settings);

  useEffect(() => {
    if (period && flights.length >= 0) { // Check flights.length >= 0 to handle initial empty array
      calculateSemiannualHours();
    } else {
      setLoading(false);
    }
  }, [user, period, flights]);

  const calculateSemiannualHours = () => {
    try {
      if (!period) return;

      const periodFlights = flights.filter(flight => {
        const flightDate = startOfDay(parseISO(flight.date));
        return isWithinInterval(flightDate, { start: period.start, end: period.end });
      });

      // Filter by aircraft type if specified (for aircraft hours)
      const relevantAircraftFlights = settings.aircraft_type && settings.aircraft_type !== "All Aircraft"
        ? periodFlights.filter(flight => !flight.is_simulator && flight.aircraft_type === settings.aircraft_type)
        : periodFlights.filter(flight => !flight.is_simulator);

      // Filter by simulator aircraft type if specified (for simulator hours)
      const relevantSimulatorFlights = settings.simulator_aircraft_type
        ? periodFlights.filter(flight => flight.is_simulator && flight.aircraft_type === settings.simulator_aircraft_type)
        : periodFlights.filter(flight => flight.is_simulator);

      // Calculate aircraft hours
      const aircraftHours = relevantAircraftFlights
        .reduce((sum, flight) => sum + (flight.total_flight_hours || 0), 0);

      // Calculate simulator hours
      const simulatorHours = relevantSimulatorFlights
        .reduce((sum, flight) => sum + (flight.total_flight_hours || 0), 0);

      // Calculate custom field hours
      const customHours = {};
      settings.custom_fields?.forEach(field => {
        let fieldHours = 0;
        const targetFlights = field.is_simulator ? relevantSimulatorFlights : relevantAircraftFlights;
        
        targetFlights.forEach(flight => {
          flight.hour_breakdown?.forEach(breakdown => {
            let modeMatch = false;
            if (field.mode === 'NVD') {
                modeMatch = breakdown.mode === 'NG' || breakdown.mode === 'NS';
            } else {
                modeMatch = !field.mode || breakdown.mode === field.mode;
            }

            const seatMatch = !field.seat_position || breakdown.seat_position === field.seat_position;
            
            if (modeMatch && seatMatch) {
              fieldHours += breakdown.duration || 0;
            }
          });
        });
        customHours[field.id] = fieldHours;
      });

      setSemiannualHours({ 
        total: aircraftHours, 
        simulator: simulatorHours, 
        custom: customHours 
      });
    } catch (error) {
      console.error("Error calculating semi-annual hours:", error);
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

  if (!period) {
    return (
      <Card className="bg-white shadow-lg border-0">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Semi-annual Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-slate-600">
            Please define your semi-annual periods in your profile to track progress.
          </p>
          <Link to={createPageUrl("Profile")}>
            <Button>Go to Settings</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const progressPercentage = settings.required_hours > 0 ? Math.min((semiannualHours.total / settings.required_hours) * 100, 100) : 0;
  const simProgressPercentage = settings.simulator_required_hours > 0 
    ? Math.min((semiannualHours.simulator / settings.simulator_required_hours) * 100, 100) 
    : 0;
  const isOnTrack = semiannualHours.total >= (settings.required_hours || 0);
  const isSimOnTrack = settings.simulator_required_hours === 0 || semiannualHours.simulator >= settings.simulator_required_hours;

  return (
    <Card className="bg-white shadow-lg border-0">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Semi-annual Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-slate-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-slate-900">{period.name}</h4>
            <Badge className={isOnTrack && isSimOnTrack ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
              {isOnTrack && isSimOnTrack ? "On Track" : "Behind"}
            </Badge>
          </div>
          <p className="text-sm text-slate-600 mb-4">
            {format(period.start, "MMM d, yyyy")} - {format(period.end, "MMM d, yyyy")}
          </p>
          
          <div className="space-y-4">
            {/* Aircraft Hours */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Flight Hours: {semiannualHours.total.toFixed(1)} / {settings.required_hours || 0} hours</span>
                <span>{progressPercentage.toFixed(1)}%</span>
              </div>
              <Progress value={progressPercentage} className={`h-3 ${getProgressClass(progressPercentage)}`} />
            </div>

            {/* Simulator Hours */}
            {settings.simulator_required_hours > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Computer className="w-4 h-4" />
                    Simulator Hours: {semiannualHours.simulator.toFixed(1)} / {settings.simulator_required_hours} hours
                  </span>
                  <span>{simProgressPercentage.toFixed(1)}%</span>
                </div>
                <Progress value={simProgressPercentage} className={`h-3 ${getProgressClass(simProgressPercentage)}`} />
              </div>
            )}
          </div>
        </div>

        {settings.custom_fields && settings.custom_fields.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium text-slate-900">Additional Requirements</h4>
            {settings.custom_fields.map((field, index) => {
              const fieldHours = semiannualHours.custom[field.id] || 0;
              const fieldProgress = field.required_hours > 0 ? Math.min((fieldHours / field.required_hours) * 100, 100) : 0;
              const fieldOnTrack = fieldHours >= field.required_hours;

              return (
                <div key={field.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-900 flex items-center gap-2">
                      {field.is_simulator && <Computer className="w-3 h-3" />}
                      {field.name}
                    </span>
                    <Badge className={fieldOnTrack ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"} size="sm">
                      {fieldOnTrack ? <CheckCircle className="w-3 h-3 mr-1" /> : <AlertTriangle className="w-3 h-3 mr-1" />}
                      {fieldHours.toFixed(1)}h / {field.required_hours}h
                    </Badge>
                  </div>
                  <Progress value={fieldProgress} className={`h-2 ${getProgressClass(fieldProgress)}`} />
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

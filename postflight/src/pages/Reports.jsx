
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Flight, User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"; // Added CardDescription
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Sector } from "recharts";
import { Calendar as CalendarIcon, Download, TrendingUp, Clock, Plane, Computer, Target, Users, Route, MapPin, Shield, BarChart3, FileText, X as CloseIcon, Eye } from "lucide-react";
import { format, subDays, subMonths, isAfter, startOfMonth, endOfMonth, eachMonthOfInterval, isWithinInterval, parseISO, subYears } from "date-fns";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

// Import Stripe and backend functions
import { loadStripe } from '@stripe/stripe-js';
import { createCheckoutSession } from "@/api/functions";
import { getStripeKey } from "@/api/functions";
import { exportToCsv } from "@/api/functions";

// Import new export components
import CondensedLogbookLayout from "../components/export/CondensedLogbookLayout";
import CompleteLogbookLayout from "../components/export/CompleteLogbookLayout";
import ExperienceReportLayout from "../components/export/ExperienceReportLayout";
import FAA8710Layout from "../components/export/FAA8710Layout";


const COLORS = ['#024950', '#0fa4af', '#964734', '#2A9D8F', '#afdde5', '#003135', '#E9C46A', '#F4A261', '#5E9A9E', '#B58A7E', '#8D99AE', '#E3D5B8'];
const DUTY_COLORS = ['#964734', '#024950']; // Accent for PIC, Primary for PI
const ALL_MODES = ["D", "N", "NG", "NS", "H", "W"]; // Define all possible flight modes for columns

const PrintableFlightLogTable = ({ flights }) => {
  if (!flights || flights.length === 0) {
    return <p className="text-slate-600">No flight data available for this period.</p>;
  }
  return (
    <div className="pt-8">
      <h2 className="text-2xl font-bold text-slate-900 mb-4">Detailed Flight Log</h2>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Aircraft</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Role</TableHead>
              {ALL_MODES.map((mode) =>
              <TableHead key={mode} className="text-right">{mode}</TableHead>
              )}
              <TableHead className="text-right font-bold">Total</TableHead>
              <TableHead>Remarks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {flights.map((flight) => {
              const hoursByMode = (flight.hour_breakdown || []).reduce((acc, item) => {
                acc[item.mode] = item.duration;
                return acc;
              }, {});

              return (
                <TableRow key={flight.id}>
                  <TableCell>{format(parseISO(flight.date), "yyyy-MM-dd")}</TableCell>
                  <TableCell>
                    {flight.is_simulator ? 'SIM:' : ''}
                    {flight.custom_aircraft_type || flight.aircraft_type} {flight.tail_number}
                  </TableCell>
                  <TableCell>{flight.origin} → {flight.destinations?.join(' → ')}</TableCell>
                  <TableCell>{flight.pilot_role || (flight.is_pic ? 'PIC' : 'PI')}</TableCell>
                  {ALL_MODES.map((mode) =>
                  <TableCell key={mode} className="text-right">
                      {(hoursByMode[mode] || 0).toFixed(1)}
                    </TableCell>
                  )}
                  <TableCell className="text-right font-semibold">{flight.total_flight_hours.toFixed(1)}</TableCell>
                  <TableCell className="truncate max-w-xs">{flight.remarks}</TableCell>
                </TableRow>);

            })}
          </TableBody>
        </Table>
      </div>
    </div>);

};


export default function ReportsPage() {
  const [flights, setFlights] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  // NEW: display values for MM/DD/YYYY inputs
  const [customStartDisplay, setCustomStartDisplay] = useState("");
  const [customEndDisplay, setCustomEndDisplay] = useState("");

  const originalTitleRef = useRef(document.title);
  const [activePieIndices, setActivePieIndices] = useState({});

  // Add: detect mobile view to adapt charts
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize(); // Set initial value
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // State for payment and previews
  const [stripePromise, setStripePromise] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState('');
  const [previewingReport, setPreviewingReport] = useState(null); // e.g., 'condensed'
  const [printingReport, setPrintingReport] = useState({ type: null, showWatermark: false });

  const watermarkSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><g transform="rotate(-30 200 200)"><text x="50%" y="50%" dy=".3em" fill="rgba(239, 68, 68, 0.15)" font-size="60" font-family="sans-serif" font-weight="bold" text-anchor="middle">NOT VALID</text></g></svg>`;
  const watermarkDataUrl = `url("data:image/svg+xml;base64,${typeof window !== 'undefined' ? window.btoa(watermarkSvg) : ''}")`;

  const [reportData, setReportData] = useState({
    monthlyHours: [],
    // NEW
    taskCodesMonthly: [],
    taskTopCodes: [],
    aircraftTypes: [],
    modeBreakdown: [],
    missionTypeBreakdown: [],
    seatPositionHours: [], // Added for the new chart
    detailedAircraftHours: [],
    dutyPositionHours: [],
    // NEW: task codes
    taskCodesBreakdown: [],
    totalHours: 0,
    aircraftHours: 0,
    simulatorHours: 0,
    picHours: 0,
    flightCount: 0,
    crossCountryTime: 0,
    crossCountryDistance: 0,
    last30DaysHours: 0,
    last90DaysHours: 0,
    last365DaysHours: 0,
    last30DaysSimHours: 0, // Add new property
    last90DaysSimHours: 0,  // Add new property
    last365DaysSimHours: 0, // Add new property
  });

  const loadData = async () => {
    setLoading(true);
    let success = false;
    let retries = 3;
    while (retries > 0 && !success) {
      try {
        const [flightData, userData] = await Promise.all([
        Flight.list("-date"),
        User.me()]
        );
        setFlights(flightData);
        setUser(userData); // No longer needs report_credits
        success = true;
      } catch (error) {
        retries--;
        console.error(`Error loading report data, retries left: ${retries}`, error);
        if (retries > 0) {
          await new Promise((res) => setTimeout(res, (3 - retries) * 1500));
        } else {
          // All retries failed
          setFlights([]);
          setUser(null);
          alert("Failed to load report data after multiple attempts. Please check your connection or try again later.");
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    const initializeStripe = async () => {
      try {
        const { data } = await getStripeKey();
        if (data.publishableKey) {
          setStripePromise(loadStripe(data.publishableKey));
        } else {
          console.error("Stripe publishable key not found.");
        }
      } catch (error) {
        console.error("Failed to fetch Stripe key:", error);
      }
    };
    initializeStripe();
    loadData();
  }, []);

  // Removed the old useEffect that targeted native date inputs via DOM manipulation.

  const handleCustomDateChange = (dateString, setter) => {
    if (!dateString) {
      setter(""); // Clear the state if input is empty
      return;
    }

    // Attempt to parse MM/DD/YYYY
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const month = parseInt(parts[0], 10);
      const day = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);

      // Basic validation for numbers and ranges
      if (!isNaN(month) && !isNaN(day) && !isNaN(year) &&
          month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 1900 && year <= 2100) {
        try {
          // Create a date object, month is 0-indexed in Date constructor
          const date = new Date(year, month - 1, day);
          // Validate if date components match (e.g. 02/30 will become March 2 if not checked)
          if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
            setter(format(date, 'yyyy-MM-dd'));
          } else {
            setter(""); // Invalid date (e.g. 02/30), clear state
          }
        } catch (error) {
          console.error("Error parsing date:", error);
          setter(""); // Clear state on parsing error
        }
      } else {
        setter(""); // Invalid numeric parts, clear state
      }
    } else {
      setter(""); // Invalid format (not MM/DD/YYYY), clear state
    }
  };

  // NEW: helper to format input as MM/DD/YYYY while typing
  const formatUs = (value) => {
    const digits = (value || "").replace(/\D/g, "").slice(0, 8);
    const parts = [];
    if (digits.length > 0) parts.push(digits.slice(0, Math.min(2, digits.length)));
    if (digits.length >= 3) parts.push(digits.slice(2, Math.min(4, digits.length)));
    if (digits.length >= 5) parts.push(digits.slice(4));
    return parts.join("/");
  };

  // NEW: input change handlers keep display synced and update ISO when valid
  const handleStartInputChange = (val) => {
    const formatted = formatUs(val);
    setCustomStartDisplay(formatted);
    handleCustomDateChange(formatted, setCustomStartDate);
  };
  const handleEndInputChange = (val) => {
    const formatted = formatUs(val);
    setCustomEndDisplay(formatted);
    handleCustomDateChange(formatted, setCustomEndDate);
  };

  // NEW: sync display when ISO changes (e.g., from presets or init)
  useEffect(() => {
    setCustomStartDisplay(customStartDate ? format(parseISO(customStartDate), 'MM/dd/yyyy') : "");
  }, [customStartDate]);
  useEffect(() => {
    setCustomEndDisplay(customEndDate ? format(parseISO(customEndDate), 'MM/dd/yyyy') : "");
  }, [customEndDate]);

  const getDateRangeFilter = useCallback(() => {
    const now = new Date();
    let start;
    let end = now; // Default end date to now

    if (dateRange === "custom") {
      // Parse custom dates. If empty string, parseISO will return Invalid Date.
      // We explicitly set to null if string is empty to avoid Invalid Date and allow isWithinInterval to work correctly for unbounded ranges.
      const parsedCustomStart = customStartDate ? parseISO(customStartDate) : null;
      const parsedCustomEnd = customEndDate ? parseISO(customEndDate) : null;

      start = parsedCustomStart;
      end = parsedCustomEnd || now; // If custom end is not set, default to now.

      // If only custom start is set, end is now.
      // If only custom end is set, start defaults to 1 year prior to end.
      if (start && !parsedCustomEnd) {
        end = now;
      } else if (!start && parsedCustomEnd) {
        start = subYears(parsedCustomEnd, 1); // Default to 1 year before end if no start is specified
      } else if (!start && !parsedCustomEnd) {
        // If "custom" is selected but both fields are empty, default to "all time" behavior
        start = flights.length > 0 ? parseISO(flights.reduce((minDate, f) => parseISO(minDate) < parseISO(f.date) ? minDate : f.date, flights[0]?.date)) : subMonths(now, 24);
        end = now;
      }

    } else { // This now defaults to "all"
      // Use earliest flight date as start, or fallback to 24 months ago if no flights
      start = flights.length > 0 ? parseISO(flights.reduce((minDate, f) => parseISO(minDate) < parseISO(f.date) ? minDate : f.date, flights[0]?.date)) : subMonths(now, 24);
    }

    // Ensure start is not after end
    if (start && end && isAfter(start, end)) {
      [start, end] = [end, start];
    }

    // Set time to start/end of day for accurate interval checking
    start = start ? new Date(start.setHours(0, 0, 0, 0)) : null;
    end = end ? new Date(end.setHours(23, 59, 59, 999)) : null;

    return { start, end };
  }, [dateRange, customStartDate, customEndDate, flights]);

  const { start: currentStart, end: currentEnd } = getDateRangeFilter();
  const filteredFlights = flights.filter((flight) => {
    const flightDate = parseISO(flight.date);
    // Only filter if start and end dates are valid
    if (currentStart && currentEnd) {
      return isWithinInterval(flightDate, { start: currentStart, end: currentEnd });
    }
    return true; // If no valid range, include all flights (or none if that's desired behavior, but "all time" handles this)
  });

  const generateReportData = useCallback(() => {
    // This `startDate` and `endDate` are derived from the *current state* when generateReportData runs.
    const { start: startDate, end: endDate } = getDateRangeFilter();

    // This `localFilteredFlights` is used for generating the actual report data (charts, stats).
    // It's crucial that this matches what `filteredFlights` (for the table) represents.
    const localFilteredFlights = flights.filter((flight) => {
      const flightDate = parseISO(flight.date); // fixed: use flight.date instead of f.date
      // Only filter if startDate and endDate are valid (not null)
      if (startDate && endDate) {
        return isWithinInterval(flightDate, { start: startDate, end: endDate });
      }
      return true; // If no valid range, include all flights (handled by "all time" dateRange)
    });

    // Monthly hours data - always show last 12 months (rolling), independent of selected date range
    const start12 = startOfMonth(subMonths(new Date(), 11));
    const monthsInRange = eachMonthOfInterval({
      start: start12,
      end: new Date()
    });

    const monthlyData = monthsInRange.map((month) => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);

      const monthFlights = flights.filter((f) => {
        const flightDate = parseISO(f.date);
        return flightDate >= monthStart && flightDate <= monthEnd;
      });

      const aircraftHours = monthFlights
        .filter((f) => !f.is_simulator)
        .reduce((sum, f) => sum + (f.total_flight_hours || 0), 0);

      const simHours = monthFlights
        .filter((f) => f.is_simulator)
        .reduce((sum, f) => sum + (f.total_flight_hours || 0), 0);

      return {
        month: format(month, "MMM yyyy"),
        aircraft: parseFloat(aircraftHours.toFixed(1)),
        simulator: parseFloat(simHours.toFixed(1)),
        total: parseFloat((aircraftHours + simHours).toFixed(1))
      };
    });

    // NEW: Monthly task codes trend (last 12 months, T missions only) as OCCURRENCES (count per code)
    const perCodeTotals = {}; // to determine top codes by occurrences
    const taskCodesMonthly = monthsInRange.map((month) => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      const row = { month: format(month, "MMM yyyy") };

      const monthFlights = flights.filter((f) => {
        const d = parseISO(f.date);
        return d >= monthStart && d <= monthEnd && f.mission_type === 'T' && Array.isArray(f.task_codes) && f.task_codes.length > 0;
      });

      monthFlights.forEach((f) => {
        // Count each task code occurrence (1 per flight per code)
        f.task_codes.forEach((code) => {
          const c = (code || '').trim().toUpperCase();
          if (!c) return;
          row[c] = (row[c] || 0) + 1; // Increment count for this month and code
          perCodeTotals[c] = (perCodeTotals[c] || 0) + 1; // Increment total count for this code
        });
      });

      return row;
    });

    const taskTopCodes = Object.entries(perCodeTotals)
      .sort((a, b) => b[1] - a[1]) // Sort by occurrences
      .slice(0, 5) // Take top 5
      .map(([code]) => code); // Get just the code names


    // Aircraft types breakdown
    const aircraftCounts = {};
    localFilteredFlights.forEach((flight) => {
      const type = flight.aircraft_type === "Custom" ? flight.custom_aircraft_type : flight.aircraft_type;
      // Add a (Sim) label to simulator types to distinguish them in the chart
      const typeLabel = `${type}${flight.is_simulator ? ' (Sim)' : ''}`;
      aircraftCounts[typeLabel] = (aircraftCounts[typeLabel] || 0) + (flight.total_flight_hours || 0);
    });

    const aircraftTypesData = Object.entries(aircraftCounts).
    map(([type, hours]) => ({ name: type, hours: parseFloat(hours.toFixed(1)) })).
    sort((a, b) => b.hours - a.hours);

    // Individual aircraft hours tracking
    if (user?.personal_aircraft_inventory) {
      var aircraftHoursData = user.personal_aircraft_inventory.map((aircraft) => {
        const hoursFlown = localFilteredFlights.
        filter((flight) =>
        flight.tail_number === aircraft.tail_number &&
        !flight.is_simulator
        ).
        reduce((sum, flight) => sum + (flight.total_flight_hours || 0), 0);

        const flightCount = localFilteredFlights.
        filter((flight) =>
        flight.tail_number === aircraft.tail_number &&
        !flight.is_simulator
        ).length;

        return {
          tail_number: aircraft.tail_number,
          aircraft_type: aircraft.aircraft_type === "Custom" ? aircraft.custom_aircraft_type : aircraft.aircraft_type,
          hours_flown: parseFloat(hoursFlown.toFixed(1)),
          flight_count: flightCount
        };
      }).filter((d) => d.hours_flown > 0 || d.flight_count > 0);
    } else {
      var aircraftHoursData = [];
    }

    // Sort aircraft by hours flown (descending)
    aircraftHoursData.sort((a, b) => b.hours_flown - a.hours_flown);

    // Mode breakdown
    const modeCounts = {};
    localFilteredFlights.forEach((flight) => {
      const sourceLabel = flight.is_simulator ? 'Sim' : 'Aircraft';
      flight.hour_breakdown?.forEach((breakdown) => {
        const modeKey = `${breakdown.mode} (${sourceLabel})`;
        modeCounts[modeKey] = (modeCounts[modeKey] || 0) + (breakdown.duration || 0);
      });
    });

    const modeData = Object.entries(modeCounts).
    map(([mode, hours]) => ({ name: mode, hours: parseFloat(hours.toFixed(1)) })).
    sort((a, b) => b.hours - a.hours);

    // Mission type breakdown
    const missionCounts = {};
    localFilteredFlights.forEach((flight) => {
      const missionType = flight.mission_type || "Unknown"; // Default to "Unknown" if not set
      missionCounts[missionType] = (missionCounts[missionType] || 0) + (flight.total_flight_hours || 0);
    });

    const missionTypeData = Object.entries(missionCounts).
    map(([type, hours]) => ({ name: type, hours: parseFloat(hours.toFixed(1)) })).
    sort((a, b) => b.hours - a.hours);

    // NEW: Task codes breakdown (T missions only) as OCCURRENCES for overall pie
    const taskCodeCounts = {};
    localFilteredFlights.forEach((flight) => {
      if (flight.mission_type === 'T' && Array.isArray(flight.task_codes) && flight.task_codes.length > 0) {
        flight.task_codes.forEach((code) => {
          const c = (code || '').trim().toUpperCase();
          if (!c) return; // Skip empty/null codes
          taskCodeCounts[c] = (taskCodeCounts[c] || 0) + 1; // Count as 1 occurrence
        });
      }
    });
    const taskCodesData = Object.entries(taskCodeCounts)
      .map(([code, count]) => ({ name: code, count })) // Use count instead of hours
      .sort((a, b) => b.count - a.count);

    // Seat Position Breakdown
    const seatPositionCounts = {};
    const seatPositionLabels = {
        'L': 'Left Seat',
        'R': 'Right Seat',
        'F': 'Front Seat',
        'B': 'Back Seat',
    };
    localFilteredFlights.forEach((flight) => {
        flight.hour_breakdown?.forEach((breakdown) => {
            if (breakdown.seat_position) {
                const seatKey = breakdown.seat_position;
                seatPositionCounts[seatKey] = (seatPositionCounts[seatKey] || 0) + (breakdown.duration || 0);
            }
        });
    });

    const seatPositionData = Object.entries(seatPositionCounts)
        .map(([seat, hours]) => ({ name: seatPositionLabels[seat] || seat, hours: parseFloat(hours.toFixed(1)) }))
        .filter(d => d.hours > 0)
        .sort((a, b) => b.hours - a.hours);

    // Summary statistics for the selected period
    const totalHours = localFilteredFlights.reduce((sum, f) => sum + (f.total_flight_hours || 0), 0);
    const aircraftHours = localFilteredFlights.filter((f) => !f.is_simulator).reduce((sum, f) => sum + (f.total_flight_hours || 0), 0);
    const simulatorHours = localFilteredFlights.filter((f) => f.is_simulator).reduce((sum, f) => sum + (f.total_flight_hours || 0), 0);

    // Treat 'PC' and 'PIC' (or is_pic) as PIC
    const isPicDerived = (f) => f.is_pic === true || f.pilot_role === 'PC' || f.pilot_role === 'PIC';
    const picHours = localFilteredFlights.filter((f) => isPicDerived(f)).reduce((sum, f) => sum + (f.total_flight_hours || 0), 0);
    const piHours = localFilteredFlights.filter((f) => !isPicDerived(f)).reduce((sum, f) => sum + (f.total_flight_hours || 0), 0);

    const crossCountryTime = localFilteredFlights.reduce((sum, f) => sum + (f.cross_country_time || 0), 0);
    const crossCountryDistance = localFilteredFlights.reduce((sum, f) => sum + (f.cross_country_distance || 0), 0);

    const dutyPositionData = [
    { name: 'PIC', hours: parseFloat(picHours.toFixed(1)) },
    { name: 'PI', hours: parseFloat(piHours.toFixed(1)) }].
    filter((d) => d.hours > 0);

    // Fixed lookback period calculations, independent of selected date range
    const now = new Date();
    const last30 = flights
      .filter(f => !f.is_simulator && isAfter(parseISO(f.date), subDays(now, 30)))
      .reduce((sum, f) => sum + (f.total_flight_hours || 0), 0);
    const last90 = flights
      .filter(f => !f.is_simulator && isAfter(parseISO(f.date), subDays(now, 90)))
      .reduce((sum, f) => sum + (f.total_flight_hours || 0), 0);
    const last365 = flights
      .filter(f => !f.is_simulator && isAfter(parseISO(f.date), subDays(now, 365)))
      .reduce((sum, f) => sum + (f.total_flight_hours || 0), 0);
      
    // Add simulator calculations
    const last30Sim = flights
      .filter(f => f.is_simulator && isAfter(parseISO(f.date), subDays(now, 30)))
      .reduce((sum, f) => sum + (f.total_flight_hours || 0), 0);
    const last90Sim = flights
      .filter(f => f.is_simulator && isAfter(parseISO(f.date), subDays(now, 90)))
      .reduce((sum, f) => sum + (f.total_flight_hours || 0), 0);
    const last365Sim = flights
      .filter(f => f.is_simulator && isAfter(parseISO(f.date), subDays(now, 365)))
      .reduce((sum, f) => sum + (f.total_flight_hours || 0), 0);

    setReportData({
      monthlyHours: monthlyData,
      taskCodesMonthly: taskCodesMonthly,
      taskTopCodes: taskTopCodes,
      aircraftTypes: aircraftTypesData,
      modeBreakdown: modeData,
      missionTypeBreakdown: missionTypeData,
      // NEW
      taskCodesBreakdown: taskCodesData,
      seatPositionHours: seatPositionData,
      detailedAircraftHours: aircraftHoursData,
      dutyPositionHours: dutyPositionData,
      totalHours: parseFloat(totalHours.toFixed(1)),
      aircraftHours: parseFloat(aircraftHours.toFixed(1)),
      simulatorHours: parseFloat(simulatorHours.toFixed(1)),
      picHours: parseFloat(picHours.toFixed(1)),
      flightCount: localFilteredFlights.length,
      crossCountryTime: parseFloat(crossCountryTime.toFixed(1)),
      crossCountryDistance: parseFloat(crossCountryDistance.toFixed(0)),
      last30DaysHours: parseFloat(last30.toFixed(1)),
      last90DaysHours: parseFloat(last90.toFixed(1)),
      last365DaysHours: parseFloat(last365.toFixed(1)),
      last30DaysSimHours: parseFloat(last30Sim.toFixed(1)),
      last90DaysSimHours: parseFloat(last90Sim.toFixed(1)),
      last365DaysSimHours: parseFloat(last365Sim.toFixed(1)),
    });
  }, [flights, user, getDateRangeFilter]);

  useEffect(() => {
    if (flights.length > 0 || !loading) {
      generateReportData();
    }
  }, [flights, loading, generateReportData]);

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
    // This function now returns null to remove the text from inside the pie chart.
    return null;
  };

  // Add: compact legend for mobile devices (uses data arrays directly)
  const MobileLegend = ({ data, colors }) => {
    if (!data || data.length === 0) return null;
    return (
      <ul className="list-none p-0 m-0 mt-2 grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-4">
        {data.map((entry, index) => (
          <li key={`${entry.name}-${index}`} className="flex items-center justify-between text-sm">
            <div className="flex items-center truncate">
              <span
                className="w-2.5 h-2.5 mr-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <span className="text-slate-600 truncate" title={entry.name}>{entry.name}</span>
            </div>
            <span className="font-semibold text-slate-800 ml-2 flex-shrink-0">
              {(Number(entry.hours) || 0).toFixed(1)}h
            </span>
          </li>
        ))}
      </ul>
    );
  };

  const renderActiveShape = (props) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 8}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
      </g>
    );
  };

  const onPieEnter = (chartName, _, index) => {
    setActivePieIndices(prev => ({ ...prev, [chartName]: index }));
  };

  const onPieLeave = (chartName) => {
    setActivePieIndices(prev => ({ ...prev, [chartName]: null }));
  };

  const handlePrintReport = useCallback((reportType, showWatermark) => {
    originalTitleRef.current = document.title;

    const safeUserName = (
    user?.first_name && user?.last_name ?
    `${user.first_name}${user.last_name}` :
    user?.full_name || 'Pilot').
    replace(/\s+/g, '');

    const reportNameMapping = {
      'condensed': 'CondensedLogbook',
      'complete': 'CompleteLogbook',
      'experience': 'ExperienceReport',
      'faa8710': 'FAA8710'
    };
    const reportName = reportNameMapping[reportType] || 'Report';
    const newTitle = `Postflight_${safeUserName}_${reportName}`;

    setPrintingReport({ type: reportType, showWatermark });

    const cleanup = () => {
      document.title = originalTitleRef.current;
      setPrintingReport({ type: null, showWatermark: false });
      window.removeEventListener('afterprint', cleanup);
    };

    window.addEventListener('afterprint', cleanup);

    setTimeout(() => {
      document.title = newTitle;
      try {
        window.print();
      } catch (error) {
        console.error('Print failed:', error);
        cleanup();
      }
    }, 500);
  }, [user]);

  useEffect(() => {
    // Check for payment status in URL
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const reportType = urlParams.get('reportType');

    if (paymentStatus === 'success' && reportType) {
      setPaymentMessage(`Payment successful for your report! Your download will start automatically.`);
      // Trigger print for the purchased report without watermark
      handlePrintReport(reportType, false); // false = don't show watermark
      // Clean URL
      window.history.replaceState({}, document.title, "/Reports");
    } else if (paymentStatus === 'cancelled') {
      setPaymentMessage('Payment cancelled. You can try again anytime.');
      window.history.replaceState({}, document.title, "/Reports");
    }
  }, [handlePrintReport]);


  const handlePreview = (reportType) => {
    setPreviewingReport(reportType);
  };

  const handlePurchaseAndDownload = async (reportType) => {
    if (isProcessingPayment) return;
    setIsProcessingPayment(true);
    setPaymentMessage('');

    try {
      const { data: checkoutData } = await createCheckoutSession({ reportType });
      const stripe = await stripePromise;
      if (stripe && checkoutData.sessionId) {
        await stripe.redirectToCheckout({ sessionId: checkoutData.sessionId });
      } else {
        setPaymentMessage("Error redirecting to payment. Please try again.");
      }
    } catch (error) {
      console.error("Failed to create checkout session:", error);
      setPaymentMessage(`Could not initiate payment. ${error.response?.data?.error || 'Please try again later.'}`);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleExportCsv = async () => {
    setIsExportingCsv(true);
    try {
      const response = await exportToCsv();

      // Create a Blob from the CSV data
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });

      // Create a link element to trigger the download
      const link = document.createElement('a');
      if (link.download !== undefined) {// Check for browser support
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'PostFlight_Logbook.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("Failed to export CSV:", error);
      alert("Could not export CSV. Please try again later.");
    } finally {
      setIsExportingCsv(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading reports...</p>
        </div>
      </div>);

  }

  const displayName = user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : user?.full_name || 'Pilot';

  const CustomLegend = ({ payload }) => {
    return (
      <ul className="list-none p-0 m-0 ml-4 space-y-1">
        {payload.map((entry, index) => (
          <li key={`item-${index}`} className="flex items-center justify-between text-sm">
            <div className="flex items-center truncate">
              <span className="w-2.5 h-2.5 mr-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-600 truncate" title={entry.value}>{entry.value}</span>
            </div>
            <span className="font-semibold text-slate-800 ml-2 flex-shrink-0">{entry.payload.hours.toFixed(1)}h</span>
          </li>
        ))}
      </ul>
    );
  };

  const ReportComponent = ({ type }) => {
    switch (type) {
      case 'condensed':return <CondensedLogbookLayout user={user} flights={filteredFlights} />;
      case 'complete':return <CompleteLogbookLayout user={user} flights={filteredFlights} />;
      case 'experience':return <ExperienceReportLayout user={user} reportData={reportData} />;
      case 'faa8710': {
        // Normalize PC -> PIC for FAA 8710 calculations
        const normalizedFlights = filteredFlights.map(f => f.pilot_role === 'PC' ? { ...f, pilot_role: 'PIC' } : f);
        return <FAA8710Layout user={user} flights={normalizedFlights} />;
      }
      default:return null;
    }
  };

  return (
    <>
      <div className="print-only">
        {printingReport.type &&
        <div className="relative">
            {printingReport.showWatermark &&
          <div
            className="absolute inset-0 z-10 pointer-events-none"
            style={{
              backgroundImage: watermarkDataUrl,
              backgroundRepeat: 'repeat'
            }} />

          }
            <ReportComponent type={printingReport.type} />
          </div>
        }
      </div>

      {previewingReport &&
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-4 rounded-lg shadow-2xl w-full max-w-6xl h-[95vh] flex flex-col">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="font-bold text-lg">Report Preview</h3>
              <Button variant="ghost" size="icon" onClick={() => setPreviewingReport(null)}>
                <CloseIcon className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex-grow overflow-y-auto bg-slate-200 p-4">
                <div className="max-w-4xl mx-auto shadow-lg">
                    <div className="relative bg-white">
                        <ReportComponent type={previewingReport} />
                        {/* Watermark Overlay */}
                        <div
                  className="absolute inset-0 pointer-events-none z-10"
                  style={{
                    backgroundImage: watermarkDataUrl,
                    backgroundRepeat: 'repeat'
                  }} />

                    </div>
                </div>
            </div>
          </div>
        </div>
      }

      <div className={`min-h-screen bg-background p-6 md:p-8 ${printingReport.type ? 'print-hidden' : ''}`}>
        <style>
          {`
            @media print {
              body {
                background-color: white !important;
                color: black !important;
                font-size: 10pt;
              }
              .print-hidden {
                display: none !important;
              }
              .print-only {
                display: block !important;
              }
              .page-break-after {
                page-break-after: always;
              }
              .page-break-inside-avoid {
                page-break-inside: avoid;
              }
              .card {
                box-shadow: none !important;
                border: 1px solid #ccc !important;
                page-break-inside: avoid; /* Keep cards together */
                margin-bottom: 1rem !important; /* Ensure spacing */
              }
              .card-content, .card-header {
                box-shadow: none !important; /* redundant but safe */
              }
              main, .max-w-7xl, .flex-1, .overflow-auto {
                padding: 0 !important;
                margin: 0 !important;
                max-width: 100% !important;
                box-sizing: border-box; /* Include padding in element's total width and height */
                overflow: visible !important;
                height: auto !important;
              }
              .recharts-responsive-container {
                width: 100% !important;
                height: 300px !important;
                display: block !important; /* ensure it takes up space */
                page-break-inside: avoid;
              }
              .recharts-wrapper { /* Ensure re-charts wrapper does not overflow */
                  overflow: visible !important;
              }
              .table {
                  width: 100%;
                  border-collapse: collapse;
                  page-break-inside: avoid;
              }
              .table th, .table td {
                  border: 1px solid hsl(var(--border));
                  padding: 0.5rem;
                  text-align: left;
              }
              .table th {
                  background-color: #f8f8f8;
              }
              @page {
                size: A4 landscape;
                margin: 0.75cm;
              }
              h1, h2, h3, h4, h5, h6 {
                page-break-after: avoid;
              }
              p {
                page-break-inside: avoid;
              }
              /* Hide scrollbar for print */
              ::-webkit-scrollbar {
                display: none;
              }
              /* Hide browser-generated URLs for links */
              a[href]:after {
                content: none !important;
              }
              .tabular-nums {
                font-variant-numeric: tabular-nums;
              }
            }
          `}
        </style>

        <div className="max-w-7xl mx-auto">
          <div className="mb-8 print-hidden">
            <h1 className="text-3xl font-bold text-slate-900">Flight Reports & Analytics</h1>
            <p className="text-slate-600 mt-1">
              Detailed analysis of your flight hours and training progress.
            </p>
          </div>

          {paymentMessage &&
          <div className={`mb-6 p-4 rounded-lg text-center font-medium ${paymentMessage.includes('successful') ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {paymentMessage}
              </div>
          }

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 print-hidden">
              <TabsTrigger value="overview" className="relative group flex items-center gap-2 hover:text-primary">
                <BarChart3 className="w-4 h-4" />
                Overview
                <span className={`absolute -bottom-1 left-0 right-0 mx-auto h-0.5 w-4/5 bg-primary transform origin-center transition-transform duration-300 ease-out ${activeTab === 'overview' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
              </TabsTrigger>

              <TabsTrigger value="detailed" className="relative group flex items-center gap-2 hover:text-primary">
                <FileText className="w-4 h-4" />
                Detailed
                <span className={`absolute -bottom-1 left-0 right-0 mx-auto h-0.5 w-4/5 bg-primary transform origin-center transition-transform duration-300 ease-out ${activeTab === 'detailed' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
              </TabsTrigger>

              <TabsTrigger value="export" className="relative group flex items-center gap-2 hover:text-primary">
                <Download className="w-4 h-4" />
                Export
                <span className={`absolute -bottom-1 left-0 right-0 mx-auto h-0.5 w-4/5 bg-primary transform origin-center transition-transform duration-300 ease-out ${activeTab === 'export' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
              </TabsTrigger>
            </TabsList>

            {/* Date Range Selection - shown on all tabs */}
            <Card className="bg-card shadow-lg border-0 print-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  Report Period
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div className="space-y-2">
                    <Label>Date Range</Label>
                    <Select value={dateRange} onValueChange={setDateRange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {dateRange === "custom" &&
                  <>
                      <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input
                        type="text"
                        inputMode="numeric"
                        placeholder="MM/DD/YYYY"
                        value={customStartDisplay}
                        onChange={(e) => handleStartInputChange(e.target.value)}
                        maxLength={10} />

                      </div>
                      <div className="space-y-2">
                        <Label>End Date</Label>
                        <Input
                        type="text"
                        inputMode="numeric"
                        placeholder="MM/DD/YYYY"
                        value={customEndDisplay}
                        onChange={(e) => handleEndInputChange(e.target.value)}
                        maxLength={10} />

                      </div>
                    </>
                  }
                  
                  <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                    Showing <strong>{filteredFlights.length}</strong> flights
                  </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs font-medium text-slate-500">Last 30 Days</p>
                        <div className="text-lg font-bold text-slate-800 mt-1 tabular-nums">
                            <span>A: {reportData.last30DaysHours.toFixed(1)}h</span>
                            <span className="text-slate-300 mx-2">|</span>
                            <span>S: {reportData.last30DaysSimHours.toFixed(1)}h</span>
                        </div>
                        <p className="text-sm font-semibold text-slate-600 mt-1">Total: {(reportData.last30DaysHours + reportData.last30DaysSimHours).toFixed(1)}h</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs font-medium text-slate-500">Last 90 Days</p>
                        <div className="text-lg font-bold text-slate-800 mt-1 tabular-nums">
                            <span>A: {reportData.last90DaysHours.toFixed(1)}h</span>
                            <span className="text-slate-300 mx-2">|</span>
                            <span>S: {reportData.last90DaysSimHours.toFixed(1)}h</span>
                        </div>
                        <p className="text-sm font-semibold text-slate-600 mt-1">Total: {(reportData.last90DaysHours + reportData.last90DaysSimHours).toFixed(1)}h</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs font-medium text-slate-500">Last 365 Days</p>
                        <div className="text-lg font-bold text-slate-800 mt-1 tabular-nums">
                            <span>A: {reportData.last365DaysHours.toFixed(1)}h</span>
                            <span className="text-slate-300 mx-2">|</span>
                            <span>S: {reportData.last365DaysSimHours.toFixed(1)}h</span>
                        </div>
                        <p className="text-sm font-semibold text-slate-600 mt-1">Total: {(reportData.last365DaysHours + reportData.last365DaysSimHours).toFixed(1)}h</p>
                      </div>
                </div>
                {/* Legend for A/S abbreviations */}
                <div className="text-[11px] text-slate-500">
                  Legend: <span className="font-medium text-slate-600">A Hours</span> = Aircraft Hours • <span className="font-medium text-slate-600">S Hours</span> = Sim Hours
                </div>
              </CardContent>
            </Card>

            <TabsContent value="overview">
              <Card className="bg-white shadow-lg border-0">
                <CardHeader className="border-b">
                  <CardTitle className="text-xl">Flight Experience Summary</CardTitle>
                  <CardDescription>A comprehensive overview of all logged flight data for {displayName}.</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-8">
                  {/* Section 1: Key Statistics for Selected Period */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-slate-800">Key Statistics for Selected Period</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <p className="text-sm font-medium text-slate-600">Total Flight Hours</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{reportData.totalHours.toFixed(1)}</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <p className="text-sm font-medium text-slate-600">Aircraft Hours</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{reportData.aircraftHours.toFixed(1)}</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <p className="text-sm font-medium text-slate-600">PIC Hours</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{reportData.picHours.toFixed(1)}</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <p className="text-sm font-medium text-slate-600">Simulator Hours</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{reportData.simulatorHours.toFixed(1)}</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <p className="text-sm font-medium text-slate-600">Cross Country Time</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{reportData.crossCountryTime.toFixed(1)}h</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <p className="text-sm font-medium text-slate-600">Cross Country Distance</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{reportData.crossCountryDistance.toFixed(0)} mi</p>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Visuals */}
                  <div className="space-y-6">
                     <h3 className="text-lg font-semibold text-slate-800">Visual Breakdown</h3>
                      
                     <div className="border rounded-lg p-4">
                      <Tabs defaultValue="source" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-2">
                          <TabsTrigger value="source">Hours by Source</TabsTrigger>
                          <TabsTrigger value="tasks">Tasks by Month</TabsTrigger>
                        </TabsList>

                        <TabsContent value="source">
                          <h4 className="font-semibold text-center mb-2">Monthly Flight Hours Breakdown</h4>
                          <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={reportData.monthlyHours} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="month" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Line
                                type="monotone"
                                dataKey="aircraft"
                                name="Aircraft"
                                stroke="hsl(var(--primary))"
                                strokeWidth={2}
                                dot={{ r: 2 }}
                                activeDot={{ r: 5 }}
                              />
                              <Line
                                type="monotone"
                                dataKey="simulator"
                                name="Simulator"
                                stroke="hsl(var(--secondary))"
                                strokeWidth={2}
                                dot={{ r: 2 }}
                                activeDot={{ r: 5 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </TabsContent>

                        <TabsContent value="tasks">
                          <h4 className="font-semibold text-center mb-2">Monthly Task Codes Trend</h4>
                          {reportData.taskTopCodes.length === 0 ? (
                            <div className="text-center text-slate-500 py-8">
                              No task codes data for the last 12 months.
                            </div>
                          ) : (
                            <ResponsiveContainer width="100%" height={300}>
                              <LineChart data={reportData.taskCodesMonthly} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis allowDecimals={false} />
                                <Tooltip formatter={(value, name) => [`${value}`, name]} />
                                <Legend />
                                {reportData.taskTopCodes.map((code, idx) => (
                                  <Line
                                    key={code}
                                    type="monotone"
                                    dataKey={code}
                                    name={code}
                                    stroke={COLORS[idx % COLORS.length]}
                                    strokeWidth={2}
                                    dot={{ r: 2 }}
                                    activeDot={{ r: 5 }}
                                  />
                                ))}
                              </LineChart>
                            </ResponsiveContainer>
                          )}
                        </TabsContent>
                      </Tabs>
                    </div>

                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="border rounded-lg p-4">
                           <h4 className="font-semibold text-center mb-2">Aircraft / Simulator Breakdown</h4>
                           <div className="overflow-visible">
                            <ResponsiveContainer width="100%" height={isMobile ? 260 : 300}>
                              <PieChart
                                onMouseLeave={() => onPieLeave('aircraft')}
                                margin={{ top: 8, right: isMobile ? 8 : 16, bottom: 8, left: 8 }}
                              >
                                <Pie 
                                  data={reportData.aircraftTypes} 
                                  cx={isMobile ? "50%" : "40%"} 
                                  cy="50%" 
                                  labelLine={false} 
                                  label={renderCustomizedLabel} 
                                  outerRadius={isMobile ? 70 : 80} 
                                  fill="#8884d8" 
                                  dataKey="hours" 
                                  nameKey="name"
                                  activeIndex={activePieIndices.aircraft}
                                  activeShape={renderActiveShape}
                                 onMouseEnter={(_, index) => onPieEnter('aircraft', _, index)}
                                >
                                  {reportData.aircraftTypes.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip formatter={(value, name) => [`${parseFloat(value).toFixed(1)}h`, name]} />
                                {!isMobile && (
                                  <Legend
                                    layout="vertical"
                                    verticalAlign="middle"
                                    align="right"
                                    content={<CustomLegend />}
                                  />
                                )}
                              </PieChart>
                            </ResponsiveContainer>
                            {isMobile && (
                              <MobileLegend data={reportData.aircraftTypes} colors={COLORS} />
                            )}
                           </div>
                        </div>
                         <div className="border rounded-lg p-4">
                           <h4 className="font-semibold text-center mb-2">Flight Mode Breakdown</h4>
                           <div className="overflow-visible">
                            <ResponsiveContainer width="100%" height={isMobile ? 260 : 300}>
                              <PieChart
                                onMouseLeave={() => onPieLeave('mode')}
                                margin={{ top: 8, right: isMobile ? 8 : 16, bottom: 8, left: 8 }}
                              >
                                <Pie 
                                  data={reportData.modeBreakdown} 
                                  cx={isMobile ? "50%" : "40%"} 
                                  cy="50%" 
                                  labelLine={false} 
                                  label={renderCustomizedLabel} 
                                  outerRadius={isMobile ? 70 : 80} 
                                  fill="#8884d8" 
                                  dataKey="hours" 
                                  nameKey="name"
                                  activeIndex={activePieIndices.mode}
                                  activeShape={renderActiveShape}
                                 onMouseEnter={(_, index) => onPieEnter('mode', _, index)}
                                >
                                  {reportData.modeBreakdown.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip formatter={(value, name) => [`${parseFloat(value).toFixed(1)}h`, name]} />
                                {!isMobile && (
                                  <Legend
                                    layout="vertical"
                                    verticalAlign="middle"
                                    align="right"
                                    content={<CustomLegend />}
                                  />
                                )}
                              </PieChart>
                            </ResponsiveContainer>
                            {isMobile && (
                              <MobileLegend data={reportData.modeBreakdown} colors={COLORS} />
                            )}
                           </div>
                        </div>
                        <div className="border rounded-lg p-4">
                           <h4 className="font-semibold text-center mb-2">Duty Position Breakdown</h4>
                           <div className="overflow-visible">
                            <ResponsiveContainer width="100%" height={isMobile ? 260 : 300}>
                              <PieChart
                                onMouseLeave={() => onPieLeave('duty')}
                                margin={{ top: 8, right: isMobile ? 8 : 16, bottom: 8, left: 8 }}
                              >
                                <Pie 
                                  data={reportData.dutyPositionHours} 
                                  cx={isMobile ? "50%" : "40%"} 
                                  cy="50%" 
                                  labelLine={false} 
                                  label={renderCustomizedLabel} 
                                  outerRadius={isMobile ? 70 : 80} 
                                  fill="#8884d8" 
                                  dataKey="hours" 
                                  nameKey="name"
                                  activeIndex={activePieIndices.duty}
                                  activeShape={renderActiveShape}
                                 onMouseEnter={(_, index) => onPieEnter('duty', _, index)}
                                >
                                  {reportData.dutyPositionHours.map((entry, index) => <Cell key={`cell-${index}`} fill={DUTY_COLORS[index % DUTY_COLORS.length]} />)}
                                </Pie>
                                <Tooltip formatter={(value, name) => [`${parseFloat(value).toFixed(1)}h`, name]} />
                                {!isMobile && (
                                  <Legend
                                    layout="vertical"
                                    verticalAlign="middle"
                                    align="right"
                                    content={<CustomLegend />}
                                  />
                                )}
                              </PieChart>
                            </ResponsiveContainer>
                            {isMobile && (
                              <MobileLegend data={reportData.dutyPositionHours} colors={DUTY_COLORS} />
                            )}
                           </div>
                        </div>
                        <div className="border rounded-lg p-4">
                           <h4 className="font-semibold text-center mb-2">Mission Type Breakdown</h4>
                           <div className="overflow-visible">
                            <ResponsiveContainer width="100%" height={isMobile ? 260 : 300}>
                              <PieChart
                                onMouseLeave={() => onPieLeave('mission')}
                                margin={{ top: 8, right: isMobile ? 8 : 16, bottom: 8, left: 8 }}
                              >
                                <Pie 
                                  data={reportData.missionTypeBreakdown} 
                                  cx={isMobile ? "50%" : "40%"} 
                                  cy="50%" 
                                  labelLine={false} 
                                  label={renderCustomizedLabel} 
                                  outerRadius={isMobile ? 70 : 80} 
                                  fill="#8884d8" 
                                  dataKey="hours" 
                                  nameKey="name"
                                  activeIndex={activePieIndices.mission}
                                  activeShape={renderActiveShape}
                                 onMouseEnter={(_, index) => onPieEnter('mission', _, index)}
                                >
                                  {reportData.missionTypeBreakdown?.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip formatter={(value, name) => [`${parseFloat(value).toFixed(1)}h`, name]} />
                                {!isMobile && (
                                  <Legend
                                    layout="vertical"
                                    verticalAlign="middle"
                                    align="right"
                                    content={<CustomLegend />}
                                  />
                                )}
                              </PieChart>
                            </ResponsiveContainer>
                            {isMobile && (
                              <MobileLegend data={reportData.missionTypeBreakdown} colors={COLORS} />
                            )}
                           </div>
                        </div>

                        {/* NEW: Task Codes Breakdown */}
                        <div className="border rounded-lg p-4">
                           <h4 className="font-semibold text-center mb-2">Task Codes</h4>
                           <div className="overflow-visible">
                            <ResponsiveContainer width="100%" height={isMobile ? 260 : 300}>
                              <PieChart
                                onMouseLeave={() => onPieLeave('task')}
                                margin={{ top: 8, right: isMobile ? 8 : 16, bottom: 8, left: 8 }}
                              >
                                <Pie
                                  data={reportData.taskCodesBreakdown}
                                  cx={isMobile ? "50%" : "40%"}
                                  cy="50%"
                                  labelLine={false}
                                  label={renderCustomizedLabel}
                                  outerRadius={isMobile ? 70 : 80}
                                  fill="#8884d8"
                                  dataKey="count" // Changed from "hours" to "count"
                                  nameKey="name"
                                  activeIndex={activePieIndices.task}
                                  activeShape={renderActiveShape}
                                 onMouseEnter={(_, index) => onPieEnter('task', _, index)}
                                >
                                  {reportData.taskCodesBreakdown?.map((entry, index) => (
                                    <Cell key={`cell-task-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip formatter={(value, name) => [`${value}`, name]} /> {/* Changed formatter */}
                                {!isMobile && (
                                  <Legend // Using default Legend
                                    layout="vertical"
                                    verticalAlign="middle"
                                    align="right"
                                  />
                                )}
                              </PieChart>
                            </ResponsiveContainer>
                            {/* MobileLegend omitted as per outline, since it expects 'hours' field */}
                           </div>
                        </div>

                        <div className="border rounded-lg p-4">
                           <h4 className="font-semibold text-center mb-2">Seat Position Breakdown</h4>
                           <div className="overflow-visible">
                            <ResponsiveContainer width="100%" height={isMobile ? 260 : 300}>
                              <PieChart
                                onMouseLeave={() => onPieLeave('seat')}
                                margin={{ top: 8, right: isMobile ? 8 : 16, bottom: 8, left: 8 }}
                              >
                                <Pie 
                                  data={reportData.seatPositionHours} 
                                  cx={isMobile ? "50%" : "40%"} 
                                  cy="50%" 
                                  labelLine={false} 
                                  label={renderCustomizedLabel} 
                                  outerRadius={isMobile ? 70 : 80} 
                                  fill="#8884d8" 
                                  dataKey="hours" 
                                  nameKey="name"
                                  activeIndex={activePieIndices.seat}
                                  activeShape={renderActiveShape}
                                 onMouseEnter={(_, index) => onPieEnter('seat', _, index)}
                                >
                                  {reportData.seatPositionHours?.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip formatter={(value, name) => [`${parseFloat(value).toFixed(1)}h`, name]} />
                                {!isMobile && (
                                  <Legend
                                    layout="vertical"
                                    verticalAlign="middle"
                                    align="right"
                                    content={<CustomLegend />}
                                  />
                                )}
                              </PieChart>
                            </ResponsiveContainer>
                            {isMobile && (
                              <MobileLegend data={reportData.seatPositionHours} colors={COLORS} />
                            )}
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Section 4: Aircraft Table */}
                  {reportData.detailedAircraftHours.length > 0 &&
                  <div>
                      <h3 className="text-lg font-semibold mb-4 text-slate-800">My Aircraft Hours</h3>
                      <div className="overflow-x-auto border rounded-lg">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Tail Number</TableHead>
                              <TableHead>Aircraft Type</TableHead>
                              <TableHead className="text-right">Flight Count</TableHead>
                              <TableHead className="text-right">Hours Flown</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {reportData.detailedAircraftHours.map((aircraft) =>
                          <TableRow key={aircraft.tail_number}>
                                <TableCell className="font-medium">{aircraft.tail_number}</TableCell>
                                <TableCell><Badge variant="outline" className="text-xs">{aircraft.aircraft_type}</Badge></TableCell>
                                <TableCell className="text-right">{aircraft.flight_count}</TableCell>
                                <TableCell className="text-right font-semibold">{aircraft.hours_flown}h</TableCell>
                              </TableRow>
                          )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  }
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="detailed">
              {/* Detailed Flight Log Table */}
              <PrintableFlightLogTable flights={filteredFlights} />
            </TabsContent>

            <TabsContent value="export">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Condensed Logbook Report */}
                <Card className="bg-card shadow-lg border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Condensed Logbook
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-slate-600 text-sm">
                      Summary format showing essential flight information with totals.
                    </p>
                    <div className="flex gap-2">
                       <Button
                        onClick={() => handlePreview('condensed')}
                        variant="outline"
                        className="w-full"
                        disabled={isProcessingPayment || isExportingCsv}>

                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </Button>
                      <Button
                        onClick={() => handlePurchaseAndDownload('condensed')}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        disabled={isProcessingPayment || isExportingCsv}>

                        <Download className="w-4 h-4 mr-2" />
                        {isProcessingPayment ? "Processing..." : "Purchase & Print"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Complete Logbook Report */}
                <Card className="bg-card shadow-lg border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Complete Logbook
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-slate-600 text-sm">
                      Detailed format including all flight data and remarks.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handlePreview('complete')}
                        variant="outline"
                        className="w-full"
                        disabled={isProcessingPayment || isExportingCsv}>

                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </Button>
                      <Button
                        onClick={() => handlePurchaseAndDownload('complete')}
                        className="w-full bg-green-600 hover:bg-green-700"
                        disabled={isProcessingPayment || isExportingCsv}>

                        <Download className="w-4 h-4 mr-2" />
                        {isProcessingPayment ? "Processing..." : "Purchase & Print"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Experience Report */}
                <Card className="bg-card shadow-lg border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Experience Report
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-slate-600 text-sm">
                      Statistical summary of flight experience with charts.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handlePreview('experience')}
                        variant="outline"
                        className="w-full"
                        disabled={isProcessingPayment || isExportingCsv}>

                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </Button>
                      <Button
                        onClick={() => handlePurchaseAndDownload('experience')}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                        disabled={isProcessingPayment || isExportingCsv}>

                        <Download className="w-4 h-4 mr-2" />
                        {isProcessingPayment ? "Processing..." : "Purchase & Print"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* FAA 8710 Report */}
                <Card className="bg-card shadow-lg border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      FAA 8710 Format
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-slate-600 text-sm">
                      FAA Form 8710-1 compatible format for checkrides.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handlePreview('faa8710')}
                        variant="outline"
                        className="w-full"
                        disabled={isProcessingPayment || isExportingCsv}>

                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </Button>
                      <Button
                        onClick={() => handlePurchaseAndDownload('faa8710')}
                        className="w-full bg-red-600 hover:bg-red-700"
                        disabled={isProcessingPayment || isExportingCsv}>

                        <Download className="w-4 h-4 mr-2" />
                        {isProcessingPayment ? "Processing..." : "Purchase & Print"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* CSV Export Report */}
                <Card className="bg-card shadow-lg border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      CSV Export
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-slate-600 text-sm">
                      Download your complete flight log as a CSV file, compatible with spreadsheet applications like Excel or Google Sheets.
                    </p>
                    <Button
                      onClick={handleExportCsv}
                      className="w-full bg-gray-700 hover:bg-gray-800"
                      disabled={isProcessingPayment || isExportingCsv}>

                      <Download className="w-4 h-4 mr-2" />
                      {isExportingCsv ? "Generating..." : "Download CSV"}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* General Export Info */}
              <Card className="bg-card shadow-lg border-0 mt-6">
                <CardHeader>
                  <CardTitle>Export Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-slate-800 mb-2">Report Features</h4>
                      <ul className="text-sm text-slate-600 space-y-1">
                        <li>• Professional PDF formatting</li>
                        <li>• Respects current date filters</li>
                        <li>• Includes pilot information</li>
                        <li>• Print-ready layout</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 mb-2">Tips</h4>
                      <ul className="text-sm text-slate-600 space-y-1">
                        <li>• Use the 'Preview' button to check the report first</li>
                        <li>• Set date filters before purchasing</li>
                        <li>• Successful payment will trigger an automatic print/download</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>);

}

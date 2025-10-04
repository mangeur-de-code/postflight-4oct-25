
import React, { useState, useEffect } from "react";
import { Flight, User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Clock,
  Plane,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Plus,
  Target,
  Computer,
  User as UserIcon
} from "lucide-react";
import { format, subDays, isAfter, differenceInDays, startOfDay, parseISO } from "date-fns";
import StatsCard from "../components/dashboard/StatsCard";
import CurrencyStatus from "../components/dashboard/CurrencyStatus";
import RecentFlights from "../components/dashboard/RecentFlights";
import CustomFieldStatus from "../components/dashboard/CustomFieldStatus";
import SemiannualStatus from "../components/dashboard/SemiannualStatus";
import PWAInstallPrompt from "../components/dashboard/PWAInstallPrompt";
// FlightForm import is no longer needed if it's on a separate page and not used as a modal here.
// import FlightForm from "../components/flight/FlightFormNR"; 

export default function Dashboard() {
  const [flights, setFlights] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currencyStatus, setCurrencyStatus] = useState({ ng: 0, ns: 0 });
  // showForm state is no longer needed as the form opens on a new page.
  // const [showForm, setShowForm] = useState(false); 

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    let success = false;
    let retries = 5;

    while (retries > 0 && !success) {
      try {
        let userData;
        try {
          userData = await User.me();
        } catch (userError) {
          console.log("User authentication failed:", userError);
          if (userError.response?.status === 401 || userError.response?.status === 403) {
            window.location.href = window.location.origin + createPageUrl("Home");
            return;
          }
          throw userError;
        }

        const safeUserData = {
          ...userData,
          currency_settings: userData?.currency_settings || {
            ng_required_hours: 6,
            ns_required_hours: 6,
            currency_period_days: 60
          },
          semiannual_settings: userData?.semiannual_settings || {
            period_one_start: null,
            period_one_end: null,
            period_two_start: null,
            period_two_end: null,
            aircraft_type: "",
            required_hours: 100,
            simulator_required_hours: 0,
            simulator_aircraft_type: "",
            custom_fields: []
          },
          custom_tracking_fields: userData?.custom_tracking_fields || [],
          preferences: userData?.preferences || {
            show_currency_warnings: true,
            show_expiry_warnings: true
          }
        };
        setUser(safeUserData);

        let allFlights = [];
        try {
          allFlights = await Flight.list("-date");
        } catch (flightError) {
          console.error("Failed to load flights:", flightError);
          allFlights = [];
        }

        const userFlights = allFlights.filter((flight) => {
          return flight.created_by === safeUserData.email ||
                 flight.created_by_id === safeUserData.email ||
                 (safeUserData.id && (flight.created_by === safeUserData.id || flight.created_by_id === safeUserData.id));
        });
        setFlights(userFlights);

        if (userFlights.length > 0) {
          const settings = safeUserData.currency_settings;
          const lookbackDate = startOfDay(subDays(new Date(), settings.currency_period_days - 1));

          const recentFlightsFiltered = userFlights.filter((flight) => {
            const flightDate = startOfDay(parseISO(flight.date));
            const isRecent = isAfter(flightDate, lookbackDate) || flightDate.getTime() === lookbackDate.getTime();
            return isRecent;
          });

          let ngHours = 0;
          let nsHours = 0;

          recentFlightsFiltered.forEach((flight) => {
            flight.hour_breakdown?.forEach((breakdown) => {
              if (breakdown.mode === 'NG') {
                ngHours += breakdown.duration || 0;
              }
              if (breakdown.mode === 'NS') {
                nsHours += breakdown.duration || 0;
              }
            });
          });

          setCurrencyStatus({ ng: ngHours, ns: nsHours });
        } else {
          setCurrencyStatus({ ng: 0, ns: 0 });
        }

        success = true;
      } catch (error) {
        retries--;
        console.error(`Error loading dashboard data, retries left: ${retries}`, error);

        if (error.response?.status === 401 || error.response?.status === 403) {
          console.log("Authentication error, redirecting to Home.");
          window.location.href = window.location.origin + createPageUrl("Home");
          setLoading(false);
          return;
        }

        if (retries > 0) {
          await new Promise(res => setTimeout(res, Math.min((5 - retries) * 2000, 10000)));
        } else {
          setError("Unable to load dashboard data. Please try refreshing the page.");
          console.error("Failed to load dashboard data after multiple retries.");
        }
      }
    }
    setLoading(false);
  };

  const handleEditFlight = (flight) => {
    window.location.href = createPageUrl(`FlightLog?edit=${flight.id}`);
  };

  // Handlers for new flight dialog
  const handleOpenNewFlight = () => {
    window.location.href = window.location.origin + createPageUrl("NewFlight");
  };
  // handleCloseNewFlight and handleSubmitNewFlight are no longer needed
  // as the FlightForm is opened on a new page, not as a modal here.
  /*
  const handleCloseNewFlight = () => setShowForm(false);
  const handleSubmitNewFlight = async (flightData) => {
    try {
      await Flight.create(flightData);
      setShowForm(false);
      await loadData(); // Reload data to reflect the new flight
    } catch (error) {
      console.error("Failed to create flight:", error);
      // Optionally, show an error message to the user
    }
  };
  */

  const totalAircraftHours = flights.
  filter((flight) => !flight.is_simulator && flight.total_flight_hours).
  reduce((sum, flight) => {
    const hours = parseFloat(flight.total_flight_hours) || 0;
    return sum + hours;
  }, 0);

  const today = new Date();
  const thirtyDaysAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 30);

  const last30DaysAircraftHours = flights.
  filter((flight) => {
    if (flight.is_simulator || !flight.total_flight_hours) return false;
    const flightDate = parseISO(flight.date);
    const isInRange = flightDate >= thirtyDaysAgo && flightDate <= today;
    return isInRange;
  }).
  reduce((sum, flight) => {
    const hours = parseFloat(flight.total_flight_hours) || 0;
    return sum + hours;
  }, 0);

  const picHours = flights
  .filter((flight) => (flight.is_pic === true || flight.pilot_role === 'PC' || flight.pilot_role === 'PIC') && flight.total_flight_hours)
  .reduce((sum, flight) => {
    const hours = parseFloat(flight.total_flight_hours) || 0;
    return sum + hours;
  }, 0);

const piHours = flights
  .filter((flight) => {
    const isPicDerived = flight.is_pic === true || flight.pilot_role === 'PC' || flight.pilot_role === 'PIC';
    const isPiRole = flight.pilot_role === 'PI';
    return (isPiRole || !isPicDerived) && flight.total_flight_hours;
  })
  .reduce((sum, flight) => {
    const hours = parseFloat(flight.total_flight_hours) || 0;
    return sum + hours;
  }, 0);

  const simHours = flights.
  filter((flight) => flight.is_simulator === true && flight.total_flight_hours).
  reduce((sum, flight) => {
    const hours = parseFloat(flight.total_flight_hours) || 0;
    return sum + hours;
  }, 0);

  const aircraftTypes = [...new Set(flights.filter((f) => !f.is_simulator).map((f) => f.aircraft_type))];
  const recentFlights = flights.slice(0, 5);

  const displayName = user?.first_name && user?.last_name ?
  `${user.first_name} ${user.last_name}` :
  user?.full_name || 'Pilot';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center p-6 bg-white rounded-lg shadow-md max-w-sm mx-auto">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Unable to Load Dashboard</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <Button onClick={loadData} className="bg-blue-600 hover:bg-blue-700">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Flight Deck</h1>
              <p className="text-slate-600 mt-1">
                Welcome back, {displayName}. Here's your flight status overview.
              </p>
            </div>
            {/* Replace Link with button that opens dialog */}
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg" onClick={handleOpenNewFlight}>
              <Plus className="w-4 h-4 mr-2" />
              Log New Flight
            </Button>
          </div>

          {/* PWA Install Prompt */}
          <div className="mb-6">
            <PWAInstallPrompt />
          </div>

          {/* Mobile stats (2 columns, no icons) */}
          <div className="grid grid-cols-2 gap-4 mb-8 md:hidden">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-muted-foreground">Flight Hours</p>
              <p className="text-2xl font-bold text-foreground">{totalAircraftHours.toFixed(1)}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-muted-foreground">Total Hours</p>
              <p className="text-2xl font-bold text-foreground">{(totalAircraftHours + simHours).toFixed(1)}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-muted-foreground">PI Hours</p>
              <p className="text-2xl font-bold text-foreground">{piHours.toFixed(1)}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-muted-foreground">Simulator Hours</p>
              <p className="text-2xl font-bold text-foreground">{simHours.toFixed(1)}</p>
            </div>
          </div>

          {/* Desktop/tablet stats (original cards with icons) */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total aircraft Hours"
              value={totalAircraftHours.toFixed(1)}
              icon={Clock}
              color="blue"
              subtitle=" " />

            <StatsCard
              title="Total Hours"
              value={(totalAircraftHours + simHours).toFixed(1)}
              icon={TrendingUp}
              color="green"
              subtitle=" " />

            {picHours > 0 ?
            <StatsCard
              title="PIC Hours"
              value={picHours.toFixed(1)}
              icon={Target}
              color="purple"
              subtitle=" " /> :

            <StatsCard
              title="PI Hours"
              value={piHours.toFixed(1)}
              icon={UserIcon}
              color="orange"
              subtitle=" " />
            }
            
            <StatsCard
              title="Total Simulator Hours"
              value={simHours.toFixed(1)}
              icon={Computer}
              color="cyan"
              subtitle=" " />
          </div>

          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 space-y-6">
              <CurrencyStatus currencyStatus={currencyStatus} user={user} flights={flights} />
              {user?.semiannual_settings?.period_one_start &&
              <SemiannualStatus user={user} flights={flights} />
              }
            </div>
            <div className="space-y-6">
              <Card className="bg-white shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-slate-900">
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Replace Link with button that opens dialog */}
                  <Button variant="outline" className="w-full justify-start" onClick={handleOpenNewFlight}>
                    <Plus className="w-4 h-4 mr-2" />
                    Log New Flight
                  </Button>
                  <Link to={createPageUrl("Reports")}>
                    <Button variant="outline" className="w-full justify-start">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      View Reports
                    </Button>
                  </Link>
                </CardContent>
              </Card>
              {((user?.custom_tracking_fields && user.custom_tracking_fields.length > 0) || user?.medical_expiry) &&
              <CustomFieldStatus user={user} />
              }
            </div>
          </div>

          <RecentFlights flights={recentFlights} onEditFlight={handleEditFlight} />
        </div>
      </div>

      {/* Remove: Modal overlay with FlightForm */}
      {/* 
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg">
            <FlightForm
              user={user}
              onSubmit={handleSubmitNewFlight}
              onCancel={handleCloseNewFlight}
            />
          </div>
        </div>
      )}
      */}
    </div>
  );
}

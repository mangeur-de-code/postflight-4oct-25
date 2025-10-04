
import React, { useState, useEffect, useMemo } from "react";
import { Flight, User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter } from "lucide-react";
import FlightForm from "../components/flight/FlightFormNR";
import FlightList from "../components/flight/FlightList";
import FlightFiltersWithMission from "../components/flight/FlightFiltersWithMission";
import { GroupInfoDate } from "@/api/entities";
import { parseISO, parse, format } from 'date-fns';
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

// Add a safe date sanitizer just above the component export
const ensureValidIsoDate = (dateStr) => {
  try {
    const d = parseISO(dateStr);
    if (!isNaN(d.getTime())) return format(d, 'yyyy-MM-dd');
  } catch (_) {}
  if (typeof dateStr === 'string' && dateStr.includes('/')) {
    const d2 = parse(dateStr, 'MM/dd/yyyy', new Date());
    if (!isNaN(d2.getTime())) return format(d2, 'yyyy-MM-dd');
  }
  // Fallback to today's date to avoid render crashes
  return format(new Date(), 'yyyy-MM-dd');
};

export default function FlightLogPage() {
  const [flights, setFlights] = useState([]);
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingFlight, setEditingFlight] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    aircraft_type: "all",
    mode_of_flight: "all",
    mission_type: "all",
    is_pic: "all",
    date_range: "all",
    date_from: null,
    date_to: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Check for edit parameter in URL and open form if flight ID is provided
    const urlParams = new URLSearchParams(window.location.search);
    const editFlightId = urlParams.get('edit');
    if (editFlightId && flights.length > 0) {
      const flightToEdit = flights.find(f => f.id === editFlightId);
      if (flightToEdit) {
        handleEdit(flightToEdit);
        // Clean up URL parameter
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [flights]);

  const loadData = async () => {
    setLoading(true);
    let success = false;
    let retries = 3;
    while (retries > 0 && !success) {
      try {
        const [flightData, userData] = await Promise.all([
          Flight.list("-date"),
          User.me()
        ]);

        const userFlights = flightData.filter((flight) => {
          return flight.created_by === userData.email ||
                 flight.created_by_id === userData.email ||
                 (userData.id && (flight.created_by === userData.id || flight.created_by_id === userData.id));
        });

        setFlights(userFlights);
        setUser(userData);
        success = true;
      } catch (error) {
        retries--;
        console.error(`Error loading flight log data, retries left: ${retries}`, error);
        if (retries > 0) {
          await new Promise(res => setTimeout(res, (3 - retries) * 1500));
        } else {
          setFlights([]);
          setUser(null);
          alert("Failed to load flight log data after multiple attempts. Please check your connection or try again later.");
        }
      }
    }
    setLoading(false);
  };

  const checkForNVGModes = (flightData) => {
    const nvgModes = [];
    flightData.hour_breakdown?.forEach(breakdown => {
      if (breakdown.mode === 'NG' || breakdown.mode === 'NS') {
        if (!nvgModes.includes(breakdown.mode)) {
          nvgModes.push(breakdown.mode);
        }
      }
    });
    return nvgModes;
  };

  const handleSubmit = async (flightData) => {
    try {
      const cleanFlightData = { ...flightData };
      delete cleanFlightData.organization_id;
      delete cleanFlightData.org_member_emails;

      if (editingFlight) {
        await Flight.update(editingFlight.id, cleanFlightData);
      } else {
        await Flight.create(cleanFlightData);
        
        // --- Automatic Group Info Update Logic ---
        const nvgModes = checkForNVGModes(cleanFlightData);
        if (nvgModes.length > 0 && user?.email && user.joined_flight_group_ids?.length > 0) {
          console.log("Auto-updating group info for modes:", nvgModes.join(', '));
          
          try {
            const userName = user.first_name && user.last_name 
              ? `${user.first_name} ${user.last_name}` 
              : user.full_name || user.email;

            const existingRecords = await GroupInfoDate.filter({ user_email: user.email });
            const existing = existingRecords.length > 0 ? existingRecords[0] : null;

            // Use the date string directly, as it's already in YYYY-MM-DD format
            const flightDate = cleanFlightData.date || null;
            if (!flightDate) throw new Error("Flight date is missing.");

            const updateData = { user_email: user.email, user_name: userName };
            let needsUpdate = false;

            // Only update NG date if the new flight is more recent AND has at least 1.0 NG hour
            if (nvgModes.includes('NG')) {
              const ngHours = cleanFlightData.hour_breakdown
                .filter(hb => hb.mode === 'NG')
                .reduce((sum, hb) => sum + (hb.duration || 0), 0);

              if (ngHours >= 1.0 && (!existing?.last_ng_date || new Date(flightDate) > new Date(existing.last_ng_date))) {
                updateData.last_ng_date = flightDate;
                needsUpdate = true;
              }
            }

            // Only update NS date if the new flight is more recent AND has at least 1.0 NS hour
            if (nvgModes.includes('NS')) {
              const nsHours = cleanFlightData.hour_breakdown
                .filter(hb => hb.mode === 'NS')
                .reduce((sum, hb) => sum + (hb.duration || 0), 0);

              if (nsHours >= 1.0 && (!existing?.last_ns_date || new Date(flightDate) > new Date(existing.last_ns_date))) {
                updateData.last_ns_date = flightDate;
                needsUpdate = true;
              }
            }
            
            if (needsUpdate) {
              if (existing) {
                // Merge new dates with existing data before updating
                const mergedData = { ...existing, ...updateData };
                await GroupInfoDate.update(existing.id, mergedData);
                console.log("SUCCESS: Group info record updated with new dates.");
              } else {
                // Create a new record if one doesn't exist
                await GroupInfoDate.create(updateData);
                console.log("SUCCESS: New group info record created.");
              }
            } else {
              console.log("INFO: No group info update needed, logged flight is not the most recent.");
            }

          } catch (groupInfoError) {
            console.error("ERROR: Failed to auto-update group information.", groupInfoError);
          }
        }
        // --- End of Automatic Update Logic ---
      }
      
      setShowForm(false);
      setEditingFlight(null);
      await loadData();
    } catch (error) {
      console.error("Error saving flight:", error);
      alert("An error occurred while saving the flight. Please try again.");
    }
  };

  const handleEdit = (flight) => {
    setEditingFlight(flight);
    setShowForm(true);
  };

  const handleDelete = async (flightId) => {
    try {
      await Flight.delete(flightId);
      loadData();
    } catch (error) {
      console.error("Error deleting flight:", error);
      if (error.response?.status === 404 || error.message?.includes("Entity not found")) {
        loadData();
      } else {
        alert("An error occurred while deleting the flight. Please try again.");
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingFlight(null);
  };

  const filteredFlights = flights.filter((flight) => {
    const matchesSearch = !searchTerm || 
      flight.tail_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      flight.aircraft_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (flight.custom_aircraft_type && flight.custom_aircraft_type.toLowerCase().includes(searchTerm.toLowerCase())) ||
      flight.origin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      flight.destinations?.some((dest) => dest.toLowerCase().includes(dest.toLowerCase()));

    const matchesAircraftType = (() => {
      const filter = filters.aircraft_type;
      if (filter === "all") return true;

      if (filter === "simulator") {
        return flight.is_simulator;
      }
      
      if (filter.endsWith("-sim")) {
        const baseType = filter.replace("-sim", "");
        const flightType = flight.custom_aircraft_type || flight.aircraft_type;
        return flight.is_simulator && flightType === baseType;
      }

      // Default case: it's a specific aircraft type
      const flightType = flight.custom_aircraft_type || flight.aircraft_type;
      return !flight.is_simulator && flightType === filter;
    })();

    const matchesModeOfFlight = filters.mode_of_flight === "all" || 
      flight.hour_breakdown?.some((hb) => hb.mode === filters.mode_of_flight);

    const matchesMissionType = filters.mission_type === "all" ||
      (flight.mission_type && String(flight.mission_type).toLowerCase() === String(filters.mission_type).toLowerCase());

    const matchesPicStatus = filters.is_pic === "all" || 
      (filters.is_pic === "true" && flight.is_pic === true) ||
      (filters.is_pic === "false" && flight.is_pic === false);

    let matchesDate = true;

    // Add: robust parsing for MM/DD/YYYY text inputs
    const parseUsDate = (str) => {
      // A valid MM/DD/YYYY needs at least 8 chars (e.g. 1/1/2000), but could be shorter if single digit month/day
      // More robust check: MM/DD/YYYY, M/D/YYYY, MM/D/YYYY, M/DD/YYYY
      if (!str || typeof str !== 'string' || str.length < 6) return null; // Smallest could be 1/1/00
      const d = parse(str, 'MM/dd/yyyy', new Date());
      // Check if parsing was successful by checking for a valid time
      return isNaN(d.getTime()) ? null : d;
    };

    if (filters.date_from || filters.date_to) {
      const flightDate = parseISO(flight.date); // flight.date is assumed to be YYYY-MM-DD or similar ISO format
      
      if (filters.date_from) {
        const fromDate = parseUsDate(filters.date_from);
        if (fromDate) { // Only apply filter if date was successfully parsed
          fromDate.setHours(0, 0, 0, 0); // Start of the day
          matchesDate = matchesDate && flightDate >= fromDate;
        }
      }
      
      if (filters.date_to) {
        const toDate = parseUsDate(filters.date_to);
        if (toDate) { // Only apply filter if date was successfully parsed
          toDate.setHours(23, 59, 59, 999); // End of the day
          matchesDate = matchesDate && flightDate <= toDate;
        }
      }
    } else if (filters.date_range !== "all" && filters.date_range !== "custom") {
      const flightDate = parseISO(flight.date);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(filters.date_range));
      matchesDate = flightDate >= cutoffDate;
    }

    return matchesSearch && matchesAircraftType && matchesModeOfFlight && matchesMissionType && matchesPicStatus && matchesDate;
  });

  // Sanitize dates to avoid Invalid time value errors inside FlightList
  const sanitizedFlights = filteredFlights.map((f) => ({
    ...f,
    date: ensureValidIsoDate(f.date),
  }));

  const totalHours = useMemo(() => {
    return filteredFlights.reduce((sum, flight) => sum + (flight.total_flight_hours || 0), 0).toFixed(1);
  }, [filteredFlights]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading flight log...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Flight Log</h1>
          <p className="text-slate-600 mt-1">
            Track and manage your flight hours and training records.
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <Link to={createPageUrl("NewFlight")}>
                <Button
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Log New Flight
                </Button>
              </Link>
            </div>
            <div className="text-sm text-slate-600 bg-white px-4 py-2 rounded-lg border">
              <strong>{filteredFlights.length}</strong> flights • <strong>{totalHours}</strong> total hours
            </div>
          </div>

          <Card className="bg-white shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filter & Search Options
              </CardTitle>
              <CardDescription>
                Use these filters to find specific flights or analyze your flight data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search flights..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
              <FlightFiltersWithMission
                filters={filters}
                setFilters={setFilters}
                flights={flights}
              />
            </CardContent>
          </Card>

          <FlightList
            flights={sanitizedFlights}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg">
              <FlightForm
                flight={editingFlight}
                user={user}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

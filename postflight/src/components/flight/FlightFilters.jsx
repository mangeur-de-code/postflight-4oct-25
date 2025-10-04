
import React, { useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function FlightFilters({ filters, setFilters, flights }) {
  const { aircraftTypes, simulatorTypes } = useMemo(() => {
    const aircraft = new Set();
    const simulators = new Set();
    
    flights.forEach(f => {
      const type = f.custom_aircraft_type || f.aircraft_type;
      if (type) {
        if (f.is_simulator) {
          simulators.add(type);
        } else {
          aircraft.add(type);
        }
      }
    });

    return {
      aircraftTypes: Array.from(aircraft).sort(),
      simulatorTypes: Array.from(simulators).sort()
    };
  }, [flights]);

  const flightModes = useMemo(() => {
    return [...new Set(flights.flatMap(f => f.hour_breakdown?.map(hb => hb.mode) || []))].filter(Boolean);
  }, [flights]);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    // If a preset date range is selected, clear custom dates
    if (key === "date_range" && value !== "custom") {
        newFilters.date_from = null;
        newFilters.date_to = null;
    }
    setFilters(newFilters);
  };

  const resetFilters = () => {
    setFilters({
      aircraft_type: "all",
      mode_of_flight: "all",
      is_pic: "all",
      date_range: "all",
      date_from: null,
      date_to: null
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Aircraft Type</label>
          <Select
            value={filters.aircraft_type}
            onValueChange={(value) => handleFilterChange("aircraft_type", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All aircraft" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectSeparator />
              <SelectItem value="simulator">All Simulators</SelectItem>
              {simulatorTypes.map(type => (
                <SelectItem key={`${type}-sim`} value={`${type}-sim`}>
                  &nbsp;&nbsp;↳ {type} Simulator
                </SelectItem>
              ))}
              <SelectSeparator />
              {aircraftTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Flight Mode</label>
          <Select
            value={filters.mode_of_flight}
            onValueChange={(value) => handleFilterChange("mode_of_flight", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All modes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modes</SelectItem>
              {flightModes.map(mode => (
                <SelectItem key={mode} value={mode}>{mode}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">PIC Status</label>
          <Select
            value={filters.is_pic}
            onValueChange={(value) => handleFilterChange("is_pic", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All flights" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Flights</SelectItem>
              <SelectItem value="true">PIC Only</SelectItem>
              <SelectItem value="false">Non-PIC Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Date Range</label>
          <Select
            value={filters.date_range}
            onValueChange={(value) => handleFilterChange("date_range", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All dates" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
              <SelectItem value="365">Last Year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filters.date_range === 'custom' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end pt-4">
          <div className="space-y-2 lg:col-start-3">
            <label htmlFor="date_from" className="text-sm font-medium text-slate-700">From</label>
            <Input
              id="date_from"
              type="date"
              value={filters.date_from || ''}
              onChange={(e) => handleFilterChange("date_from", e.target.value)}
              className="bg-white"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="date_to" className="text-sm font-medium text-slate-700">To</label>
            <Input
              id="date_to"
              type="date"
              value={filters.date_to || ''}
              onChange={(e) => handleFilterChange("date_to", e.target.value)}
              className="bg-white"
            />
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={resetFilters}
          className="flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Reset Filters
        </Button>
      </div>
    </div>
  );
}

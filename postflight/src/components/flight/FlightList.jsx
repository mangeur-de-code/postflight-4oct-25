
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Plane, MapPin, Briefcase, Route } from "lucide-react";
import { format, parseISO } from "date-fns";

const modeColors = {
  NG: "bg-blue-100 text-blue-800",
  NS: "bg-purple-100 text-purple-800",
  D: "bg-green-100 text-green-800",
  H: "bg-orange-100 text-orange-800",
  W: "bg-red-100 text-red-800",
  N: "bg-slate-100 text-slate-800",
};

const missionTypeColors = {
    Training: "bg-yellow-100 text-yellow-800",
    Combat: "bg-red-100 text-red-800",
    Support: "bg-indigo-100 text-indigo-800",
    Ferry: "bg-pink-100 text-pink-800",
    Logistics: "bg-gray-100 text-gray-800",
    Reconnaissance: "bg-blue-100 text-blue-800",
    Medevac: "bg-rose-100 text-rose-800",
}

export default function FlightList({ flights, onEdit, onDelete }) {
  if (flights.length === 0) {
    return (
      <Card className="bg-white shadow-lg border-0">
        <CardContent className="text-center py-12">
          <Plane className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No flights found</h3>
          <p className="text-slate-600">Try adjusting your search or filters</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {flights.map((flight) => {
        // Calculate additional data to display
        const hasTakeoffLanding = (flight.total_takeoffs > 0 || flight.total_landings > 0 || 
                                 flight.day_takeoffs > 0 || flight.day_landings > 0 || 
                                 flight.night_takeoffs > 0);
        
        const hasCrossCountry = (flight.cross_country_time > 0 || flight.cross_country_distance > 0);

        // Format aircraft display name
        const getAircraftDisplayName = () => {
          if (flight.is_simulator) {
            const aircraftType = flight.aircraft_type === "Custom" ? flight.custom_aircraft_type : flight.aircraft_type;
            return `${aircraftType} Simulator`;
          } else {
            return flight.aircraft_type === "Custom" ? flight.custom_aircraft_type : flight.aircraft_type;
          }
        };

        return (
          <Card key={flight.id} className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Plane className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900">
                        {getAircraftDisplayName()}
                      </span>
                      {!flight.is_simulator && (
                        <>
                          <span className="text-slate-600">•</span>
                          <span className="font-medium text-slate-700">{flight.tail_number}</span>
                        </>
                      )}
                      {flight.pilot_role && (
                        <Badge className={
                          flight.pilot_role === "PIC" ? "bg-green-100 text-green-800" :
                          flight.pilot_role === "PI" ? "bg-blue-100 text-blue-800" :
                          "bg-slate-100 text-slate-800"
                        }>
                          {flight.pilot_role}
                        </Badge>
                      )}
                      {flight.mission_type && (
                           <Badge className={missionTypeColors[flight.mission_type] || "bg-gray-100 text-gray-800"}>
                              <Briefcase className="w-3 h-3 mr-1" />
                              {flight.mission_type === "Custom mission" ? flight.custom_mission_type || "Custom mission" : flight.mission_type}
                          </Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mt-1">
                      {format(parseISO(flight.date), "MMMM d, yyyy")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(flight)}
                    className="hover:bg-blue-50"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(flight.id)}
                    className="hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Route</p>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span className="text-sm text-slate-700">
                      {flight.is_simulator ? "Simulator Session" : `${flight.origin} → ${flight.destinations?.join(" → ")}`}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Mode Breakdown</p>
                  <div className="flex flex-wrap gap-1">
                    {flight.hour_breakdown?.map((item, idx) => (
                      <Badge key={`${item.mode}-${idx}`} className={modeColors[item.mode] || "bg-slate-100 text-slate-800"}>
                        {item.mode}{item.seat_position ? ` (${item.seat_position})` : ''}: {item.duration}h
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Hours</p>
                  <p className="text-sm font-medium text-slate-900">{flight.total_flight_hours?.toFixed(1)}h</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Co-pilot</p>
                  <p className="text-sm text-slate-700">{flight.copilot_name || "—"}</p>
                </div>
              </div>

              {/* Additional data row for takeoffs/landings and cross country */}
              {(hasTakeoffLanding || hasCrossCountry) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100">
                  {hasTakeoffLanding && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Takeoffs & Landings</p>
                      <div className="text-sm text-slate-700 space-y-1">
                        {/* Day T/O and Landings */}
                        {(flight.total_takeoffs > 0 || flight.day_takeoffs > 0) && (
                          <div>Day: {flight.total_takeoffs > 0 && `${flight.total_takeoffs} T/O`}{flight.total_takeoffs > 0 && flight.day_takeoffs > 0 && ', '}{flight.day_takeoffs > 0 && `${flight.day_takeoffs} LDG`}</div>
                        )}
                        {/* Night T/O and Landings */}
                        {(flight.total_landings > 0 || flight.day_landings > 0) && (
                          <div>Night: {flight.total_landings > 0 && `${flight.total_landings} T/O`}{flight.total_landings > 0 && flight.day_landings > 0 && ', '}{flight.day_landings > 0 && `${flight.day_landings} LDG`}</div>
                        )}
                        {/* Total Landings */}
                        {flight.night_takeoffs > 0 && (
                          <div>Total Landings: {flight.night_takeoffs}</div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {hasCrossCountry && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Cross Country</p>
                      <div className="flex items-center gap-1">
                        <Route className="w-3 h-3 text-slate-400" />
                        <span className="text-sm text-slate-700">
                          {flight.cross_country_time > 0 && `${flight.cross_country_time}h`}
                          {flight.cross_country_time > 0 && flight.cross_country_distance > 0 && ' • '}
                          {flight.cross_country_distance > 0 && `${flight.cross_country_distance} mi`}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {flight.remarks && (
                <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Remarks</p>
                  <p className="text-sm text-slate-700">{flight.remarks}</p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

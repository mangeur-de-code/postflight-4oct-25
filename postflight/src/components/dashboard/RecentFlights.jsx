
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, parseISO } from "date-fns";
import { Plane, Calendar, User, ArrowRight, Plus, TrendingUp, Users, Edit } from "lucide-react";

const modeColors = {
  NG: "bg-blue-100 text-blue-800",
  NS: "bg-purple-100 text-purple-800",
  D: "bg-green-100 text-green-800",
  H: "bg-orange-100 text-orange-800",
  W: "bg-red-100 text-red-800",
  N: "bg-slate-100 text-slate-800"
};

export default function RecentFlights({ flights, onEditFlight }) {
  // Return only the Recent Flights card, no Quick Actions card
  if (flights.length === 0) {
    return (
      <Card className="bg-white shadow-lg border-0">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">
            Recent Flights
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Plane className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 mb-4">No flights logged yet</p>
          <Link to={createPageUrl("FlightLog")}>
            <Button className="bg-blue-600 hover:bg-blue-700">
              Log Your First Flight
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const handleEditClick = (flight, e) => {
    e.preventDefault(); // Prevent any default behavior
    e.stopPropagation(); // Stop event bubbling
    onEditFlight(flight);
  };

  return (
    <Card className="bg-white shadow-lg border-0">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold text-slate-900">
          Recent Flights
        </CardTitle>
        <Link to={createPageUrl("FlightLog")}>
          <Button variant="outline" size="sm">
            View All
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {flights.map((flight) => (
            <div 
              key={flight.id} 
              className="border-b border-slate-100 pb-4 last:border-b-0 hover:bg-slate-50 rounded-lg p-2 -m-2 transition-colors cursor-pointer"
              onClick={() => onEditFlight(flight)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Plane className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">
                        {flight.aircraft_type} {flight.tail_number}
                      </span>
                      {flight.is_pic && (
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          PIC
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-600">
                      {flight.origin} → {flight.destinations?.join(", ")}
                    </p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={modeColors[flight.mode_of_flight]}>
                        {flight.mode_of_flight}
                      </Badge>
                      <span className="font-medium text-slate-900">
                        {flight.total_flight_hours?.toFixed(1)}h
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {format(parseISO(flight.date), "MMM d, yyyy")}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 hover:bg-slate-200 transition-all"
                    onClick={(e) => handleEditClick(flight, e)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

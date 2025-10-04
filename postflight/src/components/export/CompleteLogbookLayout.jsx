import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, parseISO } from "date-fns";

const ALL_MODES = ["D", "N", "NG", "NS", "H", "W"];

export default function CompleteLogbookLayout({ flights, user }) {
    if (!flights || flights.length === 0) {
        return <p>No flight data available for this period.</p>;
    }
    const displayName = user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : (user?.full_name || 'Pilot');

    return (
        <div className="p-4 bg-white text-black">
            <h1 className="text-3xl font-bold mb-2">Complete Flight Logbook</h1>
            <h2 className="text-xl text-gray-700 mb-6">{displayName}</h2>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Aircraft</TableHead>
                        <TableHead>Route</TableHead>
                        <TableHead>Role</TableHead>
                        {ALL_MODES.map(mode => <TableHead key={mode} className="text-right">{mode}</TableHead>)}
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead>T/O & Land</TableHead>
                        <TableHead>X-Country</TableHead>
                        <TableHead>Remarks</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {flights.map(flight => {
                        const hoursByMode = (flight.hour_breakdown || []).reduce((acc, item) => {
                            acc[item.mode] = item.duration;
                            return acc;
                        }, {});

                        const takeoffLandingInfo = `D:${flight.total_takeoffs || 0}/${flight.day_takeoffs || 0}, N:${flight.total_landings || 0}/${flight.day_landings || 0}`;

                        return (
                            <TableRow key={flight.id} className="page-break-inside-avoid">
                                <TableCell className="text-xs whitespace-nowrap">{format(parseISO(flight.date), "yy-MM-dd")}</TableCell>
                                <TableCell className="text-xs whitespace-nowrap">{flight.is_simulator ? 'SIM:' : ''}{flight.custom_aircraft_type || flight.aircraft_type} {flight.tail_number}</TableCell>
                                <TableCell className="text-xs whitespace-nowrap">{flight.origin} → {flight.destinations?.join(' → ')}</TableCell>
                                <TableCell className="text-xs">{flight.pilot_role || (flight.is_pic ? 'PIC' : 'PI')}</TableCell>
                                {ALL_MODES.map(mode => (
                                    <TableCell key={mode} className="text-right text-xs">{(hoursByMode[mode] || 0).toFixed(1)}</TableCell>
                                ))}
                                <TableCell className="text-right text-xs font-semibold">{flight.total_flight_hours.toFixed(1)}</TableCell>
                                <TableCell className="text-xs">{takeoffLandingInfo}</TableCell>
                                <TableCell className="text-xs">{flight.cross_country_time > 0 ? `${flight.cross_country_time.toFixed(1)}h` : '-'}</TableCell>
                                <TableCell className="text-xs max-w-[200px] whitespace-normal break-words">{flight.remarks}</TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
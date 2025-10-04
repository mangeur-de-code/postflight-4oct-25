import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO } from "date-fns";

const ALL_MODES = ["D", "N", "NG", "NS", "H", "W"];

const CertificateInfoCard = ({ user }) => {
    if (!user || !user.certificate_info) return null;

    const {
        ftn,
        solo_date,
        certificate_type,
        issued_by,
        date_issued,
        certificate_number,
        cfi_expiration_date
    } = user.certificate_info;

    const Field = ({ label, value }) => value ? (
        <div className="flex flex-col">
            <span className="text-xs text-gray-600">{label}</span>
            <span className="font-medium text-sm">{value}</span>
        </div>
    ) : null;

    return (
        <Card className="shadow-none border">
            <CardHeader>
                <CardTitle>Certificate Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Field label="Certificate Type" value={certificate_type} />
                <Field label="Certificate #" value={certificate_number} />
                <Field label="Issued By" value={issued_by} />
                <Field label="Date Issued" value={date_issued ? format(parseISO(date_issued), "yyyy-MM-dd") : null} />
                <Field label="FTN" value={ftn} />
                <Field label="Solo Date" value={solo_date ? format(parseISO(solo_date), "yyyy-MM-dd") : null} />
                {cfi_expiration_date && <Field label="CFI Expiration" value={format(parseISO(cfi_expiration_date), "yyyy-MM-dd")} />}
            </CardContent>
        </Card>
    );
};

export default function PublicLogbookLayout({ user, flights }) {
    const displayName = user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : (user?.full_name || 'Pilot');

    const columnTotals = (flights || []).reduce((acc, flight) => {
        acc.total_flight_hours = (acc.total_flight_hours || 0) + (flight.total_flight_hours || 0);
    
        (flight.hour_breakdown || []).forEach(item => {
            if (ALL_MODES.includes(item.mode)) {
                acc[item.mode] = (acc[item.mode] || 0) + (item.duration || 0);
            }
        });
    
        return acc;
    }, { total_flight_hours: 0 });

    let dateRangeString = "";
    if (flights && flights.length > 0) {
        const flightDates = flights.map(f => parseISO(f.date));
        const minDate = new Date(Math.min.apply(null, flightDates));
        const maxDate = new Date(Math.max.apply(null, flightDates));
        
        if (!isNaN(minDate.getTime()) && !isNaN(maxDate.getTime())) {
            dateRangeString = `${format(minDate, 'MMMM d, yyyy')} - ${format(maxDate, 'MMMM d, yyyy')}`;
        }
    }

    return (
        <div className="p-4 bg-white text-black">
            <div className="h-screen flex flex-col justify-center items-center text-center page-break-after">
                <div>
                    <h1 className="text-4xl font-bold mb-4">{displayName}</h1>
                    <h2 className="text-2xl text-gray-700 mb-4">Public Flight Logbook</h2>
                    {dateRangeString && (
                        <p className="text-lg text-gray-600 mb-12">{dateRangeString}</p>
                    )}
                    <CertificateInfoCard user={user} />
                </div>
            </div>

            <div className="flex flex-col">
                <div className="flex-grow">
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">Flight Log</h2>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Flight Info</TableHead>
                                {ALL_MODES.map(mode => (
                                    <TableHead key={mode} className="text-right">{mode}</TableHead>
                                ))}
                                <TableHead className="text-right font-bold">Total</TableHead>
                                <TableHead>Remarks</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(flights || []).map(flight => {
                                const hoursByMode = (flight.hour_breakdown || []).reduce((acc, item) => {
                                    acc[item.mode] = item.duration;
                                    return acc;
                                }, {});

                                return (
                                    <TableRow key={flight.id} className="page-break-inside-avoid">
                                        <TableCell>{format(parseISO(flight.date), "yyyy-MM-dd")}</TableCell>
                                        <TableCell>
                                            <div className="font-semibold">{flight.is_simulator ? 'SIM:' : ''}{flight.custom_aircraft_type || flight.aircraft_type} {flight.tail_number}</div>
                                            <div className="text-xs text-gray-600">{flight.origin} → {flight.destinations?.join(', ')}</div>
                                        </TableCell>
                                        {ALL_MODES.map(mode => (
                                            <TableCell key={mode} className="text-right">
                                                {(hoursByMode[mode] || 0).toFixed(1)}
                                            </TableCell>
                                        ))}
                                        <TableCell className="text-right font-semibold">{flight.total_flight_hours.toFixed(1)}</TableCell>
                                        <TableCell className="text-xs max-w-[200px] whitespace-normal break-words">{flight.remarks}</TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
                
                <div className="pt-4 mt-auto page-break-inside-avoid">
                     <Table>
                        <TableFooter>
                            <TableRow className="bg-slate-50 font-bold border-t-2 border-black">
                                <TableCell colSpan={2} className="text-left text-sm pl-4">Grand Totals</TableCell>
                                {ALL_MODES.map(mode => (
                                    <TableCell key={mode} className="text-right text-sm">
                                        <span className="font-normal text-gray-500">{mode}: </span>
                                        <span>{(columnTotals[mode] || 0).toFixed(1)}</span>
                                    </TableCell>
                                ))}
                                <TableCell className="text-right text-sm">
                                    <span className="font-normal text-gray-500">Total: </span>
                                    <span>{(columnTotals.total_flight_hours || 0).toFixed(1)}</span>
                                </TableCell>
                                <TableCell />
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>
            </div>
        </div>
    );
}
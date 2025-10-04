import React, { useMemo } from 'react';
import { format, parseISO } from "date-fns";

const Section = ({ title, children, className = '' }) => (
    <div className={`border border-black p-1 ${className}`}>
        {title && <h3 className="font-bold text-xs uppercase text-center mb-1">{title}</h3>}
        {children}
    </div>
);

const Field = ({ label, value, className = '', border = 'b', small = false }) => (
    <div className={`flex flex-col border-${border} border-black px-1 ${className}`}>
        <span className="text-gray-500" style={{ fontSize: '6px', lineHeight: '1.2' }}>{label}</span>
        <span className={`font-semibold ${small ? 'text-xs' : 'text-sm'}`}>{value !== null && value !== undefined ? value : ''}</span>
    </div>
);

const Grid = ({ children, cols = 2 }) => <div className={`grid grid-cols-${cols} border-t border-l border-r border-black`}>{children}</div>;

export default function FAA8710Layout({ user, flights }) {
    const data = useMemo(() => {
        const totals = {
            cross_country_pic: 0,
            cross_country_total: 0,
            night_pic: 0,
            night_takeoff_landing: 0,
            instrument_actual: 0,
            instrument_simulated: 0,
            total_pic: 0,
            total_sic: 0,
            total_flight_time: 0,
            total_dual_received: 0, // No data for this
            total_instructor: 0,    // No data for this
        };

        flights.forEach(f => {
            const isPIC = f.pilot_role === 'PIC';
            totals.total_flight_time += f.total_flight_hours || 0;

            if (isPIC) {
                totals.total_pic += f.total_flight_hours || 0;
                totals.cross_country_pic += f.cross_country_time || 0;
            } else {
                totals.total_sic += f.total_flight_hours || 0;
            }

            totals.cross_country_total += f.cross_country_time || 0;
            totals.night_takeoff_landing += f.total_landings || 0; // Assuming total_landings is night T/O

            f.hour_breakdown?.forEach(hb => {
                if (hb.mode === 'N' || hb.mode === 'NG' || hb.mode === 'NS') {
                    if (isPIC) totals.night_pic += hb.duration || 0;
                }
                if (hb.mode === 'W') totals.instrument_actual += hb.duration || 0;
                if (hb.mode === 'H') totals.instrument_simulated += hb.duration || 0;
            });
        });

        return Object.fromEntries(Object.entries(totals).map(([key, value]) => [key, value.toFixed(1)]));
    }, [flights]);

    const displayName = user?.first_name && user?.last_name ? `${user.first_name} ${user.middle_name || ''} ${user.last_name}` : (user?.full_name || 'Pilot');

    return (
        <div className="p-2 bg-white text-black" style={{ fontSize: '10px' }}>
            <h1 className="text-lg font-bold text-center">PILOT LOGBOOK - FAA 8710 Summary</h1>
            <h2 className="text-md text-center text-gray-700 mb-4">{displayName}</h2>

            <Section title="I. CERTIFICATES AND RATINGS">
                <Grid cols={3}>
                    <Field label="GRADE OF CERTIFICATE" value={user.certificate_info?.certificate_type} />
                    <Field label="CERTIFICATE NO." value={user.certificate_info?.certificate_number} />
                    <Field label="DATE ISSUED" value={user.certificate_info?.date_issued} />
                </Grid>
            </Section>

            <Section title="III. RECORD OF FLIGHT TIME" className="mt-4">
                <Grid cols={1}>
                    <Field label="TOTAL FLIGHT TIME" value={data.total_flight_time} className="text-center" />
                </Grid>
                <Grid cols={2}>
                    <Field label="TOTAL PILOT IN COMMAND" value={data.total_pic} />
                    <Field label="TOTAL SECOND IN COMMAND" value={data.total_sic} />
                    <Field label="TOTAL DUAL RECEIVED" value={data.total_dual_received} />
                    <Field label="TOTAL INSTRUCTOR" value={data.total_instructor} />
                </Grid>
                <Grid cols={1}>
                     <div className="border-b border-black text-center py-1 font-bold text-xs">CROSS COUNTRY</div>
                </Grid>
                <Grid cols={2}>
                    <Field label="TOTAL X-C" value={data.cross_country_total} />
                    <Field label="PIC X-C" value={data.cross_country_pic} />
                </Grid>
                <Grid cols={1}>
                     <div className="border-b border-black text-center py-1 font-bold text-xs">NIGHT</div>
                </Grid>
                <Grid cols={2}>
                    <Field label="TOTAL NIGHT PIC" value={data.night_pic} />
                    <Field label="NIGHT T/O & LDG" value={data.night_takeoff_landing} />
                </Grid>
                <Grid cols={1}>
                     <div className="border-b border-black text-center py-1 font-bold text-xs">INSTRUMENT</div>
                </Grid>
                <Grid cols={2}>
                    <Field label="ACTUAL" value={data.instrument_actual} />
                    <Field label="SIMULATED / HOOD" value={data.instrument_simulated} />
                </Grid>
            </Section>

            <div className="mt-8 text-xs text-gray-600">
                <p>
                    I certify that the statements made by me on this form are true. This summary is generated based on the flight records entered into PostFlight.io.
                </p>
                <div className="flex justify-between mt-8 pt-4 border-t border-black">
                    <span>SIGNATURE</span>
                    <span>DATE</span>
                </div>
            </div>
        </div>
    );
}
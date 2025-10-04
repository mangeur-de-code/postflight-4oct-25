
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ['#024950', '#0fa4af', '#964734', '#afdde5', '#003135', '#5E9A9E'];

const StatsCardPrint = ({ title, value, subtitle }) => (
    <Card className="shadow-none border page-break-inside-avoid">
        <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-gray-600">{title}</p>
                    <p className="text-2xl font-bold mt-1">{value}</p>
                    {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
                </div>
            </div>
        </CardHeader>
    </Card>
);

export default function ExperienceReportLayout({ user, reportData }) {
    const displayName = user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : (user?.full_name || 'Pilot');
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
        const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
        return (
            <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="12">
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    return (
        <div className="p-4 bg-white text-black">
            <h1 className="text-3xl font-bold mb-2">Experience Report</h1>
            <h2 className="text-xl text-gray-700 mb-6">{displayName}</h2>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <StatsCardPrint title="Total Flight Hours" value={reportData.totalHours} subtitle="Aircraft + Simulator" />
                <StatsCardPrint title="Aircraft Hours" value={reportData.aircraftHours} subtitle="Real aircraft only" />
                <StatsCardPrint title="PIC Hours" value={reportData.picHours} subtitle="Pilot in command" />
                <StatsCardPrint title="Simulator Hours" value={reportData.simulatorHours} subtitle="Total simulator hrs" />
                <StatsCardPrint title="Cross Country Time" value={`${reportData.crossCountryTime}h`} subtitle="Total cross country hrs" />
                <StatsCardPrint title="Cross Country Distance" value={`${reportData.crossCountryDistance} mi`} subtitle="Total distance flown" />
            </div>

            <div className="grid grid-cols-1 gap-8">
                <Card className="shadow-none border page-break-inside-avoid">
                    <CardHeader><CardTitle>Monthly Flight Hours</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={reportData.monthlyHours}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" fontSize="10" />
                                <YAxis fontSize="10" />
                                <Tooltip />
                                <Bar dataKey="aircraft" stackId="a" fill="#024950" name="Aircraft" />
                                <Bar dataKey="simulator" stackId="a" fill="#0fa4af" name="Simulator" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card className="shadow-none border page-break-inside-avoid">
                    <CardHeader><CardTitle>Aircraft & Simulator Types</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie data={reportData.aircraftTypes} cx="50%" cy="50%" labelLine={false} label={renderCustomizedLabel} outerRadius={80} fill="#8884d8" dataKey="hours" nameKey="name">
                                    {reportData.aircraftTypes.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip formatter={(value) => [`${parseFloat(value).toFixed(1)}h`, "Hours"]} />
                                <Legend wrapperStyle={{fontSize: "12px"}} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

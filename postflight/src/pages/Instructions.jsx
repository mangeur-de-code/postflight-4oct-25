import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { FileText, Upload, Settings, ArrowRight, Edit, Trash2, Users, Share2, Download, Award, Target, User as UserIcon } from 'lucide-react';

export default function InstructionsPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Getting Started with PostFlight.io</h1>
          <p className="text-slate-600 mt-1">
            Follow these simple guides to log flights, configure your profile, and use the advanced features.
          </p>
        </div>

        <div className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Logging Your Flights</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Manual Entry Instructions */}
                <Card className="bg-white shadow-lg border-0">
                    <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <FileText className="w-6 h-6 text-primary" />
                        <div>
                        <h3 className="text-xl font-semibold">Method 1: Manual Entry</h3>
                        <p className="text-sm font-normal text-slate-500">For logging individual flights.</p>
                        </div>
                    </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-sm">1</div>
                            <p className="text-slate-700">Navigate to the <Link to={createPageUrl("FlightLog")} className="font-medium text-primary hover:underline">Flight Log</Link> page.</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-sm">2</div>
                            <p className="text-slate-700">Click <span className="font-semibold text-slate-900">"New Flight Entry"</span> to open the form.</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-sm">3</div>
                            <p className="text-slate-700">Fill in all details, such as date, aircraft, route, and hours breakdown.</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-sm">4</div>
                            <p className="text-slate-700">Click <span className="font-semibold text-slate-900">"Save Flight"</span>. Your new flight will appear in the log.</p>
                        </div>
                    </CardContent>
                </Card>

                {/* CSV Upload Instructions */}
                <Card className="bg-white shadow-lg border-0">
                    <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <Upload className="w-6 h-6 text-primary" />
                        <div>
                        <h3 className="text-xl font-semibold">Method 2: CSV Upload</h3>
                        <p className="text-sm font-normal text-slate-500">For bulk importing multiple flights.</p>
                        </div>
                    </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-sm">1</div>
                            <p className="text-slate-700">Export your logbook from another program as a CSV file with headers.</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-sm">2</div>
                            <p className="text-slate-700">Go to <Link to={createPageUrl("UploadFlights")} className="font-medium text-primary hover:underline">Upload Flights</Link> and upload your file.</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-sm">3</div>
                            <p className="text-slate-700">Map your CSV columns to the flight log fields, then preview the data.</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-sm">4</div>
                            <p className="text-slate-700">Click <span className="font-semibold text-slate-900">"Import Flights"</span> to add them to your logbook.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
        
        {/* Profile Setup Instructions */}
        <div className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Profile & Requirements Setup</h2>
            <Card className="bg-white shadow-lg border-0">
                <CardHeader>
                    <CardTitle>Configuration Steps</CardTitle>
                    <CardDescription>Essential for personalized dashboard tracking and reporting.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-slate-700">Your profile and requirements are split between two pages for clarity:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-4 bg-slate-50 rounded-lg border">
                            <div className="font-semibold text-slate-900 mb-2 flex items-center gap-2"><UserIcon className="w-4 h-4"/>Profile Page</div>
                            <ul className="list-disc list-inside text-slate-700 space-y-1 text-sm">
                                <li><strong>Personal:</strong> Name, rank, license number.</li>
                                <li><strong>Certificate:</strong> FTN, issue dates, certificate type.</li>
                                <li><strong>Ratings:</strong> Class ratings and endorsements.</li>
                                <li><strong>Custom Fields:</strong> Track certifications or events with expiry dates.</li>
                                <li><strong>Data:</strong> Bulk data management and public sharing.</li>
                            </ul>
                            <Link to={createPageUrl("Profile")} className="mt-3 inline-block">
                                <Button variant="outline" size="sm">Go to Profile <ArrowRight className="w-3 h-3 ml-2"/></Button>
                            </Link>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-lg border">
                            <div className="font-semibold text-slate-900 mb-2 flex items-center gap-2"><Target className="w-4 h-4"/>Requirements Page</div>
                            <ul className="list-disc list-inside text-slate-700 space-y-1 text-sm">
                                <li><strong>Currency:</strong> Define NG/NS hours needed within a set period.</li>
                                <li><strong>Semi-annual:</strong> Set your two annual periods, total required flight and simulator hours, and custom hour minimums.</li>
                            </ul>
                            <Link to={createPageUrl("Requirements")} className="mt-3 inline-block">
                                <Button variant="outline" size="sm">Go to Requirements <ArrowRight className="w-3 h-3 ml-2"/></Button>
                            </Link>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Flight Groups */}
        <div className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Flight Groups</h2>
             <Card className="bg-white shadow-lg border-0">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3"><Users className="w-6 h-6 text-primary"/>Connecting with Your Team</CardTitle>
                    <CardDescription>Coordinate with your team, track flight readiness, and foster friendly competition.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-sm">1</div>
                        <p className="text-slate-700">Visit the <Link to={createPageUrl("FlightGroup")} className="font-medium text-primary hover:underline">Flight Groups</Link> page.</p>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-sm">2</div>
                        <p className="text-slate-700">Click <span className="font-semibold text-slate-900">"Create Group"</span> or search for an existing group by name or ID code.</p>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-sm">3</div>
                        <p className="text-slate-700">Once joined, you can view member NVG currency, semi-annual progress, and flight hour leaderboards.</p>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Data Management & Sharing */}
        <div className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Advanced Data Management</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="bg-white shadow-lg border-0">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3"><Edit className="w-5 h-5 text-primary"/>Bulk Edit</CardTitle>
                        <CardDescription>Fix imported data or update multiple entries at once from the <Link to={createPageUrl("Profile")} className="font-medium text-primary hover:underline">Profile</Link> → <span className="font-semibold">Data</span> tab.</CardDescription>
                    </CardHeader>
                </Card>
                <Card className="bg-white shadow-lg border-0">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3"><Trash2 className="w-5 h-5 text-primary"/>Bulk Delete</CardTitle>
                        <CardDescription>Remove all flights for a specific aircraft type from the <Link to={createPageUrl("Profile")} className="font-medium text-primary hover:underline">Profile</Link> → <span className="font-semibold">Data</span> tab. This is permanent!</CardDescription>
                    </CardHeader>
                </Card>
            </div>
            <Card className="bg-white shadow-lg border-0 mt-8">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3"><Share2 className="w-5 h-5 text-primary"/>Public Logbook Sharing</CardTitle>
                    <CardDescription>Enable sharing to get a private, read-only link to your logbook.</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-slate-700">
                    <p>Go to <Link to={createPageUrl("Profile")} className="font-medium text-primary hover:underline">Profile</Link> → <span className="font-semibold">Data</span> tab and use the toggle to enable sharing and copy your unique link.</p>
                </CardContent>
            </Card>
        </div>

        {/* PWA Install */}
        <div className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Install as an App</h2>
            <Card className="bg-white shadow-lg border-0">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3"><Download className="w-5 h-5 text-primary"/>Use PostFlight.io Offline</CardTitle>
                    <CardDescription>Install PostFlight.io on your device for a faster, app-like experience with offline access.</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-slate-700">
                    <p>Click the user icon in the top-right corner of the navigation bar and select <span className="font-semibold">"Install App"</span> from the dropdown menu.</p>
                </CardContent>
            </Card>
        </div>

        <Card className="bg-white shadow-lg border-0">
            <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900">Ready to Get Started?</h3>
                    <p className="text-slate-600 mt-1">Head over to your flight log to start adding entries.</p>
                </div>
                <Link to={createPageUrl("FlightLog")}>
                    <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                        Go to Flight Log
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </Link>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
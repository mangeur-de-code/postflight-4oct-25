import React, { useState, useEffect } from 'react';
import { getPublicLogbookData } from '@/api/functions';
import PublicLogbookLayout from '../components/export/PublicLogbookLayout';
import { AlertTriangle, Plane } from 'lucide-react';

export default function PublicLogbookPage() {
    const [logbookData, setLogbookData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLogbookData = async () => {
            try {
                const urlParams = new URLSearchParams(window.location.search);
                const userId = urlParams.get('user');

                if (!userId) {
                    setError("No user specified for logbook view.");
                    setLoading(false);
                    return;
                }

                const { data, error: apiError } = await getPublicLogbookData({ userId });
                
                if (apiError || !data) {
                    throw new Error(apiError?.message || "Failed to load logbook data. Sharing may be disabled.");
                }

                setLogbookData(data);
            } catch (err) {
                setError(err.message || "An unexpected error occurred.");
            } finally {
                setLoading(false);
            }
        };

        fetchLogbookData();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center text-center">
                <div>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading Public Logbook...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center text-center p-4">
                <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-800">Unable to Display Logbook</h2>
                    <p className="text-slate-600 mt-2">{error}</p>
                </div>
            </div>
        );
    }

    if (!logbookData || !logbookData.flights || logbookData.flights.length === 0) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center text-center p-4">
                <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
                    <Plane className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-800">No Flights Logged</h2>
                    <p className="text-slate-600 mt-2">This pilot has not logged any public flights yet.</p>
                </div>
            </div>
        );
    }
    
    // Add a footer with a link back to PostFlight.io
    return (
        <div className="bg-slate-100 min-h-screen p-4 sm:p-8">
            <div className="max-w-6xl mx-auto bg-white shadow-2xl">
                 <PublicLogbookLayout user={logbookData.user} flights={logbookData.flights} />
            </div>
            <footer className="text-center mt-8 text-sm text-slate-500">
                <p>
                    Logbook powered by <a href="https://postflight.io" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-semibold">PostFlight.io</a>
                </p>
            </footer>
        </div>
    );
}
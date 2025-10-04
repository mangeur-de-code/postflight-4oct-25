
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Plane, AlertTriangle, ArrowLeft, CheckCircle } from "lucide-react";

export default function ImportPreview({ previewData, onImport, onCancel, loading, importProgress, loadingMessage }) {
    const validFlights = previewData.filter(f => f.errors.length === 0);
    const invalidFlights = previewData.filter(f => f.errors.length > 0);

    return (
        <Card className="bg-white shadow-lg border-0">
            <CardHeader>
                <CardTitle>Step 3: Preview and Confirm</CardTitle>
                <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Ready to Import!</AlertTitle>
                    <AlertDescription>
                        Found <strong>{validFlights.length}</strong> valid flights to import. 
                        {invalidFlights.length > 0 && ` Found ${invalidFlights.length} rows with errors that will be skipped.`}
                        <br />
                        <span className="text-sm text-amber-600 mt-1 block">
                            Note: Import may take several minutes for large datasets due to rate limiting.
                        </span>
                    </AlertDescription>
                </Alert>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Data Preview (First 5 Rows)</h3>
                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Aircraft</TableHead>
                                    <TableHead>Hours</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Simulator</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {validFlights.slice(0, 5).map((flight, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{flight.date}</TableCell>
                                        <TableCell>{flight.custom_aircraft_type || flight.aircraft_type}</TableCell>
                                        <TableCell>{flight.total_flight_hours?.toFixed(1)}</TableCell>
                                        <TableCell><Badge>{flight.pilot_role}</Badge></TableCell>
                                        <TableCell>{flight.is_simulator ? 'Yes' : 'No'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {invalidFlights.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold text-red-600 mb-2">Skipped Rows with Errors</h3>
                        <div className="border rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                            <Table>
                                <TableHeader className="bg-red-50">
                                    <TableRow>
                                        <TableHead>Row #</TableHead>
                                        <TableHead>Errors</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {previewData.map((flight, index) => flight.errors.length > 0 && (
                                        <TableRow key={index}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell>
                                                <ul className="list-disc list-inside">
                                                    {flight.errors.map((err, i) => <li key={i} className="text-xs text-red-700">{err}</li>)}
                                                </ul>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}
                 {loading && (
                    <div className="space-y-3">
                      <Progress value={importProgress} className="w-full" />
                      <div className="text-center">
                          <p className="text-slate-600 text-sm">{loadingMessage}</p>
                          <p className="text-xs text-slate-500 mt-1">
                              Please keep this page open until import completes
                          </p>
                      </div>
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={onCancel} disabled={loading}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Mapping
                </Button>
                <Button
                    onClick={onImport}
                    disabled={loading || validFlights.length === 0}
                    className="bg-green-600 hover:bg-green-700"
                >
                    <Plane className="w-4 h-4 mr-2" />
                    {loading ? "Importing..." : `Import ${validFlights.length} Flights`}
                </Button>
            </CardFooter>
        </Card>
    );
}

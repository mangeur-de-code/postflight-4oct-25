import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, ArrowRight, Info, CheckCircle } from "lucide-react";

// The fields we require the user to map from their CSV
const requiredFlightFields = [
    { key: 'date', label: 'Flight Date', description: 'The date the flight occurred.' },
    { key: 'aircraft_type', label: 'Aircraft Type & Seat', description: 'e.g., "UH-60 (L)" or "SIM".' },
    { key: 'total_flight_hours', label: 'Total Flight Hours', description: 'A number representing total hours.' },
    { key: 'pilot_role', label: 'Pilot Role', description: 'e.g., "PIC", "PI", "CP".' },
];

// Optional fields
const optionalFlightFields = [
    { key: 'tail_number', label: 'Tail Number', description: 'Aircraft tail or registration number.' },
    { key: 'origin', label: 'Origin', description: 'Departure location or airport code.' },
    { key: 'destinations', label: 'Destination(s)', description: 'Arrival location or airport code.' },
    { key: 'mission_type', label: 'Mission Type', description: 'e.g., "Training", "Combat".' },
    { key: 'hour_breakdown_mode', label: 'Flight Mode/Condition', description: 'e.g., "NG", "NS", "Day", "Hood".' },
    { key: 'seat_position', label: 'Seat Position', description: 'e.g., "Left", "Right", "Front", "Back".' },
    { key: 'remarks', label: 'Remarks', description: 'Any notes about the flight.' },
];

export default function CsvFieldMapper({ csvHeaders, onMappingComplete, onBack }) {
    const [mappings, setMappings] = useState({});
    const [error, setError] = useState(null);

    const handleMappingChange = (flightFieldKey, csvHeader) => {
        setMappings(prev => ({ ...prev, [flightFieldKey]: csvHeader }));
    };

    const handleSubmit = () => {
        const missingRequired = requiredFlightFields.some(field => !mappings[field.key]);
        if (missingRequired) {
            setError("Please map all required fields to continue.");
            return;
        }
        setError(null);
        onMappingComplete(mappings);
    };

    const renderMappingRow = (field) => (
        <TableRow key={field.key}>
            <TableCell>
                <p className="font-medium text-slate-900">{field.label}</p>
                <p className="text-xs text-slate-500">{field.description}</p>
            </TableCell>
            <TableCell>
                <Select onValueChange={(value) => handleMappingChange(field.key, value)} value={mappings[field.key]}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a column..." />
                    </SelectTrigger>
                    <SelectContent>
                        {csvHeaders.filter(h => h && h.trim()).map(header => (
                            <SelectItem key={header} value={header}>{header}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </TableCell>
            <TableCell className="text-center">
                {mappings[field.key] && <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />}
            </TableCell>
        </TableRow>
    );

    return (
        <Card className="bg-white shadow-lg border-0">
            <CardHeader>
                <CardTitle>Step 2: Map Your CSV Columns</CardTitle>
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Instructions</AlertTitle>
                    <AlertDescription>
                        For each Flight Log field on the left, select the corresponding column header from your uploaded CSV file on the right.
                    </AlertDescription>
                </Alert>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Required Fields</h3>
                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead>Flight Log Field</TableHead>
                                    <TableHead>Your CSV Column</TableHead>
                                    <TableHead className="text-center w-20">Mapped</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requiredFlightFields.map(renderMappingRow)}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Optional Fields</h3>
                     <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead>Flight Log Field</TableHead>
                                    <TableHead>Your CSV Column</TableHead>
                                    <TableHead className="text-center w-20">Mapped</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {optionalFlightFields.map(renderMappingRow)}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={onBack}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </Button>
                <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
                    Preview Data
                    <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </CardFooter>
        </Card>
    );
}
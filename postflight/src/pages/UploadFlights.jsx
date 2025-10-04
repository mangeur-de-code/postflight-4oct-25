
import React, { useState, useRef } from "react";
import { Flight } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; // Label is still used by `Input` but not directly clicked by user
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle, Upload, FileText, ArrowLeft, Plane } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import CsvFieldMapper from "../components/flight/CsvFieldMapperV2";
import ImportPreview from "../components/flight/ImportPreview";

// --- Data Parsing Helpers (retained and adapted for dynamic mapping) ---

const parseFlightDate = (dateString) => {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    // Adjust for timezone offset to prevent day-behind errors
    const tzOffset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() + tzOffset);
    return localDate.toISOString().split('T')[0];
  } catch (e) {
    return null;
  }
};

const determineAircraftType = (aircraftString) => {
  if (!aircraftString) return "Custom";
  const acft = aircraftString.toString().trim().toUpperCase();
  const knownTypes = ["UH-60", "HH-60", "UH-72", "CH-47", "C-12", "AH-64", "AH-64E"];
  return knownTypes.includes(acft) ? acft : "Custom";
};

const parseAircraftAndSeat = (acftString) => {
  if (!acftString) return { aircraftType: "Custom", seatPosition: null, customAircraftType: "", is_simulator: false };
  let processedString = acftString.toUpperCase();
  let isSimulator = false;
  const simKeywords = ["SIMULATOR", "SIM", "FTD", "FFS"];
  for (const keyword of simKeywords) {
    if (processedString.includes(keyword)) {
      isSimulator = true;
      processedString = processedString.replace(keyword, "").trim();
    }
  }
  const match = processedString.match(/(.*?)\s*\((.*?)\)/);
  let seat = null;
  let fullType = processedString;
  if (match) {
    fullType = match[1].trim();
    let seatRaw = match[2].trim();
    if (seatRaw.startsWith('F')) seat = 'F';else
    if (seatRaw.startsWith('B')) seat = 'B';else
    if (seatRaw.startsWith('L')) seat = 'L';else
    if (seatRaw.startsWith('R')) seat = 'R';
  }
  const aircraftType = determineAircraftType(fullType);
  const customAircraftType = aircraftType === "Custom" ? fullType : "";
  return { aircraftType, seatPosition: seat, customAircraftType, is_simulator: isSimulator };
};

const parseSeatPosition = (seatString) => {
  if (!seatString) return null;
  const seat = seatString.toString().toUpperCase().trim();

  // Handle various seat position formats
  if (seat.includes('LEFT') || seat.includes('L')) return 'L';
  if (seat.includes('RIGHT') || seat.includes('R')) return 'R';
  if (seat.includes('FRONT') || seat.includes('F')) return 'F';
  if (seat.includes('BACK') || seat.includes('B')) return 'B';

  // Direct matches
  if (['L', 'R', 'F', 'B'].includes(seat)) return seat;

  return null;
};

const determinePilotRole = (roleString) => {
  if (!roleString) return "PI";
  const role = roleString.toString().toUpperCase().trim();
  // Order matters, check for more specific roles first
  if (role.includes("STANDARDIZATION") || role === "SP") return "SP";
  if (role.includes("INSTRUCTOR PILOT") || role === "IP") return "IP";
  if (role.includes("CERTIFIED FLIGHT INSTRUCTOR") || role === "CFI") return "CFI";
  if (role.includes("INSTRUMENT EXAMINER") || role === "IE") return "IE";
  if (role.includes("MAINTENANCE") || role === "MP") return "MP";
  if (role.includes("SECOND IN COMMAND") || role.includes("SIC") || role.includes("CP")) return "SIC";
  if (role.includes("PIC")) return "PIC";
  if (role.includes("PI")) return "PI";
  return "PI"; // Default fallback
};

const parseFlightHours = (hoursString) => {
  if (!hoursString) return 0;
  const hours = parseFloat(hoursString.toString().trim());
  return isNaN(hours) ? 0 : hours;
};

const determineFlightMode = (conditionString) => {
  if (!conditionString) return "D";
  const condition = conditionString.toString().toUpperCase();
  const conditionMap = { "NG": "NG", "NS": "NS", "N": "N", "H": "H", "W": "W", "D": "D" };
  for (const key in conditionMap) {
    if (condition.includes(key)) return conditionMap[key];
  }
  return "D";
};

const determineMissionType = (missionString) => {
  if (!missionString) return "Training";
  const mission = missionString.toString().toUpperCase();
  const missionMap = { "TRAINING": "Training", "COMBAT": "Combat", "SUPPORT": "Support", "FERRY": "Ferry", "LOGISTICS": "Logistics", "RECONNAISSANCE": "Reconnaissance", "MEDEVAC": "Medevac" };
  for (const key in missionMap) {
    if (mission.includes(key)) return missionMap[key];
  }
  return "Training";
};


// --- Main Component ---

export default function UploadFlightsPage() {
  const [step, setStep] = useState(1); // 1: Upload, 2: Map, 3: Preview
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [csvRows, setCsvRows] = useState([]);
  const [mappings, setMappings] = useState({});
  const [previewData, setPreviewData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [importProgress, setImportProgress] = useState(0);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const resetState = () => {
    setStep(1);
    setFile(null);
    setCsvHeaders([]);
    setCsvRows([]);
    setMappings({});
    setPreviewData([]);
    setError(null);
    setLoading(false);
    setLoadingMessage("");
    setImportProgress(0);
    setIsDragging(false);
  };

  const parseCsv = (csvText) => {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''));
    const rows = lines.slice(1).map((line) => {
      const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); // handle commas inside quotes
      const rowObject = {};
      headers.forEach((header, index) => {
        rowObject[header] = values[index]?.trim().replace(/"/g, '') || '';
      });
      return rowObject;
    });
    return { headers, rows };
  };

  const processFile = (selectedFile) => {
    if (selectedFile) {
      if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
        setError("Please upload a CSV file only.");
        return;
      }
      setFile(selectedFile);
      setError(null);
      setLoading(true);
      setLoadingMessage("Processing CSV file...");
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const { headers, rows } = parseCsv(event.target.result);
          setCsvHeaders(headers);
          setCsvRows(rows);
          setStep(2);
        } catch (err) {
          setError("Failed to parse CSV file. Please ensure it is correctly formatted.");
          resetState();
        } finally {
          setLoading(false);
        }
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    processFile(selectedFile);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      processFile(droppedFile);
      e.dataTransfer.clearData();
    }
  };

  const handleMappingComplete = (userMappings) => {
    setMappings(userMappings);
    setError(null);

    const transformedData = csvRows.map((row) => {
      let flight = { errors: [] };

      // Map data using user mappings
      const date = parseFlightDate(row[userMappings.date]);
      const total_flight_hours = parseFlightHours(row[userMappings.total_flight_hours]);
      let { aircraftType, seatPosition: aircraftSeatPosition, customAircraftType, is_simulator } = parseAircraftAndSeat(row[userMappings.aircraft_type]);

      // If tail number is "SIM", override to be a simulator session
      const tailNumberValue = row[userMappings.tail_number]?.toString().trim().toUpperCase();
      if (tailNumberValue === 'SIM') {
        is_simulator = true;
      }

      // Handle seat position - prioritize dedicated seat column over aircraft parsing
      let finalSeatPosition = aircraftSeatPosition; // Default from aircraft parsing
      if (userMappings.seat_position && row[userMappings.seat_position]) {
        const mappedSeat = parseSeatPosition(row[userMappings.seat_position]);
        if (mappedSeat) {
          finalSeatPosition = mappedSeat;
        }
      }

      // Validation
      if (!date) flight.errors.push("Invalid or missing date.");
      if (!total_flight_hours || total_flight_hours <= 0) flight.errors.push("Invalid or missing flight hours.");
      if (!aircraftType) flight.errors.push("Invalid or missing aircraft type.");

      // Construct flight object
      flight = {
        ...flight,
        date,
        aircraft_type: aircraftType,
        custom_aircraft_type: customAircraftType,
        tail_number: is_simulator ? "" : row[userMappings.tail_number] || "",
        origin: is_simulator ? "" : row[userMappings.origin] || "",
        destinations: is_simulator ? [] : row[userMappings.destinations] ? [row[userMappings.destinations]] : [],
        total_flight_hours,
        pilot_role: determinePilotRole(row[userMappings.pilot_role]),
        is_pic: determinePilotRole(row[userMappings.pilot_role]) === "PIC",
        mission_type: determineMissionType(row[userMappings.mission_type]),
        hour_breakdown: [{
          mode: determineFlightMode(row[userMappings.hour_breakdown_mode]),
          duration: total_flight_hours,
          seat_position: finalSeatPosition || 'L'
        }],
        is_simulator: is_simulator,
        remarks: row[userMappings.remarks] || "",
        copilot_name: "",
        organization_id: ""
      };
      return flight;
    });

    setPreviewData(transformedData);
    setStep(3);
  };

  const handleImportFlights = async () => {
    setLoading(true);
    const validFlights = previewData.filter((f) => f.errors.length === 0);

    try {
      let successCount = 0;
      let failedCount = 0;

      for (let i = 0; i < validFlights.length; i++) {
        const flight = validFlights[i];
        // Remove errors property before saving
        const { errors, ...flightToSave } = flight;

        let retryCount = 0;
        const maxRetries = 3;
        let success = false;

        while (retryCount < maxRetries && !success) {
          try {
            await Flight.create(flightToSave);
            successCount++;
            success = true;
            setImportProgress((successCount + failedCount) / validFlights.length * 100);
            setLoadingMessage(`Importing flight ${successCount + failedCount} of ${validFlights.length}... (${successCount} successful)`);

            // Base delay between requests
            await new Promise((resolve) => setTimeout(resolve, 300));

          } catch (error) {
            retryCount++;

            if (error.response?.status === 429 || error.message && error.message.includes("Rate limit")) {
              // Rate limit hit, wait longer before retry
              const waitTime = Math.min(1000 * Math.pow(2, retryCount), 10000); // Exponential backoff, max 10s
              console.log(`Rate limit hit on flight ${i + 1}, waiting ${waitTime}ms (attempt ${retryCount}/${maxRetries})`);
              setLoadingMessage(`Rate limit hit - waiting ${waitTime / 1000}s before retry... (${successCount}/${validFlights.length} imported)`);
              await new Promise((resolve) => setTimeout(resolve, waitTime));
            } else {
              // Other error, don't retry for this specific flight, log it and move on
              console.error(`Failed to import flight ${i + 1}:`, error);
              failedCount++;
              break; // Exit retry loop for this flight
            }

            if (retryCount >= maxRetries && !success) {
              console.error(`Failed to import flight ${i + 1} after ${maxRetries} attempts:`, error);
              failedCount++;
            }
          }
        }
      }

      setImportProgress(100);

      if (failedCount > 0) {
        setLoadingMessage(`Import completed with issues: ${successCount} successful, ${failedCount} failed. Check console for details.`);
        alert(`Import completed with some issues:\n• Successfully imported: ${successCount} flights\n• Failed to import: ${failedCount} flights\n\nPlease check the browser console for detailed error information.`);
      } else {
        setLoadingMessage(`Import complete! Successfully imported ${successCount} flights.`);
      }

      setTimeout(() => {
        if (successCount > 0) {
          navigate(createPageUrl("FlightLog"));
        } else {
          setLoading(false); // Stay on page if no flights imported
        }
      }, 3000);

    } catch (error) {
      console.error("Unexpected error during import:", error);
      setError("An unexpected error occurred during import. Please check your data and try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">Import Flights from CSV</h1>
                    <p className="text-slate-600 mt-1">
                        Upload a CSV file, map your columns, and import your flight log data.
                    </p>
                </div>

                {step === 1 &&
        <Card className="bg-white shadow-lg border-0">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">Step 1: Upload CSV File</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging ?
              'border-blue-500 bg-blue-50' :
              'border-slate-300 hover:border-blue-400'}`
              }>

                                <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                                <Button onClick={handleButtonClick} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                                    <Upload className="w-4 h-4 mr-2" />
                                    Upload CSV
                                </Button>
                                <Input
                ref={fileInputRef}
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden" />

                                <p className="text-sm text-slate-600 mt-2">
                                    or drag and drop it here.
                                </p>
                                <p className="text-slate-700 mt-4 mx-auto text-xs font-medium max-w-md">Upload your excel spreadsheet containing fligth data. After upload, map spreadsheet columns header with the information needed on the flight log. Once selected, sit back and relax while your flight data is uploaded.

              </p>
                            </div>
                            {file && <p className="text-center text-slate-700">Selected: {file.name}</p>}
                            {error && <p className="text-center text-red-500">{error}</p>}
                            {loading && <p className="text-center text-slate-600">{loadingMessage}</p>}
                        </CardContent>
                    </Card>
        }

                {step === 2 &&
        <CsvFieldMapper
          csvHeaders={csvHeaders}
          onMappingComplete={handleMappingComplete}
          onBack={resetState} />

        }

                {step === 3 &&
        <ImportPreview
          previewData={previewData}
          onImport={handleImportFlights}
          onCancel={() => setStep(2)}
          loading={loading}
          importProgress={importProgress}
          loadingMessage={loadingMessage} />

        }
            </div>
        </div>);

}
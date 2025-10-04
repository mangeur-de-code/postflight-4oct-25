import React, { useState, useMemo, useEffect } from "react";
import { Flight, User } from "@/api/entities";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Trash2, Edit, Search, Share2, Copy, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";

const AIRCRAFT_TYPES = ["UH-60", "HH-60", "UH-72", "CH-47", "C-12", "AH-64", "AH-64E", "Custom aircraft"];

export default function DataManagement({ flights, onDeletionComplete }) {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [selectedAircraft, setSelectedAircraft] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(null);
  
  const [searchField, setSearchField] = useState("tail_number");
  const [searchValue, setSearchValue] = useState("");
  const [replaceField, setReplaceField] = useState("tail_number");
  const [replaceValue, setReplaceValue] = useState("");
  const [newAircraftType, setNewAircraftType] = useState("");
  const [customAircraftType, setCustomAircraftType] = useState("");
  const [convertToSimulator, setConvertToSimulator] = useState(false);
  
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      setLoadingUser(true);
      try {
        const userData = await User.me();
        setUser(userData);
      } catch (error) {
        console.error("Failed to load user in DataManagement component", error);
        setUser(null);
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUser();
  }, []);

  const uniqueAircraftTypes = useMemo(() => {
    if (!flights) return [];
    const types = flights.map(f => f.aircraft_type === "Custom aircraft" ? f.custom_aircraft_type : f.aircraft_type);
    return [...new Set(types)].filter(Boolean).sort();
  }, [flights]);

  const uniqueSimulatorTypes = useMemo(() => {
    if (!flights) return [];
    const simulatorFlights = flights.filter(f => f.is_simulator);
    const types = simulatorFlights.map(f => f.aircraft_type === "Custom aircraft" ? f.custom_aircraft_type : f.aircraft_type);
    return [...new Set(types)].filter(Boolean).sort();
  }, [flights]);

  const uniqueTailNumbers = useMemo(() => {
    if (!flights) return [];
    const tails = flights.map(f => f.tail_number).filter(Boolean);
    return [...new Set(tails)].sort();
  }, [flights]);

  const matchingFlights = useMemo(() => {
    if (!searchValue.trim() || !flights) return [];
    
    return flights.filter(flight => {
      const fieldValue = searchField === "aircraft_type" 
        ? (flight.aircraft_type === "Custom aircraft" ? flight.custom_aircraft_type : flight.aircraft_type)
        : flight[searchField];
      
      return fieldValue && fieldValue.toString().toLowerCase().includes(searchValue.toLowerCase());
    });
  }, [flights, searchField, searchValue]);

  const handleSharingToggle = async (isEnabled) => {
    if (!user) return;
    await User.updateMyUserData({ is_logbook_sharing_enabled: isEnabled });
    if (onDeletionComplete) {
      onDeletionComplete(); // This reloads data on the parent ProfilePage
    }
  };
  
  const shareableLink = user?.id ? `${window.location.origin}${createPageUrl(`PublicLogbook?user=${user.id}`)}` : '';
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const runRateLimitedOperation = async (items, operation, type) => {
    setIsProcessing(true);
    setProgress({ current: 0, total: items.length, message: `Starting ${type}...` });

    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        let retryCount = 0;
        const maxRetries = 5;
        let success = false;
        
        setProgress({ current: i, total: items.length, message: `${type} item ${i+1} of ${items.length}...` });

        while (retryCount < maxRetries && !success) {
            try {
                await operation(item);
                success = true;
                successCount++;
            } catch (error) {
                retryCount++;
                if (error.response?.status === 429 || error.message?.includes("Rate limit")) {
                    const baseDelay = 2000;
                    const exponentialDelay = baseDelay * Math.pow(2, retryCount - 1);
                    const jitter = Math.random() * 1000;
                    const waitTime = Math.min(exponentialDelay + jitter, 15000);
                    
                    setProgress({ 
                        current: i, 
                        total: items.length, 
                        message: `Rate limit hit, waiting ${(waitTime/1000).toFixed(1)}s... (Retry ${retryCount}/${maxRetries} for item ${i+1})` 
                    });
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                } else {
                    console.error(`Failed to ${type} item ${item.id}:`, error);
                    break;
                }
            }
        }
        
        if (!success) {
            failedCount++;
            console.error(`Failed to ${type} item ${item.id} after ${maxRetries} attempts`);
        }
        
        if (success) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
    
    const message = failedCount > 0 
        ? `${type} completed with issues: ${successCount} successful, ${failedCount} failed.`
        : `${type} completed successfully! ${successCount} items processed.`;
    
    setProgress({ current: items.length, total: items.length, message });
    
    setTimeout(() => {
        setIsProcessing(false);
        setProgress(null);
        if (onDeletionComplete) onDeletionComplete();
        
        if (failedCount > 0) {
            alert(`${type} completed with some issues:\n• Successfully processed: ${successCount} items\n• Failed to process: ${failedCount} items\n\nPlease check the browser console for detailed error information.`);
        }
    }, 3000);
  };

  const handleDelete = async () => {
    if (!selectedAircraft) return;
    const flightsToDelete = flights.filter(f => (f.aircraft_type === "Custom aircraft" ? f.custom_aircraft_type : f.aircraft_type) === selectedAircraft);
    if (flightsToDelete.length === 0) return;

    await runRateLimitedOperation(flightsToDelete, (flight) => Flight.delete(flight.id), 'Deletion');
    setSelectedAircraft("");
  };

  const handleDeleteSimulator = async () => {
    const simulatorFlights = flights.filter(f => f.is_simulator);
    if (simulatorFlights.length === 0) return;

    await runRateLimitedOperation(simulatorFlights, (flight) => Flight.delete(flight.id), 'Deletion');
  };

  const handleBatchUpdate = async () => {
    if (!searchValue.trim() || matchingFlights.length === 0) {
      alert("No flights found matching your search criteria.");
      return;
    }

    if (!replaceValue.trim() && !convertToSimulator && replaceField !== "aircraft_type") {
      alert("Please enter a replacement value or select convert to simulator.");
      return;
    }

    if (replaceField === "aircraft_type" && !newAircraftType) {
      alert("Please select a new aircraft type.");
      return;
    }

    if (replaceField === "aircraft_type" && newAircraftType === "Custom aircraft" && !customAircraftType.trim()) {
      alert("Please specify the custom aircraft type.");
      return;
    }

    const updateOperation = async (flight) => {
        const updates = { ...flight };
        
        delete updates.created_date;
        delete updates.updated_date;
        delete updates.created_by_id;
        delete updates.created_by;
        delete updates.is_sample;
        
        if (convertToSimulator) {
          updates.is_simulator = true;
          updates.tail_number = "";
          updates.origin = "";
          updates.destinations = [];
        } else if (replaceField === "aircraft_type") {
          if (newAircraftType === "Custom aircraft") {
            updates.aircraft_type = "Custom aircraft";
            updates.custom_aircraft_type = customAircraftType.trim();
          } else {
            updates.aircraft_type = newAircraftType;
            updates.custom_aircraft_type = "";
          }
        } else if (replaceField === "tail_number") {
          updates.tail_number = replaceValue.trim();
        }

        await Flight.update(flight.id, updates);
    };

    await runRateLimitedOperation(matchingFlights, updateOperation, 'Update');
    
    setSearchValue("");
    setReplaceValue("");
    setConvertToSimulator(false);
    setNewAircraftType("");
    setCustomAircraftType("");
  };

  const flightsToDeleteCount = selectedAircraft 
    ? flights.filter(f => (f.aircraft_type === "Custom aircraft" ? f.custom_aircraft_type : f.aircraft_type) === selectedAircraft).length
    : 0;

  const simulatorFlightsCount = flights.filter(f => f.is_simulator).length;

  return (
    <Card className="bg-white shadow-lg border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Edit className="w-5 h-5" />
          Data Management
        </CardTitle>
        <CardDescription>Perform bulk actions on your flight log. These actions are irreversible.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {progress && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">{progress.message}</p>
            <Progress value={(progress.current / progress.total) * 100} />
          </div>
        )}

        {/* Public Logbook Sharing */}
        <div className="space-y-4 p-4 border rounded-lg bg-green-50/50 border-green-200">
          <h4 className="font-semibold text-slate-900">Public Logbook Sharing</h4>
          {loadingUser ? (
             <div className="flex items-center gap-2 text-slate-600">
                <Loader2 className="w-4 h-4 animate-spin"/>
                <span>Loading sharing settings...</span>
             </div>
          ) : (
            <>
              <p className="text-sm text-slate-600">
                Enable this to get a shareable, read-only link to a condensed version of your logbook. The link will always display your latest flight information.
              </p>
              <div className="flex items-center space-x-2">
                <Switch
                  id="logbook-sharing"
                  checked={user?.is_logbook_sharing_enabled || false}
                  onCheckedChange={handleSharingToggle}
                  disabled={!user}
                />
                <Label htmlFor="logbook-sharing" className="font-medium">
                  {user?.is_logbook_sharing_enabled ? "Sharing Enabled" : "Sharing Disabled"}
                </Label>
              </div>
              {user?.is_logbook_sharing_enabled && (
                <div className="space-y-2">
                  <Label>Your public link:</Label>
                  <div className="flex gap-2">
                    <Input type="text" readOnly value={shareableLink} className="bg-white" />
                    <Button variant="outline" onClick={handleCopyLink}>
                      <Copy className="w-4 h-4 mr-2" />
                      {copied ? "Copied!" : "Copy"}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Batch Edit Section */}
        <div className="space-y-4 p-4 border rounded-lg bg-blue-50/50 border-blue-200">
          <h4 className="font-semibold text-slate-900">Batch Edit Aircraft Data</h4>
          <p className="text-sm text-slate-600">Find and replace aircraft information across multiple flight entries. Useful for fixing imported data.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Search Field</Label>
              <Select value={searchField} onValueChange={setSearchField}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tail_number">Tail Number</SelectItem>
                  <SelectItem value="aircraft_type">Aircraft Type</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Search Value</Label>
              <div className="flex gap-2">
                <Input
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Enter value to find..."
                />
                {searchField === "tail_number" && (
                  <Select value={searchValue} onValueChange={setSearchValue}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueTailNumbers.map(tail => (
                        <SelectItem key={tail} value={tail}>{tail}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {searchField === "aircraft_type" && (
                  <Select value={searchValue} onValueChange={setSearchValue}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueAircraftTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </div>

          {matchingFlights.length > 0 && (
            <div className="p-3 bg-white border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Search className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-slate-900">Found {matchingFlights.length} matching flights</span>
              </div>
              <div className="text-sm text-slate-600 max-h-20 overflow-y-auto">
                {matchingFlights.slice(0, 5).map(flight => (
                  <div key={flight.id} className="flex items-center justify-between py-1">
                    <span>{flight.date} - {flight.aircraft_type} {flight.tail_number}</span>
                  </div>
                ))}
                {matchingFlights.length > 5 && (
                  <div className="text-xs text-slate-500">...and {matchingFlights.length - 5} more</div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-4 pt-4 border-t border-blue-200">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="convert-sim"
                checked={convertToSimulator}
                onCheckedChange={setConvertToSimulator}
              />
              <Label htmlFor="convert-sim">Convert to Simulator Sessions</Label>
            </div>

            {!convertToSimulator && (
              <>
                <div className="space-y-2">
                  <Label>Replace Field</Label>
                  <Select value={replaceField} onValueChange={setReplaceField}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tail_number">Tail Number</SelectItem>
                      <SelectItem value="aircraft_type">Aircraft Type</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {replaceField === "tail_number" && (
                  <div className="space-y-2">
                    <Label>New Tail Number</Label>
                    <Input
                      value={replaceValue}
                      onChange={(e) => setReplaceValue(e.target.value)}
                      placeholder="Enter new tail number..."
                    />
                  </div>
                )}

                {replaceField === "aircraft_type" && (
                  <>
                    <div className="space-y-2">
                      <Label>New Aircraft Type</Label>
                      <Select value={newAircraftType} onValueChange={setNewAircraftType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select new aircraft type" />
                        </SelectTrigger>
                        <SelectContent>
                          {AIRCRAFT_TYPES.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {newAircraftType === "Custom aircraft" && (
                      <div className="space-y-2">
                        <Label>Custom Aircraft Type</Label>
                        <Input
                          value={customAircraftType}
                          onChange={(e) => setCustomAircraftType(e.target.value)}
                          placeholder="Enter custom aircraft type..."
                        />
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                disabled={matchingFlights.length === 0 || isProcessing}
              >
                <Edit className="w-4 h-4 mr-2" />
                {isProcessing ? "Processing..." : `Update ${matchingFlights.length} Flights`}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Batch Update</AlertDialogTitle>
                <AlertDialogDescription>
                  This will update <strong>{matchingFlights.length}</strong> flights where {searchField} contains "{searchValue}".
                  {convertToSimulator ? " These flights will be converted to simulator sessions." : 
                   replaceField === "aircraft_type" ?
                     ` The aircraft type will be changed to "${newAircraftType === "Custom aircraft" ? customAircraftType : newAircraftType}".` :
                     ` The ${replaceField} will be changed to "${replaceValue}".`}
                  <br /><br />
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleBatchUpdate} className="bg-blue-600 hover:bg-blue-700">
                  Update Flights
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Delete Aircraft Section */}
        <div className="space-y-4 p-4 border rounded-lg bg-red-50/50 border-red-200">
          <h4 className="font-semibold text-slate-900">Delete All Flights by Aircraft</h4>
          <p className="text-sm text-slate-600">Select an aircraft type to permanently delete all associated flight log entries. This action cannot be undone.</p>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Select value={selectedAircraft} onValueChange={setSelectedAircraft}>
              <SelectTrigger className="w-full sm:w-[250px]">
                <SelectValue placeholder="Select an aircraft type..." />
              </SelectTrigger>
              <SelectContent>
                {uniqueAircraftTypes.length > 0 ? uniqueAircraftTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                )) : (
                  <div className="p-4 text-center text-sm text-slate-500">No aircraft with logs found.</div>
                )}
              </SelectContent>
            </Select>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={!selectedAircraft || isProcessing}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  {isProcessing ? "Processing..." : `Delete ${flightsToDeleteCount} Flights`}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action is permanent and cannot be undone. This will delete all <strong>{flightsToDeleteCount}</strong> flight logs for the aircraft <strong>{selectedAircraft}</strong>.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                    Yes, Delete Flights
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Delete Simulator Section */}
        {simulatorFlightsCount > 0 && (
          <div className="space-y-4 p-4 border rounded-lg bg-red-50/50 border-red-200">
            <h4 className="font-semibold text-slate-900">Delete All Simulator Sessions</h4>
            <p className="text-sm text-slate-600">Delete all simulator flight sessions from your log. This action cannot be undone.</p>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="text-sm text-slate-700 bg-white p-3 rounded border flex-1">
                Found <strong>{simulatorFlightsCount}</strong> simulator sessions in your flight log
              </div>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isProcessing}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    {isProcessing ? "Processing..." : `Delete ${simulatorFlightsCount} Simulator Sessions`}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action is permanent and cannot be undone. This will delete all <strong>{simulatorFlightsCount}</strong> simulator sessions from your flight log.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteSimulator} className="bg-red-600 hover:bg-red-700">
                      Yes, Delete All Simulator Sessions
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
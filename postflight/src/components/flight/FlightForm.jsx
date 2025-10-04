
import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { X, Plus, Minus, Save, Plane, Computer, Clock, ChevronDown, ChevronUp, Briefcase } from "lucide-react";

const AIRCRAFT_TYPES = ["UH-60", "HH-60", "UH-72", "CH-47", "C-12", "AH-64", "AH-64D", "AH-64E", "Beechcraft Bonanza", "Cessna 150", "Cessna 172 Skyhawk", "Cirrus SR20", "Cirrus SR22", "King Air C90", "Mooney M20", "Piper J-3", "Piper PA-32", "Custom aircraft"];
const FLIGHT_MODES = [
  { value: "D", label: "Day" },
  { value: "N", label: "Night" },
  { value: "NG", label: "Night goggles" },
  { value: "NS", label: "Night System" },
  { value: "DS", label: "Day System" },
  { value: "H", label: "Hood" },
  { value: "W", label: "Weather" },
];
const MISSION_TYPES = [
  { value: "T", label: "TRAINING" },
  { value: "F", label: "MAINTENANCE TEST FLIGHT" },
  { value: "C", label: "COMBAT" },
  { value: "A", label: "ACCEPTANCE TEST FLIGHT" },
  { value: "D", label: "IMMINENT DANGER" },
  { value: "S", label: "SERVICE" },
  { value: "X", label: "EXPERIMENTAL" },
  { value: "Custom", label: "CUSTOM MISSION" }
];

const RATED_ROLES = [
  { value: "PC", label: "Pilot in Command" },
  { value: "CP", label: "Co-Pilot" },
  { value: "PI", label: "Pilot" },
  // { value: "FCP", label: "Functional Check Pilot" }, // Removed as per request
  { value: "XP", label: "Experimental test Pilot" },
  { value: "UT", label: "Unit Trainer" },
  { value: "UT/E", label: "Unit Trainer/Evaluator" },
  { value: "ME", label: "Maintenance Test Evalator" },
  { value: "MP", label: "Maintenance Test Pilot" },
  { value: "IE", label: "Instrument Examiner" },
  { value: "SP", label: "Standardization Instructor Pilot" },
  { value: "IP", label: "Instructor Pilot" },
  { value: "CFI", label: "Certified Flight Instructor" },
  { value: "SIC", label: "Second in Command" }
];

const NON_RATED_ROLES = [
  { value: "CE", label: "CE - Crew Chief" },
  { value: "FE", label: "FE - Flight Engineer" },
  { value: "MO", label: "MO - Flight Medic" },
  { value: "FS", label: "FS - Flight Surgeon" },
  { value: "UT", label: "UT - Manned/Unmanned Unit Trainer" },
  { value: "FI", label: "FI - Crewmember Flight Instructor" },
  { value: "SI", label: "SI - Crewmember Standardization Instructor" },
  { value: "DG", label: "DG - Door Gunner" },
  { value: "CA", label: "CA - Cabin Attendant" },
  { value: "EO", label: "EO - Equipment Operator" }
];

const SEAT_OPTIONS = {
  default: [
    { value: "L", label: "Left" },
    { value: "R", label: "Right" }
  ],
  apache: [
    { value: "F", label: "Front" },
    { value: "B", label: "Back" }
  ]
};

export default function FlightForm({ flight, user, onSubmit, onCancel }) {
  const [customAircraftTypes, setCustomAircraftTypes] = useState([]);
  const [customMissionTypes, setCustomMissionTypes] = useState([]);
  const [availableTailNumbers, setAvailableTailNumbers] = useState([]);
  const [activeTab, setActiveTab] = useState(flight?.is_simulator ? "simulator" : "aircraft");
  const [takeOffLandingOpen, setTakeOffLandingOpen] = useState(false);
  const [crossCountryOpen, setCrossCountryOpen] = useState(false);
  const [crewType, setCrewType] = useState('rated'); // New state variable

  const [formData, setFormData] = useState({
    date: flight?.date || "",
    mission_type: flight?.mission_type || "T",
    custom_mission_type: flight?.custom_mission_type || "",
    aircraft_type: flight?.aircraft_type || "",
    custom_aircraft_type: flight?.custom_aircraft_type || "",
    tail_number: flight?.tail_number || "",
    origin: flight?.origin || "",
    destinations: flight?.destinations || [""],
    copilot_name: flight?.copilot_name || "",
    hour_breakdown: flight?.hour_breakdown || [{ mode: "", duration: 0, seat_position: "" }],
    total_flight_hours: flight?.total_flight_hours || 0,
    pilot_role: flight?.pilot_role || "PI", // Default to PI for new entries
    is_pic: flight?.is_pic || false,
    remarks: flight?.remarks || "",
    // Add take off and landing fields
    total_takeoffs: flight?.total_takeoffs || 0, // Mapped to DAY TAKEOFFS in UI
    total_landings: flight?.total_landings || 0, // Mapped to NIGHT TAKEOFFS in UI
    day_takeoffs: flight?.day_takeoffs || 0, // Mapped to DAY LANDINGS FULL STOP in UI
    day_landings: flight?.day_landings || 0, // Mapped to NIGHT LANDINGS FULL STOP in UI
    night_takeoffs: flight?.night_takeoffs || 0, // Mapped to ALL LANDINGS in UI (auto-calculated)
    // Add cross country fields
    cross_country_time: flight?.cross_country_time || 0,
    cross_country_distance: flight?.cross_country_distance || 0
  });

  const handleChange = useCallback((field, value) => {
    if (field === "origin") {
      value = value.toUpperCase();
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Effect to determine initial crew type based on existing flight data
  useEffect(() => {
    if (flight?.pilot_role) {
      const isNonRated = NON_RATED_ROLES.some(role => role.value === flight.pilot_role);
      if (isNonRated) {
        setCrewType('non-rated');
      } else {
        setCrewType('rated');
      }
    }
  }, [flight]);

  useEffect(() => {
    // Load custom aircraft types from localStorage on component mount
    const savedCustomAircraftTypes = localStorage.getItem('customAircraftTypes');
    if (savedCustomAircraftTypes) {
      try {
        const parsed = JSON.parse(savedCustomAircraftTypes);
        // Ensure we have an array of objects or convert old format
        if (Array.isArray(parsed)) {
          if (parsed.length > 0 && typeof parsed[0] === 'object' && parsed[0] !== null && 'name' in parsed[0]) {
            // New format: array of objects { name, description }
            setCustomAircraftTypes(parsed);
          } else {
            // Old format: array of strings. Convert to new object format.
            const converted = parsed.map((name) => ({ name, description: '' }));
            setCustomAircraftTypes(converted);
          }
        }
      } catch (error) {
        console.error('Error loading custom aircraft types:', error);
      }
    }

    // Load custom mission types
    const savedCustomMissionTypes = localStorage.getItem('customMissionTypes');
    if (savedCustomMissionTypes) {
      try {
        const parsed = JSON.parse(savedCustomMissionTypes);
        setCustomMissionTypes(Array.isArray(parsed) ? parsed : []);
      } catch (error) {
        console.error('Error loading custom mission types:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Update available tail numbers when aircraft type changes
    if (user?.personal_aircraft_inventory && formData.aircraft_type) {
      const tails = user.personal_aircraft_inventory.
        filter((ac) => {
          if (ac.aircraft_type === "Custom aircraft") {
            return ac.custom_aircraft_type === formData.aircraft_type ||
              formData.aircraft_type === "Custom aircraft" && ac.custom_aircraft_type === formData.custom_aircraft_type;
          } else {
            return ac.aircraft_type === formData.aircraft_type;
          }
        }).
        map((ac) => ac.tail_number);
      setAvailableTailNumbers(tails);
    } else {
      setAvailableTailNumbers([]);
    }
  }, [formData.aircraft_type, formData.custom_aircraft_type, user]);

  useEffect(() => {
    const total = formData.hour_breakdown.reduce((sum, item) => sum + (item.duration || 0), 0);
    handleChange("total_flight_hours", total);
  }, [formData.hour_breakdown, handleChange]);

  useEffect(() => {
    handleChange("is_pic", formData.pilot_role === "PIC");
  }, [formData.pilot_role, handleChange]);

  // Effect to auto-calculate "ALL LANDINGS"
  useEffect(() => {
    // Calculates "ALL LANDINGS" (mapped to formData.night_takeoffs in the UI)
    // as the sum of "DAY LANDINGS FULL STOP" (formData.day_takeoffs)
    // and "NIGHT LANDINGS FULL STOP" (formData.day_landings).
    const calculatedAllLandings = (formData.day_takeoffs || 0) + (formData.day_landings || 0);
    
    // Update the 'night_takeoffs' field if the calculated value differs from the current state.
    if (calculatedAllLandings !== formData.night_takeoffs) {
      handleChange("night_takeoffs", calculatedAllLandings);
    }
  }, [formData.day_takeoffs, formData.day_landings, formData.night_takeoffs, handleChange]);


  const saveCustomAircraftType = (customTypeName) => {
    if (customTypeName && customTypeName.trim()) {
      const trimmedName = customTypeName.trim();
      // Check if a custom type with this name already exists (case-insensitive)
      if (!customAircraftTypes.some((type) => type.name.toLowerCase() === trimmedName.toLowerCase())) {
        const updatedTypes = [...customAircraftTypes, { name: trimmedName, description: '' }];
        setCustomAircraftTypes(updatedTypes);
        localStorage.setItem('customAircraftTypes', JSON.stringify(updatedTypes));
      }
    }
  };

  const saveCustomMissionType = (customTypeName) => {
    if (customTypeName && customTypeName.trim()) {
      const trimmedName = customTypeName.trim();
      // Check if a custom type with this name already exists (case-insensitive)
      if (!customMissionTypes.some((type) => type.toLowerCase() === trimmedName.toLowerCase())) {
        const updatedTypes = [...customMissionTypes, trimmedName];
        setCustomMissionTypes(updatedTypes);
        localStorage.setItem('customMissionTypes', JSON.stringify(updatedTypes));
      }
    }
  };

  const handleDestinationChange = (index, value) => {
    const newDestinations = [...formData.destinations];
    newDestinations[index] = value.toUpperCase();
    handleChange("destinations", newDestinations);
  };

  const addDestination = () => handleChange("destinations", [...formData.destinations, ""]);
  const removeDestination = (index) => handleChange("destinations", formData.destinations.filter((_, i) => i !== index));

  const handleHourChange = (index, field, value) => {
    const newBreakdown = [...formData.hour_breakdown];
    if (field === "duration") {
      newBreakdown[index][field] = Number(value); // Ensure duration is a number
    } else {
      newBreakdown[index][field] = value;
    }
    handleChange("hour_breakdown", newBreakdown);
  };

  const addHourEntry = () => handleChange("hour_breakdown", [...formData.hour_breakdown, { mode: "", duration: 0, seat_position: "" }]);
  const removeHourEntry = (index) => handleChange("hour_breakdown", formData.hour_breakdown.filter((_, i) => i !== index));

  const handleSubmit = (e) => {
    e.preventDefault();

    // Save custom aircraft type if one was entered
    if (formData.aircraft_type === "Custom aircraft" && formData.custom_aircraft_type.trim()) {
      saveCustomAircraftType(formData.custom_aircraft_type.trim());
    }

    // Save custom mission type if one was entered
    if (formData.mission_type === "Custom" && formData.custom_mission_type.trim()) {
      saveCustomMissionType(formData.custom_mission_type.trim());
    }

    const isSimulator = activeTab === "simulator";

    // Fix timezone issue by ensuring date is stored as absolute date
    const absoluteDate = formData.date ? new Date(formData.date + 'T12:00:00').toISOString().split('T')[0] : formData.date;

    let submitData = {
      ...formData,
      date: absoluteDate, // Use absolute date to prevent timezone shifts
      is_simulator: isSimulator,
      origin: isSimulator ? "" : formData.origin.toUpperCase(),
      destinations: isSimulator ? [] : formData.destinations.
        filter((dest) => dest && dest.trim()).
        map((dest) => dest.toUpperCase()),
      tail_number: isSimulator ? "" : formData.tail_number,
      hour_breakdown: formData.hour_breakdown.
        filter((item) => item.mode && item.duration > 0).
        map((item) => ({ ...item, duration: item.duration })) // duration is already a number
    };

    onSubmit(submitData);
  };

  // Create combined aircraft types list
  const allAircraftTypes = [
    ...AIRCRAFT_TYPES.filter((type) => type !== "Custom aircraft"),
    ...customAircraftTypes.map((t) => t.name), // Use .map to get just the names
    "Custom aircraft"
  ];

  // Create combined mission types list
  const allMissionTypes = [
    ...MISSION_TYPES.filter((type) => type.value !== "Custom"),
    ...customMissionTypes.map(customType => ({ value: customType, label: customType })),
    ...MISSION_TYPES.filter((type) => type.value === "Custom")
  ];

  // Get seat options based on aircraft type
  const seatOptions = formData.aircraft_type === 'AH-64D' || formData.aircraft_type === 'AH-64E' || formData.aircraft_type === 'AH-64' ?
    SEAT_OPTIONS.apache :
    SEAT_OPTIONS.default;

  const renderFlightFields = (isSimulator = false) =>
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="date">Flight Date</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => handleChange("date", e.target.value)}
            required />

        </div>
        <div className="space-y-2">
          <Label htmlFor="aircraft_type">{isSimulator ? "Simulator" : "Aircraft"} Type</Label>
          <Select value={formData.aircraft_type} onValueChange={(value) => handleChange("aircraft_type", value)}>
            <SelectTrigger><SelectValue placeholder={`Select ${isSimulator ? "simulator" : "aircraft"} type`} /></SelectTrigger>
            <SelectContent>
              {allAircraftTypes.map((type) =>
                <SelectItem key={type} value={type}>
                  {type}
                  {customAircraftTypes.some((ct) => ct.name === type) && <span className="ml-2 text-xs text-blue-600">(Custom)</span>}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Duty Position</Label>
          <div className="flex rounded-md bg-slate-100 p-1">
            <Button
              type="button"
              onClick={() => {
                setCrewType('rated');
                handleChange('pilot_role', 'PI'); // Set default to Pilot
              }}
              className={`flex-1 justify-center transition-all duration-200 ${crewType === 'rated' ? 'bg-white text-primary shadow' : 'bg-transparent text-slate-600 hover:bg-slate-200'}`}
            >
              Rated Crew
            </Button>
            <Button
              type="button"
              onClick={() => {
                setCrewType('non-rated');
                handleChange('pilot_role', 'CE'); // Set default to Crew Chief
              }}
              className={`flex-1 justify-center transition-all duration-200 ${crewType === 'non-rated' ? 'bg-white text-primary shadow' : 'bg-transparent text-slate-600 hover:bg-slate-200'}`}
            >
              Non-rated Crew
            </Button>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pilot_role">Role</Label>
            <Select value={formData.pilot_role} onValueChange={(value) => handleChange("pilot_role", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {crewType === 'rated' && RATED_ROLES.map(role => <SelectItem key={role.value} value={role.value}>{role.value}</SelectItem>)}
                {crewType === 'non-rated' && NON_RATED_ROLES.map(role => <SelectItem key={role.value} value={role.value}>{role.value}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="copilot_name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Opposite Crew Name</Label>
            <Input
              id="copilot_name"
              value={formData.copilot_name}
              onChange={(e) => handleChange("copilot_name", e.target.value)}
              placeholder="Co-pilot name"
              className="w-50"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="mission_type">Mission Type</Label>
          <Select value={formData.mission_type} onValueChange={(value) => handleChange("mission_type", value)}>
            <SelectTrigger>
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-slate-500" />
                <SelectValue placeholder="Select mission type" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {allMissionTypes.map((type) =>
                <SelectItem key={type.value} value={type.value}>
                  {type.value}
                  {customMissionTypes.includes(type.value) && <span className="ml-2 text-xs text-blue-600">(Custom)</span>}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {formData.mission_type === "Custom" &&
        <div className="space-y-2">
          <Label htmlFor="custom_mission_type">Custom Mission Type</Label>
          <Input
            id="custom_mission_type"
            value={formData.custom_mission_type}
            onChange={(e) => handleChange("custom_mission_type", e.target.value)}
            placeholder="Enter custom mission type" />

          {customMissionTypes.length > 0 &&
            <div className="text-xs text-slate-500 mt-1">
              Previously used: {customMissionTypes.join(", ")}
            </div>
          }
        </div>
      }
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="tail_number">{isSimulator ? "Simulator ID" : "Tail Number"}</Label>
          <div className="flex items-center gap-2 max-w-sm">
            <Input
              id="tail_number"
              value={formData.tail_number}
              onChange={(e) => handleChange("tail_number", e.target.value)}
              placeholder={isSimulator ? "e.g., SIM-001" : "e.g., N12345"}
              required={!isSimulator}
              className="w-50" />

            {availableTailNumbers.length > 0 &&
              <Select onValueChange={(value) => handleChange("tail_number", value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select saved" />
                </SelectTrigger>
                <SelectContent>
                  {availableTailNumbers.map((tail) =>
                    <SelectItem key={tail} value={tail}>{tail}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            }
          </div>
        </div>
        {formData.aircraft_type === "Custom aircraft" &&
          <div className="space-y-2">
            <Label htmlFor="custom_aircraft_type">Custom {isSimulator ? "Simulator" : "Aircraft"} Type</Label>
            <Input
              id="custom_aircraft_type"
              value={formData.custom_aircraft_type}
              onChange={(e) => handleChange("custom_aircraft_type", e.target.value)}
              placeholder={`Enter custom ${isSimulator ? "simulator" : "aircraft"} type`} />

            {customAircraftTypes.length > 0 &&
              <div className="text-xs text-slate-500 mt-1">
                Previously used: {customAircraftTypes.map((ct) => ct.name).join(", ")}
              </div>
            }
          </div>
        }
      </div>

      {!isSimulator &&
        <>
          <div className="space-y-2">
            <Label htmlFor="origin" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Departure</Label>
            <Input
              id="origin"
              value={formData.origin}
              onChange={(e) => handleChange("origin", e.target.value)}
              placeholder="Departure location"
              required
              className="w-50"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Destination</Label>
            {formData.destinations.map((destination, index) =>
              <div key={index} className="flex items-center gap-2 max-w-sm">
                <Input
                  value={destination}
                  onChange={(e) => handleDestinationChange(index, e.target.value)}
                  placeholder={`Destination ${index + 1}`}
                />

                {formData.destinations.length > 1 &&
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeDestination(index)}>

                    <Minus className="w-4 h-4" />
                  </Button>
                }
              </div>
            )}
          </div>
          
          <div className="flex justify-start">
            <Button
              type="button"
              variant="outline"
              onClick={addDestination}
              className="flex items-center gap-2">

              <Plus className="w-4 h-4" />
              Add Destination
            </Button>
          </div>
        </>
      }

      <div className="border-t pt-6 mt-6 space-y-4">
        <div className="flex justify-between items-center">
          <Label className="text-lg font-semibold text-slate-800">Hour Breakdown</Label>
          <Button type="button" onClick={addHourEntry} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" /> Add Mode
          </Button>
        </div>
        <div className="space-y-4">
          {formData.hour_breakdown.map((item, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-2">
                <Label className="text-xs">Mode</Label>
                <Select
                  value={item.mode}
                  onValueChange={(value) => handleHourChange(index, "mode", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    {FLIGHT_MODES.map((mode) => (
                      <SelectItem key={mode.value} value={mode.value}>
                        {mode.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Seat</Label>
                <Select value={item.seat_position} onValueChange={(value) => handleHourChange(index, "seat_position", value)}>
                  <SelectTrigger><SelectValue placeholder="Seat" /></SelectTrigger>
                  <SelectContent>
                    {seatOptions.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label className="text-xs">Hours</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={item.duration || ''}
                    onChange={(e) => handleHourChange(index, "duration", e.target.value)}
                    placeholder="0.0"
                    className="w-24" />

                  {formData.hour_breakdown.length > 1 &&
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeHourEntry(index)}>

                      <Minus className="w-4 h-4" />
                    </Button>
                  }
                </div>
              </div>
            </div>
          ))}
          <div className="mt-4 flex items-center justify-end gap-2 text-lg font-semibold text-slate-800">
            <Clock className="w-5 h-5" />
            Total Hours: {formData.total_flight_hours.toFixed(1)}
          </div>
        </div>
      </div>

      {/* Take Off and Landing Collapsible Section */}
      <Collapsible open={takeOffLandingOpen} onOpenChange={setTakeOffLandingOpen} className="space-y-2">
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="flex items-center justify-between w-full">
            <span className="font-medium">TAKEOFFS AND LANDINGS</span>
            {takeOffLandingOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 p-4 border border-slate-200 rounded-lg bg-slate-50">
            <div className="space-y-2">
              <Label htmlFor="total_takeoffs" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">DAY TAKEOFFS</Label>
              <Input
                id="total_takeoffs"
                type="number"
                min="0"
                value={formData.total_takeoffs || ''}
                onChange={(e) => handleChange("total_takeoffs", Number(e.target.value))}
                placeholder="0" />

            </div>
            <div className="space-y-2">
              <Label htmlFor="total_landings" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">NIGHT TAKEOFFS</Label>
              <Input
                id="total_landings"
                type="number"
                min="0"
                value={formData.total_landings || ''}
                onChange={(e) => handleChange("total_landings", Number(e.target.value))}
                placeholder="0" />

            </div>
            <div className="space-y-2">
              <Label htmlFor="day_takeoffs" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">DAY LANDINGS FULL STOP</Label>
              <Input
                id="day_takeoffs"
                type="number"
                min="0"
                value={formData.day_takeoffs || ''}
                onChange={(e) => handleChange("day_takeoffs", Number(e.target.value))}
                placeholder="0" />

            </div>
            <div className="space-y-2">
              <Label htmlFor="day_landings" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">NIGHT LANDINGS FULL STOP</Label>
              <Input
                id="day_landings"
                type="number"
                min="0"
                value={formData.day_landings || ''}
                onChange={(e) => handleChange("day_landings", Number(e.target.value))}
                placeholder="0" />

            </div>
            <div className="space-y-2">
              <Label htmlFor="night_takeoffs" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">ALL LANDINGS</Label>
              <Input
                id="night_takeoffs"
                type="number"
                min="0"
                value={formData.night_takeoffs || ''}
                onChange={(e) => handleChange("night_takeoffs", Number(e.target.value))}
                placeholder="0"
                readOnly />

            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Cross Country Collapsible Section */}
      <Collapsible open={crossCountryOpen} onOpenChange={setCrossCountryOpen} className="space-y-2">
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="flex items-center justify-between w-full">
            <span className="font-medium">Cross Country</span>
            {crossCountryOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 p-4 border border-slate-200 rounded-lg bg-slate-50">
            <div className="space-y-2">
              <Label htmlFor="cross_country_time">Flight Time (hours)</Label>
              <Input
                id="cross_country_time"
                type="number"
                step="0.1"
                min="0"
                value={formData.cross_country_time || ''}
                onChange={(e) => handleChange("cross_country_time", Number(e.target.value))}
                placeholder="0.0" />

            </div>
            <div className="space-y-2">
              <Label htmlFor="cross_country_distance">Distance (miles)</Label>
              <Input
                id="cross_country_distance"
                type="number"
                min="0"
                value={formData.cross_country_distance || ''}
                onChange={(e) => handleChange("cross_country_distance", Number(e.target.value))}
                placeholder="0" />

            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="space-y-2">
        <Label htmlFor="remarks">Remarks</Label>
        <Textarea
          id="remarks"
          value={formData.remarks}
          onChange={(e) => handleChange("remarks", e.target.value)}
          placeholder="Additional notes..."
          className="min-h-20" />

      </div>
    </div>;


  return (
    <Card className="bg-white shadow-lg border-0">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
          <Plane className="w-5 h-5" />
          {flight ? "Edit Flight Entry" : "New Flight Entry"}
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="aircraft" className="flex items-center gap-2">
                <Plane className="w-4 h-4" />
                Aircraft
              </TabsTrigger>
              <TabsTrigger value="simulator" className="flex items-center gap-2">
                <Computer className="w-4 h-4" />
                Simulator
              </TabsTrigger>
            </TabsList>

            <TabsContent value="aircraft" className="mt-6">
              {renderFlightFields(false)}
            </TabsContent>

            <TabsContent value="simulator" className="mt-6">
              {renderFlightFields(true)}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 pt-6">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-4 h-4 mr-2" />
              {flight ? "Update Flight" : "Save Flight"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>);

}

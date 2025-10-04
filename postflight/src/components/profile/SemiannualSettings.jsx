
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Plus, Trash2, Save, Computer, Edit, RotateCw, GripVertical, Check, RefreshCw, AlertTriangle } from "lucide-react";
import { format, addYears, isPast } from "date-fns";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { isEqual } from "lodash";

const AIRCRAFT_TYPES = ["UH-60", "HH-60", "UH-72", "CH-47", "C-12", "AH-64D", "AH-64E", "All Aircraft"];
const FLIGHT_MODES = ["NVD", "NG", "NS", "D", "H", "W", "N"];

const SEAT_OPTIONS = {
  default: [
    { value: "L", label: "Left" },
    { value: "R", label: "Right" },
  ],
  apache: [
    { value: "F", label: "Front" },
    { value: "B", label: "Back" },
  ],
};

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const initialFieldState = {
  name: "",
  required_hours: 0,
  mode: null,
  seat_position: null,
  is_simulator: false
};

const getDefaultSettings = () => ({
  period_one_start: null,
  period_one_end: null,
  period_two_start: null,
  period_two_end: null,
  aircraft_type: "",
  required_hours: 100,
  simulator_required_hours: 0,
  simulator_aircraft_type: null,
  custom_fields: []
});

const generateRequirementName = (fieldData, settings) => {
  const baseAircraftType = fieldData.is_simulator ? settings.simulator_aircraft_type : settings.aircraft_type;
  const actualAircraftType = baseAircraftType && baseAircraftType !== "All Aircraft" ? baseAircraftType : "Any Aircraft";
  const seatOptions = (baseAircraftType === 'AH-64D' || baseAircraftType === 'AH-64E') ? SEAT_OPTIONS.apache : SEAT_OPTIONS.default;
  const seatLabel = fieldData.seat_position ? seatOptions.find(opt => opt.value === fieldData.seat_position)?.label : null;
  
  let nameParts = [actualAircraftType];
  
  if (seatLabel) {
    nameParts.push(seatLabel);
  }
  if (fieldData.mode) {
    nameParts.push(fieldData.mode);
  }
  
  let finalName = nameParts.join(' ');
  
  if (fieldData.is_simulator) {
    finalName += " (SIM)";
  }
  
  return finalName;
};

export default function SemiannualSettings({ user, onUpdate, saving, saveSuccess, onDirtyChange }) {
  const [settings, setSettings] = useState(user.semiannual_settings || getDefaultSettings());
  const [initialSettings, setInitialSettings] = useState(user.semiannual_settings || getDefaultSettings());

  const [editingField, setEditingField] = useState(null);
  const [fieldFormData, setFieldFormData] = useState(initialFieldState);

  useEffect(() => {
    if (editingField) {
      setFieldFormData(editingField);
    } else {
      setFieldFormData(initialFieldState);
    }
  }, [editingField]);

  // Effect to update settings and initialSettings if user prop changes (e.g., after a save or external data refresh)
  useEffect(() => {
    const newSettings = user.semiannual_settings || getDefaultSettings();
    setSettings(newSettings);
    setInitialSettings(newSettings);
  }, [user]);

  // Effect to notify parent about dirty state
  useEffect(() => {
    if(onDirtyChange) {
      onDirtyChange(!isEqual(settings, initialSettings));
    }
  }, [settings, initialSettings, onDirtyChange]);

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleCustomFieldFormChange = (field, value) => {
    setFieldFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveCustomField = () => {
    if (fieldFormData.required_hours <= 0) {
        // Basic validation
        return;
    }

    // Generate the requirement name automatically
    const generatedName = generateRequirementName(fieldFormData, settings);
    const fieldWithName = { ...fieldFormData, name: generatedName };

    if (editingField) {
      // Update existing field
      setSettings(prev => ({
        ...prev,
        custom_fields: prev.custom_fields.map(f => f.id === editingField.id ? fieldWithName : f)
      }));
    } else {
      // Add new field
      const newField = { ...fieldWithName, id: generateId() };
      setSettings(prev => ({
        ...prev,
        custom_fields: [...prev.custom_fields, newField]
      }));
    }
    setEditingField(null);
    setFieldFormData(initialFieldState); // Reset form
  };

  const handleRemoveCustomField = (id) => {
    setSettings(prev => ({
      ...prev,
      custom_fields: prev.custom_fields.filter(field => field.id !== id)
    }));
  };
  
  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(settings.custom_fields);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setSettings(prev => ({
      ...prev,
      custom_fields: items
    }));
  };

  const handleSetupNextYear = () => {
    setSettings(prev => ({
        ...prev,
        period_one_start: prev.period_one_start ? format(addYears(new Date(prev.period_one_start), 1), 'yyyy-MM-dd') : null,
        period_one_end: prev.period_one_end ? format(addYears(new Date(prev.period_one_end), 1), 'yyyy-MM-dd') : null,
        period_two_start: prev.period_two_start ? format(addYears(new Date(prev.period_two_start), 1), 'yyyy-MM-dd') : null,
        period_two_end: prev.period_two_end ? format(addYears(new Date(prev.period_two_end), 1), 'yyyy-MM-dd') : null,
    }));
  };

  const handleSave = () => {
    // No e.preventDefault() needed here as this is triggered by a Button onClick, not form onSubmit
    onUpdate({ semiannual_settings: settings });
  };

  const getRelevantSeatOptions = (isSim) => {
    const type = isSim ? settings.simulator_aircraft_type : settings.aircraft_type;
    return (type === 'AH-64D' || type === 'AH-64E') ? SEAT_OPTIONS.apache : SEAT_OPTIONS.default;
  };

  const relevantSeatOptions = getRelevantSeatOptions(fieldFormData.is_simulator);
  const periodsHaveElapsed = settings.period_two_end && isPast(new Date(settings.period_two_end));
  const arePeriodsSet = settings.period_one_start && settings.period_one_end && settings.period_two_start && settings.period_two_end;

  return (
    <Card className="bg-white shadow-lg border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Semi-annual Flight Requirements
        </CardTitle>
      </CardHeader>
      <form> {/* Removed onSubmit handler from form */}
        <CardContent className="space-y-6">
          {!arePeriodsSet && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-900">Action Required: Set Your Periods</h4>
                  <p className="text-sm text-yellow-800 mt-1">
                    Please define both semi-annual periods below. Your progress on the Dashboard and flight data in Flight Groups will not update correctly until these dates are set.
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="aircraft_type">Aircraft Type for Tracking</Label>
              <Select 
                value={settings.aircraft_type} 
                onValueChange={(value) => handleChange("aircraft_type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select aircraft type" />
                </SelectTrigger>
                <SelectContent>
                  {AIRCRAFT_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="required_hours">Required Flight Hours per Period</Label>
              <Input
                id="required_hours"
                type="number"
                step="0.1"
                min="0"
                value={settings.required_hours}
                onChange={(e) => handleChange("required_hours", parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <Computer className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-slate-900">Simulator Requirements</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="simulator_aircraft_type">Simulator Aircraft Type</Label>
                <Select 
                  value={settings.simulator_aircraft_type === null ? "none" : settings.simulator_aircraft_type} 
                  onValueChange={(value) => handleChange("simulator_aircraft_type", value === 'none' ? null : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select simulator type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {AIRCRAFT_TYPES.filter(type => type !== "All Aircraft").map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="simulator_required_hours">Required Simulator Hours per Period</Label>
                <Input
                  id="simulator_required_hours"
                  type="number"
                  step="0.1"
                  min="0"
                  value={settings.simulator_required_hours}
                  onChange={(e) => handleChange("simulator_required_hours", parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="flex justify-between items-center">
                <h4 className="font-semibold text-slate-900">Semi-annual Periods</h4>
                {periodsHaveElapsed && (
                    <Button type="button" variant="outline" onClick={handleSetupNextYear}>
                        <RotateCw className="w-4 h-4 mr-2" />
                        Setup Next Year
                    </Button>
                )}
            </div>
            <p className="text-sm text-slate-500">
              Define your two semi-annual periods for the year.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4 p-4 border rounded-lg bg-slate-50">
                <h5 className="font-medium text-slate-800">First Period</h5>
                <div className="space-y-2">
                  <Label htmlFor="p1_start">Start Date</Label>
                  <Input id="p1_start" type="date" value={settings.period_one_start || ""} onChange={(e) => handleChange("period_one_start", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="p1_end">End Date</Label>
                  <Input id="p1_end" type="date" value={settings.period_one_end || ""} onChange={(e) => handleChange("period_one_end", e.target.value)} />
                </div>
              </div>
              <div className="space-y-4 p-4 border rounded-lg bg-slate-50">
                <h5 className="font-medium text-slate-800">Second Period</h5>
                 <div className="space-y-2">
                  <Label htmlFor="p2_start">Start Date</Label>
                  <Input id="p2_start" type="date" value={settings.period_two_start || ""} onChange={(e) => handleChange("period_two_start", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="p2_end">End Date</Label>
                  <Input id="p2_end" type="date" value={settings.period_two_end || ""} onChange={(e) => handleChange("period_two_end", e.target.value)} />
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-4 pt-4 border-t">
             <h4 className="font-semibold text-slate-900">Additional Hour Requirements</h4>
            
            {settings.custom_fields.length > 0 && (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="custom-fields">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-2"
                    >
                      {settings.custom_fields.map((field, index) => {
                        return (
                          <Draggable key={field.id} draggableId={field.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`flex items-center justify-between p-3 border rounded-lg bg-slate-50 ${
                                  snapshot.isDragging ? 'shadow-lg' : ''
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    {...provided.dragHandleProps}
                                    className="cursor-grab hover:text-blue-600"
                                  >
                                    <GripVertical className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <span className="font-medium">{field.name}</span>
                                    <span className="text-slate-600 ml-2">
                                      ({field.required_hours}h)
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setEditingField(field)}
                                  >
                                    <Edit className="w-4 h-4 text-blue-600" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveCustomField(field.id)}
                                  >
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        )
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}

            <div className="border rounded-lg p-4">
               <p className="text-sm font-medium text-slate-800 mb-4">{editingField ? `Editing: ${editingField.name}` : "Add a new requirement"}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Removed "Requirement Name" input as it's auto-generated */}
                  <div className="space-y-2">
                    <Label>Required Hours</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={fieldFormData.required_hours}
                      onChange={(e) => handleCustomFieldFormChange("required_hours", parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Flight Mode</Label>
                    <Select 
                      value={fieldFormData.mode === null ? "any" : fieldFormData.mode} 
                      onValueChange={(value) => handleCustomFieldFormChange("mode", value === 'any' ? null : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Any Mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any Mode</SelectItem>
                        {FLIGHT_MODES.map(mode => (
                          <SelectItem key={mode} value={mode}>{mode}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Aircraft/Simulator</Label>
                    <Select 
                      value={fieldFormData.is_simulator ? "simulator" : "aircraft"} 
                      onValueChange={(value) => handleCustomFieldFormChange("is_simulator", value === "simulator")}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aircraft">Aircraft</SelectItem>
                        <SelectItem value="simulator">Simulator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Seat Position</Label>
                     <Select 
                      value={fieldFormData.seat_position === null ? "any" : fieldFormData.seat_position} 
                      onValueChange={(value) => handleCustomFieldFormChange("seat_position", value === 'any' ? null : value)}
                      disabled={
                        (fieldFormData.is_simulator && (!settings.simulator_aircraft_type || settings.simulator_aircraft_type === 'All Aircraft')) ||
                        (!fieldFormData.is_simulator && (!settings.aircraft_type || settings.aircraft_type === 'All Aircraft'))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Any Seat" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any Seat</SelectItem>
                        {relevantSeatOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {((fieldFormData.is_simulator && (!settings.simulator_aircraft_type || settings.simulator_aircraft_type === 'All Aircraft')) ||
                      (!fieldFormData.is_simulator && (!settings.aircraft_type || settings.aircraft_type === 'All Aircraft'))) && (
                      <p className="text-xs text-slate-500">
                        Select a {fieldFormData.is_simulator ? 'simulator' : 'aircraft'} type to enable seat tracking.
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex justify-end mt-4 gap-2">
                    {editingField && (
                        <Button type="button" variant="ghost" onClick={() => {
                          setEditingField(null);
                          setFieldFormData(initialFieldState);
                        }}>Cancel</Button>
                    )}
                  <Button type="button" onClick={handleSaveCustomField}>
                    {editingField ? <><Save className="w-4 h-4 mr-2" />Update Requirement</> : <><Plus className="w-4 h-4 mr-2" />Add Requirement</>}
                  </Button>
                </div>
              </div>
          </div>

          <div className="flex justify-end pt-6 mt-6 border-t">
            <Button
              type="button" // Change type to "button" since form onSubmit is removed
              onClick={handleSave}
              disabled={saving || saveSuccess}
              className={`transition-colors duration-300 w-36 ${
                saveSuccess
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {saveSuccess ? (
                <><Check className="w-4 h-4 mr-2" /> Saved!</>
              ) : saving ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
              ) : (
                <><Save className="w-4 h-4 mr-2" /> Save Settings</>
              )}
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}

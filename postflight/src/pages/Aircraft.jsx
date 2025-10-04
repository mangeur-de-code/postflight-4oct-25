
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Plane, Save, Settings } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const AIRCRAFT_TYPES = ["UH-60", "HH-60", "UH-72", "CH-47", "C-12", "AH-64", "AH-64D", "AH-64E", "Beechcraft Bonanza", "Cessna 150", "Cessna 172 Skyhawk", "Cirrus SR20", "Cirrus SR22", "King Air C90", "Mooney M20", "Piper J-3", "Piper PA-32"];

export default function AircraftPage() {
  const [user, setUser] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [customAircraftTypes, setCustomAircraftTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAircraft, setEditingAircraft] = useState(null);
  const [activeTab, setActiveTab] = useState("inventory");
  const [formData, setFormData] = useState({ aircraft_type: "", tail_number: "", custom_aircraft_type: "" });
  const [customTypeForm, setCustomTypeForm] = useState({ name: "", description: "" });

  useEffect(() => {
    loadUser();
    loadCustomAircraftTypes();
  }, []);

  const loadUser = async () => {
    setLoading(true);
    try {
      const userData = await User.me();
      setUser(userData);
      setInventory(userData.personal_aircraft_inventory || []);
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomAircraftTypes = () => {
    const savedCustomTypes = localStorage.getItem('customAircraftTypes');
    if (savedCustomTypes) {
      try {
        const parsed = JSON.parse(savedCustomTypes);
        // Support both old format (array of strings) and new format (array of objects)
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (typeof parsed[0] === 'string') {
            // Convert old format to new format
            const converted = parsed.map((name) => ({ name, description: '' }));
            setCustomAircraftTypes(converted);
            localStorage.setItem('customAircraftTypes', JSON.stringify(converted));
          } else {
            setCustomAircraftTypes(parsed);
          }
        }
      } catch (error) {
        console.error('Error loading custom aircraft types:', error);
      }
    }
  };

  const saveCustomAircraftType = (customType) => {
    if (customType && customType.trim()) {
      const existingType = customAircraftTypes.find((t) => t.name === customType.trim());
      if (!existingType) {
        const updatedTypes = [...customAircraftTypes, { name: customType.trim(), description: '' }];
        setCustomAircraftTypes(updatedTypes);
        localStorage.setItem('customAircraftTypes', JSON.stringify(updatedTypes));
        return true;
      }
    }
    return false;
  };

  const saveCustomAircraftTypeObject = (typeObj) => {
    if (typeObj.name && typeObj.name.trim()) {
      const existingIndex = customAircraftTypes.findIndex((t) => t.name === typeObj.name.trim());
      let updatedTypes;

      if (existingIndex >= 0) {
        // Update existing type
        updatedTypes = [...customAircraftTypes];
        updatedTypes[existingIndex] = { ...typeObj, name: typeObj.name.trim() };
      } else {
        // Add new type
        updatedTypes = [...customAircraftTypes, { ...typeObj, name: typeObj.name.trim() }];
      }

      setCustomAircraftTypes(updatedTypes);
      localStorage.setItem('customAircraftTypes', JSON.stringify(updatedTypes));
      return true;
    }
    return false;
  };

  const handleUpdateInventory = async (newInventory) => {
    setSaving(true);
    try {
      await User.updateMyUserData({ personal_aircraft_inventory: newInventory });
      setInventory(newInventory);
    } catch (error) {
      console.error("Error saving inventory:", error);
      alert("Failed to save aircraft inventory. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const openForm = (aircraft = null) => {
    if (aircraft) {
      setEditingAircraft(aircraft);
      setFormData({
        aircraft_type: aircraft.aircraft_type,
        tail_number: aircraft.tail_number,
        custom_aircraft_type: aircraft.custom_aircraft_type || ""
      });
    } else {
      setEditingAircraft(null);
      setFormData({ aircraft_type: "", tail_number: "", custom_aircraft_type: "" });
    }
    setIsFormOpen(true);
    setActiveTab("inventory");
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingAircraft(null);
    setCustomTypeForm({ name: "", description: "" });
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCustomTypeFormChange = (field, value) => {
    setCustomTypeForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    let finalAircraftType = formData.aircraft_type;
    let customAircraftType = "";

    // Handle custom aircraft type
    if (formData.aircraft_type === "Custom aircraft") {
      if (!formData.custom_aircraft_type.trim()) {
        alert("Please enter a custom aircraft type.");
        return;
      }
      finalAircraftType = "Custom aircraft";
      customAircraftType = formData.custom_aircraft_type.trim();

      // Save the custom type to localStorage
      saveCustomAircraftType(customAircraftType);
    } else if (customAircraftTypes.find((t) => t.name === formData.aircraft_type)) {
      // This is a previously saved custom type
      finalAircraftType = "Custom aircraft";
      customAircraftType = formData.aircraft_type;
    }

    if (!finalAircraftType) {
      alert("Please select an aircraft type.");
      return;
    }

    if (!formData.tail_number.trim()) {
      alert("Please enter a tail number.");
      return;
    }

    let updatedInventory;
    if (editingAircraft) {
      updatedInventory = inventory.map((item) =>
      item.id === editingAircraft.id ? {
        ...item,
        aircraft_type: finalAircraftType,
        custom_aircraft_type: customAircraftType,
        tail_number: formData.tail_number
      } : item
      );
    } else {
      const newAircraft = {
        id: Date.now().toString(),
        aircraft_type: finalAircraftType,
        custom_aircraft_type: customAircraftType,
        tail_number: formData.tail_number
      };
      updatedInventory = [...inventory, newAircraft];
    }
    handleUpdateInventory(updatedInventory);
    closeForm();
  };

  const handleCustomTypeSubmit = (e) => {
    e.preventDefault();

    if (!customTypeForm.name.trim()) {
      alert("Please enter a custom aircraft type name.");
      return;
    }

    const success = saveCustomAircraftTypeObject(customTypeForm);
    if (success) {
      setCustomTypeForm({ name: "", description: "" });
      alert("Custom aircraft type saved successfully!");
    } else {
      alert("Failed to save custom aircraft type. Please try a different name.");
    }
  };

  const handleDelete = (id) => {
    const updatedInventory = inventory.filter((item) => item.id !== id);
    handleUpdateInventory(updatedInventory);
  };

  const handleDeleteCustomType = (typeToDelete) => {
    // 1. Remove associated aircraft from inventory
    const updatedInventory = inventory.filter((item) => item.custom_aircraft_type !== typeToDelete);
    handleUpdateInventory(updatedInventory);

    // 2. Remove from custom types list and update localStorage
    const updatedCustomTypes = customAircraftTypes.filter((type) => type.name !== typeToDelete);
    setCustomAircraftTypes(updatedCustomTypes);
    localStorage.setItem('customAircraftTypes', JSON.stringify(updatedCustomTypes));
  };

  // Create combined aircraft types list including custom types
  const allAircraftTypes = [
  ...AIRCRAFT_TYPES,
  ...customAircraftTypes.map((t) => t.name),
  "Custom aircraft"];


  // Group inventory by display name (custom types show their custom name)
  const groupedInventory = inventory.reduce((acc, item) => {
    const displayType = item.aircraft_type === "Custom aircraft" ? item.custom_aircraft_type : item.aircraft_type;
    (acc[displayType] = acc[displayType] || []).push(item);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading Aircraft...</p>
        </div>
      </div>);

  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Aircraft Management</h1>
            <p className="text-slate-600 mt-1">Save aircraft here for easy flight logging

            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => {
              setActiveTab("custom-types");
              setIsFormOpen(true);
            }} variant="outline" className="shadow-lg">
              <Settings className="w-4 h-4 mr-2" />
              Add Custom Type
            </Button>
            <Button onClick={() => openForm()} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg">
              <Plus className="w-4 h-4 mr-2" />
              Add Aircraft
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {isFormOpen &&
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-8">

              <Card className="bg-white shadow-lg border-0">
                <CardHeader>
                  <CardTitle>
                    {activeTab === "custom-types" ? "Create Custom Aircraft Type" : editingAircraft ? "Edit Aircraft" : "Add New Aircraft"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="inventory">Aircraft Inventory</TabsTrigger>
                      <TabsTrigger value="custom-types">Custom Aircraft Types</TabsTrigger>
                    </TabsList>

                    <TabsContent value="inventory" className="mt-6">
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="aircraft_type">Aircraft Type</Label>
                            <Select value={formData.aircraft_type} onValueChange={(value) => handleFormChange("aircraft_type", value)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                {AIRCRAFT_TYPES.map((type) =>
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                              )}
                                {customAircraftTypes.map((type) =>
                              <SelectItem key={type.name} value={type.name}>
                                    {type.name} <span className="text-xs text-blue-600 ml-1">(Custom)</span>
                                  </SelectItem>
                              )}
                                <SelectItem value="Custom aircraft">+ Create New Type</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="tail_number">Tail Number</Label>
                            <Input
                            id="tail_number"
                            value={formData.tail_number}
                            onChange={(e) => handleFormChange("tail_number", e.target.value)}
                            placeholder="e.g., N12345"
                            required />

                          </div>
                        </div>

                        {formData.aircraft_type === "Custom aircraft" &&
                      <div className="space-y-2">
                            <Label htmlFor="custom_aircraft_type">Custom Aircraft Type</Label>
                            <Input
                          id="custom_aircraft_type"
                          value={formData.custom_aircraft_type}
                          onChange={(e) => handleFormChange("custom_aircraft_type", e.target.value)}
                          placeholder="Enter custom aircraft type" />

                            {customAircraftTypes.length > 0 &&
                        <div className="text-xs text-slate-500 mt-1">
                                Previously created: {customAircraftTypes.map((t) => t.name).join(", ")}
                              </div>
                        }
                          </div>
                      }

                        <div className="flex justify-end gap-3">
                          <Button type="button" variant="outline" onClick={closeForm}>Cancel</Button>
                          <Button type="submit" disabled={saving}>
                            <Save className="w-4 h-4 mr-2" />
                            {saving ? "Saving..." : "Save Aircraft"}
                          </Button>
                        </div>
                      </form>
                    </TabsContent>

                    <TabsContent value="custom-types" className="mt-6">
                      <form onSubmit={handleCustomTypeSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="custom_type_name">Aircraft Type Name</Label>
                          <Input
                          id="custom_type_name"
                          value={customTypeForm.name}
                          onChange={(e) => handleCustomTypeFormChange("name", e.target.value)}
                          placeholder="e.g., UH-60M, Bell 407, Custom Helicopter"
                          required />

                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="custom_type_description">Description (Optional)</Label>
                          <Input
                          id="custom_type_description"
                          value={customTypeForm.description}
                          onChange={(e) => handleCustomTypeFormChange("description", e.target.value)}
                          placeholder="Brief description or notes about this aircraft type" />

                        </div>

                        <div className="flex justify-end gap-3">
                          <Button type="button" variant="outline" onClick={closeForm}>Cancel</Button>
                          <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                            <Save className="w-4 h-4 mr-2" />
                            Create Custom Type
                          </Button>
                        </div>
                      </form>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </motion.div>
          }
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Aircraft Inventory */}
          <Card className="bg-white shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plane className="w-5 h-5" />
                Aircraft Inventory
              </CardTitle>
              <CardDescription>
                Your saved tail numbers for quick flight logging.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(groupedInventory).length > 0 ?
              <div className="space-y-6">
                  {Object.entries(groupedInventory).map(([displayType, aircrafts]) =>
                <div key={displayType}>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2 flex items-center gap-2">
                        {displayType}
                        {aircrafts[0].aircraft_type === "Custom aircraft" &&
                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">Custom</span>
                    }
                      </h3>
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader className="bg-slate-50">
                            <TableRow>
                              <TableHead>Tail Number</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {aircrafts.map((ac) =>
                        <TableRow key={ac.id}>
                                <TableCell className="font-medium">{ac.tail_number}</TableCell>
                                <TableCell className="text-right">
                                  <Button variant="ghost" size="icon" onClick={() => openForm(ac)}>
                                    <Edit className="w-4 h-4 text-blue-600" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => handleDelete(ac.id)}>
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                        )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                )}
                </div> :

              <div className="text-center py-12">
                  <Plane className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No Aircraft Saved</h3>
                  <p className="text-slate-600">Add an aircraft to get started.</p>
                </div>
              }
            </CardContent>
          </Card>

          {/* Custom Aircraft Types */}
          <Card className="bg-white shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Custom Aircraft Types
              </CardTitle>
              <CardDescription>
                Reusable aircraft types you've created.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {customAircraftTypes.length > 0 ?
              <div className="space-y-2">
                  {customAircraftTypes.map((type) =>
                <div key={type.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <span className="font-medium text-slate-800">{type.name}</span>
                        {type.description &&
                    <p className="text-sm text-slate-500">{type.description}</p>
                    }
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the custom type "{type.name}" and all of its saved tail numbers. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteCustomType(type.name)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                )}
                </div> :

              <div className="text-center py-12">
                  <Settings className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No Custom Types</h3>
                  <p className="text-slate-600">Create custom aircraft types for reuse.</p>
                </div>
              }
            </CardContent>
          </Card>
        </div>
      </div>
    </div>);

}

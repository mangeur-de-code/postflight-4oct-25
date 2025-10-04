import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Award, Save, Edit, Check, RefreshCw } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { isEqual } from "lodash";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";

const AIRCRAFT_CATEGORIES = [
  "Airplane",
  "Rotorcraft",
  "Glider",
  "Lighter-than-air",
  "Powered-lift",
  "Weight-shift-control",
  "Powered parachute"
];

const ENDORSEMENTS = [
  "High Performance",
  "Complex",
  "Tailwheel",
  "High Altitude",
  "Solo",
  "Pressurized",
  "Ground Tow",
  "Aero-Tow",
  "Self-Launch"
];

const CLASS_RATINGS = [
  "Single-engine land",
  "Single-engine sea",
  "Multi-engine land", 
  "Multi-engine sea",
  "Weight-Shift Controla: Land",
  "Weight-Shift Controla: Sea",
  "Helicopter",
  "Gyroplane",
  "Airship",
  "Hot Air Balloon",
  "Gas balloon",
  
];

const ADDITIONAL_RATINGS = [
  "Instrument - Airplane",
  "Instrument - Helicopter",
  "Instrument - Powered-lift",
  "Certified Flight Instructor (CFI)",
  "Certified Flight Instructor - Instrument (CFII)",
  "Multi-Engine Instructor (MEI)",
  "Airline Transport Pilot (ATP)",
  "Ground Instructor - Basic",
  "Ground Instructor - Advanced",
  "Ground Instructor - Instrument",
  "Flight Engineer",
  "Remote Pilot"
];

const RATING_CATEGORIES = [
  { value: "Aircraft Categories", label: "Aircraft Categories", options: AIRCRAFT_CATEGORIES },
  { value: "Endorsements", label: "Endorsements", options: ENDORSEMENTS },
  { value: "Class Ratings", label: "Class Ratings", options: CLASS_RATINGS },
  { value: "Additional Ratings", label: "Additional Ratings", options: ADDITIONAL_RATINGS }
];

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export default function RatingsEndorsements({ user, onUpdate, saving, saveSuccess, onDirtyChange }) {
  const [ratings, setRatings] = useState(user.ratings_endorsements || []);
  const [initialRatings, setInitialRatings] = useState(user.ratings_endorsements || []);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRating, setEditingRating] = useState(null);
  const [newRating, setNewRating] = useState({
    name: "",
    type: "Aircraft Categories",
    date_issued: "",
  });

  useEffect(() => {
    const newRatings = user.ratings_endorsements || [];
    setRatings(newRatings);
    setInitialRatings(newRatings);
  }, [user]);

  useEffect(() => {
    if(onDirtyChange) {
      onDirtyChange(!isEqual(ratings, initialRatings));
    }
  }, [ratings, initialRatings, onDirtyChange]);

  const handleAddRatingDirectly = (name, type) => {
    const rating = { 
      name, 
      type, 
      date_issued: "", 
      id: generateId() 
    };
    const updatedRatings = [...ratings, rating];
    setRatings(updatedRatings);
  };

  const handleAddRating = () => {
    if (!newRating.name) return;
    const rating = { ...newRating, id: generateId() };
    const updatedRatings = [...ratings, rating];
    setRatings(updatedRatings);
    setNewRating({ name: "", type: "Aircraft Categories", date_issued: "" });
    setShowAddForm(false);
  };
  
  const handleUpdateRating = () => {
    if (!editingRating || !editingRating.name) return;
    const updatedRatings = ratings.map(rating => 
      rating.id === editingRating.id ? editingRating : rating
    );
    setRatings(updatedRatings);
    setEditingRating(null);
    setShowAddForm(false);
  };

  const handleDeleteRating = (id) => {
    const updatedRatings = ratings.filter(rating => rating.id !== id);
    setRatings(updatedRatings);
  };

  const handleSave = () => {
    onUpdate({ ratings_endorsements: ratings });
  };

  const currentItem = editingRating || newRating;
  const setCurrentItem = editingRating ? setEditingRating : setNewRating;

  const getCurrentOptions = () => {
    const category = RATING_CATEGORIES.find(cat => cat.value === currentItem.type);
    return category ? category.options : [];
  };

  const groupedRatings = RATING_CATEGORIES.map(category => ({
    ...category,
    items: ratings.filter(rating => rating.type === category.value)
  }));

  return (
    <div className="space-y-6">
      <Card className="bg-white shadow-lg border-0">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Categories, Ratings & Endorsements
          </CardTitle>
          <Button variant="outline" onClick={() => { 
            setEditingRating(null); 
            setNewRating({ name: "", type: "Aircraft Categories", date_issued: "" }); 
            setShowAddForm(true); 
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Custom
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {groupedRatings.map((category) => (
              <div key={category.value} className="space-y-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2 flex-1">
                    {category.label}
                  </h3>
                </div>
                
                <div className="p-4 bg-slate-50/50 rounded-lg border border-slate-200">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-slate-700">
                      Available Options:
                    </Label>
                    <Select
                      value=""
                      onValueChange={(value) => {
                        const alreadyAdded = category.items.some(item => item.name === value);
                        if (!alreadyAdded) {
                          handleAddRatingDirectly(value, category.value);
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select an option to add..." />
                      </SelectTrigger>
                      <SelectContent>
                        {category.options.map((option) => {
                          const alreadyAdded = category.items.some(item => item.name === option);
                          return (
                            <SelectItem 
                              key={option} 
                              value={option}
                              disabled={alreadyAdded}
                              className={alreadyAdded ? "text-green-600" : ""}
                            >
                              {option} {alreadyAdded && "✓"}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500">
                      Select an option from the dropdown to add it instantly.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {category.items.length === 0 ? (
                    <p className="text-sm text-slate-500 italic text-center py-4">
                      No {category.label.toLowerCase()} added yet
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {category.items.map((rating) => (
                        <div key={rating.id} className="border rounded-lg p-3 bg-white shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-slate-900 text-sm">{rating.name}</h4>
                              {rating.date_issued && (
                                <p className="text-xs text-slate-600 mt-1">
                                  Issued: {format(parseISO(rating.date_issued), "MMM d, yyyy")}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-1 ml-2">
                              <Button variant="ghost" size="icon" onClick={() => { 
                                setEditingRating(rating); 
                                setShowAddForm(true); 
                              }} className="h-7 w-7">
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteRating(rating.id)} className="h-7 w-7">
                                <Trash2 className="w-3 h-3 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {showAddForm && (
        <Card className="bg-white shadow-lg border-0">
          <CardHeader>
            <CardTitle>{editingRating ? "Edit Item" : "Add Custom Item"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="itemType">Category</Label>
                <Select 
                  value={currentItem.type}
                  onValueChange={(value) => setCurrentItem({...currentItem, type: value, name: ""})}
                >
                  <SelectTrigger id="itemType"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RATING_CATEGORIES.map(category => (
                      <SelectItem key={category.value} value={category.value}>{category.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="itemName">Rating/Endorsement</Label>
                <Select 
                  value={currentItem.name}
                  onValueChange={(value) => setCurrentItem({...currentItem, name: value})}
                >
                  <SelectTrigger id="itemName">
                    <SelectValue placeholder="Select an option..." />
                  </SelectTrigger>
                  <SelectContent>
                    {getCurrentOptions().map(option => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="customName">Custom Name</Label>
              <Input
                id="customName"
                value={currentItem.name}
                onChange={(e) => setCurrentItem({...currentItem, name: e.target.value})}
                placeholder="Enter a custom rating/endorsement name"
              />
              <p className="text-xs text-slate-500">
                You can select from the dropdown above or enter a custom name here
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="itemDate">Date Issued</Label>
              <Input
                id="itemDate"
                type="date"
                value={currentItem.date_issued}
                onChange={(e) => setCurrentItem({...currentItem, date_issued: e.target.value})}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => {
                setShowAddForm(false);
                setEditingRating(null);
              }}>
                Cancel
              </Button>
              <Button onClick={editingRating ? handleUpdateRating : handleAddRating}>
                {editingRating ? "Update" : "Add"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end pt-6">
        <Button 
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
            <><Save className="w-4 h-4 mr-2" /> Save Changes</>
          )}
        </Button>
      </div>
    </div>
  );
}
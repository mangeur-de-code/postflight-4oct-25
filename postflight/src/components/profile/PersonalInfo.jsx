
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Save, User, Check, RefreshCw } from "lucide-react";
import { isEqual } from "lodash";

export default function PersonalInfo({ user, onUpdate, saving, saveSuccess, onDirtyChange }) {
  const getInitialData = (u) => ({
    first_name: u.first_name || "",
    middle_name: u.middle_name || "",
    last_name: u.last_name || "",
    pilot_license: u.pilot_license || "",
    rank: u.rank || "",
    unit: u.unit || "",
    medical_expiry: u.medical_expiry || "",
    last_faa_flight_review: u.last_faa_flight_review || "",
    preferences: u.preferences || {}
  });

  const [formData, setFormData] = useState(getInitialData(user));
  const [initialData, setInitialData] = useState(getInitialData(user));

  useEffect(() => {
    let newInitialData = getInitialData(user);

    // If name fields are not set, parse from full_name as a one-time default
    if (!user.first_name && !user.last_name && user.full_name) {
      const nameParts = user.full_name.split(' ');
      newInitialData.first_name = nameParts[0] || '';
      newInitialData.last_name = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
      newInitialData.middle_name = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '';
    }
    
    setFormData(newInitialData);
    setInitialData(newInitialData);
  }, [user]);

  useEffect(() => {
    if (onDirtyChange) {
      onDirtyChange(!isEqual(formData, initialData));
    }
  }, [formData, initialData, onDirtyChange]);

  const handleChange = (field, value) => {
    if (field.startsWith('preferences.')) {
      const prefField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        preferences: { ...prev.preferences, [prefField]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(formData);
  };

  return (
    <Card className="bg-white shadow-lg border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Personal Information
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => handleChange("first_name", e.target.value)}
                placeholder="e.g., John"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="middle_name">Middle Name</Label>
              <Input
                id="middle_name"
                value={formData.middle_name}
                onChange={(e) => handleChange("middle_name", e.target.value)}
                placeholder="e.g., Michael"
              />
            </div>
             <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => handleChange("last_name", e.target.value)}
                placeholder="e.g., Doe"
              />
            </div>
          </div>
          
          <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                value={user.email || ""} 
                disabled 
                className="bg-slate-50"
              />
              <p className="text-xs text-slate-500">Email is linked to your login and cannot be changed.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="pilot_license">Pilot License Number</Label>
              <Input
                id="pilot_license"
                value={formData.pilot_license}
                onChange={(e) => handleChange("pilot_license", e.target.value)}
                placeholder="e.g., PPL-123456"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rank">Rank/Title</Label>
              <Input
                id="rank"
                value={formData.rank}
                onChange={(e) => handleChange("rank", e.target.value)}
                placeholder="e.g., Captain, Mr., Ms."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="unit">Unit/Organization</Label>
              <Input
                id="unit"
                value={formData.unit}
                onChange={(e) => handleChange("unit", e.target.value)}
                placeholder="e.g., 1st Aviation Regiment"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="medical_expiry">Medical Certificate Expiry</Label>
              <Input
                id="medical_expiry"
                type="date"
                value={formData.medical_expiry}
                onChange={(e) => handleChange("medical_expiry", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_faa_flight_review">Last FAA Flight Review</Label>
              <Input
                id="last_faa_flight_review"
                type="date"
                value={formData.last_faa_flight_review || ''}
                onChange={(e) => handleChange('last_faa_flight_review', e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800">Preferences</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show_currency_warnings"
                  checked={formData.preferences.show_currency_warnings || false}
                  onCheckedChange={(checked) => handleChange("preferences.show_currency_warnings", checked)}
                />
                <Label htmlFor="show_currency_warnings">Show currency warnings on dashboard</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show_expiry_warnings"
                  checked={formData.preferences.show_expiry_warnings || false}
                  onCheckedChange={(checked) => handleChange("preferences.show_expiry_warnings", checked)}
                />
                <Label htmlFor="show_expiry_warnings">Show expiry warnings for custom fields</Label>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-6">
            <Button
              type="submit"
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
        </CardContent>
      </form>
    </Card>
  );
}

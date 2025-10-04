
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, FileText, Check, RefreshCw } from "lucide-react";
import { isEqual } from "lodash";

const COUNTRIES = [
  "United States", "Canada", "United Kingdom", "Germany", "France", "Australia", 
  "Japan", "Italy", "Spain", "Netherlands", "Sweden", "Norway", "Denmark", 
  "Finland", "Switzerland", "Austria", "Belgium", "Ireland", "New Zealand", 
  "South Korea", "Singapore", "Brazil", "Mexico", "Argentina", "Chile", 
  "Colombia", "Peru", "Venezuela", "Ecuador", "Uruguay", "Paraguay", "Bolivia",
  "India", "China", "Thailand", "Malaysia", "Philippines", "Indonesia", 
  "Vietnam", "South Africa", "Egypt", "Morocco", "Nigeria", "Kenya", "Ghana",
  "Israel", "Turkey", "Saudi Arabia", "UAE", "Qatar", "Kuwait", "Oman",
  "Jordan", "Lebanon", "Iran", "Iraq", "Afghanistan", "Pakistan", "Bangladesh",
  "Sri Lanka", "Nepal", "Myanmar", "Cambodia", "Laos", "Brunei", "Taiwan",
  "Hong Kong", "Macau", "Mongolia", "Kazakhstan", "Uzbekistan", "Turkmenistan",
  "Kyrgyzstan", "Tajikistan", "Georgia", "Armenia", "Azerbaijan", "Russia",
  "Ukraine", "Belarus", "Moldova", "Romania", "Bulgaria", "Serbia", "Croatia",
  "Bosnia and Herzegovina", "Montenegro", "North Macedonia", "Albania", "Kosovo",
  "Slovenia", "Slovakia", "Czech Republic", "Poland", "Hungary", "Lithuania",
  "Latvia", "Estonia", "Portugal", "Greece", "Cyprus", "Malta", "Luxembourg",
  "Iceland", "Liechtenstein", "Monaco", "San Marino", "Vatican City", "Andorra"
];

const CERTIFICATE_TYPES = ["Pilot", "Instructor", "Remote Pilot"];
const CERTIFICATE_LEVELS = ["Student", "Sport", "Recreational", "Private", "ATP", "Commercial"];

export default function CertificateInfo({ user, onUpdate, saving, saveSuccess, onDirtyChange }) {
  const getInitialData = (u) => ({
    ftn: u.certificate_info?.ftn || "",
    solo_date: u.certificate_info?.solo_date || "",
    certificate_type: u.certificate_info?.certificate_type || "",
    certificate_level: u.certificate_info?.certificate_level || "",
    issued_by: u.certificate_info?.issued_by || "",
    date_issued: u.certificate_info?.date_issued || "",
    certificate_number: u.certificate_info?.certificate_number || "",
    cfi_expiration_date: u.certificate_info?.cfi_expiration_date || ""
  });

  const [formData, setFormData] = useState(getInitialData(user));
  const [initialData, setInitialData] = useState(getInitialData(user));

  useEffect(() => {
    const newData = getInitialData(user);
    setFormData(newData);
    setInitialData(newData);
  }, [user]);

  useEffect(() => {
    if (onDirtyChange) {
      onDirtyChange(!isEqual(formData, initialData));
    }
  }, [formData, initialData, onDirtyChange]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate({ certificate_info: formData });
  };

  return (
    <Card className="bg-white shadow-lg border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Certificate Information
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="ftn">FTN</Label>
              <Input
                id="ftn"
                value={formData.ftn}
                onChange={(e) => handleChange("ftn", e.target.value)}
                placeholder="Enter FTN alphanumeric data"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="solo_date">Solo Date</Label>
              <Input
                id="solo_date"
                type="date"
                value={formData.solo_date}
                onChange={(e) => handleChange("solo_date", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="certificate_type">Certificate</Label>
              <Select 
                value={formData.certificate_type}
                onValueChange={(value) => handleChange("certificate_type", value)}
              >
                <SelectTrigger id="certificate_type">
                  <SelectValue placeholder="Select certificate" />
                </SelectTrigger>
                <SelectContent>
                  {CERTIFICATE_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="certificate_level">Certificate Type</Label>
              <Select 
                value={formData.certificate_level}
                onValueChange={(value) => handleChange("certificate_level", value)}
              >
                <SelectTrigger id="certificate_level">
                  <SelectValue placeholder="Select certificate type" />
                </SelectTrigger>
                <SelectContent>
                  {CERTIFICATE_LEVELS.map(level => (
                    <SelectItem key={level} value={level}>{level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="issued_by">Issued by</Label>
              <Select 
                value={formData.issued_by}
                onValueChange={(value) => handleChange("issued_by", value)}
              >
                <SelectTrigger id="issued_by">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map(country => (
                    <SelectItem key={country} value={country}>{country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_issued">Date Issued</Label>
              <Input
                id="date_issued"
                type="date"
                value={formData.date_issued}
                onChange={(e) => handleChange("date_issued", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="certificate_number">Certificate Number</Label>
              <Input
                id="certificate_number"
                value={formData.certificate_number}
                onChange={(e) => handleChange("certificate_number", e.target.value)}
                placeholder="Enter certificate number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cfi_expiration_date">CFI Expiration Date</Label>
              <Input
                id="cfi_expiration_date"
                type="date"
                value={formData.cfi_expiration_date}
                onChange={(e) => handleChange("cfi_expiration_date", e.target.value)}
              />
              <p className="text-xs text-slate-500">Only applicable for CFI certificate holders</p>
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
                <>
                  <Check className="w-4 h-4 mr-2" /> Saved!
                </>
              ) : saving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" /> Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}

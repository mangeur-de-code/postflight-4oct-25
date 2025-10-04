
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch"; // Added as per outline, though not used in logic
import { Plus, Trash2, Save, Edit, X, Check, RefreshCw } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion"; // Added as per outline, though not used in logic
import { isEqual } from "lodash";

const FIELD_TYPES = [
  { value: "date", label: "Date" },
  { value: "number", label: "Number" },
  { value: "text", label: "Text" },
  { value: "hours", label: "Hours" }
];

// Simple UUID generator function to avoid external dependency
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export default function CustomFields({ user, onUpdate, saving, saveSuccess, onDirtyChange }) {
  const [fields, setFields] = useState(user.custom_tracking_fields || []);
  const [initialFields, setInitialFields] = useState(user.custom_tracking_fields || []);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [newField, setNewField] = useState({
    name: "",
    type: "text",
    description: "",
    is_expiry_field: false,
    warning_days: 30,
    value: ""
  });

  useEffect(() => {
    const newFields = user.custom_tracking_fields || [];
    setFields(newFields);
    setInitialFields(newFields);
  }, [user]);

  useEffect(() => {
    if(onDirtyChange) {
      onDirtyChange(!isEqual(fields, initialFields));
    }
  }, [fields, initialFields, onDirtyChange]);

  const handleAddField = () => {
    const field = { ...newField, id: generateId() };
    const updatedFields = [...fields, field];
    setFields(updatedFields);
    setNewField({ name: "", type: "text", description: "", is_expiry_field: false, warning_days: 30, value: "" });
    setShowAddForm(false);
  };

  const handleUpdateField = (id, updatedData) => {
    const updatedFields = fields.map(field => 
      field.id === id ? { ...field, ...updatedData } : field
    );
    setFields(updatedFields);
  };

  const handleDeleteField = (id) => {
    const updatedFields = fields.filter(field => field.id !== id);
    setFields(updatedFields);
  };

  const handleSave = () => {
    onUpdate({ custom_tracking_fields: fields });
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white shadow-lg border-0">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Custom Tracking Fields
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Field
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p>No custom fields created yet.</p>
              <p className="text-sm mt-1">Add fields to track certifications, training, or other important dates.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {fields.map((field) => (
                <div key={field.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-slate-900">{field.name}</h4>
                      <p className="text-sm text-slate-600">{field.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => setEditingField(field)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteField(field.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Current Value</Label>
                      <Input
                        type={field.type === "date" ? "date" : field.type === "number" || field.type === "hours" ? "number" : "text"}
                        value={field.value || ""}
                        onChange={(e) => handleUpdateField(field.id, { value: e.target.value })}
                        placeholder={`Enter ${field.type}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Type & Settings</Label>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <span className="capitalize">{field.type}</span>
                        {field.is_expiry_field && (
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                            Expiry tracking ({field.warning_days}d warning)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-end pt-6 mt-6 border-t">
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
        </CardContent>
      </Card>

      {(showAddForm || editingField) && (
        <Card className="bg-white shadow-lg border-0">
          <CardHeader>
            <CardTitle>{editingField ? "Edit Field" : "Add New Field"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Field Name</Label>
                <Input
                  value={editingField ? editingField.name : newField.name}
                  onChange={(e) => editingField 
                    ? setEditingField({...editingField, name: e.target.value})
                    : setNewField({...newField, name: e.target.value})
                  }
                  placeholder="e.g., Flight Physical, BFR"
                />
              </div>
              <div className="space-y-2">
                <Label>Field Type</Label>
                <Select 
                  value={editingField ? editingField.type : newField.type}
                  onValueChange={(value) => editingField
                    ? setEditingField({...editingField, type: value})
                    : setNewField({...newField, type: value})
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={editingField ? editingField.description : newField.description}
                onChange={(e) => editingField
                  ? setEditingField({...editingField, description: e.target.value})
                  : setNewField({...newField, description: e.target.value})
                }
                placeholder="Brief description of what this field tracks"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_expiry"
                checked={editingField ? editingField.is_expiry_field : newField.is_expiry_field}
                onCheckedChange={(checked) => editingField
                  ? setEditingField({...editingField, is_expiry_field: checked})
                  : setNewField({...newField, is_expiry_field: checked})
                }
              />
              <Label htmlFor="is_expiry">Track expiry date and show warnings</Label>
            </div>
            {(editingField?.is_expiry_field || newField.is_expiry_field) && (
              <div className="space-y-2">
                <Label>Warning Days Before Expiry</Label>
                <Input
                  type="number"
                  min="1"
                  value={editingField ? editingField.warning_days : newField.warning_days}
                  onChange={(e) => editingField
                    ? setEditingField({...editingField, warning_days: parseInt(e.target.value)})
                    : setNewField({...newField, warning_days: parseInt(e.target.value)})
                  }
                />
              </div>
            )}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => {
                setShowAddForm(false);
                setEditingField(null);
              }}>
                Cancel
              </Button>
              <Button onClick={() => {
                if (editingField) {
                  handleUpdateField(editingField.id, editingField);
                  setEditingField(null);
                } else {
                  handleAddField();
                }
              }}>
                {editingField ? "Update Field" : "Add Field"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

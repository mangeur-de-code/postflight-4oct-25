
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Settings, Check, RefreshCw } from "lucide-react";
import { isEqual } from "lodash";

export default function CurrencySettings({ user, onUpdate, saving, saveSuccess, onDirtyChange }) {
  const [settings, setSettings] = useState(user.currency_settings || {
    ng_required_hours: 1,
    ns_required_hours: 1,
    currency_period_days: 60
  });

  const [initialSettings, setInitialSettings] = useState(user.currency_settings || {
    ng_required_hours: 1,
    ns_required_hours: 1,
    currency_period_days: 60
  });

  // Effect to update settings and initialSettings if the user prop changes (e.g., after a save)
  useEffect(() => {
    const newSettings = user.currency_settings || {
      ng_required_hours: 1,
      ns_required_hours: 1,
      currency_period_days: 60
    };
    setSettings(newSettings);
    setInitialSettings(newSettings);
  }, [user]);

  // Effect to notify parent component about dirty state
  useEffect(() => {
    if (onDirtyChange) {
      onDirtyChange(!isEqual(settings, initialSettings));
    }
  }, [settings, initialSettings, onDirtyChange]);

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate({ currency_settings: settings });
    // The initialSettings will be updated via the first useEffect when 'user' prop updates after successful save
  };

  return (
    <Card className="bg-white shadow-lg border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Currency Requirements
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="ng_hours">Night Goggle (NG) Hours Required</Label>
              <Input
                id="ng_hours"
                type="number"
                step="0.1"
                min="0"
                value={settings.ng_required_hours}
                onChange={(e) => handleChange("ng_required_hours", e.target.value)}
              />
              <p className="text-xs text-slate-500">Minimum hours required to maintain NG currency</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ns_hours">Night System (NS) Hours Required</Label>
              <Input
                id="ns_hours"
                type="number"
                step="0.1"
                min="0"
                value={settings.ns_required_hours}
                onChange={(e) => handleChange("ns_required_hours", e.target.value)}
              />
              <p className="text-xs text-slate-500">Minimum hours required to maintain NS currency</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="period_days">Currency Period (Days)</Label>
              <Input
                id="period_days"
                type="number"
                min="1"
                value={settings.currency_period_days}
                onChange={(e) => handleChange("currency_period_days", e.target.value)}
              />
              <p className="text-xs text-slate-500">Number of days to look back for currency calculation</p>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">How Currency Tracking Works</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• The system looks back the specified number of days from today</li>
              <li>• It counts hours flown in NG and NS modes separately</li>
              <li>• You are "current" if you meet the minimum hours in each mode</li>
              <li>• Currency status is displayed on your dashboard</li>
            </ul>
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
                <><Save className="w-4 h-4 mr-2" /> Save Settings</>
              )}
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}

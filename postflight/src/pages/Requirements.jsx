import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Settings, Target } from "lucide-react";
import CurrencySettings from "../components/profile/CurrencySettings";
import SemiannualSettings from "../components/profile/SemiannualSettings";
import UnsavedChangesReminder from "../components/ui/UnsavedChangesReminder";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function RequirementsPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [dirtyState, setDirtyState] = useState({});
  const [activeTab, setActiveTab] = useState("currency");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const userData = await User.me();

      setUser({
        ...userData,
        currency_settings: userData.currency_settings || {
          ng_required_hours: 1,
          ns_required_hours: 1,
          currency_period_days: 60
        },
        semiannual_settings: userData.semiannual_settings || {
          period_one_start: null,
          period_one_end: null,
          period_two_start: null,
          period_two_end: null,
          aircraft_type: "",
          required_hours: 100,
          simulator_required_hours: 0,
          simulator_aircraft_type: "",
          custom_fields: []
        }
      });
      setDirtyState({});
    } catch (error) {
      console.error("Error loading user data:", error);
      window.location.href = 'https://postflight.io/Home';
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (updatedData) => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      await User.updateMyUserData(updatedData);
      setUser(prevUser => ({ ...prevUser, ...updatedData }));
      setDirtyState({});
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (error) {
      console.error("Error updating user:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDirtyChange = (component, isDirty) => {
    setDirtyState((prev) => ({ ...prev, [component]: isDirty }));
  };

  const hasUnsavedChanges = Object.values(dirtyState).some((isDirty) => isDirty);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading requirements...</p>
        </div>
      </div>);
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Flight Requirements</h1>
          <p className="text-slate-600 mt-1">
            Configure your currency tracking and semi-annual flight requirements.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="currency" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Currency Settings
            </TabsTrigger>
            <TabsTrigger value="semiannual" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Semi-annual Requirements
            </TabsTrigger>
          </TabsList>

          <TabsContent value="currency">
            <CurrencySettings
              user={user}
              onUpdate={handleUpdateUser}
              saving={saving}
              saveSuccess={saveSuccess}
              onDirtyChange={(isDirty) => handleDirtyChange('currency', isDirty)}
            />
            <p className="bg-blue-300 text-slate-950 mt-4 p-3 rounded-lg">
              Note: Use the currency requirement section to track if you have met your currency for the selected period. Not if you have met your semi-annual goal.
            </p>
          </TabsContent>

          <TabsContent value="semiannual">
            <SemiannualSettings
              user={user}
              onUpdate={handleUpdateUser}
              saving={saving}
              saveSuccess={saveSuccess}
              onDirtyChange={(isDirty) => handleDirtyChange('semiannual', isDirty)}
            />
          </TabsContent>
        </Tabs>

        <UnsavedChangesReminder show={hasUnsavedChanges} />
      </div>
    </div>
  );
}
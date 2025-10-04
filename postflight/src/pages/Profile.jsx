import React, { useState, useEffect } from "react";
import { User, Flight } from "@/api/entities";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User as UserIcon, FileText, Plus, Trash2, Award } from "lucide-react";
import PersonalInfo from "../components/profile/PersonalInfo";
import CertificateInfo from "../components/profile/CertificateInfo";
import CustomFields from "../components/profile/CustomFields";
import RatingsEndorsements from "../components/profile/RatingsEndorsements";
import DataManagement from "../components/profile/DataManagement";
import UnsavedChangesReminder from "../components/ui/UnsavedChangesReminder";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [dirtyState, setDirtyState] = useState({});
  const [activeTab, setActiveTab] = useState("personal");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [userData, flightData] = await Promise.all([
        User.me(),
        Flight.list("-date")
      ]);

      setUser({
        ...userData,
        certificate_info: userData.certificate_info || {},
        custom_tracking_fields: userData.custom_tracking_fields || [],
        ratings_endorsements: userData.ratings_endorsements || [],
        preferences: userData.preferences || {
          show_currency_warnings: true,
          show_expiry_warnings: true
        },
        currency_settings: userData.currency_settings || {
          ng_required_hours: 6,
          ns_required_hours: 6,
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
      setFlights(flightData);
      setDirtyState({});
    } catch (error) {
      console.error("Error loading user data:", error);
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
    setDirtyState(prev => ({ ...prev, [component]: isDirty }));
  };

  const hasUnsavedChanges = Object.values(dirtyState).some(isDirty => isDirty);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Profile Settings</h1>
          <p className="text-slate-600 mt-1">
            Manage your personal information, custom fields, and data.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="personal" className="flex items-center gap-2">
              <UserIcon className="w-4 h-4" />
              Personal
            </TabsTrigger>
            <TabsTrigger value="certificate" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Certificate
            </TabsTrigger>
            <TabsTrigger value="ratings" className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              Ratings
            </TabsTrigger>
            <TabsTrigger value="fields" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Custom Fields
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              Data
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal">
            <PersonalInfo 
              user={user} 
              onUpdate={handleUpdateUser}
              saving={saving}
              saveSuccess={saveSuccess}
              onDirtyChange={(isDirty) => handleDirtyChange('personal', isDirty)}
            />
          </TabsContent>

          <TabsContent value="certificate">
            <CertificateInfo 
              user={user} 
              onUpdate={handleUpdateUser}
              saving={saving}
              saveSuccess={saveSuccess}
              onDirtyChange={(isDirty) => handleDirtyChange('certificate', isDirty)}
            />
          </TabsContent>

          <TabsContent value="ratings">
            <RatingsEndorsements 
              user={user} 
              onUpdate={handleUpdateUser}
              saving={saving}
              saveSuccess={saveSuccess}
              onDirtyChange={(isDirty) => handleDirtyChange('ratings', isDirty)}
            />
          </TabsContent>

          <TabsContent value="fields">
            <CustomFields 
              user={user} 
              onUpdate={handleUpdateUser}
              saving={saving}
              saveSuccess={saveSuccess}
              onDirtyChange={(isDirty) => handleDirtyChange('customFields', isDirty)}
            />
          </TabsContent>
          
          <TabsContent value="data">
            <DataManagement
              flights={flights}
              onDeletionComplete={loadData}
            />
          </TabsContent>
        </Tabs>

        <UnsavedChangesReminder show={hasUnsavedChanges} />
      </div>
    </div>
  );
}
import React, { useEffect, useState } from "react";
import { Flight } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Save, ArrowLeft } from "lucide-react";
import TaskCodesInput from "@/components/inputs/TaskCodesInput";
import { createPageUrl } from "@/utils";

export default function FlightTasks() {
  const [flight, setFlight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [codes, setCodes] = useState([]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("flightId");
    if (!id) {
      setError("Missing flightId in the URL.");
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const res = await Flight.filter({ id });
        const f = Array.isArray(res) && res.length > 0 ? res[0] : null;
        if (!f) {
          setError("Flight not found.");
        } else {
          setFlight(f);
          setCodes(Array.isArray(f.task_codes) ? f.task_codes : []);
        }
      } catch (e) {
        setError("Failed to load flight.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!flight) return;
    setSaving(true);
    try {
      await Flight.update(flight.id, { task_codes: codes });
      window.alert("Task codes saved.");
      window.location.href = window.location.origin + createPageUrl("FlightLog");
    } catch (e) {
      window.alert("Failed to save task codes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Unable to edit Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700">{error}</p>
            <div className="mt-4">
              <Button variant="outline" onClick={() => (window.location.href = window.location.origin + createPageUrl("FlightLog"))}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Flight Log
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isTraining = flight?.mission_type === "T";

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Edit Task Codes</h1>
          <p className="text-slate-600 mt-1">
            {flight?.aircraft_type === "Custom"
              ? flight?.custom_aircraft_type
              : flight?.aircraft_type}{" "}
            • {flight?.date}
          </p>
        </div>

        <Card className="bg-white shadow-lg border-0">
          <CardHeader>
            <CardTitle>Task Codes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isTraining && (
              <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3">
                This flight is not a Training mission (T). Task codes are typically used for Training missions.
              </div>
            )}

            <TaskCodesInput value={codes} onChange={setCodes} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => (window.location.href = window.location.origin + createPageUrl("FlightLog"))}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90">
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
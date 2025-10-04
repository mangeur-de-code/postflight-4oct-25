
import React, { useEffect, useState } from "react";
import FlightForm from "@/components/flight/FlightFormNR";
import { Flight, User, GroupInfoDate } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function NewFlight() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const me = await User.me();
        setUser(me);
      } catch (e) {
        setError("You need to be logged in to log a flight.");
      } finally {
        setLoadingUser(false);
      }
    };
    loadUser();
  }, []);

  const checkForNVGModes = (flightData) => {
    const nvgModes = [];
    flightData.hour_breakdown?.forEach(breakdown => {
      if (breakdown.mode === 'NG' || breakdown.mode === 'NS') {
        if (!nvgModes.includes(breakdown.mode)) {
          nvgModes.push(breakdown.mode);
        }
      }
    });
    return nvgModes;
  };

  const handleSubmit = async (flightData) => {
    // Create new flight
    const cleanFlightData = { ...flightData };
    delete cleanFlightData.organization_id;
    delete cleanFlightData.org_member_emails;

    await Flight.create(cleanFlightData);

    // Optional group info updates (same logic used in Flight Log)
    const nvgModes = checkForNVGModes(cleanFlightData);
    if (nvgModes.length > 0 && user?.email && user.joined_flight_group_ids?.length > 0) {
      try {
        const userName = user.first_name && user.last_name 
          ? `${user.first_name} ${user.last_name}` 
          : user.full_name || user.email;

        const existingRecords = await GroupInfoDate.filter({ user_email: user.email });
        const existing = existingRecords.length > 0 ? existingRecords[0] : null;

        const flightDate = cleanFlightData.date || null;
        if (!flightDate) throw new Error("Flight date is missing.");

        const updateData = { user_email: user.email, user_name: userName };
        let needsUpdate = false;

        if (nvgModes.includes('NG')) {
          const ngHours = cleanFlightData.hour_breakdown
            .filter(hb => hb.mode === 'NG')
            .reduce((sum, hb) => sum + (hb.duration || 0), 0);
          if (ngHours >= 1.0 && (!existing?.last_ng_date || new Date(flightDate) > new Date(existing.last_ng_date))) {
            updateData.last_ng_date = flightDate;
            needsUpdate = true;
          }
        }

        if (nvgModes.includes('NS')) {
          const nsHours = cleanFlightData.hour_breakdown
            .filter(hb => hb.mode === 'NS')
            .reduce((sum, hb) => sum + (hb.duration || 0), 0);
          if (nsHours >= 1.0 && (!existing?.last_ns_date || new Date(flightDate) > new Date(existing.last_ns_date))) {
            updateData.last_ns_date = flightDate;
            needsUpdate = true;
          }
        }

        if (needsUpdate) {
          if (existing) {
            const mergedData = { ...existing, ...updateData };
            await GroupInfoDate.update(existing.id, mergedData);
          } else {
            await GroupInfoDate.create(updateData);
          }
        }
      } catch (groupInfoError) {
        console.error("Failed to auto-update group information", groupInfoError);
      }
    }

    // After save, go back to Flight Log
    window.location.href = window.location.origin + createPageUrl("FlightLog");
  };

  const handleCancel = () => {
    window.location.href = window.location.origin + createPageUrl("FlightLog");
  };

  useEffect(() => {
    // Inject a native date picker that controls the existing text date input (kept for form logic)
    const mmddToIso = (s) => {
      if (!s) return "";
      const parts = s.split("/");
      if (parts.length !== 3) return "";
      const [mm, dd, yyyy] = parts.map((p) => p.padStart(2, "0"));
      if (!yyyy || yyyy.length < 4) return "";
      return `${yyyy}-${mm}-${dd}`;
    };

    const isoToMmdd = (s) => {
      if (!s) return "";
      const parts = s.split("-");
      if (parts.length !== 3) return "";
      const [yyyy, mm, dd] = parts;
      return `${mm}/${dd}/${yyyy}`;
    };

    const setupDatePicker = () => {
      const textInput = document.querySelector('input#date');
      if (!textInput) return;

      // Avoid duplicate insertion
      if (document.getElementById('date-picker-proxy')) return;

      // Create native date input
      const dateInput = document.createElement('input');
      dateInput.type = 'date';
      dateInput.id = 'date-picker-proxy';

      // Try to mimic styling of original input
      dateInput.className = textInput.className || 'border rounded-md px-3 py-2 w-full';

      // Initialize value from the existing MM/DD/YYYY
      dateInput.value = mmddToIso(textInput.value);

      // On change, convert ISO -> MM/DD/YYYY and update original input so React state updates
      dateInput.addEventListener('change', () => {
        const mmdd = isoToMmdd(dateInput.value);
        // Update underlying controlled input and dispatch input event
        textInput.value = mmdd;
        const evt = new Event('input', { bubbles: true });
        textInput.dispatchEvent(evt);
      });

      // Try to place the date picker right under the label
      // Structure: div.space-y-2 > Label(for="date") + Input#date
      const container = textInput.parentElement;
      const label = container ? container.querySelector('label[for="date"]') : null;

      if (label && container) {
        label.insertAdjacentElement('afterend', dateInput);
        // Hide the original text input
        textInput.style.display = 'none';
      } else if (textInput.parentElement) {
        textInput.parentElement.insertBefore(dateInput, textInput);
        textInput.style.display = 'none';
      }
    };

    // Run once and also watch for dynamic mounts
    setupDatePicker();
    let observer;
    try {
      observer = new MutationObserver(() => setupDatePicker());
      observer.observe(document.body, { childList: true, subtree: true });
    } catch (_) {}

    return () => {
      try { if (observer) observer.disconnect(); } catch (_) {}
      const proxy = document.getElementById('date-picker-proxy');
      const textInput = document.querySelector('input#date');
      if (proxy && proxy.parentElement) proxy.parentElement.removeChild(proxy);
      if (textInput) textInput.style.display = '';
    };
  }, []);

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
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
              Cannot Log Flight
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Log New Flight</h1>
          <p className="text-slate-600 mt-1">Fill in the details below to add a new flight.</p>
        </div>

        <FlightForm
          user={user}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}


import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { FlightGroup, User, GroupInfoDate, Flight } from "@/api/entities";
import { SendEmail } from "@/api/integrations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Users, Code, Edit, Trash2, X, Save, UserPlus, LogOut as LogOutIcon, RefreshCw, ChevronDown, AlertTriangle, BellRing, Settings, Trophy, ChevronUp, Check, CheckCircle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format, parseISO, addDays, differenceInCalendarDays, endOfDay, isWithinInterval, startOfDay, subDays, isAfter } from "date-fns";
import { createPageUrl } from "@/utils";
import { getGroupLeaderboard } from "@/api/functions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from 'react-router-dom'; // Added Link import for client-side navigation

// Helper: compute initials from full name or email
function getInitials(fullName, email) {
  if (fullName && typeof fullName === 'string') {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    if (parts.length === 1 && parts[0].length > 0) {
      return parts[0].substring(0, 2).toUpperCase();
    }
  }
  if (email && typeof email === 'string') {
    const local = email.split('@')[0] || '';
    const tokens = local.split(/[._-]+/).filter(Boolean);
    if (tokens.length >= 2) {
      return (tokens[0][0] + tokens[tokens.length - 1][0]).toUpperCase();
    }
    return (local.substring(0, 2) || '??').toUpperCase();
  }
  return '??';
}

function GroupSettingsModal({ group, onUpdate, children }) {
    const [isOpen, setIsOpen] = useState(false);
    const [settings, setSettings] = useState(group.settings || { leaderboard_enabled: false, leaderboard_period: "30" });

    useEffect(() => {
        setSettings(group.settings || { leaderboard_enabled: false, leaderboard_period: "30" });
    }, [group.settings]);

    const handleSave = () => {
        onUpdate(group.id, settings);
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Leaderboard Settings</DialogTitle>
                    <DialogDescription>
                        Manage the flight hours leaderboard for your group.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="leaderboard-enabled" className="cursor-pointer">Enable Leaderboard</Label>
                        <Switch
                            id="leaderboard-enabled"
                            checked={settings.leaderboard_enabled}
                            onCheckedChange={(checked) => setSettings(s => ({ ...s, leaderboard_enabled: checked }))}
                        />
                    </div>
                    {settings.leaderboard_enabled && (
                        <div className="space-y-2">
                            <Label htmlFor="leaderboard-period">Leaderboard Period</Label>
                            <Select
                                value={settings.leaderboard_period}
                                onValueChange={(value) => setSettings(s => ({ ...s, leaderboard_period: value }))}
                            >
                                <SelectTrigger id="leaderboard-period">
                                    <SelectValue placeholder="Select period" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="30">Last 30 Days</SelectItem>
                                    <SelectItem value="90">Last 90 Days</SelectItem>
                                    <SelectItem value="365">Last 365 Days</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function FlightGroupPage() {
  const [groups, setGroups] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    id_code: ""
  });
  const [formSaving, setFormSaving] = useState(false);
  const [formSaveSuccess, setFormSaveSuccess] = useState(false);
  const [memberFlightInfo, setMemberFlightInfo] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [expandedGroupId, setExpandedGroupId] = useState(null);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardSort, setLeaderboardSort] = useState({ key: 'total', order: 'desc' });
  const [joinSuccessInfo, setJoinSuccessInfo] = useState(null);
  const [showRefreshReminder, setShowRefreshReminder] = useState(false);
  const reminderTimerRef = useRef(null); // Using useRef for timer ID


  const startReminderTimer = useCallback(() => {
    if (reminderTimerRef.current) {
      clearTimeout(reminderTimerRef.current);
    }
    const newTimer = setTimeout(() => {
      setShowRefreshReminder(true);
      reminderTimerRef.current = null; // Clear ref once timer fires
    }, 10 * 60 * 1000); // 10 minutes
    reminderTimerRef.current = newTimer;
  }, []); // Depend on setShowRefreshReminder, which is a stable setter.

  useEffect(() => {
    loadData();
    startReminderTimer();

    return () => {
      if (reminderTimerRef.current) {
        clearTimeout(reminderTimerRef.current);
      }
    };
  }, [startReminderTimer]); // useEffect depends on startReminderTimer, which is a stable useCallback

  const loadData = async () => {
    console.log("DEBUG: Starting loadData...");
    setLoading(true);
    setError(null);
    let success = false;
    let retries = 3;

    while (retries > 0 && !success) {
      try {
        // Try to get user data first - this is now the authentication gate
        let userData;
        try {
          userData = await User.me();
          console.log("DEBUG: User.me() successful.");
        } catch (userError) {
          console.log("User authentication failed:", userError);
          // Redirect immediately if not authenticated - don't show any flight group data
          window.location.href = window.location.origin + createPageUrl("Home");
          return;
        }

        // Only proceed to load flight group data if user is authenticated
        let groupData = [];
        try {
          groupData = await FlightGroup.list("-created_date");
          console.log("DEBUG: FlightGroup.list() successful.");
        } catch (groupError) {
          console.error("Failed to load flight groups:", groupError);
          // Continue with empty groups array rather than failing completely
          groupData = [];
        }

        console.log("DEBUG: Fetched user data:", JSON.stringify(userData, null, 2));
        console.log("DEBUG: Fetched group data:", JSON.stringify(groupData, null, 2));

        setGroups(groupData);
        setUser(userData);

        const allMemberEmails = new Set();
        groupData.forEach((group) => {
          (group.members || []).forEach((member) => {
            // Normalize member object if it's just an email string
            const memberEmail = typeof member === 'string' ? member : member.email;
            allMemberEmails.add(memberEmail);
          });
        });

        // Refactored to fetch all GroupInfoDate records at once
        const memberFlightData = {};
        if (allMemberEmails.size > 0) {
          try {
            const allMemberInfo = await GroupInfoDate.filter(); // Fetch all records, filter locally for efficiency if needed, but DB call is cheaper for all
            const infoMap = new Map(allMemberInfo.map((info) => [info.user_email, info]));

            for (const email of allMemberEmails) {
              const userInfo = infoMap.get(email);
              if (userInfo) {
                memberFlightData[email] = userInfo;
              }
            }
          } catch (error) {
            console.log("Could not load member flight info:", error);
            // Check for the specific database timeout error
            if (error.message && error.message.includes("ServerSelectionTimeoutError")) {
              throw new Error("DatabaseTimeout"); // Throw a custom error to be caught below
            }
          }
        }

        setMemberFlightInfo(memberFlightData);
        success = true;
      } catch (error) {
        retries--;
        console.error(`DEBUG: Error loading flight group data, retries left: ${retries}`, error);

        if (error.message === "DatabaseTimeout") {
          setError("There is a temporary issue connecting to the database. Please wait a moment and try again.");
          setLoading(false);
          return; // Exit the loop and show the error
        }

        // Additional authentication check - redirect if auth fails during retries
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.log("Authentication error during retry, redirecting to Home.");
          window.location.href = window.location.origin + createPageUrl("Home");
          return;
        }

        if (retries > 0) {
          await new Promise((res) => setTimeout(res, Math.min((3 - retries) * 2000, 8000)));
        } else {
          setError("Unable to load flight group data after multiple attempts. This may be due to temporary server issues. Please try refreshing the page.");
          console.error("Failed to load flight group data after multiple retries.");
        }
      }
    }
    setLoading(false);
  };

  // Moved getCurrentPeriod before its usage in updateGroupInfoWithSemiannualData
  const getCurrentPeriod = useCallback((settings) => {
    if (!settings || (!settings.period_one_start && !settings.period_two_start)) {
      return null;
    }

    const currentDate = startOfDay(new Date());

    if (settings.period_one_start && settings.period_one_end) {
      const p1_start = parseISO(settings.period_one_start);
      const p1_end = parseISO(settings.period_one_end);
      if (isWithinInterval(currentDate, { start: startOfDay(p1_start), end: endOfDay(p1_end) })) {
        return { start: startOfDay(p1_start), end: endOfDay(p1_end), name: "First Semi-annual Period" };
      }
    }

    if (settings.period_two_start && settings.period_two_end) {
      const p2_start = parseISO(settings.period_two_start);
      const p2_end = parseISO(settings.period_two_end);
      if (isWithinInterval(currentDate, { start: startOfDay(p2_start), end: endOfDay(p2_end) })) {
        return { start: startOfDay(p2_start), end: endOfDay(p2_end), name: "Second Semi-annual Period" };
      }
    }

    return null;
  }, []);

  const updateGroupInfoWithSemiannualData = useCallback(async () => {
    if (!user) return;

    try {
      const userFlights = await Flight.filter({ created_by: user.email }, "-date");
      const userName = user.first_name && user.last_name ?
        `${user.first_name} ${user.last_name}` :
        user.full_name || user.email;

      // --- START: Added NG/NS Date Calculation ---
      const findLastFlightDate = (flights, mode, minHours) => {
        // Sort flights by date descending to easily find the most recent
        const sortedFlights = [...flights].sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
        
        const relevantFlight = sortedFlights.find(flight => {
          const modeHours = (flight.hour_breakdown || [])
            .filter(hb => hb.mode === mode)
            .reduce((sum, hb) => sum + (hb.duration || 0), 0);
          return modeHours >= minHours;
        });
        return relevantFlight ? relevantFlight.date : null;
      };

      // Find the most recent date for a flight with at least 1.0 NG hour
      const lastNGDate = findLastFlightDate(userFlights, 'NG', 1.0);
      // Find the most recent date for a flight with at least 1.0 NS hour
      const lastNSDate = findLastFlightDate(userFlights, 'NS', 1.0);
      // --- END: Added NG/NS Date Calculation ---

      // Calculate totals for 30, 90, 365 days, separated by source
      const now = new Date();
      const thirtyDaysAgo = subDays(now, 30);
      const ninetyDaysAgo = subDays(now, 90);
      const threeSixtyFiveDaysAgo = subDays(now, 365);

      const calculateHoursInPeriod = (flights, startDate) => {
        const periodFlights = flights.filter(flight => isAfter(parseISO(flight.date), startDate));
        
        const aircraftHours = periodFlights
            .filter(f => !f.is_simulator)
            .reduce((sum, f) => sum + (f.total_flight_hours || 0), 0);

        const simulatorHours = periodFlights
            .filter(f => f.is_simulator)
            .reduce((sum, f) => sum + (f.total_flight_hours || 0), 0);

        return { aircraftHours, simulatorHours };
      };

      const { aircraftHours: ac_hours_30, simulatorHours: sim_hours_30 } = calculateHoursInPeriod(userFlights, thirtyDaysAgo);
      const { aircraftHours: ac_hours_90, simulatorHours: sim_hours_90 } = calculateHoursInPeriod(userFlights, ninetyDaysAgo);
      const { aircraftHours: ac_hours_365, simulatorHours: sim_hours_365 } = calculateHoursInPeriod(userFlights, threeSixtyFiveDaysAgo);


      let aircraftHours = 0;
      let simulatorHours = 0;
      let period = null; // Declare period here
      if (user.semiannual_settings) {
          const settings = user.semiannual_settings;
          period = getCurrentPeriod(settings);
          
          if (period) {
            const periodFlights = userFlights.filter((flight) => {
                const flightDate = startOfDay(parseISO(flight.date));
                return isWithinInterval(flightDate, { start: period.start, end: period.end });
            });

            aircraftHours = periodFlights
              .filter((flight) => !flight.is_simulator)
              .reduce((sum, flight) => sum + (flight.total_flight_hours || 0), 0);

            simulatorHours = periodFlights
              .filter((flight) => flight.is_simulator)
              .reduce((sum, flight) => sum + (flight.total_flight_hours || 0), 0);
          }
      }

      const existingRecords = await GroupInfoDate.filter({ user_email: user.email });
      const existing = existingRecords.length > 0 ? existingRecords[0] : null;
      
      const updateData = {
        user_email: user.email,
        user_name: userName,
        last_ng_date: lastNGDate, // Add to update payload
        last_ns_date: lastNSDate, // Add to update payload
        aircraft_hours_last_30_days: parseFloat(ac_hours_30.toFixed(1)),
        simulator_hours_last_30_days: parseFloat(sim_hours_30.toFixed(1)),
        aircraft_hours_last_90_days: parseFloat(sim_hours_90.toFixed(1)),
        simulator_hours_last_90_days: parseFloat(ac_hours_90.toFixed(1)),
        aircraft_hours_last_365_days: parseFloat(ac_hours_365.toFixed(1)),
        simulator_hours_last_365_days: parseFloat(sim_hours_365.toFixed(1)),
        semiannual_aircraft_hours: aircraftHours,
        semiannual_simulator_hours: simulatorHours,
      };

      if (period) {
        updateData.semiannual_required_hours = user.semiannual_settings.required_hours || 100;
        updateData.semiannual_simulator_required_hours = user.semiannual_settings.simulator_required_hours || 0;
        updateData.current_period_name = period.name;
        updateData.current_period_start = format(period.start, 'yyyy-MM-dd');
        updateData.current_period_end = format(period.end, 'yyyy-MM-dd');
      }

      if (existing) {
        const mergedData = { ...existing, ...updateData };
        await GroupInfoDate.update(existing.id, mergedData);
      } else {
        await GroupInfoDate.create(updateData);
      }

      console.log("Successfully updated group and leaderboard data.");

    } catch (error) {
      console.error("Failed to update group info with semi-annual and leaderboard data:", error);
    }
  }, [user, getCurrentPeriod]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      // Re-calculate and save the latest data for the current user.
      await updateGroupInfoWithSemiannualData();
      // Reload all data for the page, which will include the newly refreshed data.
      await loadData();
      // Hide reminder and restart the timer
      setShowRefreshReminder(false);
      startReminderTimer();
    } finally {
      setRefreshing(false);
    }
  };

  const handleLeaderboardSort = (newKey) => {
    setLeaderboardSort(prevSort => {
        if (prevSort.key === newKey) {
            // Toggle order if same key is clicked
            return { ...prevSort, order: prevSort.order === 'asc' ? 'desc' : 'asc' };
        } else {
            // Reset to descending for new key
            return { key: newKey, order: 'desc' };
        }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormSaving(true);
    setFormSaveSuccess(false);
    console.log("DEBUG: handleSubmit called.");
    try {
      if (editingGroup) {
        // Send ONLY the fields from the form that can be edited
        const updatePayload = {
          name: formData.name,
          description: formData.description,
          id_code: formData.id_code
        };

        console.log("DEBUG: Submitting update for group:", editingGroup.id);
        console.log("DEBUG: Update payload:", JSON.stringify(updatePayload, null, 2));
        await FlightGroup.update(editingGroup.id, updatePayload);
      } else {
        // Create logic remains the same
        const fullName = user.first_name && user.last_name ?
        `${user.first_name} ${user.last_name}` :
        user.full_name || user.email;
        const creatorAsMember = { email: user.email, full_name: fullName };

        const createPayload = {
          name: formData.name,
          description: formData.description,
          id_code: formData.id_code,
          admin_email: user.email,
          created_by_name: fullName,
          members: [creatorAsMember],
          pending_members: []
        };
        console.log("DEBUG: Submitting new group creation.");
        console.log("DEBUG: Create payload:", JSON.stringify(createPayload, null, 2));
        await FlightGroup.create(createPayload);
      }

      setFormSaveSuccess(true);
      setTimeout(() => {
        handleCancel(); // This also resets formSaving and formSaveSuccess
        loadData();
      }, 1500);

    } catch (error) {
      console.error("DEBUG: Error saving flight group:", error);
      console.error("DEBUG: Full error object in handleSubmit:", error);
      if (error.response) {
        console.error("DEBUG: Error response data:", error.response.data);
      }
      alert("An error occurred while saving the flight group. Please try again.");
    } finally {
      setFormSaving(false);
    }
  };

  useEffect(() => {
    if (user) { // user check is enough, semiannual_settings check is inside the function
      updateGroupInfoWithSemiannualData();
    }
  }, [user, updateGroupInfoWithSemiannualData]);

  const handleEdit = (group) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      description: group.description || "",
      id_code: group.id_code
    });
    setShowForm(true);
  };

  const handleDelete = async (groupId) => {
    if (window.confirm("Are you sure you want to delete this flight group? This action cannot be undone.")) {
      try {
        await FlightGroup.delete(groupId);
        await loadData();
      } catch (error) {
        console.error("Error deleting flight group:", error);
        alert("An error occurred while deleting the flight group. Please try again.");
      }
    }
  };

  const handleJoinGroup = async (group) => {
    console.log("DEBUG: handleJoinGroup called for group:", JSON.stringify(group, null, 2));
    if (!user) return;

    try {
      const fullName = user.first_name && user.last_name ?
      `${user.first_name} ${user.last_name}` :
      user.full_name || user.email;

      const newMember = { email: user.email, full_name: fullName };

      const normalizedMembers = (group.members || []).map((m) =>
      typeof m === "string" ? { email: m, full_name: m } : m
      );

      const isAlreadyMember = normalizedMembers.some((m) => m.email === user.email);
      if (isAlreadyMember) {
        alert("You are already a member of this group.");
        return;
      }

      const updatedMembers = [...normalizedMembers, newMember];

      const updateData = {
        members: updatedMembers
      };

      console.log("DEBUG: Attempting to join group with data:", JSON.stringify(updateData, null, 2));

      await FlightGroup.update(group.id, updateData);

      // Send notification email to admin about new member
      if (group.admin_email) {
        try {
          const emailPayload = {
            to: group.admin_email,
            subject: `New Member Joined "${group.name}" on PostFlight.io`,
            body: `
              <p>Hello ${group.created_by_name || 'Group Admin'},</p>
              <p>The user <strong>${fullName}</strong> (${user.email}) has joined your flight group, "${group.name}".</p>
              <p>They now have access to view group member flight data on the Flight Groups page.</p>
              <p>Thank you,</p>
              <p>The PostFlight.io Team</p>
            `
          };
          console.log("DEBUG: SendEmail payload:", JSON.stringify(emailPayload, null, 2));
          await SendEmail(emailPayload);
        } catch (emailError) {
          console.warn('Failed to send email notification:', emailError);
          // Don't fail the entire operation if email fails
        }
      }

      // Reload data and show success message
      await loadData();
      setJoinSuccessInfo(group.name);

    } catch (error) {
      console.error("DEBUG: Error joining group:", error);
      console.error("DEBUG: Full error object in handleJoinGroup:", error);
      if (error.response) {
        console.error("DEBUG: Error response data:", error.response.data);
      }
      alert(`Could not join group: ${error.response?.data?.message || error.message || 'Unknown error'}. Please try again.`);
    }
  };

  const handleApproveRequest = async (group, memberToApprove) => {
    console.log("DEBUG: handleApproveRequest called for group:", JSON.stringify(group, null, 2), "and member:", JSON.stringify(memberToApprove, null, 2));
    try {
      const updatedPending = (group.pending_members || []).filter((m) => m.email !== memberToApprove.email);

      const normalizedMembers = (group.members || []).map((m) =>
      typeof m === "string" ? { email: m, full_name: m } : m
      );
      const updatedMembers = [...normalizedMembers, memberToApprove];

      const updatePayload = {
        members: updatedMembers,
        pending_members: updatedPending
      };
      console.log("DEBUG: Approve request update payload:", JSON.stringify(updatePayload, null, 2));
      await FlightGroup.update(group.id, updatePayload);

      const emailPayload = {
        to: memberToApprove.email,
        subject: `Your request to join "${group.name}" has been approved!`,
        body: `<p>Hello ${memberToApprove.full_name},</p><p>Your request to join the flight group "${group.name}" on PostFlight.io has been approved by the group admin.</p><p>You can now see the group and its members' flight data on the Flight Groups page.</p><p>The PostFlight.io Team</p>`
      };
      console.log("DEBUG: SendEmail payload:", JSON.stringify(emailPayload, null, 2));
      await SendEmail(emailPayload);

      await loadData();
    } catch (error) {
      console.error("DEBUG: Error approving request:", error);
      console.error("DEBUG: Full error in handleApproveRequest:", error);
      if (error.response) console.error("DEBUG: Error response:", error.response.data);
      alert("Could not approve request. Please try again.");
    }
  };

  const handleDenyRequest = async (group, memberToDeny) => {
    console.log("DEBUG: handleDenyRequest called for group:", JSON.stringify(group, null, 2), "and member:", JSON.stringify(memberToDeny, null, 2));
    try {
      const updatedPending = (group.pending_members || []).filter((m) => m.email !== memberToDeny.email);

      const updatePayload = {
        pending_members: updatedPending
      };
      console.log("DEBUG: Deny request update payload:", JSON.stringify(updatePayload, null, 2));
      await FlightGroup.update(group.id, updatePayload);

      const emailPayload = {
        to: memberToDeny.email,
        subject: `Update on your request to join "${group.name}"`,
        body: `<p>Hello ${memberToDeny.full_name},</p><p>Regarding your request to join the flight group "${group.name}" on PostFlight.io, the group admin has chosen not to approve your request at this time.</p><p>The PostFlight.io Team</p>`
      };
      console.log("DEBUG: SendEmail payload:", JSON.stringify(emailPayload, null, 2));
      await SendEmail(emailPayload);

      await loadData();
    } catch (error) {
      console.error("DEBUG: Error denying request:", error);
      console.error("DEBUG: Full error in handleDenyRequest:", error);
      if (error.response) console.error("DEBUG: Error response:", error.response.data);
      alert("Could not deny request. Please try again.");
    }
  };

  const handleLeaveGroup = async (group) => {
    console.log("DEBUG: handleLeaveGroup called for group:", JSON.stringify(group, null, 2));
    if (!user) return;
    const isCreator = group.created_by === user.email;

    let confirmationMessage = `Are you sure you want to leave the group "${group.name}"?`;
    if (isCreator) {
      confirmationMessage += "\n\nYou are the creator of this group. Leaving will not delete it, and you can still manage it if you rejoin.";
    }

    if (window.confirm(confirmationMessage)) {
      try {
        const normalizedMembers = (group.members || []).map((m) =>
        typeof m === "string" ? { email: m, full_name: m } : m
        );
        const updatedMembers = normalizedMembers.filter((m) => m.email !== user.email);

        const updatePayload = {
          members: updatedMembers
        };
        console.log("DEBUG: Leave group update payload:", JSON.stringify(updatePayload, null, 2));
        await FlightGroup.update(group.id, updatePayload);

        // Update user's joined groups list
        const updatedGroupIds = (user.joined_flight_group_ids || []).filter((id) => id !== group.id);
        await User.updateMyUserData({ joined_flight_group_ids: updatedGroupIds });

        await loadData();
      } catch (error) {
        console.error("DEBUG: Error leaving the group:", error);
        console.error("DEBUG: Full error in handleLeaveGroup:", error);
        if (error.response) console.error("DEBUG: Error response:", error.response.data);
        alert("Could not leave the group. Please try again.");
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingGroup(null);
    setFormData({ name: "", description: "", id_code: "" });
    setFormSaving(false);
    setFormSaveSuccess(false);
  };

  const handleToggleGroup = (groupId) => {
    setExpandedGroupId((prevId) => prevId === groupId ? null : groupId);
  };

  const getLastNVGInfo = (memberEmail) => {
    const memberInfo = memberFlightInfo[memberEmail];
    if (!memberInfo) return null;

    return {
      lastNG: memberInfo.last_ng_date,
      lastNS: memberInfo.last_ns_date
    };
  };

  const getCurrencyStatusBadge = (lastDate, periodDays, modeLabel) => {
    if (!lastDate) {
      return <Badge variant="outline" className="text-xs text-slate-500">{`No ${modeLabel} data`}</Badge>;
    }

    try {
      // Additional validation before parsing
      if (typeof lastDate !== 'string' || lastDate.trim() === '') {
        return <Badge variant="outline" className="text-xs text-slate-500">{`No ${modeLabel} data`}</Badge>;
      }

      // Ensure date string is in proper format (YYYY-MM-DD)
      const dateString = lastDate.includes('T') ? lastDate.split('T')[0] : lastDate;

      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        console.warn(`Invalid date format for ${modeLabel}:`, lastDate);
        return <Badge variant="outline" className="text-xs text-slate-500">{`Invalid ${modeLabel} date`}</Badge>;
      }

      const lastFlightDate = parseISO(dateString + 'T12:00:00'); // Add time component for consistent parsing

      if (isNaN(lastFlightDate.getTime())) {
        console.warn(`Failed to parse date for ${modeLabel}:`, lastDate);
        return <Badge variant="outline" className="text-xs text-slate-500">{`Invalid ${modeLabel} date`}</Badge>;
      }

      const expirationDate = endOfDay(addDays(lastFlightDate, periodDays));
      const today = endOfDay(new Date());
      const daysLeft = differenceInCalendarDays(expirationDate, today);

      const dateText = `${format(lastFlightDate, 'MMM d, yyyy')}`;
      let statusText = "";
      let className = "bg-green-100 text-green-800"; // Default to current

      if (daysLeft < 0) {
        statusText = "Expired";
        className = "bg-red-100 text-red-800";
      } else if (daysLeft === 0) {
        statusText = "Expires today";
        className = "bg-red-100 text-red-800";
      } else if (daysLeft <= 15) {
        statusText = `${daysLeft}d left`;
        className = "bg-red-100 text-red-800";
      } else if (daysLeft <= periodDays * 0.5) {// Within 50% of the period, show yellow
        statusText = `${daysLeft}d left`;
        className = "bg-yellow-100 text-yellow-800";
      }

      return (
        <Badge className={`${className} text-xs`}>
          {modeLabel}: {dateText}{statusText && ` (${statusText})`}
        </Badge>);

    } catch (error) {
      console.error("Error parsing date for status badge:", error);
      return <Badge variant="outline" className="text-xs text-slate-500">{`Invalid ${modeLabel} date`}</Badge>;
    }
  };

  const renderSemiannualProgress = (memberEmail) => {
    const memberInfo = memberFlightInfo[memberEmail];
    if (!memberInfo || !memberInfo.semiannual_required_hours) return null;

    const aircraftProgress = memberInfo.semiannual_required_hours > 0 ?
    Math.min((memberInfo.semiannual_aircraft_hours || 0) / memberInfo.semiannual_required_hours * 100, 100) :
    0;

    const simulatorProgress = memberInfo.semiannual_simulator_required_hours > 0 ?
    Math.min((memberInfo.semiannual_simulator_hours || 0) / memberInfo.semiannual_simulator_required_hours * 100, 100) :
    0;

    return (
      <div className="flex flex-col gap-2 w-full">
        {/* Aircraft Progress */}
        <div className="flex flex-col items-start w-full">
          <div className="text-xs text-slate-600 mb-1">
            Aircraft: {(memberInfo.semiannual_aircraft_hours || 0).toFixed(1)}h/{memberInfo.semiannual_required_hours}h
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
              aircraftProgress >= 100 ? 'bg-green-600' :
              aircraftProgress > 50 ? 'bg-yellow-500' : 'bg-red-600'}`
              }
              style={{ width: `${Math.min(aircraftProgress, 100)}%` }} />

          </div>
        </div>

        {/* Simulator Progress (if required) */}
        {memberInfo.semiannual_simulator_required_hours > 0 &&
        <div className="flex flex-col items-start w-full">
              <div className="text-xs text-slate-600 mb-1">
                Sim: {(memberInfo.semiannual_simulator_hours || 0).toFixed(1)}h/{memberInfo.semiannual_simulator_required_hours}h
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
              className={`h-full rounded-full transition-all duration-300 ${
              simulatorProgress >= 100 ? 'bg-green-600' :
              simulatorProgress > 50 ? 'bg-yellow-500' : 'bg-red-600'}`
              }
              style={{ width: `${Math.min(simulatorProgress, 100)}%` }} />

              </div>
            </div>
        }
      </div>);

  };

  useEffect(() => {
    const fetchLeaderboard = async () => {
        if (!expandedGroupId) {
            setLeaderboardData([]);
            return;
        }

        const group = groups.find(g => g.id === expandedGroupId);
        if (!group || !group.settings?.leaderboard_enabled) {
            setLeaderboardData([]);
            return;
        }

        // Check membership before calling the backend (prevents 403 errors)
        const normalizedMembers = (group.members || []).map((m) =>
          typeof m === "string" ? { email: m, full_name: m } : m
        );
        const userIsMember = !!user && normalizedMembers.some((m) => m.email === user.email);

        if (!userIsMember) {
            setLeaderboardData([]); // Clear data for non-members
            return; // Skip calling the function to avoid 403
        }

        setLeaderboardLoading(true);
        try {
            const { data: leaderboard } = await getGroupLeaderboard({
                groupId: group.id,
                period: group.settings.leaderboard_period || "30",
            });
            setLeaderboardData(leaderboard);
        } catch (error) {
            console.error("Failed to load leaderboard:", error);
            setLeaderboardData([]); // Clear on error
        } finally {
            setLeaderboardLoading(false);
        }
    };

    fetchLeaderboard();
  }, [expandedGroupId, groups, user]); // Added `user` dependency

  const sortedLeaderboardData = useMemo(() => {
    const data = [...leaderboardData]; // Create a mutable copy
    const { key, order } = leaderboardSort;

    if (key === 'name') {
        data.sort((a, b) => {
            const nameA = a.full_name?.toLowerCase() || '';
            const nameB = b.full_name?.toLowerCase() || '';
            if (nameA < nameB) return order === 'asc' ? -1 : 1;
            if (nameA > nameB) return order === 'asc' ? 1 : -1;
            return 0;
        });
    } else { // 'aircraft_hours', 'simulator_hours', or 'total'
        data.sort((a, b) => {
            let valA, valB;
            if (key === 'total') {
                valA = (a.aircraft_hours || 0) + (a.simulator_hours || 0);
                valB = (b.aircraft_hours || 0) + (b.simulator_hours || 0);
            } else {
                valA = a[key] || 0;
                valB = b[key] || 0;
            }
            
            if (order === 'asc') {
                return valA - valB;
            } else {
                return valB - valA;
            }
        });
    }
    return data;
  }, [leaderboardData, leaderboardSort]);

  const handleSettingsUpdate = async (groupId, newSettings) => {
    try {
        const group = groups.find(g => g.id === groupId);
        if (!group) return;

        await FlightGroup.update(groupId, { settings: { ...group.settings, ...newSettings } });
        await loadData();
    } catch (error) {
        console.error("Failed to update group settings:", error);
        alert("Could not update settings. Please try again.");
    }
  };

  const myGroups = user ? groups.filter((group) =>
  group.created_by === user.email ||
  (group.members || []).some((m) => (typeof m === 'string' ? m : m.email) === user.email) ||
  (group.pending_members || []).some((m) => (typeof m === 'string' ? m : m.email) === user.email)
  ) : [];

  const searchResults = searchTerm ? groups.filter((group) =>
  group.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  group.id_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  group.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  group.created_by_name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const filteredGroups = searchTerm ? searchResults : myGroups;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Verifying authentication...</p>
        </div>
      </div>);

  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center p-6 bg-white rounded-lg shadow-md max-w-md mx-auto">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Unable to Load Flight Groups</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={loadData} className="bg-blue-600 hover:bg-blue-700">
              Try Again
            </Button>
            <Button variant="outline" onClick={() => window.location.href = window.location.origin + createPageUrl("Dashboard")}>
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>);

  }

  return (
    <TooltipProvider>
      <Dialog open={!!joinSuccessInfo} onOpenChange={() => setJoinSuccessInfo(null)}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-xl">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                    Successfully Joined Group!
                </DialogTitle>
                <DialogDescription className="pt-4 text-base text-slate-700">
                    You have joined the flight group: <strong className="text-slate-900">{joinSuccessInfo}</strong>.
                    <br /><br />
                    The group's details and member status are now visible on this page.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
                <Button onClick={() => setJoinSuccessInfo(null)} className="w-full bg-blue-600 hover:bg-blue-700">
                    OK
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="min-h-screen bg-slate-50 p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                {searchTerm ? 'Search Results' : 'My Flight Groups'}
              </h1>
              <p className="text-slate-600 mt-1">
                {searchTerm ? `Showing all groups matching "${searchTerm}"` : 'Groups you have created or joined.'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleRefresh}
                variant="outline"
                disabled={refreshing}>

                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
              <Button
                onClick={() => {setShowForm(true);setEditingGroup(null);}}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg">

                <Plus className="w-4 h-4 mr-2" />
                Create Group
              </Button>
            </div>
          </div>

          <Card className="bg-blue-50 border-blue-200 shadow-sm mb-8 hidden md:block">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-900">Better Coordination with Flight Groups</h3>
                  <p className="text-blue-800 mt-1">Flight Group helps with team coordination and ensures everyone is aware of their flight readiness at a glance.  Use it a compettion toll to track the top fliers. When you join a flight group, you and other members can view each other's recent flight information, including NVG currency. 

                  </p>
                </div>
              </div> 
            </CardContent>
          </Card>

          <AnimatePresence>
            {showRefreshReminder && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-6"
              >
                <Card className="bg-yellow-50 border-yellow-200 shadow-sm">
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-yellow-900">Data may be outdated</h4>
                        <p className="text-sm text-yellow-800">
                          For the latest flight data from all group members, click refresh.
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleRefresh} className="bg-white hover:bg-slate-50 flex-shrink-0">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh Now
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showForm &&
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8">

                <Card className="bg-white shadow-lg border-0">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      {editingGroup ? "Edit Flight Group" : "Create New Flight Group"}
                    </CardTitle>
                    <Button variant="ghost" size="icon" onClick={handleCancel}>
                      <X className="w-4 h-4" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="name">Group Name</Label>
                          <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter group name"
                          required />

                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="id_code">ID Code</Label>
                          <Input
                          id="id_code"
                          value={formData.id_code}
                          onChange={(e) => setFormData((prev) => ({ ...prev, id_code: e.target.value.toUpperCase() }))}
                          placeholder="Enter unique ID code"
                          required />

                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe the group's purpose, activities, or requirements..."
                        className="min-h-24" />

                      </div>
                      <div className="flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={handleCancel}>
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={formSaving || formSaveSuccess}
                          className={`transition-colors duration-300 w-40 ${
                            formSaveSuccess
                              ? 'bg-green-600 hover:bg-green-700'
                              : 'bg-blue-600 hover:bg-blue-700'
                          }`}
                        >
                          {formSaveSuccess ? (
                            <><Check className="w-4 h-4 mr-2" /> Saved!</>
                          ) : formSaving ? (
                            <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                          ) : (
                            <><Save className="w-4 h-4 mr-2" /> {editingGroup ? "Update Group" : "Create Group"}</>
                          )}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            }
          </AnimatePresence>

          <Card className="bg-white shadow-lg border-0 mb-6">
            <CardHeader>
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Search all groups by name, ID code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10" />

                </div>
                <div className="text-sm text-slate-600">
                  {searchTerm ? `${filteredGroups.length} found` : `${filteredGroups.length} of your groups`}
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="grid gap-4">
            {filteredGroups.length === 0 ?
            <Card className="bg-white shadow-lg border-0">
                <CardContent className="text-center py-12">
                  <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    {searchTerm ? 'No Groups Found' : 'No Flight Groups'}
                  </h3>
                  <p className="text-slate-600 mb-4">
                    {searchTerm ? "Try adjusting your search terms." : "You haven't created or joined any groups yet."}
                  </p>
                  {!searchTerm &&
                <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
                      Create Your First Group
                    </Button>
                }
                </CardContent>
              </Card> :

            filteredGroups.map((group) => {
              const isCreator = user && group.created_by === user.email;
              const isMember = user && (group.members || []).some((m) => (typeof m === 'string' ? m : m.email) === user.email);
              const isPending = user && (group.pending_members || []).some((m) => (typeof m === 'string' ? m : m.email) === user.email);
              const isExpanded = expandedGroupId === group.id;

              return (
                <Card key={group.id} className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow duration-300 flex flex-col">
                    <div className="cursor-pointer" onClick={() => handleToggleGroup(group.id)}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 rounded-lg">
                              <Users className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-slate-900">{group.name}</span>
                                <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1">
                                  <Code className="w-3 h-3" />
                                  {group.id_code}
                                </Badge>
                                {isCreator && <Badge variant="secondary" className="bg-purple-100 text-purple-800">Creator</Badge>}
                                {isMember && !isCreator && <Badge variant="secondary" className="bg-green-100 text-green-800">Member</Badge>}
                                {isPending && !isCreator && !isMember && <Badge variant="secondary" className="bg-orange-100 text-orange-800">Pending</Badge>}
                              </div>
                              <p className="text-sm text-slate-600 mt-1">
                                Created by {group.created_by_name
                                  ? getInitials(group.created_by_name, group.created_by)
                                  : 'Unknown User'}
                              </p>
                            </div>
                          </div>
                          <ChevronDown className={`w-5 h-5 text-slate-500 transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                      </CardHeader>
                    </div>

                    <AnimatePresence>
                      {isExpanded &&
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden">

                          <CardContent className="flex-grow flex flex-col justify-between space-y-4 pt-0">
                            {group.description && <p className="text-slate-700 pt-3 border-t">{group.description}</p>}
                            
                            {isCreator && (group.pending_members || []).length > 0 &&
                        <div className="border-t pt-4 mt-4">
                                <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                                  <BellRing className="w-4 h-4 text-purple-600" />
                                  Pending Join Requests
                                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">{group.pending_members.length}</Badge>
                                </h4>
                                <div className="space-y-2">
                                  {group.pending_members.map((pendingMember) =>
                            <div key={pendingMember.email} className="p-2 bg-purple-50 rounded-lg flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <Avatar className="w-6 h-6">
                                          <AvatarFallback className="text-xs bg-purple-200 text-purple-800">
                                            {getInitials(pendingMember.full_name, pendingMember.email)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm font-medium text-slate-900">
                                          {getInitials(pendingMember.full_name, pendingMember.email)}
                                        </span>
                                      </div>
                                      <div className="flex gap-2">
                                          <Button size="sm" variant="outline" className="bg-white" onClick={(e) => {e.stopPropagation();handleApproveRequest(group, pendingMember);}}>Approve</Button>
                                          <Button size="sm" variant="destructive" onClick={(e) => {e.stopPropagation();handleDenyRequest(group, pendingMember);}}>Deny</Button>
                                      </div>
                                    </div>
                            )}
                                </div>
                              </div>
                        }

                            <Tabs defaultValue="status" className="w-full pt-4">
                                <TabsList className={`grid w-full ${group.settings?.leaderboard_enabled && isMember ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                    <TabsTrigger value="status">Member Status</TabsTrigger>
                                    {group.settings?.leaderboard_enabled && isMember && <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>}
                                </TabsList>
                                <TabsContent value="status">
                                    {/* Member NVG Status and Semi-annual Progress Section */}
                                    {(group.members || []).length > 0 ? (
                                    <div className="border-x border-b rounded-b-md p-4">
                                        <div className="space-y-3">
                                        {(group.members || []).map((member) => {
                                      // Normalize member to ensure it's an object { email, full_name }
                                      const normalizedMember = typeof member === 'string' ? { email: member, full_name: member } : member;
                                      const nvgInfo = getLastNVGInfo(normalizedMember.email);
                                      // Use user's currency_period_days, default to 60 if not set
                                      const currencyPeriodDays = user?.currency_settings?.currency_period_days || 60;
                                      const memberInfo = memberFlightInfo[normalizedMember.email];

                                      return (
                                        <div key={normalizedMember.email} className="p-3 bg-slate-50 rounded-lg">
                                                <div className="grid grid-cols-1 md:grid-cols-5 items-center gap-4">
                                                    {/* Col 1: Username */}
                                                    <div className="md:col-span-1 flex items-center gap-3">
                                                      <Avatar className="w-8 h-8">
                                                        <AvatarFallback className="text-sm">
                                                          {getInitials(normalizedMember.full_name, normalizedMember.email)}
                                                        </AvatarFallback>
                                                      </Avatar>
                                                      <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-slate-900">
                                                            {getInitials(normalizedMember.full_name, normalizedMember.email)}
                                                            {normalizedMember.email === user?.email && <span className="text-slate-500 ml-1 text-xs">(You)</span>}
                                                        </span>
                                                      </div>
                                                    </div>

                                                    {/* Col 2: Semi-annual Period */}
                                                    <div className="md:col-span-1 flex flex-col items-start">
                                                      {memberInfo?.current_period_start ?
                                                      (<>
                                                          <div className="text-xs font-medium text-slate-900">
                                                            {memberInfo.current_period_name}
                                                          </div>
                                                          <div className="text-xs text-slate-500">
                                                            {format(parseISO(memberInfo.current_period_start), 'MMM d')} - {format(parseISO(memberInfo.current_period_end), 'MMM d, yyyy')}
                                                          </div>
                                                        </>) :
                                                          (normalizedMember.email === user?.email ? 
                                                            (<Link to={createPageUrl("Requirements")} className="text-xs text-blue-600 hover:underline">
                                                              Set your semi-annual period
                                                            </Link>) :
                                                            (<span className="text-xs text-slate-500">No period set</span>)
                                                          )
                                                      }
                                                    </div>
                                                    
                                                    {/* Col 3: NG Status */}
                                                    <div className="md:col-span-1 flex justify-start">
                                                        {getCurrencyStatusBadge(nvgInfo?.lastNG, currencyPeriodDays, "NG")}
                                                    </div>
                                                    
                                                    {/* Col 4: NS Status */}
                                                    <div className="md:col-span-1 flex justify-start">
                                                        {getCurrencyStatusBadge(nvgInfo?.lastNS, currencyPeriodDays, "NS")}
                                                    </div>

                                                    {/* Col 5: Semi-annual progress */}
                                                    <div className="md:col-span-1 flex flex-col items-start gap-2">
                                                        {renderSemiannualProgress(normalizedMember.email)}
                                                    </div>
                                                </div>
                                              </div>);

                                    })}
                                        </div>
                                      </div>
                                    ) : (
                                       <div className="border-x border-b rounded-b-md p-4 text-center text-slate-500 text-sm">No members in this group yet.</div>
                                    )}
                                </TabsContent>
                                {group.settings?.leaderboard_enabled && isMember &&
                                <TabsContent value="leaderboard">
                                    <div className="border-x border-b rounded-b-md p-4">
                                        <div 
                                          className="font-medium text-slate-900 mb-3 flex items-center gap-2 cursor-pointer"
                                          onClick={() => handleLeaderboardSort('total')}
                                        >
                                          <Trophy className="w-4 h-4 text-amber-500" />
                                          Leaderboard (Last {group.settings.leaderboard_period} Days)
                                          {leaderboardSort.key === 'total' && (
                                            leaderboardSort.order === 'asc' ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>
                                          )}
                                        </div>

                                        {leaderboardLoading && expandedGroupId === group.id ? (
                                          <div className="flex justify-center items-center p-4">
                                            <RefreshCw className="w-5 h-5 animate-spin text-slate-500" />
                                          </div>
                                        ) : sortedLeaderboardData.length > 0 ? (
                                          <div className="space-y-1">
                                            {/* Leaderboard Header */}
                                            <div className="p-2 flex items-center justify-between text-xs font-bold text-slate-500 border-b">
                                                <div 
                                                    className="flex items-center gap-2 cursor-pointer hover:text-slate-800 transition-colors"
                                                    onClick={(e) => { e.stopPropagation(); handleLeaderboardSort('name'); }}
                                                >
                                                    <span className="w-6 text-left">#</span>
                                                    <span className="ml-10">Member</span>
                                                    {leaderboardSort.key === 'name' && (
                                                        leaderboardSort.order === 'asc' ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 tabular-nums">
                                                    <div 
                                                        className="w-20 text-right cursor-pointer hover:text-slate-800 transition-colors flex items-center justify-end gap-1"
                                                        onClick={(e) => { e.stopPropagation(); handleLeaderboardSort('aircraft_hours'); }}
                                                    >
                                                        <span>A Hours</span>
                                                        {leaderboardSort.key === 'aircraft_hours' && (
                                                            leaderboardSort.order === 'asc' ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>
                                                        )}
                                                    </div>
                                                    <span className="text-slate-300">|</span>
                                                    <div 
                                                        className="w-20 text-right cursor-pointer hover:text-slate-800 transition-colors flex items-center justify-end gap-1"
                                                        onClick={(e) => { e.stopPropagation(); handleLeaderboardSort('simulator_hours'); }}
                                                    >
                                                        <span>S Hours</span>
                                                        {leaderboardSort.key === 'simulator_hours' && (
                                                            leaderboardSort.order === 'asc' ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Legend for column abbreviations */}
                                            <div className="px-2 py-1 text-[11px] text-slate-500">
                                              Legend: <span className="font-medium text-slate-600">A Hours</span> = Aircraft Hours • <span className="font-medium text-slate-600">S Hours</span> = Sim Hours
                                            </div>

                                            {/* Leaderboard Rows */}
                                            {sortedLeaderboardData.map((entry, index) => (
                                              <div key={entry.email} className="p-2 bg-slate-50 rounded-lg flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                  <span className={`font-bold w-6 text-center ${index < 3 ? 'text-amber-600' : 'text-slate-500'}`}>{index + 1}</span>
                                                  <Avatar className="w-8 h-8">
                                                    <AvatarFallback className="text-sm">{getInitials(entry.full_name, entry.email)}</AvatarFallback>
                                                  </Avatar>
                                                  <span className="text-sm font-medium text-slate-900">{getInitials(entry.full_name, entry.email)}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm font-semibold tabular-nums">
                                                    <span className="w-20 text-right text-slate-800">{entry.aircraft_hours.toFixed(1)}h</span>
                                                    <span className="text-slate-300">|</span>
                                                    <span className="w-20 text-right text-slate-800">{entry.simulator_hours.toFixed(1)}h</span>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <p className="text-sm text-slate-500 text-center p-4">No flight data for this period.</p>
                                        )}
                                    </div>
                                </TabsContent>
                                }
                            </Tabs>

                            <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                                <div className="flex items-center -space-x-2">
                                    {(group.members || []).slice(0, 5).map((member) => {
                              const normalizedMember = typeof member === 'string' ? { email: member, full_name: member } : member;
                              return (
                                <Tooltip key={normalizedMember.email}>
                                                <TooltipTrigger asChild>
                                                    <Avatar className="w-8 h-8 border-2 border-white">
                                                        <AvatarFallback>{getInitials(normalizedMember.full_name, normalizedMember.email)}</AvatarFallback>
                                                    </Avatar>
                                                </TooltipTrigger>
                                                <TooltipContent>{getInitials(normalizedMember.full_name, normalizedMember.email)}</TooltipContent>
                                            </Tooltip>);

                            })}
                                    {(group.members?.length || 0) > 5 &&
                            <Avatar className="w-8 h-8 border-2 border-white">
                                        <AvatarFallback>+{(group.members.length || 0) - 5}</AvatarFallback>
                                    </Avatar>
                            }
                                </div>

                                <div className="flex items-center gap-2">
                                    {isMember &&
                            <Button variant="outline" size="sm" onClick={(e) => {e.stopPropagation();handleLeaveGroup(group);}}><LogOutIcon className="w-4 h-4 mr-1" /> Leave</Button>
                            }
                                    {(isCreator || user?.email === group.admin_email) &&
                            <>
                                        <GroupSettingsModal group={group} onUpdate={handleSettingsUpdate}>
                                          <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}><Settings className="w-4 h-4 mr-1" /> Settings</Button>
                                        </GroupSettingsModal>
                                        <Button variant="outline" size="sm" onClick={(e) => {e.stopPropagation();handleEdit(group);}}><Edit className="w-4 h-4 mr-1" /> Edit</Button>
                                        <Button variant="destructive" size="sm" onClick={(e) => {e.stopPropagation();handleDelete(group.id);}}><Trash2 className="w-4 h-4 mr-1" /> Delete</Button>
                                    </>
                            }
                                    {!isMember && !isCreator &&
                            <Button size="sm" onClick={(e) => {e.stopPropagation();handleJoinGroup(group);}} className="bg-blue-600 hover:bg-blue-700"><UserPlus className="w-4 h-4 mr-1" /> Join Group</Button>
                            }
                                </div>
                            </div>
                          </CardContent>
                        </motion.div>
                    }
                    </AnimatePresence>
                  </Card>);

            })
            }
          </div>
        </div>
      </div>
    </TooltipProvider>);

}

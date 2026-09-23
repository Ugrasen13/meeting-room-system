"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Clock,
  Calendar as CalendarIcon,
  Users,
  Tv,
  ArrowLeft,
  Sparkles,
  MapPin,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Radio,
  Filter,
  X,
  ArrowRight,
  Layers,
  Plus,
  AlertCircle,
} from "lucide-react";
import { TimeSimulator } from "@/components/ui/TimeSimulator";
import {
  formatTime12Hour,
  formatDateDisplay,
  formatDateFull,
  formatDateWithWeekday,
  getTodayString,
  getTodayFormattedWithWeekday,
} from "@/lib/meetingStatus";
import { MeetingData } from "@/types";

interface RoomDisplayItem {
  room: {
    id: string;
    roomName: string;
    roomNumber: string;
    location: string;
    capacity: number;
    status: string;
  };
  status: "ONGOING" | "UPCOMING" | "COMPLETED" | "AVAILABLE";
  currentMeeting: any;
  nextMeeting: any;
  displayMeeting: any;
  todayMeetings: any[];
}

export default function AllRoomsLiveDisplay() {
  const [rooms, setRooms] = useState<RoomDisplayItem[]>([]);
  const [allMeetings, setAllMeetings] = useState<MeetingData[]>([]);

  // Initialize to today's date
  const [startDate, setStartDate] = useState("2026-08-27");
  const [endDate, setEndDate] = useState("2026-08-27");

  // Temporary picker state
  const [tempStartDate, setTempStartDate] = useState("2026-08-27");
  const [tempEndDate, setTempEndDate] = useState("2026-08-27");
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Maximum 6 items initial display state
  const [showAll, setShowAll] = useState(false);

  const [currentTimeFormatted, setCurrentTimeFormatted] = useState("");
  const [currentLiveDateFormatted, setCurrentLiveDateFormatted] = useState("");
  const [simulatedTime, setSimulatedTime] = useState("");
  const [simulatedDate, setSimulatedDate] = useState("");
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const today = getTodayString();
    setStartDate(today);
    setEndDate(today);
    setTempStartDate(today);
    setTempEndDate(today);
    setCurrentLiveDateFormatted(getTodayFormattedWithWeekday());
  }, []);

  // Live ticking clock & live date
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      if (isLiveMode) {
        let hours = now.getHours();
        const minutes = String(now.getMinutes()).padStart(2, "0");
        const seconds = String(now.getSeconds()).padStart(2, "0");
        const period = hours >= 12 ? "PM" : "AM";
        hours = hours % 12 || 12;
        setCurrentTimeFormatted(
          `${String(hours).padStart(2, "0")}:${minutes}:${seconds} ${period}`
        );
      }
      setCurrentLiveDateFormatted(
        now.toLocaleDateString("en-US", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      );
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [isLiveMode]);

  // Fetch display data for date or date range
  const fetchDisplay = async (
    sDate = startDate,
    eDate = endDate,
    time = simulatedTime
  ) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("startDate", sDate);
      params.set("endDate", eDate);
      if (time) params.set("time", time);
      const q = params.toString() ? `?${params.toString()}` : "";

      const res = await fetch(`/api/display${q}`);
      if (res.ok) {
        const data = await res.json();
        setRooms(data.rooms || []);
        setAllMeetings(data.meetings || []);
        setLastRefreshed(new Date());
        if (!isLiveMode && time) {
          setCurrentTimeFormatted(formatTime12Hour(time));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mounted) {
      fetchDisplay(startDate, endDate, simulatedTime);
    }
  }, [startDate, endDate, simulatedTime, mounted]);

  // Auto-refresh polling every 15 seconds
  useEffect(() => {
    if (!isLiveMode) return;
    const pollInterval = setInterval(() => {
      fetchDisplay(startDate, endDate);
    }, 15000);
    return () => clearInterval(pollInterval);
  }, [isLiveMode, startDate, endDate]);

  const handleApplyDateRange = () => {
    if (tempEndDate < tempStartDate) {
      setEndDate(tempStartDate);
      setStartDate(tempEndDate);
    } else {
      setStartDate(tempStartDate);
      setEndDate(tempEndDate);
    }
    setShowAll(false); // Reset to max 6 on new date filter
    setDatePickerOpen(false);
  };

  const handleResetToLiveToday = () => {
    const today = getTodayString();
    setStartDate(today);
    setEndDate(today);
    setTempStartDate(today);
    setTempEndDate(today);
    setIsLiveMode(true);
    setSimulatedTime("");
    setSimulatedDate("");
    setDatePickerOpen(false);
    fetchDisplay(today, today, "");
  };

  // Quick Create Meeting Modal Popup State
  const [selectedRoomForBooking, setSelectedRoomForBooking] = useState<RoomDisplayItem | null>(null);
  const [bookTitle, setBookTitle] = useState("");
  const [bookOrganizer, setBookOrganizer] = useState("CABS DRDO Admin");
  const [bookDate, setBookDate] = useState(startDate);
  const [bookStartTime, setBookStartTime] = useState("14:00");
  const [bookEndTime, setBookEndTime] = useState("15:00");
  const [bookDescription, setBookDescription] = useState("");
  const [bookError, setBookError] = useState("");
  const [bookSuccess, setBookSuccess] = useState(false);
  const [bookSubmitting, setBookSubmitting] = useState(false);

  const handleOpenBookingModal = (item: RoomDisplayItem) => {
    setSelectedRoomForBooking(item);
    setBookTitle("");
    setBookOrganizer("CABS DRDO Admin");
    setBookDate(startDate || getTodayString());
    const now = new Date();
    const currentH = now.getHours();
    const startH = String((currentH + 1) % 24).padStart(2, "0");
    const endH = String((currentH + 2) % 24).padStart(2, "0");
    setBookStartTime(`${startH}:00`);
    setBookEndTime(`${endH}:00`);
    setBookDescription("");
    setBookError("");
    setBookSuccess(false);
  };

  const handleCreateMeetingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomForBooking) return;
    if (!bookTitle.trim()) {
      setBookError("Meeting title is required.");
      return;
    }
    if (bookEndTime <= bookStartTime) {
      setBookError("End time must be after start time.");
      return;
    }

    try {
      setBookSubmitting(true);
      setBookError("");
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: bookTitle.trim(),
          organizer: bookOrganizer.trim() || "CABS DRDO Admin",
          description: bookDescription.trim(),
          roomId: selectedRoomForBooking.room.id,
          meetingDate: bookDate,
          startTime: bookStartTime,
          endTime: bookEndTime,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setBookError(data.error || "Failed to create meeting.");
      } else {
        setBookSuccess(true);
        // Refresh display data
        fetchDisplay(startDate, endDate, simulatedTime);
        setTimeout(() => {
          setSelectedRoomForBooking(null);
          setBookSuccess(false);
        }, 1500);
      }
    } catch (err: any) {
      setBookError("Network error. Could not create meeting.");
    } finally {
      setBookSubmitting(false);
    }
  };

  const handleTimeChange = (time: string, date: string, live: boolean) => {
    setIsLiveMode(live);
    if (live) {
      setSimulatedTime("");
      fetchDisplay(startDate, endDate);
    } else {
      setSimulatedTime(time);
      if (date) {
        setStartDate(date);
        setEndDate(date);
        setTempStartDate(date);
        setTempEndDate(date);
      }
      fetchDisplay(date || startDate, date || endDate, time);
    }
  };

  // Color palettes for room cards
  const roomPalettes = [
    {
      border: "border-emerald-500/80 hover:border-emerald-400",
      glow: "shadow-[0_0_35px_rgba(16,185,129,0.3)]",
      gradient: "from-emerald-950/60 via-slate-900/90 to-slate-950/95",
      iconBg: "bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/40",
    },
    {
      border: "border-amber-500/80 hover:border-amber-400",
      glow: "shadow-[0_0_35px_rgba(245,158,11,0.3)]",
      gradient: "from-amber-950/60 via-slate-900/90 to-slate-950/95",
      iconBg: "bg-gradient-to-tr from-amber-600 to-orange-500 text-white shadow-lg shadow-amber-500/40",
    },
    {
      border: "border-cyan-500/80 hover:border-cyan-400",
      glow: "shadow-[0_0_35px_rgba(6,182,212,0.3)]",
      gradient: "from-cyan-950/60 via-slate-900/90 to-slate-950/95",
      iconBg: "bg-gradient-to-tr from-cyan-600 to-blue-500 text-white shadow-lg shadow-cyan-500/40",
    },
    {
      border: "border-purple-500/80 hover:border-purple-400",
      glow: "shadow-[0_0_35px_rgba(168,85,247,0.3)]",
      gradient: "from-purple-950/60 via-slate-900/90 to-slate-950/95",
      iconBg: "bg-gradient-to-tr from-purple-600 to-indigo-500 text-white shadow-lg shadow-purple-500/40",
    },
    {
      border: "border-rose-500/80 hover:border-rose-400",
      glow: "shadow-[0_0_35px_rgba(244,63,94,0.3)]",
      gradient: "from-rose-950/60 via-slate-900/90 to-slate-950/95",
      iconBg: "bg-gradient-to-tr from-rose-600 to-pink-500 text-white shadow-lg shadow-rose-500/40",
    },
    {
      border: "border-indigo-500/80 hover:border-indigo-400",
      glow: "shadow-[0_0_35px_rgba(99,102,241,0.3)]",
      gradient: "from-indigo-950/60 via-slate-900/90 to-slate-950/95",
      iconBg: "bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-lg shadow-indigo-500/40",
    },
  ];

  // View Mode: "slots" (Scheduled meeting slots only - DEFAULT) vs "rooms" (All rooms)
  const [viewMode, setViewMode] = useState<"slots" | "rooms">("slots");

  // History / Range mode checks
  const isDateRange = startDate !== endDate;
  const isHistoryMode =
    isDateRange || (mounted && startDate !== getTodayString());
  const showSlotsOnly = isDateRange || viewMode === "slots";
  const itemsToDisplay = showSlotsOnly ? allMeetings : rooms;
  const totalItemsCount = itemsToDisplay.length;

  // Maximum 6 shown initially, unless user clicked "See More"
  const visibleItems = showAll ? itemsToDisplay : itemsToDisplay.slice(0, 6);
  const hasMoreThanSix = totalItemsCount > 6;

  return (
    <div className="min-h-screen bg-[#040714] text-white flex flex-col justify-between p-4 sm:p-6 lg:p-8 select-none relative overflow-x-hidden font-sans">
      {/* Background Ambient Colored Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl"></div>
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 left-1/3 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Top Floating Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4 z-30 relative">
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700/80 shadow-lg backdrop-blur-md transition group"
          >
            <ArrowLeft className="w-4 h-4 text-indigo-400 group-hover:-translate-x-0.5 transition" />
            <span>Dashboard</span>
          </Link>

          {/* View Mode Toggle: Scheduled Slots Only vs All Rooms */}
          <div className="inline-flex p-0.5 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-md">
            <button
              type="button"
              onClick={() => setViewMode("slots")}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                showSlotsOnly
                  ? "bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>📅 Only Meetings ({allMeetings.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("rooms")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                !showSlotsOnly
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>🏢 All Rooms ({rooms.length})</span>
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/50 border border-emerald-800/60 text-emerald-400 text-xs font-semibold backdrop-blur-md">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Live Workspace Broadcast</span>
          </div>
        </div>

        {/* Embedded Time Simulator */}
        <div className="max-w-md w-full">
          <TimeSimulator
            currentSimulatedTime={simulatedTime || (currentTimeFormatted.slice(0, 5) || "Live")}
            currentSimulatedDate={simulatedDate || startDate}
            onTimeChange={handleTimeChange}
            isLiveMode={isLiveMode}
          />
        </div>
      </div>

      {/* Header: Left = Today's Live Date & Clock | Center = Title | Right = History Meetings Button */}
      <header className="flex flex-col lg:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-800/80 z-20 relative">
        {/* Left: Today's Live Date & Real-Time Digital Clock */}
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 bg-gradient-to-r from-slate-900/95 via-slate-900/90 to-slate-950 border-2 border-cyan-500/50 px-4 sm:px-5 py-2.5 rounded-2xl shadow-[0_0_25px_rgba(6,182,212,0.25)] backdrop-blur-md w-full sm:w-auto justify-center sm:justify-start">
          {/* Live Clock */}
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Clock className="w-5 sm:w-6 h-5 sm:h-6 text-cyan-400 animate-pulse" />
              <span className="w-2 h-2 rounded-full bg-emerald-400 absolute -top-0.5 -right-0.5 animate-ping"></span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 leading-none flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                LIVE TIME
              </span>
              <span
                className="font-mono text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-200 to-white tracking-widest mt-0.5"
                suppressHydrationWarning
              >
                {mounted ? currentTimeFormatted || "02:35 PM" : "02:35 PM"}
              </span>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-700/80 hidden sm:block"></div>

          {/* Today's Live Date */}
          <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800 w-full sm:w-auto justify-center sm:justify-start">
            <CalendarIcon className="w-4 sm:w-5 h-4 sm:h-5 text-teal-400 shrink-0" />
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-400/90 leading-none">
                TODAY'S LIVE DATE
              </span>
              <span
                className="text-xs sm:text-sm font-black text-white tracking-wide mt-0.5 whitespace-nowrap"
                suppressHydrationWarning
              >
                {mounted ? currentLiveDateFormatted : "Today"}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Title */}
        <div className="text-center">
          <h1 className="text-2xl sm:text-4xl font-black tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 drop-shadow-[0_0_25px_rgba(52,211,153,0.3)]">
            MEETING ROOM STATUS
          </h1>
          <p className="text-xs sm:text-sm text-cyan-300/80 font-bold tracking-widest uppercase mt-1 flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            Real-Time Office Workspace Monitor
          </p>
        </div>

        {/* Right: Dedicated "History Meetings" & Date Range Button */}
        <div className="relative">
          <button
            onClick={() => setDatePickerOpen(!datePickerOpen)}
            className={`flex items-center gap-3 px-4 sm:px-5 py-2.5 rounded-2xl backdrop-blur-md transition cursor-pointer group ${
              isHistoryMode
                ? "bg-gradient-to-r from-purple-950/90 via-indigo-900/90 to-slate-900 border-2 border-indigo-400 shadow-[0_0_30px_rgba(129,140,248,0.4)] ring-2 ring-indigo-500/40"
                : "bg-gradient-to-r from-slate-900/95 to-slate-900/80 hover:from-slate-850 hover:to-slate-800 border-2 border-indigo-500/70 hover:border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.25)]"
            }`}
            title="Click to view meeting history or select custom date range"
          >
            <div className="p-1.5 rounded-xl bg-indigo-500/20 text-indigo-300 group-hover:bg-indigo-500/30 group-hover:scale-105 transition">
              <CalendarIcon className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-300">
                  History Meetings
                </span>
                {isHistoryMode ? (
                  <span className="px-1.5 py-0.2 rounded-md bg-indigo-500 text-slate-950 text-[10px] font-black uppercase animate-pulse">
                    Active
                  </span>
                ) : (
                  <span className="px-1.5 py-0.2 rounded-md bg-slate-800 text-slate-400 text-[10px] font-bold">
                    Archive
                  </span>
                )}
              </div>
              <span className="text-xs sm:text-sm font-bold text-white mt-0.5 line-clamp-1">
                {isHistoryMode
                  ? startDate === endDate
                    ? formatDateDisplay(startDate)
                    : `${formatDateDisplay(startDate)} → ${formatDateDisplay(endDate)}`
                  : "Date Range & Past"}
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-indigo-400 ml-1 transition-transform duration-200 ${
                datePickerOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Meeting History / Date Range Modal Dropdown */}
          {datePickerOpen && (
            <div className="absolute right-0 mt-3 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-slate-900/98 border-2 border-indigo-500/80 rounded-3xl p-4 sm:p-5 shadow-2xl backdrop-blur-2xl z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Filter className="w-4 h-4 text-indigo-400" />
                  <span>Meeting History & Date Filter</span>
                </div>
                <button
                  onClick={() => setDatePickerOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-[11px] text-slate-400 mt-2 mb-3">
                Select a past date or date range to inspect previous and upcoming meetings:
              </p>

              {/* Quick Preset Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-3">
                <button
                  type="button"
                  onClick={() => {
                    const todayStr = getTodayString();
                    setTempStartDate(todayStr);
                    setTempEndDate(todayStr);
                  }}
                  className="px-2 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/70 text-[11px] font-bold text-emerald-300 border border-emerald-700/60 text-center"
                >
                  ⚡ Today (Live)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const y = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
                    setTempStartDate(y);
                    setTempEndDate(y);
                  }}
                  className="px-2 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 border border-slate-700 text-center"
                >
                  📅 Yesterday
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTempStartDate("2026-08-27");
                    setTempEndDate("2026-08-27");
                  }}
                  className="px-2 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 border border-slate-700 text-center"
                >
                  27 Aug Demo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTempStartDate("2026-08-27");
                    setTempEndDate("2026-08-30");
                  }}
                  className="px-2 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-[11px] font-bold text-indigo-300 border border-indigo-500/40 text-center"
                >
                  27–30 Aug Range
                </button>
              </div>

              {/* Date Inputs */}
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                    From Date (Start):
                  </label>
                  <input
                    type="date"
                    value={tempStartDate}
                    onChange={(e) => setTempStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                    To Date (End):
                  </label>
                  <input
                    type="date"
                    value={tempEndDate}
                    onChange={(e) => setTempEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={handleResetToLiveToday}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition"
                  >
                    Reset to Today
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyDateRange}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center gap-1.5"
                  >
                    <span>Apply Filter</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* History Mode Active Notification Banner */}
      {isHistoryMode && (
        <div className="my-3 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-indigo-950/90 via-slate-900/95 to-purple-950/90 border-2 border-indigo-500/60 shadow-[0_0_30px_rgba(99,102,241,0.25)] flex flex-wrap items-center justify-between gap-3 z-20 relative animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300">
              <Filter className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-300">
                  Meeting History Filter Active
                </span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-bold border border-indigo-500/30">
                  {totalItemsCount} {isDateRange ? "meetings found" : "rooms shown"}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Viewing schedule for:{" "}
                <span className="font-bold text-white">
                  {startDate === endDate
                    ? formatDateWithWeekday(startDate)
                    : `${formatDateDisplay(startDate)} to ${formatDateDisplay(endDate)}`}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={handleResetToLiveToday}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-[0_0_20px_rgba(16,185,129,0.35)] transition flex items-center gap-2 cursor-pointer group"
          >
            <Radio className="w-3.5 h-3.5 text-emerald-200 animate-pulse" />
            <span>Return to Live Today</span>
          </button>
        </div>
      )}

      {/* Information Banner */}
      <div className="my-2 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 px-2 z-10">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-200">
            {isDateRange
              ? `Showing meetings from ${formatDateDisplay(startDate)} to ${formatDateDisplay(endDate)}`
              : `Workspace Status for ${formatDateFull(startDate)}`}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold text-[11px] border border-indigo-500/30">
            Total: {totalItemsCount} {isDateRange ? "meetings" : "rooms"}
          </span>
        </div>

        {hasMoreThanSix && (
          <div className="text-[11px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
            Displaying {showAll ? totalItemsCount : 6} of {totalItemsCount} items
          </div>
        )}
      </div>

      {/* Main Grid: Maximum 6 shown initially */}
      <main className="my-auto py-4 z-10 relative">
        {itemsToDisplay.length === 0 ? (
          <div className="py-20 text-center max-w-lg mx-auto p-8 rounded-3xl bg-slate-900/90 border-2 border-slate-800 backdrop-blur-xl shadow-2xl space-y-5 animate-in fade-in">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 flex items-center justify-center mx-auto">
              <CalendarIcon className="w-8 h-8 text-indigo-300" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white">No Scheduled Meetings</h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                There are no meetings booked on{" "}
                <span className="font-bold text-cyan-300">
                  {formatDateDisplay(startDate)}
                </span>
                .
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (rooms.length > 0) handleOpenBookingModal(rooms[0]);
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/30 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-slate-950" />
                <span>+ Schedule Meeting</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setStartDate("2026-08-27");
                  setEndDate("2026-08-27");
                  setTempStartDate("2026-08-27");
                  setTempEndDate("2026-08-27");
                  fetchDisplay("2026-08-27", "2026-08-27");
                }}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>📅 View 27 Aug (Demo)</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {/* If showSlotsOnly: render Meeting Cards */}
            {showSlotsOnly
              ? (visibleItems as MeetingData[]).map((meeting, idx) => {
                  const palette = roomPalettes[idx % roomPalettes.length];
                  const isOngoing = meeting.status === "ONGOING";
                  const isUpcoming = meeting.status === "UPCOMING";

                  let borderStyle = palette.border;
                  let glowStyle = palette.glow;
                  let cardBg = `bg-gradient-to-b ${palette.gradient}`;

                  if (isOngoing) {
                    borderStyle = "border-emerald-400";
                    glowStyle = "shadow-[0_0_45px_rgba(16,185,129,0.45)] ring-2 ring-emerald-500/50";
                    cardBg = "bg-gradient-to-b from-emerald-950/80 via-slate-900/95 to-slate-950";
                  } else if (isUpcoming) {
                    borderStyle = "border-amber-400";
                    glowStyle = "shadow-[0_0_40px_rgba(245,158,11,0.4)] ring-2 ring-amber-500/40";
                    cardBg = "bg-gradient-to-b from-amber-950/70 via-slate-900/95 to-slate-950";
                  }

                  return (
                    <Link
                      key={meeting.id}
                      href={`/display/${meeting.room?.roomNumber || meeting.roomId}`}
                      className={`relative rounded-3xl p-6 border-2 flex flex-col items-center justify-between text-center transition-all duration-300 transform hover:-translate-y-2 hover:scale-[1.02] cursor-pointer min-h-[380px] backdrop-blur-xl ${borderStyle} ${glowStyle} ${cardBg} group`}
                    >
                      {/* Top Info Bar */}
                      <div className="w-full pb-3 border-b border-white/10 flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/10 text-slate-200 border border-white/10">
                          📅 {formatDateDisplay(meeting.meetingDate)}
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/5">
                          {meeting.room?.roomNumber || "Room"}
                        </span>
                      </div>

                      {/* Room & Title */}
                      <div className="mt-3">
                        <span className="text-xs font-bold text-cyan-300 block">
                          {meeting.room?.roomName} ({meeting.room?.location})
                        </span>
                        <h2 className="text-xl sm:text-2xl font-black text-white mt-1 line-clamp-2 px-1 group-hover:text-cyan-200 transition">
                          {meeting.title}
                        </h2>
                      </div>

                      {/* Icon */}
                      <div
                        className={`w-16 h-16 rounded-2xl flex items-center justify-center my-3 transition-transform duration-300 group-hover:scale-110 ${palette.iconBg}`}
                      >
                        <Users className="w-8 h-8" />
                      </div>

                      {/* Time & Host */}
                      <div className="space-y-1.5 w-full my-1">
                        <div className="inline-flex items-center justify-center gap-1.5 font-mono text-xs sm:text-sm font-bold text-amber-200 bg-amber-500/15 border border-amber-500/30 px-3.5 py-1 rounded-xl">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span>
                            {formatTime12Hour(meeting.startTime)} -{" "}
                            {formatTime12Hour(meeting.endTime)}
                          </span>
                        </div>
                        <p className="text-[11px] font-medium text-slate-300">
                          Host: <span className="text-white font-bold">{meeting.organizer}</span>
                        </p>
                      </div>

                      {/* Status Banner */}
                      <div className="w-full pt-3 mt-2 border-t border-white/10">
                        {isOngoing ? (
                          <div className="w-full py-2 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black tracking-widest text-xs sm:text-sm shadow-[0_0_20px_rgba(16,185,129,0.5)] flex items-center justify-center gap-2 animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-white"></span>
                            <span>ONGOING</span>
                          </div>
                        ) : isUpcoming ? (
                          <div className="w-full py-2 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black tracking-widest text-xs sm:text-sm shadow-[0_0_20px_rgba(245,158,11,0.5)] flex items-center justify-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-slate-950" />
                            <span>UPCOMING</span>
                          </div>
                        ) : (
                          <div className="w-full py-2 px-4 rounded-2xl bg-slate-800/90 border border-slate-700 text-slate-400 font-bold tracking-widest text-xs uppercase flex items-center justify-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                            <span>COMPLETED</span>
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })
              : /* Single Date (Rooms View Mode): render Room Display Cards */
                (visibleItems as RoomDisplayItem[]).map((item, idx) => {
                  const palette = roomPalettes[idx % roomPalettes.length];
                  const isOngoing = item.status === "ONGOING";
                  const isUpcoming = item.status === "UPCOMING";
                  const isAvailable = item.status === "AVAILABLE";

                  let borderStyle = palette.border;
                  let glowStyle = palette.glow;
                  let cardBg = `bg-gradient-to-b ${palette.gradient}`;

                  if (isOngoing) {
                    borderStyle = "border-emerald-400";
                    glowStyle = "shadow-[0_0_45px_rgba(16,185,129,0.45)] ring-2 ring-emerald-500/50";
                    cardBg = "bg-gradient-to-b from-emerald-950/80 via-slate-900/95 to-slate-950";
                  } else if (isUpcoming) {
                    borderStyle = "border-amber-400";
                    glowStyle = "shadow-[0_0_40px_rgba(245,158,11,0.4)] ring-2 ring-amber-500/40";
                    cardBg = "bg-gradient-to-b from-amber-950/70 via-slate-900/95 to-slate-950";
                  }

                  return (
                    <div
                      key={item.room.id}
                      className={`relative rounded-3xl p-6 sm:p-7 border-2 flex flex-col items-center justify-between text-center transition-all duration-300 transform hover:-translate-y-2 hover:scale-[1.02] min-h-[400px] backdrop-blur-xl ${borderStyle} ${glowStyle} ${cardBg} group`}
                    >
                      {/* Top Info Bar: Location & Capacity + TV View Link */}
                      <div className="w-full pb-3 border-b border-white/10 flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/10 text-slate-200 border border-white/10 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {item.room.location}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/5">
                            👥 {item.room.capacity} seats
                          </span>
                          <Link
                            href={`/display/${item.room.roomNumber}`}
                            className="p-1 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-white/10 transition"
                            title={`Open Fullscreen TV Display for ${item.room.roomNumber}`}
                          >
                            <Tv className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>

                      {/* Room Number Header */}
                      <Link
                        href={`/display/${item.room.roomNumber}`}
                        className="mt-3 flex flex-col items-center group/room cursor-pointer"
                        title="Click to view Room TV Screen"
                      >
                        <h2 className="text-2xl font-black tracking-wider uppercase font-mono text-white group-hover/room:text-cyan-300 transition drop-shadow">
                          {item.room.roomNumber}
                        </h2>
                        <p className="text-xs font-semibold text-slate-300 group-hover/room:text-cyan-200 transition">
                          {item.room.roomName}
                        </p>
                      </Link>

                      {/* Central Avatar Icon */}
                      <Link
                        href={`/display/${item.room.roomNumber}`}
                        className={`w-20 h-20 rounded-2xl flex items-center justify-center my-3 transition-transform duration-300 group-hover:scale-110 cursor-pointer ${palette.iconBg}`}
                        title="Click to view Room TV Screen"
                      >
                        <Users className="w-10 h-10" />
                      </Link>

                      {/* Meeting Details & Scheduled Slots for this Date */}
                      <div className="flex-1 flex flex-col justify-center my-2 space-y-2 w-full">
                        {item.todayMeetings && item.todayMeetings.length > 0 ? (
                          <div className="w-full space-y-1.5">
                            <div className="flex items-center justify-between px-1 border-b border-white/10 pb-1">
                              <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300">
                                📅 Meeting Slots ({item.todayMeetings.length})
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                {formatDateDisplay(startDate)}
                              </span>
                            </div>

                            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                              {item.todayMeetings.map((m: any) => {
                                const isMStart = m.status === "ONGOING";
                                const isMUpcoming = m.status === "UPCOMING";

                                return (
                                  <div
                                    key={m.id}
                                    className={`p-2 rounded-xl border text-left transition ${
                                      isMStart
                                        ? "bg-emerald-950/80 border-emerald-500/80 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                                        : isMUpcoming
                                        ? "bg-amber-950/70 border-amber-500/70 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                                        : "bg-slate-900/90 border-slate-700/80"
                                    }`}
                                  >
                                    <div className="flex items-start justify-between gap-1.5">
                                      <h4 className="text-xs font-bold text-white truncate flex-1 leading-tight">
                                        {m.title}
                                      </h4>
                                      <span
                                        className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded shrink-0 ${
                                          isMStart
                                            ? "bg-emerald-500 text-slate-950 animate-pulse"
                                            : isMUpcoming
                                            ? "bg-amber-500 text-slate-950"
                                            : "bg-slate-800 text-slate-400"
                                        }`}
                                      >
                                        {m.status}
                                      </span>
                                    </div>

                                    <div className="flex items-center justify-between mt-1 text-[10px] text-slate-300">
                                      <div className="inline-flex items-center gap-1 font-mono font-bold text-amber-200">
                                        <Clock className="w-3 h-3 text-amber-400" />
                                        <span>
                                          {formatTime12Hour(m.startTime)} - {formatTime12Hour(m.endTime)}
                                        </span>
                                      </div>
                                      {m.organizer && (
                                        <span className="text-slate-400 truncate max-w-[85px] text-[10px]">
                                          {m.organizer}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="py-3 text-center space-y-1">
                            <h3 className="text-lg sm:text-xl font-black text-teal-200">
                              {item.room.roomName}
                            </h3>
                            <p className="text-xs text-slate-300 font-medium">
                              No meeting slots booked on this date
                            </p>
                            <p className="text-[11px] text-teal-400 font-semibold">
                              ✨ Free all day • Ready for booking
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Status & Action Banner */}
                      <div className="w-full pt-3 mt-2 border-t border-white/10">
                        {isOngoing ? (
                          <Link
                            href={`/display/${item.room.roomNumber}`}
                            className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black tracking-widest text-sm sm:text-base shadow-[0_0_25px_rgba(16,185,129,0.6)] flex items-center justify-center gap-2 animate-pulse hover:opacity-95 transition"
                          >
                            <span className="w-2.5 h-2.5 rounded-full bg-white"></span>
                            <span>ONGOING</span>
                          </Link>
                        ) : isUpcoming ? (
                          <Link
                            href={`/display/${item.room.roomNumber}`}
                            className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black tracking-widest text-sm sm:text-base shadow-[0_0_25px_rgba(245,158,11,0.5)] flex items-center justify-center gap-2 hover:opacity-95 transition"
                          >
                            <Clock className="w-4 h-4 text-slate-950" />
                            <span>UPCOMING</span>
                          </Link>
                        ) : isAvailable ? (
                          <button
                            type="button"
                            onClick={() => handleOpenBookingModal(item)}
                            className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 font-black tracking-wider text-xs sm:text-sm shadow-[0_0_25px_rgba(6,182,212,0.6)] flex items-center justify-center gap-2 transition-all duration-200 transform hover:scale-[1.03] active:scale-95 cursor-pointer group/btn"
                            title={`Click to open meeting creation window for ${item.room.roomNumber}`}
                          >
                            <Sparkles className="w-4 h-4 text-slate-950 group-hover/btn:scale-110 transition-transform" />
                            <span>AVAILABLE • CREATE MEETING</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenBookingModal(item)}
                            className="w-full py-2 px-3 rounded-2xl bg-slate-800/90 hover:bg-emerald-950/90 border border-cyan-500/40 hover:border-emerald-400 text-cyan-300 hover:text-emerald-300 font-bold tracking-wider text-xs flex flex-col items-center justify-center gap-0.5 shadow-md transition-all duration-200 transform hover:scale-[1.02] cursor-pointer group/avail"
                            title={`Click to book ${item.room.roomNumber} immediately`}
                          >
                            <span className="text-[10px] uppercase font-bold text-slate-400">
                              Previous Meeting Completed
                            </span>
                            <span className="text-emerald-400 font-black flex items-center gap-1.5">
                              <Plus className="w-3.5 h-3.5 text-emerald-400 group-hover/avail:rotate-90 transition-transform" />
                              <span>AVAILABLE NOW • CREATE MEETING</span>
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
          </div>
        )}

        {/* Below button: "See More" / "Show Less" (As requested by user!) */}
        {hasMoreThanSix && (
          <div className="flex justify-center mt-10 z-20 relative">
            <button
              onClick={() => setShowAll(!showAll)}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-black text-sm sm:text-base shadow-[0_0_35px_rgba(168,85,247,0.4)] border-2 border-white/20 transition-all duration-300 transform hover:scale-105 flex items-center gap-3 cursor-pointer"
            >
              {showAll ? (
                <>
                  <ChevronUp className="w-5 h-5" />
                  <span>Show Less (Collapse to 6)</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-amber-300 animate-spin" />
                  <span>
                    See More (View All {totalItemsCount} Between These Dates)
                  </span>
                  <ChevronDown className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        )}
      </main>

      {/* Quick Create Meeting Modal Popup Window */}
      {selectedRoomForBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border-2 border-cyan-500/70 rounded-3xl p-6 sm:p-7 shadow-[0_0_50px_rgba(6,182,212,0.3)] text-white relative animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/40">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Room Available
                  </span>
                  <span className="text-xs text-slate-400">
                    👥 {selectedRoomForBooking.room.capacity} seats
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white mt-1 uppercase font-mono tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-white">
                  {selectedRoomForBooking.room.roomNumber}
                </h2>
                <p className="text-xs font-semibold text-cyan-200">
                  {selectedRoomForBooking.room.roomName} • {selectedRoomForBooking.room.location}
                </p>
              </div>

              <button
                onClick={() => setSelectedRoomForBooking(null)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
                title="Close window"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {bookSuccess ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto animate-bounce">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-black text-white">Meeting Scheduled!</h3>
                <p className="text-xs text-emerald-300">
                  Successfully created meeting in {selectedRoomForBooking.room.roomNumber}.
                </p>
              </div>
            ) : (
              <form onSubmit={handleCreateMeetingSubmit} className="space-y-4 pt-4">
                {bookError && (
                  <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{bookError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-slate-400 tracking-wider mb-1">
                    Meeting Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Project Review & Discussion"
                    value={bookTitle}
                    onChange={(e) => setBookTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase text-slate-400 tracking-wider mb-1">
                      Organizer *
                    </label>
                    <input
                      type="text"
                      required
                      value={bookOrganizer}
                      onChange={(e) => setBookOrganizer(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold uppercase text-slate-400 tracking-wider mb-1">
                      Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={bookDate}
                      onChange={(e) => setBookDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase text-slate-400 tracking-wider mb-1">
                      Start Time *
                    </label>
                    <input
                      type="time"
                      required
                      value={bookStartTime}
                      onChange={(e) => setBookStartTime(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold uppercase text-slate-400 tracking-wider mb-1">
                      End Time *
                    </label>
                    <input
                      type="time"
                      required
                      value={bookEndTime}
                      onChange={(e) => setBookEndTime(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
                  <Link
                    href={`/meetings/create?roomId=${selectedRoomForBooking.room.id}&date=${bookDate}`}
                    className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    <span>Full Create Form</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => setSelectedRoomForBooking(null)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={bookSubmitting}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black text-xs shadow-[0_0_20px_rgba(6,182,212,0.4)] transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {bookSubmitting ? (
                        <span className="animate-spin">⏳</span>
                      ) : (
                        <Plus className="w-4 h-4 text-slate-950" />
                      )}
                      <span>Create Meeting</span>
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer Banner */}
      <footer className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 z-10 relative">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="font-semibold text-slate-300">
            Live Workspace Display Active
          </span>
        </div>
        <div className="text-sm font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400 tracking-wider my-2 sm:my-0">
          Welcome to Our Office
        </div>
        <div suppressHydrationWarning className="font-medium text-slate-400">
          {mounted
            ? `Last updated: ${lastRefreshed.toLocaleTimeString()}`
            : "Live Workspace"}
        </div>
      </footer>
    </div>
  );
}

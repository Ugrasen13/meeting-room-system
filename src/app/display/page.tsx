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
} from "lucide-react";
import { TimeSimulator } from "@/components/ui/TimeSimulator";
import { formatTime12Hour, formatDateDisplay, formatDateFull } from "@/lib/meetingStatus";
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
  const [startDate, setStartDate] = useState("2026-08-27");
  const [endDate, setEndDate] = useState("2026-08-27");

  // Temporary picker state
  const [tempStartDate, setTempStartDate] = useState("2026-08-27");
  const [tempEndDate, setTempEndDate] = useState("2026-08-27");
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Maximum 6 items initial display state
  const [showAll, setShowAll] = useState(false);

  const [currentTimeFormatted, setCurrentTimeFormatted] = useState("");
  const [simulatedTime, setSimulatedTime] = useState("");
  const [simulatedDate, setSimulatedDate] = useState("");
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Live ticking clock
  useEffect(() => {
    const updateClock = () => {
      if (isLiveMode) {
        const now = new Date();
        let hours = now.getHours();
        const minutes = String(now.getMinutes()).padStart(2, "0");
        const seconds = String(now.getSeconds()).padStart(2, "0");
        const period = hours >= 12 ? "PM" : "AM";
        hours = hours % 12 || 12;
        setCurrentTimeFormatted(
          `${String(hours).padStart(2, "0")}:${minutes}:${seconds} ${period}`
        );
      }
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
    fetchDisplay(startDate, endDate, simulatedTime);
  }, [startDate, endDate, simulatedTime]);

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

  // Decide what items to show:
  // If multiple dates selected (e.g. 27 Aug to 30 Aug), show meetings scheduled between those dates!
  // If single date, show room cards (or meetings).
  const isDateRange = startDate !== endDate;
  const itemsToDisplay = isDateRange ? allMeetings : rooms;
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
      <div className="flex items-center justify-between gap-4 mb-4 z-30 relative">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700/80 shadow-lg backdrop-blur-md transition group"
          >
            <ArrowLeft className="w-4 h-4 text-indigo-400 group-hover:-translate-x-0.5 transition" />
            <span>Dashboard</span>
          </Link>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/50 border border-emerald-800/60 text-emerald-400 text-xs font-semibold backdrop-blur-md">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Live TV Broadcast</span>
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

      {/* Header with Date Range Filter Popover */}
      <header className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-800/80 z-20 relative">
        {/* Left: Glowing Digital Clock */}
        <div className="flex items-center gap-3 bg-gradient-to-r from-slate-900/95 to-slate-900/80 border-2 border-cyan-500/50 px-5 py-2.5 rounded-2xl shadow-[0_0_25px_rgba(6,182,212,0.25)] backdrop-blur-md">
          <Clock className="w-6 h-6 text-cyan-400 animate-pulse" />
          <span
            className="font-mono text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-200 to-white tracking-widest"
            suppressHydrationWarning
          >
            {mounted ? currentTimeFormatted || "02:35 PM" : "02:35 PM"}
          </span>
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

        {/* Right: Interactive Date Range Button (Matching user uploaded screenshot) */}
        <div className="relative">
          <button
            onClick={() => setDatePickerOpen(!datePickerOpen)}
            className="flex items-center gap-3 bg-gradient-to-r from-slate-900/95 to-slate-900/80 hover:from-slate-850 hover:to-slate-800 border-2 border-indigo-500/80 hover:border-indigo-400 px-5 py-2.5 rounded-2xl shadow-[0_0_25px_rgba(99,102,241,0.3)] backdrop-blur-md transition cursor-pointer group"
            title="Click to select date range"
          >
            <CalendarIcon className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition" />
            <span className="text-sm sm:text-base font-extrabold text-white">
              {startDate === endDate
                ? formatDateFull(startDate)
                : `${formatDateDisplay(startDate)} → ${formatDateDisplay(endDate)}`}
            </span>
            <ChevronDown className="w-4 h-4 text-indigo-400 ml-1" />
          </button>

          {/* Date Range Modal Dropdown */}
          {datePickerOpen && (
            <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-slate-900/95 border-2 border-indigo-500/80 rounded-3xl p-5 shadow-2xl backdrop-blur-2xl z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Filter className="w-4 h-4 text-indigo-400" />
                  <span>Select Date Range</span>
                </div>
                <button
                  onClick={() => setDatePickerOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Preset Buttons */}
              <div className="grid grid-cols-3 gap-1.5 my-3">
                <button
                  type="button"
                  onClick={() => {
                    setTempStartDate("2026-08-27");
                    setTempEndDate("2026-08-27");
                  }}
                  className="px-2 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 border border-slate-700 text-center"
                >
                  27 Aug (Mock)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const todayStr = new Date().toISOString().slice(0, 10);
                    setTempStartDate(todayStr);
                    setTempEndDate(todayStr);
                  }}
                  className="px-2 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 border border-slate-700 text-center"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTempStartDate("2026-08-27");
                    setTempEndDate("2026-08-30");
                  }}
                  className="px-2 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-[11px] font-bold text-indigo-300 border border-indigo-500/40 text-center"
                >
                  27–30 Aug (Range)
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

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setDatePickerOpen(false)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyDateRange}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center gap-1.5"
                  >
                    <span>Apply Date Range</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Information Banner */}
      <div className="my-2 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 px-2 z-10">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-200">
            {isDateRange
              ? `Showing meetings from ${formatDateDisplay(startDate)} to ${formatDateDisplay(endDate)}`
              : `Workspace Live Status for ${formatDateFull(startDate)}`}
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
          <div className="py-24 text-center text-slate-400 space-y-3">
            <CalendarIcon className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-xl font-bold text-white">No meetings found between these dates</h3>
            <p className="text-xs text-slate-500">
              Try selecting a different date or date range above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {/* If isDateRange: render Meeting Cards */}
            {isDateRange
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
              : /* Single Date: render Room Display Cards */
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
                    <Link
                      key={item.room.id}
                      href={`/display/${item.room.roomNumber}`}
                      className={`relative rounded-3xl p-6 sm:p-7 border-2 flex flex-col items-center justify-between text-center transition-all duration-300 transform hover:-translate-y-2 hover:scale-[1.02] cursor-pointer min-h-[390px] backdrop-blur-xl ${borderStyle} ${glowStyle} ${cardBg} group`}
                    >
                      {/* Top Info Bar: Location & Capacity */}
                      <div className="w-full pb-3 border-b border-white/10 flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/10 text-slate-200 border border-white/10 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {item.room.location}
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/5">
                          👥 {item.room.capacity} seats
                        </span>
                      </div>

                      {/* Room Number Header */}
                      <div className="mt-3 flex items-center gap-2">
                        <h2 className="text-2xl font-black tracking-wider uppercase font-mono text-white group-hover:text-cyan-300 transition drop-shadow">
                          {item.room.roomNumber}
                        </h2>
                      </div>
                      <p className="text-xs font-semibold text-slate-300">
                        {item.room.roomName}
                      </p>

                      {/* Central Avatar Icon */}
                      <div
                        className={`w-20 h-20 rounded-2xl flex items-center justify-center my-3 transition-transform duration-300 group-hover:scale-110 ${palette.iconBg}`}
                      >
                        <Users className="w-10 h-10" />
                      </div>

                      {/* Meeting Details */}
                      <div className="flex-1 flex flex-col justify-center my-2 space-y-1.5 w-full">
                        {item.displayMeeting ? (
                          <>
                            <h3 className="text-lg sm:text-xl font-black text-white leading-snug line-clamp-2 px-1">
                              {item.displayMeeting.title}
                            </h3>
                            <div className="inline-flex items-center justify-center gap-1.5 font-mono text-xs sm:text-sm font-bold text-amber-200 bg-amber-500/15 border border-amber-500/30 px-3 py-1 rounded-xl mx-auto">
                              <Clock className="w-3.5 h-3.5 text-amber-400" />
                              <span>
                                {formatTime12Hour(item.displayMeeting.startTime)} -{" "}
                                {formatTime12Hour(item.displayMeeting.endTime)}
                              </span>
                            </div>
                            {item.displayMeeting.organizer && (
                              <p className="text-[11px] font-medium text-slate-300">
                                Host: <span className="text-white font-bold">{item.displayMeeting.organizer}</span>
                              </p>
                            )}
                          </>
                        ) : (
                          <>
                            <h3 className="text-lg sm:text-xl font-black text-teal-200">
                              {item.room.roomName}
                            </h3>
                            <p className="text-xs text-slate-300 font-medium">
                              No active meetings
                            </p>
                            <p className="text-[11px] text-teal-400 font-semibold mt-1">
                              ✨ Ready for immediate booking
                            </p>
                          </>
                        )}
                      </div>

                      {/* Status Banner */}
                      <div className="w-full pt-3 mt-2 border-t border-white/10">
                        {isOngoing ? (
                          <div className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black tracking-widest text-sm sm:text-base shadow-[0_0_25px_rgba(16,185,129,0.6)] flex items-center justify-center gap-2 animate-pulse">
                            <span className="w-2.5 h-2.5 rounded-full bg-white"></span>
                            <span>ONGOING</span>
                          </div>
                        ) : isUpcoming ? (
                          <div className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black tracking-widest text-sm sm:text-base shadow-[0_0_25px_rgba(245,158,11,0.5)] flex items-center justify-center gap-2">
                            <Clock className="w-4 h-4 text-slate-950" />
                            <span>UPCOMING</span>
                          </div>
                        ) : isAvailable ? (
                          <div className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-black tracking-widest text-sm sm:text-base shadow-[0_0_25px_rgba(6,182,212,0.5)] flex items-center justify-center gap-2">
                            <Sparkles className="w-4 h-4 text-slate-950" />
                            <span>AVAILABLE</span>
                          </div>
                        ) : (
                          <div className="w-full py-2 px-3 rounded-2xl bg-slate-800/90 border border-cyan-500/40 text-cyan-300 font-bold tracking-wider text-xs flex flex-col items-center justify-center gap-0.5 shadow-md">
                            <span className="text-[10px] uppercase font-bold text-slate-400">
                              Completed
                            </span>
                            <span className="text-emerald-400 font-black flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              AVAILABLE NOW
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>
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

"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { Clock, Calendar, Users, ArrowLeft, CheckCircle2, Volume2, Sparkles, Radio } from "lucide-react";
import { TimeSimulator } from "@/components/ui/TimeSimulator";
import { formatTime12Hour, formatDateDisplay } from "@/lib/meetingStatus";
import { RoomData, MeetingData, MeetingStatus } from "@/types";

interface PageProps {
  params: Promise<{ roomId: string }>;
}

export default function RoomSpecificDisplay({ params }: PageProps) {
  const resolvedParams = use(params);

  const [room, setRoom] = useState<RoomData | null>(null);
  const [status, setStatus] = useState<MeetingStatus>("AVAILABLE");
  const [currentMeeting, setCurrentMeeting] = useState<MeetingData | null>(null);
  const [nextMeeting, setNextMeeting] = useState<MeetingData | null>(null);
  const [schedule, setSchedule] = useState<MeetingData[]>([]);

  const [displayDate, setDisplayDate] = useState("");
  const [clockString, setClockString] = useState("");
  const [simulatedTime, setSimulatedTime] = useState("");
  const [simulatedDate, setSimulatedDate] = useState("");
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Live ticking clock
  useEffect(() => {
    const tick = () => {
      if (isLiveMode) {
        const now = new Date();
        let hours = now.getHours();
        const minutes = String(now.getMinutes()).padStart(2, "0");
        const seconds = String(now.getSeconds()).padStart(2, "0");
        const period = hours >= 12 ? "PM" : "AM";
        hours = hours % 12 || 12;
        setClockString(
          `${String(hours).padStart(2, "0")}:${minutes}:${seconds} ${period}`
        );
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isLiveMode]);

  // Fetch room-specific display data
  const fetchRoomData = async (time?: string, date?: string) => {
    try {
      const params = new URLSearchParams();
      if (time) params.set("time", time);
      if (date) params.set("date", date);
      const q = params.toString() ? `?${params.toString()}` : "";

      const res = await fetch(`/api/display/${encodeURIComponent(resolvedParams.roomId)}${q}`);
      if (res.ok) {
        const data = await res.json();
        setRoom(data.room);
        setStatus(data.status);
        setCurrentMeeting(data.currentMeeting);
        setNextMeeting(data.nextMeeting);
        setSchedule(data.schedule || []);
        setDisplayDate(data.date);
        if (!isLiveMode && time) {
          setClockString(formatTime12Hour(time));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomData(simulatedTime, simulatedDate);
  }, [simulatedTime, simulatedDate, resolvedParams.roomId]);

  // Polling every 15s
  useEffect(() => {
    if (!isLiveMode) return;
    const interval = setInterval(() => {
      fetchRoomData();
    }, 15000);
    return () => clearInterval(interval);
  }, [isLiveMode]);

  const handleTimeChange = (time: string, date: string, live: boolean) => {
    setIsLiveMode(live);
    if (live) {
      setSimulatedTime("");
      setSimulatedDate("");
      fetchRoomData();
    } else {
      setSimulatedTime(time);
      setSimulatedDate(date);
      fetchRoomData(time, date);
    }
  };

  return (
    <div className="min-h-screen bg-[#040714] text-white flex flex-col justify-between p-4 sm:p-8 select-none font-sans relative overflow-hidden">
      {/* Background Ambient Colored Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-10 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 left-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Top Floating Controls */}
      <div className="flex items-center justify-between gap-4 mb-3 z-20 relative">
        <div className="flex items-center gap-3">
          <Link
            href="/display"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700/80 shadow-lg backdrop-blur-md transition group"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-indigo-400 group-hover:-translate-x-0.5 transition" />
            <span>All Rooms TV</span>
          </Link>
          <Link
            href="/dashboard"
            className="text-xs font-medium text-slate-400 hover:text-slate-200 transition hidden sm:inline"
          >
            Dashboard
          </Link>
        </div>

        <div className="max-w-md w-full">
          <TimeSimulator
            currentSimulatedTime={simulatedTime || (clockString.slice(0, 5) || "Live")}
            currentSimulatedDate={simulatedDate || displayDate}
            onTimeChange={handleTimeChange}
            isLiveMode={isLiveMode}
          />
        </div>
      </div>

      {/* Screen Header (Mockup 8) */}
      <header className="flex items-center justify-between border-b border-slate-800/80 pb-5 pt-2 z-10 relative">
        <div>
          <h1 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 tracking-wider uppercase font-mono drop-shadow-[0_0_30px_rgba(52,211,153,0.4)]">
            {room ? room.roomNumber : resolvedParams.roomId}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-bold mt-1 flex items-center gap-2">
            <span>{room?.roomName}</span>
            <span>•</span>
            <span>{room?.location}</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px]">
              Capacity: {room?.capacity} seats
            </span>
          </p>
        </div>

        <div className="text-right">
          <div
            className="font-mono text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-white tracking-widest drop-shadow-[0_0_20px_rgba(6,182,212,0.3)]"
            suppressHydrationWarning
          >
            {mounted ? clockString || "02:35 PM" : "02:35 PM"}
          </div>
          <div
            className="text-xs sm:text-sm text-slate-400 font-bold mt-0.5"
            suppressHydrationWarning
          >
            {displayDate ? formatDateDisplay(displayDate) : "27 Aug 2026"}
          </div>
        </div>
      </header>

      {/* Main Content Area (2-Column Grid matching Mockup 8) */}
      <main className="my-auto py-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-7xl mx-auto w-full z-10 relative">
        {/* Left/Center Column: Current Meeting Hero (Mockup 8) */}
        <div className="lg:col-span-7 bg-gradient-to-b from-slate-900/90 via-slate-900/95 to-slate-950/95 rounded-3xl p-8 sm:p-12 border-2 border-emerald-500/50 shadow-[0_0_50px_rgba(16,185,129,0.25)] flex flex-col items-center justify-center text-center relative overflow-hidden backdrop-blur-xl min-h-[440px]">
          {currentMeeting ? (
            <>
              {/* Pulsing indicator */}
              <div className="text-emerald-400 text-xs sm:text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2 bg-emerald-950/60 px-4 py-1.5 rounded-full border border-emerald-500/40">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                CURRENT MEETING IN PROGRESS
              </div>

              {/* Icon Circle */}
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(16,185,129,0.4)]">
                <Users className="w-14 h-14 sm:w-16 sm:h-16" />
              </div>

              {/* Meeting Title */}
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
                {currentMeeting.title}
              </h2>

              {/* Time Range */}
              <div className="inline-flex items-center gap-2 font-mono text-xl sm:text-2xl font-black text-amber-300 bg-amber-500/15 border border-amber-500/30 px-5 py-1.5 rounded-2xl mb-6">
                <Clock className="w-5 h-5 text-amber-400" />
                <span>
                  {formatTime12Hour(currentMeeting.startTime)} -{" "}
                  {formatTime12Hour(currentMeeting.endTime)}
                </span>
              </div>

              {/* Status Pill */}
              <div className="px-10 py-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black tracking-widest text-base sm:text-xl shadow-[0_0_35px_rgba(16,185,129,0.6)] uppercase animate-pulse">
                ONGOING
              </div>
            </>
          ) : nextMeeting ? (
            <>
              <div className="text-amber-400 text-xs sm:text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2 bg-amber-950/60 px-4 py-1.5 rounded-full border border-amber-500/40">
                <Clock className="w-4 h-4 text-amber-400 animate-spin" />
                NEXT UPCOMING MEETING
              </div>

              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-tr from-amber-600 to-orange-500 text-white flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(245,158,11,0.4)]">
                <Users className="w-14 h-14 sm:w-16 sm:h-16" />
              </div>

              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
                {nextMeeting.title}
              </h2>

              <div className="inline-flex items-center gap-2 font-mono text-xl sm:text-2xl font-black text-amber-300 bg-amber-500/15 border border-amber-500/30 px-5 py-1.5 rounded-2xl mb-6">
                <Clock className="w-5 h-5 text-amber-400" />
                <span>
                  {formatTime12Hour(nextMeeting.startTime)} -{" "}
                  {formatTime12Hour(nextMeeting.endTime)}
                </span>
              </div>

              <div className="px-10 py-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-400 text-slate-950 font-black tracking-widest text-base sm:text-xl shadow-[0_0_30px_rgba(245,158,11,0.5)] uppercase">
                UPCOMING
              </div>
            </>
          ) : (
            <>
              <div className="text-cyan-400 text-xs sm:text-sm font-black uppercase tracking-widest mb-6 bg-cyan-950/60 px-4 py-1.5 rounded-full border border-cyan-500/40 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>ROOM STATUS</span>
              </div>

              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-tr from-cyan-600 to-blue-500 text-white flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(6,182,212,0.4)]">
                <CheckCircle2 className="w-14 h-14 sm:w-16 sm:h-16" />
              </div>

              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
                Room is Available Now
              </h2>

              <p className="text-sm sm:text-base text-slate-300 mb-6 max-w-sm font-medium">
                No active bookings in progress. You can step inside or schedule an ad-hoc session.
              </p>

              <div className="px-10 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-black tracking-widest text-base sm:text-xl shadow-[0_0_30px_rgba(6,182,212,0.5)] uppercase">
                AVAILABLE
              </div>
            </>
          )}
        </div>

        {/* Right Column: Today's Schedule Timeline (Mockup 8) */}
        <div className="lg:col-span-5 bg-gradient-to-b from-slate-900/90 via-slate-900/95 to-slate-950/95 rounded-3xl p-6 sm:p-8 border-2 border-indigo-500/40 shadow-[0_0_35px_rgba(99,102,241,0.25)] flex flex-col justify-start min-h-[440px] backdrop-blur-xl">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-200">
              TODAY&apos;S SCHEDULE
            </h3>
            <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 rounded-full">
              {schedule.length} Sessions
            </span>
          </div>

          <div className="py-4 space-y-6 flex-1 overflow-y-auto">
            {schedule.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-8 text-center">
                No meetings scheduled for this room today.
              </p>
            ) : (
              schedule.map((item, idx) => {
                const isOngoing = item.status === "ONGOING";
                const isUpcoming = item.status === "UPCOMING";
                const dotColor = isOngoing
                  ? "bg-emerald-400 ring-4 ring-emerald-500/40 animate-pulse"
                  : isUpcoming
                  ? "bg-amber-400 ring-4 ring-amber-400/30"
                  : "bg-slate-500";

                return (
                  <div key={item.id} className="flex items-start gap-4 relative group">
                    {/* Timeline vertical connector */}
                    {idx < schedule.length - 1 && (
                      <div className="absolute left-[7px] top-4 bottom-[-24px] w-[2px] bg-slate-800"></div>
                    )}

                    <div
                      className={`w-3.5 h-3.5 rounded-full mt-1.5 flex-shrink-0 z-10 ${dotColor}`}
                    ></div>

                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-xs sm:text-sm font-bold text-amber-300">
                        {formatTime12Hour(item.startTime)} -{" "}
                        {formatTime12Hour(item.endTime)}
                      </p>
                      <h4
                        className={`text-base font-extrabold truncate mt-0.5 ${
                          isOngoing
                            ? "text-emerald-400 font-black"
                            : isUpcoming
                            ? "text-white"
                            : "text-slate-400 line-through decoration-slate-600"
                        }`}
                      >
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-400">
                        Host: <span className="text-slate-300 font-semibold">{item.organizer}</span>
                      </p>
                    </div>

                    <div className="self-center">
                      {isOngoing && (
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-950/80 border border-emerald-500/60 px-2.5 py-1 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                          LIVE NOW
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* Bottom Noise Notice Banner (Mockup 8) */}
      <footer className="w-full max-w-4xl mx-auto mt-4 z-10 relative">
        <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900/90 to-emerald-950/60 border-2 border-emerald-500/50 rounded-2xl py-3 px-6 text-center text-xs sm:text-sm font-bold text-emerald-300 flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(16,185,129,0.25)] backdrop-blur-md">
          <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>Please keep noise to a minimum. Thank you!</span>
        </div>
      </footer>
    </div>
  );
}

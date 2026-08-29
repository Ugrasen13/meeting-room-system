"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TimeSimulator } from "@/components/ui/TimeSimulator";
import {
  Calendar,
  Clock,
  CheckCircle2,
  DoorClosed,
  ArrowRight,
  Loader2,
  Sparkles,
} from "lucide-react";
import { MeetingData, RoomData } from "@/types";
import { formatTime12Hour } from "@/lib/meetingStatus";

export default function DashboardPage() {
  const [meetings, setMeetings] = useState<MeetingData[]>([]);
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulatedTime, setSimulatedTime] = useState("");
  const [simulatedDate, setSimulatedDate] = useState("");
  const [isLiveMode, setIsLiveMode] = useState(true);

  const fetchData = async (time?: string, date?: string) => {
    try {
      const params = new URLSearchParams();
      if (date) params.set("date", date);
      if (time) params.set("time", time);
      const q = params.toString() ? `?${params.toString()}` : "";

      const [resMeetings, resRooms] = await Promise.all([
        fetch(`/api/meetings${q}`),
        fetch("/api/rooms"),
      ]);

      if (resMeetings.ok && resRooms.ok) {
        const dataMeetings = await resMeetings.json();
        const dataRooms = await resRooms.json();
        setMeetings(dataMeetings.meetings || []);
        setRooms(dataRooms.rooms || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(simulatedTime, simulatedDate);
  }, [simulatedTime, simulatedDate]);

  // Polling every 20s if live mode
  useEffect(() => {
    if (!isLiveMode) return;
    const interval = setInterval(() => {
      fetchData();
    }, 20000);
    return () => clearInterval(interval);
  }, [isLiveMode]);

  const handleTimeChange = (time: string, date: string, live: boolean) => {
    setIsLiveMode(live);
    if (live) {
      setSimulatedTime("");
      setSimulatedDate("");
      fetchData();
    } else {
      setSimulatedTime(time);
      setSimulatedDate(date);
      fetchData(time, date);
    }
  };

  // Compute KPI Counts
  const totalMeetingsToday = meetings.length;
  const ongoingMeetingsCount = meetings.filter((m) => m.status === "ONGOING").length;
  const upcomingMeetingsCount = meetings.filter((m) => m.status === "UPCOMING").length;

  // Active rooms with NO ongoing meeting right now
  const ongoingRoomIds = new Set(
    meetings.filter((m) => m.status === "ONGOING").map((m) => m.roomId)
  );
  const availableRoomsCount = rooms.filter(
    (r) => r.status === "active" && !ongoingRoomIds.has(r.id)
  ).length;

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Welcome Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Dashboard
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              Welcome back, Admin! Here is today&apos;s workspace status.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/meetings/create"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Schedule Meeting</span>
            </Link>
          </div>
        </div>

        {/* Time Simulator Banner */}
        <TimeSimulator
          currentSimulatedTime={simulatedTime || "Live Device Time"}
          currentSimulatedDate={simulatedDate || "Today"}
          onTimeChange={handleTimeChange}
          isLiveMode={isLiveMode}
        />

        {/* KPI Cards Grid (Matching Mockup 2) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Total Meetings */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between hover:shadow-md transition">
            <div>
              <p className="text-3xl font-extrabold text-slate-900 leading-none">
                {loading ? "..." : totalMeetingsToday}
              </p>
              <p className="text-xs font-semibold text-slate-700 mt-1.5">
                Total Meetings
              </p>
              <p className="text-[11px] text-slate-400">Scheduled Today</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
          </div>

          {/* Card 2: Ongoing Meetings Now */}
          <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-xs flex items-center justify-between hover:shadow-md transition relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-full -mr-6 -mt-6 pointer-events-none"></div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-extrabold text-emerald-600 leading-none">
                  {loading ? "..." : ongoingMeetingsCount}
                </span>
                {ongoingMeetingsCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                )}
              </div>
              <p className="text-xs font-semibold text-slate-700 mt-1.5">
                Ongoing Meetings
              </p>
              <p className="text-[11px] text-emerald-600 font-medium">Happening Now</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          {/* Card 3: Upcoming Meetings */}
          <div className="bg-white rounded-2xl p-5 border border-amber-100 shadow-xs flex items-center justify-between hover:shadow-md transition">
            <div>
              <p className="text-3xl font-extrabold text-amber-600 leading-none">
                {loading ? "..." : upcomingMeetingsCount}
              </p>
              <p className="text-xs font-semibold text-slate-700 mt-1.5">
                Upcoming Meetings
              </p>
              <p className="text-[11px] text-amber-600 font-medium">Remaining Today</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          {/* Card 4: Available Rooms Now */}
          <div className="bg-white rounded-2xl p-5 border border-cyan-100 shadow-xs flex items-center justify-between hover:shadow-md transition">
            <div>
              <p className="text-3xl font-extrabold text-cyan-600 leading-none">
                {loading ? "..." : availableRoomsCount}
              </p>
              <p className="text-xs font-semibold text-slate-700 mt-1.5">
                Available Rooms
              </p>
              <p className="text-[11px] text-cyan-600 font-medium">Free for booking</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-200 flex items-center justify-center">
              <DoorClosed className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Today's Meetings Table Section (Matching Mockup 2) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 sm:px-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Today&apos;s Meetings
              </h2>
              <p className="text-xs text-slate-500">
                Real-time snapshot of scheduled sessions
              </p>
            </div>
            <Link
              href="/meetings"
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
              <p className="text-xs text-slate-400 font-medium">Loading schedule...</p>
            </div>
          ) : meetings.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <p className="text-sm font-semibold text-slate-700">No meetings today</p>
              <p className="text-xs text-slate-400 mt-1">
                Click &quot;Schedule Meeting&quot; above to create a booking.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-6">Meeting</th>
                    <th className="py-3.5 px-6">Room</th>
                    <th className="py-3.5 px-6">Time</th>
                    <th className="py-3.5 px-6">Organizer</th>
                    <th className="py-3.5 px-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {meetings.map((m) => (
                    <tr
                      key={m.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <Link
                          href={`/meetings/${m.id}`}
                          className="font-bold text-slate-900 hover:text-indigo-600 transition block text-sm"
                        >
                          {m.title}
                        </Link>
                        {m.description && (
                          <span className="text-[11px] text-slate-400 line-clamp-1">
                            {m.description}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-slate-600">
                        <span className="font-semibold text-slate-800">
                          {m.room?.roomNumber || "Room"}
                        </span>
                        <span className="text-[11px] text-slate-400 block">
                          {m.room?.roomName}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-mono">
                        {formatTime12Hour(m.startTime)} -{" "}
                        {formatTime12Hour(m.endTime)}
                      </td>
                      <td className="py-4 px-6 text-slate-600">{m.organizer}</td>
                      <td className="py-4 px-6">
                        <StatusBadge status={m.status || "UPCOMING"} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

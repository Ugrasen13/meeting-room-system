"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  AlertCircle,
  AlertTriangle,
  Lightbulb,
  Sparkles,
  CheckCircle2,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { RoomData, SessionUser } from "@/types";
import { getTodayString, formatTime12Hour, formatDateDisplay } from "@/lib/meetingStatus";

export default function CreateMeetingPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);

  const [title, setTitle] = useState("");
  const [organizer, setOrganizer] = useState("");
  const [description, setDescription] = useState("");
  const [roomId, setRoomId] = useState("");
  const [meetingDate, setMeetingDate] = useState(getTodayString());
  const [startTime, setStartTime] = useState("14:00");
  const [endTime, setEndTime] = useState("15:00");

  const [error, setError] = useState("");
  const [conflictData, setConflictData] = useState<{
    title: string;
    startTime: string;
    endTime: string;
    roomNumber: string;
  } | null>(null);
  const [isSlotAvailable, setIsSlotAvailable] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const [resAuth, resRooms] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/rooms"),
        ]);
        if (resAuth.ok) {
          const authData = await resAuth.json();
          setCurrentUser(authData.user);
          if (authData.user.role !== "admin") {
            router.replace("/meetings");
            return;
          }
          setOrganizer(authData.user.name);
        }
        if (resRooms.ok) {
          const roomsData = await resRooms.json();
          const activeRooms = (roomsData.rooms || []).filter(
            (r: RoomData) => r.status === "active"
          );
          setRooms(activeRooms);
          if (activeRooms.length > 0) {
            setRoomId(activeRooms[0].id);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
    init();
  }, [router]);

  // Pre-validate conflict whenever room, date, or times change
  useEffect(() => {
    let active = true;
    async function checkConflict() {
      if (!roomId || !meetingDate || !startTime || !endTime) {
        setConflictData(null);
        setIsSlotAvailable(false);
        return;
      }

      if (endTime <= startTime) {
        setConflictData(null);
        setIsSlotAvailable(false);
        return;
      }

      try {
        const res = await fetch(`/api/meetings?roomId=${roomId}&date=${meetingDate}`);
        if (res.ok) {
          const data = await res.json();
          const existing = data.meetings || [];
          const overlap = existing.find(
            (m: any) => m.startTime < endTime && m.endTime > startTime
          );
          if (!active) return;
          if (overlap) {
            const selectedRoom = rooms.find((r) => r.id === roomId);
            setConflictData({
              title: overlap.title,
              startTime: overlap.startTime,
              endTime: overlap.endTime,
              roomNumber: selectedRoom ? `${selectedRoom.roomNumber} (${selectedRoom.roomName})` : "This room",
            });
            setIsSlotAvailable(false);
          } else {
            setConflictData(null);
            setIsSlotAvailable(true);
          }
        }
      } catch (err) {
        // silent
      }
    }
    checkConflict();
    return () => {
      active = false;
    };
  }, [roomId, meetingDate, startTime, endTime, rooms]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Meeting title is required.");
      return;
    }
    if (!organizer.trim()) {
      setError("Organizer is required.");
      return;
    }
    if (!roomId) {
      setError("Please select a meeting room.");
      return;
    }
    if (!meetingDate) {
      setError("Meeting date is required.");
      return;
    }
    if (!startTime || !endTime) {
      setError("Start time and end time are required.");
      return;
    }
    if (endTime <= startTime) {
      setError("End time must be later than start time.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          organizer: organizer.trim(),
          description: description.trim(),
          roomId,
          meetingDate,
          startTime,
          endTime,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create meeting.");
        setSubmitting(false);
        return;
      }

      router.push("/meetings");
    } catch (err) {
      setError("Unable to connect to server. Please try again.");
      setSubmitting(false);
    }
  };

  const timeOptions = [
    { value: "08:00", label: "08:00 AM" },
    { value: "08:30", label: "08:30 AM" },
    { value: "09:00", label: "09:00 AM" },
    { value: "09:30", label: "09:30 AM" },
    { value: "10:00", label: "10:00 AM" },
    { value: "10:30", label: "10:30 AM" },
    { value: "11:00", label: "11:00 AM" },
    { value: "11:30", label: "11:30 AM" },
    { value: "12:00", label: "12:00 PM" },
    { value: "12:30", label: "12:30 PM" },
    { value: "13:00", label: "01:00 PM" },
    { value: "13:30", label: "01:30 PM" },
    { value: "14:00", label: "02:00 PM" },
    { value: "14:30", label: "02:30 PM" },
    { value: "15:00", label: "03:00 PM" },
    { value: "15:30", label: "03:30 PM" },
    { value: "16:00", label: "04:00 PM" },
    { value: "16:30", label: "04:30 PM" },
    { value: "17:00", label: "05:00 PM" },
    { value: "17:30", label: "05:30 PM" },
    { value: "18:00", label: "06:00 PM" },
    { value: "18:30", label: "06:30 PM" },
    { value: "19:00", label: "07:00 PM" },
  ];

  return (
    <AppLayout requiredRole="admin">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Breadcrumb & Title (Mockup 4) */}
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
            <Link href="/meetings" className="hover:text-indigo-600">
              Meetings
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-slate-900 font-semibold">Create Meeting</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Create Meeting
          </h1>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {conflictData && !error && (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50/60 to-amber-50 border-2 border-amber-300 text-amber-900 shadow-xs space-y-3 animate-in fade-in">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-amber-900 flex items-center gap-2">
                  <span>Room Booking Conflict Detected</span>
                </h4>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  <strong>{conflictData.roomNumber}</strong> is already booked for{" "}
                  <span className="font-semibold text-amber-950">&ldquo;{conflictData.title}&rdquo;</span> from{" "}
                  <span className="font-mono font-bold text-amber-900 bg-amber-200/80 px-1.5 py-0.5 rounded">
                    {formatTime12Hour(conflictData.startTime)} - {formatTime12Hour(conflictData.endTime)}
                  </span>{" "}
                  on this date.
                </p>
              </div>
            </div>

            <div className="pt-2.5 border-t border-amber-200/80 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-800">
                <Lightbulb className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                <span>Hints: Select a different room (e.g. Room 102 / 103) or choose a time slot before {formatTime12Hour(conflictData.startTime)} or after {formatTime12Hour(conflictData.endTime)}.</span>
              </div>
            </div>
          </div>
        )}

        {isSlotAvailable && !conflictData && !error && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 shadow-xs animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold">
              ✨ Great news! This room is completely available for {formatTime12Hour(startTime)} - {formatTime12Hour(endTime)}.
            </span>
          </div>
        )}

        {/* Create Form Container (Mockup 4) */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Meeting Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Meeting Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Client Discussion"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  required
                />
              </div>

              {/* Organizer */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Organizer <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={organizer}
                  onChange={(e) => setOrganizer(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  required
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter meeting description and agenda..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              {/* Room Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Room <span className="text-rose-500">*</span>
                </label>
                <select
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  required
                >
                  <option value="">Select a room</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.roomNumber} — {r.roomName} ({r.location}, Cap: {r.capacity})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  required
                />
              </div>

              {/* Start Time */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Start Time <span className="text-rose-500">*</span>
                </label>
                <select
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  required
                >
                  {timeOptions.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* End Time */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  End Time <span className="text-rose-500">*</span>
                </label>
                <select
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  required
                >
                  {timeOptions.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action Buttons (Mockup 4) */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => router.push("/meetings")}
                className="px-5 py-2.5 border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold rounded-xl text-xs shadow-md shadow-indigo-600/30 transition flex items-center gap-2"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Create Meeting</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}

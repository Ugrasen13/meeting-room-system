"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  Calendar,
  Search,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Filter,
  Loader2,
  AlertCircle,
  X,
} from "lucide-react";
import { MeetingData, RoomData, SessionUser } from "@/types";
import { formatTime12Hour, formatDateDisplay } from "@/lib/meetingStatus";

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<MeetingData[]>([]);
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");

  // Delete modal state
  const [meetingToDelete, setMeetingToDelete] = useState<MeetingData | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (selectedRoom !== "all") params.set("roomId", selectedRoom);
      if (selectedStatus !== "all") params.set("status", selectedStatus);
      if (selectedDate) params.set("date", selectedDate);
      const q = params.toString() ? `?${params.toString()}` : "";

      const res = await fetch(`/api/meetings${q}`);
      if (res.ok) {
        const data = await res.json();
        setMeetings(data.meetings || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const res = await fetch("/api/rooms");
      if (res.ok) {
        const data = await res.json();
        setRooms(data.rooms || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchRooms();
  }, []);

  useEffect(() => {
    fetchMeetings();
  }, [search, selectedRoom, selectedStatus, selectedDate]);

  const handleDelete = async () => {
    if (!meetingToDelete) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/meetings/${meetingToDelete.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMeetingToDelete(null);
        fetchMeetings();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete meeting");
      }
    } catch (err) {
      alert("Network error. Could not delete meeting.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const isAdmin = currentUser?.role === "admin";

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header (Matching Mockup 3) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Meetings
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              Manage all scheduled meetings
            </p>
          </div>

          {isAdmin && (
            <Link
              href="/meetings/create"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create Meeting</span>
            </Link>
          )}
        </div>

        {/* Filter Bar (Matching Mockup 3) */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="flex-1 min-w-[200px] relative">
            <input
              type="text"
              placeholder="Search meeting..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs text-slate-700 font-medium focus:outline-none"
            />
            {selectedDate && (
              <button
                onClick={() => setSelectedDate("")}
                className="text-slate-400 hover:text-slate-600"
                title="Clear date"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Room Filter */}
          <select
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Rooms</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.roomNumber} ({r.roomName})
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Status</option>
            <option value="ONGOING">Ongoing</option>
            <option value="UPCOMING">Upcoming</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>

        {/* Meetings Table (Matching Mockup 3) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
              <p className="text-xs text-slate-400 font-medium">Loading meetings...</p>
            </div>
          ) : meetings.length === 0 ? (
            <div className="py-20 text-center text-slate-500">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No meetings found</p>
              <p className="text-xs text-slate-400 mt-1">
                Try adjusting your filters or date selection.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-6">Meeting</th>
                    <th className="py-3.5 px-6">Room</th>
                    <th className="py-3.5 px-6">Date</th>
                    <th className="py-3.5 px-6">Time</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6 text-right">Action</th>
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
                        <span className="text-[11px] text-slate-400 block">
                          Organizer: {m.organizer}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-semibold text-slate-800">
                          {m.room?.roomNumber}
                        </span>
                        <span className="text-[11px] text-slate-400 block">
                          {m.room?.roomName}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-medium">
                        {formatDateDisplay(m.meetingDate)}
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-mono">
                        {formatTime12Hour(m.startTime)} -{" "}
                        {formatTime12Hour(m.endTime)}
                      </td>
                      <td className="py-4 px-6">
                        <StatusBadge status={m.status || "UPCOMING"} size="sm" />
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View details */}
                          <Link
                            href={`/meetings/${m.id}`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                            title="View Meeting Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          {/* Admin Edit */}
                          {isAdmin && (
                            <Link
                              href={`/meetings/${m.id}/edit`}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition"
                              title="Edit Meeting"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Link>
                          )}

                          {/* Admin Delete */}
                          {isAdmin && (
                            <button
                              onClick={() => setMeetingToDelete(m)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                              title="Delete Meeting"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal (Rule 44) */}
        {meetingToDelete && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Delete Meeting
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to delete &quot;
                  <span className="font-semibold text-slate-800">
                    {meetingToDelete.title}
                  </span>
                  &quot;? This action cannot be undone.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setMeetingToDelete(null)}
                  disabled={deleteLoading}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md shadow-rose-600/20 transition flex items-center gap-1.5"
                >
                  {deleteLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

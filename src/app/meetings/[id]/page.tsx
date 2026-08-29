"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  DoorClosed,
  ChevronLeft,
  Edit2,
  Trash2,
  Loader2,
  Share2,
} from "lucide-react";
import { MeetingData, SessionUser } from "@/types";
import { formatTime12Hour, formatDateFull } from "@/lib/meetingStatus";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function MeetingDetailsPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [meeting, setMeeting] = useState<MeetingData | null>(null);
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [resAuth, resMeeting] = await Promise.all([
          fetch("/api/auth/me"),
          fetch(`/api/meetings/${resolvedParams.id}`),
        ]);

        if (resAuth.ok) {
          const authData = await resAuth.json();
          setCurrentUser(authData.user);
        }

        if (resMeeting.ok) {
          const data = await resMeeting.json();
          setMeeting(data.meeting);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [resolvedParams.id]);

  const isAdmin = currentUser?.role === "admin";

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this meeting?")) return;
    try {
      const res = await fetch(`/api/meetings/${resolvedParams.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/meetings");
      }
    } catch (e) {
      alert("Failed to delete meeting.");
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="py-20 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Loading details...</p>
        </div>
      </AppLayout>
    );
  }

  if (!meeting) {
    return (
      <AppLayout>
        <div className="max-w-xl mx-auto py-20 text-center space-y-4">
          <p className="text-base font-bold text-slate-800">Meeting Not Found</p>
          <Link
            href="/meetings"
            className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Return to Meetings</span>
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/meetings"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Meetings</span>
          </Link>

          {isAdmin && (
            <div className="flex items-center gap-2">
              <Link
                href={`/meetings/${meeting.id}/edit`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
              >
                <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Edit</span>
              </Link>
              <button
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>

        {/* Meeting Details Card (Section 18) */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 block mb-1">
                Meeting Details
              </span>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {meeting.title}
              </h1>
            </div>
            <div>
              <StatusBadge status={meeting.status || "UPCOMING"} size="lg" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Room */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                <DoorClosed className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase text-slate-400">
                  Assigned Room
                </p>
                <p className="text-sm font-bold text-slate-900">
                  {meeting.room?.roomNumber}
                </p>
                <p className="text-xs text-slate-500">
                  {meeting.room?.roomName} • {meeting.room?.location} (Cap:{" "}
                  {meeting.room?.capacity})
                </p>
                <Link
                  href={`/display/${meeting.room?.roomNumber}`}
                  target="_blank"
                  className="text-[11px] font-semibold text-indigo-600 hover:underline mt-1 inline-block"
                >
                  View Room Tablet Display →
                </Link>
              </div>
            </div>

            {/* Date & Time */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase text-slate-400">
                  Date & Time
                </p>
                <p className="text-sm font-bold text-slate-900">
                  {formatDateFull(meeting.meetingDate)}
                </p>
                <p className="text-xs text-slate-600 font-mono mt-0.5">
                  {formatTime12Hour(meeting.startTime)} -{" "}
                  {formatTime12Hour(meeting.endTime)}
                </p>
              </div>
            </div>

            {/* Organizer */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase text-slate-400">
                  Organizer
                </p>
                <p className="text-sm font-bold text-slate-900">
                  {meeting.organizer}
                </p>
                <p className="text-xs text-slate-500">Session Host</p>
              </div>
            </div>

            {/* Description */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3.5 sm:col-span-2">
              <div>
                <p className="text-[11px] font-bold uppercase text-slate-400 mb-1">
                  Description / Agenda
                </p>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {meeting.description || "No agenda or description provided."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

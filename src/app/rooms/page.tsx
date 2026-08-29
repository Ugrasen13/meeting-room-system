"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  DoorClosed,
  Plus,
  Edit2,
  Trash2,
  Tv,
  Loader2,
  AlertCircle,
  X,
  Building,
} from "lucide-react";
import { RoomData, SessionUser } from "@/types";

export default function RoomsPage() {
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<RoomData | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  // Form fields
  const [roomName, setRoomName] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [location, setLocation] = useState("1st Floor");
  const [capacity, setCapacity] = useState("15");
  const [status, setStatus] = useState("active");

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const [resAuth, resRooms] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/rooms"),
      ]);

      if (resAuth.ok) {
        const authData = await resAuth.json();
        setCurrentUser(authData.user);
      }

      if (resRooms.ok) {
        const roomsData = await resRooms.json();
        setRooms(roomsData.rooms || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const openCreateModal = () => {
    setEditingRoom(null);
    setRoomName("");
    setRoomNumber("");
    setLocation("1st Floor");
    setCapacity("15");
    setStatus("active");
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (room: RoomData) => {
    setEditingRoom(room);
    setRoomName(room.roomName);
    setRoomNumber(room.roomNumber);
    setLocation(room.location);
    setCapacity(String(room.capacity));
    setStatus(room.status);
    setFormError("");
    setModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!roomName.trim() || !roomNumber.trim() || !location.trim()) {
      setFormError("All fields are required.");
      return;
    }

    setFormLoading(true);

    try {
      const url = editingRoom ? `/api/rooms/${editingRoom.id}` : "/api/rooms";
      const method = editingRoom ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomName: roomName.trim(),
          roomNumber: roomNumber.trim(),
          location: location.trim(),
          capacity: parseInt(capacity, 10),
          status,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || "Failed to save room.");
        setFormLoading(false);
        return;
      }

      setModalOpen(false);
      fetchRooms();
    } catch (err) {
      setFormError("Unable to connect to server.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (room: RoomData) => {
    if (
      !confirm(
        `Are you sure you want to delete/deactivate "${room.roomNumber} - ${room.roomName}"?`
      )
    )
      return;

    try {
      const res = await fetch(`/api/rooms/${room.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        if (data.deactivated) {
          alert(data.message);
        }
        fetchRooms();
      } else {
        alert(data.error || "Failed to delete room.");
      }
    } catch (e) {
      alert("Network error. Could not delete room.");
    }
  };

  const isAdmin = currentUser?.role === "admin";

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header (Matching Mockup 5) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Rooms
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              Manage meeting rooms and floor availability
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Room</span>
            </button>
          )}
        </div>

        {/* Rooms Table (Matching Mockup 5) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
              <p className="text-xs text-slate-400 font-medium">Loading rooms...</p>
            </div>
          ) : rooms.length === 0 ? (
            <div className="py-20 text-center text-slate-500">
              <DoorClosed className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No rooms added yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-6">Room Name</th>
                    <th className="py-3.5 px-6">Room Number</th>
                    <th className="py-3.5 px-6">Location</th>
                    <th className="py-3.5 px-6">Capacity</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {rooms.map((room) => (
                    <tr
                      key={room.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-4 px-6 font-bold text-slate-900 text-sm">
                        {room.roomName}
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-700">
                        {room.roomNumber}
                      </td>
                      <td className="py-4 px-6 text-slate-600">{room.location}</td>
                      <td className="py-4 px-6 text-slate-600">
                        {room.capacity} people
                      </td>
                      <td className="py-4 px-6">
                        <StatusBadge
                          status={room.status === "active" ? "ACTIVE" : "INACTIVE"}
                          size="sm"
                        />
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Live Tablet screen shortcut */}
                          <Link
                            href={`/display/${room.roomNumber}`}
                            target="_blank"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                            title="Open Room Tablet Screen"
                          >
                            <Tv className="w-4 h-4" />
                          </Link>

                          {isAdmin && (
                            <>
                              <button
                                onClick={() => openEditModal(room)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer"
                                title="Edit Room"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(room)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                title="Delete or Deactivate Room"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
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

        {/* Add/Edit Room Modal (Sections 20 & 21) */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {editingRoom ? "Edit Room" : "Create New Room"}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Specify room details and capacity
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {formError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Room Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Conference Room A"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Room Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Room 101 or R101"
                      value={roomNumber}
                      onChange={(e) => setRoomNumber(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Capacity <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 20"
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Location <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 1st Floor"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-indigo-600/30 transition flex items-center gap-1.5"
                  >
                    {formLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{editingRoom ? "Save Changes" : "Create Room"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

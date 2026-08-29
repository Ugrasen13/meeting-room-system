"use client";

import React, { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  User,
  Shield,
  Mail,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  ArrowRightLeft,
} from "lucide-react";
import { SessionUser } from "@/types";

export default function ProfilePage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          setEditName(data.user.name);
          setEditEmail(data.user.email);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    if (!editName.trim()) {
      setErrorMsg("Name cannot be empty.");
      setSaving(false);
      return;
    }

    try {
      const payload: any = {
        name: editName.trim(),
        email: editEmail.trim(),
      };
      if (editPassword) {
        payload.password = editPassword;
      }

      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMsg("Profile name updated successfully!");
        setUser((prev) => (prev ? { ...prev, name: editName.trim(), email: editEmail.trim() } : null));
        setEditPassword("");
        // Reload after 1.2s to refresh session across all layout components
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        setErrorMsg(data.error || "Failed to update profile name.");
      }
    } catch (err) {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const switchAccount = async (accountType: "pradhan" | "admin" | "user") => {
    let creds = { email: "Pradhan", password: "123" };
    if (accountType === "admin") {
      creds = { email: "admin@office.com", password: "Admin@123" };
    } else if (accountType === "user") {
      creds = { email: "priya@office.com", password: "User@123" };
    }

    await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(creds),
    });

    window.location.reload();
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            User Profile
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Manage your personal profile name, credentials, and settings
          </p>
        </div>

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2.5 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5 shadow-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
        )}

        {user && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            {/* Header Badge */}
            <div className="flex items-center gap-5 border-b border-slate-100 pb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-indigo-600/20">
                {user.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-bold uppercase px-2.5 py-0.5 rounded-full ${
                      user.role === "admin"
                        ? "bg-purple-100 text-purple-700 border border-purple-200"
                        : "bg-blue-50 text-blue-700 border border-blue-200"
                    }`}
                  >
                    {user.role === "admin" ? (
                      <Shield className="w-3.5 h-3.5" />
                    ) : (
                      <User className="w-3.5 h-3.5" />
                    )}
                    {user.role}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    ID: {user.userId}
                  </span>
                </div>
              </div>
            </div>

            {/* Change Profile Name Form */}
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-600" />
                <span>Edit Profile Details</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Profile Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    placeholder="Enter your name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  New Password (optional)
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  placeholder="Leave blank to keep current password"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/30 transition flex items-center gap-2 cursor-pointer"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Profile Name</span>
                </button>
              </div>
            </form>

            {/* Quick Demo Switcher */}
            <div className="pt-6 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
                <span>Switch Active Account for Testing:</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  onClick={() => switchAccount("pradhan")}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border text-center transition ${
                    user.name === "Pradhan"
                      ? "bg-emerald-600 text-white border-emerald-600 shadow"
                      : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-200"
                  }`}
                >
                  Admin (Pradhan)
                </button>
                <button
                  onClick={() => switchAccount("admin")}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border text-center transition ${
                    user.name === "Rahul Sharma"
                      ? "bg-indigo-600 text-white border-indigo-600 shadow"
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200"
                  }`}
                >
                  Admin (Rahul)
                </button>
                <button
                  onClick={() => switchAccount("user")}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border text-center transition ${
                    user.role === "user"
                      ? "bg-indigo-600 text-white border-indigo-600 shadow"
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200"
                  }`}
                >
                  User (Priya)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

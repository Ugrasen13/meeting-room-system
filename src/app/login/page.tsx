"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Lock, Mail, AlertCircle, Loader2, Users, Shield } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("User ID / Email is required.");
      return;
    }
    if (!password) {
      setError("Password is required.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid User ID or Password");
        setLoading(false);
        return;
      }

      // Successful login
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError("Unable to connect to server. Please try again.");
      setLoading(false);
    }
  };

  const handleDemoLogin = (role: "pradhan" | "admin" | "user") => {
    if (role === "pradhan") {
      setEmail("Pradhan");
      setPassword("123");
    } else if (role === "admin") {
      setEmail("admin@office.com");
      setPassword("Admin@123");
    } else {
      setEmail("priya@office.com");
      setPassword("User@123");
    }
    setError("");
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 grid grid-cols-1 md:grid-cols-2">
        {/* Left Side: Login Form */}
        <div className="p-8 sm:p-12 flex flex-col justify-between">
          <div>
            {/* Header / Logo */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 leading-tight">
                  Meeting Room Management
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Please sign in to continue
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email or User ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Enter email (e.g. admin@office.com)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <span>Remember me</span>
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    alert("Demo System: Please use the pre-configured Demo accounts below.");
                  }}
                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold rounded-xl text-sm shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <span>Login</span>
                )}
              </button>
            </form>

            {/* Quick Demo Credentials */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
                Quick One-Click Demo Sign In:
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleDemoLogin("pradhan")}
                  className="flex flex-col items-center justify-center py-2.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-300 shadow-xs transition cursor-pointer"
                >
                  <Shield className="w-4 h-4 text-emerald-600 mb-1" />
                  <span>Pradhan</span>
                  <span className="text-[10px] text-emerald-600/80 font-medium">Administrator</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoLogin("admin")}
                  className="flex flex-col items-center justify-center py-2.5 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded-xl text-xs font-bold border border-indigo-300 shadow-xs transition cursor-pointer"
                >
                  <Shield className="w-4 h-4 text-indigo-600 mb-1" />
                  <span>Rahul</span>
                  <span className="text-[10px] text-indigo-600/80 font-medium">Administrator</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoLogin("user")}
                  className="flex flex-col items-center justify-center py-2.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold border border-slate-300 shadow-xs transition cursor-pointer"
                >
                  <Users className="w-4 h-4 text-slate-600 mb-1" />
                  <span>Priya</span>
                  <span className="text-[10px] text-slate-600/80 font-medium">Employee User</span>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center text-[11px] text-slate-400 font-medium">
            © 2024 Meeting Room Management System
          </div>
        </div>

        {/* Right Side: Office Illustration */}
        <div className="hidden md:flex flex-col items-center justify-center p-8 bg-gradient-to-br from-indigo-50 via-slate-50 to-blue-100 border-l border-slate-200 relative overflow-hidden">
          {/* Stylized Conference Room Graphic */}
          <div className="relative w-full max-w-sm flex flex-col items-center">
            {/* Wall Board / Display Screen */}
            <div className="w-48 h-28 bg-slate-900 rounded-xl shadow-xl border-4 border-slate-800 flex flex-col items-center justify-center p-3 mb-6 relative">
              <div className="w-12 h-1.5 bg-indigo-500 rounded-full mb-2"></div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span className="text-[10px] font-bold text-white tracking-widest uppercase">
                  ROOM 101 • LIVE
                </span>
              </div>
              <p className="text-[9px] text-slate-400 mt-1">Client Discussion</p>
            </div>

            {/* Conference Table with Chairs */}
            <div className="relative flex flex-col items-center">
              {/* Back chairs */}
              <div className="flex gap-4 -mb-3 z-0">
                <div className="w-8 h-8 rounded-lg bg-indigo-500 shadow-md transform -rotate-6"></div>
                <div className="w-8 h-8 rounded-lg bg-indigo-600 shadow-md"></div>
                <div className="w-8 h-8 rounded-lg bg-indigo-500 shadow-md transform rotate-6"></div>
              </div>

              {/* Boardroom Table */}
              <div className="w-64 h-24 bg-white/90 backdrop-blur-sm rounded-full shadow-2xl border border-slate-200 flex items-center justify-center z-10">
                <div className="w-48 h-12 bg-slate-100/80 rounded-full border border-slate-200 flex items-center justify-center text-[10px] font-semibold text-slate-400">
                  Smart Boardroom
                </div>
              </div>

              {/* Front chairs */}
              <div className="flex gap-4 -mt-3 z-20">
                <div className="w-8 h-8 rounded-lg bg-indigo-700 shadow-lg transform rotate-6"></div>
                <div className="w-8 h-8 rounded-lg bg-indigo-600 shadow-lg"></div>
                <div className="w-8 h-8 rounded-lg bg-indigo-700 shadow-lg transform -rotate-6"></div>
              </div>
            </div>

            {/* Decorative Plant */}
            <div className="absolute right-2 bottom-0 flex flex-col items-center">
              <div className="w-4 h-8 bg-emerald-500 rounded-full transform -rotate-12"></div>
              <div className="w-4 h-9 bg-emerald-600 rounded-full -mt-7 transform rotate-12"></div>
              <div className="w-6 h-6 bg-amber-700 rounded-b-md shadow"></div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <h3 className="text-base font-bold text-slate-800">
              Modern Room Scheduling
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
              Real-time room availability, automatic conflict checking, and live lobby TV displays.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

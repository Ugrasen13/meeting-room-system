"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Bell, Tv, ChevronDown, UserCheck, ShieldCheck } from "lucide-react";
import { SessionUser } from "@/types";

interface HeaderProps {
  user: SessionUser | null;
  onMenuToggle?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 hidden sm:block">
          Enterprise Workspace
        </h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Quick TV Display shortcut */}
        <Link
          href="/display"
          target="_blank"
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition border border-slate-200"
          title="Open TV Live Display in new tab"
        >
          <Tv className="w-3.5 h-3.5 text-indigo-600" />
          <span>Launch TV Display</span>
        </Link>

        {/* Notifications */}
        <button
          className="w-9 h-9 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 flex items-center justify-center relative transition"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-600"></span>
        </button>

        {/* User Profile Avatar & Badge */}
        {user ? (
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full hover:bg-slate-100 transition border border-slate-200/80"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs uppercase shadow-xs">
                {user.name ? user.name.charAt(0) : "U"}
              </div>
              <div className="text-left hidden sm:block">
                <span className="text-xs font-bold text-slate-800 block leading-tight">
                  {user.name}
                </span>
                <span className="text-[10px] uppercase font-bold text-indigo-600 flex items-center gap-0.5">
                  {user.role === "admin" ? (
                    <ShieldCheck className="w-3 h-3 text-indigo-600 inline" />
                  ) : (
                    <UserCheck className="w-3 h-3 text-slate-500 inline" />
                  )}
                  {user.role}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-sm animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="font-semibold text-slate-900">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  <p className="text-[11px] font-medium text-slate-400 mt-1">
                    ID: {user.userId} • Role:{" "}
                    <span className="uppercase text-indigo-600 font-bold">
                      {user.role}
                    </span>
                  </p>
                </div>
                <Link
                  href="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="block px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
                >
                  My Profile
                </Link>
                {user.role === "admin" && (
                  <Link
                    href="/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="block px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
                  >
                    Office Settings
                  </Link>
                )}
                <div className="border-t border-slate-100 my-1"></div>
                <button
                  onClick={async () => {
                    await fetch("/api/auth/logout", { method: "POST" });
                    window.location.href = "/login";
                  }}
                  className="w-full text-left px-4 py-2 text-rose-600 hover:bg-rose-50 font-medium"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition"
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
};

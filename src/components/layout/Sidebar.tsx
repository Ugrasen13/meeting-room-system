"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  DoorClosed,
  Users,
  Settings,
  Tv,
  LogOut,
  Sparkles,
  X,
} from "lucide-react";
import { SessionUser } from "@/types";

interface SidebarProps {
  user: SessionUser | null;
  mobileOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ user, mobileOpen = false, onClose }) => {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const navItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["admin", "user"],
    },
    {
      label: "Meetings",
      href: "/meetings",
      icon: Calendar,
      roles: ["admin", "user"],
    },
    {
      label: "Rooms",
      href: "/rooms",
      icon: DoorClosed,
      roles: ["admin", "user"],
    },
    {
      label: "Users",
      href: "/users",
      icon: Users,
      roles: ["admin"],
    },
    {
      label: "Live Display",
      href: "/display",
      icon: Tv,
      roles: ["admin", "user"],
      highlight: true,
    },
    {
      label: "Settings",
      href: "/settings",
      icon: Settings,
      roles: ["admin"],
    },
  ];

  const filteredItems = navItems.filter(
    (item) => !user || item.roles.includes(user.role)
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`w-64 bg-[#0a1128] text-slate-300 flex flex-col flex-shrink-0 min-h-screen border-r border-slate-800 select-none fixed md:static inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-white text-sm leading-tight tracking-wide">
                Meeting Room
              </h1>
              <p className="text-xs text-slate-400 font-medium">Management</p>
            </div>
          </div>

          {/* Close button on Mobile */}
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Menu
          </div>
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold"
                    : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                } ${item.highlight && !isActive ? "text-indigo-400" : ""}`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive
                      ? "text-white"
                      : item.highlight
                      ? "text-indigo-400"
                      : "text-slate-400"
                  }`}
                />
                <span>{item.label}</span>
                {item.highlight && (
                  <span className="ml-auto text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    TV
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-slate-800/80">
          {user && (
            <div className="mb-3 px-2 py-2 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs uppercase shadow">
                {user.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">
                  {user.name}
                </p>
                <p className="text-[11px] text-slate-400 capitalize">
                  {user.role} • {user.userId}
                </p>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-rose-950/40 hover:text-rose-400 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-slate-400" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

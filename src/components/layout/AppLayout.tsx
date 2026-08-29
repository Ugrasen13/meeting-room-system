"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { SessionUser } from "@/types";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "user";
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  requiredRole,
}) => {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let mounted = true;
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (mounted) {
            setUser(data.user);
            if (requiredRole === "admin" && data.user.role !== "admin") {
              router.replace("/dashboard");
            }
          }
        } else {
          if (mounted) {
            router.replace("/login");
          }
        }
      } catch (err) {
        if (mounted) router.replace("/login");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    checkAuth();
    return () => {
      mounted = false;
    };
  }, [pathname, requiredRole, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-sm font-medium text-slate-500">
            Loading Meeting System...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header user={user} />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};

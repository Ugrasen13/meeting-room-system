import React from "react";
import { MeetingStatus } from "@/types";

interface StatusBadgeProps {
  status: MeetingStatus | string;
  size?: "sm" | "md" | "lg";
  pulsing?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = "md",
  pulsing = true,
}) => {
  const normalized = (status || "").toUpperCase();

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs font-semibold rounded-full",
    md: "px-3 py-1 text-xs font-bold rounded-full tracking-wide",
    lg: "px-5 py-2 text-sm font-bold rounded-full tracking-wider",
  }[size];

  if (normalized === "ONGOING") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-400 dark:border-emerald-500/50 ${sizeClasses}`}
      >
        <span className="relative flex h-2 w-2">
          {pulsing && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          )}
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        ONGOING
      </span>
    );
  }

  if (normalized === "UPCOMING") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-300 dark:bg-amber-950/70 dark:text-amber-400 dark:border-amber-500/50 ${sizeClasses}`}
      >
        <span className="h-2 w-2 rounded-full bg-amber-500"></span>
        UPCOMING
      </span>
    );
  }

  if (normalized === "COMPLETED") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 ${sizeClasses}`}
      >
        <span className="h-2 w-2 rounded-full bg-slate-400"></span>
        COMPLETED
      </span>
    );
  }

  if (normalized === "AVAILABLE") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 bg-teal-50 text-teal-700 border border-teal-300 dark:bg-teal-950/60 dark:text-teal-400 dark:border-teal-500/50 ${sizeClasses}`}
      >
        <span className="h-2 w-2 rounded-full bg-teal-500"></span>
        AVAILABLE
      </span>
    );
  }

  if (normalized === "ACTIVE") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-xs px-2.5 py-0.5 rounded-md`}
      >
        ACTIVE
      </span>
    );
  }

  if (normalized === "INACTIVE") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 border border-rose-200 font-semibold text-xs px-2.5 py-0.5 rounded-md`}
      >
        INACTIVE
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses}`}
    >
      {normalized}
    </span>
  );
};

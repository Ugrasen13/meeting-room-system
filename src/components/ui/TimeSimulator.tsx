"use client";

import React, { useState } from "react";
import { Clock, Play, RotateCcw, Sliders, ChevronDown, ChevronUp } from "lucide-react";

interface TimeSimulatorProps {
  currentSimulatedTime: string;
  currentSimulatedDate: string;
  onTimeChange: (time: string, date: string, isLive: boolean) => void;
  isLiveMode: boolean;
}

export const TimeSimulator: React.FC<TimeSimulatorProps> = ({
  currentSimulatedTime,
  currentSimulatedDate,
  onTimeChange,
  isLiveMode,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [customTime, setCustomTime] = useState(currentSimulatedTime || "14:35");
  const [customDate, setCustomDate] = useState(currentSimulatedDate || "2026-08-27");

  const presets = [
    { label: "09:30 AM (Morning Sync)", time: "09:30" },
    { label: "01:30 PM (HR Meeting Ongoing)", time: "13:30" },
    { label: "02:35 PM (Mockup State - Client Disc Ongoing)", time: "14:35" },
    { label: "03:45 PM (Team Meeting Ongoing)", time: "15:45" },
    { label: "04:30 PM (Project Review Ongoing)", time: "16:30" },
    { label: "06:00 PM (All Completed)", time: "18:00" },
  ];

  return (
    <div className="bg-slate-900/90 backdrop-blur-md text-white border border-slate-700/80 rounded-2xl shadow-2xl p-3 text-xs">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isLiveMode ? "bg-emerald-500 animate-ping" : "bg-amber-400"
            }`}
          ></span>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-semibold text-slate-200">
              {isLiveMode ? "System Live Time:" : "Simulated Time:"}
            </span>
            <span
              className="font-mono font-bold text-amber-300 text-sm bg-slate-800 px-2 py-0.5 rounded border border-slate-700"
              suppressHydrationWarning
            >
              {currentSimulatedTime}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isLiveMode && (
            <button
              onClick={() => onTimeChange("", "", true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition shadow-xs"
              title="Reset to real device clock"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Use Real Clock</span>
            </button>
          )}

          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition border border-slate-700"
          >
            <Sliders className="w-3 h-3 text-indigo-400" />
            <span>Time Simulator</span>
            {expanded ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-slate-800 space-y-3">
          <p className="text-[11px] text-slate-400">
            Quickly test automatic meeting status transitions (Upcoming ➔ Ongoing ➔ Completed):
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {presets.map((p) => (
              <button
                key={p.time}
                onClick={() => {
                  setCustomTime(p.time);
                  onTimeChange(p.time, customDate, false);
                }}
                className={`text-left px-2.5 py-1.5 rounded-lg border transition font-mono text-[11px] ${
                  !isLiveMode && currentSimulatedTime === p.time
                    ? "bg-indigo-600 text-white border-indigo-500 shadow"
                    : "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <div className="flex items-center gap-1.5">
              <label className="text-slate-400 text-[11px]">Time:</label>
              <input
                type="time"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                className="bg-slate-800 text-white px-2 py-1 rounded border border-slate-700 text-xs font-mono"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-slate-400 text-[11px]">Date:</label>
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="bg-slate-800 text-white px-2 py-1 rounded border border-slate-700 text-xs font-mono"
              />
            </div>
            <button
              onClick={() => onTimeChange(customTime, customDate, false)}
              className="flex items-center gap-1 px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-xs"
            >
              <Play className="w-3 h-3" />
              <span>Apply</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

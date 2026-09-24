import { MeetingStatus } from "@/types";
import { prisma } from "./prisma";

/**
 * Converts "14:00" -> "02:00 PM", "09:30" -> "09:30 AM"
 */
export function formatTime12Hour(time24: string): string {
  if (!time24) return "";
  const parts = time24.split(":");
  if (parts.length < 2) return time24;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1].padStart(2, "0");
  const period = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const hoursStr = String(hours).padStart(2, "0");
  return `${hoursStr}:${minutes} ${period}`;
}

/**
 * Formats "2026-08-27" -> "27 Aug 2026"
 */
export function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parts[2];
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${day} ${months[monthIdx] || ""} ${year}`;
}

/**
 * Formats "2026-08-27" -> "27 August 2026"
 */
export function formatDateFull(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parts[2];
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return `${day} ${months[monthIdx] || ""} ${year}`;
}

/**
 * Formats "2026-08-27" -> "Thursday, 27 August 2026"
 */
export function formatDateWithWeekday(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return formatDateDisplay(dateStr);
  }
}

/**
 * Returns today's date in "YYYY-MM-DD" formatted to local timezone (defaults to Asia/Kolkata)
 */
export function getTodayString(timezone = "Asia/Kolkata"): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(new Date());
  } catch {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
}

/**
 * Returns today's date formatted nicely with weekday, e.g. "Wednesday, 23 Sep 2026"
 */
export function getTodayFormattedWithWeekday(timezone = "Asia/Kolkata"): string {
  try {
    const d = new Date();
    return d.toLocaleDateString("en-US", {
      timeZone: timezone,
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    const d = new Date();
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
}

/**
 * Returns current time in "HH:mm" formatted to local timezone (defaults to Asia/Kolkata)
 */
export function getCurrentTimeString(timezone = "Asia/Kolkata"): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return formatter.format(new Date());
  } catch {
    const d = new Date();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  }
}

/**
 * Computes meeting status given meeting details and reference current date & time
 */
export function computeMeetingStatus(
  meetingDate: string,
  startTime: string,
  endTime: string,
  refDate?: string,
  refTime?: string
): MeetingStatus {
  const currentDate = refDate || getTodayString();
  const currentTime = refTime || getCurrentTimeString();

  // If meeting date is strictly before current date, it is always COMPLETED
  if (meetingDate < currentDate) {
    return "COMPLETED";
  }
  
  // If meeting date is in the future, it is UPCOMING
  if (meetingDate > currentDate) {
    return "UPCOMING";
  }

  // Same day: compare times
  if (currentTime < startTime) {
    return "UPCOMING";
  } else if (currentTime >= startTime && currentTime < endTime) {
    return "ONGOING";
  } else {
    return "COMPLETED";
  }
}

/**
 * Validates room availability and double-booking prevention rule
 */
export async function checkMeetingConflict(params: {
  roomId: string;
  meetingDate: string;
  startTime: string;
  endTime: string;
  excludeMeetingId?: string;
}): Promise<{ hasConflict: boolean; message?: string; conflictingMeeting?: any }> {
  const { roomId, meetingDate, startTime, endTime, excludeMeetingId } = params;

  // 1. Validate times
  if (!startTime || !endTime) {
    return { hasConflict: true, message: "Start time and end time are required." };
  }

  if (endTime <= startTime) {
    return {
      hasConflict: true,
      message: "End time must be later than start time.",
    };
  }

  // 2. Validate Room exists and is active
  const room = await prisma.room.findUnique({
    where: { id: roomId },
  });

  if (!room) {
    return { hasConflict: true, message: "Selected room does not exist." };
  }

  if (room.status !== "active") {
    return {
      hasConflict: true,
      message: `Room ${room.roomNumber} (${room.roomName}) is currently inactive and cannot be booked.`,
    };
  }

  // 3. Check for overlapping meetings
  // Overlap condition:
  // (existing.startTime < newEndTime) AND (existing.endTime > newStartTime)
  const existingMeetings = await prisma.meeting.findMany({
    where: {
      roomId,
      meetingDate,
      ...(excludeMeetingId ? { id: { not: excludeMeetingId } } : {}),
    },
  });

  const conflicting = existingMeetings.find(
    (m) => m.startTime < endTime && m.endTime > startTime
  );

  if (conflicting) {
    const formattedExistingStart = formatTime12Hour(conflicting.startTime);
    const formattedExistingEnd = formatTime12Hour(conflicting.endTime);
    return {
      hasConflict: true,
      conflictingMeeting: conflicting,
      message: `${room.roomNumber} is already booked for "${conflicting.title}" from ${formattedExistingStart} to ${formattedExistingEnd}.`,
    };
  }

  return { hasConflict: false };
}

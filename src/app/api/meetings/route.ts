import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  checkMeetingConflict,
  computeMeetingStatus,
  getTodayString,
  getCurrentTimeString,
} from "@/lib/meetingStatus";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const roomId = searchParams.get("roomId");
    const statusFilter = searchParams.get("status");
    const search = searchParams.get("search");
    const refTime = searchParams.get("time") || getCurrentTimeString();
    const refDate = searchParams.get("refDate") || getTodayString();

    const whereClause: any = {};

    if (date && date !== "all") {
      whereClause.meetingDate = date;
    }

    if (roomId && roomId !== "all") {
      whereClause.roomId = roomId;
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search } },
        { organizer: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const meetings = await prisma.meeting.findMany({
      where: whereClause,
      include: {
        room: true,
      },
      orderBy: [{ meetingDate: "asc" }, { startTime: "asc" }],
    });

    // Compute dynamic status for each meeting
    const meetingsWithStatus = meetings.map((m) => {
      const status = computeMeetingStatus(
        m.meetingDate,
        m.startTime,
        m.endTime,
        refDate,
        refTime
      );
      return {
        ...m,
        status,
      };
    });

    // Apply status filter if specified
    const filtered =
      statusFilter && statusFilter !== "all"
        ? meetingsWithStatus.filter(
            (m) => m.status.toLowerCase() === statusFilter.toLowerCase()
          )
        : meetingsWithStatus;

    return NextResponse.json({ meetings: filtered });
  } catch (err: any) {
    console.error("GET /api/meetings error:", err);
    return NextResponse.json(
      { error: "Failed to fetch meetings." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    // Role-based access check
    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden. Only Admin can create meetings." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, description, organizer, roomId, meetingDate, startTime, endTime } = body;

    // Validation checks
    if (!title?.trim()) {
      return NextResponse.json({ error: "Meeting title is required." }, { status: 400 });
    }
    if (!roomId) {
      return NextResponse.json({ error: "Room selection is required." }, { status: 400 });
    }
    if (!organizer?.trim()) {
      return NextResponse.json({ error: "Organizer is required." }, { status: 400 });
    }
    if (!meetingDate) {
      return NextResponse.json({ error: "Meeting date is required." }, { status: 400 });
    }
    if (!startTime || !endTime) {
      return NextResponse.json({ error: "Start and end times are required." }, { status: 400 });
    }

    // Conflict detection engine
    const conflictResult = await checkMeetingConflict({
      roomId,
      meetingDate,
      startTime,
      endTime,
    });

    if (conflictResult.hasConflict) {
      return NextResponse.json(
        { error: conflictResult.message || "Room conflict detected." },
        { status: 409 }
      );
    }

    const newMeeting = await prisma.meeting.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        organizer: organizer.trim(),
        organizerId: user.id,
        roomId,
        meetingDate,
        startTime,
        endTime,
      },
      include: {
        room: true,
      },
    });

    return NextResponse.json(
      { success: true, message: "Meeting scheduled successfully", meeting: newMeeting },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("POST /api/meetings error:", err);
    return NextResponse.json(
      { error: "Failed to create meeting." },
      { status: 500 }
    );
  }
}

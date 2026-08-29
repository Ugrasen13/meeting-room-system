import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  checkMeetingConflict,
  computeMeetingStatus,
  getCurrentTimeString,
  getTodayString,
} from "@/lib/meetingStatus";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const meeting = await prisma.meeting.findUnique({
      where: { id },
      include: {
        room: true,
      },
    });

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found." }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const refTime = searchParams.get("time") || getCurrentTimeString();
    const refDate = searchParams.get("refDate") || getTodayString();

    const status = computeMeetingStatus(
      meeting.meetingDate,
      meeting.startTime,
      meeting.endTime,
      refDate,
      refTime
    );

    return NextResponse.json({ meeting: { ...meeting, status } });
  } catch (err: any) {
    console.error("GET /api/meetings/[id] error:", err);
    return NextResponse.json({ error: "Failed to fetch meeting." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden. Only Admin can edit meetings." },
        { status: 403 }
      );
    }

    const existing = await prisma.meeting.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Meeting not found." }, { status: 404 });
    }

    const body = await req.json();
    const { title, description, organizer, roomId, meetingDate, startTime, endTime } = body;

    // Validation
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

    // Check conflict excluding current meeting
    const conflictResult = await checkMeetingConflict({
      roomId,
      meetingDate,
      startTime,
      endTime,
      excludeMeetingId: id,
    });

    if (conflictResult.hasConflict) {
      return NextResponse.json(
        { error: conflictResult.message || "Room conflict detected." },
        { status: 409 }
      );
    }

    const updated = await prisma.meeting.update({
      where: { id },
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        organizer: organizer.trim(),
        roomId,
        meetingDate,
        startTime,
        endTime,
      },
      include: {
        room: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Meeting updated successfully",
      meeting: updated,
    });
  } catch (err: any) {
    console.error("PUT /api/meetings/[id] error:", err);
    return NextResponse.json({ error: "Failed to update meeting." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden. Only Admin can delete meetings." },
        { status: 403 }
      );
    }

    await prisma.meeting.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Meeting deleted successfully",
    });
  } catch (err: any) {
    console.error("DELETE /api/meetings/[id] error:", err);
    return NextResponse.json({ error: "Failed to delete meeting." }, { status: 500 });
  }
}

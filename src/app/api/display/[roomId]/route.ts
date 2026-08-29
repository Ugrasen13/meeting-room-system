import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  computeMeetingStatus,
  getCurrentTimeString,
  getTodayString,
} from "@/lib/meetingStatus";
import { MeetingStatus } from "@/types";

interface Params {
  params: Promise<{ roomId: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { roomId } = await params;
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || getTodayString();
    const time = searchParams.get("time") || getCurrentTimeString();

    // Look up room by id or roomNumber
    const room = await prisma.room.findFirst({
      where: {
        OR: [
          { id: roomId },
          { roomNumber: roomId },
          { roomNumber: `Room ${roomId}` },
          { roomNumber: `R${roomId}` },
        ],
      },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found." }, { status: 404 });
    }

    const meetings = await prisma.meeting.findMany({
      where: {
        roomId: room.id,
        meetingDate: date,
      },
      orderBy: { startTime: "asc" },
    });

    const meetingsWithStatus = meetings.map((m) => {
      const status = computeMeetingStatus(m.meetingDate, m.startTime, m.endTime, date, time);
      return { ...m, status };
    });

    const currentMeeting = meetingsWithStatus.find((m) => m.status === "ONGOING") || null;
    const nextMeeting = meetingsWithStatus.find((m) => m.status === "UPCOMING") || null;

    let roomStatus: MeetingStatus = "AVAILABLE";
    if (currentMeeting) {
      roomStatus = "ONGOING";
    } else if (nextMeeting) {
      roomStatus = "UPCOMING";
    } else if (meetingsWithStatus.length > 0) {
      roomStatus = "COMPLETED";
    }

    return NextResponse.json({
      room,
      date,
      time,
      status: roomStatus,
      currentMeeting,
      nextMeeting,
      schedule: meetingsWithStatus,
    });
  } catch (err: any) {
    console.error("GET /api/display/[roomId] error:", err);
    return NextResponse.json({ error: "Failed to fetch room display." }, { status: 500 });
  }
}

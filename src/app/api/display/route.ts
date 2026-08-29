import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  computeMeetingStatus,
  getCurrentTimeString,
  getTodayString,
} from "@/lib/meetingStatus";
import { MeetingStatus } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate =
      searchParams.get("startDate") ||
      searchParams.get("date") ||
      getTodayString();
    const endDate =
      searchParams.get("endDate") ||
      searchParams.get("toDate") ||
      startDate;
    const time = searchParams.get("time") || getCurrentTimeString();

    // Get all rooms (active rooms first)
    const rooms = await prisma.room.findMany({
      orderBy: { roomNumber: "asc" },
    });

    // Query meetings for date or range
    const meetingWhere: any = {};
    if (startDate === endDate) {
      meetingWhere.meetingDate = startDate;
    } else {
      meetingWhere.meetingDate = {
        gte: startDate,
        lte: endDate,
      };
    }

    const meetings = await prisma.meeting.findMany({
      where: meetingWhere,
      include: {
        room: true,
      },
      orderBy: [{ meetingDate: "asc" }, { startTime: "asc" }],
    });

    // Compute status for all meetings
    const allMeetingsWithStatus = meetings.map((m) => {
      const st = computeMeetingStatus(
        m.meetingDate,
        m.startTime,
        m.endTime,
        startDate,
        time
      );
      return { ...m, status: st };
    });

    // Process each room
    const roomsDisplay = rooms.map((room) => {
      const roomMeetings = allMeetingsWithStatus.filter(
        (m) => m.roomId === room.id
      );

      let currentMeeting: any = null;
      let nextUpcomingMeeting: any = null;
      let lastCompletedMeeting: any = null;
      let roomStatus: MeetingStatus = "AVAILABLE";

      // Find ongoing meeting
      const ongoing = roomMeetings.find((m) => m.status === "ONGOING");
      if (ongoing) {
        currentMeeting = ongoing;
        roomStatus = "ONGOING";
      } else {
        // Find next upcoming
        const upcoming = roomMeetings.filter((m) => m.status === "UPCOMING");
        if (upcoming.length > 0) {
          nextUpcomingMeeting = upcoming[0];
          roomStatus = "UPCOMING";
        } else {
          // If no upcoming and has completed
          const completed = roomMeetings.filter((m) => m.status === "COMPLETED");
          if (completed.length > 0) {
            lastCompletedMeeting = completed[completed.length - 1];
            roomStatus = "COMPLETED";
          } else {
            roomStatus = "AVAILABLE";
          }
        }
      }

      const displayMeeting =
        currentMeeting || nextUpcomingMeeting || lastCompletedMeeting;

      return {
        room,
        status: roomStatus,
        currentMeeting,
        nextMeeting: nextUpcomingMeeting,
        displayMeeting,
        todayMeetings: roomMeetings,
      };
    });

    return NextResponse.json({
      date: startDate,
      startDate,
      endDate,
      time,
      rooms: roomsDisplay,
      meetings: allMeetingsWithStatus,
    });
  } catch (err: any) {
    console.error("GET /api/display error:", err);
    return NextResponse.json(
      { error: "Failed to fetch display data." },
      { status: 500 }
    );
  }
}

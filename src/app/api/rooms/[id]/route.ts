import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        meetings: {
          orderBy: [{ meetingDate: "desc" }, { startTime: "asc" }],
        },
      },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found." }, { status: 404 });
    }

    return NextResponse.json({ room });
  } catch (err: any) {
    console.error("GET /api/rooms/[id] error:", err);
    return NextResponse.json({ error: "Failed to fetch room." }, { status: 500 });
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
        { error: "Forbidden. Only Admin can edit rooms." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { roomName, roomNumber, location, capacity, status } = body;

    const existing = await prisma.room.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Room not found." }, { status: 404 });
    }

    // Check unique room number if changed
    if (roomNumber && roomNumber.trim() !== existing.roomNumber) {
      const duplicate = await prisma.room.findUnique({
        where: { roomNumber: roomNumber.trim() },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: `Room number ${roomNumber} already exists.` },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.room.update({
      where: { id },
      data: {
        roomName: roomName?.trim() ?? existing.roomName,
        roomNumber: roomNumber?.trim() ?? existing.roomNumber,
        location: location?.trim() ?? existing.location,
        capacity: capacity ? parseInt(capacity, 10) : existing.capacity,
        status: status ? (status === "inactive" ? "inactive" : "active") : existing.status,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Room updated successfully",
      room: updated,
    });
  } catch (err: any) {
    console.error("PUT /api/rooms/[id] error:", err);
    return NextResponse.json({ error: "Failed to update room." }, { status: 500 });
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
        { error: "Forbidden. Only Admin can delete rooms." },
        { status: 403 }
      );
    }

    // Check if room has existing meetings (Section 21: Safer approach is mark inactive)
    const meetingCount = await prisma.meeting.count({
      where: { roomId: id },
    });

    if (meetingCount > 0) {
      // Soft-deactivate to preserve historical meetings
      await prisma.room.update({
        where: { id },
        data: { status: "inactive" },
      });

      return NextResponse.json({
        success: true,
        message: `Room has ${meetingCount} associated meetings, so it was set to Inactive to preserve meeting history.`,
        deactivated: true,
      });
    }

    // No meetings, safe to delete physically
    await prisma.room.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Room deleted successfully",
      deleted: true,
    });
  } catch (err: any) {
    console.error("DELETE /api/rooms/[id] error:", err);
    return NextResponse.json({ error: "Failed to delete room." }, { status: 500 });
  }
}

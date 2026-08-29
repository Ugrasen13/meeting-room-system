import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const rooms = await prisma.room.findMany({
      include: {
        _count: {
          select: { meetings: true },
        },
      },
      orderBy: { roomNumber: "asc" },
    });

    return NextResponse.json({ rooms });
  } catch (err: any) {
    console.error("GET /api/rooms error:", err);
    return NextResponse.json({ error: "Failed to fetch rooms." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden. Only Admin can create rooms." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { roomName, roomNumber, location, capacity, status = "active" } = body;

    if (!roomName?.trim()) {
      return NextResponse.json({ error: "Room name is required." }, { status: 400 });
    }
    if (!roomNumber?.trim()) {
      return NextResponse.json({ error: "Room number is required." }, { status: 400 });
    }
    if (!location?.trim()) {
      return NextResponse.json({ error: "Location is required." }, { status: 400 });
    }
    const capNum = parseInt(capacity, 10);
    if (isNaN(capNum) || capNum <= 0) {
      return NextResponse.json({ error: "Valid capacity is required." }, { status: 400 });
    }

    // Check duplicate room number
    const existing = await prisma.room.findUnique({
      where: { roomNumber: roomNumber.trim() },
    });
    if (existing) {
      return NextResponse.json(
        { error: `Room number ${roomNumber} already exists.` },
        { status: 400 }
      );
    }

    const room = await prisma.room.create({
      data: {
        roomName: roomName.trim(),
        roomNumber: roomNumber.trim(),
        location: location.trim(),
        capacity: capNum,
        status: status === "inactive" ? "inactive" : "active",
      },
    });

    return NextResponse.json(
      { success: true, message: "Room created successfully", room },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("POST /api/rooms error:", err);
    return NextResponse.json({ error: "Failed to create room." }, { status: 500 });
  }
}

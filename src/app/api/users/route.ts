import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hashPassword } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden. Admin only." }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        userId: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        _count: {
          select: { meetings: true },
        },
      },
      orderBy: { userId: "asc" },
    });

    return NextResponse.json({ users });
  } catch (err: any) {
    console.error("GET /api/users error:", err);
    return NextResponse.json({ error: "Failed to fetch users." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden. Admin only." }, { status: 403 });
    }

    const body = await req.json();
    const { userId, name, email, password, role = "user", status = "active" } = body;

    if (!userId?.trim() || !name?.trim() || !email?.trim() || !password) {
      return NextResponse.json(
        { error: "User ID, Name, Email, and Password are required." },
        { status: 400 }
      );
    }

    const existingUserId = await prisma.user.findUnique({
      where: { userId: userId.trim().toUpperCase() },
    });
    if (existingUserId) {
      return NextResponse.json({ error: "User ID already exists." }, { status: 400 });
    }

    const existingEmail = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (existingEmail) {
      return NextResponse.json({ error: "Email already exists." }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        userId: userId.trim().toUpperCase(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
        role: role === "admin" ? "admin" : "user",
        status: status === "inactive" ? "inactive" : "active",
      },
      select: {
        id: true,
        userId: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { success: true, message: "User created successfully", user: newUser },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("POST /api/users error:", err);
    return NextResponse.json({ error: "Failed to create user." }, { status: 500 });
  }
}

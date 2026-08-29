import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword, signToken, AUTH_COOKIE_CONFIG } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "User ID/Email and password are required." },
        { status: 400 }
      );
    }

    // Support login by email, userId, or name (e.g. Pradhan, USR001, admin@office.com)
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.trim().toLowerCase() },
          { userId: email.trim().toUpperCase() },
          { userId: email.trim() },
          { name: email.trim() },
        ],
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid User ID or Password" },
        { status: 401 }
      );
    }

    if (user.status !== "active") {
      return NextResponse.json(
        { error: "Your account is inactive. Please contact the administrator." },
        { status: 403 }
      );
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid User ID or Password" },
        { status: 401 }
      );
    }

    const sessionUser = {
      id: user.id,
      userId: user.userId,
      name: user.name,
      email: user.email,
      role: user.role as "admin" | "user",
      status: user.status as "active" | "inactive",
    };

    const token = signToken(sessionUser);

    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      user: sessionUser,
    });

    response.cookies.set(
      AUTH_COOKIE_CONFIG.name,
      token,
      AUTH_COOKIE_CONFIG.options
    );

    return response;
  } catch (err: any) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

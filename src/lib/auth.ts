import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { SessionUser } from "@/types";

const JWT_SECRET = process.env.AUTH_SECRET || "meeting-room-system-super-secret-jwt-key-2026";
const COOKIE_NAME = "mr_auth_token";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: SessionUser): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): SessionUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionUser;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const decoded = verifyToken(token);
    if (!decoded) return null;

    // Verify user still exists and is active in DB
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, userId: true, name: true, email: true, role: true, status: true },
    });

    if (!user || user.status !== "active") return null;

    return {
      id: user.id,
      userId: user.userId,
      name: user.name,
      email: user.email,
      role: user.role as "admin" | "user",
      status: user.status as "active" | "inactive",
    };
  } catch {
    return null;
  }
}

export const AUTH_COOKIE_CONFIG = {
  name: COOKIE_NAME,
  options: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
};

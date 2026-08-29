import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hashPassword, signToken, AUTH_COOKIE_CONFIG } from "@/lib/auth";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const isSelf = currentUser.id === id;
    const isAdmin = currentUser.role === "admin";

    // User can edit themselves; admin can edit any user
    if (!isSelf && !isAdmin) {
      return NextResponse.json(
        { error: "Forbidden. You can only update your own profile." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, email, role, status, password } = body;

    const dataToUpdate: any = {};
    if (name?.trim()) dataToUpdate.name = name.trim();
    if (email?.trim()) dataToUpdate.email = email.trim().toLowerCase();
    if (password) dataToUpdate.passwordHash = await hashPassword(password);

    // Only admins can change roles and statuses
    if (isAdmin) {
      if (role) dataToUpdate.role = role === "admin" ? "admin" : "user";
      if (status) dataToUpdate.status = status === "inactive" ? "inactive" : "active";
    }

    const updated = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        userId: true,
        name: true,
        email: true,
        role: true,
        status: true,
        updatedAt: true,
      },
    });

    const response = NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: updated,
    });

    // If updating currently logged in user, refresh the JWT session cookie with the new name!
    if (isSelf) {
      const refreshedSession = {
        id: updated.id,
        userId: updated.userId,
        name: updated.name,
        email: updated.email,
        role: updated.role as "admin" | "user",
        status: updated.status as "active" | "inactive",
      };
      const newToken = signToken(refreshedSession);
      response.cookies.set(
        AUTH_COOKIE_CONFIG.name,
        newToken,
        AUTH_COOKIE_CONFIG.options
      );
    }

    return response;
  } catch (err: any) {
    console.error("PUT /api/users/[id] error:", err);
    return NextResponse.json({ error: "Failed to update user." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden. Admin only." }, { status: 403 });
    }

    if (currentUser.id === id) {
      return NextResponse.json(
        { error: "You cannot delete your own admin account." },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (err: any) {
    console.error("DELETE /api/users/[id] error:", err);
    return NextResponse.json({ error: "Failed to delete user." }, { status: 500 });
  }
}

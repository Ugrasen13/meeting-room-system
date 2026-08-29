import { prisma } from "./src/lib/prisma";
import bcrypt from "bcryptjs";

async function createPradhan() {
  const passwordHash = await bcrypt.hash("123", 10);

  // Check if pradhan user or email exists
  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { userId: "PRADHAN" },
        { email: "pradhan@office.com" },
        { name: "Pradhan" },
      ],
    },
  });

  if (existing) {
    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: {
        name: "Pradhan",
        userId: "PRADHAN",
        email: "pradhan@office.com",
        passwordHash: passwordHash,
        role: "admin",
        status: "active",
      },
    });
    console.log("Updated Admin user:", updated.name, "with password 123");
  } else {
    const created = await prisma.user.create({
      data: {
        userId: "PRADHAN",
        name: "Pradhan",
        email: "pradhan@office.com",
        passwordHash: passwordHash,
        role: "admin",
        status: "active",
      },
    });
    console.log("Created Admin user:", created.name, "with password 123");
  }

  await prisma.$disconnect();
}

createPradhan().catch(console.error);

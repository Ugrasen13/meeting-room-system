import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Upserting CABS DRDO admin account...");
  const passwordHash = await bcrypt.hash("aew&cmk-ii", 10);

  const user = await prisma.user.upsert({
    where: { email: "cabs.drdo@123" },
    update: {
      name: "CABS DRDO Admin",
      userId: "CABS.DRDO",
      passwordHash: passwordHash,
      role: "admin",
      status: "active",
    },
    create: {
      userId: "CABS.DRDO",
      name: "CABS DRDO Admin",
      email: "cabs.drdo@123",
      passwordHash: passwordHash,
      role: "admin",
      status: "active",
    },
  });

  console.log("CABS DRDO Admin user created/updated successfully:", user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

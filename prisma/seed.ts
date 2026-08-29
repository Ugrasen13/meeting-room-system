import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function main() {
  console.log("Seeding database...");

  // Clean existing records
  await prisma.meeting.deleteMany({});
  await prisma.room.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.setting.deleteMany({});

  const adminPasswordHash = await bcrypt.hash("Admin@123", 10);
  const userPasswordHash = await bcrypt.hash("User@123", 10);

  // 1. Create Users
    const pradhanPasswordHash = await bcrypt.hash("123", 10);
    await prisma.user.create({
      data: {
        userId: "PRADHAN",
        name: "Pradhan",
        email: "pradhan@office.com",
        passwordHash: pradhanPasswordHash,
        role: "admin",
        status: "active",
      },
    });

  const adminUser = await prisma.user.create({
    data: {
      userId: "USR001",
      name: "Rahul Sharma",
      email: "admin@office.com",
      passwordHash: adminPasswordHash,
      role: "admin",
      status: "active",
    },
  });

  const userPriya = await prisma.user.create({
    data: {
      userId: "USR002",
      name: "Priya Patel",
      email: "priya@office.com",
      passwordHash: userPasswordHash,
      role: "user",
      status: "active",
    },
  });

  const userAmit = await prisma.user.create({
    data: {
      userId: "USR003",
      name: "Amit Kumar",
      email: "amit@office.com",
      passwordHash: userPasswordHash,
      role: "user",
      status: "active",
    },
  });

  const userSneha = await prisma.user.create({
    data: {
      userId: "USR004",
      name: "Sneha Verma",
      email: "sneha@office.com",
      passwordHash: userPasswordHash,
      role: "user",
      status: "active",
    },
  });

  console.log("Users created.");

  // 2. Create Rooms
  const room101 = await prisma.room.create({
    data: {
      roomName: "Conference Room A",
      roomNumber: "Room 101",
      location: "1st Floor",
      capacity: 20,
      status: "active",
    },
  });

  const room102 = await prisma.room.create({
    data: {
      roomName: "Conference Room B",
      roomNumber: "Room 102",
      location: "1st Floor",
      capacity: 15,
      status: "active",
    },
  });

  const room103 = await prisma.room.create({
    data: {
      roomName: "Meeting Room C",
      roomNumber: "Room 103",
      location: "2nd Floor",
      capacity: 10,
      status: "active",
    },
  });

  const room104 = await prisma.room.create({
    data: {
      roomName: "Board Room D",
      roomNumber: "Room 104",
      location: "2nd Floor",
      capacity: 25,
      status: "active",
    },
  });

  console.log("Rooms created.");

  // 3. Create Meetings for both Today and the Mockup Dates (2026-08-27 and 2024-08-27)
  const today = getTodayString();
  const datesToSeed = Array.from(new Set([today, "2026-08-27", "2024-08-27"]));

  for (const date of datesToSeed) {
    // Room 101: Client Discussion (14:00 - 15:00)
    await prisma.meeting.create({
      data: {
        title: "Client Discussion",
        description: "Discuss new project requirements and timeline with key client stakeholders.",
        organizer: "Rahul Sharma",
        organizerId: adminUser.id,
        roomId: room101.id,
        meetingDate: date,
        startTime: "14:00",
        endTime: "15:00",
      },
    });

    // Room 101: Team Sync (15:30 - 16:30)
    await prisma.meeting.create({
      data: {
        title: "Team Sync",
        description: "Weekly internal team status review.",
        organizer: "Priya Patel",
        organizerId: userPriya.id,
        roomId: room101.id,
        meetingDate: date,
        startTime: "15:30",
        endTime: "16:30",
      },
    });

    // Room 101: Project Planning (16:30 - 17:30)
    await prisma.meeting.create({
      data: {
        title: "Project Planning",
        description: "Q3 Project planning and milestone roadmap alignment.",
        organizer: "Rahul Sharma",
        organizerId: adminUser.id,
        roomId: room101.id,
        meetingDate: date,
        startTime: "16:30",
        endTime: "17:30",
      },
    });

    // Room 102: Team Meeting (15:00 - 16:00)
    await prisma.meeting.create({
      data: {
        title: "Team Meeting",
        description: "Sprint review and demo of newly developed features.",
        organizer: "Priya Patel",
        organizerId: userPriya.id,
        roomId: room102.id,
        meetingDate: date,
        startTime: "15:00",
        endTime: "16:00",
      },
    });

    // Room 103: HR Meeting (13:00 - 14:00)
    await prisma.meeting.create({
      data: {
        title: "HR Meeting",
        description: "Quarterly employee feedback, benefits, and policy overview.",
        organizer: "Sneha Verma",
        organizerId: userSneha.id,
        roomId: room103.id,
        meetingDate: date,
        startTime: "13:00",
        endTime: "14:00",
      },
    });

    // Room 103: Project Review (14:15 - 15:30)
    await prisma.meeting.create({
      data: {
        title: "Project Review",
        description: "Technical architecture evaluation and risk assessment.",
        organizer: "Amit Kumar",
        organizerId: userAmit.id,
        roomId: room103.id,
        meetingDate: date,
        startTime: "14:15",
        endTime: "15:30",
      },
    });

    // Room 104: Marketing Sync (13:00 - 14:00)
    await prisma.meeting.create({
      data: {
        title: "Marketing Sync",
        description: "Brand campaign planning and social media marketing strategy.",
        organizer: "Rahul Sharma",
        organizerId: adminUser.id,
        roomId: room104.id,
        meetingDate: date,
        startTime: "13:00",
        endTime: "14:00",
      },
    });

    // Room 104: Project Review (16:00 - 17:00)
    await prisma.meeting.create({
      data: {
        title: "Project Review",
        description: "Executive steering committee monthly project status presentation.",
        organizer: "Amit Kumar",
        organizerId: userAmit.id,
        roomId: room104.id,
        meetingDate: date,
        startTime: "16:00",
        endTime: "17:00",
      },
    });
  }

  // 4. Default Office Settings
  await prisma.setting.createMany({
    data: [
      { key: "office_start_time", value: "08:00", description: "Office opening hours" },
      { key: "office_end_time", value: "19:00", description: "Office closing hours" },
      { key: "auto_refresh_seconds", value: "15", description: "Live display polling frequency" },
      { key: "display_banner_text", value: "Welcome to Our Office", description: "Lobby TV footer banner" },
      { key: "room_notice_text", value: "Please keep noise to a minimum. Thank you!", description: "Outside door tablet footer notice" },
    ],
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

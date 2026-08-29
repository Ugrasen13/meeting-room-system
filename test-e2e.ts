import { prisma } from "./src/lib/prisma";
import { checkMeetingConflict, computeMeetingStatus } from "./src/lib/meetingStatus";
import bcrypt from "bcryptjs";

async function runTests() {
  console.log("=========================================");
  console.log("Running Meeting System Verification Tests");
  console.log("=========================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // 1. Password hash verification
  const admin = await prisma.user.findFirst({ where: { role: "admin" } });
  assert(!!admin, "Admin user exists in database");
  if (admin) {
    const isPasswordValid = await bcrypt.compare("Admin@123", admin.passwordHash);
    assert(isPasswordValid, "Admin password hash matches 'Admin@123'");

    const isWrongPasswordInvalid = !(await bcrypt.compare("WrongPassword", admin.passwordHash));
    assert(isWrongPasswordInvalid, "Wrong password rejected");
  }

  // 2. Room Conflict Engine Validation (Section 15, 16, 53)
  const room101 = await prisma.room.findFirst({ where: { roomNumber: "Room 101" } });
  const room102 = await prisma.room.findFirst({ where: { roomNumber: "Room 102" } });
  assert(!!room101 && !!room102, "Rooms 101 and 102 exist");

  if (room101 && room102) {
    const testDate = "2026-08-27";

    // Scenario A: Overlap with existing "Client Discussion" (14:00 - 15:00)
    // Attempting 14:30 - 15:30 on same room and same date
    const conflict1 = await checkMeetingConflict({
      roomId: room101.id,
      meetingDate: testDate,
      startTime: "14:30",
      endTime: "15:30",
    });
    assert(conflict1.hasConflict, "Conflict detected for overlapping booking (14:30 - 15:30 in Room 101)");

    // Scenario B: End time <= Start time (e.g. 15:00 to 14:00)
    const invalidTime = await checkMeetingConflict({
      roomId: room101.id,
      meetingDate: testDate,
      startTime: "15:00",
      endTime: "14:00",
    });
    assert(invalidTime.hasConflict, "Rejected when end time is before start time");

    // Scenario C: Non-overlapping touching boundary (Section 16: 15:00 - 15:30)
    // In Room 101, existing is 14:00 - 15:00 and next is 15:30 - 16:30. 15:00 - 15:30 is touching at boundary!
    const touchingBoundary = await checkMeetingConflict({
      roomId: room101.id,
      meetingDate: testDate,
      startTime: "15:00",
      endTime: "15:30",
    });
    assert(!touchingBoundary.hasConflict, "Allowed when meeting touches exact boundary (15:00 - 15:30)");

    // Scenario D: Different room same time (Room 102 from 14:00 to 15:00)
    const diffRoom = await checkMeetingConflict({
      roomId: room102.id,
      meetingDate: testDate,
      startTime: "14:00",
      endTime: "15:00",
    });
    assert(!diffRoom.hasConflict, "Allowed for different room at same time (Room 102 14:00 - 15:00)");
  }

  // 3. Status Calculation Validation (Section 27 & 28)
  const statusBefore = computeMeetingStatus("2026-08-27", "14:00", "15:00", "2026-08-27", "13:30");
  assert(statusBefore === "UPCOMING", "At 1:30 PM, 2:00-3:00 meeting is UPCOMING");

  const statusDuring = computeMeetingStatus("2026-08-27", "14:00", "15:00", "2026-08-27", "14:35");
  assert(statusDuring === "ONGOING", "At 2:35 PM, 2:00-3:00 meeting is ONGOING");

  const statusAfter = computeMeetingStatus("2026-08-27", "14:00", "15:00", "2026-08-27", "15:30");
  assert(statusAfter === "COMPLETED", "At 3:30 PM, 2:00-3:00 meeting is COMPLETED");

  console.log("\n=========================================");
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log("=========================================\n");

  await prisma.$disconnect();

  if (failed > 0) process.exit(1);
}

runTests().catch((e) => {
  console.error(e);
  process.exit(1);
});

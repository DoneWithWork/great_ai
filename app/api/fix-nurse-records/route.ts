import { db } from "@/db/drizzle";
import { users, nurse } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    // First, get all users with role 'nurse'
    const nurseUsers = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
      })
      .from(users)
      .where(eq(users.role, "nurse"));

    console.log("Total nurse users found:", nurseUsers.length);

    let createdCount = 0;

    // Check each user and create nurse record if it doesn't exist
    for (const user of nurseUsers) {
      try {
        // Check if nurse record already exists
        const existingNurse = await db
          .select()
          .from(nurse)
          .where(eq(nurse.userId, user.id))
          .limit(1);

        if (existingNurse.length === 0) {
          // Create nurse record
          await db.insert(nurse).values({
            userId: user.id,
            active: true,
          });
          createdCount++;
          console.log(
            `Created nurse record for user: ${user.fullName} (${user.id})`
          );
        } else {
          console.log(
            `Nurse record already exists for: ${user.fullName} (${user.id})`
          );
        }
      } catch (error) {
        console.error(`Failed to process user ${user.fullName}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created ${createdCount} nurse records out of ${nurseUsers.length} nurse users`,
      totalNurseUsers: nurseUsers.length,
      recordsCreated: createdCount,
    });
  } catch (error) {
    console.error("Error in fix-nurse-records:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fix nurse records",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

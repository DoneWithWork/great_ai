"use server";

import { db } from "@/lib/db";
import { users, nurse, leaveRequest } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getAdminDashboardData() {
  try {
    const allNurses = await db.query.nurse.findMany({
      with: {
        user: {
          columns: {
            fullName: true,
            email: true,
          },
        },
      },
    });

    const pendingLeaveRequests = await db.query.leaveRequest.findMany({
      where: eq(leaveRequest.approvalStatus, "pending"),
      with: {
        nurse: {
          with: {
            user: {
              columns: {
                fullName: true,
              },
            },
          },
        },
      },
    });

    return { nurses: allNurses, leaveRequests: pendingLeaveRequests };
  } catch (error) {
    console.error("Error fetching admin dashboard data:", error);
    return { error: "Failed to fetch data" };
  }
}

"use server";

import { db } from "@/lib/db";
import { users, leaveRequest } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import * as z from "zod";

export async function getCurrentNurseData() {
  const { userId: clerkId } = auth();

  if (!clerkId) {
    // This should not happen if the user is authenticated, but it's a good practice to check.
    return notFound();
  }

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
      with: {
        nurse: {
          with: {
            rosters: {
              with: {
                shift: true,
              },
              limit: 5,
              orderBy: (roster, { asc }) => [asc(roster.date)],
            },
            leaveRequests: {
              limit: 5,
              orderBy: (leaveRequest, { desc }) => [desc(leaveRequest.submittedAt)],
            },
          },
        },
      },
    });

    if (!user || !user.nurse) {
      return notFound();
    }

    return { nurse: user.nurse, user: { fullName: user.fullName, email: user.email } };
  } catch (error) {
    console.error("Error fetching nurse data:", error);
    // In a real application, you would want to handle this error more gracefully.
    // For now, we'll just return a not found error.
    return notFound();
  }
}

const leaveRequestSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  leaveType: z.string(),
  reason: z.string().optional(),
});

export async function createLeaveRequest(values: z.infer<typeof leaveRequestSchema>) {
  const { userId: clerkId } = auth();

  if (!clerkId) {
    return { error: "User not authenticated" };
  }

  const validatedFields = leaveRequestSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields" };
  }

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
      columns: { id: true },
      with: {
        nurse: {
          columns: { id: true }
        }
      }
    });

    if (!user || !user.nurse) {
      return { error: "Nurse not found" };
    }

    await db.insert(leaveRequest).values({
      nurseId: user.nurse.id,
      startDate: new Date(validatedFields.data.startDate),
      endDate: new Date(validatedFields.data.endDate),
      leaveType: validatedFields.data.leaveType,
      reason: validatedFields.data.reason,
    });

    return { success: "Leave request submitted" };
  } catch (error) {
    console.error("Error creating leave request:", error);
    return { error: "Failed to submit leave request" };
  }
}

export async function getMyLeaveRequests() {
  const { userId: clerkId } = auth();

  if (!clerkId) {
    return notFound();
  }

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
      with: {
        nurse: {
          with: {
            leaveRequests: {
              orderBy: (leaveRequest, { desc }) => [desc(leaveRequest.submittedAt)],
            },
          },
        },
      },
    });

    if (!user || !user.nurse) {
      return notFound();
    }

    return { requests: user.nurse.leaveRequests };
  } catch (error) {
    console.error("Error fetching leave requests:", error);
    return notFound();
  }
}

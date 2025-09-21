"use server";

import { users, nurse, leaveRequest } from "@/db/schema";
import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

export async function getUserLeaveRequestAction() {
    try {
        const user = await currentUser();
        if (!user) {
            return { error: 'No Logged In User' };
        }

        // First get the user to get their nurse ID
        const theUser = await db.query.users.findFirst({
            where: eq(users.id, user.id),
            with: {
                nurse: true
            }
        });

        if (!theUser) return { error: 'User not found' };
        if (!theUser.nurse) return { error: 'Nurse profile not found' };

        // Directly query leave requests using the nurseId
        const leaveRequests = await db.query.leaveRequest.findMany({
            where: eq(leaveRequest.nurseId, theUser.nurse.id)
        });

        return leaveRequests;
    } catch (error) {
        console.error('Error fetching leave requests:', error);
        return { error: 'Failed to fetch leave requests' };
    }
}
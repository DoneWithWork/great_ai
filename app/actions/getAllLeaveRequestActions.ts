"use server";

import { users, nurse, leaveRequest } from "@/db/schema";
import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

export async function getAllLeaveRequestActions() {
    try {
        const user = await currentUser();
        if (!user) {
            return { error: 'No Logged In User' };
        }
        if (user.publicMetadata?.role !== "admin") return { error: 'Unauthorized - Admin access required' };
        const all_request = await db.query.leaveRequest.findMany({
            with: {
                nurse: {
                    with: {
                        user: true
                    }
                }
            }
        });
        return all_request

    } catch (error) {
        console.error('Error fetching leave requests:', error);
        return { error: 'Failed to fetch leave requests' };
    }
}
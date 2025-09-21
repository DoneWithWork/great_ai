"use server";

import { leaveRequest } from "@/db/schema";
import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type ApprovalAction = "approved" | "rejected";

export async function approveLeaveRequestAction(
    requestId: string,
    action: ApprovalAction,
    rejectionReason?: string
) {
    try {
        const user = await currentUser();

        // Check if user is logged in and has admin role
        if (!user || user.publicMetadata?.role !== "admin") {
            return { error: 'Unauthorized - Admin access required' };
        }

        // Validate requestId
        const numericRequestId = parseInt(requestId);
        if (isNaN(numericRequestId)) {
            return { error: 'Invalid request ID' };
        }

        // Check if the leave request exists
        const existingRequest = await db.query.leaveRequest.findFirst({
            where: eq(leaveRequest.id, numericRequestId)
        });

        if (!existingRequest) {
            return { error: 'Leave request not found' };
        }

        // Check if request is already processed
        if (existingRequest.approvalStatus !== "pending") {
            return { error: `Request has already been ${existingRequest.approvalStatus}` };
        }

        // Update the leave request with approval status
        await db
            .update(leaveRequest)
            .set({
                approvalStatus: action,
                reviewedAt: new Date(),
                reason: action === "rejected" ? rejectionReason : null
            })
            .where(eq(leaveRequest.id, numericRequestId));

        // Revalidate any pages that might show this data
        revalidatePath('/admin/leave-requests');
        revalidatePath('/requests'); // nurse page

        return {
            success: true,
            message: `Leave request ${action} successfully`
        };

    } catch (error) {
        console.error('Error updating leave request:', error);
        return { error: 'Failed to update leave request' };
    }
}

// Separate action for bulk approval (optional)
export async function bulkApproveLeaveRequestsAction(
    requestIds: string[],
    action: ApprovalAction,
    rejectionReason?: string
) {
    try {
        const user = await currentUser();

        if (!user || user.publicMetadata?.role !== "admin") {
            return { error: 'Unauthorized - Admin access required' };
        }

        const numericIds = requestIds.map(id => parseInt(id)).filter(id => !isNaN(id));

        if (numericIds.length === 0) {
            return { error: 'No valid request IDs provided' };
        }

        // Update multiple requests
        await db
            .update(leaveRequest)
            .set({
                approvalStatus: action,
                reviewedAt: new Date(),
                reason: action === "rejected" ? rejectionReason : null
            })
            .where(
                // Combine conditions using 'and'
                and(
                    eq(leaveRequest.approvalStatus, "pending"),
                    inArray(leaveRequest.id, numericIds)
                )
            );

        revalidatePath('/admin/leave-requests');
        revalidatePath('/requests');

        return {
            success: true,
            message: `${numericIds.length} leave request(s) ${action} successfully`
        };

    } catch (error) {
        console.error('Error bulk updating leave requests:', error);
        return { error: 'Failed to update leave requests' };
    }
}
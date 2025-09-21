"use server"

import { leaveRequest, users } from "@/db/schema";
import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import z from "zod";

const formSchema = z.object({
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    reason: z.string().min(1, "Reason is required"),
    type: z.enum(["annual", "sick", "unpaid"], {
    })
})
export async function sendLeaveRequestAction(prevState: undefined, values: z.infer<typeof formSchema>) {
    const user = await currentUser();

    if (!user) return { error: 'No Logged In User' }

    const theUser = await db.query.users.findFirst({
        where: eq(users.id, user.id),
        with: {
            nurse: true
        }
    })
    if (!theUser) return { error: 'User not found' }
    if (!theUser.nurse) return { error: 'Nurse profile not found' }

    await db.insert(leaveRequest).values({
        nurseId: theUser.nurse.id,
        startDate: new Date(values.startDate),
        endDate: new Date(values.endDate),
        leaveType: values.type,
        reason: values.reason,
    })
    return { success: true };

}

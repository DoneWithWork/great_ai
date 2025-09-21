'use server'

import { db } from '@/db/drizzle'
import { nurse, users } from '@/db/schema'
import { formSchema } from '@/lib/schemas'
import { auth, clerkClient, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import z from 'zod'

export const completeOnboarding = async (prevState: unknown, values: z.infer<typeof formSchema>) => {
    const { isAuthenticated, userId } = await auth()
    const user = await currentUser();
    if (!isAuthenticated) {
        return { message: 'No Logged In User' }
    }
    console.log(values)
    const newUser = await db.insert(users).values({
        id: userId,
        fullName: values.fullName,
        email: user?.emailAddresses[0].emailAddress ?? '',
        bio: values.bio,
        role: values.role,
    }).returning();

    if (!newUser) {
        return { error: 'Error creating user in database' }
    }
    if (newUser[0].role === "nurse") {
        const newnurse = await db.insert(nurse).values({
            userId: newUser[0].id,
            department: values.department,
            preferredShift: values.preferredShift,
        })
    }
    const client = await clerkClient()


    const res = await client.users.updateUser(userId, {
        publicMetadata: {
            onboardingComplete: true,

        },
    })
    return { message: 'Onboarding complete', role: newUser[0].role }

}
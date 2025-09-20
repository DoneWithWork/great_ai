'use server'

import { db } from '@/db/drizzle'
import { users } from '@/db/schema'
import { formSchema } from '@/lib/schemas'
import { auth, clerkClient, currentUser } from '@clerk/nextjs/server'
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
    }).returning();
    if (!newUser) {
        return { error: 'Error creating user in database' }
    }
    const client = await clerkClient()

    try {
        const res = await client.users.updateUser(userId, {
            publicMetadata: {
                onboardingComplete: true,

            },
        })
        return { message: res.publicMetadata, role: values.role }
    } catch (err) {
        return { error: 'There was an error updating the user metadata.' }
    }
}
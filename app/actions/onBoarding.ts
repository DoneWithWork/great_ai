"use server";

import { db } from "@/db/drizzle";
import { nurse, users } from "@/db/schema";
import { formSchema } from "@/lib/schemas";
import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import z from "zod";

export const completeOnboarding = async (
  prevState: unknown,
  values: z.infer<typeof formSchema>
) => {
  const { isAuthenticated, userId } = await auth();
  const user = await currentUser();
  if (!isAuthenticated) {
    return { message: "No Logged In User" };
  }
  console.log(values);

  // Check if user already exists
  try {
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (existingUser.length > 0) {
      console.log("User already exists:", existingUser[0]);
      return { message: "User already onboarded", role: existingUser[0].role };
    }
  } catch (error) {
    console.error("Error checking existing user:", error);
  }

  try {
    const newUser = await db
      .insert(users)
      .values({
        id: userId,
        fullName: values.fullName,
        email: user?.emailAddresses[0].emailAddress ?? "",
        bio: values.bio,
      })
      .returning();
    if (!newUser) {
      return { error: "Error creating user in database" };
    }
    if (newUser[0].role === "nurse") {
      const newnurse = await db.insert(nurse).values({
        userId: newUser[0].id,
        department: values.department,
        preferredShift: values.preferredShift,
      });
    }
    const client = await clerkClient();

    try {
      const res = await client.users.updateUser(userId, {
        publicMetadata: {
          onboardingComplete: true,
        },
      });
      return { message: res.publicMetadata, role: values.role };
    } catch {
      return { error: "There was an error updating the user metadata." };
    }
  } catch (dbError: unknown) {
    console.error("Database insert error:", dbError);
    const errorMessage =
      dbError instanceof Error ? dbError.message : "Unknown error";
    return { error: `Database error: ${errorMessage}` };
  }
};

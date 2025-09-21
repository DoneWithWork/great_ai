"use server";

import { db } from "@/db/drizzle";
import { users, nurse } from "@/db/schema";
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
        phone: values.phone,
        department: values.department,
        preferredShift: values.preferredShift,
        role: values.role,
      })
      .returning();

    if (!newUser || newUser.length === 0) {
      return { error: "Error creating user in database" };
    }

    console.log("User created successfully:", newUser[0]);

    // If user role is nurse, create a nurse record
    if (values.role === "nurse") {
      try {
        const nurseRecord = await db
          .insert(nurse)
          .values({
            userId: userId,
            active: true,
          })
          .returning();
        console.log("Nurse record created:", nurseRecord[0]);
      } catch (nurseError) {
        console.error("Error creating nurse record:", nurseError);
        // Don't fail the whole onboarding if nurse record creation fails
      }
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

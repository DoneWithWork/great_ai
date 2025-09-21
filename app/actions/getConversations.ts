"use server";

import { chat } from "@/db/schema";
import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

export async function getConversations() {
    const user = await currentUser();
    if (!user) throw new Error("Not authenticated");
    const convos = await db.query.chat.findMany({
        where: eq(chat.userId, user.id),

    });
    if (!convos) return [];
    return convos;
}
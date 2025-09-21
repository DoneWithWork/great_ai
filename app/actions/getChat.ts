"use server";

import { chat } from "@/db/schema";
import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";

export async function getChatHistory(conversationId: string) {
    const user = await currentUser();
    if (!user) throw new Error("Not authenticated");
    const convo = await db.query.chat.findFirst({
        where: and(eq(chat.id, Number(conversationId)), eq(chat.userId, user.id)),
        with: {
            messages: true
        }
    });
    if (!convo) return [];
    return convo.messages;
}
import { chat } from "@/db/schema";
import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
export async function GET() {

    const user = await currentUser();
    if (!user) throw new Error("Not authenticated");
    const convos = await db.query.chat.findMany({
        where: eq(chat.userId, user.id),

    });
    if (!convos) return [];
    return NextResponse.json(convos);
}
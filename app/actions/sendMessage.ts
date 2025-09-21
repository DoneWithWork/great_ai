"use server"

import { chat, message as messageModel, users } from "@/db/schema";
import { client, modelId } from "@/lib/aws";
import { db } from "@/lib/db";
import { ConverseStreamCommand, Message } from "@aws-sdk/client-bedrock-runtime";
import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

const additionalParameters = {
    maxTokens: 400,
    temperature: 0.5
};
export async function sendMessageAction(conversationId: string | null, message: string) {
    const user = await currentUser();
    if (!user) return { success: false, message: "Not authenticated" }
    const dbUser = await db.query.users.findFirst({
        where: eq(users.id, user.id)
    })
    if (!dbUser) return { success: false, message: "User not found in db" }
    let chatId;
    if (!conversationId) {
        const newChat = await db.insert(chat).values({
            userId: user.id,
        }).returning();
        chatId = newChat[0].id;
    } else {
        const existingChat = await db.query.chat.findFirst({
            where: eq(chat.id, Number(conversationId)),
            with: {
                messages: true
            }
        })
        if (!existingChat) return { success: false, message: "Conversation not found" }
        if (existingChat.userId !== user.id) return { success: false, message: "Not your conversation" }
        chatId = existingChat.id;
        // previousMessages = existingChat.messages.map(m => ({
        //     role: m.isAssistant ? "assistant" : "user",
        //     content: [{ text: m.content }]
        // } as Message));

    }
    const conversation = [
        {
            role: "user",
            content: [{ text: message }]
        }
        // , ...previousMessages.slice(-10)
    ] as Message[];
    const response = await client.send(
        new ConverseStreamCommand({ modelId: modelId, messages: conversation, inferenceConfig: additionalParameters }),
    );

    let fullText = ""
    if (response.stream) {
        for await (const event of response.stream) {
            if (event.contentBlockDelta) {
                const chunkText = event.contentBlockDelta.delta?.text || "";
                fullText += chunkText;
            }
        }

    }
    if (!fullText) return { success: false, message: "No response from model" }
    console.log(fullText);
    await db.insert(messageModel).values({
        userId: user.id,
        chatId: chatId,
        content: message,
        isAssistant: false,
    })
    await db.insert(messageModel).values({
        userId: user?.id,
        chatId: chatId,
        content: fullText,
        isAssistant: true,
    })
    return { success: true, message: fullText }
}
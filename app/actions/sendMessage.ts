"use server"
import { chat, message as messageModel, users } from "@/db/schema";
import { client, modelId } from "@/lib/aws";
import { db } from "@/lib/db";
import { tool_config } from "@/lib/tools";
import { ConverseStreamCommand, Message } from "@aws-sdk/client-bedrock-runtime";
import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

const additionalParameters = {
    maxTokens: 400,
    temperature: 0.5,
    topP: 0.9
};

export async function sendMessageAction(conversationId: string | null, message: string) {
    const user = await currentUser();
    if (!user) return { success: false, message: "Not authenticated" }

    const dbUser = await db.query.users.findFirst({
        where: eq(users.id, user.id)
    })
    if (!dbUser) return { success: false, message: "User not found in db" }

    let chatId;
    let previousMessages: Message[] = [];

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
        previousMessages = existingChat.messages
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
            .slice(-10)
            .map(m => ({
                role: m.isAssistant ? "assistant" : "user",
                content: [{ text: m.content }]
            } as Message));
    }

    // Add system message to encourage tool usage
    const systemMessage = {
        role: "user",
        content: [{
            text: "You are a helpful AI assistant. You have access to the following tool. YOU MUST USE the tool when the user asks for it and provide relevant parameters. You do not have access to any other system"
        }]
    } as Message;

    const conversation = [
        systemMessage,
        ...previousMessages,
        {
            role: "user",
            content: [{ text: message }]
        }
    ] as Message[];

    const response = await client.send(
        new ConverseStreamCommand({
            modelId: modelId, // Should be something like "mistral.mistral-large-2407-v1:0"
            messages: conversation,
            inferenceConfig: additionalParameters,
            toolConfig: tool_config
        }),
    );

    let fullText = "";

    if (response.stream) {
        for await (const event of response.stream) {
            console.log(JSON.stringify(event, null, 2));

            // Handle text content
            if (event.contentBlockDelta?.delta?.text) {
                const chunkText = event.contentBlockDelta.delta.text;
                fullText += chunkText;
            }

        }
    }



    // Save user message
    await db.insert(messageModel).values({
        userId: user.id,
        chatId: chatId,
        content: message,
        isAssistant: false,
    })

    // Save assistant response
    await db.insert(messageModel).values({
        userId: user.id,
        chatId: chatId,
        content: fullText,
        isAssistant: true,
    })

    return { success: true, message: fullText }
}
"use server";

import { chat, message as messageModel } from "@/db/schema";
import { client, modelId } from "@/lib/aws";
import { db } from "@/lib/db";
import { ConverseStreamCommand, Message } from "@aws-sdk/client-bedrock-runtime";
import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

const additionalParameters = {
    maxTokens: 400,
    temperature: 0.5,
};

export async function POST(request: NextRequest) {
    const { conversationId, message } = await request.json();
    const user = await currentUser();
    if (!user) {
        return NextResponse.json(
            { success: false, message: "Not authenticated" },
            { status: 401 }
        );
    }

    let previousMessages: Message[] = [];
    let chatId: number;

    if (!conversationId) {
        const newChat = await db
            .insert(chat)
            .values({ userId: user.id, title: new Date().toLocaleDateString() })
            .returning();
        chatId = newChat[0].id;
    } else {
        const existingChat = await db.query.chat.findFirst({
            where: eq(chat.id, Number(conversationId)),
            with: { messages: true },
        });
        if (!existingChat) {
            return NextResponse.json(
                { success: false, message: "Conversation not found" },
                { status: 404 }
            );
        }
        if (existingChat.userId !== user.id) {
            return NextResponse.json(
                { success: false, message: "Not your conversation" },
                { status: 403 }
            );
        }
        chatId = existingChat.id;
        // previousMessages = existingChat.messages.map(
        //     (m) =>
        //     ({
        //         role: m.isAssistant ? "assistant" : "user",
        //         content: [{ text: m.content }],
        //     } as Message)
        // );
    }

    const conversation = [
        { role: "user", content: [{ text: message }] },
        // ...previousMessages.slice(-10),
    ] as Message[];

    const command = new ConverseStreamCommand({
        modelId,
        messages: conversation,
        inferenceConfig: additionalParameters,
    });

    const res = await client.send(command);

    let fullText = "";

    // SSE stream
    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();

            // Save user message right away
            await db.insert(messageModel).values({
                userId: user.id,
                chatId,
                content: message,
                isAssistant: false,
            });

            if (res.stream) {
                try {
                    for await (const event of res.stream) {
                        if (event.contentBlockDelta) {
                            const chunkText = event.contentBlockDelta.delta?.text ?? "";
                            if (chunkText) {
                                fullText += chunkText;
                                console.log(chunkText)
                                controller.enqueue(encoder.encode(`data: ${chunkText}\n\n`));
                            }
                        }
                        if (event.messageStop) {
                            controller.enqueue(encoder.encode("data: [[END]]\n\n"));
                        }
                        if (event.modelStreamErrorException) {
                            controller.enqueue(encoder.encode(`data: [[ERROR]] ${event.modelStreamErrorException.message}\n\n`));
                        }

                    }
                } finally {
                    // Save assistant message when stream ends
                    if (fullText) {
                        await db.insert(messageModel).values({
                            userId: user.id, // or use a system/assistant id
                            chatId,
                            content: fullText,
                            isAssistant: true,
                        });
                    }
                    controller.close();
                }
            }
        },
    });

    return new NextResponse(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
            "X-Chat-Id": !conversationId ? String(chatId) : "",
        },
    });
}

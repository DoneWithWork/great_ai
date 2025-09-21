import React from "react";
import ChatPage from "../page";

export default async function Chat({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  return <ChatPage conversationId={conversationId} />;
}

"use client";
import ChatArea from "@/components/ui/chat";
import { Chat, useChatContext } from "@/lib/chatprovider";
import { useChat } from "@/lib/use-chat";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function ChatPage({
  conversationId,
}: {
  conversationId?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  // Get active conversation ID from URL
  const activeConversationId = pathname.split("/").pop() || null;
  const { messages, sendMessage, loading, gettingChatHistory } =
    useChat(conversationId);

  const handleSelectConversation = (conversationId: string) => {
    router.push(`/nurse/chat/${conversationId}`);
  };
  const { chats } = useChatContext();

  const handleSendMessage = (text: string) => {
    if (!activeConversationId || !text.trim()) return;
    sendMessage(text);
  };

  return (
    <>
      <div className="mb-4 ">
        <h1 className="text-3xl font-bold mb-2">Chat With Roster</h1>
        <p className="text-sm text-gray-300 mb-2">
          Request leave, view schedule or plan ahead for holidays.
        </p>
      </div>

      <div className="flex h-screen gap-4">
        {/* Sidebar */}
        <div className="w-80 flex flex-col bg-blue-400/30 backdrop-blur-lg rounded-xl p-4 shadow-lg">
          <h2 className="text-xl font-bold mb-4">Conversations</h2>

          <button
            onClick={() => router.push("/nurse/chat")}
            className="mb-4 py-2 px-3 cursor-pointer bg-white/30 rbackdrop-blur rounded-lg hover:bg-white/40 transition"
          >
            + New Chat
          </button>

          <div className="flex-1 flex flex-col overflow-y-auto space-y-2">
            {chats.map((conv: Chat) => (
              <Link
                href={`/nurse/chat/${conv.id}`}
                key={conv.id}
                className={`p-2 rounded-lg cursor-pointer transition-colors ${
                  parseInt(conv.id) === parseInt(activeConversationId || "0")
                    ? "bg-blue-400/40 font-semibold"
                    : "hover:bg-white/30"
                }`}
                onClick={() => handleSelectConversation(conv.id)}
              >
                {conv.title}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex-1 flex">
          <ChatArea
            gettingChatHistory={gettingChatHistory}
            messages={messages}
            loading={loading}
            handleSendMessage={handleSendMessage}
          />
        </div>
      </div>
    </>
  );
}

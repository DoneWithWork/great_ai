"use client";
import { useChat } from "@/lib/use-chat";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Bandage, Computer, Loader2 } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";

type Props = {
  messages: { role: string; content: string }[];
  loading: boolean;
  handleSendMessage: (message: string) => void;
  gettingChatHistory: boolean;
};
export default function ChatArea({
  messages,
  handleSendMessage,
  gettingChatHistory,
}: Props) {
  const user = useUser();
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();
  const { replacement } = useChat();
  useEffect(() => {
    if (!gettingChatHistory) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, gettingChatHistory]);
  useEffect(() => {
    console.log("gettingChatHistory changed: ", gettingChatHistory);
    console.log(replacement.current, gettingChatHistory);
  }, [gettingChatHistory, replacement]);
  return (
    <div className="flex-1 flex flex-col relative bg-blue-400/30 backdrop-blur-lg rounded-xl p-4 shadow-lg">
      {/* Messages */}
      <div className="flex-1 p-3 rounded-xl space-y-5 flex flex-col overflow-y-scroll h-full  max-h-[550px]">
        {gettingChatHistory ? (
          <div className="h-full flex flex-col justify-center items-center">
            <p className="text-gray-200 text-3xl text-center flex flex-row gap-3">
              <Loader2
                className="animate-spin mx-auto mb-2 size-10"
                size={40}
              />
              <span>Loading chat...</span>
            </p>
          </div>
        ) : // inside your map:
        messages.length === 0 && pathname == "/nurse/chat" ? (
          <div className="w-full flex flex-col justify-center items-center h-full">
            <p className=" text-3xl">
              Ready to begin{" "}
              <span className="font-semibold">{user.user?.fullName}</span>?
            </p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <motion.div
              key={index}
              style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <div
                className={`p-2 rounded-lg max-w-[70%] flex flex-row items-center gap-3 ${
                  msg.role === "user"
                    ? "text-black self-end"
                    : "text-black self-start"
                }`}
              >
                <div>
                  {msg.role === "user" ? (
                    <Bandage size={20} className="size-6 text-yellow-400 " />
                  ) : (
                    <Computer size={20} className="size-6" />
                  )}
                </div>
                <ReactMarkdown className="prose bg-white/20 px-4 py-2 rounded-xl text-black">
                  {msg.content}
                </ReactMarkdown>
              </div>
              <div ref={bottomRef} />
            </motion.div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="mt-4 ">
        <input
          type="text"
          placeholder="Type Away..."
          className="w-full p-3 bg-white/30 backdrop-blur rounded-lg border border-transparent focus:outline-none relative z-10"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSendMessage(e.currentTarget.value);
              e.currentTarget.value = "";
            }
          }}
        />
        <span className="absolute inset-0 rounded-lg border-2 border-blue-400 animate-border z-0 pointer-events-none"></span>
      </div>
    </div>
  );
}

"use client";
import { getChatHistory } from "@/app/actions/getChat";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useChatContext } from "./chatprovider";

export function useChat(conversationId?: string) {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [gettingChatHistory, setGettingChatHistory] = useState(true);
  const { chats, setChats } = useChatContext();

  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  useEffect(() => {
    const fetchConversations = async () => {
      const res = await fetch("/api/getConvos");
      if (!res.ok) return;
      const data = await res.json();
      setChats(data);
    };
    fetchConversations();
  }, [setChats]);
  useEffect(() => {
    let cancelled = false;
    if (!conversationId || messages.length == 0) {
      setGettingChatHistory(false);
      setMessages([]);
      return;
    }
    const fetchHistory = async () => {
      setGettingChatHistory(true);
      try {
        const messages = conversationId
          ? await getChatHistory(conversationId)
          : [];
        const properlyFormatted = messages.map((m) => ({
          role: m.isAssistant ? "assistant" : "user",
          content: m.content,
        }));

        if (!cancelled) {
          startTransition(() => {
            setMessages(properlyFormatted);
          });
        }
      } finally {
        if (!cancelled) {
          setGettingChatHistory(false);
        }
      }
    };

    fetchHistory();

    return () => {
      cancelled = true;
    };
  }, [conversationId, messages.length]);

  async function sendMessage(message: string) {
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: message }]);

    const res = await fetch("/api/sendMessage", {
      method: "POST",
      body: JSON.stringify({ conversationId, message }),
      headers: { "Content-Type": "application/json" },
    });

    const newChatId = res.headers.get("X-Chat-Id");
    if (newChatId && newChatId?.length > 0) {
      console.log("New chat created with ID:", newChatId);
      router.push(`/nurse/chat/${newChatId}`);
      conversationId = newChatId;
    }

    // If no conversationId yet, update URL with the new one
    if (!conversationId && newChatId) {
      router.replace(`/nurse/chat/${newChatId}`);
    }

    if (!res.body) {
      setLoading(false);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let assistantMsg = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      chunk
        .split("\n\n")
        .filter(Boolean)
        .forEach((line) => {
          if (line.startsWith("data: ")) {
            const data = line.replace("data: ", "");
            if (data === "[[END]]") {
              return;
            } else if (!data.startsWith("[[ERROR]]")) {
              assistantMsg += data;
              setMessages((prev) => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                if (last?.role === "assistant") {
                  last.content = assistantMsg;
                } else {
                  copy.push({ role: "assistant", content: assistantMsg });
                }
                return copy;
              });
            }
          }
        });
    }

    setLoading(false);
  }

  return {
    messages,
    sendMessage,
    loading,
    gettingChatHistory,
    setGettingChatHistory,
  };
}

"use client";
import { getChatHistory } from "@/app/actions/getChat";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { useChatContext } from "./chatprovider";

export function useChat(conversationId?: string) {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [gettingChatHistory, setGettingChatHistory] = useState(false);
  const { chats, setChats } = useChatContext();

  const [isPending, startTransition] = useTransition();
  const replacement = useRef(false);
  const fetchConversations = async () => {
    const res = await fetch("/api/getConvos", {
      method: "GET",
    });
    if (!res.ok) return;
    const data = await res.json();
    setChats(data);
  };
  useEffect(() => {
    fetchConversations();
  }, [setChats]);

  useEffect(() => {
    let cancelled = false;

    // If no conversationId, just clear messages and don't show loading
    if (!conversationId) {
      setGettingChatHistory(false);
      setMessages([]);
      return;
    }

    const fetchHistory = async () => {
      setGettingChatHistory(true);
      try {
        const messages = await getChatHistory(conversationId);
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
    console.log(conversationId);
    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  async function sendMessage(message: string) {
    // Add user message immediately - no loading state
    setMessages((prev) => [...prev, { role: "user", content: message }]);

    try {
      const res = await fetch("/api/sendMessage", {
        method: "POST",
        body: JSON.stringify({ conversationId, message }),
        headers: { "Content-Type": "application/json" },
      });

      const newChatId = res.headers.get("X-Chat-Id");
      if (newChatId && newChatId?.length > 0) {
        replacement.current = true;
        console.log("New chat created with ID:", newChatId);
        fetchConversations();
        window.history.replaceState(null, "", `/nurse/chat/${newChatId}`);
      } else {
        replacement.current = false;
      }

      if (!res.body) {
        return;
      }

      // Add empty assistant message to show it's "typing"
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

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
    } catch (error) {
      console.error("Error sending message:", error);
      // Optionally show error state or remove the user message
    }
  }

  return {
    messages,
    sendMessage,
    loading,
    gettingChatHistory,
    setGettingChatHistory,
    replacement,
  };
}

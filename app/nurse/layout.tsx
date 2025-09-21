"use client";
import Sidebar from "@/components/shared/sidebar";
import { ChatProvider } from "@/lib/chatprovider";
import { SidebarClose, SidebarOpen } from "lucide-react";
import { useState } from "react";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-transparent">
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-0"
        } transition-width duration-300`}
      >
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden h-screen ">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="size-8  ml-5 mt-4 z-50 flex flex-col items-center justify-center bg-white/30 backdrop-blur-lg rounded-lg shadow-lg hover:bg-white/40 transition"
        >
          {sidebarOpen ? (
            <SidebarClose size={20} className="size-5" />
          ) : (
            <SidebarOpen size={20} className="size-5" />
          )}
        </button>
        <main className="flex-1 flex flex-col p-2 sm:p-6 md:p-8 overflow-y-hidden">
          <ChatProvider> {children}</ChatProvider>
        </main>
      </div>
    </div>
  );
}

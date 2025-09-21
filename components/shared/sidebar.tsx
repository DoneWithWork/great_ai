"use client";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { Dispatch, SetStateAction } from "react";

const navItems = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Roster", href: "/roster" },
  { name: "Requests", href: "/requests" },
  { name: "Chat", href: "/chat" },
];

export default function Sidebar({
  isOpen,
}: {
  isOpen?: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <aside
        className={`absolute top-0 left-0 h-full w-64 p-4 mx-2  glass-card flex flex-col transition-transform duration-300 z-40 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center mb-8">
          <h1 className="text-2xl font-bold">Nurse Roster</h1>
        </div>
        <div className="flex-1 flex flex-col justify-between">
          <nav>
            <ul>
              {navItems.map((item) => (
                <li key={item.name}>
                  <Link
                    href={`/nurse${item.href}`}
                    className="block p-2 rounded-lg hover:bg-white/20"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* User profile and logout section */}
          <div className="mt-auto pt-4 border-t border-white/20">
            <div className="flex items-center gap-3 p-2">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-10 w-10",
                    userButtonPopoverFooter: "hidden",
                  },
                }}
              />
              <span className="text-sm text-white/80">Profile & Settings</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

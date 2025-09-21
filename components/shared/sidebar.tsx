"use client";
import Link from "next/link";
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
        </div>
      </aside>
    </div>
  );
}

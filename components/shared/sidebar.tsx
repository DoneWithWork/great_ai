"use client";

import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";

type SidebarProps = {
  isOpen?: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const { user } = useUser();

  const role: string =
    typeof user?.publicMetadata?.role === "string"
      ? user.publicMetadata.role
      : "nurse";

  const navItems =
    role === "admin"
      ? [
          { name: "Dashboard", href: "/admin/dashboard" },
          { name: "Requests", href: "/admin/requests" },
          { name: "Roster", href: "/admin/roster" },
          { name: "Chat", href: "/admin/chat" },
        ]
      : [
          { name: "Dashboard", href: "/nurse/dashboard" },
          { name: "Roster", href: "/nurse/roster" },
          { name: "Requests", href: "/nurse/requests" },
          { name: "Chat", href: "/nurse/chat" },
        ];

  return (
    <aside
      className={`absolute top-0 left-0 h-full w-64 p-4 bg-[#1e293b]/80 backdrop-blur-lg border border-[#334155] flex flex-col transition-transform duration-300 z-40 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-cyan-400">
          {role === "admin" ? "Admin Panel" : "Nurse Portal"}
        </h1>
        <span
          className={`text-sm px-2 py-1 rounded-md ${
            role === "admin"
              ? "bg-red-500 text-black"
              : "bg-green-500 text-black"
          } font-semibold`}
        >
          {role?.toUpperCase() || "NURSE"}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto">
        <ul className="flex flex-col gap-2">
          {navItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className="block p-2 rounded-lg text-gray-100 hover:bg-cyan-500/30 transition"
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <UserButton />
      <div className="mt-auto text-gray-400 text-sm text-center py-4">
        &copy; {new Date().getFullYear()} RostalQ
      </div>
    </aside>
  );
}

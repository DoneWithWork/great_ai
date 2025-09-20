import Link from "next/link";

const navItems = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Roster", href: "/roster" },
  { name: "Requests", href: "/requests" },
];

export default function Sidebar() {
  return (
    <aside className="w-64 p-4 glass-card mx-4 flex flex-col">
      <div className="flex items-center mb-8">
        <h1 className="text-2xl font-bold">Nurse Roster</h1>
      </div>
      <div className="flex-1 flex flex-col justify-between ">
        <nav className="">
          <ul>
            {navItems.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
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
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  ["/", "Dashboard"],
  ["/settings", "Settings"],
  ["/campaigns", "Campaigns"],
  ["/accounts", "Accounts"],
  ["/logs", "Logs"],
  ["/blacklist", "Blacklist"],
];

export function Nav() {
  const path = usePathname();
  const router = useRouter();

  function logout() {
    localStorage.removeItem("token");
    router.push("/login");
  }

  return (
    <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
      <div className="flex gap-6">
        <span className="font-semibold">TG Growth</span>
        <nav className="flex gap-4 text-sm">
          {links.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className={
                path === href
                  ? "text-zinc-900 dark:text-white"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400"
              }
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
      <button type="button" onClick={logout} className="text-sm text-zinc-500 underline">
        Log out
      </button>
    </header>
  );
}

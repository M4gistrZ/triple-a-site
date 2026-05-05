"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { useTheme } from "./ThemeProvider";
import { Sun, Moon } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Дашборд" },
  { href: "/projects", label: "Проекты" },
];

export function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();

  if (!user) return null;

  return (
    <nav className="border-b border-[var(--border)] bg-[var(--surface)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-lg font-bold text-[var(--accent)]">
              Triple-A
            </Link>
            <div className="flex gap-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm transition-colors ${
                    pathname === item.href
                      ? "text-[var(--text)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-md hover:bg-[var(--bg-hover)] transition-colors"
              title={theme === "light" ? "Темная тема" : "Светлая тема"}
            >
              {theme === "light" ? (
                <Moon className="w-4 h-4 text-[var(--text-muted)]" />
              ) : (
                <Sun className="w-4 h-4 text-[var(--text-muted)]" />
              )}
            </button>
            <span className="text-sm text-[var(--text-muted)]">{user.nickname}</span>
            <button
              onClick={logout}
              className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            >
              Выйти
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

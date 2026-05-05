"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { useSidebar } from "./SidebarProvider";
import {
  LayoutDashboard,
  FolderOpen,
  Users,
  Settings,
  Leaf,
  MessageSquare,
  Image,
  ChevronLeft,
  ChevronRight,
  MessagesSquare,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Дашборд", icon: LayoutDashboard },
  { href: "/projects", label: "Проекты", icon: FolderOpen },
  { href: "/posts", label: "Посты", icon: MessageSquare },
  { href: "/messenger", label: "Мессенджер", icon: MessagesSquare },
  { href: "/gallery", label: "Галерея", icon: Image },
  { href: "/members", label: "Участники", icon: Users },
  { href: "/settings", label: "Настройки", icon: Settings },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const { collapsed, toggleCollapsed } = useSidebar();

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-stone-50 border-r border-stone-200 flex flex-col transition-all duration-200 z-40 ${
        collapsed ? "w-16" : "w-56"
      }`}
    >
      <div className="p-4 border-b border-stone-200 flex items-center justify-between">
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-green-600" />
            <span className="font-bold text-pink-600">Triple-A</span>
          </div>
        ) : (
          <Leaf className="w-5 h-5 text-green-600 mx-auto" />
        )}
        <button
          onClick={toggleCollapsed}
          className="p-1 hover:bg-stone-200 rounded transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-stone-500" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-stone-500" />
          )}
        </button>
      </div>

      <nav className="flex-1 py-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 mx-2 my-1 px-3 py-2 rounded-md text-sm transition-colors ${
                active
                  ? "bg-pink-50 text-pink-700 font-medium"
                  : "text-stone-600 hover:bg-stone-200"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-stone-200">
        {!collapsed ? (
          <div className="space-y-2">
            {user && (
              <Link
                href={`/profile/${user.id}`}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-stone-600 hover:bg-stone-200 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 text-xs font-bold">
                  {user.nickname.charAt(0).toUpperCase()}
                </div>
                <span className="truncate">{user.nickname}</span>
              </Link>
            )}
            <button
              onClick={logout}
              className="w-full text-left px-3 py-2 text-sm text-stone-500 hover:bg-stone-200 rounded-md transition-colors"
            >
              Выйти
            </button>
          </div>
        ) : (
          <button
            onClick={logout}
            className="w-full flex justify-center py-2 text-xs text-stone-400 hover:bg-stone-200 rounded-md transition-colors"
            title="Выйти"
          >
            →
          </button>
        )}
      </div>
    </aside>
  );
}

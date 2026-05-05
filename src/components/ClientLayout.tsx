"use client";

import { useAuth } from "@/components/AuthProvider";
import { Sidebar } from "@/components/Sidebar";
import { useSidebar } from "@/components/SidebarProvider";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { collapsed } = useSidebar();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-text-muted">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {user && <Sidebar />}
      <main
        className={`flex-1 transition-all duration-200 ${
          user ? (collapsed ? "ml-16" : "ml-56") : ""
        }`}
      >
        {children}
      </main>
    </div>
  );
}

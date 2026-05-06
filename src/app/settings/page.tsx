"use client";

import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/components/AuthProvider";
import { Sun, Moon, Shield } from "lucide-react";
import { useState } from "react";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { user, loading } = useAuth();
  const [adminPassword, setAdminPassword] = useState("");
  const [promoting, setPromoting] = useState(false);
  const [promoteError, setPromoteError] = useState("");
  const [promoteSuccess, setPromoteSuccess] = useState(false);

  const handlePromote = async () => {
    if (!adminPassword) return;
    setPromoting(true);
    setPromoteError("");
    setPromoteSuccess(false);

    const res = await fetch("/api/auth/promote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: adminPassword }),
    });

    if (res.ok) {
      setPromoteSuccess(true);
      setAdminPassword("");
    } else {
      const data = await res.json();
      setPromoteError(data.error || "Ошибка");
    }
    setPromoting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-text-muted">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6 text-text">Настройки</h1>

      <div className="bg-surface-elevated border border-border rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 text-text">Внешний вид</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-text">Тема оформления</p>
            <p className="text-sm text-text-muted mt-1">
              Переключение между светлой и темной темой
            </p>
          </div>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-4 py-2 bg-bg-hover border border-border rounded-md hover:bg-bg-hover/80 transition-colors"
          >
            {theme === "light" ? (
              <>
                <Moon className="w-4 h-4 text-text" />
                <span className="text-text">Темная</span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 text-text" />
                <span className="text-text">Светлая</span>
              </>
            )}
          </button>
        </div>
      </div>

      {user?.role !== "admin" && (
        <div className="bg-surface-elevated border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-text flex items-center gap-2">
            <Shield className="w-4 h-4 text-pink" />
            Стать админом
          </h2>
          <p className="text-sm text-text-muted mb-4">
            Введите пароль администратора для получения прав
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Пароль администратора"
              className="flex-1 px-3 py-2 bg-bg border border-border rounded-md text-sm text-text focus:outline-none focus:border-green"
              onKeyDown={(e) => {
                if (e.key === "Enter") handlePromote();
              }}
            />
            <button
              onClick={handlePromote}
              disabled={promoting || !adminPassword}
              className="px-4 py-2 bg-pink hover:bg-pink-hover text-white rounded-md text-sm transition-colors disabled:opacity-50"
            >
              {promoting ? "..." : "Получить"}
            </button>
          </div>
          {promoteError && (
            <p className="text-xs text-pink mt-2">{promoteError}</p>
          )}
          {promoteSuccess && (
            <p className="text-xs text-green mt-2">Теперь вы админ! Обновите страницу.</p>
          )}
        </div>
      )}

      {user?.role === "admin" && (
        <div className="bg-surface-elevated border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-text flex items-center gap-2">
            <Shield className="w-4 h-4 text-pink" />
            Админские права
          </h2>
          <p className="text-sm text-green">У вас есть права администратора</p>
        </div>
      )}
    </div>
  );
}

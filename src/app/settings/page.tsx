"use client";

import { useTheme } from "@/components/ThemeProvider";
import { Sun, Moon } from "lucide-react";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6 text-text">Настройки</h1>

      <div className="bg-surface-elevated border border-border rounded-lg p-6">
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
    </div>
  );
}

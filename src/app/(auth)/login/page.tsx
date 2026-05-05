"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import { Leaf } from "lucide-react";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await login(nickname, password);
      } else {
        await register(nickname, password);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-8 bg-bg-elevated border border-border rounded-lg">
        <div className="flex justify-center mb-4">
          <Leaf className="w-10 h-10 text-green" />
        </div>
        <h1 className="text-2xl font-bold text-center mb-1 text-pink">
          Triple-A
        </h1>
        <p className="text-text-muted text-center text-sm mb-6">
          {isLogin ? "Войти в систему" : "Создать аккаунт"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="nickname"
              className="block text-sm font-medium text-text-muted mb-1"
            >
              Ник
            </label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full px-3 py-2 bg-bg border border-border rounded-md text-text focus:outline-none focus:border-pink"
              placeholder="Ваш никнейм"
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-text-muted mb-1"
            >
              Пароль
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-bg border border-border rounded-md text-text focus:outline-none focus:border-pink"
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p className="text-sm text-pink">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-pink hover:bg-pink-hover text-white rounded-md transition-colors disabled:opacity-50"
          >
            {loading ? "Загрузка..." : isLogin ? "Войти" : "Регистрация"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-text-muted">
          {isLogin ? "Нет аккаунта? " : "Уже есть аккаунт? "}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
            }}
            className="text-green hover:underline"
          >
            {isLogin ? "Зарегистрироваться" : "Войти"}
          </button>
        </p>

        <p className="mt-6 text-center text-xs text-text-muted">
          <Link href="/" className="hover:text-pink transition-colors">
            На главную
          </Link>
        </p>
      </div>
    </div>
  );
}

import Link from "next/link";
import { Leaf } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <Leaf className="w-16 h-16 text-green" />
        </div>
        <h1 className="text-5xl font-bold text-pink mb-3">Triple-A</h1>
        <p className="text-text-muted text-lg mb-8">
          Внутренний портал организации
        </p>
        <Link
          href="/login"
          className="inline-block px-6 py-2 bg-pink hover:bg-pink-hover text-white rounded-md transition-colors"
        >
          Войти
        </Link>
      </div>
    </div>
  );
}

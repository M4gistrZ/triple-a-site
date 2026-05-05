"use client";

import { useEffect, useState } from "react";

type User = { id: string; nickname: string; role: string; createdAt: string };

export default function MembersPage() {
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/users")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setMembers(Array.isArray(data) ? data : []))
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-stone-400">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Участники</h1>

      {members.length === 0 ? (
        <p className="text-stone-400">Пока нет участников</p>
      ) : (
        <div className="space-y-2">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 bg-stone-50 border border-stone-200 rounded-lg"
            >
              <span className="font-medium text-stone-800">
                {member.nickname}
              </span>
              <span className="text-sm text-stone-400">
                {new Date(member.createdAt).toLocaleDateString("ru-RU")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

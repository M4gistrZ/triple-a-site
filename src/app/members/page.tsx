"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Shield, User } from "lucide-react";

type User = { id: string; nickname: string; role: string; createdAt: string };

export default function MembersPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMembers = () => {
    fetch("/api/users")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setMembers(Array.isArray(data) ? data : []))
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const changeRole = async (userId: string, newRole: string) => {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) {
      loadMembers();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-text-muted">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6 text-text">Участники</h1>

      {members.length === 0 ? (
        <p className="text-text-muted">Пока нет участников</p>
      ) : (
        <div className="space-y-2">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 bg-bg-elevated border border-border rounded-lg"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-text">
                  {member.nickname}
                </span>
                {member.role === "admin" && (
                  <Shield className="w-4 h-4 text-pink" title="Админ" />
                )}
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-text-muted">
                  {new Date(member.createdAt).toLocaleDateString("ru-RU")}
                </span>
                {user?.role === "admin" && member.id !== user.id && (
                  <select
                    value={member.role}
                    onChange={(e) => changeRole(member.id, e.target.value)}
                    className="text-xs px-2 py-1 bg-bg border border-border rounded text-text"
                  >
                    <option value="member">Участник</option>
                    <option value="admin">Админ</option>
                  </select>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

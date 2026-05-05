"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Activity = {
  id: string;
  action: string;
  content: string;
  createdAt: string;
  user: { nickname: string };
  project: { id: string; title: string } | null;
};

type Project = {
  id: string;
  title: string;
  status: string;
  coverImage: string;
  images: string;
  createdAt: string;
  creator: { nickname: string };
};

const statusColors: Record<string, string> = {
  planning: "bg-amber-50 text-amber-700",
  "in progress": "bg-green-50 text-green-700",
  completed: "bg-pink-50 text-pink-700",
  paused: "bg-stone-100 text-stone-500",
};

const statusLabels: Record<string, string> = {
  planning: "Планирование",
  "in progress": "В работе",
  completed: "Завершён",
  paused: "На паузе",
};

export default function DashboardPage() {
  const [activity, setActivity] = useState<Activity[]>([]);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/activity")
      .then((r) => (r.ok ? r.json() : []))
      .then(setActivity)
      .catch(() => setActivity([]));

    fetch("/api/projects")
      .then((r) => (r.ok ? r.json() : []))
      .then((projects) => setRecentProjects(projects.slice(0, 5)))
      .catch(() => setRecentProjects([]))
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
      <h1 className="text-2xl font-bold mb-6">Дашборд</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-stone-50 border border-stone-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Последние проекты</h2>
          {recentProjects.length === 0 ? (
            <p className="text-stone-400 text-sm">Пока нет проектов</p>
          ) : (
            <div className="space-y-3">
              {recentProjects.map((project) => {
                  const images: string[] = JSON.parse(project.images || "[]");
                  const coverUrl = project.coverImage || images[0];
                  return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="block bg-white border border-stone-200 rounded-md overflow-hidden hover:border-pink-300 transition-colors"
                >
                  {coverUrl && (
                    <div className="h-24 overflow-hidden">
                      <img
                        src={coverUrl}
                        alt={project.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className={`flex items-center justify-between ${coverUrl ? "p-3" : "p-3"}`}>
                    <span className="font-medium text-stone-800">
                      {project.title}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        statusColors[project.status] || "bg-stone-100 text-stone-500"
                      }`}
                    >
                      {statusLabels[project.status] || project.status}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 pb-3 px-3">
                    {project.creator.nickname} ·{" "}
                    {new Date(project.createdAt).toLocaleDateString("ru-RU")}
                  </p>
                </Link>
              );
            })}
            </div>
          )}
        </div>

        <div className="bg-stone-50 border border-stone-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Активность</h2>
          {activity.length === 0 ? (
            <p className="text-stone-400 text-sm">Пока нет активности</p>
          ) : (
            <div className="space-y-3">
              {activity.slice(0, 10).map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-white border border-stone-200 rounded-md"
                >
                  <p className="text-sm text-stone-700">
                    <span className="text-pink-600">{item.user.nickname}</span>{" "}
                    {item.content}
                  </p>
                  <p className="text-xs text-stone-400 mt-1">
                    {new Date(item.createdAt).toLocaleString("ru-RU")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

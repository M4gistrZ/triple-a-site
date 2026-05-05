"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Image } from "lucide-react";

type Project = {
  id: string;
  title: string;
  description: string;
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

function ProjectCard({ project }: { project: Project }) {
  const images: string[] = JSON.parse(project.images || "[]");
  const coverUrl = project.coverImage || images[0];
  const hasCover = !!coverUrl;

  return (
    <Link
      href={`/projects/${project.id}`}
      className="group block rounded-lg overflow-hidden border border-stone-200 hover:border-pink-300 transition-all"
    >
      {hasCover ? (
        <div className="relative h-40 overflow-hidden">
          <img
            src={coverUrl}
            alt={project.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="font-semibold text-lg text-white mb-1">
              {project.title}
            </h3>
            <span
              className={`inline-block text-xs px-2 py-0.5 rounded-full ${
                statusColors[project.status] || "bg-stone-100 text-stone-500"
              }`}
            >
              {statusLabels[project.status] || project.status}
            </span>
          </div>
        </div>
      ) : (
        <div className="h-40 bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center p-4">
          <h3 className="font-semibold text-xl text-stone-600 text-center">
            {project.title}
          </h3>
        </div>
      )}

      <div className={`p-4 ${hasCover ? "pt-3" : ""}`}>
        {!hasCover && (
          <div className="mb-2">
            <span
              className={`inline-block text-xs px-2 py-0.5 rounded-full ${
                statusColors[project.status] || "bg-stone-100 text-stone-500"
              }`}
            >
              {statusLabels[project.status] || project.status}
            </span>
          </div>
        )}
        <p className="text-sm text-stone-500 line-clamp-2 mb-3">
          {project.description}
        </p>
        <div className="flex items-center justify-between text-xs text-stone-400">
          <span>{project.creator.nickname}</span>
          <span>
            {new Date(project.createdAt).toLocaleDateString("ru-RU")}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setProjects(Array.isArray(data) ? data : []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    filter === "all"
      ? projects
      : projects.filter((p) => p.status === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-stone-400">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Проекты</h1>
        <div className="flex gap-2">
          <Link
            href="/gallery"
            className="flex items-center gap-2 px-4 py-2 bg-stone-100 border border-stone-200 hover:bg-stone-200 text-stone-600 rounded-md transition-colors text-sm"
          >
            <Image className="w-4 h-4" />
            Галерея
          </Link>
          <Link
            href="/projects/new"
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Новый проект
          </Link>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {[
          { value: "all", label: "Все" },
          { value: "planning", label: "Планирование" },
          { value: "in progress", label: "В работе" },
          { value: "completed", label: "Завершён" },
          { value: "paused", label: "На паузе" },
        ].map((s) => (
          <button
            key={s.value}
            onClick={() => setFilter(s.value)}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              filter === s.value
                ? "bg-pink-600 text-white"
                : "bg-stone-100 text-stone-500 hover:bg-stone-200"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-stone-400 text-center py-12">
          {filter === "all"
            ? "Пока нет проектов. Создайте первый!"
            : "Нет проектов с таким статусом"}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}

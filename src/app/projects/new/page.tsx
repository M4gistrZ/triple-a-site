"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ReferenceUploader } from "@/components/ReferenceUploader";
import { FileUpload } from "@/components/FileUpload";

type Project = { id: string; title: string };

export default function NewProjectPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("planning");
  const [coverImage, setCoverImage] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [relatedIds, setRelatedIds] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setAllProjects(Array.isArray(data) ? data : []))
      .catch(() => setAllProjects([]));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, status, images, coverImage }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create project");
      }

      const project = await res.json();
      router.push(`/projects/${project.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold mb-6 text-text">Новый проект</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              Название *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-bg border border-border rounded-md text-text focus:outline-none focus:border-green"
              placeholder="Название проекта"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              Статус
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 bg-bg border border-border rounded-md text-text focus:outline-none focus:border-green"
            >
              <option value="planning">Планирование</option>
              <option value="in progress">В работе</option>
              <option value="completed">Завершён</option>
              <option value="paused">На паузе</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              Обложка
            </label>
            <FileUpload
              onUpload={(url) => setCoverImage(url)}
              type="cover"
              label="Загрузить обложку"
              preview={coverImage}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              Описание *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 bg-bg border border-border rounded-md text-text focus:outline-none focus:border-green resize-none"
              placeholder="Подробное описание проекта..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              Галерея
            </label>
            <ReferenceUploader images={images} onChange={setImages} />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              Связанные проекты
            </label>
            <select
              multiple
              value={relatedIds}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value);
                setRelatedIds(selected);
              }}
              className="w-full px-3 py-2 bg-bg border border-border rounded-md text-text focus:outline-none focus:border-green text-sm"
              size={Math.min(allProjects.length, 5)}
            >
              {allProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
            <p className="text-xs text-text-muted mt-1">
              Удерживайте Ctrl для выбора нескольких проектов
            </p>
          </div>

          {error && <p className="text-sm text-pink">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-green hover:bg-green-hover text-white rounded-md transition-colors disabled:opacity-50"
            >
              {loading ? "Создание..." : "Создать"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 bg-bg-hover border border-border hover:bg-bg-hover/80 text-text rounded-md transition-colors"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

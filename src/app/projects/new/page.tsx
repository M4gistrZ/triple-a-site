"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ReferenceUploader } from "@/components/ReferenceUploader";
import { FileUpload } from "@/components/FileUpload";

export default function NewProjectPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("planning");
  const [coverImage, setCoverImage] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
        <h1 className="text-2xl font-bold mb-6">Новый проект</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-500 mb-1">
              Название *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-stone-200 rounded-md text-stone-800 focus:outline-none focus:border-green-400"
              placeholder="Название проекта"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-500 mb-1">
              Статус
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-stone-200 rounded-md text-stone-800 focus:outline-none focus:border-green-400"
            >
              <option value="planning">Планирование</option>
              <option value="in progress">В работе</option>
              <option value="completed">Завершён</option>
              <option value="paused">На паузе</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-500 mb-1">
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
            <label className="block text-sm font-medium text-stone-500 mb-1">
              Описание *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 bg-white border border-stone-200 rounded-md text-stone-800 focus:outline-none focus:border-green-400 resize-none"
              placeholder="Подробное описание проекта..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-500 mb-1">
              Галерея
            </label>
            <ReferenceUploader images={images} onChange={setImages} />
          </div>

          {error && <p className="text-sm text-pink-600">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors disabled:opacity-50"
            >
              {loading ? "Создание..." : "Создать"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 bg-stone-100 border border-stone-200 hover:bg-stone-200 text-stone-600 rounded-md transition-colors"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

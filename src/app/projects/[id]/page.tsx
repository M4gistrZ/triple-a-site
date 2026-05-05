"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit2, Trash2, X } from "lucide-react";
import { ReferenceUploader } from "@/components/ReferenceUploader";
import { ImageViewer } from "@/components/ImageViewer";

type Project = {
  id: string;
  title: string;
  description: string;
  status: string;
  coverImage: string;
  images: string;
  createdAt: string;
  updatedAt: string;
  creator: { nickname: string };
};

const statusLabels: Record<string, string> = {
  planning: "Планирование",
  "in progress": "В работе",
  completed: "Завершён",
  paused: "На паузе",
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: "",
    description: "",
    status: "",
  });
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"desc" | "gallery">("desc");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetch(`/api/projects/${params.id}`)
        .then((r) => {
          if (!r.ok) throw new Error("Not found");
          return r.json();
        })
        .then((data) => {
          setProject(data);
          setEditData({
            title: data.title,
            description: data.description,
            status: data.status,
          });
          setGalleryImages(JSON.parse(data.images || "[]"));
        })
        .catch(() => router.push("/projects"))
        .finally(() => setLoading(false));
    }
  }, [params.id, router]);

  const handleSave = async () => {
    if (!project) return;
    const res = await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...editData, images: galleryImages }),
    });
    if (res.ok) {
      const updated = await res.json();
      setProject(updated);
      setEditing(false);
    }
  };

  const handleDelete = async () => {
    if (!project) return;
    if (!confirm("Удалить проект?")) return;
    const res = await fetch(`/api/projects/${project.id}`, {
      method: "DELETE",
    });
    if (res.ok) router.push("/projects");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-text-muted">Загрузка...</p>
      </div>
    );
  }

  if (!project) return null;

  const images: string[] = JSON.parse(project.images || "[]");
  const coverUrl = project.coverImage || images[0];

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link
          href="/projects"
          className="flex items-center gap-2 text-sm text-text-muted hover:text-pink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад к проектам
        </Link>
      </div>

      {editing ? (
        <div className="max-w-2xl space-y-4">
          <input
            type="text"
            value={editData.title}
            onChange={(e) => setEditData({ ...editData, title: e.target.value })}
            className="w-full px-3 py-2 bg-bg border border-border rounded-md text-text text-xl font-bold focus:outline-none focus:border-pink"
          />
          <select
            value={editData.status}
            onChange={(e) => setEditData({ ...editData, status: e.target.value })}
            className="w-full px-3 py-2 bg-bg border border-border rounded-md text-text focus:outline-none focus:border-pink"
          >
            <option value="planning">Планирование</option>
            <option value="in progress">В работе</option>
            <option value="completed">Завершён</option>
            <option value="paused">На паузе</option>
          </select>
          <textarea
            value={editData.description}
            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
            rows={8}
            className="w-full px-3 py-2 bg-bg border border-border rounded-md text-text focus:outline-none focus:border-pink resize-none"
          />
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              Галерея
            </label>
            <ReferenceUploader images={galleryImages} onChange={setGalleryImages} />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green hover:bg-green-hover text-white rounded-md transition-colors"
            >
              Сохранить
            </button>
            <button
              onClick={() => setEditing(false)}
              className="px-4 py-2 bg-bg-hover border border-border hover:bg-bg-hover/80 text-text rounded-md transition-colors"
            >
              Отмена
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-3xl font-bold text-text">
              {project.title}
            </h1>
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-bg-elevated border border-border hover:border-green text-text rounded-md transition-colors"
              >
                <Edit2 className="w-3 h-3" />
                Редактировать
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-bg-elevated border border-border hover:border-pink text-pink rounded-md transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Удалить
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mb-6">
            <span className="text-sm bg-green-light text-green px-3 py-1 rounded-full">
              {statusLabels[project.status] || project.status}
            </span>
            <span className="text-sm text-text-muted px-3 py-1">
              Автор: {project.creator.nickname}
            </span>
            <span className="text-sm text-text-muted px-3 py-1">
              Создан: {new Date(project.createdAt).toLocaleDateString("ru-RU")}
            </span>
            <span className="text-sm text-text-muted px-3 py-1">
              Обновлён: {new Date(project.updatedAt).toLocaleDateString("ru-RU")}
            </span>
          </div>

          {coverUrl && (
            <button
              onClick={() => setSelectedImage(coverUrl)}
              className="mb-6 rounded-lg overflow-hidden h-64 border border-border w-full cursor-pointer hover:opacity-90 transition-opacity"
            >
              <img
                src={coverUrl}
                alt={project.title}
                className="w-full h-full object-cover"
              />
            </button>
          )}

          <div className="flex gap-0 mb-6 border-b border-border">
            <button
              onClick={() => setActiveTab("desc")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "desc"
                  ? "border-pink text-pink"
                  : "border-transparent text-text-muted hover:text-text"
              }`}
            >
              Описание
            </button>
            <button
              onClick={() => setActiveTab("gallery")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "gallery"
                  ? "border-pink text-pink"
                  : "border-transparent text-text-muted hover:text-text"
              }`}
            >
              Галерея ({images.length})
            </button>
          </div>

          {activeTab === "desc" ? (
            <div className="mb-8">
              <p className="text-text whitespace-pre-wrap">
                {project.description}
              </p>
            </div>
          ) : (
            <div>
              {images.length === 0 ? (
                <p className="text-text-muted text-sm py-8 text-center">
                  Галерея пуста
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(img)}
                      className="aspect-square bg-bg-elevated border border-border rounded-lg overflow-hidden group relative cursor-pointer hover:border-pink transition-colors"
                    >
                      <img
                        src={img}
                        alt={`Image ${i + 1}`}
                        className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {selectedImage && (
        <ImageViewer
          src={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  );
}

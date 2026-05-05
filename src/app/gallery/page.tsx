"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ImageViewer } from "@/components/ImageViewer";

type GalleryItem = {
  url: string;
  title: string;
  projectId: string;
  isCover: boolean;
};

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<GalleryItem | null>(null);

  useEffect(() => {
    fetch("/api/gallery")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]))
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
      <div className="mb-6">
        <Link
          href="/projects"
          className="flex items-center gap-2 text-sm text-stone-400 hover:text-pink-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад к проектам
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">Галерея</h1>

      {items.length === 0 ? (
        <p className="text-stone-400 text-center py-12">
          Пока нет изображений
        </p>
      ) : (
        <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4">
          {items.map((item, i) => (
            <button
              key={`${item.projectId}-${i}`}
              onClick={() => setSelected(item)}
              className="block w-full break-inside-avoid group cursor-pointer"
            >
              <div className="relative bg-stone-50 border border-stone-200 rounded-lg overflow-hidden">
                <img
                  src={item.url}
                  alt={item.title}
                  className="w-full h-auto object-cover group-hover:opacity-90 transition-opacity"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <p className="text-xs text-white truncate">{item.title}</p>
                    {item.isCover && (
                      <span className="text-xs text-pink-300">обложка</span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <ImageViewer
          src={selected.url}
          alt={selected.title}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

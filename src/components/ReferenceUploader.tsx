"use client";

import { useState, useRef } from "react";
import { X, Upload, LinkIcon } from "lucide-react";
import { ImageViewer } from "@/components/ImageViewer";

export function ReferenceUploader({
  images,
  onChange,
}: {
  images: string[];
  onChange: (images: string[]) => void;
}) {
  const [mode, setMode] = useState<"file" | "url">("file");
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);
    for (const file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) continue;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "project");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        onChange([...images, data.url]);
      }
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleUrlAdd = () => {
    if (urlInput.trim()) {
      onChange([...images, urlInput.trim()]);
      setUrlInput("");
      setError("");
    }
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <button
          type="button"
          onClick={() => setMode("file")}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded transition-colors ${
            mode === "file"
              ? "bg-stone-800 text-white"
              : "text-stone-500 hover:text-stone-700"
          }`}
        >
          <Upload className="w-3 h-3" />
          С ПК
        </button>
        <button
          type="button"
          onClick={() => setMode("url")}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded transition-colors ${
            mode === "url"
              ? "bg-stone-800 text-white"
              : "text-stone-500 hover:text-stone-700"
          }`}
        >
          <LinkIcon className="w-3 h-3" />
          URL
        </button>
      </div>

      {mode === "file" ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-3 py-1.5 bg-stone-100 border border-stone-200 hover:border-stone-300 rounded text-sm text-stone-600 transition-colors disabled:opacity-50"
        >
          <Upload className="w-3 h-3" />
          {uploading ? "Загрузка..." : "Загрузить изображения"}
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleUrlAdd();
              }
            }}
            className="flex-1 px-2 py-1 bg-white border border-stone-200 rounded text-sm text-stone-700 focus:outline-none focus:border-pink-400"
            placeholder="https://example.com/image.jpg"
          />
          <button
            type="button"
            onClick={handleUrlAdd}
            className="px-3 py-1 bg-stone-800 hover:bg-stone-700 text-white rounded text-sm transition-colors"
          >
            Добавить
          </button>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileUpload}
        className="hidden"
      />

      {error && <p className="text-xs text-pink-600 mt-1">{error}</p>}

      {images.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {images.map((img, i) => (
            <div key={i} className="relative group">
              <button
                type="button"
                onClick={() => setSelectedImage(img)}
                className="w-full h-24 rounded-md border border-stone-200 overflow-hidden cursor-pointer"
              >
                <img
                  src={img}
                  alt={`Reference ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(i);
                }}
                className="absolute top-1 right-1 w-5 h-5 bg-pink-600 rounded-full text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
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

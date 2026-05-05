"use client";

import { useState, useRef } from "react";
import { Upload, LinkIcon } from "lucide-react";

type FileUploadProps = {
  onUpload: (url: string) => void;
  type?: string;
  label?: string;
  preview?: string;
  accept?: string;
};

export function FileUpload({
  onUpload,
  type = "file",
  label = "Загрузить",
  preview,
  accept = "image/*",
}: FileUploadProps) {
  const [mode, setMode] = useState<"file" | "url">("file");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Файл слишком большой (макс. 5 МБ)");
      return;
    }

    setError("");
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        onUpload(data.url);
        setUrlInput("");
      } else {
        const err = await res.json();
        setError(err.error || "Ошибка загрузки");
      }
    } catch {
      setError("Ошибка загрузки");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onUpload(urlInput.trim());
      setUrlInput("");
      setError("");
    }
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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-3 py-1.5 bg-stone-100 border border-stone-200 hover:border-stone-300 rounded text-sm text-stone-600 transition-colors disabled:opacity-50"
          >
            <Upload className="w-3 h-3" />
            {uploading ? "Загрузка..." : label}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleFile}
            className="hidden"
          />
          {preview && (
            <img
              src={preview}
              alt="Preview"
              className="w-6 h-6 rounded object-cover"
            />
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleUrlSubmit();
              }
            }}
            className="flex-1 px-2 py-1 bg-white border border-stone-200 rounded text-sm text-stone-700 focus:outline-none focus:border-pink-400"
            placeholder="https://example.com/image.jpg"
          />
          <button
            type="button"
            onClick={handleUrlSubmit}
            className="px-3 py-1 bg-stone-800 hover:bg-stone-700 text-white rounded text-sm transition-colors"
          >
            OK
          </button>
          {preview && (
            <img
              src={preview}
              alt="Preview"
              className="w-6 h-6 rounded object-cover"
            />
          )}
        </div>
      )}

      {error && <p className="text-xs text-pink-600 mt-1">{error}</p>}
    </div>
  );
}

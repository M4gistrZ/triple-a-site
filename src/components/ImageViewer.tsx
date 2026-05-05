"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { X, ZoomIn, ZoomOut, Minimize2 } from "lucide-react";

type ImageViewerProps = {
  src: string;
  alt?: string;
  onClose: () => void;
};

export function ImageViewer({ src, alt = "", onClose }: ImageViewerProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const clampScale = useCallback(
    (s: number) => Math.max(1, Math.min(5, s)),
    []
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    setScale((prev) => clampScale(prev + delta));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const zoomIn = () => setScale((prev) => clampScale(prev + 0.3));
  const zoomOut = () => {
    const newScale = clampScale(scale - 0.3);
    setScale(newScale);
    if (newScale <= 1) setPosition({ x: 0, y: 0 });
  };
  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="absolute top-4 right-4 flex items-center gap-2 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={zoomIn}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
          title="Приблизить"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          onClick={zoomOut}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
          title="Отдалить"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        {scale > 1 && (
          <button
            onClick={resetZoom}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
            title="Сбросить"
          >
            <Minimize2 className="w-5 h-5" />
          </button>
        )}
        <button
          onClick={onClose}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
          title="Закрыть"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {scale > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-white/10 rounded-full text-white text-xs z-10">
          {Math.round(scale * 100)}%
        </div>
      )}

      <div
        className="flex items-center justify-center w-full h-full overflow-hidden"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt={alt}
          className="select-none"
          style={{
            maxWidth: scale === 1 ? "90vw" : "none",
            maxHeight: scale === 1 ? "90vh" : "none",
            width: scale === 1 ? "auto" : "auto",
            height: "auto",
            objectFit: "contain",
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? "none" : "transform 0.15s ease-out",
            cursor: scale > 1 ? "grab" : "default",
          }}
          draggable={false}
        />
      </div>
    </div>
  );
}

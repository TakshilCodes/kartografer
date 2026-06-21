"use client";

import type { ReactNode } from "react";
import { useLayoutEffect, useRef, useState } from "react";

type TripExportPreviewCanvasProps = {
  children: ReactNode;
};

type CanvasSize = {
  width: number;
  height: number;
  scale: number;
};

export default function TripExportPreviewCanvas({
  children,
}: TripExportPreviewCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const documentRef = useRef<HTMLDivElement>(null);
  const [canvas, setCanvas] = useState<CanvasSize | null>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const documentElement = documentRef.current;

    if (!container || !documentElement) return;

    function updateCanvas() {
      const currentContainer = containerRef.current;
      const currentDocument = documentRef.current;

      if (!currentContainer || !currentDocument) return;

      const availableWidth = currentContainer.clientWidth;
      const documentWidth = currentDocument.scrollWidth;
      const documentHeight = currentDocument.scrollHeight;

      if (!availableWidth || !documentWidth || !documentHeight) return;

      const scale = Math.min(1, availableWidth / documentWidth);

      setCanvas({
        width: documentWidth * scale,
        height: documentHeight * scale,
        scale,
      });
    }

    updateCanvas();

    const observer = new ResizeObserver(updateCanvas);
    observer.observe(container);
    observer.observe(documentElement);
    document.fonts.ready.then(updateCanvas);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full overflow-hidden">
      <div
        className="relative mx-auto"
        style={{
          width: canvas?.width ?? 0,
          height: canvas?.height ?? 0,
        }}
      >
        <div
          ref={documentRef}
          className={canvas ? "visible" : "invisible"}
          style={{
            width: "210mm",
            transform: `scale(${canvas?.scale ?? 1})`,
            transformOrigin: "top left",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
"use client";

import { useEffect, useRef } from "react";
import type { Project } from "@/data/portfolio";
import { drawVisual } from "@/components/scene/screens/draw";

export function ProjectThumb({ project, className = "" }: { project: Project; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, rect.width, rect.height);
      const pad = Math.min(rect.width, rect.height) * 0.08;
      drawVisual(ctx, project.visual, pad, pad, rect.width - pad * 2, rect.height - pad * 2, project.theme.accent);
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [project]);

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ background: project.theme.bg }}>
      <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden />
    </div>
  );
}

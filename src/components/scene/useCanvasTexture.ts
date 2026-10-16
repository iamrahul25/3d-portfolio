"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";

class CanvasSurface {
  readonly texture: THREE.CanvasTexture;
  private readonly ctx: CanvasRenderingContext2D;

  constructor(width: number, height: number) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    this.ctx = canvas.getContext("2d")!;
    this.texture = new THREE.CanvasTexture(canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.anisotropy = 8;
  }

  paint<T>(draw: (ctx: CanvasRenderingContext2D) => T): T {
    const result = draw(this.ctx);
    this.texture.needsUpdate = true;
    return result;
  }

  dispose() {
    this.texture.dispose();
  }
}

export function useCanvasTexture(width: number, height: number) {
  const surface = useMemo(() => new CanvasSurface(width, height), [width, height]);
  useEffect(() => () => surface.dispose(), [surface]);
  return surface;
}

export function getFontFamily(variable: string, fallback: string) {
  if (typeof document === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  return value ? `${value}, ${fallback}` : fallback;
}

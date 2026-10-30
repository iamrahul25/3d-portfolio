"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";

class CanvasSurface {
  readonly texture: THREE.CanvasTexture;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly scale: number;

  // Draw code keeps using logical width/height; the backing canvas is `scale`× larger
  // so text stays crisp when the camera is close to a screen.
  constructor(width: number, height: number, scale: number) {
    const canvas = document.createElement("canvas");
    this.scale = scale;
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    this.ctx = canvas.getContext("2d")!;
    this.ctx.imageSmoothingQuality = "high";
    this.texture = new THREE.CanvasTexture(canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.generateMipmaps = true;
    this.texture.minFilter = THREE.LinearMipmapLinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
    this.texture.anisotropy = 16;
  }

  paint<T>(draw: (ctx: CanvasRenderingContext2D) => T): T {
    this.ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    const result = draw(this.ctx);
    this.texture.needsUpdate = true;
    return result;
  }

  dispose() {
    this.texture.dispose();
  }
}

function defaultScale() {
  if (typeof window === "undefined") return 1;
  // 2× on desktop, 1.5× on touch devices to keep GPU memory reasonable.
  return window.matchMedia("(pointer: coarse)").matches ? 1.5 : 2;
}

export function useCanvasTexture(width: number, height: number, scale = defaultScale()) {
  const surface = useMemo(() => new CanvasSurface(width, height, scale), [width, height, scale]);
  useEffect(() => () => surface.dispose(), [surface]);
  return surface;
}

export function getFontFamily(variable: string, fallback: string) {
  if (typeof document === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  return value ? `${value}, ${fallback}` : fallback;
}

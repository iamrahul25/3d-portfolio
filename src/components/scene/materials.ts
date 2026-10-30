"use client";

import * as THREE from "three";

// Small procedural textures (drawn once on a 2D canvas, cached) that give surfaces
// believable grain without shipping image files.

const cache = new Map<string, THREE.Texture>();

function make(key: string, size: number, draw: (g: CanvasRenderingContext2D, s: number) => void, srgb = true) {
  const hit = cache.get(key);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  draw(c.getContext("2d")!, size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, t);
  return t;
}

function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

/** Oak-like grain running along X. Use as `map` (tinted by colour) and as `bumpMap`. */
export function woodTexture(base = "#d2a46c", seed = 7) {
  return make(`wood-${base}-${seed}`, 512, (g, s) => {
    const r = rng(seed);
    g.fillStyle = base;
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 140; i++) {
      const y = r() * s;
      const amp = 2 + r() * 6;
      const freq = 0.004 + r() * 0.01;
      const phase = r() * 10;
      const dark = r() < 0.6;
      g.strokeStyle = dark ? `rgba(90,55,25,${0.05 + r() * 0.12})` : `rgba(255,235,200,${0.04 + r() * 0.08})`;
      g.lineWidth = 0.6 + r() * 2.2;
      g.beginPath();
      for (let x = 0; x <= s; x += 8) {
        const yy = y + Math.sin(x * freq + phase) * amp + Math.sin(x * freq * 3.1) * amp * 0.25;
        if (x === 0) g.moveTo(x, yy);
        else g.lineTo(x, yy);
      }
      g.stroke();
    }
    // a couple of soft knots
    for (let k = 0; k < 2; k++) {
      const x = r() * s, y = r() * s;
      const grad = g.createRadialGradient(x, y, 0, x, y, 10 + r() * 10);
      grad.addColorStop(0, "rgba(80,45,20,0.35)");
      grad.addColorStop(1, "rgba(80,45,20,0)");
      g.fillStyle = grad;
      g.beginPath();
      g.ellipse(x, y, 26, 8, 0, 0, Math.PI * 2);
      g.fill();
    }
  });
}

/** Fine woven fabric / felt noise; good for desk mat, rug, chair seat, clothes. */
export function fabricTexture(base = "#2a2b31", seed = 3) {
  return make(`fabric-${base}-${seed}`, 256, (g, s) => {
    const r = rng(seed);
    g.fillStyle = base;
    g.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y += 2) {
      g.fillStyle = `rgba(255,255,255,${0.015 + r() * 0.03})`;
      g.fillRect(0, y, s, 1);
    }
    for (let x = 0; x < s; x += 2) {
      g.fillStyle = `rgba(0,0,0,${0.02 + r() * 0.04})`;
      g.fillRect(x, 0, 1, s);
    }
    for (let i = 0; i < 1800; i++) {
      g.fillStyle = r() < 0.5 ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.07)";
      g.fillRect(r() * s, r() * s, 1, 1);
    }
  });
}

/** Very subtle plaster/paint noise for walls (use as bumpMap with a tiny scale). */
export function plasterTexture(seed = 11) {
  return make(`plaster-${seed}`, 256, (g, s) => {
    const r = rng(seed);
    g.fillStyle = "#808080";
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 5000; i++) {
      const v = 110 + Math.floor(r() * 40);
      g.fillStyle = `rgba(${v},${v},${v},0.25)`;
      const w = 1 + r() * 3;
      g.fillRect(r() * s, r() * s, w, w);
    }
  }, false);
}

/** Brushed-metal streaks for anisotropic-looking metal parts (roughnessMap). */
export function brushedTexture(seed = 5) {
  return make(`brushed-${seed}`, 256, (g, s) => {
    const r = rng(seed);
    g.fillStyle = "#7a7a7a";
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 400; i++) {
      const v = 90 + Math.floor(r() * 80);
      g.fillStyle = `rgba(${v},${v},${v},0.35)`;
      g.fillRect(0, r() * s, s, 0.5 + r());
    }
  }, false);
}

/** Woven office-chair mesh as an alpha map: white = solid strand, black = hole. */
export function meshWeaveAlpha() {
  return make("weave", 128, (g, s) => {
    // Soft-edged strands (grey falloff) so mipmaps average to an even translucency
    // instead of aliasing into moiré at a distance.
    g.fillStyle = "#1a1a1a";
    g.fillRect(0, 0, s, s);
    g.filter = "blur(1px)";
    g.fillStyle = "#e6e6e6";
    const step = 8;
    for (let i = 0; i < s; i += step) {
      g.fillRect(i, 0, 3, s);
      g.fillRect(0, i, s, 3);
    }
    g.filter = "none";
  }, false);
}

/** Cork: warm base with dense dark/light granules. */
export function corkTexture(seed = 13) {
  return make(`cork-${seed}`, 512, (g, s) => {
    const r = rng(seed);
    g.fillStyle = "#c39468";
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 9000; i++) {
      const x = r() * s, y = r() * s, rad = 0.6 + r() * 2.2;
      const d = r();
      g.fillStyle = d < 0.45 ? `rgba(110,60,25,${0.25 + r() * 0.4})` : d < 0.8 ? `rgba(235,185,125,${0.25 + r() * 0.35})` : `rgba(60,30,12,${0.3 + r() * 0.3})`;
      g.beginPath();
      g.ellipse(x, y, rad, rad * (0.6 + r() * 0.6), r() * 3, 0, Math.PI * 2);
      g.fill();
    }
  });
}

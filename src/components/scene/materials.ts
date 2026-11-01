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

// Thousands of tiny strokes cost one path + one stroke() each; grouping them by colour and
// (quantised) alpha draws the same marks in a handful of calls.
const ALPHA_STEPS = 6;
function bucketed(g: CanvasRenderingContext2D) {
  const paths = new Map<string, Path2D>();
  return {
    path(rgb: string, alpha: number, min: number, max: number) {
      const step = Math.min(ALPHA_STEPS - 1, Math.floor(((alpha - min) / (max - min)) * ALPHA_STEPS));
      const key = `${rgb}|${min + ((step + 0.5) / ALPHA_STEPS) * (max - min)}`;
      let p = paths.get(key);
      if (!p) paths.set(key, (p = new Path2D()));
      return p;
    },
    flush(mode: "fill" | "stroke") {
      for (const [key, p] of paths) {
        const [rgb, a] = key.split("|");
        const style = `rgba(${rgb},${a})`;
        if (mode === "fill") {
          g.fillStyle = style;
          g.fill(p);
        } else {
          g.strokeStyle = style;
          g.stroke(p);
        }
      }
    },
  };
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
    const granules = bucketed(g);
    for (let i = 0; i < 9000; i++) {
      const x = r() * s, y = r() * s, rad = 0.6 + r() * 2.2;
      const d = r();
      const p =
        d < 0.45
          ? granules.path("110,60,25", 0.25 + r() * 0.4, 0.25, 0.65)
          : d < 0.8
            ? granules.path("235,185,125", 0.25 + r() * 0.35, 0.25, 0.6)
            : granules.path("60,30,12", 0.3 + r() * 0.3, 0.3, 0.6);
      const rx = rad, ry = rad * (0.6 + r() * 0.6), rot = r() * 3;
      p.moveTo(x + rx * Math.cos(rot), y + rx * Math.sin(rot));
      p.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
    }
    granules.flush("fill");
  });
}

/** Rug: low-pile wool with fibre noise, a woven border band and an inner pinstripe. */
export function rugTexture(base = "#eaa63a", seed = 17) {
  return make(`rug-${base}-${seed}`, 1024, (g, s) => {
    const r = rng(seed);
    g.fillStyle = base;
    g.fillRect(0, 0, s, s);
    const fibres = bucketed(g);
    g.lineWidth = 1;
    for (let i = 0; i < 60000; i++) {
      const x = r() * s, y = r() * s;
      const p = r() < 0.5 ? fibres.path("255,240,210", 0.05 + r() * 0.08, 0.05, 0.13) : fibres.path("90,50,10", 0.05 + r() * 0.09, 0.05, 0.14);
      p.moveTo(x, y);
      p.lineTo(x + (r() - 0.5) * 4, y + (r() - 0.5) * 4);
    }
    fibres.flush("stroke");
    const band = s * 0.045;
    g.strokeStyle = "rgba(120,70,20,0.55)";
    g.lineWidth = band;
    g.strokeRect(band / 2, band / 2, s - band, s - band);
    g.strokeStyle = "rgba(255,245,225,0.55)";
    g.lineWidth = 4;
    g.strokeRect(band * 1.8, band * 1.8, s - band * 3.6, s - band * 3.6);
  });
}

/** Light oak floorboards: staggered planks with grain and thin seams. */
export function floorTexture(seed = 23) {
  return make(`floor-${seed}`, 1024, (g, s) => {
    const r = rng(seed);
    const rows = 8;
    const h = s / rows;
    for (let row = 0; row < rows; row++) {
      let x = -r() * s * 0.5;
      while (x < s) {
        const w = s * (0.35 + r() * 0.4);
        const l = 205 + Math.floor(r() * 22);
        g.fillStyle = `rgb(${l},${l - 12},${l - 30})`;
        g.fillRect(x, row * h, w, h);
        for (let k = 0; k < 14; k++) {
          const yy = row * h + r() * h;
          g.strokeStyle = r() < 0.6 ? `rgba(120,85,50,${0.05 + r() * 0.08})` : `rgba(255,245,225,${0.05 + r() * 0.07})`;
          g.lineWidth = 0.6 + r() * 1.6;
          g.beginPath();
          for (let xx = 0; xx <= w; xx += 10) {
            const y2 = yy + Math.sin((xx + x) * 0.01 + k) * 2;
            if (xx === 0) g.moveTo(x + xx, y2);
            else g.lineTo(x + xx, y2);
          }
          g.stroke();
        }
        g.fillStyle = "rgba(70,50,30,0.35)";
        g.fillRect(x, row * h, 1.5, h);
        x += w;
      }
      g.fillStyle = "rgba(70,50,30,0.4)";
      g.fillRect(0, row * h, s, 1.5);
    }
  });
}

/** Vertical soft gradient (opaque at the bottom) for fake contact AO strips. */
export function aoGradient() {
  return make("ao-grad", 64, (g, s) => {
    const grad = g.createLinearGradient(0, s, 0, 0);
    grad.addColorStop(0, "rgba(0,0,0,1)");
    grad.addColorStop(0.35, "rgba(0,0,0,0.35)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, s, s);
  });
}

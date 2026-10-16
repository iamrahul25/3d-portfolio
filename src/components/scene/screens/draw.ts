import { profile, type Project, type ProjectVisual } from "@/data/portfolio";

export type HitRegion = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export const MAIN_SCREEN = { width: 1600, height: 900 };

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function fillRR(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  color: string,
) {
  rr(ctx, x, y, w, h, r);
  ctx.fillStyle = color;
  ctx.fill();
}

function phoneMock(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, accent: string) {
  fillRR(ctx, x, y, w, h, w * 0.18, "#111827");
  fillRR(ctx, x + 4, y + 4, w - 8, h - 8, w * 0.15, "#ffffff");
  fillRR(ctx, x + w * 0.35, y + 9, w * 0.3, 6, 3, "#111827");
  const pad = w * 0.14;
  for (let i = 0; i < 4; i++) {
    const ry = y + h * 0.22 + i * (h * 0.17);
    fillRR(ctx, x + pad, ry, w - pad * 2, h * 0.12, 6, i === 1 ? accent : "#eef2f7");
    ctx.beginPath();
    ctx.arc(x + pad + 12, ry + h * 0.06, 5, 0, Math.PI * 2);
    ctx.fillStyle = i === 1 ? "#ffffff" : accent;
    ctx.fill();
  }
}

export function drawVisual(
  ctx: CanvasRenderingContext2D,
  visual: ProjectVisual,
  x: number,
  y: number,
  w: number,
  h: number,
  accent: string,
) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  switch (visual) {
    case "phone": {
      const ph = h * 0.86;
      const pw = ph * 0.5;
      phoneMock(ctx, cx - pw - 6, cy - ph / 2 + 8, pw, ph, accent);
      phoneMock(ctx, cx + 6, cy - ph / 2 - 4, pw, ph, accent);
      break;
    }
    case "dots": {
      const s = Math.min(w * 0.62, h * 0.9);
      fillRR(ctx, cx - s / 2, cy - s / 2, s, s, 18, "#1e1b4b");
      const colors = ["#f43f5e", "#f59e0b", "#22c55e", "#3b82f6", "#a855f7", "#14b8a6"];
      const n = 5;
      const step = (s - 40) / (n - 1);
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          ctx.beginPath();
          ctx.arc(cx - s / 2 + 20 + i * step, cy - s / 2 + 20 + j * step, s * 0.055, 0, Math.PI * 2);
          ctx.fillStyle = colors[(i * 3 + j * 2) % colors.length];
          ctx.fill();
        }
      }
      break;
    }
    case "fashion":
    case "marketplace":
    case "browser": {
      const bw = w * 0.84;
      const bh = h * 0.82;
      const bx = cx - bw / 2;
      const by = cy - bh / 2;
      fillRR(ctx, bx, by, bw, bh, 12, "#ffffff");
      fillRR(ctx, bx, by, bw, 22, 12, visual === "browser" ? "#1c1917" : "#f3f4f6");
      ["#f87171", "#fbbf24", "#34d399"].forEach((c, i) => {
        ctx.beginPath();
        ctx.arc(bx + 14 + i * 13, by + 11, 4, 0, Math.PI * 2);
        ctx.fillStyle = c;
        ctx.fill();
      });
      const inner = { x: bx + 12, y: by + 34, w: bw - 24, h: bh - 46 };
      if (visual === "fashion") {
        const palette = ["#f9a8d4", "#fcd34d", "#c4b5fd", "#fda4af"];
        const cw = (inner.w - 24) / 4;
        for (let i = 0; i < 4; i++) {
          const px = inner.x + i * (cw + 8);
          fillRR(ctx, px, inner.y, cw, inner.h * 0.78, 8, palette[i]);
          ctx.beginPath();
          ctx.arc(px + cw / 2, inner.y + inner.h * 0.2, cw * 0.18, 0, Math.PI * 2);
          ctx.fillStyle = "#7c2d12";
          ctx.fill();
          fillRR(ctx, px + cw * 0.25, inner.y + inner.h * 0.33, cw * 0.5, inner.h * 0.4, 6, "#ffffff");
          fillRR(ctx, px + 4, inner.y + inner.h * 0.84, cw * 0.7, 6, 3, "#e5e7eb");
        }
      } else if (visual === "marketplace") {
        const cw = (inner.w - 16) / 3;
        const tiles = ["#fdba74", "#93c5fd", "#86efac"];
        for (let i = 0; i < 3; i++) {
          const px = inner.x + i * (cw + 8);
          fillRR(ctx, px, inner.y, cw, inner.h * 0.62, 8, tiles[i]);
          fillRR(ctx, px, inner.y + inner.h * 0.7, cw * 0.8, 7, 3, "#e5e7eb");
          fillRR(ctx, px, inner.y + inner.h * 0.84, cw * 0.5, 12, 6, accent);
        }
      } else {
        ctx.save();
        ctx.translate(inner.x + inner.w / 2, inner.y + inner.h / 2 + 4);
        const s = Math.min(inner.w, inner.h) * 0.45;
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.lineTo(s * 0.9, -s * 0.5);
        ctx.lineTo(0, 0);
        ctx.lineTo(-s * 0.9, -s * 0.5);
        ctx.closePath();
        ctx.fillStyle = "#fcd34d";
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-s * 0.9, -s * 0.5);
        ctx.lineTo(0, 0);
        ctx.lineTo(0, s);
        ctx.lineTo(-s * 0.9, s * 0.5);
        ctx.closePath();
        ctx.fillStyle = "#f59e0b";
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(s * 0.9, -s * 0.5);
        ctx.lineTo(0, 0);
        ctx.lineTo(0, s);
        ctx.lineTo(s * 0.9, s * 0.5);
        ctx.closePath();
        ctx.fillStyle = "#b45309";
        ctx.fill();
        ctx.restore();
      }
      break;
    }
    case "dashboard": {
      const bw = w * 0.86;
      const bh = h * 0.8;
      const bx = cx - bw / 2;
      const by = cy - bh / 2;
      fillRR(ctx, bx, by, bw, bh, 12, "#0f172a");
      for (let i = 0; i < 3; i++) {
        fillRR(ctx, bx + 12 + i * ((bw - 24) / 3), by + 12, (bw - 24) / 3 - 8, 24, 6, "#1e293b");
      }
      const chart = { x: bx + 14, y: by + 50, w: bw - 28, h: bh - 64 };
      const lines: [string, number][] = [
        ["#22d3ee", 0],
        ["#f472b6", 1.7],
      ];
      lines.forEach(([color, phase]) => {
        ctx.beginPath();
        for (let i = 0; i <= 40; i++) {
          const px = chart.x + (i / 40) * chart.w;
          const v = Math.sin(i * 0.45 + phase) * 0.25 + Math.sin(i * 1.3 + phase) * 0.12;
          const py = chart.y + chart.h * (0.5 - v);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.stroke();
      });
      for (let i = 0; i < 14; i++) {
        const bh2 = (0.15 + ((i * 37) % 10) / 30) * chart.h;
        fillRR(ctx, chart.x + i * (chart.w / 14) + 2, chart.y + chart.h - bh2, chart.w / 14 - 5, bh2, 2, "rgba(129,140,248,0.45)");
      }
      break;
    }
  }
}

const NAV = ["Work", "Apps", "Websites", "About"];

export function drawMainScreen(
  ctx: CanvasRenderingContext2D,
  projects: Project[],
  hovered: string | null,
  font: string,
): HitRegion[] {
  const { width: W, height: H } = MAIN_SCREEN;
  const hits: HitRegion[] = [];

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#ffffff");
  bg.addColorStop(1, "#f4f1ec");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#111111";
  ctx.font = `800 40px ${font}`;
  ctx.fillText(profile.initials, 64, 84);

  ctx.font = `500 24px ${font}`;
  let nx = W - 64;
  for (let i = NAV.length - 1; i >= 0; i--) {
    const label = NAV[i];
    const tw = ctx.measureText(label).width;
    nx -= tw;
    const id = `nav:${label.toLowerCase()}`;
    ctx.fillStyle = hovered === id ? "#111111" : "#4b5563";
    ctx.fillText(label, nx, 80);
    if (hovered === id) fillRR(ctx, nx, 90, tw, 3, 2, "#f5b400");
    hits.push({ id, x: nx - 10, y: 50, w: tw + 20, h: 50 });
    nx -= 48;
  }

  ctx.fillStyle = "#111111";
  ctx.font = `800 58px ${font}`;
  ctx.fillText(profile.name, 64, 300);
  ctx.font = `500 28px ${font}`;
  ctx.fillStyle = "#6b7280";
  ctx.fillText(profile.role, 64, 348);

  ctx.font = `500 24px ${font}`;
  profile.pillars.forEach((p, i) => {
    const py = 420 + i * 46;
    rr(ctx, 64, py - 18, 20, 20, 5);
    ctx.strokeStyle = "#9ca3af";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#374151";
    ctx.fillText(p, 100, py);
  });

  const cta = { x: 64, y: 640, w: 230, h: 62 };
  const ctaHover = hovered === "cta";
  fillRR(ctx, cta.x, cta.y + (ctaHover ? -2 : 0), cta.w, cta.h, 31, ctaHover ? "#ffc61a" : "#f5b400");
  ctx.fillStyle = "#111111";
  ctx.font = `700 24px ${font}`;
  ctx.fillText("View Projects  →", cta.x + 30, cta.y + 40 + (ctaHover ? -2 : 0));
  hits.push({ id: "cta", ...cta });

  const grid = { x: 470, y: 140, w: W - 470 - 64, h: H - 140 - 60 };
  const cols = 3;
  const rows = Math.ceil(Math.min(projects.length, 6) / cols);
  const gap = 26;
  const cw = (grid.w - gap * (cols - 1)) / cols;
  const ch = (grid.h - gap * (rows - 1)) / rows;

  projects.slice(0, 6).forEach((p, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const isHover = hovered === `project:${p.slug}`;
    const x = grid.x + col * (cw + gap);
    const y = grid.y + row * (ch + gap) - (isHover ? 6 : 0);

    ctx.save();
    ctx.shadowColor = isHover ? "rgba(0,0,0,0.22)" : "rgba(0,0,0,0.08)";
    ctx.shadowBlur = isHover ? 30 : 14;
    ctx.shadowOffsetY = isHover ? 12 : 5;
    fillRR(ctx, x, y, cw, ch, 22, p.theme.bg);
    ctx.restore();

    if (isHover) {
      rr(ctx, x, y, cw, ch, 22);
      ctx.strokeStyle = p.theme.accent;
      ctx.lineWidth = 4;
      ctx.stroke();
    }

    drawVisual(ctx, p.visual, x + 14, y + 14, cw - 28, ch * 0.64, p.theme.accent);

    ctx.fillStyle = p.theme.dark ? "#ffffff" : "#111111";
    ctx.font = `700 28px ${font}`;
    ctx.fillText(p.title, x + 24, y + ch - 52);
    ctx.fillStyle = p.theme.dark ? "rgba(255,255,255,0.75)" : "#4b5563";
    ctx.font = `500 20px ${font}`;
    ctx.fillText(p.tagline, x + 24, y + ch - 22);

    hits.push({ id: `project:${p.slug}`, x, y, w: cw, h: ch });
  });

  return hits;
}

type Token = [string, string];

const CODE: Token[][] = [
  [["#c792ea", "import"], ["#e5e7eb", " { Canvas } "], ["#c792ea", "from"], ["#c3e88d", " '@react-three/fiber'"]],
  [["#c792ea", "import"], ["#e5e7eb", " { projects } "], ["#c792ea", "from"], ["#c3e88d", " '@/data'"]],
  [],
  [["#c792ea", "export default function"], ["#82aaff", " Workspace"], ["#e5e7eb", "() {"]],
  [["#c792ea", "  const"], ["#e5e7eb", " [active, setActive] = "], ["#82aaff", "useState"], ["#e5e7eb", "(0)"]],
  [],
  [["#c792ea", "  return"], ["#e5e7eb", " ("]],
  [["#89ddff", "    <Canvas"], ["#ffcb6b", " shadows"], ["#89ddff", ">"]],
  [["#89ddff", "      <Desk"], ["#ffcb6b", " position"], ["#e5e7eb", "={[0, 0, 0]}"], ["#89ddff", " />"]],
  [["#89ddff", "      <Monitor"]],
  [["#ffcb6b", "        projects"], ["#e5e7eb", "={projects}"]],
  [["#ffcb6b", "        onSelect"], ["#e5e7eb", "={setActive}"]],
  [["#89ddff", "      />"]],
  [["#89ddff", "      <Lamp"], ["#ffcb6b", " glow"], ["#89ddff", " />"]],
  [["#89ddff", "    </Canvas>"]],
  [["#e5e7eb", "  )"]],
  [["#e5e7eb", "}"]],
  [],
  [["#546e7a", "// build, learn, solve problems"]],
  [["#c792ea", "async function"], ["#82aaff", " ship"], ["#e5e7eb", "(idea) {"]],
  [["#c792ea", "  const"], ["#e5e7eb", " app = "], ["#c792ea", "await"], ["#82aaff", " build"], ["#e5e7eb", "(idea)"]],
  [["#c792ea", "  await"], ["#82aaff", " test"], ["#e5e7eb", "(app)"]],
  [["#c792ea", "  return"], ["#82aaff", " deploy"], ["#e5e7eb", "(app)"]],
  [["#e5e7eb", "}"]],
  [],
  [["#546e7a", "// TODO: drink more coffee ☕"]],
  [["#82aaff", "ship"], ["#e5e7eb", "("], ["#c3e88d", "'next big thing'"], ["#e5e7eb", ")"]],
];

export const CODE_CHAR_COUNT = CODE.reduce(
  (sum, line) => sum + line.reduce((s, [, t]) => s + t.length, 0) + 1,
  0,
);

export function drawCodeScreen(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  visibleChars: number,
  mono: string,
  showCursor: boolean,
) {
  ctx.fillStyle = "#1e1e2e";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#181825";
  ctx.fillRect(0, 0, w, 54);
  ["#f87171", "#fbbf24", "#34d399"].forEach((c, i) => {
    ctx.beginPath();
    ctx.arc(28 + i * 26, 27, 8, 0, Math.PI * 2);
    ctx.fillStyle = c;
    ctx.fill();
  });
  ctx.fillStyle = "#9ca3af";
  ctx.font = `500 22px ${mono}`;
  ctx.fillText("workspace.tsx", 120, 35);

  const lineH = Math.min(46, (h - 90) / CODE.length);
  const fontSize = Math.round(lineH * 0.6);
  ctx.font = `500 ${fontSize}px ${mono}`;
  let remaining = visibleChars;
  let cursor: { x: number; y: number } | null = null;

  for (let i = 0; i < CODE.length && remaining > 0; i++) {
    const y = 90 + i * lineH + fontSize;
    ctx.fillStyle = "#4b5563";
    ctx.fillText(String(i + 1).padStart(2, " "), 16, y);
    let x = 70;
    for (const [color, text] of CODE[i]) {
      if (remaining <= 0) break;
      const part = text.slice(0, remaining);
      remaining -= part.length;
      ctx.fillStyle = color;
      ctx.fillText(part, x, y);
      x += ctx.measureText(part).width;
    }
    remaining -= 1;
    cursor = { x, y };
  }

  if (cursor && showCursor) {
    ctx.fillStyle = "#f5b400";
    ctx.fillRect(cursor.x + 2, cursor.y - fontSize + 2, fontSize * 0.5, fontSize);
  }
}

export function drawWallpaper(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#5b8bd9");
  sky.addColorStop(0.55, "#f3b28a");
  sky.addColorStop(1, "#f7d3a7");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  ctx.beginPath();
  ctx.arc(w * 0.7, h * 0.42, h * 0.09, 0, Math.PI * 2);
  ctx.fillStyle = "#fff4d6";
  ctx.fill();

  const ranges: [string, number, number][] = [
    ["#8a7fb8", 0.55, 0.22],
    ["#5e5a8f", 0.66, 0.18],
    ["#3b3a63", 0.78, 0.14],
  ];
  ranges.forEach(([color, base, amp], k) => {
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let i = 0; i <= 12; i++) {
      const x = (i / 12) * w;
      const peak = (i + k) % 2 === 0 ? amp : amp * 0.35;
      ctx.lineTo(x, h * (base - peak + 0.12));
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  });

  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.fillRect(0, h - 34, w, 34);
}

export function drawPhoneScreen(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#312e81");
  g.addColorStop(1, "#0f172a");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#ffffff";
  ctx.font = `600 ${w * 0.22}px sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("10:41", w / 2, h * 0.22);
  ctx.textAlign = "left";
  const colors = ["#f43f5e", "#22c55e", "#3b82f6", "#f59e0b", "#a855f7", "#14b8a6", "#ec4899", "#eab308"];
  const s = w * 0.16;
  for (let i = 0; i < 8; i++) {
    const col = i % 4;
    const row = Math.floor(i / 4);
    fillRR(ctx, w * 0.1 + col * (s + w * 0.053), h * 0.4 + row * (s + w * 0.08), s, s, s * 0.28, colors[i]);
  }
}

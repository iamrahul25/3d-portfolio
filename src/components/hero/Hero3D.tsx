"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { getProject, profile, projects } from "@/data/portfolio";
import { ProjectModal } from "@/components/ui/ProjectModal";
import type { View } from "@/components/scene/Scene";
import type { ScreenAction } from "@/components/scene/Monitors";

const Scene = dynamic(() => import("@/components/scene/Scene"), { ssr: false });

const ease = [0.22, 1, 0.36, 1] as const;

function DockButton({
  active,
  onClick,
  children,
  label,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={`flex h-10 min-w-10 items-center justify-center gap-2 rounded-xl px-3 text-sm font-medium transition-colors ${
        active ? "bg-ink text-cream" : "text-ink/80 hover:bg-white"
      }`}
    >
      {children}
    </motion.button>
  );
}

function OverlayButton({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <motion.button
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      aria-label={label}
      title={label}
      className="glass flex h-11 w-11 items-center justify-center rounded-full text-ink shadow-xl shadow-black/10 transition-colors hover:bg-white"
    >
      {children}
    </motion.button>
  );
}

export function Hero3D() {
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<View>("overview");
  const [autoRotate, setAutoRotate] = useState(true);
  const [zoom, setZoom] = useState<{ id: number; dir: 1 | -1 }>({ id: 0, dir: 1 });
  const [selected, setSelected] = useState<string | null>(null);
  const [immersive, setImmersive] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);

  const project = selected ? (getProject(selected) ?? null) : null;

  const enterImmersive = useCallback(() => {
    setImmersive(true);
    setShowHint(true);
    // iPhone Safari has no element fullscreen; the fixed overlay covers the viewport instead.
    stageRef.current?.requestFullscreen?.({ navigationUI: "hide" }).catch(() => {});
  }, []);

  const exitImmersive = useCallback(() => {
    setImmersive(false);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }, []);

  useEffect(() => {
    const onChange = () => {
      if (!document.fullscreenElement) setImmersive(false);
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    if (!immersive) return;
    const root = document.documentElement;
    const prevOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = prevOverflow;
    };
  }, [immersive]);

  useEffect(() => {
    if (!showHint) return;
    const t = setTimeout(() => setShowHint(false), 4000);
    return () => clearTimeout(t);
  }, [showHint]);

  const onAction = useCallback(
    (action: ScreenAction) => {
      switch (action.type) {
        case "project":
          setView("focus");
          setSelected(action.slug);
          break;
        case "focus":
        case "cta":
          setView("focus");
          break;
        case "nav":
          exitImmersive();
          if (window.location.hash === `#${action.target}`) {
            window.dispatchEvent(new HashChangeEvent("hashchange"));
            document.getElementById(action.target)?.scrollIntoView({ behavior: "smooth" });
          } else {
            window.location.hash = action.target;
          }
          break;
      }
    },
    [exitImmersive],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || selected) return;
      if (immersive) exitImmersive();
      else setView("overview");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, immersive, exitImmersive]);

  return (
    <section className="relative h-[88svh] min-h-[420px] md:h-[100svh] w-full" aria-label="Interactive 3D workspace">
      <div
        ref={stageRef}
        className={`hero-bg overflow-hidden ${immersive ? "fixed inset-0 z-[55]" : "absolute inset-0"}`}
      >
        <div className="absolute inset-0 cursor-grab active:cursor-grabbing">
          <Scene
            projects={projects}
            view={view}
            autoRotate={autoRotate && !immersive}
            zoom={zoom}
            immersive={immersive}
            resetKey={resetKey}
            onAction={onAction}
            onReady={() => setReady(true)}
          />
        </div>

        <AnimatePresence>
          {!ready && (
            <motion.div
              key="loader"
              className="hero-bg absolute inset-0 z-20 flex flex-col items-center justify-center gap-4"
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                className="h-12 w-12 rounded-2xl bg-accent"
                animate={{ rotate: [0, 90, 180, 270, 360], borderRadius: ["30%", "50%", "30%"] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              />
              <p className="text-sm font-medium text-muted">Setting up the workspace…</p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {ready && view === "overview" && !immersive && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.7, ease, delay: 0.6 }}
              className="pointer-events-none absolute left-4 top-20 z-10 max-w-[19rem] sm:left-8 md:inset-y-0 md:top-0 md:flex md:items-center lg:left-12 lg:max-w-sm"
            >
              <div className="glass glass-light pointer-events-auto rounded-3xl p-4 shadow-xl shadow-black/5 sm:p-5 lg:p-6">
                <p className="text-sm font-medium text-muted">Hey, I&apos;m</p>
                <h1 className="mt-1 text-2xl text-ink font-extrabold tracking-tight sm:text-3xl lg:text-4xl">{profile.name}</h1>
                <p className="mt-1 font-medium text-ink/70">{profile.role}</p>
                <p className="mt-3 hidden text-sm leading-relaxed text-ink/70 [@media(min-height:640px)]:sm:block">
                  {profile.intro}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => setView("focus")}
                    className="rounded-full bg-accent px-4 py-2 text-sm font-semibold shadow-md shadow-accent/30 transition hover:bg-accent-strong lg:px-5 lg:py-2.5"
                  >
                    View Projects →
                  </button>
                  <a
                    href="#work"
                    className="rounded-full border border-ink/15 bg-white/60 px-4 py-2 text-sm font-semibold transition hover:bg-white lg:px-5 lg:py-2.5"
                  >
                    Browse all work
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {ready && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease, delay: 0.9 }}
            className={`absolute inset-x-0 bottom-5 z-10 flex flex-col items-center gap-3 px-4 ${immersive ? "invisible" : ""}`}
          >
            <div className="glass flex items-center gap-1 rounded-2xl p-1.5 shadow-xl shadow-black/10">
              <DockButton label="Overview" active={view === "overview"} onClick={() => setView("overview")}>
                <span aria-hidden>◎</span>
                <span className="hidden sm:inline">Overview</span>
              </DockButton>
              <DockButton label="Focus screen" active={view === "focus"} onClick={() => setView("focus")}>
                <span aria-hidden>▣</span>
                <span className="hidden sm:inline">Projects</span>
              </DockButton>
              <span className="mx-1 h-6 w-px bg-ink/10" />
              <DockButton label="Zoom out" onClick={() => setZoom((z) => ({ id: z.id + 1, dir: -1 }))}>
                −
              </DockButton>
              <DockButton label="Zoom in" onClick={() => setZoom((z) => ({ id: z.id + 1, dir: 1 }))}>
                +
              </DockButton>
              <span className="mx-1 h-6 w-px bg-ink/10" />
              <DockButton label="Auto-rotate" active={autoRotate} onClick={() => setAutoRotate((a) => !a)}>
                <motion.span
                  aria-hidden
                  animate={autoRotate ? { rotate: 360 } : { rotate: 0 }}
                  transition={autoRotate ? { duration: 4, repeat: Infinity, ease: "linear" } : { duration: 0.3 }}
                >
                  ⟳
                </motion.span>
                <span className="hidden sm:inline">360°</span>
              </DockButton>
              <DockButton label="Full view" onClick={enterImmersive}>
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
                </svg>
                <span className="hidden sm:inline">Full view</span>
              </DockButton>
            </div>
            <AnimatePresence mode="wait">
              <motion.p
                key={view}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="text-center text-xs font-medium text-ink/55"
              >
                {view === "focus" ? (
                  <>
                    Click any project on the monitor · <kbd className="font-mono">Esc</kbd> to step back
                  </>
                ) : (
                  <>
                    <span className="pointer-coarse:hidden">
                      Drag to look around 360° · Scroll to zoom · Click the monitor to explore
                    </span>
                    <span className="hidden pointer-coarse:inline">
                      Drag to look around · Pinch to zoom · Tap the monitor
                    </span>
                  </>
                )}
              </motion.p>
            </AnimatePresence>
          </motion.div>
        )}

        <AnimatePresence>
          {immersive && (
            <motion.div
              key="immersive-controls"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease }}
              className="absolute right-[max(1rem,env(safe-area-inset-right))] top-[max(1rem,env(safe-area-inset-top))] z-10 flex gap-2"
            >
              <OverlayButton label="Reset view" onClick={() => setResetKey((k) => k + 1)}>
                <span aria-hidden className="text-lg leading-none">
                  ⟲
                </span>
              </OverlayButton>
              <OverlayButton label="Exit full view" onClick={exitImmersive}>
                <span aria-hidden className="text-2xl leading-none">
                  ×
                </span>
              </OverlayButton>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {immersive && showHint && (
            <motion.p
              key="immersive-hint"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.4, ease }}
              className="glass pointer-events-none absolute bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium text-ink/70 shadow-lg shadow-black/5"
            >
              <span className="pointer-coarse:hidden">Scroll to zoom · Drag to rotate · Right-drag to pan</span>
              <span className="hidden pointer-coarse:inline">Pinch to zoom · Drag to rotate · Two fingers to pan</span>
            </motion.p>
          )}
        </AnimatePresence>

        {!immersive && (
          <a
            href="#work"
            aria-label="Scroll to projects"
            className="absolute bottom-6 right-6 z-10 hidden h-11 w-11 items-center justify-center rounded-full border border-ink/10 bg-white/60 backdrop-blur transition hover:bg-white lg:flex"
          >
            <motion.span animate={{ y: [0, 4, 0] }} transition={{ duration: 1.6, repeat: Infinity }}>
              ↓
            </motion.span>
          </a>
        )}

        <ProjectModal project={project} onClose={() => setSelected(null)} />
      </div>
    </section>
  );
}

"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
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

export function Hero3D() {
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<View>("overview");
  const [autoRotate, setAutoRotate] = useState(true);
  const [zoom, setZoom] = useState<{ id: number; dir: 1 | -1 }>({ id: 0, dir: 1 });
  const [selected, setSelected] = useState<string | null>(null);

  const project = selected ? (getProject(selected) ?? null) : null;

  const onAction = useCallback((action: ScreenAction) => {
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
        if (window.location.hash === `#${action.target}`) {
          window.dispatchEvent(new HashChangeEvent("hashchange"));
          document.getElementById(action.target)?.scrollIntoView({ behavior: "smooth" });
        } else {
          window.location.hash = action.target;
        }
        break;
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !selected) setView("overview");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  return (
    <section className="hero-bg relative h-[88svh] min-h-[420px] md:h-[100svh] w-full overflow-hidden" aria-label="Interactive 3D workspace">
      <div className="absolute inset-0 cursor-grab active:cursor-grabbing">
        <Scene
          projects={projects}
          view={view}
          autoRotate={autoRotate}
          zoom={zoom}
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
        {ready && view === "overview" && (
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
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">{profile.name}</h1>
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
          className="absolute inset-x-0 bottom-5 z-10 flex flex-col items-center gap-3 px-4"
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
                "Drag to look around 360° · Click the monitor to explore"
              )}
            </motion.p>
          </AnimatePresence>
        </motion.div>
      )}

      <a
        href="#work"
        aria-label="Scroll to projects"
        className="absolute bottom-6 right-6 z-10 hidden h-11 w-11 items-center justify-center rounded-full border border-ink/10 bg-white/60 backdrop-blur transition hover:bg-white lg:flex"
      >
        <motion.span animate={{ y: [0, 4, 0] }} transition={{ duration: 1.6, repeat: Infinity }}>
          ↓
        </motion.span>
      </a>

      <ProjectModal project={project} onClose={() => setSelected(null)} />
    </section>
  );
}

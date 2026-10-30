"use client";

import { TiltCard } from "@/components/ui/TiltCard";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { categoryLabels, projects, type ProjectCategory } from "@/data/portfolio";
import { ProjectThumb } from "@/components/ui/ProjectThumb";
import { Reveal } from "@/components/ui/Reveal";

type Filter = "all" | ProjectCategory;

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "app", label: "Apps" },
  { id: "website", label: "Websites" },
  { id: "game", label: "Games" },
];

const HASH_TO_FILTER: Record<string, Filter> = {
  "#work": "all",
  "#apps": "app",
  "#websites": "website",
  "#games": "game",
};

export function ProjectsSection({ title = "Selected work" }: { title?: string }) {
  const [filter, setFilter] = useState<Filter>("all");
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const sync = () => {
      const f = HASH_TO_FILTER[window.location.hash];
      if (!f) return;
      setFilter(f);
      sectionRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const visible = projects.filter((p) => filter === "all" || p.category === filter);

  return (
    <section ref={sectionRef} id="work" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-24 sm:px-6">
      <Reveal className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-accent-strong">Projects</p>
          <h2 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl">{title}</h2>
          <p className="mt-3 max-w-lg text-muted">
            Apps, websites and experiments I&apos;ve designed and built. Each one is also on the monitor in the 3D
            workspace above.
          </p>
        </div>
        <div className="flex gap-1 self-start rounded-full bg-sand p-1 md:self-auto">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className="relative rounded-full px-4 py-2 text-sm font-medium"
            >
              {filter === f.id && (
                <motion.span
                  layoutId="filter-pill"
                  className="absolute inset-0 rounded-full bg-white shadow"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative">{f.label}</span>
            </button>
          ))}
        </div>
      </Reveal>

      <motion.div layout className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {visible.map((p, i) => (
            <motion.div
              key={p.slug}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.45, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link href={`/projects/${p.slug}`} className="group block">
                <TiltCard className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5 transition-shadow duration-300 group-hover:shadow-[0_24px_60px_-20px_rgba(245,180,0,0.45)] group-hover:ring-accent/40">
                  <div className="overflow-hidden">
                    <ProjectThumb
                      project={p}
                      className="aspect-[4/3] transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    />
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted">
                      <span>{categoryLabels[p.category]}</span>
                      <span>{p.year}</span>
                    </div>
                    <h3 className="mt-2 text-xl font-bold">{p.title}</h3>
                    <p className="mt-1 text-sm text-muted">{p.tagline}</p>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold">
                      View case study
                      <span className="transition-transform group-hover:translate-x-1">→</span>
                    </span>
                  </div>
                </TiltCard>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { categoryLabels, type Project } from "@/data/portfolio";
import { ProjectThumb } from "./ProjectThumb";

export function ProjectModal({ project, onClose }: { project: Project | null; onClose: () => void }) {
  useEffect(() => {
    if (!project) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [project, onClose]);

  return (
    <AnimatePresence>
      {project && (
        <motion.div
          key="backdrop"
          className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/30 p-3 backdrop-blur-sm sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.article
            key={project.slug}
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-modal-title"
            className="relative flex max-h-[calc(100svh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl sm:max-h-[calc(100svh-3rem)]"
            initial={{ y: 40, scale: 0.96, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 30, scale: 0.97, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
          >
            <ProjectThumb
              project={project}
              className="h-40 shrink-0 sm:h-56 [@media(max-height:640px)]:h-28"
            />
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-lg shadow transition hover:scale-110"
            >
              ×
            </button>

            <div className="min-h-0 flex-1 overflow-y-auto p-6 sm:p-8">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
                <span>{categoryLabels[project.category]}</span>
                <span>•</span>
                <span>{project.year}</span>
              </div>
              <h2 id="project-modal-title" className="text-2xl font-bold sm:text-3xl">
                {project.title}
              </h2>
              <p className="mt-1 text-muted">{project.tagline}</p>
              <p className="mt-4 leading-relaxed text-ink/80">{project.description}</p>

              <ul className="mt-5 space-y-2">
                {project.highlights.map((h) => (
                  <li key={h} className="flex gap-3 text-sm text-ink/80">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: project.theme.accent }} />
                    {h}
                  </li>
                ))}
              </ul>

              <div className="mt-5 flex flex-wrap gap-2">
                {project.stack.map((s) => (
                  <span key={s} className="rounded-full bg-sand px-3 py-1 text-xs font-medium">
                    {s}
                  </span>
                ))}
              </div>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href={`/projects/${project.slug}`}
                  className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold transition hover:bg-accent-strong"
                >
                  View case study →
                </Link>
                {project.liveUrl && (
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-ink/15 px-5 py-2.5 text-sm font-semibold transition hover:bg-sand"
                  >
                    Live demo
                  </a>
                )}
                {project.sourceUrl && (
                  <a
                    href={project.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-ink/15 px-5 py-2.5 text-sm font-semibold transition hover:bg-sand"
                  >
                    Source
                  </a>
                )}
              </div>
            </div>
          </motion.article>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

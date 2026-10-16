import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { categoryLabels, getProject, projects } from "@/data/portfolio";
import { ProjectThumb } from "@/components/ui/ProjectThumb";
import { Reveal } from "@/components/ui/Reveal";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  return {
    title: project.title,
    description: `${project.tagline}. ${project.description}`,
    openGraph: { title: project.title, description: project.description },
  };
}

export default function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  return (
    <main className="mx-auto max-w-5xl px-4 pb-24 pt-28 sm:px-6">
      <Suspense fallback={<ProjectSkeleton />}>
        <ProjectContent params={params} />
      </Suspense>
    </main>
  );
}

function ProjectSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 w-28 rounded bg-sand" />
      <div className="mt-8 h-14 w-2/3 rounded-xl bg-sand" />
      <div className="mt-4 h-6 w-1/3 rounded bg-sand" />
      <div className="mt-10 aspect-[16/9] rounded-[2rem] bg-sand" />
    </div>
  );
}

async function ProjectContent({ params }: { params: PageProps<"/projects/[slug]">["params"] }) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const index = projects.findIndex((p) => p.slug === slug);
  const next = projects[(index + 1) % projects.length];

  return (
    <>
      <Reveal>
        <Link href="/#work" className="text-sm font-medium text-muted transition hover:text-ink">
          ← All projects
        </Link>
        <div className="mt-6 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
          <span>{categoryLabels[project.category]}</span>
          <span>•</span>
          <span>{project.year}</span>
          <span>•</span>
          <span>{project.role}</span>
        </div>
        <h1 className="mt-3 text-5xl font-extrabold tracking-tight sm:text-6xl">{project.title}</h1>
        <p className="mt-3 text-xl text-muted">{project.tagline}</p>
      </Reveal>

      <Reveal delay={0.1}>
        <ProjectThumb project={project} className="mt-10 aspect-[16/9] rounded-[2rem] shadow-xl shadow-black/5" />
      </Reveal>

      <div className="mt-14 grid gap-12 md:grid-cols-[1.4fr_1fr]">
        <Reveal>
          <h2 className="text-2xl font-bold">Overview</h2>
          <p className="mt-4 text-lg leading-relaxed text-ink/75">{project.description}</p>
          <h2 className="mt-10 text-2xl font-bold">Highlights</h2>
          <ul className="mt-4 space-y-3">
            {project.highlights.map((h) => (
              <li key={h} className="flex gap-3 text-ink/80">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full" style={{ background: project.theme.accent }} />
                {h}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.1}>
          <aside className="rounded-3xl bg-white p-6 ring-1 ring-black/5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Tech stack</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {project.stack.map((s) => (
                <li key={s} className="rounded-full bg-sand px-3 py-1 text-sm font-medium">
                  {s}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-col gap-3">
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-accent px-5 py-3 text-center text-sm font-semibold transition hover:bg-accent-strong"
                >
                  Visit live site ↗
                </a>
              )}
              {project.sourceUrl && (
                <a
                  href={project.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-ink/15 px-5 py-3 text-center text-sm font-semibold transition hover:bg-sand"
                >
                  View source
                </a>
              )}
            </div>
          </aside>
        </Reveal>
      </div>

      <Reveal>
        <Link
          href={`/projects/${next.slug}`}
          className="group mt-20 flex items-center justify-between rounded-3xl bg-ink p-8 text-cream transition hover:bg-black"
        >
          <div>
            <p className="text-sm text-cream/60">Next project</p>
            <p className="mt-1 text-2xl font-bold">{next.title}</p>
          </div>
          <span className="text-2xl transition-transform group-hover:translate-x-2">→</span>
        </Link>
      </Reveal>
    </>
  );
}

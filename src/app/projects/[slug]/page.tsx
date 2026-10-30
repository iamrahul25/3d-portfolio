import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { categoryLabels, getProject, projects } from "@/data/portfolio";
import { ProjectThumb } from "@/components/ui/ProjectThumb";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/Reveal";

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
        <ProjectThumb project={project} className="mt-10 aspect-[16/9] rounded-[2rem] shadow-xl shadow-black/5 ring-1 ring-black/5" />
      </Reveal>

      <div className="mt-14 grid gap-12 md:grid-cols-[1.4fr_1fr]">
        <Reveal>
          <h2 className="text-2xl font-bold">Overview</h2>
          <p className="mt-4 text-lg leading-relaxed text-ink/75">{project.description}</p>
          <h2 className="mt-10 text-2xl font-bold">Highlights</h2>
          <Stagger as="ul" className="mt-4 space-y-3" stagger={0.08}>
            {project.highlights.map((h) => (
              <StaggerItem as="li" key={h} className="flex gap-3 text-ink/80">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full" style={{ background: project.theme.accent }} />
                {h}
              </StaggerItem>
            ))}
          </Stagger>
        </Reveal>

        <Reveal delay={0.1}>
          <aside className="skill-card rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Tech stack</h2>
            <Stagger as="ul" className="mt-4 flex flex-wrap gap-2" stagger={0.04}>
              {project.stack.map((s) => (
                <StaggerItem as="li" key={s} className="chip rounded-full bg-sand px-3 py-1 text-sm font-medium">
                  {s}
                </StaggerItem>
              ))}
            </Stagger>
            <div className="mt-6 flex flex-col gap-3">
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-accent px-5 py-3 text-center text-sm font-semibold shadow-md shadow-accent/30 transition hover:-translate-y-0.5 hover:bg-accent-strong"
                >
                  Visit live site ↗
                </a>
              )}
              {project.sourceUrl && (
                <a
                  href={project.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-ink/15 px-5 py-3 text-center text-sm font-semibold transition hover:-translate-y-0.5 hover:bg-sand"
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
          className="contact-card group mt-20 flex items-center justify-between rounded-3xl p-8 transition hover:-translate-y-1 hover:shadow-2xl"
        >
          <div>
            <p className="text-sm opacity-60">Next project</p>
            <p className="mt-1 text-2xl font-bold">{next.title}</p>
          </div>
          <span className="text-2xl transition-transform group-hover:translate-x-2">→</span>
        </Link>
      </Reveal>
    </>
  );
}

import { profile } from "@/data/portfolio";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/Reveal";

export function ContactSection() {
  return (
    <section id="contact" className="scroll-mt-24 px-4 py-24 sm:px-6">
      <Reveal className="contact-card relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] px-6 py-16 text-center sm:px-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-accent/25 blur-3xl"
        />
        <Stagger className="relative" stagger={0.1}>
          <StaggerItem>
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">Contact</p>
          </StaggerItem>
          <StaggerItem>
            <h2 className="mx-auto mt-3 max-w-2xl text-4xl font-extrabold tracking-tight sm:text-5xl">
              Have a project in mind? Let&apos;s build it together.
            </h2>
          </StaggerItem>
          <StaggerItem>
            <a
              href={`mailto:${profile.email}`}
              className="on-accent mt-8 inline-block rounded-full bg-accent px-7 py-3.5 font-semibold shadow-lg shadow-accent/30 transition hover:scale-105 hover:bg-accent-strong"
            >
              {profile.email}
            </a>
          </StaggerItem>
          <StaggerItem>
            <ul className="contact-links mt-10 flex flex-wrap justify-center gap-6 text-sm">
              {profile.socials.map((s) => (
                <li key={s.label}>
                  <a href={s.href} target="_blank" rel="noreferrer" className="transition hover:text-accent">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </StaggerItem>
        </Stagger>
      </Reveal>
      <footer className="mx-auto mt-12 flex max-w-6xl flex-col items-center justify-between gap-2 text-sm text-muted sm:flex-row">
        <span>© {profile.name}. Built with Next.js, React Three Fiber & Motion.</span>
        <a href="#" className="hover:text-ink">
          Back to top ↑
        </a>
      </footer>
    </section>
  );
}

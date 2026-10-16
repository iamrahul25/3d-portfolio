import { profile } from "@/data/portfolio";
import { Reveal } from "@/components/ui/Reveal";

export function AboutSection() {
  return (
    <section id="about" className="scroll-mt-24 bg-white/60 py-24">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[1.1fr_1fr]">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-widest text-accent-strong">About</p>
          <h2 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl">
            Building things people love to use.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-ink/75">{profile.about}</p>
          <ul className="mt-8 flex flex-wrap gap-3">
            {profile.pillars.map((p) => (
              <li key={p} className="rounded-full border border-ink/10 bg-cream px-4 py-2 text-sm font-medium">
                {p}
              </li>
            ))}
          </ul>
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-2">
          {profile.skills.map((s, i) => (
            <Reveal key={s.group} delay={i * 0.08}>
              <div className="h-full rounded-3xl bg-cream p-6 ring-1 ring-black/5">
                <h3 className="font-bold">{s.group}</h3>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {s.items.map((item) => (
                    <li key={item} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-ink/80">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

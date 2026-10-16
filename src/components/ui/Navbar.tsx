"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { profile } from "@/data/portfolio";

const LINKS = [
  { label: "Work", href: "/#work" },
  { label: "Apps", href: "/#apps" },
  { label: "Websites", href: "/#websites" },
  { label: "About", href: "/#about" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
      className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6"
    >
      <nav
        data-scrolled={scrolled}
        className="glass-nav mx-auto flex max-w-6xl items-center justify-between rounded-2xl px-4 py-3 sm:px-6"
      >
        <Link href="/" className="text-xl font-extrabold tracking-tight">
          {profile.initials}
        </Link>

        <ul className="hidden items-center gap-8 text-sm font-medium text-ink/70 md:flex">
          {LINKS.map((l) => (
            <li key={l.label}>
              <Link href={l.href} className="group relative transition-colors hover:text-ink">
                {l.label}
                <span className="absolute -bottom-1 left-0 h-0.5 w-0 rounded bg-accent transition-all duration-300 group-hover:w-full" />
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/#contact"
              className="rounded-full bg-ink px-4 py-2 text-cream transition-transform hover:scale-105"
            >
              Contact
            </Link>
          </li>
        </ul>

        <button
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-xl bg-white/50 md:hidden"
        >
          <motion.span animate={open ? { rotate: 45, y: 4 } : { rotate: 0, y: 0 }} className="h-0.5 w-5 bg-ink" />
          <motion.span animate={open ? { rotate: -45, y: -4 } : { rotate: 0, y: 0 }} className="h-0.5 w-5 bg-ink" />
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            data-scrolled="true"
            className="glass-nav mx-auto mt-2 flex max-w-6xl flex-col gap-1 rounded-2xl p-3 md:hidden"
          >
            {[...LINKS, { label: "Contact", href: "/#contact" }].map((l) => (
              <li key={l.label}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-4 py-3 font-medium hover:bg-white/70"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

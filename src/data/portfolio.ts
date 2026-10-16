export type ProjectCategory = "app" | "website" | "game";

export type ProjectVisual = "phone" | "dots" | "fashion" | "marketplace" | "dashboard" | "browser";

export type Project = {
  slug: string;
  title: string;
  tagline: string;
  category: ProjectCategory;
  year: string;
  role: string;
  description: string;
  highlights: string[];
  stack: string[];
  liveUrl?: string;
  sourceUrl?: string;
  visual: ProjectVisual;
  theme: {
    bg: string;
    accent: string;
    dark: boolean;
  };
};

export const profile = {
  name: "Rahul Kumar",
  initials: "RK.",
  role: "Software Developer",
  intro: "I build web apps, mobile apps and digital products.",
  pillars: ["Build", "Learn", "Solve Problems", "Create Products"],
  location: "India",
  email: "hello@rahulkumar.dev",
  socials: [
    { label: "GitHub", href: "https://github.com/" },
    { label: "LinkedIn", href: "https://www.linkedin.com/" },
    { label: "X / Twitter", href: "https://x.com/" },
  ],
  about:
    "I'm a software developer who loves turning ideas into polished, useful products. I work across the stack — from pixel-perfect interfaces and smooth animations to APIs, databases and infrastructure — and I care about performance, accessibility and the small details that make software feel great.",
  skills: [
    { group: "Frontend", items: ["TypeScript", "React", "Next.js", "Tailwind CSS", "Three.js", "Motion"] },
    { group: "Mobile", items: ["React Native", "Expo", "Flutter"] },
    { group: "Backend", items: ["Node.js", "PostgreSQL", "Prisma", "Redis", "REST & GraphQL"] },
    { group: "DevOps", items: ["Docker", "Vercel", "AWS", "Grafana", "CI/CD"] },
  ],
} as const;

export const projects: Project[] = [
  {
    slug: "habitcare",
    title: "Habitcare",
    tagline: "Habit tracking app",
    category: "app",
    year: "2025",
    role: "Design & Development",
    description:
      "A calm, friendly habit tracker that helps people build routines that stick. Streaks, reminders and weekly insights keep motivation high without the guilt.",
    highlights: [
      "Streaks, flexible schedules and smart reminders",
      "Offline-first sync with conflict resolution",
      "Weekly insight reports with beautiful charts",
    ],
    stack: ["React Native", "Expo", "TypeScript", "SQLite", "Supabase"],
    liveUrl: "#",
    sourceUrl: "#",
    visual: "phone",
    theme: { bg: "#d8f3e3", accent: "#16a34a", dark: false },
  },
  {
    slug: "connect-the-dots",
    title: "Connect the Dots",
    tagline: "Puzzle game",
    category: "game",
    year: "2025",
    role: "Game Design & Development",
    description:
      "A minimalist puzzle game where you link matching colored dots without crossing paths. Hundreds of hand-tuned levels with a daily challenge mode.",
    highlights: [
      "Procedural level generator with difficulty tuning",
      "Buttery 60fps touch interactions",
      "Daily challenges and global leaderboards",
    ],
    stack: ["TypeScript", "Canvas API", "React", "Firebase"],
    liveUrl: "#",
    sourceUrl: "#",
    visual: "dots",
    theme: { bg: "#e6defe", accent: "#7c3aed", dark: false },
  },
  {
    slug: "fridayfits",
    title: "FridayFits",
    tagline: "Women's fashion store",
    category: "website",
    year: "2024",
    role: "Full-stack Development",
    description:
      "A modern e-commerce storefront for a women's fashion label, featuring curated lookbooks, fast search and a frictionless checkout.",
    highlights: [
      "Headless commerce with instant search",
      "Lookbook pages with editorial layouts",
      "Lighthouse 98+ performance score",
    ],
    stack: ["Next.js", "Tailwind CSS", "Shopify Storefront API", "Stripe"],
    liveUrl: "#",
    sourceUrl: "#",
    visual: "fashion",
    theme: { bg: "#ffe0ea", accent: "#db2777", dark: false },
  },
  {
    slug: "sell-it",
    title: "Sell-it",
    tagline: "Marketplace with bidding",
    category: "website",
    year: "2024",
    role: "Full-stack Development",
    description:
      "A peer-to-peer marketplace with live auctions. Sellers list items in seconds and buyers place real-time bids with instant notifications.",
    highlights: [
      "Real-time bidding over WebSockets",
      "Image uploads with automatic optimisation",
      "Escrow-style payments and seller ratings",
    ],
    stack: ["Next.js", "Node.js", "PostgreSQL", "Socket.IO", "Redis"],
    liveUrl: "#",
    sourceUrl: "#",
    visual: "marketplace",
    theme: { bg: "#fde8d2", accent: "#ea580c", dark: false },
  },
  {
    slug: "monitoring-dashboard",
    title: "Monitoring Dashboard",
    tagline: "Real-time infrastructure metrics",
    category: "website",
    year: "2023",
    role: "Frontend & Data Viz",
    description:
      "A real-time observability dashboard that streams infrastructure metrics, surfaces anomalies and lets teams drill from fleet overview down to a single container.",
    highlights: [
      "Streaming charts rendering 100k+ points",
      "Anomaly detection with alert routing",
      "Customisable, shareable dashboards",
    ],
    stack: ["React", "TypeScript", "D3", "Go", "Prometheus"],
    liveUrl: "#",
    sourceUrl: "#",
    visual: "dashboard",
    theme: { bg: "#3730a3", accent: "#a5b4fc", dark: true },
  },
  {
    slug: "3d-portfolio",
    title: "3D Portfolio",
    tagline: "This interactive workspace",
    category: "website",
    year: "2026",
    role: "Design & Development",
    description:
      "The site you're looking at — a fully interactive 3D developer workspace built with React Three Fiber, where every project lives on the monitor.",
    highlights: [
      "Hand-modelled procedural 3D scene",
      "Clickable canvas-rendered monitor UI",
      "Smooth camera transitions and 360° orbit",
    ],
    stack: ["Next.js", "Three.js", "React Three Fiber", "Drei", "Motion"],
    liveUrl: "#",
    sourceUrl: "#",
    visual: "browser",
    theme: { bg: "#fef3c7", accent: "#d97706", dark: false },
  },
];

export const categoryLabels: Record<ProjectCategory, string> = {
  app: "Apps",
  website: "Websites",
  game: "Games",
};

export function getProject(slug: string) {
  return projects.find((p) => p.slug === slug);
}

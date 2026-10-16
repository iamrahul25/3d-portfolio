import type { MetadataRoute } from "next";
import { projects } from "@/data/portfolio";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, priority: 1 },
    { url: `${siteUrl}/projects`, priority: 0.8 },
    ...projects.map((p) => ({ url: `${siteUrl}/projects/${p.slug}`, priority: 0.7 })),
  ];
}

import type { Metadata } from "next";
import { ProjectsSection } from "@/components/sections/ProjectsSection";

export const metadata: Metadata = {
  title: "Projects",
  description: "Apps, websites and games I've designed and built.",
};

export default function ProjectsPage() {
  return (
    <main className="pt-12">
      <ProjectsSection
        title="All projects"
        subtitle="Every app, website and game I've designed and built. Filter by type, or open one for the full case study."
      />
    </main>
  );
}

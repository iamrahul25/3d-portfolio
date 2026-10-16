import type { Metadata } from "next";
import { ProjectsSection } from "@/components/sections/ProjectsSection";

export const metadata: Metadata = {
  title: "Projects",
  description: "Apps, websites and games I've designed and built.",
};

export default function ProjectsPage() {
  return (
    <main className="pt-12">
      <ProjectsSection title="All projects" />
    </main>
  );
}

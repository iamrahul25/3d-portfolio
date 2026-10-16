import { Hero3D } from "@/components/hero/Hero3D";
import { ProjectsSection } from "@/components/sections/ProjectsSection";
import { AboutSection } from "@/components/sections/AboutSection";
import { ContactSection } from "@/components/sections/ContactSection";

export default function Home() {
  return (
    <main>
      <Hero3D />
      <ProjectsSection />
      <AboutSection />
      <ContactSection />
    </main>
  );
}

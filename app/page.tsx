import { PortfolioHeader } from "@/components/portfolio-header"
import { HeroSection } from "@/components/hero-section"
import { ProjectsSection } from "@/components/projects-section"
import { getProjects } from "@/lib/actions/projects"

export default async function HomePage() {
  let projects = []

  try {
    projects = await getProjects()
  } catch (error) {
    // Table might not exist yet - will show empty state
    console.error("Failed to fetch projects:", error)
  }

  return (
    <div className="min-h-screen bg-background">
      <PortfolioHeader />
      <main>
        <HeroSection />
        <ProjectsSection initialProjects={projects || []} />
      </main>
      <footer className="border-t border-border px-6 py-8">
        <div className="mx-auto max-w-7xl text-center text-sm text-muted-foreground">
          <p>Built with passion for making things</p>
        </div>
      </footer>
    </div>
  )
}

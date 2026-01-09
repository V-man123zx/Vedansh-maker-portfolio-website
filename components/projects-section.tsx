"use client"

import { useState, useMemo } from "react"
import { CategoryTabs } from "./category-tabs"
import { ProjectCard } from "./project-card"
import { AddProjectDialog } from "./add-project-dialog"
import { FolderOpen } from "lucide-react"
import type { Project } from "@/types/project"

interface ProjectsSectionProps {
  initialProjects: Project[]
}

export function ProjectsSection({ initialProjects }: ProjectsSectionProps) {
  const [activeCategory, setActiveCategory] = useState("all")

  const categories = useMemo(() => {
    const cats = [...new Set(initialProjects.map((p) => p.category))]
    return cats.sort()
  }, [initialProjects])

  const filteredProjects = useMemo(() => {
    if (activeCategory === "all") return initialProjects
    return initialProjects.filter((p) => p.category === activeCategory)
  }, [initialProjects, activeCategory])

  return (
    <section className="px-6 py-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Projects</h2>
            <p className="text-muted-foreground">
              {initialProjects.length} project
              {initialProjects.length !== 1 ? "s" : ""} in total
            </p>
          </div>
          <AddProjectDialog />
        </div>

        {categories.length > 0 && (
          <div className="mb-8">
            <CategoryTabs
              categories={categories}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />
          </div>
        )}

        {filteredProjects.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
            <FolderOpen className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-medium text-foreground">No projects yet</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              {activeCategory === "all"
                ? "Add your first project to get started"
                : `No projects in ${activeCategory} category`}
            </p>
            {activeCategory !== "all" && (
              <button onClick={() => setActiveCategory("all")} className="text-sm text-primary hover:underline">
                View all projects
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
